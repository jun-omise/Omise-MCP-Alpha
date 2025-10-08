/**
 * Test Setup Configuration
 * 
 * Global test setup and configuration for the Omise MCP server tests.
 */

import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.OMISE_PUBLIC_KEY = 'test-public-key';
process.env.OMISE_SECRET_KEY = 'test-secret-key';
process.env.OMISE_API_URL = 'https://api.omise.co';
process.env.LOG_LEVEL = 'error';
process.env.AUDIT_LOGGING = 'true';
process.env.RATE_LIMIT_PER_MINUTE = '1000';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters-long';
process.env.SIGNING_KEY = 'test-signing-key-32-characters-long';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.CERT_PATH = './test-certs';
process.env.CERTIFICATE_VALIDITY_DAYS = '365';
process.env.KEY_SIZE = '2048';

// Global test utilities
global.testUtils = {
  // Generate test data
  generateTestAgent: () => ({
    name: 'Test Agent',
    organization: 'Test Organization',
    email: 'test@example.com',
    description: 'Test agent for unit testing',
    redirectUris: ['https://test.example.com/oauth/callback'],
    scopes: ['read', 'write'],
    grantTypes: ['authorization_code', 'refresh_token']
  }),

  // Generate test payment data
  generateTestPayment: () => ({
    amount: 1000,
    currency: 'THB',
    description: 'Test payment',
    customer: {
      email: 'test@example.com',
      name: 'Test Customer'
    },
    metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  }),

  // Generate test customer data
  generateTestCustomer: () => ({
    customerId: 'test-customer-001',
    email: 'test@example.com',
    name: 'Test Customer',
    description: 'Test customer for unit testing',
    metadata: {
      test: true,
      created: new Date().toISOString()
    }
  }),

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate random string
  randomString: (length: number = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  // Generate test certificate
  generateTestCertificate: () => ({
    agentId: 'test-agent-001',
    privateKey: Buffer.from('test-private-key'),
    certificate: 'test-certificate-content',
    caCertificate: Buffer.from('test-ca-certificate'),
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    serialNumber: '001'
  }),

  // Generate test token
  generateTestToken: () => ({
    access_token: 'test-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'test-refresh-token',
    scope: 'read write'
  }),

  // Mock logger
  createMockLogger: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    log: jest.fn()
  }),

  // Mock axios response
  createMockAxiosResponse: (data: any, status: number = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  }),

  // Mock axios error
  createMockAxiosError: (message: string, status: number = 500) => ({
    message,
    response: {
      data: { error: message },
      status,
      statusText: 'Internal Server Error',
      headers: {},
      config: {}
    },
    config: {}
  }),

  // Clean up test files
  cleanupTestFiles: () => {
    // Implementation would clean up any test files created during tests
    // This is a placeholder for actual file cleanup logic
  }
};

// Global test hooks
beforeAll(() => {
  // Global setup before all tests
  console.log('Setting up test environment...');
});

afterAll(() => {
  // Global cleanup after all tests
  console.log('Cleaning up test environment...');
  if (global.testUtils) {
    global.testUtils.cleanupTestFiles();
  }
});

beforeEach(() => {
  // Setup before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.clearAllTimers();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock console methods in test environment to reduce noise
if (process.env.NODE_ENV === 'test') {
  const originalConsole = { ...console };
  
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  // Restore console for test failures
  afterEach(() => {
    if (expect.getState().currentTestName && expect.getState().currentTestName.includes('should')) {
      global.console = originalConsole;
    }
  });
}

// Export test utilities for use in individual test files
export const testUtils = global.testUtils;