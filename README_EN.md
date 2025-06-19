<div align="center">

<!-- 语言切换 / Language Switch / 言語切替 -->
**[🇨🇳 中文](README.md)** | **[🇺🇸 English](README_EN.md)** | **[🇯🇵 日本語](README_JA.md)**

---

# 🎯 MicrosoftRewardsPilot Automation Script

**Intelligent Microsoft Rewards Points Auto-Collection Tool**

[![GitHub](https://img.shields.io/badge/GitHub-SkyBlue997-blue?style=flat-square&logo=github)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue?style=flat-square&logo=docker)](https://hub.docker.com)

---

</div>

## 🚀 Quick Start

<details>
<summary><strong>📱 Local Deployment</strong> (Click to expand)</summary>

```bash
# 🔗 1. Clone Repository
git clone https://github.com/SkyBlue997/MicrosoftRewardsPilot
cd MicrosoftRewardsPilot

# 📦 2. Install Dependencies
npm i

# ⚙️ 3. Configuration
# Edit config.json and accounts.json

# 🏗️ 4. Build and Run
npm run build
npm start
```

</details>

<details>
<summary><strong>🐳 Docker Deployment (Recommended)</strong> (Click to expand)</summary>

```bash
# 📝 1. Prepare Configuration Files
# Edit src/config.json and src/accounts.json

# 🚀 2. Start Container
docker compose up -d

# 📊 3. View Logs
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
      - TZ=Asia/Tokyo  # 🌏 Set according to geographic location
      - CRON_SCHEDULE=0 9,16 * * *  # ⏰ Run at 9AM and 4PM daily
      - ENABLE_GEO_DETECTION=true  # 🗺️ Enable geo-location detection
      - AUTO_TIMEZONE=true  # 🕐 Enable automatic timezone setting
```

</details>

---

## ⚙️ Main Configuration

### 🔧 Basic Settings
```json
{
  "headless": true,           // 🖥️ Run in headless mode
  "parallel": true,           // ⚡ Execute tasks in parallel
  "clusters": 1,              // 🔄 Number of clusters
  "globalTimeout": "45min",   // ⏱️ Global timeout duration
  "runOnZeroPoints": false,   // 🚫 Don't run when zero points available
  "accountDelay": {           // 👥 Delay between accounts
    "min": "5min",            // ⏳ Minimum 5 minutes delay
    "max": "15min"            // ⏳ Maximum 15 minutes delay
  }
}
```

### 🧠 Smart Search Configuration
```json
{
  "searchSettings": {
    "useGeoLocaleQueries": true,    // 🌍 Geo-location based queries
    "multiLanguage": {
      "enabled": true,              // 🗣️ Multi-language support
      "autoDetectLocation": true,   // 📍 Auto-detect location
      "fallbackLanguage": "en"     // 🔄 Fallback language
    },
    "autoTimezone": {
      "enabled": true,              // 🕐 Auto timezone
      "setOnStartup": true          // 🚀 Set on startup
    },
    "searchDelay": {
      "min": "45s",                 // ⏳ Minimum delay
      "max": "2.5min"              // ⏳ Maximum delay
    },
    "humanBehavior": {
      "typingErrorRate": 0.12,      // ✏️ Typing error rate
      "thinkingPauseEnabled": true, // 🤔 Thinking pause
      "randomScrollEnabled": true   // 📜 Random scrolling
    },
    "chinaRegionAdaptation": {
      "enabled": true,              // 🇨🇳 Enable China region adaptation
      "useBaiduTrends": true,       // 🔍 Use Baidu trends
      "useWeiboTrends": true        // 📱 Use Weibo trends
    }
  }
}
```

### 🎯 Task Configuration
```json
{
  "workers": {
    "doDailySet": true,        // 📅 Daily task set
    "doMorePromotions": true,  // 📢 Promotional tasks
    "doPunchCards": true,      // 💳 Punch card tasks
    "doDesktopSearch": true,   // 🖥️ Desktop search
    "doMobileSearch": true,    // 📱 Mobile search
    "doDailyCheckIn": true,    // ✅ Daily check-in
    "doReadToEarn": true       // 📚 Read to earn
  }
}
```

---

## 🌟 Core Features

<table>
<tr>
<td width="50%">

### ✅ **Supported Tasks**
- 📅 **Daily Task Set** - Complete all daily tasks
- 📢 **Promotional Tasks** - Earn bonus points
- 💳 **Punch Card Tasks** - Continuous point accumulation
- 🖥️ **Desktop Search** - Intelligent search queries
- 📱 **Mobile Search** - Mobile device simulation
- 🧩 **Quiz Challenges** - 10pts, 30-40pts, Multiple choice, ABC questions
- 🗳️ **Poll Activities** - Community voting participation
- 🎁 **Click Rewards** - Simple click-to-earn points
- ✅ **Daily Check-in** - Automatic daily check-in
- 📚 **Read to Earn** - Earn points by reading articles

</td>
<td width="50%">

### ✨ **Smart Features**
- 👥 **Multi-Account Support** - Parallel cluster processing
- 💾 **Session Storage** - No repeated login, 2FA support
- 🌍 **Geo-location Detection** - Auto-match region and language
- 🛡️ **Anti-Detection Optimization** - Human-like behavior simulation
- 🧩 **Intelligent Quiz Adaptation** - Multiple data acquisition strategies
- 🐳 **Docker Support** - Containerized deployment
- 🔄 **Auto Retry** - Smart retry for failed tasks
- 📊 **Detailed Logging** - Complete execution records
- ⚡ **High Performance** - Optimized concurrent processing
- 🔧 **Flexible Configuration** - Rich customization options
- 🇨🇳 **China Mainland Optimization** - Baidu/Weibo trends integration

</td>
</tr>
</table>

---

## 🧪 Testing Tools

```bash
# 🔍 Configuration test
npm run test-config

# 🌍 Geo-location detection test  
npm run test-geo

# 🕐 Timezone setting test
npm run test-timezone

# 🧩 Quiz page debugging (use when quiz fails)
npm run debug-quiz "https://rewards.microsoft.com/quiz/xxx"
```

---

## 🛡️ Anti-Detection System

<div align="center">

| 🔒 **Protection Features** | 📝 **Description** |
|:---:|:---|
| 🌍 **Geo-location Matching** | IP detection + localized search queries |
| 🕐 **Timezone Synchronization** | Auto-set matching timezone |
| 🗣️ **Multi-language Support** | Japanese, Chinese, English, etc. |
| 🤖 **Behavior Simulation** | Typing errors, random scrolling, thinking pauses |
| 🇨🇳 **China Region Adaptation** | Baidu trends, Weibo trends, localized queries |

</div>

---

## 🔧 Troubleshooting

### ❓ **Common Issues**

<details>
<summary><strong>🧩 Quiz Task Failure</strong></summary>

**Solution:** Use `npm run debug-quiz <URL>` to analyze page structure changes

</details>

<details>
<summary><strong>🌍 Geo-location Detection Failure</strong></summary>

**Solution:** Check network connection, ensure access to geo-location API services

</details>

<details>
<summary><strong>🕐 Timezone Mismatch</strong></summary>

**Solution:** Check if the `TZ` environment variable is set correctly

</details>

<details>
<summary><strong>💾 Out of Memory</strong></summary>

**Solution:** Restart container or check system resource usage

</details>

### 🐳 **Docker Troubleshooting**

```bash
# 📊 View logs
docker logs microsoftrewardspilot

# 🌐 Test network connection
docker exec microsoftrewardspilot ping google.com

# 🗺️ Check geo-location
docker exec microsoftrewardspilot curl -s http://ip-api.com/json
```

---

## 📋 Complete Configuration Example

<details>
<summary><strong>⚙️ View complete config.json example</strong> (Click to expand)</summary>

```json
{
  "baseURL": "https://rewards.bing.com",
  "sessionPath": "sessions",
  "headless": true,
  "parallel": true,
  "runOnZeroPoints": false,
  "clusters": 1,
  "globalTimeout": "45min",
  "saveFingerprint": {
    "mobile": true,
    "desktop": true
  },
  "accountDelay": {
    "min": "5min",
    "max": "15min"
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
  "searchSettings": {
    "useGeoLocaleQueries": true,
    "scrollRandomResults": true,
    "clickRandomResults": true,
    "searchDelay": {
      "min": "45s",
      "max": "2.5min"
    },
    "retryMobileSearchAmount": 2,
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
      "typingErrorRate": 0.12,
      "thinkingPauseEnabled": true,
      "randomScrollEnabled": true,
      "clickRandomEnabled": true,
      "timeBasedDelayEnabled": true
    },
    "chinaRegionAdaptation": {
      "enabled": true,
      "useBaiduTrends": true,
      "useWeiboTrends": true
    }
  },
  "proxy": {
    "proxyGoogleTrends": true,
    "proxyBingTerms": true
  },
  "webhook": {
    "enabled": false,
    "url": null
  }
}
```

</details>

---

## 🚨 Important Warnings

<div align="center">

> ⚠️ **Risk Warning** ⚠️  
> Using automation scripts may result in account suspension

> 💡 **Safety Recommendations** 💡  
> Use moderately, enable all anti-detection features

> 🔄 **Regular Updates** 🔄  
> Keep script updated to latest version

</div>

---

<div align="center">

**🎉 Enjoy using the script!** 

[![Star History Chart](https://img.shields.io/github/stars/SkyBlue997/MicrosoftRewardsPilot?style=social)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)

*If this project helps you, please consider giving it a ⭐ Star!*

</div> 