/**
 * エラーハンドリングテスト
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PaymentTools } from '../../src/tools/payment-tools.js';
import { OmiseClient } from '../../src/utils/omise-client.js';
import { Logger } from '../../src/utils/logger.js';

// モックの設定
jest.mock('../../src/utils/omise-client.js');
jest.mock('../../src/utils/logger.js');

describe('Error Handling Tests', () => {
  let paymentTools: PaymentTools;
  let mockOmiseClient: jest.Mocked<OmiseClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockOmiseClient = new OmiseClient({} as any, {} as any) as jest.Mocked<OmiseClient>;
    mockLogger = new Logger({} as any) as jest.Mocked<Logger>;
    paymentTools = new PaymentTools(mockOmiseClient, mockLogger);
  });

  describe('API Error Handling', () => {
    it('404 Not Found エラーの処理', async () => {
      // Arrange
      const notFoundError = new Error('Charge not found');
      (notFoundError as any).response = {
        status: 404,
        data: {
          object: 'error',
          location: '/charges/nonexistent',
          code: 'not_found',
          message: 'Charge not found'
        }
      };
      mockOmiseClient.get.mockRejectedValue(notFoundError);

      // Act
      const result = await paymentTools.retrieveCharge({
        charge_id: 'chrg_nonexistent'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Charge not found');
    });

    it('400 Bad Request エラーの処理', async () => {
      // Arrange
      const badRequestError = new Error('Invalid card information');
      (badRequestError as any).response = {
        status: 400,
        data: {
          object: 'error',
          location: '/charges',
          code: 'invalid_card',
          message: 'Invalid card information'
        }
      };
      mockOmiseClient.createCharge.mockRejectedValue(badRequestError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid card information');
    });

    it('500 Internal Server Error の処理', async () => {
      // Arrange
      const serverError = new Error('Internal server error');
      (serverError as any).response = {
        status: 500,
        data: {
          object: 'error',
          location: '/charges',
          code: 'internal_server_error',
          message: 'Internal server error'
        }
      };
      mockOmiseClient.createCharge.mockRejectedValue(serverError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');
    });
  });

  describe('Network Error Handling', () => {
    it('ネットワークタイムアウトエラーの処理', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ECONNABORTED';
      mockOmiseClient.createCharge.mockRejectedValue(timeoutError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
    });

    it('ネットワーク接続エラーの処理', async () => {
      // Arrange
      const connectionError = new Error('Network error');
      (connectionError as any).code = 'ENOTFOUND';
      mockOmiseClient.createCharge.mockRejectedValue(connectionError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('Validation Error Handling', () => {
    it('無効な通貨コードの処理', async () => {
      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'INVALID',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid currency code');
      expect(mockOmiseClient.createCharge).not.toHaveBeenCalled();
    });

    it('無効な金額の処理', async () => {
      // Act
      const result = await paymentTools.createCharge({
        amount: -100,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
      expect(mockOmiseClient.createCharge).not.toHaveBeenCalled();
    });

    it('無効なチャージIDの処理', async () => {
      // Act
      const result = await paymentTools.retrieveCharge({
        charge_id: 'invalid_id'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid charge ID format');
      expect(mockOmiseClient.get).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('レート制限エラーの処理', async () => {
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
  });

  describe('Authentication Error Handling', () => {
    it('認証エラーの処理', async () => {
      // Arrange
      const authError = new Error('Authentication failed');
      (authError as any).response = {
        status: 401,
        data: {
          object: 'error',
          location: '/charges',
          code: 'authentication_failed',
          message: 'Authentication failed'
        }
      };
      mockOmiseClient.createCharge.mockRejectedValue(authError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed');
    });
  });

  describe('Unexpected Error Handling', () => {
    it('予期しないエラーの処理', async () => {
      // Arrange
      const unexpectedError = new Error('Unexpected error');
      mockOmiseClient.createCharge.mockRejectedValue(unexpectedError);

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });

    it('非Errorオブジェクトの例外処理', async () => {
      // Arrange
      mockOmiseClient.createCharge.mockRejectedValue('String error');

      // Act
      const result = await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });
  });

  describe('Partial Error Handling', () => {
    it('部分的な更新エラーの処理', async () => {
      // Arrange
      const partialError = new Error('Partial update failed');
      mockOmiseClient.put.mockRejectedValue(partialError);

      // Act
      const result = await paymentTools.updateCharge({
        charge_id: 'chrg_1234567890',
        description: 'Updated description'
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Partial update failed');
    });
  });

  describe('Error Logging', () => {
    it('エラーログの出力確認', async () => {
      // Arrange
      const testError = new Error('Test error for logging');
      mockOmiseClient.createCharge.mockRejectedValue(testError);

      // Act
      await paymentTools.createCharge({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      });

      // Assert
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create charge via MCP tool',
        testError,
        expect.any(Object)
      );
    });
  });
});
