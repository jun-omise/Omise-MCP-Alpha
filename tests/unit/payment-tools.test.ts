/**
 * Payment Tools 単体テスト
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PaymentTools } from '../../src/tools/payment-tools.js';
import { OmiseClient } from '../../src/utils/omise-client.js';
import { Logger } from '../../src/utils/logger.js';
import { createMockCharge } from '../factories/index.js';

// モックの設定
jest.mock('../../src/utils/omise-client.js');
jest.mock('../../src/utils/logger.js');

describe('PaymentTools', () => {
  let paymentTools: PaymentTools;
  let mockOmiseClient: jest.Mocked<OmiseClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockOmiseClient = new OmiseClient({} as any, {} as any) as jest.Mocked<OmiseClient>;
    mockLogger = new Logger({} as any) as jest.Mocked<Logger>;
    paymentTools = new PaymentTools(mockOmiseClient, mockLogger);
  });

  describe('createCharge', () => {
    it('正常系: チャージを作成できる', async () => {
      // Arrange
      const mockCharge = createMockCharge();
      mockOmiseClient.createCharge.mockResolvedValue(mockCharge);

      const params = {
        amount: 1000,
        currency: 'THB',
        description: 'Test charge',
        capture: true
      };

      // Act
      const result = await paymentTools.createCharge(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharge);
      expect(result.message).toContain('Charge created successfully');
      expect(mockOmiseClient.createCharge).toHaveBeenCalledWith({
        amount: 1000,
        currency: 'THB',
        description: 'Test charge',
        capture: true
      });
    });

    it('異常系: 無効な通貨コードでエラー', async () => {
      // Arrange
      const params = {
        amount: 1000,
        currency: 'INVALID',
        description: 'Test charge'
      };

      // Act
      const result = await paymentTools.createCharge(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid currency code');
      expect(mockOmiseClient.createCharge).not.toHaveBeenCalled();
    });

    it('異常系: 無効な金額でエラー', async () => {
      // Arrange
      const params = {
        amount: -100,
        currency: 'THB',
        description: 'Test charge'
      };

      // Act
      const result = await paymentTools.createCharge(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid amount');
      expect(mockOmiseClient.createCharge).not.toHaveBeenCalled();
    });

    it('異常系: API呼び出しでエラー', async () => {
      // Arrange
      const params = {
        amount: 1000,
        currency: 'THB',
        description: 'Test charge'
      };

      mockOmiseClient.createCharge.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await paymentTools.createCharge(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('retrieveCharge', () => {
    it('正常系: チャージを取得できる', async () => {
      // Arrange
      const mockCharge = createMockCharge();
      mockOmiseClient.get.mockResolvedValue(mockCharge);

      const params = {
        charge_id: 'chrg_1234567890'
      };

      // Act
      const result = await paymentTools.retrieveCharge(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharge);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/charges/chrg_1234567890');
    });

    it('異常系: 無効なチャージIDでエラー', async () => {
      // Arrange
      const params = {
        charge_id: 'invalid_id'
      };

      // Act
      const result = await paymentTools.retrieveCharge(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid charge ID format');
      expect(mockOmiseClient.get).not.toHaveBeenCalled();
    });
  });

  describe('listCharges', () => {
    it('正常系: チャージ一覧を取得できる', async () => {
      // Arrange
      const mockCharges = {
        object: 'list',
        data: [createMockCharge(), createMockCharge()],
        total: 2,
        limit: 20,
        offset: 0,
        order: 'chronological',
        location: '/charges'
      };
      mockOmiseClient.get.mockResolvedValue(mockCharges);

      const params = {
        limit: 20,
        offset: 0
      };

      // Act
      const result = await paymentTools.listCharges(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharges);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/charges', { limit: 20, offset: 0 });
    });

    it('正常系: デフォルトパラメータで取得できる', async () => {
      // Arrange
      const mockCharges = {
        object: 'list',
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
        order: 'chronological',
        location: '/charges'
      };
      mockOmiseClient.get.mockResolvedValue(mockCharges);

      // Act
      const result = await paymentTools.listCharges({});

      // Assert
      expect(result.success).toBe(true);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/charges', {});
    });
  });

  describe('updateCharge', () => {
    it('正常系: チャージを更新できる', async () => {
      // Arrange
      const mockCharge = createMockCharge();
      mockOmiseClient.put.mockResolvedValue(mockCharge);

      const params = {
        charge_id: 'chrg_1234567890',
        description: 'Updated charge'
      };

      // Act
      const result = await paymentTools.updateCharge(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharge);
      expect(mockOmiseClient.put).toHaveBeenCalledWith('/charges/chrg_1234567890', {
        description: 'Updated charge'
      });
    });

    it('異常系: 更新データなしでエラー', async () => {
      // Arrange
      const params = {
        charge_id: 'chrg_1234567890'
      };

      // Act
      const result = await paymentTools.updateCharge(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('No update data provided');
      expect(mockOmiseClient.put).not.toHaveBeenCalled();
    });
  });

  describe('captureCharge', () => {
    it('正常系: チャージを確定できる', async () => {
      // Arrange
      const mockCharge = createMockCharge({ captured: true });
      mockOmiseClient.post.mockResolvedValue(mockCharge);

      const params = {
        charge_id: 'chrg_1234567890'
      };

      // Act
      const result = await paymentTools.captureCharge(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharge);
      expect(mockOmiseClient.post).toHaveBeenCalledWith('/charges/chrg_1234567890/capture', {});
    });
  });

  describe('reverseCharge', () => {
    it('正常系: チャージを取消できる', async () => {
      // Arrange
      const mockCharge = createMockCharge({ reversed: true });
      mockOmiseClient.post.mockResolvedValue(mockCharge);

      const params = {
        charge_id: 'chrg_1234567890'
      };

      // Act
      const result = await paymentTools.reverseCharge(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharge);
      expect(mockOmiseClient.post).toHaveBeenCalledWith('/charges/chrg_1234567890/reverse', {});
    });
  });

  describe('expireCharge', () => {
    it('正常系: チャージを期限切れにできる', async () => {
      // Arrange
      const mockCharge = createMockCharge({ expired: true });
      mockOmiseClient.post.mockResolvedValue(mockCharge);

      const params = {
        charge_id: 'chrg_1234567890'
      };

      // Act
      const result = await paymentTools.expireCharge(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCharge);
      expect(mockOmiseClient.post).toHaveBeenCalledWith('/charges/chrg_1234567890/expire', {});
    });
  });
});
