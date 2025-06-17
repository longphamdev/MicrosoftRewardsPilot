import { Page } from 'rebrowser-playwright'
import readline from 'readline'
import * as crypto from 'crypto'
import { AxiosRequestConfig } from 'axios'

import { MicrosoftRewardsBot } from '../index'
import { saveSessionData } from '../util/Load'

import { OAuth } from '../interface/OAuth'


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

export class Login {
    private bot: MicrosoftRewardsBot
    private clientId: string = '0000000040170455'
    private authBaseUrl: string = 'https://login.live.com/oauth20_authorize.srf'
    private redirectUrl: string = 'https://login.live.com/oauth20_desktop.srf'
    private tokenUrl: string = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token'
    private scope: string = 'service::prod.rewardsplatform.microsoft.com::MBI_SSL'

    constructor(bot: MicrosoftRewardsBot) {
        this.bot = bot
    }

    async login(page: Page, email: string, password: string) {

        try {
            this.bot.log(this.bot.isMobile, 'LOGIN', 'Starting login process!')

            // Navigate to the Bing login page
            await page.goto('https://rewards.bing.com/signin')

            await page.waitForLoadState('domcontentloaded').catch(() => { })

            await this.bot.browser.utils.reloadBadPage(page)

            // Check if account is locked
            await this.checkAccountLocked(page)

            const isLoggedIn = await page.waitForSelector('html[data-role-name="RewardsPortal"]', { timeout: 10000 }).then(() => true).catch(() => false)

            if (!isLoggedIn) {
                await this.execLogin(page, email, password)
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Logged into Microsoft successfully')
            } else {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Already logged in')

                // Check if account is locked
                await this.checkAccountLocked(page)
            }

            // Check if logged in to bing
            await this.checkBingLogin(page)

            // Save session
            await saveSessionData(this.bot.config.sessionPath, page.context(), email, this.bot.isMobile)

            // We're done logging in
            this.bot.log(this.bot.isMobile, 'LOGIN', 'Logged in successfully, saved login session!')

        } catch (error) {
            // Throw and don't continue
            throw this.bot.log(this.bot.isMobile, 'LOGIN', 'An error occurred:' + error, 'error')
        }
    }

    private async execLogin(page: Page, email: string, password: string) {
        try {
            await this.enterEmail(page, email)
            await this.bot.utils.wait(2000)
            await this.bot.browser.utils.reloadBadPage(page)
            await this.bot.utils.wait(2000)
            await this.enterPassword(page, password)
            await this.bot.utils.wait(2000)

            // Check if account is locked
            await this.checkAccountLocked(page)

            await this.bot.browser.utils.reloadBadPage(page)
            await this.checkLoggedIn(page)
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN', 'An error occurred: ' + error, 'error')
        }
    }

    private async enterEmail(page: Page, email: string) {
        const emailInputSelector = 'input[type="email"]'

        try {
            // Wait for email field
            const emailField = await page.waitForSelector(emailInputSelector, { state: 'visible', timeout: 2000 }).catch(() => null)
            if (!emailField) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Email field not found', 'warn')
                return
            }

            await this.bot.utils.wait(1000)

            // Check if email is prefilled
            const emailPrefilled = await page.waitForSelector('#userDisplayName', { timeout: 5000 }).catch(() => null)
            if (emailPrefilled) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Email already prefilled by Microsoft')
            } else {
                // Else clear and fill email
                await page.fill(emailInputSelector, '')
                await this.bot.utils.wait(500)
                await page.fill(emailInputSelector, email)
                await this.bot.utils.wait(1000)
            }

            const nextButton = await page.waitForSelector('button[type="submit"]', { timeout: 2000 }).catch(() => null)
            if (nextButton) {
                await nextButton.click()
                await this.bot.utils.wait(2000)
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Email entered successfully')
            } else {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Next button not found after email entry', 'warn')
            }

        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN', `Email entry failed: ${error}`, 'error')
        }
    }

    private async enterPassword(page: Page, password: string) {
        const passwordInputSelector = 'input[type="password"]'
        try {
            const viewFooter = await page.waitForSelector('[data-testid="viewFooter"]', { timeout: 2000 }).catch(() => null)
            if (viewFooter) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Page "Get a code to sign in" found by "viewFooter"')

                const otherWaysButton = await viewFooter.$('span[role="button"]')
                if (otherWaysButton) {
                    await otherWaysButton.click()
                    await this.bot.utils.wait(5000)

                    const secondListItem = page.locator('[role="listitem"]').nth(1)
                    if (await secondListItem.isVisible()) {
                        await secondListItem.click()
                    }

                }
            }

            // Wait for password field
            const passwordField = await page.waitForSelector(passwordInputSelector, { state: 'visible', timeout: 5000 }).catch(() => null)
            if (!passwordField) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Password field not found, possibly 2FA required', 'warn')
                await this.handle2FA(page)
                return
            }

            await this.bot.utils.wait(1000)

            // Clear and fill password
            await page.fill(passwordInputSelector, '')
            await this.bot.utils.wait(500)
            await page.fill(passwordInputSelector, password)
            await this.bot.utils.wait(1000)

            const nextButton = await page.waitForSelector('button[type="submit"]', { timeout: 2000 }).catch(() => null)
            if (nextButton) {
                await nextButton.click()
                await this.bot.utils.wait(2000)
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Password entered successfully')
            } else {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Next button not found after password entry', 'warn')
            }

        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN', `Password entry failed: ${error}`, 'error')
            await this.handle2FA(page)
        }
    }

    private async handle2FA(page: Page) {
        try {
            // 等待页面加载完成
            await this.bot.utils.wait(3000)
            
            // 检查是否有SMS验证选项
            const smsOption = await page.waitForSelector('input[name="otc"]', { state: 'visible', timeout: 3000 }).catch(() => null)
            if (smsOption) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'SMS verification detected')
                await this.authSMSVerification(page)
                return
            }
            
            // 检查是否有邮箱验证选项
            const emailOption = await page.waitForSelector('input[name="proofconfirmation"]', { state: 'visible', timeout: 3000 }).catch(() => null)
            if (emailOption) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Email verification detected - manual intervention required')
                await this.authEmailVerification(page)
                return
            }
            
            // 尝试获取Authenticator App验证码
            const numberToPress = await this.get2FACode(page)
            if (numberToPress) {
                // Authentictor App verification
                await this.authAppVerification(page, numberToPress)
            } else {
                // 如果找不到任何2FA选项，记录详细信息帮助调试
                this.bot.log(this.bot.isMobile, 'LOGIN', 'No 2FA method detected, checking page content...')
                
                // 检查是否已经登录成功
                const isLoggedIn = await page.waitForSelector('html[data-role-name="RewardsPortal"]', { timeout: 5000 }).then(() => true).catch(() => false)
                if (isLoggedIn) {
                    this.bot.log(this.bot.isMobile, 'LOGIN', '2FA not required - already logged in')
                    return
                }
                
                // 记录当前页面URL帮助调试
                const currentUrl = page.url()
                this.bot.log(this.bot.isMobile, 'LOGIN', `Current page URL: ${currentUrl}`)
                
                // 如果在移动端，可能需要特殊处理
                if (this.bot.isMobile) {
                    this.bot.log(this.bot.isMobile, 'LOGIN', 'Mobile 2FA might require manual intervention or OAuth token', 'warn')
                    throw new Error('Mobile 2FA authentication method not supported - OAuth token may be required')
                }
            }
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN', `2FA handling failed: ${error}`, 'error')
            throw error
        }
    }

    private async authEmailVerification(page: Page) {
        this.bot.log(this.bot.isMobile, 'LOGIN', 'Email verification required. Please check your email and enter the code.')
        
        const code = await new Promise<string>((resolve) => {
            rl.question('Enter email verification code:\n', (input) => {
                rl.close()
                resolve(input)
            })
        })

        await page.fill('input[name="proofconfirmation"]', code)
        await page.keyboard.press('Enter')
        this.bot.log(this.bot.isMobile, 'LOGIN', 'Email verification code entered successfully')
    }

    private async get2FACode(page: Page): Promise<string | null> {
        try {
            // 首先等待页面稳定
            await this.bot.utils.wait(2000)
            
            // 检查是否存在认证码按钮，如果存在先点击
            const sendCodeButton = await page.waitForSelector('button[aria-describedby="confirmSendTitle"]', { state: 'visible', timeout: 3000 }).catch(() => null)
            if (sendCodeButton) {
                await sendCodeButton.click()
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Clicked send code button')
                await this.bot.utils.wait(3000)
            }
            
            // 增加超时时间到10秒，并尝试多个选择器
            const selectors = [
                '#displaySign',
                'div[data-testid="displaySign"]>span',
                '[data-testid="displaySign"]',
                'span[aria-label*="verification"]',
                '.display-sign-container span'
            ]
            
            let element = null
            for (const selector of selectors) {
                element = await page.waitForSelector(selector, { state: 'visible', timeout: 3000 }).catch(() => null)
                if (element) {
                    this.bot.log(this.bot.isMobile, 'LOGIN', `Found 2FA code element with selector: ${selector}`)
                    break
                }
            }
            
            if (element) {
                const code = await element.textContent()
                this.bot.log(this.bot.isMobile, 'LOGIN', `2FA code found: ${code}`)
                return code
            }
            
            // 如果找不到验证码显示元素，可能是其他类型的2FA
            this.bot.log(this.bot.isMobile, 'LOGIN', 'No 2FA code display element found, checking for other 2FA methods')
            return null
            
        } catch (error) {
            // 如果是并行模式，处理特殊情况
            if (this.bot.config.parallel) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Script running in parallel, can only send 1 2FA request per account at a time!', 'log', 'yellow')
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Trying again in 60 seconds! Please wait...', 'log', 'yellow')

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const button = await page.waitForSelector('button[aria-describedby="pushNotificationsTitle errorDescription"]', { state: 'visible', timeout: 2000 }).catch(() => null)
                    if (button) {
                        await this.bot.utils.wait(60000)
                        await button.click()
                        continue
                    } else {
                        break
                    }
                }
                
                // 重试获取验证码
                return await this.get2FACode(page)
            }
            
            this.bot.log(this.bot.isMobile, 'LOGIN', `Failed to get 2FA code: ${error}`)
            return null
        }
    }

    private async authAppVerification(page: Page, numberToPress: string | null) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                this.bot.log(this.bot.isMobile, 'LOGIN', `Press the number ${numberToPress} on your Authenticator app to approve the login`)
                this.bot.log(this.bot.isMobile, 'LOGIN', 'If you press the wrong number or the "DENY" button, try again in 60 seconds')

                await page.waitForSelector('form[name="f1"]', { state: 'detached', timeout: 60000 })

                this.bot.log(this.bot.isMobile, 'LOGIN', 'Login successfully approved!')
                break
            } catch {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'The code is expired. Trying to get a new code...')
                await page.click('button[aria-describedby="pushNotificationsTitle errorDescription"]')
                numberToPress = await this.get2FACode(page)
            }
        }
    }

    private async authSMSVerification(page: Page) {
        this.bot.log(this.bot.isMobile, 'LOGIN', 'SMS 2FA code required. Waiting for user input...')

        const code = await new Promise<string>((resolve) => {
            rl.question('Enter 2FA code:\n', (input) => {
                rl.close()
                resolve(input)
            })
        })

        await page.fill('input[name="otc"]', code)
        await page.keyboard.press('Enter')
        this.bot.log(this.bot.isMobile, 'LOGIN', '2FA code entered successfully')
    }

    async getMobileAccessToken(page: Page, email: string) {
        const authorizeUrl = new URL(this.authBaseUrl)

        authorizeUrl.searchParams.append('response_type', 'code')
        authorizeUrl.searchParams.append('client_id', this.clientId)
        authorizeUrl.searchParams.append('redirect_uri', this.redirectUrl)
        authorizeUrl.searchParams.append('scope', this.scope)
        authorizeUrl.searchParams.append('state', crypto.randomBytes(16).toString('hex'))
        authorizeUrl.searchParams.append('access_type', 'offline_access')
        authorizeUrl.searchParams.append('login_hint', email)

        await page.goto(authorizeUrl.href)

        let currentUrl = new URL(page.url())
        let code: string

        this.bot.log(this.bot.isMobile, 'LOGIN-APP', 'Waiting for authorization...')
        
        // 添加超时机制 - 最多等待30秒
        const startTime = Date.now()
        const timeout = 30000 // 30 seconds
        
        // eslint-disable-next-line no-constant-condition
        while (true) {
            // 检查是否超时
            if (Date.now() - startTime > timeout) {
                this.bot.log(this.bot.isMobile, 'LOGIN-APP', 'OAuth authorization timeout after 30 seconds', 'warn')
                throw new Error('OAuth authorization timeout - user interaction required')
            }
            
            currentUrl = new URL(page.url())
            
            if (currentUrl.hostname === 'login.live.com' && currentUrl.pathname === '/oauth20_desktop.srf') {
                code = currentUrl.searchParams.get('code')!
                break
            }

            await this.bot.utils.wait(2000) // 减少等待间隔从5秒到2秒，提高响应速度
        }

        const body = new URLSearchParams()
        body.append('grant_type', 'authorization_code')
        body.append('client_id', this.clientId)
        body.append('code', code)
        body.append('redirect_uri', this.redirectUrl)

        const tokenRequest: AxiosRequestConfig = {
            url: this.tokenUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: body.toString()
        }

        const tokenResponse = await this.bot.axios.request(tokenRequest)
        const tokenData: OAuth = await tokenResponse.data

        this.bot.log(this.bot.isMobile, 'LOGIN-APP', 'Successfully authorized')
        return tokenData.access_token
    }

    // Utils

    private async checkLoggedIn(page: Page) {
        const targetHostname = 'rewards.bing.com'
        const targetPathname = '/'

        // eslint-disable-next-line no-constant-condition
        while (true) {
            await this.dismissLoginMessages(page)
            const currentURL = new URL(page.url())
            if (currentURL.hostname === targetHostname && currentURL.pathname === targetPathname) {
                break
            }
        }

        // Wait for login to complete
        await page.waitForSelector('html[data-role-name="RewardsPortal"]', { timeout: 10000 })
        this.bot.log(this.bot.isMobile, 'LOGIN', 'Successfully logged into the rewards portal')
    }

    private async dismissLoginMessages(page: Page) {
        // Use Passekey
        if (await page.waitForSelector('[data-testid="biometricVideo"]', { timeout: 2000 }).catch(() => null)) {
            const skipButton = await page.$('[data-testid="secondaryButton"]')
            if (skipButton) {
                await skipButton.click()
                this.bot.log(this.bot.isMobile, 'DISMISS-ALL-LOGIN-MESSAGES', 'Dismissed "Use Passekey" modal')
                await page.waitForTimeout(500)
            }
        }

        // Use Keep me signed in
        if (await page.waitForSelector('[data-testid="kmsiVideo"]', { timeout: 2000 }).catch(() => null)) {
            const yesButton = await page.$('[data-testid="primaryButton"]')
            if (yesButton) {
                await yesButton.click()
                this.bot.log(this.bot.isMobile, 'DISMISS-ALL-LOGIN-MESSAGES', 'Dismissed "Keep me signed in" modal')
                await page.waitForTimeout(500)
            }
        }

    }

    private async checkBingLogin(page: Page): Promise<void> {
        try {
            this.bot.log(this.bot.isMobile, 'LOGIN-BING', 'Verifying Bing login')
            await page.goto('https://www.bing.com/fd/auth/signin?action=interactive&provider=windows_live_id&return_url=https%3A%2F%2Fwww.bing.com%2F')

            const maxIterations = 5

            for (let iteration = 1; iteration <= maxIterations; iteration++) {
                const currentUrl = new URL(page.url())

                if (currentUrl.hostname === 'www.bing.com' && currentUrl.pathname === '/') {
                    await this.bot.browser.utils.tryDismissAllMessages(page)

                    const loggedIn = await this.checkBingLoginStatus(page)
                    // If mobile browser, skip this step
                    if (loggedIn || this.bot.isMobile) {
                        this.bot.log(this.bot.isMobile, 'LOGIN-BING', 'Bing login verification passed!')
                        break
                    }
                }

                await this.bot.utils.wait(1000)
            }

        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN-BING', 'An error occurred:' + error, 'error')
        }
    }

    private async checkBingLoginStatus(page: Page): Promise<boolean> {
        try {
            await page.waitForSelector('#id_n', { timeout: 5000 })
            return true
        } catch (error) {
            return false
        }
    }

    private async checkAccountLocked(page: Page) {
        await this.bot.utils.wait(2000)
        const isLocked = await page.waitForSelector('#serviceAbuseLandingTitle', { state: 'visible', timeout: 1000 }).then(() => true).catch(() => false)
        if (isLocked) {
            throw this.bot.log(this.bot.isMobile, 'CHECK-LOCKED', 'This account has been locked! Remove the account from "accounts.json" and restart!', 'error')
        }
    }
}