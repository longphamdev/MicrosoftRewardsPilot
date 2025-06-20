import { Page } from 'rebrowser-playwright'

import { DashboardData, MorePromotion, PromotionalItem, PunchCard } from '../interface/DashboardData'

import { MicrosoftRewardsBot } from '../index'

export class Workers {
    public bot: MicrosoftRewardsBot

    constructor(bot: MicrosoftRewardsBot) {
        this.bot = bot
    }

    // Daily Set
    async doDailySet(page: Page, data: DashboardData) {
        const todayData = data.dailySetPromotions[this.bot.utils.getFormattedDate()]

        const activitiesUncompleted = todayData?.filter(x => !x.complete && x.pointProgressMax > 0) ?? []

        if (!activitiesUncompleted.length) {
            this.bot.log(this.bot.isMobile, 'DAILY-SET', 'All Daily Set" items have already been completed')
            return
        }

        // Solve Activities
        this.bot.log(this.bot.isMobile, 'DAILY-SET', 'Started solving "Daily Set" items')

        await this.solveActivities(page, activitiesUncompleted)

        page = await this.bot.browser.utils.getLatestTab(page)

        // Always return to the homepage if not already
        await this.bot.browser.func.goHome(page)

        this.bot.log(this.bot.isMobile, 'DAILY-SET', 'All "Daily Set" items have been completed')
    }

    // Punch Card
    async doPunchCard(page: Page, data: DashboardData) {

        const punchCardsUncompleted = data.punchCards?.filter(x => x.parentPromotion && !x.parentPromotion.complete) ?? [] // Only return uncompleted punch cards

        if (!punchCardsUncompleted.length) {
            this.bot.log(this.bot.isMobile, 'PUNCH-CARD', 'All "Punch Cards" have already been completed')
            return
        }

        for (const punchCard of punchCardsUncompleted) {

            // Ensure parentPromotion exists before proceeding
            if (!punchCard.parentPromotion?.title) {
                this.bot.log(this.bot.isMobile, 'PUNCH-CARD', `Skipped punchcard "${punchCard.name}" | Reason: Parent promotion is missing!`, 'warn')
                continue
            }

            // Get latest page for each card
            page = await this.bot.browser.utils.getLatestTab(page)

            const activitiesUncompleted = punchCard.childPromotions.filter(x => !x.complete) // Only return uncompleted activities

            // Solve Activities
            this.bot.log(this.bot.isMobile, 'PUNCH-CARD', `Started solving "Punch Card" items for punchcard: "${punchCard.parentPromotion.title}"`)

            // Got to punch card index page in a new tab
            await page.goto(punchCard.parentPromotion.destinationUrl, { referer: this.bot.config.baseURL })

            // Wait for new page to load, max 10 seconds, however try regardless in case of error
            await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => { })

            await this.solveActivities(page, activitiesUncompleted, punchCard)

            page = await this.bot.browser.utils.getLatestTab(page)

            const pages = page.context().pages()

            if (pages.length > 3) {
                await page.close()
            } else {
                await this.bot.browser.func.goHome(page)
            }

            this.bot.log(this.bot.isMobile, 'PUNCH-CARD', `All items for punchcard: "${punchCard.parentPromotion.title}" have been completed`)
        }

        this.bot.log(this.bot.isMobile, 'PUNCH-CARD', 'All "Punch Card" items have been completed')
    }

    // More Promotions
    async doMorePromotions(page: Page, data: DashboardData) {
        const morePromotions = data.morePromotions

        // Check if there is a promotional item
        if (data.promotionalItem) { // Convert and add the promotional item to the array
            morePromotions.push(data.promotionalItem as unknown as MorePromotion)
        }

        const activitiesUncompleted = morePromotions?.filter(x => !x.complete && x.pointProgressMax > 0 && x.exclusiveLockedFeatureStatus !== 'locked') ?? []

        if (!activitiesUncompleted.length) {
            this.bot.log(this.bot.isMobile, 'MORE-PROMOTIONS', 'All "More Promotion" items have already been completed')
            return
        }

        // Solve Activities
        this.bot.log(this.bot.isMobile, 'MORE-PROMOTIONS', 'Started solving "More Promotions" items')

        page = await this.bot.browser.utils.getLatestTab(page)

        await this.solveActivities(page, activitiesUncompleted)

        page = await this.bot.browser.utils.getLatestTab(page)

        // Always return to the homepage if not already
        await this.bot.browser.func.goHome(page)

        this.bot.log(this.bot.isMobile, 'MORE-PROMOTIONS', 'All "More Promotion" items have been completed')
    }

    // Solve all the different types of activities
    private async solveActivities(activityPage: Page, activities: PromotionalItem[] | MorePromotion[], punchCard?: PunchCard) {
        const activityInitial = activityPage.url() // Homepage for Daily/More and Index for promotions

        for (const activity of activities) {
            try {
                // 更安全地获取最新标签页
                try {
                    activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                } catch (tabError) {
                    this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab, skipping activity "${activity.title}": ${tabError}`, 'warn')
                    
                    // 尝试使用当前的 activityPage 继续
                    if (activityPage && !activityPage.isClosed()) {
                        this.bot.log(this.bot.isMobile, 'ACTIVITY', 'Using current page to continue', 'warn')
                    } else {
                        // 如果当前页面也关闭了，尝试创建新页面
                        try {
                            const context = this.bot.homePage.context()
                            activityPage = await context.newPage()
                            await activityPage.goto(activityInitial)
                            await this.bot.utils.wait(2000)
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', 'Created new page to continue activities', 'warn')
                        } catch (newPageError) {
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to create new page: ${newPageError}`, 'error')
                            break // 退出活动循环
                        }
                    }
                }

                const pages = activityPage.context().pages()
                if (pages.length > 3) {
                    await activityPage.close().catch(() => {})

                    try {
                        activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                    } catch (tabError) {
                        // 如果获取失败，使用主页
                        activityPage = this.bot.homePage
                        this.bot.log(this.bot.isMobile, 'ACTIVITY', 'Using home page after tab error', 'warn')
                    }
                }

                await this.bot.utils.wait(1000)

                if (activityPage.url() !== activityInitial) {
                    await activityPage.goto(activityInitial).catch(async (error) => {
                        this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to navigate to initial page: ${error}`, 'warn')
                    })
                }

                let selector = `[data-bi-id^="${activity.offerId}"] .pointLink:not(.contentContainer .pointLink)`

                if (punchCard) {
                    selector = await this.bot.browser.func.getPunchCardActivity(activityPage, activity)

                } else if (activity.name.toLowerCase().includes('membercenter') || activity.name.toLowerCase().includes('exploreonbing')) {
                    selector = `[data-bi-id^="${activity.name}"] .pointLink:not(.contentContainer .pointLink)`
                }

                // Wait for the new tab to fully load, ignore error.
                /*
                Due to common false timeout on this function, we're ignoring the error regardless, if it worked then it's faster,
                if it didn't then it gave enough time for the page to load.
                */
                await activityPage.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { })
                await this.bot.utils.wait(2000)

                // 尝试多个选择器策略
                const selectors = [
                    selector, // 原始选择器
                    `[data-bi-id*="${activity.offerId}"]`, // 更宽松的offerId匹配
                    `[data-bi-id*="${activity.name}"]`, // 基于名称的匹配
                    `a[href*="${activity.offerId}"]`, // 基于href的匹配
                    `a[href*="${activity.destinationUrl}"]`, // 基于目标URL的匹配
                    `.offer-card:has-text("${activity.title}") a`, // 基于标题文本的匹配
                    `[aria-label*="${activity.title}"]`, // 基于aria-label的匹配
                    `.pointLink[title*="${activity.title}"]`, // 基于title属性的匹配
                    `[data-bi-name*="${activity.title}"]`, // 基于data-bi-name的匹配
                    `.c-card:has-text("${activity.title}") .pointLink` // 基于卡片容器的匹配
                ]

                // 先检查元素是否存在，避免长时间等待
                let elementExists = false
                let foundSelector = ''
                
                for (const testSelector of selectors) {
                    try {
                        const element = await activityPage.waitForSelector(testSelector, { timeout: 2000 }).catch(() => null)
                        if (element) {
                            elementExists = true
                            foundSelector = testSelector
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity element with selector: ${testSelector}`)
                            break
                        }
                    } catch {
                        continue
                    }
                }
                
                if (!elementExists) {
                    // 记录更详细的信息帮助调试
                    this.bot.log(this.bot.isMobile, 'ACTIVITY', `Activity "${activity.title}" skipped - element not found`, 'warn')
                    this.bot.log(this.bot.isMobile, 'ACTIVITY-DEBUG', `Tried selectors for: offerId="${activity.offerId}", name="${activity.name}"`, 'warn')
                    
                    // 如果是日文活动，可能需要特殊处理
                    if (activity.title && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(activity.title)) {
                        this.bot.log(this.bot.isMobile, 'ACTIVITY-DEBUG', 'This appears to be a Japanese activity, may require special handling', 'warn')
                    }
                    
                    continue
                }

                // 使用找到的选择器
                selector = foundSelector

                switch (activity.promotionType) {
                    // Quiz (Poll, Quiz or ABC)
                    case 'quiz':
                        switch (activity.pointProgressMax) {
                            // Poll or ABC (Usually 10 points)
                            case 10:
                                // Normal poll
                                if (activity.destinationUrl.toLowerCase().includes('pollscenarioid')) {
                                    this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity type: "Poll" title: "${activity.title}"`)
                                    await activityPage.click(selector, { timeout: 10000 })
                                    try {
                                        activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                                    } catch (tabError) {
                                        this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab after click: ${tabError}`, 'warn')
                                    }
                                    await this.bot.activities.doPoll(activityPage)
                                } else { // ABC
                                    this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity type: "ABC" title: "${activity.title}"`)
                                    await activityPage.click(selector, { timeout: 10000 })
                                    try {
                                        activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                                    } catch (tabError) {
                                        this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab after click: ${tabError}`, 'warn')
                                    }
                                    await this.bot.activities.doABC(activityPage)
                                }
                                break

                            // This Or That Quiz (Usually 50 points)
                            case 50:
                                this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity type: "ThisOrThat" title: "${activity.title}"`)
                                await activityPage.click(selector, { timeout: 10000 })
                                try {
                                    activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                                } catch (tabError) {
                                    this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab after click: ${tabError}`, 'warn')
                                }
                                await this.bot.activities.doThisOrThat(activityPage)
                                break

                            // Quizzes are usually 30-40 points
                            default:
                                this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity type: "Quiz" title: "${activity.title}"`)
                                await activityPage.click(selector, { timeout: 10000 })
                                try {
                                    activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                                } catch (tabError) {
                                    this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab after click: ${tabError}`, 'warn')
                                }
                                await this.bot.activities.doQuiz(activityPage)
                                break
                        }
                        break

                    // UrlReward (Visit)
                    case 'urlreward':
                        // Search on Bing are subtypes of "urlreward"
                        if (activity.name.toLowerCase().includes('exploreonbing')) {
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity type: "SearchOnBing" title: "${activity.title}"`)
                            await activityPage.click(selector, { timeout: 10000 })
                            try {
                                activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                            } catch (tabError) {
                                this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab after click: ${tabError}`, 'warn')
                            }
                            await this.bot.activities.doSearchOnBing(activityPage, activity)

                        } else {
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', `Found activity type: "UrlReward" title: "${activity.title}"`)
                            await activityPage.click(selector, { timeout: 10000 })
                            try {
                                activityPage = await this.bot.browser.utils.getLatestTab(activityPage)
                            } catch (tabError) {
                                this.bot.log(this.bot.isMobile, 'ACTIVITY', `Failed to get latest tab after click: ${tabError}`, 'warn')
                            }
                            await this.bot.activities.doUrlReward(activityPage)
                        }
                        break

                    // Unsupported types
                    default:
                        // 检查是否为空字符串类型
                        if (!activity.promotionType || activity.promotionType.trim() === '') {
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', `Skipped activity "${activity.title}" | Reason: Empty promotion type detected. This may be a new activity type or data parsing issue.`, 'warn')
                            // 记录更多调试信息
                            this.bot.log(this.bot.isMobile, 'ACTIVITY-DEBUG', `Activity details - Name: "${activity.name}", OfferId: "${activity.offerId}", ActivityType: "${activity.activityType}", PromotionSubtype: "${activity.promotionSubtype}"`, 'warn')
                        } else {
                            this.bot.log(this.bot.isMobile, 'ACTIVITY', `Skipped activity "${activity.title}" | Reason: Unsupported type: "${activity.promotionType}"!`, 'warn')
                        }
                        break
                }

                // Cooldown
                await this.bot.utils.wait(2000)

            } catch (error) {
                this.bot.log(this.bot.isMobile, 'ACTIVITY', 'An error occurred:' + error, 'error')
            }

        }
    }

}