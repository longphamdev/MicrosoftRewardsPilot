import { Page } from 'rebrowser-playwright'
import { platform } from 'os'

import { Workers } from '../Workers'

import { Counters, DashboardData } from '../../interface/DashboardData'
import { GoogleSearch } from '../../interface/Search'
import { AxiosRequestConfig } from 'axios'

type GoogleTrendsResponse = [
    string,
    [
        string,
        ...null[],
        [string, ...string[]]
    ][]
];

export class Search extends Workers {
    private bingHome = 'https://bing.com'
    private searchPageURL = ''

    public async doSearch(page: Page, data: DashboardData) {
        this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Starting Bing searches')

        page = await this.bot.browser.utils.getLatestTab(page)

        let searchCounters: Counters = await this.bot.browser.func.getSearchPoints()
        let missingPoints = this.calculatePoints(searchCounters)

        if (missingPoints === 0) {
            this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Bing searches have already been completed')
            return
        }

        // 多源搜索查询生成
        let allSearchQueries = await this.generateDiversifiedQueries(data)
        allSearchQueries = this.bot.utils.shuffleArray(allSearchQueries)

        // 去重搜索词
        allSearchQueries = Array.from(new Set(allSearchQueries))
        
        this.bot.log(this.bot.isMobile, 'SEARCH-QUERY-SOURCE', `Generated ${allSearchQueries.length} diversified search queries`)

        // Go to bing
        await page.goto(this.searchPageURL ? this.searchPageURL : this.bingHome)

        await this.bot.utils.wait(2000)

        await this.bot.browser.utils.tryDismissAllMessages(page)

        let maxLoop = 0 // If the loop hits 10 this when not gaining any points, we're assuming it's stuck. If it doesn't continue after 5 more searches with alternative queries, abort search

        const queries: string[] = []
        // Mobile search doesn't seem to like related queries?
        allSearchQueries.forEach(x => { 
            if (typeof x === 'string') {
                queries.push(x)
            } else {
                this.bot.isMobile ? queries.push(x.topic) : queries.push(x.topic, ...x.related) 
            }
        })

        // Loop over search queries
        const searchStartTime = Date.now()
        const searchTimeoutMs = 20 * 60 * 1000 // 20分钟总体超时
        
        for (let i = 0; i < queries.length; i++) {
            // 检查总体超时
            if (Date.now() - searchStartTime > searchTimeoutMs) {
                this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Search process timeout after 20 minutes, stopping searches', 'warn')
                break
            }
            
            const query = queries[i] as string

            this.bot.log(this.bot.isMobile, 'SEARCH-BING', `${missingPoints} Points Remaining | Query: ${query}`)

            searchCounters = await this.bingSearch(page, query)
            const newMissingPoints = this.calculatePoints(searchCounters)

            // If the new point amount is the same as before
            if (newMissingPoints == missingPoints) {
                maxLoop++ // Add to max loop
            } else { // There has been a change in points
                maxLoop = 0 // Reset the loop
            }

            missingPoints = newMissingPoints

            if (missingPoints === 0) {
                break
            }

            // Only for mobile searches
            if (maxLoop > 5 && this.bot.isMobile) {
                this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Search didn\'t gain point for 5 iterations, likely bad User-Agent', 'warn')
                break
            }

            // If we didn't gain points for 10 iterations, assume it's stuck
            if (maxLoop > 10) {
                this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Search didn\'t gain point for 10 iterations aborting searches', 'warn')
                maxLoop = 0 // Reset to 0 so we can retry with related searches below
                break
            }
        }

        // Only for mobile searches
        if (missingPoints > 0 && this.bot.isMobile) {
            return
        }

        // If we still got remaining search queries, generate extra ones
        if (missingPoints > 0) {
            this.bot.log(this.bot.isMobile, 'SEARCH-BING', `Search completed but we're missing ${missingPoints} points, generating extra searches`)

            let i = 0
            while (missingPoints > 0) {
                const query = allSearchQueries[i++] as any

                // Get related search terms to the search queries
                const relatedTerms = await this.getRelatedTerms(typeof query === 'string' ? query : query?.topic)
                if (relatedTerms.length > 3) {
                    // Search for the first 2 related terms
                    for (const term of relatedTerms.slice(1, 3)) {
                        this.bot.log(this.bot.isMobile, 'SEARCH-BING-EXTRA', `${missingPoints} Points Remaining | Query: ${term}`)

                        searchCounters = await this.bingSearch(page, term)
                        const newMissingPoints = this.calculatePoints(searchCounters)

                        // If the new point amount is the same as before
                        if (newMissingPoints == missingPoints) {
                            maxLoop++ // Add to max loop
                        } else { // There has been a change in points
                            maxLoop = 0 // Reset the loop
                        }

                        missingPoints = newMissingPoints

                        // If we satisfied the searches
                        if (missingPoints === 0) {
                            break
                        }

                        // Try 5 more times, then we tried a total of 15 times, fair to say it's stuck
                        if (maxLoop > 5) {
                            this.bot.log(this.bot.isMobile, 'SEARCH-BING-EXTRA', 'Search didn\'t gain point for 5 iterations aborting searches', 'warn')
                            return
                        }
                    }
                }
            }
        }

        this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Completed searches')
    }

    /**
     * 生成多样化的搜索查询 - 基于地理位置的多语言优化
     * 混合多种来源以降低检测风险
     */
    private async generateDiversifiedQueries(data: DashboardData): Promise<(GoogleSearch | string)[]> {
        const allQueries: (GoogleSearch | string)[] = []
        
        try {
            // 获取地理位置和语言信息
            const geoLocation = await this.getGeoLocationWithFallback(data)
            const languageConfig = await this.getLanguageConfigFromGeo(geoLocation)
            
            this.bot.log(this.bot.isMobile, 'SEARCH-GEO', 
                `Location: ${geoLocation.country} (${geoLocation.countryCode}) | Language: ${languageConfig.name} (${languageConfig.code})`)
            
            // 1. Google Trends查询（40%）- 使用地理位置相关的趋势
            const trendsQueries = await this.getGeoLocalizedTrends(languageConfig.googleTrendsLocale)
            const trendsCount = Math.floor(trendsQueries.length * 0.4)
            allQueries.push(...trendsQueries.slice(0, trendsCount))
            
            // 2. 时事相关查询（25%）- 使用本地语言
            const newsQueries = await this.generateLocalizedNewsQueries(languageConfig)
            allQueries.push(...newsQueries)
            
            // 3. 常见搜索查询（20%）- 使用本地语言
            const commonQueries = this.generateLocalizedCommonQueries(languageConfig)
            allQueries.push(...commonQueries)
            
            // 4. 技术和娱乐查询（15%）- 使用本地语言
            const techEntertainmentQueries = this.generateLocalizedTechEntertainmentQueries(languageConfig)
            allQueries.push(...techEntertainmentQueries)
            
            this.bot.log(this.bot.isMobile, 'SEARCH-MULTILANG', 
                `Generated queries: Trends(${trendsCount}), News(${newsQueries.length}), Common(${commonQueries.length}), Tech/Entertainment(${techEntertainmentQueries.length}) in ${languageConfig.name}`)
            
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-GEO-ERROR', `Error generating localized queries: ${error}`, 'warn')
            // 如果地理语言检测失败，回退到原有的多样化方案
            return await this.generateFallbackDiversifiedQueries(data)
        }
        
        return allQueries
    }

    /**
     * 获取地理位置信息（包含备用方案）
     */
    private async getGeoLocationWithFallback(data: DashboardData): Promise<any> {
        try {
            // 尝试加载地理检测模块
            const { GeoLanguageDetector } = await import('../../util/GeoLanguage')
            return await GeoLanguageDetector.getCurrentLocation()
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-GEO', 'Failed to detect location, using profile data', 'warn')
            // 备用方案：使用用户资料中的国家信息
            const country = data.userProfile?.attributes?.country || 'JP'
            return {
                country: country,
                countryCode: country,
                language: country === 'JP' ? 'ja' : country === 'CN' ? 'zh-CN' : 'en'
            }
        }
    }

    /**
     * 从地理位置获取语言配置
     */
    private async getLanguageConfigFromGeo(geoLocation: any): Promise<any> {
        try {
            const { GeoLanguageDetector } = await import('../../util/GeoLanguage')
            return GeoLanguageDetector.getLanguageConfig(geoLocation.language)
        } catch (error) {
            // 备用方案：返回日文配置
            return {
                code: 'ja',
                name: 'Japanese',
                googleTrendsLocale: 'JP',
                searchQueries: {
                    news: ['最新ニュース', '速報ニュース', '世界のニュース'],
                    common: ['料理の作り方', 'おすすめレシピ', '旅行先'],
                    tech: ['人工知能', '最新技術', 'スマートフォンレビュー'],
                    entertainment: ['新作映画', 'テレビ番組', '音楽ランキング'],
                    sports: ['サッカー結果', 'バスケットボールニュース', 'スポーツハイライト'],
                    food: ['レストランレビュー', '料理のコツ', 'ヘルシーレシピ']
                }
            }
        }
    }

    /**
     * 获取基于地理位置的Google Trends
     */
    private async getGeoLocalizedTrends(locale: string): Promise<GoogleSearch[]> {
        try {
            // 使用地理位置相关的locale获取趋势
            return await this.getGoogleTrends(locale)
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-TRENDS-GEO', `Failed to get geo trends for ${locale}, using default`, 'warn')
            // 回退到默认的Google Trends
            return await this.getGoogleTrends('JP')
        }
    }

    /**
     * 生成本地化的时事查询
     */
    private async generateLocalizedNewsQueries(languageConfig: any): Promise<string[]> {
        try {
            const { GeoLanguageDetector } = await import('../../util/GeoLanguage')
            const timeBasedQueries = GeoLanguageDetector.generateTimeBasedQueries(languageConfig.code)
            
            const newsQueries = languageConfig.searchQueries.news || []
            
            // 合并时效性查询和常规新闻查询
            const combinedQueries = [...timeBasedQueries, ...newsQueries]
            
            // 随机选择4-6个查询
            const selectedCount = 4 + Math.floor(Math.random() * 3)
            return this.bot.utils.shuffleArray(combinedQueries).slice(0, selectedCount)
        } catch (error) {
            // 备用方案：日文时事查询
            const currentDate = new Date()
            const currentYear = currentDate.getFullYear()
            return [
                `${currentYear}年のニュース`,
                '今日の最新情報',
                '速報',
                '世界情勢'
            ]
        }
    }

    /**
     * 生成本地化的常见查询
     */
    private generateLocalizedCommonQueries(languageConfig: any): string[] {
        const commonQueries = languageConfig.searchQueries.common || []
        const foodQueries = languageConfig.searchQueries.food || []
        
        // 合并常见查询和美食查询
        const combinedQueries = [...commonQueries, ...foodQueries]
        
        // 随机选择3-5个查询
        const selectedCount = 3 + Math.floor(Math.random() * 3)
        return this.bot.utils.shuffleArray(combinedQueries).slice(0, selectedCount)
    }

    /**
     * 生成本地化的技术娱乐查询
     */
    private generateLocalizedTechEntertainmentQueries(languageConfig: any): string[] {
        const techQueries: string[] = languageConfig.searchQueries.tech || []
        const entertainmentQueries: string[] = languageConfig.searchQueries.entertainment || []
        const sportsQueries: string[] = languageConfig.searchQueries.sports || []
        
        // 从每个类别选择1-2个查询
        const selectedTech: string[] = this.bot.utils.shuffleArray(techQueries).slice(0, 1 + Math.floor(Math.random() * 2)) as string[]
        const selectedEntertainment: string[] = this.bot.utils.shuffleArray(entertainmentQueries).slice(0, 1 + Math.floor(Math.random() * 2)) as string[]
        const selectedSports: string[] = this.bot.utils.shuffleArray(sportsQueries).slice(0, 1 + Math.floor(Math.random() * 2)) as string[]
        
        return [...selectedTech, ...selectedEntertainment, ...selectedSports]
    }

    /**
     * 备用的多样化查询生成（原有逻辑）
     */
    private async generateFallbackDiversifiedQueries(data: DashboardData): Promise<(GoogleSearch | string)[]> {
        const allQueries: (GoogleSearch | string)[] = []
        
        try {
            // 1. Google Trends查询（50%）
            const trendsQueries = await this.getGoogleTrends(
                this.bot.config.searchSettings.useGeoLocaleQueries ? 
                data.userProfile.attributes.country : 'JP'
            )
            const trendsCount = Math.floor(trendsQueries.length * 0.5)
            allQueries.push(...trendsQueries.slice(0, trendsCount))
            
            // 2. 时事相关查询（20%）
            const newsQueries = await this.generateNewsQueries()
            allQueries.push(...newsQueries)
            
            // 3. 常见搜索查询（15%）
            const commonQueries = this.generateCommonQueries()
            allQueries.push(...commonQueries)
            
            // 4. 随机话题查询（15%）
            const randomQueries = await this.generateRandomTopicQueries()
            allQueries.push(...randomQueries)
            
            this.bot.log(this.bot.isMobile, 'SEARCH-FALLBACK', 
                `Fallback query sources: Trends(${trendsCount}), News(${newsQueries.length}), Common(${commonQueries.length}), Random(${randomQueries.length})`)
            
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-FALLBACK-ERROR', `Error generating fallback queries: ${error}`, 'warn')
            // 最后的备用方案：返回原有的Google Trends
            return await this.getGoogleTrends(
                this.bot.config.searchSettings.useGeoLocaleQueries ? 
                data.userProfile.attributes.country : 'JP'
            )
        }
        
        return allQueries
    }

    /**
     * 生成时事相关搜询
     */
    private async generateNewsQueries(): Promise<string[]> {
        const currentDate = new Date()
        const currentYear = currentDate.getFullYear()
        const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long' })
        
        const newsQueries = [
            `${currentYear} news today`,
            `${currentMonth} ${currentYear} events`,
            `today's headlines`,
            `current events ${currentYear}`,
            `news updates ${currentMonth}`,
            `breaking news today`,
            `world news ${currentYear}`,
            `latest technology news`,
            `sports news today`,
            `weather forecast today`
        ]
        
        // 随机选择3-5个时事查询
        const selectedCount = 3 + Math.floor(Math.random() * 3)
        return this.bot.utils.shuffleArray(newsQueries).slice(0, selectedCount)
    }

    /**
     * 生成常见搜索查询
     */
    private generateCommonQueries(): string[] {
        const commonTopics = [
            'how to cook pasta',
            'best movies 2024',
            'healthy recipes',
            'travel destinations',
            'fitness tips',
            'home improvement ideas',
            'online learning',
            'productivity apps',
            'book recommendations',
            'gardening tips',
            'DIY projects',
            'career advice',
            'investment tips',
            'language learning',
            'photography tips'
        ]
        
        // 随机选择2-4个常见查询
        const selectedCount = 2 + Math.floor(Math.random() * 3)
        return this.bot.utils.shuffleArray(commonTopics).slice(0, selectedCount)
    }

    /**
     * 生成随机话题查询
     */
    private async generateRandomTopicQueries(): Promise<string[]> {
        const randomTopics = [
            'artificial intelligence future',
            'sustainable living tips',
            'space exploration news',
            'electric vehicles 2024',
            'renewable energy trends',
            'digital art techniques',
            'mindfulness meditation',
            'cryptocurrency updates',
            'virtual reality gaming',
            'climate change solutions',
            'healthy lifestyle habits',
            'remote work productivity',
            'scientific discoveries 2024',
            'cultural festivals around world',
            'innovative technology startups'
        ]
        
        // 随机选择2-3个随机话题
        const selectedCount = 2 + Math.floor(Math.random() * 2)
        return this.bot.utils.shuffleArray(randomTopics).slice(0, selectedCount)
    }

    private async bingSearch(searchPage: Page, query: string) {
        const platformControlKey = platform() === 'darwin' ? 'Meta' : 'Control'

        // Try a max of 5 times
        for (let i = 0; i < 5; i++) {
            try {
                // This page had already been set to the Bing.com page or the previous search listing, we just need to select it
                searchPage = await this.bot.browser.utils.getLatestTab(searchPage)

                // Go to top of the page
                await searchPage.evaluate(() => {
                    window.scrollTo(0, 0)
                })

                await this.bot.utils.wait(500)

                const searchBar = '#sb_form_q'
                await searchPage.waitForSelector(searchBar, { state: 'visible', timeout: 10000 })
                await searchPage.click(searchBar) // Focus on the textarea
                
                // 人类化的思考停顿
                await this.humanThinkingPause()
                
                await searchPage.keyboard.down(platformControlKey)
                await searchPage.keyboard.press('A')
                await searchPage.keyboard.press('Backspace')
                await searchPage.keyboard.up(platformControlKey)
                
                // 人类化的打字输入
                await this.humanTypeText(searchPage, query)
                
                // 随机的提交前停顿
                await this.bot.utils.wait(Math.random() * 1000 + 500)
                
                await searchPage.keyboard.press('Enter')

                await this.bot.utils.wait(3000)

                // Bing.com in Chrome opens a new tab when searching
                const resultPage = await this.bot.browser.utils.getLatestTab(searchPage)
                this.searchPageURL = new URL(resultPage.url()).href // Set the results page

                await this.bot.browser.utils.reloadBadPage(resultPage)

                // 增强的人类行为模拟
                await this.simulateHumanBehavior(resultPage)

                // 智能延迟系统
                const delayMs = await this.calculateSmartDelay(i)
                this.bot.log(this.bot.isMobile, 'SEARCH-BING-DELAY', `Waiting ${Math.round(delayMs/1000)}s before next search...`)
                await this.bot.utils.wait(delayMs)

                // 获取搜索点数，添加超时保护
                try {
                    this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Fetching updated search points...')
                    const searchPoints = await Promise.race([
                        this.bot.browser.func.getSearchPoints(),
                        new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('getSearchPoints timeout after 20 seconds')), 20000)
                        )
                    ]) as Counters
                    
                    return searchPoints
                } catch (pointsError) {
                    this.bot.log(this.bot.isMobile, 'SEARCH-BING', `Failed to get search points: ${pointsError}`, 'warn')
                    // 如果获取点数失败，返回空的计数器，让主循环继续
                    return await this.getEmptySearchCounters()
                }

            } catch (error) {
                // 检查是否是浏览器关闭相关的错误
                const errorMessage = String(error)
                const isBrowserClosed = errorMessage.includes('Target page, context or browser has been closed') ||
                                      errorMessage.includes('page.reload: Target page') ||
                                      searchPage.isClosed()

                if (isBrowserClosed) {
                    this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Browser or page has been closed, ending search', 'warn')
                    return await this.getEmptySearchCounters()
                }

                if (i === 4) { // 第5次重试（索引从0开始）
                    this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Failed after 5 retries... An error occurred:' + error, 'error')
                    break
                }

                this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Search failed, An error occurred:' + error, 'error')
                this.bot.log(this.bot.isMobile, 'SEARCH-BING', `Retrying search, attempt ${i+1}/5`, 'warn')

                try {
                    // Reset the tabs
                    const lastTab = await this.bot.browser.utils.getLatestTab(searchPage)
                    await this.closeTabs(lastTab)
                } catch (tabError) {
                    this.bot.log(this.bot.isMobile, 'SEARCH-BING', `Failed to reset tabs: ${tabError}`, 'warn')
                    // 如果连tab操作都失败了，很可能浏览器已经关闭
                    return await this.getEmptySearchCounters()
                }

                await this.bot.utils.wait(4000)
            }
        }

        this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Search failed after 5 retries, ending', 'error')
        return await this.getEmptySearchCounters()
    }

    /**
     * 人类化思考停顿
     */
    private async humanThinkingPause(): Promise<void> {
        // 模拟人类在搜索前的思考时间，1-3秒不等
        const thinkingTime = Math.random() * 2000 + 1000
        await this.bot.utils.wait(thinkingTime)
    }

    /**
     * 人类化打字输入
     */
    private async humanTypeText(page: Page, text: string): Promise<void> {
        // 随机打字速度：80-200ms每字符
        const baseTypingSpeed = 80
        const speedVariation = 120
        
        // 10%概率模拟打字错误和修正
        const shouldMakeTypo = Math.random() < 0.1
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i]
            
            // 确保字符存在
            if (!char) continue
            
            // 模拟打字错误
            if (shouldMakeTypo && i === Math.floor(text.length * 0.3)) {
                // 输入错误字符
                const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26))
                await page.keyboard.type(wrongChar)
                await this.bot.utils.wait(200 + Math.random() * 300)
                
                // 发现错误，删除
                await page.keyboard.press('Backspace')
                await this.bot.utils.wait(100 + Math.random() * 200)
                
                // 输入正确字符
                await page.keyboard.type(char)
            } else {
                await page.keyboard.type(char)
            }
            
            // 变化的打字速度
            const typingDelay = baseTypingSpeed + Math.random() * speedVariation
            
            // 在空格处稍作停顿（模拟思考单词）
            if (char === ' ') {
                await this.bot.utils.wait(typingDelay * 2)
            } else {
                await this.bot.utils.wait(typingDelay)
            }
        }
    }

    /**
     * 增强的人类行为模拟
     */
    private async simulateHumanBehavior(page: Page): Promise<void> {
        // 随机行为选择
        const behaviors = ['scroll', 'click', 'both', 'none']
        const selectedBehavior = behaviors[Math.floor(Math.random() * behaviors.length)]
        
        switch (selectedBehavior) {
            case 'scroll':
                if (this.bot.config.searchSettings.scrollRandomResults) {
                    await this.bot.utils.wait(1000 + Math.random() * 2000)
                    await this.enhancedRandomScroll(page)
                }
                break
                
            case 'click':
                if (this.bot.config.searchSettings.clickRandomResults) {
                    await this.bot.utils.wait(2000 + Math.random() * 3000)
                    await this.clickRandomLink(page)
                }
                break
                
            case 'both':
                if (this.bot.config.searchSettings.scrollRandomResults) {
                    await this.bot.utils.wait(1000 + Math.random() * 1000)
                    await this.enhancedRandomScroll(page)
                }
                if (this.bot.config.searchSettings.clickRandomResults) {
                    await this.bot.utils.wait(1000 + Math.random() * 2000)
                    await this.clickRandomLink(page)
                }
                break
                
            case 'none':
                // 只是查看结果，不做任何操作
                await this.bot.utils.wait(3000 + Math.random() * 2000)
                break
        }
    }

    /**
     * 增强的随机滚动
     */
    private async enhancedRandomScroll(page: Page): Promise<void> {
        try {
            const viewportHeight = await page.evaluate(() => window.innerHeight)
            
            // 模拟人类阅读的滚动模式
            const scrollSteps = 2 + Math.floor(Math.random() * 4) // 2-5次滚动
            
            for (let i = 0; i < scrollSteps; i++) {
                const scrollDistance = Math.floor(Math.random() * viewportHeight * 0.8)
                await page.evaluate((distance) => {
                    window.scrollBy(0, distance)
                }, scrollDistance)
                
                // 阅读停顿
                await this.bot.utils.wait(800 + Math.random() * 1500)
            }
            
            // 偶尔滚回顶部
            if (Math.random() < 0.3) {
                await this.bot.utils.wait(500)
                await page.evaluate(() => {
                    window.scrollTo(0, 0)
                })
            }
            
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-ENHANCED-SCROLL', 'An error occurred:' + error, 'error')
        }
    }

    /**
     * 智能延迟计算系统
     */
         private async calculateSmartDelay(searchIndex: number): Promise<number> {
         const config = this.bot.config.searchSettings.searchDelay
         const minDelayStr = String(config.min || "30s")
         const maxDelayStr = String(config.max || "90s")
         const minDelay = this.bot.utils.stringToMs(minDelayStr)
         const maxDelay = this.bot.utils.stringToMs(maxDelayStr)
        
        // 基础随机延迟
        let baseDelay = Math.floor(this.bot.utils.randomNumber(minDelay, maxDelay))
        
        // 时间分布优化：模拟真实用户搜索模式
        const currentHour = new Date().getHours()
        let timeMultiplier = 1.0
        
        // 深夜时间增加延迟（模拟用户较少活跃）
        if (currentHour >= 2 && currentHour <= 6) {
            timeMultiplier = 1.5
        }
        // 午休时间稍微增加延迟
        else if (currentHour >= 12 && currentHour <= 14) {
            timeMultiplier = 1.2
        }
        
        // 搜索序列优化：后续搜索延迟递增
        const sequenceMultiplier = 1 + (searchIndex * 0.1) // 每次搜索增加10%延迟
        
        // 随机波动：±30%的随机变化
        const randomMultiplier = 0.7 + Math.random() * 0.6
        
        // 计算最终延迟
        const finalDelay = Math.floor(baseDelay * timeMultiplier * sequenceMultiplier * randomMultiplier)
        
        // 确保延迟在合理范围内（最少15秒，最多3分钟）
        return Math.max(15000, Math.min(180000, finalDelay))
    }

    /**
     * 返回空的搜索计数器，用于处理浏览器关闭等异常情况
     */
    private async getEmptySearchCounters(): Promise<Counters> {
        try {
            // 尝试获取真实的搜索点数
            return await this.bot.browser.func.getSearchPoints()
        } catch (error) {
            // 如果失败，返回空的计数器
            this.bot.log(this.bot.isMobile, 'SEARCH-BING', 'Failed to get search points, returning empty counters', 'warn')
            return {
                pcSearch: [],
                mobileSearch: [],
                shopAndEarn: [],
                activityAndQuiz: [],
                dailyPoint: []
            }
        }
    }

    private async getGoogleTrends(geoLocale: string = 'JP'): Promise<GoogleSearch[]> {
        const queryTerms: GoogleSearch[] = []
        this.bot.log(this.bot.isMobile, 'SEARCH-GOOGLE-TRENDS', `Generating search queries, can take a while! | GeoLocale: ${geoLocale}`)

        try {
            const request: AxiosRequestConfig = {
                url: 'https://trends.google.com/_/TrendsUi/data/batchexecute',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
                },
                data: `f.req=[[[i0OFE,"[null, null, \\"${geoLocale.toUpperCase()}\\", 0, null, 48]"]]]`
            }

            const response = await this.bot.axios.request(request, this.bot.config.proxy.proxyGoogleTrends)
            const rawText = response.data

            const trendsData = this.extractJsonFromResponse(rawText)
            if (!trendsData) {
               throw  this.bot.log(this.bot.isMobile, 'SEARCH-GOOGLE-TRENDS', 'Failed to parse Google Trends response', 'error')
            }

            const mappedTrendsData = trendsData.map(query => [query[0], query[9]!.slice(1)])
            if (mappedTrendsData.length < 90) {
                this.bot.log(this.bot.isMobile, 'SEARCH-GOOGLE-TRENDS', 'Insufficient search queries, falling back to JP', 'warn')
                return this.getGoogleTrends()
            }

            for (const [topic, relatedQueries] of mappedTrendsData) {
                queryTerms.push({
                    topic: topic as string,
                    related: relatedQueries as string[]
                })
            }

        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-GOOGLE-TRENDS', 'An error occurred:' + error, 'error')
        }

        return queryTerms
    }

    private extractJsonFromResponse(text: string): GoogleTrendsResponse[1] | null {
        const lines = text.split('\n')
        for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    return JSON.parse(JSON.parse(trimmed)[0][2])[1]
                } catch {
                    continue
                }
            }
        }

        return null
    }

    private async getRelatedTerms(term: string): Promise<string[]> {
        try {
            const request = {
                url: `https://api.bing.com/osjson.aspx?query=${term}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            const response = await this.bot.axios.request(request, this.bot.config.proxy.proxyBingTerms)

            return response.data[1] as string[]
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-BING-RELATED', 'An error occurred:' + error, 'error')
        }

        return []
    }



    private async clickRandomLink(page: Page) {
        try {
            await page.click('#b_results .b_algo h2', { timeout: 2000 }).catch(() => { }) // Since we don't really care if it did it or not

            // Only used if the browser is not the edge browser (continue on Edge popup)
            await this.closeContinuePopup(page)

            // Stay for 10 seconds for page to load and "visit"
            await this.bot.utils.wait(10000)

            // Will get current tab if no new one is created, this will always be the visited site or the result page if it failed to click
            let lastTab = await this.bot.browser.utils.getLatestTab(page)

            let lastTabURL = new URL(lastTab.url()) // Get new tab info, this is the website we're visiting

            // Check if the URL is different from the original one, don't loop more than 5 times.
            let i = 0
            while (lastTabURL.href !== this.searchPageURL && i < 5) {

                await this.closeTabs(lastTab)

                // End of loop, refresh lastPage
                lastTab = await this.bot.browser.utils.getLatestTab(page) // Finally update the lastTab var again
                lastTabURL = new URL(lastTab.url()) // Get new tab info
                i++
            }

        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-RANDOM-CLICK', 'An error occurred:' + error, 'error')
        }
    }

    private async closeTabs(lastTab: Page) {
        const browser = lastTab.context()
        const tabs = browser.pages()

        try {
            if (tabs.length > 2) {
                // If more than 2 tabs are open, close the last tab

                await lastTab.close()
                this.bot.log(this.bot.isMobile, 'SEARCH-CLOSE-TABS', `More than 2 were open, closed the last tab: "${new URL(lastTab.url()).host}"`)

            } else if (tabs.length === 1) {
                // If only 1 tab is open, open a new one to search in

                const newPage = await browser.newPage()
                await this.bot.utils.wait(1000)

                await newPage.goto(this.bingHome)
                await this.bot.utils.wait(3000)
                this.searchPageURL = newPage.url()

                this.bot.log(this.bot.isMobile, 'SEARCH-CLOSE-TABS', 'There was only 1 tab open, crated a new one')
            } else {
                // Else reset the last tab back to the search listing or Bing.com

                lastTab = await this.bot.browser.utils.getLatestTab(lastTab)
                await lastTab.goto(this.searchPageURL ? this.searchPageURL : this.bingHome)
            }

        } catch (error) {
            this.bot.log(this.bot.isMobile, 'SEARCH-CLOSE-TABS', 'An error occurred:' + error, 'error')
        }

    }

    private calculatePoints(counters: Counters) {
        const mobileData = counters.mobileSearch?.[0] // Mobile searches
        const genericData = counters.pcSearch?.[0] // Normal searches
        const edgeData = counters.pcSearch?.[1] // Edge searches

        const missingPoints = (this.bot.isMobile && mobileData)
            ? mobileData.pointProgressMax - mobileData.pointProgress
            : (edgeData ? edgeData.pointProgressMax - edgeData.pointProgress : 0)
            + (genericData ? genericData.pointProgressMax - genericData.pointProgress : 0)

        return missingPoints
    }

    private async closeContinuePopup(page: Page) {
        try {
            await page.waitForSelector('#sacs_close', { timeout: 1000 })
            const continueButton = await page.$('#sacs_close')

            if (continueButton) {
                await continueButton.click()
            }
        } catch (error) {
            // Continue if element is not found or other error occurs
        }
    }

}