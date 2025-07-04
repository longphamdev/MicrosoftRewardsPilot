<div align="center">

<!-- 语言切换 / Language Switch / 言語切替 -->
**[中文](../README.md)** | **[English](README_EN.md)** | **[日本語](README_JA.md)**

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
# サンプル設定ファイルをコピーして編集
cp config/config.json.example config/config.json
cp config/accounts.json.example config/accounts.json

# 4. ビルドと実行
npm run build
npm start
```

</details>

<details>
<summary><strong>Docker デプロイ（推奨）</strong> （クリックして展開）</summary>

```bash
# 1. 設定ファイルの準備
# サンプル設定ファイルをコピーして編集
cp config/config.json.example config/config.json
cp config/accounts.json.example config/accounts.json

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
      - ./config/accounts.json:/usr/src/microsoftrewardspilot/dist/accounts.json:ro
      - ./config/config.json:/usr/src/microsoftrewardspilot/dist/config.json:ro
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
  "parallel": true,           // タスクを並列実行
  "clusters": 1,              // クラスター数
  "globalTimeout": "45min",   // グローバルタイムアウト時間
  "runOnZeroPoints": false,   // ゼロポイント時は実行しない
  "accountDelay": {           // アカウント間の遅延時間
    "min": "5min",            // 最小間隔5分
    "max": "15min"            // 最大間隔15分
  }
}
```

### スマート検索設定
```json
{
  "searchSettings": {
    "useGeoLocaleQueries": true,    // 地理位置ベースのクエリ
    "multiLanguage": {
      "enabled": true,              // 多言語サポート
      "autoDetectLocation": true,   // 位置自動検出
      "fallbackLanguage": "en"     // フォールバック言語
    },
    "autoTimezone": {
      "enabled": true,              // 自動タイムゾーン
      "setOnStartup": true          // 起動時に設定
    },
    "searchDelay": {
      "min": "45s",                 // 最小遅延
      "max": "2.5min"              // 最大遅延
    },
    "humanBehavior": {
      "typingErrorRate": 0.12,      // タイピングエラー率
      "thinkingPauseEnabled": true, // 思考停止
      "randomScrollEnabled": true   // ランダムスクロール
    },
    "antiDetection": {
      "ultraMode": true,            // 究極の検出回避モード
      "stealthLevel": "ultimate",   // 最高ステルスレベル
      "dynamicDelayMultiplier": 4.0,// 動的遅延倍率
      "humanErrorSimulation": true, // 人間のエラーシミュレーション
      "deepPageInteraction": true,  // 深層ページインタラクション
      "sessionBreaking": true       // スマートセッション分割
    },
    "chinaRegionAdaptation": {
      "enabled": true,              // 中国地域適応を有効化
      "useBaiduTrends": true,       // 百度トレンドを使用
      "useWeiboTrends": true        // 微博トレンドを使用
    }
  }
}
```

### タスク設定
```json
{
  "workers": {
    "doDailySet": true,        // デイリータスクセット
    "doMorePromotions": true,  // プロモーションタスク
    "doPunchCards": true,      // パンチカードタスク
    "doDesktopSearch": true,   // デスクトップ検索
    "doMobileSearch": true,    // モバイル検索
    "doDailyCheckIn": true,    // 毎日チェックイン
    "doReadToEarn": true       // 読んで稼ぐ
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
npx tsx src/helpers/manual-2fa-helper.ts
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
npx tsx tests/test-dynamic-config.ts

# 地理位置検出テスト  
npx tsx tests/test-geo-language.ts

# タイムゾーン設定テスト
npx tsx tests/test-timezone-auto.ts

# クイズページデバッグ（クイズが失敗した時に使用）
npx tsx src/helpers/quiz-debug.ts "https://rewards.microsoft.com/quiz/xxx"
```

### **よくある問題**

<details>
<summary><strong>ポイント取得制限・自動化検出</strong></summary>

**現象：** 連続検索でポイントなし、またはポイント取得不完全
**解決方法：** システムが自動的に究極の検出回避モードを有効化
- **AI レベル行動シミュレーション**：真実のユーザーエラー、検索迷い、意図しないクリック
- **統計学的検出回避**：非標準時間分布、疲労アルゴリズム
- **深層カモフラージュ技術**：デバイスセンサー、Canvas フィンガープリントノイズ
- **セッション管理**：スマート分割、自動休憩
- **期待効果**：4-8時間以内に95%+のポイント取得率を回復

</details>

<details>
<summary><strong>クイズタスクの失敗</strong></summary>

**解決方法：** `npx tsx src/helpers/quiz-debug.ts <URL>` を使用してページ構造の変化を分析

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
- **究極の検出回避** - AIレベル行動シミュレーション、デバイスセンサー注入、Canvasフィンガープリントノイズ
- **真のユーザーシミュレーション** - エラー修正、検索迷い、意図しないクリックなど人間の行動
- **統計学的検出回避** - 非標準時間分布、疲労アルゴリズム、セッション分割
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
<summary><strong>完全な config.json 例を表示</strong> （クリックして展開）</summary>

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
      "ultraMode": true,
      "stealthLevel": "ultimate",
      "dynamicDelayMultiplier": 4.0,
      "progressiveBackoff": true,
      "maxConsecutiveFailures": 1,
      "cooldownPeriod": "20min",
      "sessionSimulation": true,
      "multitaskingEnabled": true,
      "behaviorRandomization": true,
      "timeBasedScheduling": true,
      "humanErrorSimulation": true,
      "deepPageInteraction": true,
      "canvasNoise": true,
      "sensorDataInjection": true,
      "networkBehaviorMimic": true,
      "sessionBreaking": true,
      "realUserErrors": true
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

## 重要な警告

<div align="center">

> **リスク警告**  
> 自動化スクリプトの使用によりアカウントが停止される可能性があります

> **安全性の推奨事項**  
> 適度に使用し、システムがすべての検出回避機能を自動的に有効化

> **定期更新**  
> スクリプトを最新版に保ってください

</div>

---

<div align="center">

**スクリプトをお楽しみください！** 

[![Star History Chart](https://img.shields.io/github/stars/SkyBlue997/MicrosoftRewardsPilot?style=social)](https://github.com/SkyBlue997/MicrosoftRewardsPilot)

*このプロジェクトがお役に立ちましたら、スターをお願いします！*

</div> 