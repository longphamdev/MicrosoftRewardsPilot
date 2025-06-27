import playwright, { BrowserContext } from 'rebrowser-playwright'

import { newInjectedContext } from 'fingerprint-injector'
import { FingerprintGenerator } from 'fingerprint-generator'

import { MicrosoftRewardsBot } from '../index'
import { loadSessionData, saveFingerprintData } from '../util/Load'
import { updateFingerprintUserAgent } from '../util/UserAgent'
import { GeoLanguageDetector, GeoLocation } from '../util/GeoLanguage'

import { AccountProxy } from '../interface/Account'

/* Test Stuff
https://abrahamjuliot.github.io/creepjs/
https://botcheck.luminati.io/
https://fv.pro/
https://pixelscan.net/
https://www.browserscan.net/
*/

class Browser {
    private bot: MicrosoftRewardsBot

    constructor(bot: MicrosoftRewardsBot) {
        this.bot = bot
    }

    /**
     * 根据地理位置获取浏览器配置
     */
    private async getGeoLocationConfig(): Promise<{
        locale: string
        timezoneId: string
        geolocation: { latitude: number; longitude: number }
        extraHTTPHeaders: Record<string, string>
    }> {
        try {
            // 获取地理位置信息（包含真实的IP定位经纬度）
            const location: GeoLocation = await GeoLanguageDetector.getCurrentLocation()
            
            // 根据国家代码获取语言设置
            const localeMap: Record<string, string> = {
                'JP': 'ja-JP',
                'CN': 'zh-CN', 
                'TW': 'zh-TW',
                'HK': 'zh-HK',
                'KR': 'ko-KR',
                'VN': 'vi-VN',
                'TH': 'th-TH',
                'US': 'en-US',
                'GB': 'en-GB',
                'AU': 'en-AU',
                'CA': 'en-CA',
                'DE': 'de-DE',
                'FR': 'fr-FR',
                'ES': 'es-ES',
                'IT': 'it-IT',
                'BR': 'pt-BR',
                'RU': 'ru-RU',
                'IN': 'hi-IN',
                'ID': 'id-ID',
                'MY': 'ms-MY',
                'PH': 'en-PH',
                'SG': 'en-SG'
            }

            const locale = localeMap[location.countryCode] || 'en-US'
            
            // 使用真实的IP定位经纬度
            const coordinates = {
                latitude: location.latitude,
                longitude: location.longitude
            }

            // 根据语言设置HTTP头部
            const acceptLanguage = this.getAcceptLanguageHeader(location.language, locale)
            
            this.bot.log(this.bot.isMobile, 'BROWSER-GEO', 
                `Auto-detected location: ${location.country} (${location.countryCode}) | ` +
                `Language: ${location.language} | Locale: ${locale} | ` +
                `Timezone: ${location.timezone} | Real coordinates: ${coordinates.latitude}, ${coordinates.longitude} | ` +
                `City: ${location.city}`)

            return {
                locale,
                timezoneId: location.timezone,
                geolocation: coordinates,
                extraHTTPHeaders: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': acceptLanguage,
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Upgrade-Insecure-Requests': '1',
                    ...(this.bot.isMobile && {
                        'sec-ch-ua-mobile': '?1',
                        'sec-ch-ua-platform': '"Android"'
                    })
                }
            }
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'BROWSER-GEO', 
                `Failed to detect location, using default (Japan): ${error}`, 'warn')
            
            // 如果地理位置检测失败，返回默认的日本配置
            return {
                locale: 'ja-JP',
                timezoneId: 'Asia/Tokyo',
                geolocation: { latitude: 35.6762, longitude: 139.6503 },
                extraHTTPHeaders: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'Upgrade-Insecure-Requests': '1',
                    ...(this.bot.isMobile && {
                        'sec-ch-ua-mobile': '?1',
                        'sec-ch-ua-platform': '"Android"'
                    })
                }
            }
        }
    }

    /**
     * 根据语言生成Accept-Language头部
     */
    private getAcceptLanguageHeader(language: string, locale: string): string {
        const languageHeaders: Record<string, string> = {
            'ja': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
            'zh-CN': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'zh-TW': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'zh-HK': 'zh-HK,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'ko': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'vi': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
            'th': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
            'en': 'en-US,en;q=0.9',
            'de': 'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
            'fr': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
            'es': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
            'it': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            'pt-BR': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            'ru': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            'hi': 'hi-IN,hi;q=0.9,en-US;q=0.8,en;q=0.7'
        }

        return languageHeaders[language] || 'en-US,en;q=0.9'
    }

    async createBrowser(proxy: AccountProxy, email: string): Promise<BrowserContext> {
        // 获取地理位置配置
        const geoConfig = await this.getGeoLocationConfig()

        const browser = await playwright.chromium.launch({
            //channel: 'msedge', // Uses Edge instead of chrome
            headless: this.bot.config.headless,
            ...(proxy.url && { proxy: { username: proxy.username, password: proxy.password, server: `${proxy.url}:${proxy.port}` } }),
            args: [
                '--no-sandbox',
                '--mute-audio',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--ignore-ssl-errors',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-web-security',
                '--disable-webrtc-hw-encoding',
                '--disable-webrtc-hw-decoding',
                '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-features=VizDisplayCompositor',
                // 防崩溃和内存优化参数
                '--disable-background-media-suspend',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--disable-plugins',
                '--disable-extensions',
                '--disable-default-apps',
                '--disable-client-side-phishing-detection',
                '--disable-sync',
                '--disable-background-networking',
                '--no-default-browser-check',
                '--no-service-autorun',
                '--no-pings',
                '--memory-pressure-off',
                '--max_old_space_size=4096',
            ]
        })

        const sessionData = await loadSessionData(this.bot.config.sessionPath, email, this.bot.isMobile, this.bot.config.saveFingerprint)

        const fingerprint = sessionData.fingerprint ? sessionData.fingerprint : await this.generateFingerprint()

        // 创建浏览器上下文，使用自动检测的地理位置配置
        let contextOptions: any = { fingerprint: fingerprint }

        // 关键修复：为移动端添加完整的移动设备配置
        if (this.bot.isMobile) {
            contextOptions = {
                ...contextOptions,
                viewport: { 
                    width: 412, 
                    height: 915 
                }, // 标准移动端屏幕尺寸
                deviceScaleFactor: 3, // 高分辨率移动设备
                isMobile: true, // 关键：标识为移动设备
                hasTouch: true, // 关键：启用触摸支持
                userAgent: fingerprint.fingerprint.navigator.userAgent, // 确保使用移动端UA
                locale: geoConfig.locale, // 自动检测的地区设置
                timezoneId: geoConfig.timezoneId, // 自动检测的时区
                permissions: ['geolocation'], // 移动端权限
                geolocation: geoConfig.geolocation, // 自动检测的地理坐标
                extraHTTPHeaders: geoConfig.extraHTTPHeaders // 自动生成的HTTP头部
            }
            
            this.bot.log(this.bot.isMobile, 'BROWSER-MOBILE', 'Configuring browser with full mobile device simulation')
            this.bot.log(this.bot.isMobile, 'BROWSER-MOBILE', `Viewport: 412x915, Touch: enabled, Mobile: true`)
            this.bot.log(this.bot.isMobile, 'BROWSER-MOBILE', `Auto-detected locale: ${geoConfig.locale}, timezone: ${geoConfig.timezoneId}`)
        } else {
            // 桌面端配置
            contextOptions = {
                ...contextOptions,
                viewport: { 
                    width: 1920, 
                    height: 1080 
                },
                locale: geoConfig.locale, // 自动检测的地区设置
                timezoneId: geoConfig.timezoneId, // 自动检测的时区
                geolocation: geoConfig.geolocation, // 自动检测的地理坐标
                extraHTTPHeaders: geoConfig.extraHTTPHeaders // 自动生成的HTTP头部
            }
            
            this.bot.log(this.bot.isMobile, 'BROWSER-DESKTOP', `Auto-detected locale: ${geoConfig.locale}, timezone: ${geoConfig.timezoneId}`)
        }

        const context = await newInjectedContext(browser as any, contextOptions)

        // Set timeout to preferred amount
        context.setDefaultTimeout(this.bot.utils.stringToMs(this.bot.config?.globalTimeout ?? 30000))

        await context.addCookies(sessionData.cookies)

        if (this.bot.config.saveFingerprint) {
            await saveFingerprintData(this.bot.config.sessionPath, email, this.bot.isMobile, fingerprint)
        }

        this.bot.log(this.bot.isMobile, 'BROWSER', `Created browser with User-Agent: "${fingerprint.fingerprint.navigator.userAgent}"`)
        this.bot.log(this.bot.isMobile, 'BROWSER', `Location settings: ${geoConfig.locale} | ${geoConfig.timezoneId} | ${geoConfig.geolocation.latitude}, ${geoConfig.geolocation.longitude}`)
        
        // 移动端额外验证日志
        if (this.bot.isMobile) {
            this.bot.log(this.bot.isMobile, 'BROWSER-MOBILE', 'Mobile browser features: Touch=✓, Mobile=✓, Viewport=412x915, Platform=Android')
        }

        return context as BrowserContext
    }

    async generateFingerprint() {
        const fingerPrintData = new FingerprintGenerator().getFingerprint({
            devices: this.bot.isMobile ? ['mobile'] : ['desktop'],
            operatingSystems: this.bot.isMobile ? ['android'] : ['windows'],
            browsers: [{ name: 'edge' }]
        })

        const updatedFingerPrintData = await updateFingerprintUserAgent(fingerPrintData, this.bot.isMobile)

        return updatedFingerPrintData
    }
}

export default Browser