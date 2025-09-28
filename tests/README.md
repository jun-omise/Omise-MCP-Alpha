# Omise MCP Server Test Suite

This directory contains a comprehensive test suite for the Omise MCP Server.

## Test Configuration

### Test Framework
- **Jest**: Main test framework
- **MSW**: API mock server
- **Faker**: Test data generation
- **Supertest**: HTTP integration testing

### Test Types

#### 1. Unit Tests (`/unit/`)
- Individual tool functionality tests
- Validation function tests
- Coverage of both normal and error cases

#### 2. Integration Tests (`/integration/`)
- API integration tests
- End-to-end flow tests
- Actual API call tests

#### 3. Error Handling Tests (`/error/`)
- API error response handling
- Network error handling
- Validation error handling
- Unexpected error handling

#### 4. Authentication & Authorization Tests (`/auth/`)
- API key authentication tests
- Environment-specific key validation
- Permission-based authorization tests
- Session management tests

#### 5. Rate Limiting Tests (`/rate-limit/`)
- Rate limit header processing
- Automatic retry functionality
- Exponential backoff
- Queue management

## Test Execution

### Run All Tests
```bash
npm test
```

### Run Specific Category Tests
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Error handling tests only
npm run test:error

# Authentication tests only
npm run test:auth

# Rate limiting tests only
npm run test:rate-limit
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Test Data Factories

The `/factories/` directory contains factory functions for generating mock data for each Omise resource:

- `createMockCharge()` - Charge data
- `createMockCustomer()` - Customer data
- `createMockCard()` - Card data
- `createMockToken()` - Token data
- `createMockTransfer()` - Transfer data
- `createMockRecipient()` - Recipient data
- `createMockRefund()` - Refund data
- `createMockDispute()` - Dispute data
- `createMockSchedule()` - Schedule data
- `createMockEvent()` - Event data
- `createMockWebhookEndpoint()` - Webhook endpoint data
- `createMockLink()` - Link data
- `createMockChain()` - Chain data
- `createMockCapability()` - Capability data

## Mock Server

The `/mocks/` directory contains API mock server configuration using MSW:

- `server.ts` - Mock server configuration
- `handlers.ts` - Mock handlers for API endpoints

## Test Configuration

### Jest Configuration
- TypeScript support
- Coverage report generation
- Test timeout setting (30 seconds)
- Automatic setup file loading

### Environment Variables
The following environment variables are automatically set during test execution:
- `NODE_ENV=test`
- `OMISE_PUBLIC_KEY=pkey_test_1234567890`
- `OMISE_SECRET_KEY=skey_test_1234567890`
- `OMISE_ENVIRONMENT=test`

## テストカバレッジ

テストスイートは以下の領域をカバーしています：

### 機能カバレッジ
- ✅ 全APIツールの正常系・異常系
- ✅ バリデーション機能
- ✅ エラーハンドリング
- ✅ 認証・認可
- ✅ レート制限
- ✅ リトライ機能
- ✅ ログ機能

### APIカバレッジ
- ✅ Charge API
- ✅ Customer API
- ✅ Token API
- ✅ Source API
- ✅ Transfer API
- ✅ Recipient API
- ✅ Refund API
- ✅ Dispute API
- ✅ Schedule API
- ✅ Event API
- ✅ Webhook API
- ✅ Link API
- ✅ Chain API
- ✅ Capability API

## テストベストプラクティス

### テスト構造
```typescript
describe('Feature Name', () => {
  describe('Method Name', () => {
    it('正常系: 期待される動作', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('異常系: エラーケース', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### モックの使用
```typescript
// モックの設定
jest.mock('../../src/utils/omise-client.js');

// テストでの使用
mockOmiseClient.createCharge.mockResolvedValue(mockCharge);
```

### アサーション
```typescript
// 成功ケース
expect(result.success).toBe(true);
expect(result.data).toEqual(expectedData);

// エラーケース
expect(result.success).toBe(false);
expect(result.error).toContain('Expected error message');
```

## 継続的インテグレーション

### GitHub Actions
テストは以下のトリガーで自動実行されます：
- プルリクエスト作成時
- メインブランチへのプッシュ時
- 手動実行

### テスト結果
- テスト成功率
- カバレッジレポート
- パフォーマンスメトリクス
- セキュリティスキャン結果

## トラブルシューティング

### よくある問題

#### 1. テストがタイムアウトする
```bash
# タイムアウト時間を延長
jest --testTimeout=60000
```

#### 2. モックが正しく動作しない
```typescript
// モックのリセット
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### 3. 環境変数が設定されない
```typescript
// テストファイルで明示的に設定
process.env.OMISE_PUBLIC_KEY = 'pkey_test_1234567890';
```

### デバッグ
```bash
# 詳細ログ付きでテスト実行
DEBUG=* npm test

# 特定のテストのみ実行
npm test -- --testNamePattern="特定のテスト名"
```

## 貢献

新しいテストを追加する際は、以下のガイドラインに従ってください：

1. テストファイルは適切なディレクトリに配置
2. テスト名は日本語で記述（機能を明確に表現）
3. Arrange-Act-Assert パターンを使用
4. モックは適切に設定・リセット
5. アサーションは具体的で明確
6. エラーケースも必ずテスト
7. カバレッジを向上させる

## ライセンス

このテストスイートは、メインプロジェクトと同じライセンスの下で提供されています。
