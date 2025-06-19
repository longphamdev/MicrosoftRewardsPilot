import axios from 'axios'
import { BrowserFingerprintWithHeaders } from 'fingerprint-generator'

import { log } from './Logger'

import { ChromeVersion, EdgeVersion } from '../interface/UserAgentUtil'

const NOT_A_BRAND_VERSION = '99'

export async function getUserAgent(isMobile: boolean) {
    const system = getSystemComponents(isMobile)
    const app = await getAppComponents(isMobile)

    const uaTemplate = isMobile ?
        `Mozilla/5.0 (Linux; ${system}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${app.chrome_reduced_version} Mobile Safari/537.36 EdgA/${app.edge_version}` :
        `Mozilla/5.0 (${system}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${app.chrome_reduced_version} Safari/537.36 Edg/${app.edge_version}`

    const platformVersion = `${isMobile ? Math.floor(Math.random() * 5) + 9 : Math.floor(Math.random() * 15) + 1}.0.0`

    const uaMetadata = {
        isMobile,
        platform: isMobile ? 'Android' : 'Windows',
        fullVersionList: [
            { brand: 'Not/A)Brand', version: `${NOT_A_BRAND_VERSION}.0.0.0` },
            { brand: 'Microsoft Edge', version: app['edge_version'] },
            { brand: 'Chromium', version: app['chrome_version'] }
        ],
        brands: [
            { brand: 'Not/A)Brand', version: NOT_A_BRAND_VERSION },
            { brand: 'Microsoft Edge', version: app['edge_major_version'] },
            { brand: 'Chromium', version: app['chrome_major_version'] }
        ],
        platformVersion,
        architecture: isMobile ? '' : 'x86',
        bitness: isMobile ? '' : '64',
        model: ''
    }

    return { userAgent: uaTemplate, userAgentMetadata: uaMetadata }
}

export async function getChromeVersion(isMobile: boolean): Promise<string> {
    try {
        const request = {
            url: 'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const response = await axios(request)
        const data: ChromeVersion = response.data
        return data.channels.Stable.version

    } catch (error) {
        throw log(isMobile, 'USERAGENT-CHROME-VERSION', 'An error occurred:' + error, 'error')
    }
}

export async function getEdgeVersions(isMobile: boolean) {
    try {
        const request = {
            url: 'https://edgeupdates.microsoft.com/api/products',
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }

        const response = await axios(request)
        const data: EdgeVersion[] = response.data
        const stable = data.find(x => x.Product == 'Stable') as EdgeVersion
        return {
            android: stable.Releases.find(x => x.Platform == 'Android')?.ProductVersion,
            windows: stable.Releases.find(x => (x.Platform == 'Windows' && x.Architecture == 'x64'))?.ProductVersion
        }


    } catch (error) {
        throw log(isMobile, 'USERAGENT-EDGE-VERSION', 'An error occurred:' + error, 'error')
    }
}

export function getSystemComponents(mobile: boolean): string {
    if (mobile) {
        // 更多样化的 Android 版本和设备信息
        const androidVersions = [
            'Android 12', 'Android 13', 'Android 14', 'Android 15'
        ]
        const deviceModels = [
            'SM-G991B', 'SM-G998B', 'SM-S918B', 'SM-A525F', 'SM-A736B',
            'Pixel 6', 'Pixel 7', 'Pixel 8', 'Pixel 9',
            'ONEPLUS A6000', 'ONEPLUS GM1913', 'ONEPLUS KB2000',
            'LM-G900', 'LM-V600', 'LM-Q730',
            'M2012K11AG', 'M2101K6G', 'M2103K19G'
        ]
        
        const selectedVersion = androidVersions[Math.floor(Math.random() * androidVersions.length)]
        const selectedModel = deviceModels[Math.floor(Math.random() * deviceModels.length)]
        
        return `${selectedVersion}; ${selectedModel}`
    } else {
        // 修复桌面端系统组件顺序：应该是 "Windows NT 10.0; Win64; x64"
        return 'Windows NT 10.0; Win64; x64'
    }
}

export async function getAppComponents(isMobile: boolean) {
    const versions = await getEdgeVersions(isMobile)
    const edgeVersion = isMobile ? versions.android : versions.windows as string
    const edgeMajorVersion = edgeVersion?.split('.')[0]

    const chromeVersion = await getChromeVersion(isMobile)
    const chromeMajorVersion = chromeVersion?.split('.')[0]
    const chromeReducedVersion = `${chromeMajorVersion}.0.0.0`

    return {
        not_a_brand_version: `${NOT_A_BRAND_VERSION}.0.0.0`,
        not_a_brand_major_version: NOT_A_BRAND_VERSION,
        edge_version: edgeVersion as string,
        edge_major_version: edgeMajorVersion as string,
        chrome_version: chromeVersion as string,
        chrome_major_version: chromeMajorVersion as string,
        chrome_reduced_version: chromeReducedVersion as string
    }
}

export async function updateFingerprintUserAgent(fingerprint: BrowserFingerprintWithHeaders, isMobile: boolean): Promise<BrowserFingerprintWithHeaders> {
    try {
        const userAgentData = await getUserAgent(isMobile)
        const componentData = await getAppComponents(isMobile)

        //@ts-expect-error Errors due it not exactly matching
        fingerprint.fingerprint.navigator.userAgentData = userAgentData.userAgentMetadata
        fingerprint.fingerprint.navigator.userAgent = userAgentData.userAgent
        fingerprint.fingerprint.navigator.appVersion = userAgentData.userAgent.replace(`${fingerprint.fingerprint.navigator.appCodeName}/`, '')

        fingerprint.headers['user-agent'] = userAgentData.userAgent
        fingerprint.headers['sec-ch-ua'] = `"Microsoft Edge";v="${componentData.edge_major_version}", "Not=A?Brand";v="${componentData.not_a_brand_major_version}", "Chromium";v="${componentData.chrome_major_version}"`
        fingerprint.headers['sec-ch-ua-full-version-list'] = `"Microsoft Edge";v="${componentData.edge_version}", "Not=A?Brand";v="${componentData.not_a_brand_version}", "Chromium";v="${componentData.chrome_version}"`

        /*
        Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36 EdgA/129.0.0.0
        sec-ch-ua-full-version-list: "Microsoft Edge";v="129.0.2792.84", "Not=A?Brand";v="8.0.0.0", "Chromium";v="129.0.6668.90"
        sec-ch-ua: "Microsoft Edge";v="129", "Not=A?Brand";v="8", "Chromium";v="129"

        Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36
        "Google Chrome";v="129.0.6668.90", "Not=A?Brand";v="8.0.0.0", "Chromium";v="129.0.6668.90"
        */

        return fingerprint
    } catch (error) {
        throw log(isMobile, 'USER-AGENT-UPDATE', 'An error occurred:' + error, 'error')
    }
}