import { Page } from 'rebrowser-playwright'
import { load } from 'cheerio'

import { MicrosoftRewardsBot } from '../index'


export default class BrowserUtil {
    private bot: MicrosoftRewardsBot
    private dismissCallCount: Map<string, number>

    constructor(bot: MicrosoftRewardsBot) {
        this.bot = bot
        this.dismissCallCount = new Map<string, number>()
    }

    async tryDismissAllMessages(page: Page): Promise<boolean> {
        // 定义按钮类型
        type DismissButton = {
            selector: string
            label: string
            isXPath?: boolean
            priority?: 'low' | 'normal' | 'high'
        }

        // 分别定义Mobile和Desktop的按钮列表
        const commonButtons: DismissButton[] = [
            { selector: '#acceptButton', label: 'AcceptButton' },
            { selector: '.ext-secondary.ext-button', label: '"Skip for now" Button' },
            { selector: '#iLandingViewAction', label: 'iLandingViewAction' },
            { selector: '#iShowSkip', label: 'iShowSkip' },
            { selector: '#iNext', label: 'iNext' },
            { selector: '#iLooksGood', label: 'iLooksGood' },
            { selector: '#idSIButton9', label: 'idSIButton9' },
            { selector: '//div[@id="cookieConsentContainer"]//button[contains(text(), "Accept")]', label: 'Accept Cookie Consent Container', isXPath: true },
            { selector: '#bnp_btn_accept', label: 'Bing Cookie Banner' },
            { selector: '#reward_pivot_earn', label: 'Reward Coupon Accept' }
        ]

        const mobileSpecificButtons: DismissButton[] = [
            { selector: '.c-glyph.glyph-cancel', label: 'Mobile Welcome Button' },
            { selector: '.maybe-later', label: 'Mobile Rewards App Banner' },
            { selector: 'button[aria-label*="Close"]', label: 'Mobile Close Button' },
            { selector: 'button[aria-label*="Dismiss"]', label: 'Mobile Dismiss Button' },
            { selector: '.ms-Button.ms-Button--primary:not([type="submit"])', label: 'Primary Button (not submit)' }
        ]

        const desktopSpecificButtons: DismissButton[] = [
            { selector: 'button[type="submit"]:not(form button)', label: 'Submit Button (not in form)', priority: 'low' },
            { selector: '.ms-Button.ms-Button--primary', label: 'Primary Button' }
        ]

        // 根据平台选择按钮列表
        const buttons = this.bot.isMobile 
            ? [...commonButtons, ...mobileSpecificButtons]
            : [...commonButtons, ...desktopSpecificButtons]

        // 调用计数器已在构造函数中初始化
        
        const dismissTasks = buttons.map(async (button) => {
            try {
                // 检查这个按钮是否已经被点击过多次
                const callKey = `${this.bot.isMobile ? 'mobile' : 'desktop'}-${button.selector}`
                const callCount = this.dismissCallCount.get(callKey) || 0
                
                // 对于低优先级按钮（如submit按钮），限制点击次数
                const maxClicks = button.priority === 'low' ? 2 : 5
                if (callCount >= maxClicks) {
                    this.bot.log(this.bot.isMobile, 'DISMISS-ALL-MESSAGES', `Skipping ${button.label} (clicked ${callCount} times already)`, 'warn')
                    return false
                }

                const element = button.isXPath
                    ? page.locator(`xpath=${button.selector}`)
                    : page.locator(button.selector)

                if (await element.first().isVisible({ timeout: 1000 })) {
                    // 对于表单submit按钮，增加额外验证
                    if (button.selector.includes('submit')) {
                        // 检查是否在表单内部，如果是则跳过
                        const isInForm = await element.first().evaluate(el => {
                            return !!el.closest('form')
                        }).catch(() => false)
                        
                        if (isInForm) {
                            this.bot.log(this.bot.isMobile, 'DISMISS-ALL-MESSAGES', `Skipping ${button.label} (inside form)`, 'warn')
                            return false
                        }
                    }

                    await element.first().click({ timeout: 1000 })
                    await page.waitForTimeout(500)
                    
                    // 更新点击计数
                    this.dismissCallCount.set(callKey, callCount + 1)
                    
                    this.bot.log(this.bot.isMobile, 'DISMISS-ALL-MESSAGES', `Dismissed: ${button.label} (count: ${callCount + 1})`)
                    return true
                }
                         } catch (error) {
                 // 静默处理错误，避免日志过多
                 // 如果需要调试，可以在这里记录错误信息
             }
            return false
        })

        const results = await Promise.allSettled(dismissTasks)
        const dismissed = results.some(result => result.status === 'fulfilled' && result.value === true)
        
        // 如果没有关闭任何消息，重置计数器（可能页面已刷新）
        if (!dismissed && this.dismissCallCount.size > 0) {
            this.bot.log(this.bot.isMobile, 'DISMISS-ALL-MESSAGES', 'No messages dismissed, resetting counters')
            this.dismissCallCount.clear()
        }
        
        return dismissed
    }

    async getLatestTab(page: Page): Promise<Page> {
        try {
            await this.bot.utils.wait(1000)

            const browser = page.context()
            const pages = browser.pages()
            const newTab = pages[pages.length - 1]

            if (newTab) {
                return newTab
            }

            throw this.bot.log(this.bot.isMobile, 'GET-NEW-TAB', 'Unable to get latest tab', 'error')
        } catch (error) {
            throw this.bot.log(this.bot.isMobile, 'GET-NEW-TAB', 'An error occurred:' + error, 'error')
        }
    }

    async getTabs(page: Page) {
        try {
            const browser = page.context()
            const pages = browser.pages()

            const homeTab = pages[1]
            let homeTabURL: URL

            if (!homeTab) {
                throw this.bot.log(this.bot.isMobile, 'GET-TABS', 'Home tab could not be found!', 'error')

            } else {
                homeTabURL = new URL(homeTab.url())

                if (homeTabURL.hostname !== 'rewards.bing.com') {
                    throw this.bot.log(this.bot.isMobile, 'GET-TABS', 'Reward page hostname is invalid: ' + homeTabURL.host, 'error')
                }
            }

            const workerTab = pages[2]
            if (!workerTab) {
                throw this.bot.log(this.bot.isMobile, 'GET-TABS', 'Worker tab could not be found!', 'error')
            }

            return {
                homeTab: homeTab,
                workerTab: workerTab
            }

        } catch (error) {
            throw this.bot.log(this.bot.isMobile, 'GET-TABS', 'An error occurred:' + error, 'error')
        }
    }

    async reloadBadPage(page: Page): Promise<void> {
        try {
            const html = await page.content().catch(() => '')
            const $ = load(html)

            const isNetworkError = $('body.neterror').length

            if (isNetworkError) {
                this.bot.log(this.bot.isMobile, 'RELOAD-BAD-PAGE', 'Bad page detected, reloading!')
                await page.reload()
            }

        } catch (error) {
            throw this.bot.log(this.bot.isMobile, 'RELOAD-BAD-PAGE', 'An error occurred:' + error, 'error')
        }
    }

}