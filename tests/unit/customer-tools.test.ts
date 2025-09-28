/**
 * Customer Tools 単体テスト
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CustomerTools } from '../../src/tools/customer-tools.js';
import { OmiseClient } from '../../src/utils/omise-client.js';
import { Logger } from '../../src/utils/logger.js';
import { createMockCustomer } from '../factories/index.js';

// モックの設定
jest.mock('../../src/utils/omise-client.js');
jest.mock('../../src/utils/logger.js');

describe('CustomerTools', () => {
  let customerTools: CustomerTools;
  let mockOmiseClient: jest.Mocked<OmiseClient>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockOmiseClient = new OmiseClient({} as any, {} as any) as jest.Mocked<OmiseClient>;
    mockLogger = new Logger({} as any) as jest.Mocked<Logger>;
    customerTools = new CustomerTools(mockOmiseClient, mockLogger);
  });

  describe('createCustomer', () => {
    it('正常系: 顧客を作成できる', async () => {
      // Arrange
      const mockCustomer = createMockCustomer();
      mockOmiseClient.createCustomer.mockResolvedValue(mockCustomer);

      const params = {
        email: 'test@example.com',
        description: 'Test customer'
      };

      // Act
      const result = await customerTools.createCustomer(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(result.message).toContain('Customer created successfully');
      expect(mockOmiseClient.createCustomer).toHaveBeenCalledWith({
        email: 'test@example.com',
        description: 'Test customer'
      });
    });

    it('異常系: 無効なメールアドレスでエラー', async () => {
      // Arrange
      const params = {
        email: 'invalid-email',
        description: 'Test customer'
      };

      // Act
      const result = await customerTools.createCustomer(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email format');
      expect(mockOmiseClient.createCustomer).not.toHaveBeenCalled();
    });

    it('異常系: API呼び出しでエラー', async () => {
      // Arrange
      const params = {
        email: 'test@example.com',
        description: 'Test customer'
      };

      mockOmiseClient.createCustomer.mockRejectedValue(new Error('API Error'));

      // Act
      const result = await customerTools.createCustomer(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });

  describe('retrieveCustomer', () => {
    it('正常系: 顧客を取得できる', async () => {
      // Arrange
      const mockCustomer = createMockCustomer();
      mockOmiseClient.get.mockResolvedValue(mockCustomer);

      const params = {
        customer_id: 'cust_1234567890'
      };

      // Act
      const result = await customerTools.retrieveCustomer(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/customers/cust_1234567890');
    });

    it('異常系: 無効な顧客IDでエラー', async () => {
      // Arrange
      const params = {
        customer_id: 'invalid_id'
      };

      // Act
      const result = await customerTools.retrieveCustomer(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid customer ID format');
      expect(mockOmiseClient.get).not.toHaveBeenCalled();
    });
  });

  describe('listCustomers', () => {
    it('正常系: 顧客一覧を取得できる', async () => {
      // Arrange
      const mockCustomers = {
        object: 'list',
        data: [createMockCustomer(), createMockCustomer()],
        total: 2,
        limit: 20,
        offset: 0,
        order: 'chronological',
        location: '/customers'
      };
      mockOmiseClient.get.mockResolvedValue(mockCustomers);

      const params = {
        limit: 20,
        offset: 0
      };

      // Act
      const result = await customerTools.listCustomers(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomers);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/customers', { limit: 20, offset: 0 });
    });
  });

  describe('updateCustomer', () => {
    it('正常系: 顧客を更新できる', async () => {
      // Arrange
      const mockCustomer = createMockCustomer();
      mockOmiseClient.put.mockResolvedValue(mockCustomer);

      const params = {
        customer_id: 'cust_1234567890',
        email: 'updated@example.com'
      };

      // Act
      const result = await customerTools.updateCustomer(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockOmiseClient.put).toHaveBeenCalledWith('/customers/cust_1234567890', {
        email: 'updated@example.com'
      });
    });

    it('異常系: 更新データなしでエラー', async () => {
      // Arrange
      const params = {
        customer_id: 'cust_1234567890'
      };

      // Act
      const result = await customerTools.updateCustomer(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('No update data provided');
      expect(mockOmiseClient.put).not.toHaveBeenCalled();
    });
  });

  describe('destroyCustomer', () => {
    it('正常系: 顧客を削除できる', async () => {
      // Arrange
      const mockCustomer = createMockCustomer({ deleted: true });
      mockOmiseClient.delete.mockResolvedValue(mockCustomer);

      const params = {
        customer_id: 'cust_1234567890',
        confirm: true
      };

      // Act
      const result = await customerTools.destroyCustomer(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCustomer);
      expect(mockOmiseClient.delete).toHaveBeenCalledWith('/customers/cust_1234567890');
    });

    it('異常系: 確認なしでエラー', async () => {
      // Arrange
      const params = {
        customer_id: 'cust_1234567890'
      };

      // Act
      const result = await customerTools.destroyCustomer(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Customer deletion requires confirmation');
      expect(mockOmiseClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('listCustomerCards', () => {
    it('正常系: 顧客のカード一覧を取得できる', async () => {
      // Arrange
      const mockCards = {
        object: 'list',
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
        order: 'chronological',
        location: '/customers/cust_1234567890/cards'
      };
      mockOmiseClient.get.mockResolvedValue(mockCards);

      const params = {
        customer_id: 'cust_1234567890'
      };

      // Act
      const result = await customerTools.listCustomerCards(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCards);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/customers/cust_1234567890/cards', {});
    });
  });

  describe('retrieveCustomerCard', () => {
    it('正常系: 顧客のカードを取得できる', async () => {
      // Arrange
      const mockCard = {
        object: 'card',
        id: 'card_1234567890',
        brand: 'Visa',
        last_digits: '1234'
      };
      mockOmiseClient.get.mockResolvedValue(mockCard);

      const params = {
        customer_id: 'cust_1234567890',
        card_id: 'card_1234567890'
      };

      // Act
      const result = await customerTools.retrieveCustomerCard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCard);
      expect(mockOmiseClient.get).toHaveBeenCalledWith('/customers/cust_1234567890/cards/card_1234567890');
    });
  });

  describe('updateCustomerCard', () => {
    it('正常系: 顧客のカードを更新できる', async () => {
      // Arrange
      const mockCard = {
        object: 'card',
        id: 'card_1234567890',
        brand: 'Visa',
        last_digits: '1234'
      };
      mockOmiseClient.put.mockResolvedValue(mockCard);

      const params = {
        customer_id: 'cust_1234567890',
        card_id: 'card_1234567890',
        name: 'Updated Name'
      };

      // Act
      const result = await customerTools.updateCustomerCard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCard);
      expect(mockOmiseClient.put).toHaveBeenCalledWith('/customers/cust_1234567890/cards/card_1234567890', {
        name: 'Updated Name'
      });
    });
  });

  describe('destroyCustomerCard', () => {
    it('正常系: 顧客のカードを削除できる', async () => {
      // Arrange
      const mockCard = {
        object: 'card',
        id: 'card_1234567890',
        deleted: true
      };
      mockOmiseClient.delete.mockResolvedValue(mockCard);

      const params = {
        customer_id: 'cust_1234567890',
        card_id: 'card_1234567890',
        confirm: true
      };

      // Act
      const result = await customerTools.destroyCustomerCard(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCard);
      expect(mockOmiseClient.delete).toHaveBeenCalledWith('/customers/cust_1234567890/cards/card_1234567890');
    });

    it('異常系: 確認なしでエラー', async () => {
      // Arrange
      const params = {
        customer_id: 'cust_1234567890',
        card_id: 'card_1234567890'
      };

      // Act
      const result = await customerTools.destroyCustomerCard(params);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Card deletion requires confirmation');
      expect(mockOmiseClient.delete).not.toHaveBeenCalled();
    });
  });
});
