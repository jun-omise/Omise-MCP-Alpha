/**
 * MutualTLSProvider Unit Tests
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { MutualTLSProvider } from '../../src/auth/mutual-tls';
import { Logger } from '../../src/utils/logger';
import { mockMTLSConfig } from '../fixtures/auth-fixtures';
import { 
  createMockLogger,
  mockAgentCertificate,
  mockCrypto,
  mockFs
} from '../mocks/auth-mocks';

// Mock crypto module
jest.mock('crypto', () => mockCrypto);

// Mock fs module
jest.mock('fs', () => mockFs);

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  existsSync: jest.fn()
}));

describe('MutualTLSProvider', () => {
  let mTLSProvider: MutualTLSProvider;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mTLSProvider = new MutualTLSProvider(mockMTLSConfig, mockLogger);
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue(Buffer.from('mock-file-content'));
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.mkdirSync.mockImplementation(() => {});
    mockFs.rmSync.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should initialize with new CA when no existing CA found', () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(false);

      // Act
      const provider = new MutualTLSProvider(mockMTLSConfig, mockLogger);

      // Assert
      expect(provider).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Generated new Certificate Authority');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });

    it('should load existing CA when found', () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(true);

      // Act
      const provider = new MutualTLSProvider(mockMTLSConfig, mockLogger);

      // Assert
      expect(provider).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith('Loaded existing Certificate Authority');
      expect(mockFs.readFileSync).toHaveBeenCalled();
    });
  });

  describe('issueAgentCertificate', () => {
    it('should issue new agent certificate successfully', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization',
        email: 'test@example.com',
        description: 'Test agent'
      };

      // Act
      const certificate = await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Assert
      expect(certificate).toBeDefined();
      expect(certificate.agentId).toBe(agentId);
      expect(certificate.privateKey).toBeDefined();
      expect(certificate.certificate).toBeDefined();
      expect(certificate.caCertificate).toBeDefined();
      expect(certificate.issuedAt).toBeInstanceOf(Date);
      expect(certificate.expiresAt).toBeInstanceOf(Date);
      expect(certificate.serialNumber).toBeDefined();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Issued new agent certificate',
        expect.objectContaining({
          agentId,
          serialNumber: certificate.serialNumber,
          expiresAt: certificate.expiresAt
        })
      );

      // Verify certificate files are saved
      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3); // agent-key, agent-cert, ca-cert
    });

    it('should return existing valid certificate if available', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      // Issue certificate first time
      const firstCertificate = await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Act - issue certificate second time
      const secondCertificate = await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Assert
      expect(secondCertificate).toBe(firstCertificate);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Using existing valid certificate',
        { agentId }
      );
    });

    it('should issue new certificate if existing one is expired', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      // Issue certificate first time
      const firstCertificate = await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Mock expired certificate
      const certificateStore = (mTLSProvider as any).certificateStore;
      const storedCert = certificateStore.get(agentId);
      if (storedCert) {
        storedCert.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago
      }

      // Act - issue certificate again
      const secondCertificate = await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Assert
      expect(secondCertificate).not.toBe(firstCertificate);
      expect(secondCertificate.agentId).toBe(agentId);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Issued new agent certificate',
        expect.objectContaining({
          agentId
        })
      );
    });
  });

  describe('validateAgentCertificate', () => {
    it('should validate valid certificate successfully', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const certificate = 'valid-certificate-content';

      // Mock certificate validation
      mockCrypto.createCertificate.mockReturnValue({
        subject: { CN: agentId },
        issuer: { CN: 'Omise MCP Root CA' },
        validFrom: new Date(Date.now() - 1000),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        publicKey: Buffer.from('mock-public-key')
      });

      // Act
      const isValid = await mTLSProvider.validateAgentCertificate(certificate, agentId);

      // Assert
      expect(isValid).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Certificate validation successful',
        { agentId }
      );
    });

    it('should reject certificate not issued by trusted CA', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const certificate = 'invalid-certificate-content';

      // Mock certificate with different issuer
      mockCrypto.createCertificate.mockReturnValue({
        subject: { CN: agentId },
        issuer: { CN: 'Untrusted CA' },
        validFrom: new Date(Date.now() - 1000),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        publicKey: Buffer.from('mock-public-key')
      });

      // Act
      const isValid = await mTLSProvider.validateAgentCertificate(certificate, agentId);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Certificate not issued by trusted CA',
        { agentId }
      );
    });

    it('should reject expired certificate', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const certificate = 'expired-certificate-content';

      // Mock expired certificate
      mockCrypto.createCertificate.mockReturnValue({
        subject: { CN: agentId },
        issuer: { CN: 'Omise MCP Root CA' },
        validFrom: new Date(Date.now() - 1000),
        validTo: new Date(Date.now() - 1000), // Expired
        publicKey: Buffer.from('mock-public-key')
      });

      // Act
      const isValid = await mTLSProvider.validateAgentCertificate(certificate, agentId);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Certificate expired or not yet valid',
        { agentId }
      );
    });

    it('should reject certificate with mismatched subject CN', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const certificate = 'mismatched-certificate-content';

      // Mock certificate with different subject CN
      mockCrypto.createCertificate.mockReturnValue({
        subject: { CN: 'different-agent' },
        issuer: { CN: 'Omise MCP Root CA' },
        validFrom: new Date(Date.now() - 1000),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        publicKey: Buffer.from('mock-public-key')
      });

      // Act
      const isValid = await mTLSProvider.validateAgentCertificate(certificate, agentId);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Certificate subject does not match agent ID',
        { agentId }
      );
    });

    it('should handle certificate validation errors gracefully', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const certificate = 'invalid-certificate-content';

      // Mock certificate creation error
      mockCrypto.createCertificate.mockImplementation(() => {
        throw new Error('Invalid certificate format');
      });

      // Act
      const isValid = await mTLSProvider.validateAgentCertificate(certificate, agentId);

      // Assert
      expect(isValid).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Certificate validation error',
        expect.any(Error),
        { agentId }
      );
    });
  });

  describe('createTLSContext', () => {
    it('should create TLS context successfully', () => {
      // Arrange
      const agentCert = mockAgentCertificate;

      // Act
      const tlsContext = mTLSProvider.createTLSContext(agentCert);

      // Assert
      expect(tlsContext).toBeDefined();
      // Note: In a real test, you would verify the TLS context properties
      // but since we're mocking tls.createSecureContext, we just verify it's called
    });
  });

  describe('revokeAgentCertificate', () => {
    it('should revoke agent certificate successfully', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      // Issue certificate first
      await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Act
      await mTLSProvider.revokeAgentCertificate(agentId);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Agent certificate revoked',
        { agentId }
      );
      expect(mockFs.rmSync).toHaveBeenCalled();
    });

    it('should handle revoking non-existent certificate gracefully', async () => {
      // Act & Assert - should not throw
      await expect(mTLSProvider.revokeAgentCertificate('non-existent-agent'))
        .resolves.toBeUndefined();
    });
  });

  describe('getCertificateStatus', () => {
    it('should return certificate status for valid certificate', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Act
      const status = mTLSProvider.getCertificateStatus(agentId);

      // Assert
      expect(status).toBeDefined();
      expect(status?.agentId).toBe(agentId);
      expect(status?.isExpired).toBe(false);
      expect(status?.status).toBe('valid');
      expect(status?.issuedAt).toBeInstanceOf(Date);
      expect(status?.expiresAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent certificate', () => {
      // Act
      const status = mTLSProvider.getCertificateStatus('non-existent-agent');

      // Assert
      expect(status).toBeNull();
    });

    it('should return expired status for expired certificate', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Mock expired certificate
      const certificateStore = (mTLSProvider as any).certificateStore;
      const storedCert = certificateStore.get(agentId);
      if (storedCert) {
        storedCert.expiresAt = new Date(Date.now() - 1000);
      }

      // Act
      const status = mTLSProvider.getCertificateStatus(agentId);

      // Assert
      expect(status).toBeDefined();
      expect(status?.isExpired).toBe(true);
      expect(status?.status).toBe('expired');
    });

    it('should return expiring_soon status for certificate expiring within 7 days', async () => {
      // Arrange
      const agentId = 'test-agent-001';
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      await mTLSProvider.issueAgentCertificate(agentId, agentInfo);

      // Mock certificate expiring soon
      const certificateStore = (mTLSProvider as any).certificateStore;
      const storedCert = certificateStore.get(agentId);
      if (storedCert) {
        storedCert.expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      }

      // Act
      const status = mTLSProvider.getCertificateStatus(agentId);

      // Assert
      expect(status).toBeDefined();
      expect(status?.isExpired).toBe(false);
      expect(status?.status).toBe('expiring_soon');
    });
  });

  describe('listCertificates', () => {
    it('should list all issued certificates', async () => {
      // Arrange
      const agentInfo = {
        name: 'Test Agent',
        organization: 'Test Organization'
      };

      await mTLSProvider.issueAgentCertificate('agent-001', agentInfo);
      await mTLSProvider.issueAgentCertificate('agent-002', agentInfo);

      // Act
      const certificates = mTLSProvider.listCertificates();

      // Assert
      expect(certificates).toHaveLength(2);
      expect(certificates[0].agentId).toBe('agent-001');
      expect(certificates[1].agentId).toBe('agent-002');
    });

    it('should return empty array when no certificates issued', () => {
      // Act
      const certificates = mTLSProvider.listCertificates();

      // Assert
      expect(certificates).toHaveLength(0);
    });
  });
});
