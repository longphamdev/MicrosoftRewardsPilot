<div align="center">

<!-- 语言切换 / Language Switch / 言語切替 -->
**[中文](README.md)** | **[English](README_EN.md)** | **[日本語](README_JA.md)**

---

# MicrosoftRewardsPilot Automation Script

**Intelligent Microsoft Rewards Points Auto-Collection Tool**

[![GitHub](https://img.shields.io/badge/GitHub-SkyBlue997-blue?style=flat-square&logo=github)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue?style=flat-square&logo=docker)](https://hub.docker.com)

---

</div>

## Table of Contents

1. [Quick Start](#quick-start)
2. [Main Configuration](#main-configuration)
3. [Troubleshooting & Testing](#troubleshooting--testing)
4. [Core Features](#core-features)
5. [Complete Configuration Example](#complete-configuration-example)
6. [Important Warnings](#important-warnings)

---

## Quick Start

<details>
<summary><strong>Local Deployment</strong> (Click to expand)</summary>

```bash
# 1. Clone Repository
git clone https://github.com/SkyBlue997/MicrosoftRewardsPilot
cd MicrosoftRewardsPilot

# 2. Install Dependencies
npm i

# 3. Configuration
# Edit src/config.json and src/accounts.json

# 4. Build and Run
npm run build
npm start
```

</details>

<details>
<summary><strong>Docker Deployment (Recommended)</strong> (Click to expand)</summary>

```bash
# 1. Prepare Configuration Files
# Edit src/config.json and src/accounts.json

# 2. Build
npm run build

# 3. Start Container
docker compose up -d

# 4. View Logs (Optional)
docker logs -f microsoftrewardspilot
```

**Docker Compose Configuration Example:**

```yaml
services:
  microsoftrewardspilot:
    build: .
    container_name: microsoftrewardspilot
    restart: unless-stopped
    volumes:
      - ./src/accounts.json:/usr/src/microsoftrewardspilot/dist/accounts.json:ro
      - ./src/config.json:/usr/src/microsoftrewardspilot/dist/config.json:ro
      - ./sessions:/usr/src/microsoftrewardspilot/dist/browser/sessions
    environment:
      - TZ=Asia/Tokyo  # Set according to geographic location
      - CRON_SCHEDULE=0 9,16 * * *  # Run at 9AM and 4PM daily
      - ENABLE_GEO_DETECTION=true  # Enable geo-location detection
      - AUTO_TIMEZONE=true  # Enable automatic timezone setting
```

</details>

---

## Main Configuration

### Basic Settings
```json
{
  "headless": true,           // Run in headless mode
  "parallel": false,          // Execute tasks in parallel (recommended off)
  "clusters": 1,              // Number of clusters
  "globalTimeout": "120min",  // Global timeout duration (optimized)
  "runOnZeroPoints": false,   // Don't run when zero points available
  "accountDelay": {           // Delay between accounts
    "min": "8min",            // Minimum delay (optimized)
    "max": "20min"            // Maximum delay (optimized)
  }
}
```

### Smart Search Configuration
```json
{
  "searchSettings": {
    "useGeoLocaleQueries": true,    // Geo-location based queries
    "multiLanguage": {
      "enabled": true,              // Multi-language support
      "autoDetectLocation": true,   // Auto-detect location
      "fallbackLanguage": "en"     // Fallback language
    },
    "autoTimezone": {
      "enabled": true,              // Auto timezone
      "setOnStartup": true          // Set on startup
    },
    "searchDelay": {
      "min": "45s",                 // Minimum delay (optimized)
      "max": "120s"                 // Maximum delay (optimized)
    },
    "retryMobileSearchAmount": 0,   // Mobile search retry count (disabled)
    "humanBehavior": {
      "typingErrorRate": 0.08,      // Typing error rate
      "thinkingPauseEnabled": true, // Thinking pause
      "randomScrollEnabled": true   // Random scrolling
    },
    "chinaRegionAdaptation": {
      "enabled": false,             // Enable China region adaptation
      "useBaiduTrends": true,       // Use Baidu trends
      "useWeiboTrends": true        // Use Weibo trends
    }
  }
}
```

### Task Configuration
```json
{
  "workers": {
    "doDailySet": true,        // Daily task set
    "doMorePromotions": true,  // Promotional tasks
    "doPunchCards": true,      // Punch card tasks
    "doDesktopSearch": true,   // Desktop search
    "doMobileSearch": true,    // Mobile search
    "doDailyCheckIn": true,    // Daily check-in
    "doReadToEarn": true       // Read to earn
  }
}
```

---

## Troubleshooting & Testing

### **Mobile 2FA Verification Issue**

**Problem:** Mobile tasks prompt for two-factor authentication

**Solution:** Use the specialized 2FA verification assistant tool

```bash
# Run 2FA verification assistant
npx tsx src/manual-2fa-helper.ts
```

**Usage Process:**
1. Select language after running the command
2. Enter the email and password to verify
3. Complete 2FA verification steps in the opened browser
4. Wait for OAuth authorization to complete
5. Tool automatically saves mobile session data
6. Re-run automation program, mobile tasks will skip 2FA verification

### **Testing Tools**

```bash
# Configuration test
npm run test-config

# Geo-location detection test  
npm run test-geo

# Timezone setting test
npm run test-timezone

# Quiz page debugging (use when quiz fails)
npx tsx src/quiz-debug.ts "https://rewards.microsoft.com/quiz/xxx"
```

### **Common Issues**

<details>
<summary><strong>Quiz Task Failure</strong></summary>

**Solution:** Use `npx tsx src/quiz-debug.ts <URL>` to analyze page structure changes

</details>

<details>
<summary><strong>Geo-location Detection Failure</strong></summary>

**Solution:** Check network connection, ensure access to geo-location API services

</details>

<details>
<summary><strong>Timezone Mismatch</strong></summary>

**Solution:** Check if the `TZ` environment variable is set correctly

</details>

<details>
<summary><strong>Out of Memory</strong></summary>

**Solution:** Restart container or check system resource usage

</details>

### **Docker Troubleshooting**

```bash
# View logs
docker logs microsoftrewardspilot

# Test network connection
docker exec microsoftrewardspilot ping google.com

# Check geo-location
docker exec microsoftrewardspilot curl -s http://ip-api.com/json
```

---

## Core Features

<table>
<tr>
<td width="50%" valign="top">

### **Supported Tasks**
- **Daily Task Set** - Complete all daily tasks
- **Promotional Tasks** - Earn bonus points
- **Punch Card Tasks** - Continuous point accumulation
- **Desktop Search** - Intelligent search queries
- **Mobile Search** - Mobile device simulation
- **Quiz Challenges** - 10pts, 30-40pts, Multiple choice, ABC questions
- **Poll Activities** - Community voting participation
- **Click Rewards** - Simple click-to-earn points
- **Daily Check-in** - Automatic daily check-in
- **Read to Earn** - Earn points by reading articles

</td>
<td width="50%" valign="top">

### **Smart Features**
- **Multi-Account Support** - Parallel cluster processing
- **Session Storage** - No repeated login, 2FA support
- **Geo-location Detection** - IP detection + localized search queries
- **Timezone Synchronization** - Auto-set matching timezone
- **Multi-language Support** - Japanese, Chinese, English and other languages
- **Behavior Simulation** - Typing errors, random scrolling, thinking pauses
- **Intelligent Quiz Adaptation** - Multiple data acquisition strategies
- **Docker Support** - Containerized deployment
- **Auto Retry** - Smart retry for failed tasks
- **Detailed Logging** - Complete execution records
- **High Performance** - Optimized concurrent processing
- **Flexible Configuration** - Rich customization options
- **China Mainland Optimization** - Baidu trends, Weibo trends, localized queries

</td>
</tr>
</table>

---

## Complete Configuration Example

<details>
<summary><strong>View complete config.json example</strong> (Click to expand)</summary>

```json
{
  "baseURL": "https://rewards.bing.com",
  "sessionPath": "sessions",
  "headless": true,
  "parallel": false,
  "runOnZeroPoints": false,
  "clusters": 1,
  "saveFingerprint": {
    "mobile": true,
    "desktop": true
  },
  "workers": {
    "doDailySet": true,
    "doMorePromotions": true,
    "doPunchCards": true,
    "doDesktopSearch": true,
    "doMobileSearch": true,
    "doDailyCheckIn": true,
    "doReadToEarn": true
  },
  "searchOnBingLocalQueries": true,
  "globalTimeout": "120min",
  "accountDelay": {
    "min": "8min",
    "max": "20min"
  },
  "searchSettings": {
    "useGeoLocaleQueries": true,
    "scrollRandomResults": true,
    "clickRandomResults": true,
    "searchDelay": {
      "min": "45s",
      "max": "120s"
    },
    "retryMobileSearchAmount": 0,
    "multiLanguage": {
      "enabled": true,
      "autoDetectLocation": true,
      "fallbackLanguage": "en",
      "supportedLanguages": ["ja", "en", "zh-CN", "ko", "de", "fr", "es"]
    },
    "autoTimezone": {
      "enabled": true,
      "setOnStartup": true,
      "validateMatch": true,
      "logChanges": true
    },
    "humanBehavior": {
      "typingErrorRate": 0.08,
      "thinkingPauseEnabled": true,
      "randomScrollEnabled": true,
      "clickRandomEnabled": true,
      "timeBasedDelayEnabled": true,
      "adaptiveDelayEnabled": true,
      "cautionModeEnabled": true
    },
    "antiDetection": {
      "dynamicDelayMultiplier": 1.5,
      "progressiveBackoff": true,
      "maxConsecutiveFailures": 3,
      "cooldownPeriod": "5min"
    },
    "chinaRegionAdaptation": {
      "enabled": false,
      "useBaiduTrends": true,
      "useWeiboTrends": true,
      "fallbackToLocalQueries": true
    }
  },
  "logExcludeFunc": [
    "SEARCH-CLOSE-TABS"
  ],
  "webhookLogExcludeFunc": [
    "SEARCH-CLOSE-TABS"
  ],
  "proxy": {
    "proxyGoogleTrends": true,
    "proxyBingTerms": true
  },
  "webhook": {
    "enabled": false,
    "url": ""
  }
}
```

</details>

---

## Important Warnings

<div align="center">

> **Risk Warning**  
> Using automation scripts may result in account suspension

> **Safety Recommendations**  
> Use moderately, enable all anti-detection features

> **Regular Updates**  
> Keep script updated to latest version

</div>

---

<div align="center">

**Enjoy using the script!** 

[![Star History Chart](https://img.shields.io/github/stars/SkyBlue997/MicrosoftRewardsPilot?style=social)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)

*If this project helps you, please consider giving it a Star!*

</div> 