/**
 * Authentication Test Fixtures
 */

import { faker } from '@faker-js/faker';
import { 
  AgentIdentity, 
  OAuthConfig, 
  mTLSConfig, 
  CommunicationConfig,
  SecurityLevel,
  MessageType,
  A2AMessage,
  AgentRegistrationInfo
} from '../../src/types/auth';

export const mockOAuthConfig: OAuthConfig = {
  authorizationEndpoint: 'https://api.example.com/oauth/authorize',
  tokenEndpoint: 'https://api.example.com/oauth/token',
  accessTokenExpiry: 3600,
  refreshTokenExpiry: 86400,
  authorizationCodeExpiry: 600,
  jwtSecret: 'test-jwt-secret-key'
};

export const mockMTLSConfig: mTLSConfig = {
  certPath: './test-certs',
  certificateValidityDays: 365,
  keySize: 2048
};

export const mockCommunicationConfig: CommunicationConfig = {
  agentId: 'test-agent-001',
  agentName: 'Test Agent',
  organization: 'Test Organization',
  baseUrl: 'https://api.example.com',
  clientSecret: 'test-client-secret',
  signingKey: 'test-signing-key',
  encryptionKey: 'test-encryption-key',
  requestTimeout: 30000,
  maxRetries: 3,
  retryDelay: 1000
};

export const mockAgentIdentity: AgentIdentity = {
  clientId: 'test-client-001',
  name: 'Test Agent',
  scopes: ['read', 'write'],
  issuedAt: new Date(),
  expiresAt: new Date(Date.now() + 3600000)
};

export const mockAgentRegistrationInfo: AgentRegistrationInfo = {
  name: 'Test Integration Agent',
  organization: 'Test Organization',
  email: 'test@example.com',
  description: 'Test agent for integration testing',
  redirectUris: ['https://test.example.com/oauth/callback'],
  scopes: ['read', 'write'],
  grantTypes: ['authorization_code', 'refresh_token']
};

export const mockA2AMessage: A2AMessage = {
  id: 'msg_test_001',
  from: 'agent-001',
  to: 'agent-002',
  type: 'payment_request' as MessageType,
  payload: {
    amount: 1000,
    currency: 'THB',
    description: 'Test payment'
  },
  timestamp: new Date(),
  nonce: 'test-nonce-001',
  signature: 'test-signature-001',
  encryption: false
};

export const mockPaymentPayload = {
  amount: faker.number.int({ min: 100, max: 10000 }),
  currency: 'THB',
  description: faker.commerce.productDescription(),
  customer: {
    email: faker.internet.email(),
    name: faker.person.fullName()
  },
  metadata: {
    source: 'test',
    timestamp: new Date().toISOString()
  }
};

export const mockCustomerPayload = {
  customerId: faker.string.alphanumeric(10),
  query: 'get_customer_details',
  includeTransactions: true,
  includeCards: true
};

export const mockWebhookPayload = {
  eventId: faker.string.uuid(),
  eventType: 'payment.completed',
  data: {
    id: faker.string.alphanumeric(10),
    amount: faker.number.int({ min: 100, max: 10000 }),
    currency: 'THB'
  },
  timestamp: new Date().toISOString()
};

export const createMockAgentIdentity = (overrides: Partial<AgentIdentity> = {}): AgentIdentity => ({
  clientId: faker.string.alphanumeric(10),
  name: faker.company.name(),
  scopes: ['read', 'write'],
  issuedAt: new Date(),
  expiresAt: new Date(Date.now() + 3600000),
  ...overrides
});

export const createMockA2AMessage = (overrides: Partial<A2AMessage> = {}): A2AMessage => ({
  id: faker.string.alphanumeric(10),
  from: faker.string.alphanumeric(10),
  to: faker.string.alphanumeric(10),
  type: 'payment_request' as MessageType,
  payload: mockPaymentPayload,
  timestamp: new Date(),
  nonce: faker.string.alphanumeric(16),
  signature: faker.string.alphanumeric(32),
  encryption: false,
  ...overrides
});

export const createMockAgentRegistrationInfo = (overrides: Partial<AgentRegistrationInfo> = {}): AgentRegistrationInfo => ({
  name: faker.company.name(),
  organization: faker.company.name(),
  email: faker.internet.email(),
  description: faker.lorem.sentence(),
  redirectUris: [faker.internet.url()],
  scopes: ['read', 'write'],
  grantTypes: ['authorization_code', 'refresh_token'],
  ...overrides
});

export const mockSecurityLevels: SecurityLevel[] = ['basic', 'standard', 'high'];
export const mockMessageTypes: MessageType[] = [
  'payment_request',
  'payment_response',
  'customer_query',
  'webhook_notification',
  'health_check',
  'error_notification',
  'status_update'
];

export const mockErrorResponses = {
  invalidToken: {
    success: false,
    error: 'Invalid token',
    code: 'INVALID_TOKEN'
  },
  rateLimitExceeded: {
    success: false,
    error: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  authenticationFailed: {
    success: false,
    error: 'Authentication failed',
    code: 'AUTHENTICATION_FAILED'
  },
  certificateValidationFailed: {
    success: false,
    error: 'Certificate validation failed',
    code: 'CERTIFICATE_VALIDATION_FAILED'
  }
};
