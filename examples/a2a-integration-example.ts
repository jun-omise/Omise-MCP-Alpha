/**
 * A2A Integration Example - How to use the A2A Authentication Service
 */

import { A2AAuthService, SecurityLevel, MessageType } from '../src/auth';
import { Logger } from '../src/utils/logger';

// Example configuration
const a2aConfig = {
  agentId: 'omise-agent-001',
  agentName: 'Omise Payment Agent',
  organization: 'Omise Co., Ltd.',
  baseUrl: 'https://api.omise-mcp.com',
  oauth: {
    enabled: true,
    clientSecret: process.env.OAUTH_CLIENT_SECRET || 'your-oauth-client-secret',
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 86400, // 24 hours
    authorizationCodeExpiry: 600, // 10 minutes
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret'
  },
  mtls: {
    enabled: true,
    certPath: './certs',
    certificateValidityDays: 365,
    keySize: 2048
  },
  security: {
    level: 'high' as SecurityLevel,
    requireMFA: false,
    maxSessionDuration: 3600000, // 1 hour
    allowedIPs: ['127.0.0.1', '::1'],
    allowedUserAgents: ['Omise-MCP-Agent/1.0.0'],
    rateLimitPerMinute: 100,
    encryptionRequired: true,
    signingKey: process.env.SIGNING_KEY || 'your-signing-key',
    encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key',
    auditLogging: true
  },
  communication: {
    requestTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000
  }
};

// Initialize logger
const logger = new Logger({
  level: 'info',
  format: 'json',
  enableRequestLogging: true,
  enableResponseLogging: true
});

// Initialize A2A Authentication Service
const a2aService = new A2AAuthService(a2aConfig, logger);

/**
 * Example 1: Register a new agent
 */
async function registerNewAgent() {
  try {
    console.log('🔐 Registering new agent...');
    
    const agentInfo = {
      name: 'Stripe Integration Agent',
      organization: 'Stripe Inc.',
      email: 'agent@stripe.com',
      description: 'Agent for Stripe payment processing integration',
      redirectUris: ['https://stripe-agent.example.com/oauth/callback'],
      scopes: ['read', 'write'],
      grantTypes: ['authorization_code', 'refresh_token']
    };

    const result = await a2aService.registerAgent(agentInfo);
    
    console.log('✅ Agent registered successfully:', {
      agentId: result.agentId,
      hasCertificate: !!result.certificate,
      oauthConfig: result.oauthConfig
    });

    return result;

  } catch (error) {
    console.error('❌ Failed to register agent:', error);
    throw error;
  }
}

/**
 * Example 2: Send secure payment request
 */
async function sendPaymentRequest(targetAgentId: string) {
  try {
    console.log('💳 Sending payment request...');
    
    const paymentPayload = {
      amount: 1000,
      currency: 'THB',
      description: 'Payment via A2A communication',
      customer: {
        email: 'customer@example.com',
        name: 'John Doe'
      },
      metadata: {
        source: 'a2a-integration',
        timestamp: new Date().toISOString()
      }
    };

    const result = await a2aService.sendSecureMessage(
      targetAgentId,
      'payment_request',
      paymentPayload,
      {
        encrypt: true,
        priority: 'high',
        timeout: 30000
      }
    );

    console.log('✅ Payment request sent:', {
      messageId: result.messageId,
      targetAgentId: result.targetAgentId,
      encrypted: result.encrypted,
      timestamp: result.timestamp
    });

    return result;

  } catch (error) {
    console.error('❌ Failed to send payment request:', error);
    throw error;
  }
}

/**
 * Complete A2A Integration Example
 */
async function runCompleteExample() {
  try {
    console.log('🚀 Starting A2A Integration Example...\n');

    // Step 1: Register a new agent
    const registrationResult = await registerNewAgent();
    const agentId = registrationResult.agentId;

    // Step 2: Send various types of messages
    await sendPaymentRequest(agentId);

    console.log('\n🎉 A2A Integration Example completed successfully!');

  } catch (error) {
    console.error('\n💥 A2A Integration Example failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other modules
export {
  registerNewAgent,
  sendPaymentRequest,
  runCompleteExample
};

// Run example if this file is executed directly
if (require.main === module) {
  runCompleteExample()
    .then(() => {
      console.log('\n✨ All examples completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Example execution failed:', error);
      process.exit(1);
    });
}
