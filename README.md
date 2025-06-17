<div align="center">

<!-- 语言切换 / Language Switch / 言語切替 -->
**[🇨🇳 中文](README.md)** | **[🇺🇸 English](README_EN.md)** | **[🇯🇵 日本語](README_JA.md)**

---

# 🎯 MicrosoftRewardsPilot 自动化脚本

**智能化 Microsoft Rewards 积分自动获取工具**

[![GitHub](https://img.shields.io/badge/GitHub-SkyBlue997-blue?style=flat-square&logo=github)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-支持-blue?style=flat-square&logo=docker)](https://hub.docker.com)

---

</div>

## 🚀 快速开始

<details>
<summary><strong>📱 本地运行</strong> （点击展开）</summary>

```bash
# 🔗 1. 克隆项目
git clone https://github.com/SkyBlue997/MicrosoftRewardsPilot
cd MicrosoftRewardsPilot

# 📦 2. 安装依赖
npm i

# ⚙️ 3. 配置文件
# 编辑 config.json 和 accounts.json

# 🏗️ 4. 构建运行
npm run build
npm start
```

</details>

<details>
<summary><strong>🐳 Docker 部署（推荐）</strong> （点击展开）</summary>

```bash
# 📝 1. 准备配置文件
# 编辑 src/config.json 和 src/accounts.json

# 🚀 2. 启动容器
docker compose up -d

# 📊 3. 查看日志
docker logs -f microsoftrewardspilot
```

**Docker Compose 配置示例：**

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
      - TZ=Asia/Tokyo  # 🌏 根据地理位置设置
      - CRON_SCHEDULE=0 9,16 * * *  # ⏰ 每天9点和16点运行
      - ENABLE_GEO_DETECTION=true  # 🗺️ 启用地理位置检测
      - AUTO_TIMEZONE=true  # 🕐 启用自动时区设置
```

</details>

---

## ⚙️ 主要配置

### 🔧 基础设置
```json
{
  "headless": true,           // 🖥️ 无头模式运行
  "parallel": true,           // ⚡ 并行执行任务
  "clusters": 1,              // 🔄 集群数量
  "globalTimeout": "45min",   // ⏱️ 全局超时时间
  "runOnZeroPoints": false,   // 🚫 零积分时不运行
  "accountDelay": {           // 👥 多账户间隔时间
    "min": "5min",            // ⏳ 最小间隔5分钟
    "max": "15min"            // ⏳ 最大间隔15分钟
  }
}
```

### 🧠 智能搜索配置
```json
{
  "searchSettings": {
    "useGeoLocaleQueries": true,    // 🌍 地理位置查询
    "multiLanguage": {
      "enabled": true,              // 🗣️ 多语言支持
      "autoDetectLocation": true,   // 📍 自动检测位置
      "fallbackLanguage": "en"     // 🔄 备用语言
    },
    "autoTimezone": {
      "enabled": true,              // 🕐 自动时区
      "setOnStartup": true          // 🚀 启动时设置
    },
    "searchDelay": {
      "min": "45s",                 // ⏳ 最小延迟
      "max": "2.5min"              // ⏳ 最大延迟
    },
    "humanBehavior": {
      "typingErrorRate": 0.12,      // ✏️ 打字错误率
      "thinkingPauseEnabled": true, // 思考暂停
      "randomScrollEnabled": true   // 📜 随机滚动
    }
  }
}
```

### 🎯 任务配置
```json
{
  "workers": {
    "doDailySet": true,        // 📅 每日任务集
    "doMorePromotions": true,  // 📢 推广任务
    "doPunchCards": true,      // 💳 打卡任务
    "doDesktopSearch": true,   // 🖥️ 桌面端搜索
    "doMobileSearch": true,    // 📱 移动端搜索
    "doDailyCheckIn": true,    // ✅ 每日签到
    "doReadToEarn": true       // 📚 阅读赚取
  }
}
```

---

## 🌟 核心功能

<table>
<tr>
<td width="50%">

### ✅ **支持任务**
- 📅 **每日任务集** - 完成所有日常任务
- 📢 **推广任务** - 获取额外积分奖励
- 💳 **打卡任务** - 持续积分累积
- 🖥️ **桌面端搜索** - 智能搜索查询
- 📱 **移动端搜索** - 移动设备模拟
- 🧩 **Quiz 挑战** - 10分、30-40分、选择题、ABC题
- 🗳️ **投票活动** - 参与社区投票
- 🎁 **点击奖励** - 简单点击获取积分
- ✅ **每日签到** - 自动签到打卡
- 📚 **阅读赚取** - 阅读文章获取积分

</td>
<td width="50%">

### ✨ **智能特性**
- 👥 **多账户支持** - 集群并行处理
- 💾 **会话存储** - 免重复登录，支持2FA
- 🌍 **地理位置检测** - 自动匹配地区和语言
- 🛡️ **反检测优化** - 人性化行为模拟
- 🧩 **Quiz智能适配** - 多重数据获取策略
- 🐳 **Docker支持** - 容器化部署
- 🔄 **自动重试** - 失败任务智能重试
- 📊 **详细日志** - 完整的执行记录
- ⚡ **高性能** - 优化的并发处理
- 🔧 **灵活配置** - 丰富的自定义选项

</td>
</tr>
</table>

---

## 🧪 测试工具

```bash
# 🔍 配置测试
npm run test-config

# 🌍 地理位置检测测试  
npm run test-geo

# 🕐 时区设置测试
npm run test-timezone

# 🧩 Quiz页面调试（当Quiz失效时使用）
npm run debug-quiz "https://rewards.microsoft.com/quiz/xxx"
```

---

## 🛡️ 反检测系统

<div align="center">

| 🔒 **防护特性** | 📝 **说明** |
|:---:|:---|
| 🌍 **地理位置匹配** | IP检测 + 本地化搜索查询 |
| 🕐 **时区同步** | 自动设置匹配时区 |
| 🗣️ **多语言支持** | 日语、中文、英语等 |
| 🤖 **行为模拟** | 打字错误、随机滚动、思考暂停 |

</div>

---

## 🔧 故障排除

### ❓ **常见问题**

<details>
<summary><strong>🧩 Quiz任务失败</strong></summary>

**解决方案：** 使用 `npm run debug-quiz <URL>` 分析页面结构变化

</details>

<details>
<summary><strong>🌍 地理位置检测失败</strong></summary>

**解决方案：** 检查网络连接，确保能访问地理位置API服务

</details>

<details>
<summary><strong>🕐 时区不匹配</strong></summary>

**解决方案：** 检查 `TZ` 环境变量设置是否正确

</details>

<details>
<summary><strong>💾 内存不足</strong></summary>

**解决方案：** 重启容器或检查系统资源使用情况

</details>

### 🐳 **Docker问题排查**

```bash
# 📊 查看日志
docker logs microsoftrewardspilot

# 🌐 测试网络连接
docker exec microsoftrewardspilot ping google.com

# 🗺️ 检查地理位置
docker exec microsoftrewardspilot curl -s http://ip-api.com/json
```

---

## 📋 完整配置示例

<details>
<summary><strong>⚙️ 查看完整 config.json 示例</strong> （点击展开）</summary>

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

## 🚨 重要提醒

<div align="center">

> ⚠️ **风险警告** ⚠️  
> 使用自动化脚本可能导致账户被封禁

> 💡 **安全建议** 💡  
> 适度使用，启用所有反检测功能

> 🔄 **定期更新** 🔄  
> 保持脚本为最新版本

</div>

---

<div align="center">

**🎉 祝您使用愉快！** 

[![Star History Chart](https://img.shields.io/github/stars/SkyBlue997/MicrosoftRewardsPilot?style=social)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)

*如果这个项目对您有帮助，请考虑给一个 ⭐ Star！*

</div>
