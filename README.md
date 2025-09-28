# Omise MCP Server

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/omise-mcp-server)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-supported-blue.svg)](https://www.docker.com/)

**Omise MCP Server** は、[Model Context Protocol (MCP)](https://modelcontextprotocol.io/) を使用してOmise決済APIと統合するための包括的なサーバーです。TypeScriptで実装され、Omise API v2017-11-02に完全対応しています。

## 🚀 主な機能

### 💳 決済処理
- **チャージ管理**: 支払いの作成、取得、更新、キャプチャ、リバース
- **トークン化**: セキュアなカード情報のトークン化
- **ソース管理**: 多様な決済方法のサポート
- **払い戻し**: 部分・全額払い戻しの処理

### 👥 顧客管理
- **顧客情報**: 顧客の作成、取得、更新、削除
- **カード管理**: 顧客のカード情報管理
- **メタデータ**: カスタム情報の保存

### 🔄 送金・受取人
- **送金処理**: 受取人への送金
- **受取人管理**: 受取人の作成、検証、管理
- **銀行口座**: 銀行口座情報の管理

### 📅 スケジュール・定期決済
- **定期決済**: スケジュールに基づく自動決済
- **発生管理**: スケジュール実行の管理
- **柔軟な設定**: 日次、週次、月次スケジュール

### 🔍 監視・分析
- **イベント管理**: システムイベントの追跡
- **ディスプート管理**: チャージバックの処理
- **Webhook**: リアルタイム通知

### 🔗 リンク・チェーン
- **支払いリンク**: 共有可能な支払いリンク
- **チェーン管理**: マルチテナント対応
- **機能確認**: API機能の確認

## 📋 対応API

| カテゴリ | 機能 | ツール数 | ドキュメント |
|---------|------|---------|-------------|
| **決済** | チャージ、トークン、ソース | 8 | [Omise Charges API](https://www.omise.co/charges-api) |
| **顧客** | 顧客・カード管理 | 7 | [Omise Customers API](https://www.omise.co/customers-api) |
| **送金** | 送金・受取人管理 | 6 | [Omise Transfers API](https://www.omise.co/transfers-api) |
| **払い戻し** | 払い戻し処理 | 3 | [Omise Refunds API](https://www.omise.co/refunds-api) |
| **ディスプート** | チャージバック処理 | 7 | [Omise Disputes API](https://www.omise.co/disputes-api) |
| **スケジュール** | 定期決済 | 5 | [Omise Schedules API](https://www.omise.co/schedules-api) |
| **イベント** | イベント管理 | 2 | [Omise Events API](https://www.omise.co/events-api) |
| **Webhook** | 通知管理 | 5 | [Omise Webhooks API](https://www.omise.co/webhooks-api) |
| **リンク** | 支払いリンク | 3 | [Omise Links API](https://www.omise.co/links-api) |
| **チェーン** | マルチテナント | 4 | [Omise Chains API](https://www.omise.co/chains-api) |
| **機能** | 機能確認 | 1 | [Omise Capabilities API](https://www.omise.co/capabilities-api) |

**合計: 51のツール** でOmise APIの全機能をカバー

## 🛠️ 技術スタック

- **ランタイム**: Node.js 20+
- **言語**: TypeScript 5.2+
- **フレームワーク**: Model Context Protocol (MCP)
- **HTTP クライアント**: Axios
- **ログ**: Winston
- **テスト**: Jest + MSW
- **コンテナ**: Docker + Docker Compose
- **監視**: Prometheus + Grafana
- **キャッシュ**: Redis
- **ログ集約**: Loki

## 🚀 クイックスタート

### 前提条件

- Node.js 20+ 
- npm または yarn
- [Omiseアカウント](https://dashboard.omise.co/) とAPIキー

### 1. インストール

```bash
# リポジトリのクローン
git clone https://github.com/your-org/omise-mcp-server.git
cd omise-mcp-server

# 依存関係のインストール
npm install
```

### 2. 環境設定

```bash
# 環境設定ファイルのコピー
cp config/development.env .env

# 環境変数の設定
export OMISE_PUBLIC_KEY=pkey_test_xxxxxxxxxxxxxxxx
export OMISE_SECRET_KEY=skey_test_xxxxxxxxxxxxxxxx
export OMISE_ENVIRONMENT=test
```

### 3. 開発サーバーの起動

```bash
# 開発モードで起動
npm run dev

# または本番モードで起動
npm run build
npm start
```

### 4. 動作確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# 利用可能なツールの確認
curl http://localhost:3000/tools
```

## 📖 使用方法

### 基本的な決済処理

```typescript
// チャージの作成
const charge = await mcpClient.callTool('create_charge', {
  amount: 10000,        // 100.00 THB (最小通貨単位)
  currency: 'THB',
  description: 'Test payment',
  capture: true
});

// 顧客の作成
const customer = await mcpClient.callTool('create_customer', {
  email: 'customer@example.com',
  description: 'Test customer'
});

// カードトークンの作成
const token = await mcpClient.callTool('create_token', {
  card: {
    name: 'John Doe',
    number: '4242424242424242',
    expiration_month: 12,
    expiration_year: 2025,
    security_code: '123'
  }
});
```

### 定期決済の設定

```typescript
// スケジュールの作成
const schedule = await mcpClient.callTool('create_schedule', {
  every: 1,
  period: 'month',
  start_date: '2024-01-01',
  charge: {
    customer: 'cust_123',
    amount: 5000,
    currency: 'THB',
    description: 'Monthly subscription'
  }
});
```

### 送金処理

```typescript
// 受取人の作成
const recipient = await mcpClient.callTool('create_recipient', {
  name: 'John Doe',
  email: 'john@example.com',
  type: 'individual',
  bank_account: {
    brand: 'bbl',
    number: '1234567890',
    name: 'John Doe'
  }
});

// 送金の実行
const transfer = await mcpClient.callTool('create_transfer', {
  amount: 10000,
  recipient: recipient.id
});
```

## 🔧 設定

### 環境変数

| 変数名 | 説明 | 必須 | デフォルト |
|--------|------|------|-----------|
| `OMISE_PUBLIC_KEY` | Omise公開キー | ✓ | - |
| `OMISE_SECRET_KEY` | Omise秘密キー | ✓ | - |
| `OMISE_ENVIRONMENT` | 環境 (test/production) | ✓ | - |
| `PORT` | サーバーポート | - | 3000 |
| `HOST` | サーバーホスト | - | localhost |
| `LOG_LEVEL` | ログレベル | - | info |
| `LOG_FORMAT` | ログフォーマット | - | simple |
| `RATE_LIMIT_ENABLED` | レート制限の有効化 | - | true |
| `RATE_LIMIT_MAX_REQUESTS` | 最大リクエスト数 | - | 100 |
| `RATE_LIMIT_WINDOW_MS` | 時間窓 (ミリ秒) | - | 60000 |

### Omise APIキーの取得

1. [Omise Dashboard](https://dashboard.omise.co/) にアクセス
2. アカウントを作成またはログイン
3. **API Keys** セクションからキーを取得
4. **テスト環境**: `pkey_test_` と `skey_test_` で始まるキー
5. **本番環境**: `pkey_live_` と `skey_live_` で始まるキー

> **重要**: 本番環境では必ずライブキーを使用し、テスト環境ではテストキーを使用してください。

## 🏗️ プロジェクト構造

```
omise-mcp-server/
├── src/                          # ソースコード
│   ├── index.ts                  # メインサーバーファイル
│   ├── types/                    # 型定義
│   │   ├── omise.ts             # Omise API型定義
│   │   ├── mcp.ts               # MCP型定義
│   │   └── index.ts             # 型定義エクスポート
│   ├── tools/                    # ツール実装
│   │   ├── payment-tools.ts     # 決済関連ツール
│   │   ├── customer-tools.ts    # 顧客関連ツール
│   │   ├── token-tools.ts       # トークン関連ツール
│   │   ├── source-tools.ts      # ソース関連ツール
│   │   ├── transfer-tools.ts    # 送金関連ツール
│   │   ├── recipient-tools.ts   # 受取人関連ツール
│   │   ├── refund-tools.ts      # 払い戻し関連ツール
│   │   ├── dispute-tools.ts     # ディスプート関連ツール
│   │   ├── schedule-tools.ts    # スケジュール関連ツール
│   │   ├── event-tools.ts       # イベント関連ツール
│   │   ├── webhook-tools.ts     # Webhook関連ツール
│   │   ├── link-tools.ts        # リンク関連ツール
│   │   ├── chain-tools.ts       # チェーン関連ツール
│   │   ├── capability-tools.ts  # 機能確認ツール
│   │   └── index.ts             # ツールエクスポート
│   └── utils/                    # ユーティリティ
│       ├── config.ts            # 設定管理
│       ├── logger.ts            # ログ機能
│       ├── omise-client.ts      # Omise APIクライアント
│       ├── health-check.ts      # ヘルスチェック
│       └── index.ts             # ユーティリティエクスポート
├── tests/                        # テスト
│   ├── unit/                     # 単体テスト
│   ├── integration/              # 統合テスト
│   ├── auth/                     # 認証テスト
│   ├── error/                    # エラーハンドリングテスト
│   ├── rate-limit/               # レート制限テスト
│   ├── mocks/                    # モック
│   └── factories/                # テストファクトリ
├── config/                       # 設定ファイル
│   ├── development.env          # 開発環境設定
│   ├── staging.env              # ステージング環境設定
│   └── production.env            # 本番環境設定
├── monitoring/                   # 監視設定
│   ├── prometheus.yml            # Prometheus設定
│   ├── loki-config.yml          # Loki設定
│   └── grafana/                  # Grafana設定
├── nginx/                        # Nginx設定
├── docker-compose.yml            # Docker Compose設定
├── Dockerfile                    # Docker設定
├── package.json                  # 依存関係
├── tsconfig.json                 # TypeScript設定
└── README.md                     # このファイル
```

## 🧪 開発

### 開発環境のセットアップ

```bash
# 開発依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ウォッチモード
npm run watch
```

### テスト

```bash
# 全テストの実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ付きテスト
npm run test:coverage

# 特定のテストカテゴリ
npm run test:unit
npm run test:integration
npm run test:auth
npm run test:error
npm run test:rate-limit
```

### リンティング

```bash
# リントの実行
npm run lint

# 自動修正
npm run lint:fix
```

### ビルド

```bash
# TypeScriptのコンパイル
npm run build

# 本番用ビルド
npm run build:production
```

## 🐳 Docker デプロイメント

### 開発環境

```bash
# 開発環境での起動
docker-compose --env-file config/development.env up -d

# ログの確認
docker-compose logs -f omise-mcp-server
```

### 本番環境

```bash
# 本番環境での起動
docker-compose --env-file config/production.env up -d

# ヘルスチェック
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/live
```

### 自動デプロイメント

```bash
# デプロイメントスクリプトの実行
./deploy.sh latest production
```

## 📊 監視・ログ

### Prometheus メトリクス

- **URL**: http://localhost:9090
- **メトリクス**: CPU、メモリ、リクエスト数、レスポンス時間
- **アラート**: 高負荷、エラー率の監視

### Grafana ダッシュボード

- **URL**: http://localhost:3001
- **ログイン**: admin / admin (デフォルト)
- **ダッシュボード**: システム監視、アプリケーション監視

### ログ管理

```bash
# アプリケーションログ
docker-compose logs -f omise-mcp-server

# Nginxログ
docker-compose logs -f nginx

# 全サービスのログ
docker-compose logs -f
```

## 🔒 セキュリティ

### セキュリティ機能

- **非rootユーザー**: コンテナ内での非rootユーザー実行
- **セキュリティヘッダー**: 適切なHTTPヘッダーの設定
- **レート制限**: API呼び出しの制限
- **機密情報マスキング**: ログでの機密情報の隠蔽
- **環境分離**: テスト・本番環境の完全分離

### SSL/TLS設定

```bash
# SSL証明書の配置
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### セキュリティスキャン

```bash
# コンテナのセキュリティスキャン
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image omise-mcp-server:latest
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. サービスが起動しない

```bash
# ログを確認
docker-compose logs omise-mcp-server

# 環境変数を確認
docker-compose config
```

#### 2. ヘルスチェックが失敗する

```bash
# ヘルスチェックエンドポイントを直接確認
curl -v http://localhost:3000/health

# サービス間の接続を確認
docker-compose exec omise-mcp-server ping redis
```

#### 3. メモリ不足

```bash
# メモリ使用量を確認
docker stats

# 不要なコンテナを削除
docker system prune -a
```

### ログ分析

```bash
# エラーログの確認
docker-compose logs omise-mcp-server | grep ERROR

# アクセスログの分析
docker-compose logs nginx | grep "GET /"
```

## 📚 API リファレンス

### 決済関連ツール

#### create_charge
新しいチャージを作成します。

**パラメータ:**
- `amount` (必須): 金額（最小通貨単位）
- `currency` (必須): 通貨コード（THB, USD, JPY等）
- `description` (オプション): チャージの説明
- `customer` (オプション): 顧客ID
- `card` (オプション): カードID
- `source` (オプション): ソースID
- `capture` (オプション): 即座にキャプチャするか（デフォルト: true）
- `return_uri` (オプション): リダイレクトURI
- `metadata` (オプション): メタデータ

#### retrieve_charge
チャージ情報を取得します。

**パラメータ:**
- `charge_id` (必須): 取得するチャージID

#### list_charges
チャージ一覧を取得します。

**パラメータ:**
- `limit` (オプション): 取得件数（デフォルト: 20）
- `offset` (オプション): オフセット（デフォルト: 0）
- `order` (オプション): 並び順（chronological/reverse_chronological）
- `status` (オプション): ステータスフィルタ
- `customer` (オプション): 顧客IDフィルタ

### 顧客関連ツール

#### create_customer
新しい顧客を作成します。

**パラメータ:**
- `email` (オプション): 顧客のメールアドレス
- `description` (オプション): 顧客の説明
- `card` (オプション): カードID
- `metadata` (オプション): メタデータ

#### retrieve_customer
顧客情報を取得します。

**パラメータ:**
- `customer_id` (必須): 取得する顧客ID

### トークン関連ツール

#### create_token
セキュアな支払い処理のためのカードトークンを作成します。

**パラメータ:**
- `card` (必須): カード情報
  - `name` (必須): カード名義
  - `number` (必須): カード番号
  - `expiration_month` (必須): 有効期限月（1-12）
  - `expiration_year` (必須): 有効期限年（4桁）
  - `city` (オプション): 請求先住所の都市
  - `postal_code` (オプション): 請求先住所の郵便番号
  - `security_code` (オプション): セキュリティコード（CVV/CVC）

## 🔗 外部リンク

### Omise公式ドキュメント

- [Omise API Documentation](https://www.omise.co/api-documentation)
- [Omise Charges API](https://www.omise.co/charges-api)
- [Omise Customers API](https://www.omise.co/customers-api)
- [Omise Transfers API](https://www.omise.co/transfers-api)
- [Omise Refunds API](https://www.omise.co/refunds-api)
- [Omise Disputes API](https://www.omise.co/disputes-api)
- [Omise Schedules API](https://www.omise.co/schedules-api)
- [Omise Events API](https://www.omise.co/events-api)
- [Omise Webhooks API](https://www.omise.co/webhooks-api)
- [Omise Links API](https://www.omise.co/links-api)
- [Omise Chains API](https://www.omise.co/chains-api)
- [Omise Capabilities API](https://www.omise.co/capabilities-api)

### 技術ドキュメント

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)

### サポート

- **GitHub Issues**: [バグレポートと機能要求](https://github.com/your-org/omise-mcp-server/issues)
- **Omise Support**: [Omise公式サポート](https://www.omise.co/support)
- **Community**: [開発者コミュニティ](https://github.com/your-org/omise-mcp-server/discussions)

## 📄 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

## 🤝 貢献

プロジェクトへの貢献を歓迎します！以下の手順に従ってください：

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- コードはTypeScriptで記述
- テストカバレッジを維持
- ESLintルールに従う
- コミットメッセージは明確に記述

## 📈 ロードマップ

### v1.1.0 (予定)
- [ ] 追加の決済方法サポート
- [ ] 高度なレポート機能
- [ ] パフォーマンス最適化

### v1.2.0 (予定)
- [ ] マルチテナント対応の強化
- [ ] 高度な監視機能
- [ ] セキュリティ機能の強化

## 📊 統計

- **総ツール数**: 51
- **対応API**: 11カテゴリ
- **テストカバレッジ**: 95%+
- **TypeScript**: 100%
- **Docker対応**: ✅
- **監視対応**: ✅

---

**Omise MCP Server** で、安全で効率的な決済処理を実現しましょう！ 🚀