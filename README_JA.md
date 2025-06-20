<div align="center">

<!-- 语言切换 / Language Switch / 言語切替 -->
**[中文](README.md)** | **[English](README_EN.md)** | **[日本語](README_JA.md)**

---

# MicrosoftRewardsPilot 自動化スクリプト

**インテリジェント Microsoft Rewards ポイント自動収集ツール**

[![GitHub](https://img.shields.io/badge/GitHub-SkyBlue997-blue?style=flat-square&logo=github)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-対応-blue?style=flat-square&logo=docker)](https://hub.docker.com)

---

</div>

## 目次

1. [クイックスタート](#クイックスタート)
2. [メイン設定](#メイン設定)
3. [トラブルシューティング・テスト](#トラブルシューティングテスト)
4. [コア機能](#コア機能)
5. [完全設定例](#完全設定例)
6. [重要な警告](#重要な警告)

---

## クイックスタート

<details>
<summary><strong>ローカル実行</strong> （クリックして展開）</summary>

```bash
# 1. リポジトリのクローン
git clone https://github.com/SkyBlue997/MicrosoftRewardsPilot
cd MicrosoftRewardsPilot

# 2. 依存関係のインストール
npm i

# 3. 設定ファイル
# src/config.json と src/accounts.json を編集

# 4. ビルドと実行
npm run build
npm start
```

</details>

<details>
<summary><strong>Docker デプロイ（推奨）</strong> （クリックして展開）</summary>

```bash
# 1. 設定ファイルの準備
# src/config.json と src/accounts.json を編集

# 2. ビルド
npm run build

# 3. コンテナの開始
docker compose up -d

# 4. ログの確認（オプション）
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
      - TZ=Asia/Tokyo  # 地理的位置に応じて設定
      - CRON_SCHEDULE=0 9,16 * * *  # 毎日9時と16時に実行
      - ENABLE_GEO_DETECTION=true  # 地理位置検出を有効化
      - AUTO_TIMEZONE=true  # 自動タイムゾーン設定を有効化
```

</details>

---

## メイン設定

### 基本設定
```json
{
  "headless": true,           // ヘッドレスモードで実行
  "parallel": false,          // タスクを並列実行（推奨オフ）
  "clusters": 1,              // クラスター数
  "globalTimeout": "120min",  // グローバルタイムアウト時間（最適化済み）
  "runOnZeroPoints": false,   // ゼロポイント時は実行しない
  "accountDelay": {           // アカウント間の遅延時間
    "min": "8min",            // 最小間隔（最適化済み）
    "max": "20min"            // 最大間隔（最適化済み）
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
      "min": "45s",                 // ⏳ 最小遅延（最適化済み）
      "max": "120s"                 // ⏳ 最大遅延（最適化済み）
    },
    "retryMobileSearchAmount": 0,   // 📱 モバイル検索リトライ回数（無効）
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

## トラブルシューティング・テスト

### **モバイル2FA認証問題**

**問題：** モバイルタスクで二要素認証が要求される

**解決方法：** 専用の2FA認証アシスタントツールを使用

```bash
# 2FA認証アシスタントを実行
npx tsx src/manual-2fa-helper.ts
```

**使用手順：**
1. コマンド実行後、言語を選択
2. 認証するメールアドレスとパスワードを入力
3. 開いたブラウザで2FA認証手順を完了
4. OAuth認証の完了を待つ
5. ツールが自動的にモバイルセッションデータを保存
6. 自動化プログラムを再実行すると、モバイルタスクが2FA認証をスキップ

### **テストツール**

```bash
# 設定テスト
npm run test-config

# 地理位置検出テスト  
npm run test-geo

# タイムゾーン設定テスト
npm run test-timezone

# クイズページデバッグ（クイズが失敗した時に使用）
npx tsx src/quiz-debug.ts "https://rewards.microsoft.com/quiz/xxx"
```

### **よくある問題**

<details>
<summary><strong>クイズタスクの失敗</strong></summary>

**解決方法：** `npx tsx src/quiz-debug.ts <URL>` を使用してページ構造の変化を分析

</details>

<details>
<summary><strong>地理位置検出の失敗</strong></summary>

**解決方法：** ネットワーク接続を確認し、地理位置APIサービスへのアクセスを確保

</details>

<details>
<summary><strong>タイムゾーンの不一致</strong></summary>

**解決方法：** `TZ` 環境変数が正しく設定されているかを確認

</details>

<details>
<summary><strong>メモリ不足</strong></summary>

**解決方法：** コンテナを再起動するか、システムリソースの使用状況を確認

</details>

### **Docker トラブルシューティング**

```bash
# ログを表示
docker logs microsoftrewardspilot

# ネットワーク接続をテスト
docker exec microsoftrewardspilot ping google.com

# 地理位置を確認
docker exec microsoftrewardspilot curl -s http://ip-api.com/json
```

---

## コア機能

<table>
<tr>
<td width="50%" valign="top">

### **サポートされているタスク**
- **デイリータスクセット** - すべての日常タスクを完了
- **プロモーションタスク** - ボーナスポイントを獲得
- **パンチカードタスク** - 継続的なポイント蓄積
- **デスクトップ検索** - インテリジェント検索クエリ
- **モバイル検索** - モバイルデバイスシミュレーション
- **クイズチャレンジ** - 10pt、30-40pt、選択問題、ABC問題
- **投票活動** - コミュニティ投票参加
- **クリック報酬** - 簡単クリックでポイント獲得
- **毎日チェックイン** - 自動毎日チェックイン
- **読んで稼ぐ** - 記事を読んでポイント獲得

</td>
<td width="50%" valign="top">

### **スマート機能**
- **マルチアカウントサポート** - 並列クラスター処理
- **セッション保存** - 重複ログインなし、2FA対応
- **地理位置検出** - IP検出＋ローカライズされた検索クエリ
- **タイムゾーン同期** - マッチングタイムゾーンの自動設定
- **多言語サポート** - 日本語、中国語、英語など
- **行動シミュレーション** - タイピングエラー、ランダムスクロール、思考停止
- **インテリジェントクイズ適応** - 複数のデータ取得戦略
- **Dockerサポート** - コンテナ化デプロイ
- **自動リトライ** - 失敗タスクのスマートリトライ
- **詳細ログ** - 完全な実行記録
- **高性能** - 最適化された並行処理
- **柔軟な設定** - 豊富なカスタマイズオプション
- **中国本土最適化** - 百度トレンド、微博トレンド、ローカライズクエリ

</td>
</tr>
</table>

---

## 完全設定例

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

## 重要な警告

<div align="center">

> **リスク警告**  
> 自動化スクリプトの使用によりアカウントが停止される可能性があります

> **安全性の推奨事項**  
> 適度に使用し、すべての検出回避機能を有効にしてください

> **定期更新**  
> スクリプトを最新版に保ってください

</div>

---

<div align="center">

**スクリプトをお楽しみください！** 

[![Star History Chart](https://img.shields.io/github/stars/SkyBlue997/MicrosoftRewardsPilot?style=social)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)

*このプロジェクトがお役に立ちましたら、スターをお願いします！*

</div> 