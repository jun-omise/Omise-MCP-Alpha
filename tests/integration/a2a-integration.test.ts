/**
 * A2A Integration Tests
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { A2AAuthService } from '../../src/auth/a2a-auth-service';
import { OAuth2Provider } from '../../src/auth/oauth2-provider';
import { MutualTLSProvider } from '../../src/auth/mutual-tls';
import { A2ACommunication } from '../../src/auth/a2a-communication';
import { Logger } from '../../src/utils/logger';
import { 
  mockAgentRegistrationInfo,
  createMockAgentRegistrationInfo,
  mockPaymentPayload,
  mockCustomerPayload,
  mockWebhookPayload
} from '../fixtures/auth-fixtures';
import { 
  createMockLogger,
  mockSuccessfulResponses,
  mockErrorResponses
} from '../mocks/auth-mocks';

// Mock external dependencies
jest.mock('crypto', () => ({
  randomBytes: jest.fn((size: number) => Buffer.alloc(size, 'mock-random')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mock-hash')
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'mock-hmac')
  })),
  createCipher: jest.fn(() => ({
    update: jest.fn(() => 'mock-encrypted'),
    final: jest.fn(() => 'mock-final'),
    getAuthTag: jest.fn(() => Buffer.from('mock-auth-tag'))
  })),
  createDecipher: jest.fn(() => ({
    update: jest.fn(() => 'mock-decrypted'),
    final: jest.fn(() => 'mock-final'),
    setAuthTag: jest.fn()
  })),
  generateKeyPairSync: jest.fn(() => ({
    privateKey: Buffer.from('mock-private-key'),
    publicKey: Buffer.from('mock-public-key')
  })),
  createCertificate: jest.fn(() => ({
    subject: { CN: 'test-agent' },
    issuer: { CN: 'Omise MCP Root CA' },
    validFrom: new Date(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    publicKey: Buffer.from('mock-public-key')
  })),
  createPublicKey: jest.fn(() => Buffer.from('mock-public-key'))
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(() => Buffer.from('mock-file-content')),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn()
}));

jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    request: jest.fn().mockResolvedValue({
      data: { success: true, messageId: 'test-msg-001' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {}
    }),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }))
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ sub: 'test-client', scopes: ['read', 'write'] }))
}));

describe('A2A Integration Tests', () => {
  let a2aAuthService: A2AAuthService;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: any;

  beforeEach(() => {
    mockLogger = createMockLogger();
    
    mockConfig = {
      agentId: 'integration-test-agent',
      agentName: 'Integration Test Agent',
      organization: 'Test Organization',
      baseUrl: 'https://api.example.com',
      oauth: {
        enabled: true,
        clientSecret: 'integration-test-secret',
        accessTokenExpiry: 3600,
        refreshTokenExpiry: 86400,
        authorizationCodeExpiry: 600,
        jwtSecret: 'integration-test-jwt-secret'
      },
      mtls: {
        enabled: true,
        certPath: './integration-test-certs',
        certificateValidityDays: 365,
        keySize: 2048
      },
      security: {
        level: 'high',
        requireMFA: false,
        maxSessionDuration: 3600000,
        allowedIPs: ['127.0.0.1'],
        allowedUserAgents: ['Integration-Test-Agent/1.0.0'],
        rateLimitPerMinute: 100,
        encryptionRequired: true,
        signingKey: 'integration-test-signing-key',
        encryptionKey: 'integration-test-encryption-key',
        auditLogging: true
      },
      communication: {
        requestTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
      }
    };

    a2aAuthService = new A2AAuthService(mockConfig, mockLogger);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('End-to-End Agent Registration and Authentication Flow', () => {
    it('should complete full agent registration and authentication flow', async () => {
      // Step 1: Register agent
      const agentInfo = createMockAgentRegistrationInfo({
        name: 'E2E Test Agent',
        organization: 'E2E Test Organization',
        email: 'e2e@test.com',
        description: 'End-to-end test agent',
        redirectUris: ['https://e2e.test.com/oauth/callback'],
        scopes: ['read', 'write'],
        grantTypes: ['authorization_code', 'refresh_token']
      });

      const registrationResult = await a2aAuthService.registerAgent(agentInfo);
      
      expect(registrationResult).toBeDefined();
      expect(registrationResult.success).toBe(true);
      expect(registrationResult.agentId).toBeDefined();
      expect(registrationResult.clientSecret).toBeDefined();
      expect(registrationResult.certificate).toBeDefined();
      expect(registrationResult.oauthConfig).toBeDefined();

      // Step 2: Authenticate agent
      const authResult = await a2aAuthService.authenticateAgent(
        registrationResult.agentId,
        registrationResult.clientSecret,
        'high'
      );

      expect(authResult).toBeDefined();
      expect(authResult.success).toBe(true);
      expect(authResult.agentIdentity).toBeDefined();
      expect(authResult.sessionId).toBeDefined();

      // Step 3: Establish secure channel
      const channelResult = await a2aAuthService.establishSecureChannel(
        'target-agent-001',
        'high'
      );

      expect(channelResult).toBeDefined();
      expect(channelResult.success).toBe(true);
      expect(channelResult.targetAgentId).toBe('target-agent-001');
      expect(channelResult.securityLevel).toBe('high');
      expect(channelResult.hasTLS).toBe(true);

      // Step 4: Send secure message
      const messageResult = await a2aAuthService.sendSecureMessage(
        'target-agent-001',
        'payment_request',
        mockPaymentPayload,
        { encrypt: true, priority: 'high' }
      );

      expect(messageResult).toBeDefined();
      expect(messageResult.success).toBe(true);
      expect(messageResult.messageId).toBeDefined();
      expect(messageResult.encrypted).toBe(true);

      // Step 5: Perform health check
      const healthResult = await a2aAuthService.performHealthCheck('target-agent-001');

      expect(healthResult).toBeDefined();
      expect(healthResult.service).toBe('target-agent-001');
      expect(healthResult.status).toBe('healthy');
      expect(healthResult.responseTime).toBeGreaterThan(0);

      // Verify audit logging
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.successfulRequests).toBeGreaterThan(0);
    });
  });

  describe('Multi-Agent Communication Scenario', () => {
    it('should handle communication between multiple agents', async () => {
      // Register multiple agents
      const agent1Info = createMockAgentRegistrationInfo({
        name: 'Payment Agent',
        organization: 'Payment Corp',
        scopes: ['read', 'write']
      });

      const agent2Info = createMockAgentRegistrationInfo({
        name: 'Customer Agent',
        organization: 'Customer Corp',
        scopes: ['read']
      });

      const agent3Info = createMockAgentRegistrationInfo({
        name: 'Webhook Agent',
        organization: 'Webhook Corp',
        scopes: ['read', 'write']
      });

      // Register agents
      const agent1 = await a2aAuthService.registerAgent(agent1Info);
      const agent2 = await a2aAuthService.registerAgent(agent2Info);
      const agent3 = await a2aAuthService.registerAgent(agent3Info);

      expect(agent1.success).toBe(true);
      expect(agent2.success).toBe(true);
      expect(agent3.success).toBe(true);

      // Authenticate agents
      const auth1 = await a2aAuthService.authenticateAgent(agent1.agentId, agent1.clientSecret);
      const auth2 = await a2aAuthService.authenticateAgent(agent2.agentId, agent2.clientSecret);
      const auth3 = await a2aAuthService.authenticateAgent(agent3.agentId, agent3.clientSecret);

      expect(auth1.success).toBe(true);
      expect(auth2.success).toBe(true);
      expect(auth3.success).toBe(true);

      // Establish channels between agents
      const channel1to2 = await a2aAuthService.establishSecureChannel(agent2.agentId, 'high');
      const channel1to3 = await a2aAuthService.establishSecureChannel(agent3.agentId, 'standard');
      const channel2to3 = await a2aAuthService.establishSecureChannel(agent3.agentId, 'standard');

      expect(channel1to2.success).toBe(true);
      expect(channel1to3.success).toBe(true);
      expect(channel2to3.success).toBe(true);

      // Send messages between agents
      const paymentMsg = await a2aAuthService.sendSecureMessage(
        agent2.agentId,
        'payment_request',
        mockPaymentPayload,
        { encrypt: true }
      );

      const customerMsg = await a2aAuthService.sendSecureMessage(
        agent3.agentId,
        'customer_query',
        mockCustomerPayload,
        { encrypt: false }
      );

      const webhookMsg = await a2aAuthService.sendSecureMessage(
        agent3.agentId,
        'webhook_notification',
        mockWebhookPayload,
        { encrypt: true, priority: 'high' }
      );

      expect(paymentMsg.success).toBe(true);
      expect(customerMsg.success).toBe(true);
      expect(webhookMsg.success).toBe(true);

      // Verify metrics show multi-agent activity
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(5);
      expect(metrics.topAgents.length).toBeGreaterThan(1);
    });
  });

  describe('Security and Error Handling Scenarios', () => {
    it('should handle rate limiting across multiple agents', async () => {
      // Register agent
      const agentInfo = createMockAgentRegistrationInfo();
      const registration = await a2aAuthService.registerAgent(agentInfo);
      const auth = await a2aAuthService.authenticateAgent(registration.agentId, registration.clientSecret);

      expect(registration.success).toBe(true);
      expect(auth.success).toBe(true);

      // Establish channel
      const channel = await a2aAuthService.establishSecureChannel('target-agent', 'high');
      expect(channel.success).toBe(true);

      // Mock rate limiting by setting high request count
      const rateLimitStore = (a2aAuthService as any).rateLimitStore;
      rateLimitStore.set('target-agent', {
        agentId: 'target-agent',
        requestsPerMinute: 101, // Exceeds limit
        requestsPerHour: 1,
        requestsPerDay: 1,
        resetTime: new Date(Date.now() + 60000),
        isBlocked: true
      });

      // Attempt to send message (should be rate limited)
      await expect(a2aAuthService.sendSecureMessage(
        'target-agent',
        'payment_request',
        mockPaymentPayload
      )).rejects.toThrow('Rate limit exceeded for target agent');

      // Verify metrics show blocked requests
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.blockedRequests).toBeGreaterThan(0);
    });

    it('should handle authentication failures gracefully', async () => {
      // Attempt to authenticate with invalid credentials
      const authResult = await a2aAuthService.authenticateAgent(
        'invalid-client',
        'invalid-secret'
      );

      expect(authResult.success).toBe(false);
      expect(authResult.error).toBeDefined();

      // Verify audit logging
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.failedRequests).toBeGreaterThan(0);
      expect(metrics.securityEvents.some(event => event.type === 'authentication_failed')).toBe(true);
    });

    it('should handle certificate validation failures', async () => {
      // Register agent with mTLS
      const agentInfo = createMockAgentRegistrationInfo();
      const registration = await a2aAuthService.registerAgent(agentInfo);

      expect(registration.success).toBe(true);
      expect(registration.certificate).toBeDefined();

      // Mock certificate validation failure
      const mockMTLSProvider = (a2aAuthService as any).mTLSProvider;
      mockMTLSProvider.validateAgentCertificate.mockResolvedValue(false);

      // Attempt to establish channel (should fail due to invalid certificate)
      await expect(a2aAuthService.establishSecureChannel('target-agent', 'high'))
        .rejects.toThrow('Invalid certificate for agent: target-agent');
    });

    it('should handle message encryption/decryption failures', async () => {
      // Register and authenticate agent
      const agentInfo = createMockAgentRegistrationInfo();
      const registration = await a2aAuthService.registerAgent(agentInfo);
      const auth = await a2aAuthService.authenticateAgent(registration.agentId, registration.clientSecret);

      expect(registration.success).toBe(true);
      expect(auth.success).toBe(true);

      // Establish channel
      const channel = await a2aAuthService.establishSecureChannel('target-agent', 'high');
      expect(channel.success).toBe(true);

      // Mock encryption failure
      const mockA2ACommunication = (a2aAuthService as any).a2aCommunication;
      mockA2ACommunication.sendMessage.mockRejectedValue(new Error('Encryption failed'));

      // Attempt to send encrypted message (should fail)
      await expect(a2aAuthService.sendSecureMessage(
        'target-agent',
        'payment_request',
        mockPaymentPayload,
        { encrypt: true }
      )).rejects.toThrow('Encryption failed');
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle concurrent agent registrations', async () => {
      const concurrentRegistrations = Array.from({ length: 10 }, (_, i) => 
        createMockAgentRegistrationInfo({
          name: `Concurrent Agent ${i}`,
          organization: `Concurrent Org ${i}`,
          email: `concurrent${i}@test.com`
        })
      );

      const registrationPromises = concurrentRegistrations.map(agentInfo =>
        a2aAuthService.registerAgent(agentInfo)
      );

      const results = await Promise.all(registrationPromises);

      // All registrations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.agentId).toBeDefined();
        expect(result.clientSecret).toBeDefined();
      });

      // Verify unique agent IDs
      const agentIds = results.map(r => r.agentId);
      const uniqueAgentIds = new Set(agentIds);
      expect(uniqueAgentIds.size).toBe(agentIds.length);
    });

    it('should handle concurrent message sending', async () => {
      // Setup: Register agent and establish channel
      const agentInfo = createMockAgentRegistrationInfo();
      const registration = await a2aAuthService.registerAgent(agentInfo);
      const auth = await a2aAuthService.authenticateAgent(registration.agentId, registration.clientSecret);
      const channel = await a2aAuthService.establishSecureChannel('target-agent', 'high');

      expect(registration.success).toBe(true);
      expect(auth.success).toBe(true);
      expect(channel.success).toBe(true);

      // Send multiple messages concurrently
      const messagePromises = Array.from({ length: 20 }, (_, i) =>
        a2aAuthService.sendSecureMessage(
          'target-agent',
          'payment_request',
          { ...mockPaymentPayload, amount: 1000 + i },
          { encrypt: true }
        )
      );

      const results = await Promise.all(messagePromises);

      // All messages should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
        expect(result.encrypted).toBe(true);
      });

      // Verify metrics show high message count
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(20);
      expect(metrics.successfulRequests).toBeGreaterThan(20);
    });

    it('should handle health checks across multiple agents', async () => {
      // Setup multiple agents
      const agentInfos = Array.from({ length: 5 }, (_, i) =>
        createMockAgentRegistrationInfo({
          name: `Health Check Agent ${i}`,
          organization: `Health Check Org ${i}`
        })
      );

      const registrations = await Promise.all(
        agentInfos.map(agentInfo => a2aAuthService.registerAgent(agentInfo))
      );

      const authentications = await Promise.all(
        registrations.map(reg => a2aAuthService.authenticateAgent(reg.agentId, reg.clientSecret))
      );

      const channels = await Promise.all(
        registrations.map(reg => a2aAuthService.establishSecureChannel(reg.agentId, 'standard'))
      );

      // All setup should succeed
      registrations.forEach(reg => expect(reg.success).toBe(true));
      authentications.forEach(auth => expect(auth.success).toBe(true));
      channels.forEach(channel => expect(channel.success).toBe(true));

      // Perform health checks concurrently
      const healthCheckPromises = registrations.map(reg =>
        a2aAuthService.performHealthCheck(reg.agentId)
      );

      const healthResults = await Promise.all(healthCheckPromises);

      // All health checks should succeed
      healthResults.forEach(result => {
        expect(result.status).toBe('healthy');
        expect(result.responseTime).toBeGreaterThan(0);
        expect(result.lastCheck).toBeInstanceOf(Date);
      });
    });
  });

  describe('Audit and Monitoring Integration', () => {
    it('should maintain comprehensive audit logs', async () => {
      // Perform various operations
      const agentInfo = createMockAgentRegistrationInfo();
      const registration = await a2aAuthService.registerAgent(agentInfo);
      const auth = await a2aAuthService.authenticateAgent(registration.agentId, registration.clientSecret);
      const channel = await a2aAuthService.establishSecureChannel('target-agent', 'high');
      const message = await a2aAuthService.sendSecureMessage('target-agent', 'payment_request', mockPaymentPayload);
      const health = await a2aAuthService.performHealthCheck('target-agent');

      // Verify all operations succeeded
      expect(registration.success).toBe(true);
      expect(auth.success).toBe(true);
      expect(channel.success).toBe(true);
      expect(message.success).toBe(true);
      expect(health.status).toBe('healthy');

      // Check audit log
      const auditLog = (a2aAuthService as any).auditLog;
      expect(auditLog.length).toBeGreaterThan(0);

      // Verify different types of audit entries
      const auditTypes = auditLog.map(entry => entry.action);
      expect(auditTypes).toContain('agent_registered');
      expect(auditTypes).toContain('authentication_success');
      expect(auditTypes).toContain('channel_established');
      expect(auditTypes).toContain('message_sent');
      expect(auditTypes).toContain('health_check');

      // Check security metrics
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.totalRequests).toBeGreaterThan(0);
      expect(metrics.successfulRequests).toBeGreaterThan(0);
      expect(metrics.topAgents.length).toBeGreaterThan(0);
      expect(metrics.securityEvents.length).toBeGreaterThan(0);
    });

    it('should track security events and anomalies', async () => {
      // Perform normal operations
      const agentInfo = createMockAgentRegistrationInfo();
      await a2aAuthService.registerAgent(agentInfo);
      await a2aAuthService.authenticateAgent('test-client', 'test-secret');

      // Simulate security events
      const auditLog = (a2aAuthService as any).auditLog;
      auditLog.push(
        {
          id: 'security-1',
          timestamp: new Date(),
          agentId: 'test-agent',
          action: 'authentication_failed',
          resource: 'auth',
          success: false,
          ipAddress: '192.168.1.100',
          userAgent: 'suspicious-agent',
          details: { statusCode: 401, reason: 'invalid_credentials' }
        },
        {
          id: 'security-2',
          timestamp: new Date(),
          agentId: 'test-agent',
          action: 'rate_limit_exceeded',
          resource: 'communication',
          success: false,
          ipAddress: '192.168.1.100',
          userAgent: 'suspicious-agent',
          details: { limit: 100, actual: 150 }
        }
      );

      // Check security metrics
      const metrics = a2aAuthService.getSecurityMetrics();
      expect(metrics.failedRequests).toBeGreaterThan(0);
      expect(metrics.blockedRequests).toBeGreaterThan(0);
      
      const securityEvents = metrics.securityEvents;
      expect(securityEvents.some(event => event.type === 'authentication_failed')).toBe(true);
      expect(securityEvents.some(event => event.type === 'rate_limit_exceeded')).toBe(true);
    });
  });
});
