export interface Config {
    baseURL: string;
    sessionPath: string;
    headless: boolean;
    parallel: boolean;
    runOnZeroPoints: boolean;
    clusters: number;
    saveFingerprint: ConfigSaveFingerprint;
    workers: ConfigWorkers;
    searchOnBingLocalQueries: boolean;
    globalTimeout: string;
    accountDelay?: {
        min: string;
        max: string;
    };
    searchSettings: ConfigSearchSettings;
    logExcludeFunc: string[];
    webhookLogExcludeFunc: string[];
    proxy: ConfigProxy;
    webhook: ConfigWebhook;
}

export interface ConfigSaveFingerprint {
    mobile: boolean;
    desktop: boolean;
}

export interface ConfigSearchSettings {
    useGeoLocaleQueries: boolean;
    scrollRandomResults: boolean;
    clickRandomResults: boolean;
    searchDelay: ConfigSearchDelay;
    retryMobileSearchAmount: number;
    multiLanguage?: ConfigMultiLanguage;
    autoTimezone?: ConfigAutoTimezone;
    humanBehavior?: ConfigHumanBehavior;
    antiDetection?: ConfigAntiDetection;
    chinaRegionAdaptation?: ConfigChinaRegion;
}

export interface ConfigMultiLanguage {
    enabled: boolean;
    autoDetectLocation: boolean;
    fallbackLanguage: string;
    supportedLanguages: string[];
}

export interface ConfigAutoTimezone {
    enabled: boolean;
    setOnStartup: boolean;
    validateMatch: boolean;
    logChanges: boolean;
}

export interface ConfigHumanBehavior {
    typingErrorRate: number;
    thinkingPauseEnabled: boolean;
    randomScrollEnabled: boolean;
    clickRandomEnabled: boolean;
    timeBasedDelayEnabled: boolean;
    adaptiveDelayEnabled?: boolean;
    cautionModeEnabled?: boolean;
}

export interface ConfigSearchDelay {
    min: number | string;
    max: number | string;
}

export interface ConfigWebhook {
    enabled: boolean;
    url: string;
}

export interface ConfigProxy {
    proxyGoogleTrends: boolean;
    proxyBingTerms: boolean;
}

export interface ConfigWorkers {
    doDailySet: boolean;
    doMorePromotions: boolean;
    doPunchCards: boolean;
    doDesktopSearch: boolean;
    doMobileSearch: boolean;
    doDailyCheckIn: boolean;
    doReadToEarn: boolean;
}

export interface ConfigChinaRegion {
    enabled: boolean;
    useBaiduTrends: boolean;
    useWeiboTrends: boolean;
    fallbackToLocalQueries: boolean;
}

export interface ConfigAntiDetection {
    dynamicDelayMultiplier: number;
    progressiveBackoff: boolean;
    maxConsecutiveFailures: number;
    cooldownPeriod: string;
}
