<div align="center">

<!-- 语言切换 / Language Switch / 言語切替 -->
**[🇨🇳 中文](README.md)** | **[🇺🇸 English](README_EN.md)** | **[🇯🇵 日本語](README_JA.md)**

---

# 🎯 MicrosoftRewardsPilot 自動化スクリプト

**インテリジェント Microsoft Rewards ポイント自動収集ツール**

[![GitHub](https://img.shields.io/badge/GitHub-SkyBlue997-blue?style=flat-square&logo=github)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-対応-blue?style=flat-square&logo=docker)](https://hub.docker.com)

---

</div>

## 🚀 クイックスタート

<details>
<summary><strong>📱 ローカル実行</strong> （クリックして展開）</summary>

```bash
# 🔗 1. リポジトリのクローン
git clone https://github.com/SkyBlue997/MicrosoftRewardsPilot
cd MicrosoftRewardsPilot

# 📦 2. 依存関係のインストール
npm i

# ⚙️ 3. 設定ファイル
# config.json と accounts.json を編集

# 🏗️ 4. ビルドと実行
npm run build
npm start
```

</details>

<details>
<summary><strong>🐳 Docker デプロイ（推奨）</strong> （クリックして展開）</summary>

```bash
# 📝 1. 設定ファイルの準備
# src/config.json と src/accounts.json を編集

# 🚀 2. コンテナの開始
docker compose up -d

# 📊 3. ログの確認
docker logs -f microsoftrewardspilot
```

**Docker Compose 設定例：**

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
      - TZ=Asia/Tokyo  # 🌏 地理的位置に応じて設定
      - CRON_SCHEDULE=0 9,16 * * *  # ⏰ 毎日9時と16時に実行
      - ENABLE_GEO_DETECTION=true  # 🗺️ 地理位置検出を有効化
      - AUTO_TIMEZONE=true  # 🕐 自動タイムゾーン設定を有効化
```

</details>

---

## ⚙️ メイン設定

### 🔧 基本設定
```json
{
  "headless": true,           // 🖥️ ヘッドレスモードで実行
  "parallel": true,           // ⚡ タスクを並列実行
  "clusters": 1,              // 🔄 クラスター数
  "globalTimeout": "45min",   // ⏱️ グローバルタイムアウト時間
  "runOnZeroPoints": false,   // 🚫 ゼロポイント時は実行しない
  "accountDelay": {           // 👥 アカウント間の遅延時間
    "min": "5min",            // ⏳ 最小5分間隔
    "max": "15min"            // ⏳ 最大15分間隔
  }
}
```

### 🧠 スマート検索設定
```json
{
  "searchSettings": {
    "useGeoLocaleQueries": true,    // 🌍 地理位置ベースのクエリ
    "multiLanguage": {
      "enabled": true,              // 🗣️ 多言語サポート
      "autoDetectLocation": true,   // 📍 位置自動検出
      "fallbackLanguage": "en"     // 🔄 フォールバック言語
    },
    "autoTimezone": {
      "enabled": true,              // 🕐 自動タイムゾーン
      "setOnStartup": true          // 🚀 起動時に設定
    },
    "searchDelay": {
      "min": "45s",                 // ⏳ 最小遅延
      "max": "2.5min"              // ⏳ 最大遅延
    },
    "humanBehavior": {
      "typingErrorRate": 0.12,      // ✏️ タイピングエラー率
      "thinkingPauseEnabled": true, // 🤔 思考停止
      "randomScrollEnabled": true   // 📜 ランダムスクロール
    },
    "chinaRegionAdaptation": {
      "enabled": true,              // 🇨🇳 中国地域適応を有効化
      "useBaiduTrends": true,       // 🔍 百度トレンドを使用
      "useWeiboTrends": true        // 📱 微博トレンドを使用
    }
  }
}
```

### 🎯 タスク設定
```json
{
  "workers": {
    "doDailySet": true,        // 📅 デイリータスクセット
    "doMorePromotions": true,  // 📢 プロモーションタスク
    "doPunchCards": true,      // 💳 パンチカードタスク
    "doDesktopSearch": true,   // 🖥️ デスクトップ検索
    "doMobileSearch": true,    // 📱 モバイル検索
    "doDailyCheckIn": true,    // ✅ 毎日チェックイン
    "doReadToEarn": true       // 📚 読んで稼ぐ
  }
}
```

---

## 🌟 コア機能

<table>
<tr>
<td width="50%">

### ✅ **サポートされているタスク**
- 📅 **デイリータスクセット** - すべての日常タスクを完了
- 📢 **プロモーションタスク** - ボーナスポイントを獲得
- 💳 **パンチカードタスク** - 継続的なポイント蓄積
- 🖥️ **デスクトップ検索** - インテリジェント検索クエリ
- 📱 **モバイル検索** - モバイルデバイスシミュレーション
- 🧩 **クイズチャレンジ** - 10pt、30-40pt、選択問題、ABC問題
- 🗳️ **投票活動** - コミュニティ投票参加
- 🎁 **クリック報酬** - 簡単クリックでポイント獲得
- ✅ **毎日チェックイン** - 自動毎日チェックイン
- 📚 **読んで稼ぐ** - 記事を読んでポイント獲得

</td>
<td width="50%">

### ✨ **スマート機能**
- 👥 **マルチアカウントサポート** - 並列クラスター処理
- 💾 **セッション保存** - 重複ログインなし、2FA対応
- 🌍 **地理位置検出** - 地域と言語の自動マッチング
- 🛡️ **検出回避最適化** - 人間らしい行動シミュレーション
- 🧩 **インテリジェントクイズ適応** - 複数のデータ取得戦略
- 🐳 **Dockerサポート** - コンテナ化デプロイ
- 🔄 **自動リトライ** - 失敗タスクのスマートリトライ
- 📊 **詳細ログ** - 完全な実行記録
- ⚡ **高性能** - 最適化された並行処理
- 🔧 **柔軟な設定** - 豊富なカスタマイズオプション
- 🇨🇳 **中国本土最適化** - 百度/微博トレンド統合

</td>
</tr>
</table>

---

## 🧪 テストツール

```bash
# 🔍 設定テスト
npm run test-config

# 🌍 地理位置検出テスト  
npm run test-geo

# 🕐 タイムゾーン設定テスト
npm run test-timezone

# 🧩 クイズページデバッグ（クイズが失敗した時に使用）
npm run debug-quiz "https://rewards.microsoft.com/quiz/xxx"
```

---

## 🛡️ 検出回避システム

<div align="center">

| 🔒 **保護機能** | 📝 **説明** |
|:---:|:---|
| 🌍 **地理位置マッチング** | IP検出＋ローカライズされた検索クエリ |
| 🕐 **タイムゾーン同期** | マッチングタイムゾーンの自動設定 |
| 🗣️ **多言語サポート** | 日本語、中国語、英語など |
| 🤖 **行動シミュレーション** | タイピングエラー、ランダムスクロール、思考停止 |
| 🇨🇳 **中国地域適応** | 百度トレンド、微博トレンド、ローカライズクエリ |

</div>

---

## 🔧 トラブルシューティング

### ❓ **よくある問題**

<details>
<summary><strong>🧩 クイズタスクの失敗</strong></summary>

**解決方法：** `npm run debug-quiz <URL>` を使用してページ構造の変化を分析

</details>

<details>
<summary><strong>🌍 地理位置検出の失敗</strong></summary>

**解決方法：** ネットワーク接続を確認し、地理位置APIサービスへのアクセスを確保

</details>

<details>
<summary><strong>🕐 タイムゾーンの不一致</strong></summary>

**解決方法：** `TZ` 環境変数が正しく設定されているかを確認

</details>

<details>
<summary><strong>💾 メモリ不足</strong></summary>

**解決方法：** コンテナを再起動するか、システムリソースの使用状況を確認

</details>

### 🐳 **Docker トラブルシューティング**

```bash
# 📊 ログを表示
docker logs microsoftrewardspilot

# 🌐 ネットワーク接続をテスト
docker exec microsoftrewardspilot ping google.com

# 🗺️ 地理位置を確認
docker exec microsoftrewardspilot curl -s http://ip-api.com/json
```

---

## 📋 完全設定例

<details>
<summary><strong>⚙️ 完全な config.json 例を表示</strong> （クリックして展開）</summary>

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

## 🚨 重要な警告

<div align="center">

> ⚠️ **リスク警告** ⚠️  
> 自動化スクリプトの使用によりアカウントが停止される可能性があります

> 💡 **安全性の推奨事項** 💡  
> 適度に使用し、すべての検出回避機能を有効にしてください

> 🔄 **定期更新** 🔄  
> スクリプトを最新版に保ってください

</div>

---

<div align="center">

**🎉 スクリプトをお楽しみください！** 

[![Star History Chart](https://img.shields.io/github/stars/SkyBlue997/MicrosoftRewardsPilot?style=social)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)

*このプロジェクトがお役に立ちましたら、⭐ スターをお願いします！*

</div> 