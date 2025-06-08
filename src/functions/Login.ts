import { Page } from 'rebrowser-playwright'
import readline from 'readline'
import * as crypto from 'crypto'
import { AxiosRequestConfig } from 'axios'

import { MicrosoftRewardsBot } from '../index'
import { saveSessionData } from '../util/Load'

import { OAuth } from '../interface/OAuth'
import { TwoFactorAuthRequiredError, AccountLockedError } from '../interface/Errors'


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
            // 如果是2FA错误，直接重新抛出，不要转换为一般错误
            if (error instanceof TwoFactorAuthRequiredError || error instanceof AccountLockedError) {
                throw error
            }
            
            // 其他错误记录日志并重新抛出
            this.bot.log(this.bot.isMobile, 'LOGIN', 'An error occurred:' + error, 'error')
            throw error
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
            // Wait for password field
            const passwordField = await page.waitForSelector(passwordInputSelector, { state: 'visible', timeout: 5000 }).catch(() => null)
            if (!passwordField) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Password field not found, 2FA authentication required', 'warn')
                // 对于Mobile端，直接抛出2FA错误而不尝试处理
                if (this.bot.isMobile) {
                    throw new TwoFactorAuthRequiredError('Mobile login requires 2FA - skipping mobile tasks for this account')
                }
                // Desktop端尝试处理2FA
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
                
                // 检查是否需要2FA验证
                await this.bot.utils.wait(3000)
                const is2FARequired = await this.check2FARequired(page)
                if (is2FARequired) {
                    this.bot.log(this.bot.isMobile, 'LOGIN', '2FA verification required after password entry', 'warn')
                    if (this.bot.isMobile) {
                        throw new TwoFactorAuthRequiredError('Mobile login requires 2FA after password - skipping mobile tasks for this account')
                    }
                    await this.handle2FA(page)
                }
            } else {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Next button not found after password entry', 'warn')
            }

        } catch (error) {
            // 如果已经是TwoFactorAuthRequiredError，直接重新抛出
            if (error instanceof TwoFactorAuthRequiredError) {
                throw error
            }
            
            this.bot.log(this.bot.isMobile, 'LOGIN', `Password entry failed: ${error}`, 'error')
            
            // 检查是否是2FA相关错误
            const is2FAError = await this.check2FARequired(page)
            if (is2FAError) {
                if (this.bot.isMobile) {
                    throw new TwoFactorAuthRequiredError('Mobile login encountered 2FA requirement - skipping mobile tasks for this account')
                }
                await this.handle2FA(page)
            } else {
                throw error
            }
        }
    }


    /**
     * 检查页面是否需要2FA认证
     */
    private async check2FARequired(page: Page): Promise<boolean> {
        try {
            // 检查常见的2FA页面元素（包含新登录页面的选择器）
            const twoFactorSelectors = [
                '#displaySign', // 认证器应用数字显示（旧版）
                'div[data-testid="displaySign"]>span', // 认证器应用数字显示（新版）
                '.ext-sign-display-number', // 外部认证显示数字
                '[data-testid="auth-app-display-number"]', // 认证应用显示数字
                'input[name="otc"]', // SMS验证码输入框
                'button[aria-describedby="confirmSendTitle"]', // 发送验证码按钮
                'button[aria-describedby="pushNotificationsTitle"]', // 推送通知按钮
                'button[data-testid="send-auth-code"]', // 发送认证码按钮（新版）
                '#idDiv_SAOTCS_Proofs', // 2FA选择页面
                '.table-row.highlighted-row', // 2FA方法选择
                '[data-testid="selectedVerificationMethod"]', // 选中的验证方法
                '.ext-identity-proof-tile', // 验证方法磁贴
                'form[name="f1"]', // 新登录页面的表单
                '.ext-button.ext-primary', // 外部主要按钮
                '[data-testid="2fa-container"]', // 2FA容器
                '.ms-Stack-inner' // Microsoft Stack容器（可能包含2FA元素）
            ]

            for (const selector of twoFactorSelectors) {
                const element = await page.waitForSelector(selector, { timeout: 1000 }).catch(() => null)
                if (element && await element.isVisible()) {
                    this.bot.log(this.bot.isMobile, 'LOGIN-2FA-CHECK', `2FA element detected: ${selector}`, 'warn')
                    return true
                }
            }

            // 检查URL是否包含2FA相关路径
            const currentUrl = page.url()
            const twoFactorUrlPatterns = [
                '/kmsi',
                '/proofs/add',
                '/proofs/lookup',
                '/mfasetup',
                '/twofactor',
                '/adfs/ls/idpinitiatedsignon',
                '/authenticate', // 新的认证路径
                '/verify', // 验证路径
                '/challenge' // 挑战路径
            ]

            for (const pattern of twoFactorUrlPatterns) {
                if (currentUrl.toLowerCase().includes(pattern)) {
                    this.bot.log(this.bot.isMobile, 'LOGIN-2FA-CHECK', `2FA URL pattern detected: ${pattern}`, 'warn')
                    return true
                }
            }

            // 检查页面文本内容是否包含2FA相关关键词
            try {
                const pageText = await page.textContent('body')
                const twoFactorKeywords = [
                    'two-factor',
                    'authenticator',
                    'verification code',
                    'confirm your identity',
                    'additional security',
                    'enter the number'
                ]

                for (const keyword of twoFactorKeywords) {
                    if (pageText && pageText.toLowerCase().includes(keyword)) {
                        this.bot.log(this.bot.isMobile, 'LOGIN-2FA-CHECK', `2FA keyword detected: ${keyword}`, 'warn')
                        return true
                    }
                }
            } catch {
                // 如果无法获取页面文本，忽略关键词检查
            }

            return false
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN-2FA-CHECK', `Error checking 2FA requirement: ${error}`, 'error')
            return false
        }
    }

    private async handle2FA(page: Page) {
        try {
            this.bot.log(this.bot.isMobile, 'LOGIN-2FA', 'Attempting to handle 2FA authentication for Desktop', 'warn')
            
            const numberToPress = await this.get2FACode(page)
            if (numberToPress) {
                // Authentictor App verification
                await this.authAppVerification(page, numberToPress)
            } else {
                // SMS verification
                await this.authSMSVerification(page)
            }
        } catch (error) {
            this.bot.log(this.bot.isMobile, 'LOGIN-2FA', `2FA handling failed: ${error}`, 'error')
            // 如果Desktop端2FA也失败，抛出错误
            throw new TwoFactorAuthRequiredError(`Desktop 2FA authentication failed: ${error}`)
        }
    }

    private async get2FACode(page: Page): Promise<string | null> {
        try {
            // 尝试多种可能的认证器代码显示元素（适配新的登录页面）
            const codeSelectors = [
                '#displaySign',
                'div[data-testid="displaySign"]>span',
                '.ext-sign-display-number',
                '[data-testid="auth-app-display-number"]'
            ]
            
            for (const selector of codeSelectors) {
                try {
                    const element = await page.waitForSelector(selector, { state: 'visible', timeout: 2000 })
                    const code = await element.textContent()
                    if (code && code.trim()) {
                        this.bot.log(this.bot.isMobile, 'LOGIN-2FA', `Found authenticator code: ${code} (using selector: ${selector})`)
                        return code.trim()
                    }
                } catch {
                    continue // 尝试下一个选择器
                }
            }
        } catch {
            // 如果没有找到认证器代码，尝试触发发送验证码
            this.bot.log(this.bot.isMobile, 'LOGIN-2FA', 'Authenticator code not found, trying to send verification code')
            
            // 并行模式下的特殊处理
            if (this.bot.config.parallel) {
                this.bot.log(this.bot.isMobile, 'LOGIN-2FA', 'Script running in parallel mode, handling 2FA request carefully', 'warn')
                this.bot.log(this.bot.isMobile, 'LOGIN-2FA', 'Waiting for 2FA to be available...', 'log', 'yellow')

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const busyButton = await page.waitForSelector('button[aria-describedby="pushNotificationsTitle errorDescription"]', { state: 'visible', timeout: 2000 }).catch(() => null)
                    if (busyButton) {
                        await this.bot.utils.wait(60000) // 等待60秒
                        await busyButton.click()
                        continue
                    } else {
                        break
                    }
                }
            }
            
            try {
                // 尝试多种发送验证码按钮
                const sendButtons = [
                    'button[aria-describedby="confirmSendTitle"]',
                    'button[data-testid="send-auth-code"]',
                    '.ext-button.ext-primary'
                ]
                
                let buttonClicked = false
                for (const buttonSelector of sendButtons) {
                    try {
                        await page.click(buttonSelector)
                        buttonClicked = true
                        this.bot.log(this.bot.isMobile, 'LOGIN-2FA', `Clicked send button: ${buttonSelector}`)
                        break
                    } catch {
                        continue
                    }
                }
                
                if (!buttonClicked) {
                    this.bot.log(this.bot.isMobile, 'LOGIN-2FA', 'No send button found', 'warn')
                }
                
                await this.bot.utils.wait(3000)
                
                // 再次尝试获取认证器代码
                const codeSelectors = [
                    '#displaySign', 
                    'div[data-testid="displaySign"]>span',
                    '.ext-sign-display-number'
                ]
                
                for (const selector of codeSelectors) {
                    try {
                        const element = await page.waitForSelector(selector, { state: 'visible', timeout: 5000 })
                        const code = await element.textContent()
                        if (code && code.trim()) {
                            this.bot.log(this.bot.isMobile, 'LOGIN-2FA', `Found authenticator code after send: ${code}`)
                            return code.trim()
                        }
                    } catch {
                        continue
                    }
                }
            } catch (error) {
                this.bot.log(this.bot.isMobile, 'LOGIN-2FA', `Failed to get 2FA code: ${error}`, 'error')
            }
        }
        
        return null
    }

    private async authAppVerification(page: Page, numberToPress: string | null) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                this.bot.log(this.bot.isMobile, 'LOGIN', `Press the number ${numberToPress} on your Authenticator app to approve the login`)
                this.bot.log(this.bot.isMobile, 'LOGIN', 'If you press the wrong number or the "DENY" button, try again in 60 seconds')

                // 更新选择器以适配新的登录页面 - 使用form[name="f1"]代替#i0281
                await page.waitForSelector('form[name="f1"]', { state: 'detached', timeout: 60000 })

                this.bot.log(this.bot.isMobile, 'LOGIN', 'Login successfully approved!')
                break
            } catch {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'The code is expired. Trying to get a new code...')
                await page.click('button[aria-describedby="pushNotificationsTitle errorDescription"]').catch(() => {
                    // 如果找不到按钮，尝试其他重新发送按钮
                    this.bot.log(this.bot.isMobile, 'LOGIN-2FA', 'Primary retry button not found, trying alternative', 'warn')
                })
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

    private async checkLoggedIn(page: Page) {
        const targetHostname = 'rewards.bing.com'
        const targetPathname = '/'

        // 添加超时机制，最多等待30秒
        const startTime = Date.now()
        const timeout = 30000 // 30 seconds
        
        while (true) {
            // 检查是否超时
            if (Date.now() - startTime > timeout) {
                this.bot.log(this.bot.isMobile, 'LOGIN', 'Timeout waiting for rewards portal redirect, attempting to navigate manually', 'warn')
                // 手动跳转到rewards页面
                await page.goto('https://rewards.bing.com/')
                break
            }
            
            await this.bot.browser.utils.tryDismissAllMessages(page)
            const currentURL = new URL(page.url())
            if (currentURL.hostname === targetHostname && currentURL.pathname === targetPathname) {
                break
            }
            
            // 添加短暂等待，避免无限循环过于频繁
            await this.bot.utils.wait(1000)
        }

        // Wait for login to complete
        await page.waitForSelector('html[data-role-name="RewardsPortal"]', { timeout: 10000 })
        this.bot.log(this.bot.isMobile, 'LOGIN', 'Successfully logged into the rewards portal')
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
        
        // 添加超时机制 - 最多等待30秒（减少等待时间以避免长时间卡死）
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

    private async checkAccountLocked(page: Page) {
        await this.bot.utils.wait(2000)
        const isLocked = await page.waitForSelector('#serviceAbuseLandingTitle', { state: 'visible', timeout: 1000 }).then(() => true).catch(() => false)
        if (isLocked) {
            const message = 'This account has been locked! Remove the account from "accounts.json" and restart!'
            this.bot.log(this.bot.isMobile, 'CHECK-LOCKED', message, 'error')
            throw new AccountLockedError(message)
        }
    }
}