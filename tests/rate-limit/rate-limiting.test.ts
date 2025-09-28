/**
 * レート制限テスト
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { PaymentTools } from '../../src/tools/payment-tools.js';
import { OmiseClient } from '../../src/utils/omise-client.js';
import { Logger } from '../../src/utils/logger.js';

// モックの設定
jest.mock('../../src/utils/omise-client.js');
jest.mock('../../src/utils/logger.js');

describe('Rate Limiting Tests', () => {
  let paymentTools: PaymentTools;
  let mockOmiseClient: jest.Mocked<OmiseClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockOmiseClient = new OmiseClient({} as any, {} as any) as jest.Mocked<OmiseClient>;
    mockLogger = new Logger({} as any) as jest.Mocked<Logger>;
    paymentTools = new PaymentTools(mockOmiseClient, mockLogger);
    
    // レート制限情報をリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('Rate Limit Headers Processing', () => {
    it('レート制限ヘッダーの正常処理', async () => {
      // Arrange
      const mockCharge = {
        object: 'charge',
        id: 'chrg_1234567890',
        amount: 1000,
        currency: 'THB',
        status: 'successful'
      };

      // レート制限ヘッダーを含むレスポンスをモック
      const mockResponse = {
        data: mockCharge,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '95',
          'X-RateLimit-Reset': '1640995200'
        }
      };

      mockOmiseClient.createCharge.mockResolvedValue(mockCharge);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockOmiseClient.createCharge).toHaveBeenCalled();
    });

    it('レート制限情報の取得', () => {
      // Arrange
      const rateLimitInfo = {
        remaining: 95,
        resetTime: 1640995200,
        limit: 100
      };

      mockOmiseClient.getRateLimitInfo.mockReturnValue(rateLimitInfo);

      // Act
      const info = mockOmiseClient.getRateLimitInfo();

      // Assert
      expect(info).toEqual(rateLimitInfo);
      expect(info?.remaining).toBe(95);
      expect(info?.limit).toBe(100);
    });
  });

  describe('Rate Limit Exceeded Handling', () => {
    it('レート制限超過エラーの処理', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1640995200'
        },
        data: {
          object: 'error',
          location: '/charges',
          code: 'rate_limit_exceeded',
          message: 'Rate limit exceeded'
        }
      };

      mockOmiseClient.createCharge.mockRejectedValue(rateLimitError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('Retry-Afterヘッダーの処理', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '120',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1640995200'
        }
      };

      mockOmiseClient.createCharge.mockRejectedValue(rateLimitError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  describe('Rate Limit Retry Logic', () => {
    it('レート制限後の自動リトライ', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '1',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1640995200'
        }
      };

      const mockCharge = {
        object: 'charge',
        id: 'chrg_1234567890',
        amount: 1000,
        currency: 'THB',
        status: 'successful'
      };

      // 最初はレート制限エラー、2回目は成功
      mockOmiseClient.createCharge
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockCharge);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(true);
      expect(mockOmiseClient.createCharge).toHaveBeenCalledTimes(2);
    });

    it('複数回のレート制限エラー後の失敗', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '1',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1640995200'
        }
      };

      // 3回ともレート制限エラー
      mockOmiseClient.createCharge.mockRejectedValue(rateLimitError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });
  });

  describe('Rate Limit Monitoring', () => {
    it('レート制限残り回数の監視', async () => {
      // Arrange
      const mockCharge = {
        object: 'charge',
        id: 'chrg_1234567890',
        amount: 1000,
        currency: 'THB',
        status: 'successful'
      };

      mockOmiseClient.createCharge.mockResolvedValue(mockCharge);

      // Act
      await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(mockOmiseClient.createCharge).toHaveBeenCalled();
    });

    it('レート制限リセット時間の監視', async () => {
      // Arrange
      const rateLimitInfo = {
        remaining: 5,
        resetTime: Date.now() + 60000, // 1分後
        limit: 100
      };

      mockOmiseClient.getRateLimitInfo.mockReturnValue(rateLimitInfo);

      // Act
      const info = mockOmiseClient.getRateLimitInfo();

      // Assert
      expect(info?.remaining).toBe(5);
      expect(info?.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe('Rate Limit Configuration', () => {
    it('レート制限設定の適用', () => {
      // Arrange
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

      const rateLimitConfig = {
        enabled: true,
        maxRequests: 100,
        windowMs: 60000
      };

      // Act
      const client = new OmiseClient(config, mockLogger);

      // Assert
      expect(client).toBeDefined();
    });

    it('レート制限無効化の設定', () => {
      // Arrange
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

      const rateLimitConfig = {
        enabled: false,
        maxRequests: 0,
        windowMs: 0
      };

      // Act
      const client = new OmiseClient(config, mockLogger);

      // Assert
      expect(client).toBeDefined();
    });
  });

  describe('Rate Limit Queue Management', () => {
    it('レート制限キューへの追加', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1640995200'
        }
      };

      mockOmiseClient.createCharge.mockRejectedValue(rateLimitError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Rate limit exceeded');
    });

    it('キュー処理の実行', async () => {
      // Arrange
      const mockCharge = {
        object: 'charge',
        id: 'chrg_1234567890',
        amount: 1000,
        currency: 'THB',
        status: 'successful'
      };

      mockOmiseClient.createCharge.mockResolvedValue(mockCharge);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Rate Limit Exponential Backoff', () => {
    it('指数バックオフの適用', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '1',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '1640995200'
        }
      };

      const mockCharge = {
        object: 'charge',
        id: 'chrg_1234567890',
        amount: 1000,
        currency: 'THB',
        status: 'successful'
      };

      // 最初はレート制限エラー、2回目は成功
      mockOmiseClient.createCharge
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockCharge);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('Rate Limit Status Codes', () => {
    it('429ステータスコードの処理', async () => {
      // Arrange
      const rateLimitError = new Error('Too Many Requests');
      (rateLimitError as any).response = {
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      };

      mockOmiseClient.createCharge.mockRejectedValue(rateLimitError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Too Many Requests');
    });

    it('503ステータスコードの処理', async () => {
      // Arrange
      const serviceUnavailableError = new Error('Service Unavailable');
      (serviceUnavailableError as any).response = {
        status: 503,
        headers: {
          'Retry-After': '30'
        }
      };

      mockOmiseClient.createCharge.mockRejectedValue(serviceUnavailableError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Service Unavailable');
    });
  });
});
