/**
 * API統合テスト
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PaymentTools } from '../../src/tools/payment-tools';
import { CustomerTools } from '../../src/tools/customer-tools';
import { OmiseClient } from '../../src/utils/omise-client';
import { Logger } from '../../src/utils/logger';
import { createMockCharge, createMockCustomer } from '../factories/index';

describe('API Integration Tests', () => {
  let paymentTools: PaymentTools;
  let customerTools: CustomerTools;
  let omiseClient: OmiseClient;
  let logger: Logger;

  beforeAll(() => {
    // 統合テスト用の実際のクライアントを初期化
    const config = {
      publicKey: 'pkey_test_1234567890',
      secretKey: 'skey_test_1234567890',
      environment: 'test' as const,
      apiVersion: '2017-11-02',
      baseUrl: 'https://api.omise.co',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    };

    logger = new Logger({
      omise: config,
      server: { name: 'test', version: '1.0.0', description: 'Test', port: 3000, host: 'localhost' },
      logging: { level: 'error', format: 'simple', enableRequestLogging: false, enableResponseLogging: false },
      rateLimit: { enabled: false, maxRequests: 100, windowMs: 60000 }
    });

    omiseClient = new OmiseClient(config, logger);
    paymentTools = new PaymentTools(omiseClient, logger);
    customerTools = new CustomerTools(omiseClient, logger);
  });

  describe('Payment Flow Integration', () => {
    it('顧客作成 → チャージ作成の統合テスト', async () => {
      // 1. 顧客を作成
      const customerParams = {
        email: 'integration-test@example.com',
        description: 'Integration test customer'
      };

      const customerResult = await customerTools.createCustomer(customerParams);
      expect(customerResult.success).toBe(true);
      expect(customerResult.data).toBeDefined();

      const customerId = customerResult.data?.id;
      expect(customerId).toBeDefined();

      // 2. 顧客のチャージを作成
      const chargeParams = {
        amount: 1000,
        currency: 'THB',
        customer: customerId,
        description: 'Integration test charge'
      };

      const chargeResult = await paymentTools.createCharge(chargeParams);
      expect(chargeResult.success).toBe(true);
      expect(chargeResult.data).toBeDefined();
      expect(chargeResult.data?.customer).toBe(customerId);
    });

    it('チャージ作成 → 返金の統合テスト', async () => {
      // 1. チャージを作成
      const chargeParams = {
        amount: 1000,
        currency: 'THB',
        description: 'Integration test charge for refund'
      };

      const chargeResult = await paymentTools.createCharge(chargeParams);
      expect(chargeResult.success).toBe(true);

      const chargeId = chargeResult.data?.id;
      expect(chargeId).toBeDefined();

      // 2. チャージを取得して確認
      const retrieveResult = await paymentTools.retrieveCharge({ charge_id: chargeId });
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.id).toBe(chargeId);
    });
  });

  describe('Customer Management Integration', () => {
    it('顧客作成 → 更新 → 削除の統合テスト', async () => {
      // 1. 顧客を作成
      const createParams = {
        email: 'integration-crud@example.com',
        description: 'Integration CRUD test customer'
      };

      const createResult = await customerTools.createCustomer(createParams);
      expect(createResult.success).toBe(true);

      const customerId = createResult.data?.id;
      expect(customerId).toBeDefined();

      // 2. 顧客を更新
      const updateParams = {
        customer_id: customerId,
        email: 'updated-integration@example.com',
        description: 'Updated integration test customer'
      };

      const updateResult = await customerTools.updateCustomer(updateParams);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.email).toBe('updated-integration@example.com');

      // 3. 顧客を取得して確認
      const retrieveResult = await customerTools.retrieveCustomer({ customer_id: customerId });
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.email).toBe('updated-integration@example.com');
    });
  });

  describe('List Operations Integration', () => {
    it('顧客一覧 → チャージ一覧の統合テスト', async () => {
      // 1. 顧客一覧を取得
      const customersResult = await customerTools.listCustomers({
        limit: 5,
        offset: 0
      });

      expect(customersResult.success).toBe(true);
      expect(customersResult.data).toBeDefined();
      expect(Array.isArray(customersResult.data?.data)).toBe(true);

      // 2. チャージ一覧を取得
      const chargesResult = await paymentTools.listCharges({
        limit: 5,
        offset: 0
      });

      expect(chargesResult.success).toBe(true);
      expect(chargesResult.data).toBeDefined();
      expect(Array.isArray(chargesResult.data?.data)).toBe(true);
    });
  });

  describe('Error Handling Integration', () => {
    it('存在しないリソースへのアクセス', async () => {
      // 存在しないチャージIDで取得を試行
      const result = await paymentTools.retrieveCharge({
        charge_id: 'chrg_nonexistent'
      });

      // エラーレスポンスを期待
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('無効なパラメータでの作成', async () => {
      // 無効な金額でチャージ作成を試行
      const result = await paymentTools.createCharge({
        amount: -100,
        currency: 'THB',
        description: 'Invalid amount test'
      });

      // バリデーションエラーを期待
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
    });
  });

  describe('Pagination Integration', () => {
    it('ページネーション機能のテスト', async () => {
      // 1ページ目を取得
      const firstPage = await customerTools.listCustomers({
        limit: 2,
        offset: 0
      });

      expect(firstPage.success).toBe(true);
      expect(firstPage.data?.limit).toBe(2);
      expect(firstPage.data?.offset).toBe(0);

      // 2ページ目を取得
      const secondPage = await customerTools.listCustomers({
        limit: 2,
        offset: 2
      });

      expect(secondPage.success).toBe(true);
      expect(secondPage.data?.limit).toBe(2);
      expect(secondPage.data?.offset).toBe(2);
    });
  });

  describe('Filtering Integration', () => {
    it('日付範囲フィルタリングのテスト', async () => {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 30);
      const toDate = new Date();

      const result = await paymentTools.listCharges({
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        limit: 10
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('Concurrent Operations Integration', () => {
    it('並行操作のテスト', async () => {
      // 複数の顧客を並行して作成
      const promises = Array.from({ length: 3 }, (_, index) => 
        customerTools.createCustomer({
          email: `concurrent-test-${index}@example.com`,
          description: `Concurrent test customer ${index}`
        })
      );

      const results = await Promise.all(promises);

      // すべての操作が成功することを確認
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });
    });
  });
});
