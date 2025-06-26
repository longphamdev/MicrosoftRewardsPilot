import playwright, { BrowserContext } from 'rebrowser-playwright'

import { newInjectedContext } from 'fingerprint-injector'
import { FingerprintGenerator } from 'fingerprint-generator'

import { MicrosoftRewardsBot } from '../index'
import { loadSessionData, saveFingerprintData } from '../util/Load'
import { updateFingerprintUserAgent } from '../util/UserAgent'

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

    async createBrowser(proxy: AccountProxy, email: string): Promise<BrowserContext> {
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

        // 创建浏览器上下文，为移动端添加完整配置
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
                locale: 'ja-JP', // 根据地区设置
                timezoneId: 'Asia/Tokyo', // 时区设置
                permissions: ['geolocation'], // 移动端权限
                geolocation: { 
                    latitude: 35.6762, 
                    longitude: 139.6503 
                }, // 东京坐标
                extraHTTPHeaders: {
                    // 移动端特有的HTTP头部
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    'sec-ch-ua-mobile': '?1', // 关键：标识为移动设备
                    'sec-ch-ua-platform': '"Android"', // 平台标识
                    'Upgrade-Insecure-Requests': '1'
                }
            }
            
            this.bot.log(this.bot.isMobile, 'BROWSER-MOBILE', 'Configuring browser with full mobile device simulation')
            this.bot.log(this.bot.isMobile, 'BROWSER-MOBILE', `Viewport: 412x915, Touch: enabled, Mobile: true`)
        } else {
            // 桌面端配置
            contextOptions = {
                ...contextOptions,
                viewport: { 
                    width: 1920, 
                    height: 1080 
                },
                locale: 'ja-JP',
                timezoneId: 'Asia/Tokyo'
            }
        }

        const context = await newInjectedContext(browser as any, contextOptions)

        // Set timeout to preferred amount
        context.setDefaultTimeout(this.bot.utils.stringToMs(this.bot.config?.globalTimeout ?? 30000))

        await context.addCookies(sessionData.cookies)

        if (this.bot.config.saveFingerprint) {
            await saveFingerprintData(this.bot.config.sessionPath, email, this.bot.isMobile, fingerprint)
        }

        this.bot.log(this.bot.isMobile, 'BROWSER', `Created browser with User-Agent: "${fingerprint.fingerprint.navigator.userAgent}"`)
        
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