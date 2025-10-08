/**
 * MCP Test Application
 * 
 * A comprehensive test application for testing the Omise MCP server
 * with A2A authentication and communication capabilities.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetServerInfoRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { A2AAuthService } from '../src/auth/a2a-auth-service';
import { Logger } from '../src/utils/logger';
import { 
  AgentRegistrationInfo,
  SecurityLevel,
  MessageType 
} from '../src/types/auth';
import { faker } from '@faker-js/faker';

interface TestConfig {
  serverUrl: string;
  agentId: string;
  agentName: string;
  organization: string;
  securityLevel: SecurityLevel;
  testScenarios: string[];
  concurrentAgents: number;
  messageCount: number;
  enableEncryption: boolean;
  enableMTLS: boolean;
  enableOAuth: boolean;
  auditLogging: boolean;
}

interface TestResult {
  scenario: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalDuration: number;
  successRate: number;
}

class MCPTestApp {
  private server: Server;
  private a2aAuthService: A2AAuthService;
  private logger: Logger;
  private config: TestConfig;
  private testResults: TestSuite[] = [];

  constructor(config: TestConfig) {
    this.config = config;
    this.logger = new Logger('MCP-Test-App');
    this.server = new Server(
      {
        name: 'omise-mcp-test-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize A2A Auth Service
    this.a2aAuthService = new A2AAuthService({
      agentId: config.agentId,
      agentName: config.agentName,
      organization: config.organization,
      baseUrl: config.serverUrl,
      oauth: {
        enabled: config.enableOAuth,
        clientSecret: 'test-client-secret',
        accessTokenExpiry: 3600,
        refreshTokenExpiry: 86400,
        authorizationCodeExpiry: 600,
        jwtSecret: 'test-jwt-secret'
      },
      mtls: {
        enabled: config.enableMTLS,
        certPath: './test-certs',
        certificateValidityDays: 365,
        keySize: 2048
      },
      security: {
        level: config.securityLevel,
        requireMFA: false,
        maxSessionDuration: 3600000,
        allowedIPs: ['127.0.0.1'],
        allowedUserAgents: ['MCP-Test-App/1.0.0'],
        rateLimitPerMinute: 1000,
        encryptionRequired: config.enableEncryption,
        signingKey: 'test-signing-key',
        encryptionKey: 'test-encryption-key',
        auditLogging: config.auditLogging
      },
      communication: {
        requestTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000
      }
    }, this.logger);

    this.setupServer();
  }

  private setupServer(): void {
    // Setup server info handler
    this.server.setRequestHandler(GetServerInfoRequestSchema, async () => ({
      name: 'omise-mcp-test-server',
      version: '1.0.0',
      description: 'Omise MCP Test Server with A2A Authentication',
      capabilities: {
        tools: {}
      }
    }));

    // Setup tools list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'test_a2a_registration',
          description: 'Test A2A agent registration',
          inputSchema: {
            type: 'object',
            properties: {
              agentName: { type: 'string', description: 'Agent name' },
              organization: { type: 'string', description: 'Organization name' },
              email: { type: 'string', description: 'Agent email' }
            },
            required: ['agentName', 'organization', 'email']
          }
        },
        {
          name: 'test_a2a_authentication',
          description: 'Test A2A agent authentication',
          inputSchema: {
            type: 'object',
            properties: {
              clientId: { type: 'string', description: 'Client ID' },
              clientSecret: { type: 'string', description: 'Client secret' },
              securityLevel: { type: 'string', enum: ['basic', 'standard', 'high'], description: 'Security level' }
            },
            required: ['clientId', 'clientSecret', 'securityLevel']
          }
        },
        {
          name: 'test_a2a_communication',
          description: 'Test A2A secure communication',
          inputSchema: {
            type: 'object',
            properties: {
              targetAgentId: { type: 'string', description: 'Target agent ID' },
              messageType: { type: 'string', enum: ['payment_request', 'customer_query', 'webhook_notification', 'health_check'], description: 'Message type' },
              payload: { type: 'object', description: 'Message payload' },
              encrypt: { type: 'boolean', description: 'Enable encryption' }
            },
            required: ['targetAgentId', 'messageType', 'payload']
          }
        },
        {
          name: 'test_omise_payment',
          description: 'Test Omise payment processing',
          inputSchema: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: 'Payment amount' },
              currency: { type: 'string', description: 'Currency code' },
              description: { type: 'string', description: 'Payment description' }
            },
            required: ['amount', 'currency', 'description']
          }
        },
        {
          name: 'test_omise_customer',
          description: 'Test Omise customer operations',
          inputSchema: {
            type: 'object',
            properties: {
              customerId: { type: 'string', description: 'Customer ID' },
              operation: { type: 'string', enum: ['get', 'create', 'update', 'list'], description: 'Operation type' }
            },
            required: ['customerId', 'operation']
          }
        },
        {
          name: 'run_test_suite',
          description: 'Run comprehensive test suite',
          inputSchema: {
            type: 'object',
            properties: {
              suiteName: { type: 'string', description: 'Test suite name' },
              scenarios: { type: 'array', items: { type: 'string' }, description: 'Test scenarios to run' }
            },
            required: ['suiteName', 'scenarios']
          }
        },
        {
          name: 'get_test_results',
          description: 'Get test results and metrics',
          inputSchema: {
            type: 'object',
            properties: {
              suiteName: { type: 'string', description: 'Test suite name (optional)' }
            }
          }
        }
      ]
    }));

    // Setup tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'test_a2a_registration':
            return await this.testA2ARegistration(args);
          case 'test_a2a_authentication':
            return await this.testA2AAuthentication(args);
          case 'test_a2a_communication':
            return await this.testA2ACommunication(args);
          case 'test_omise_payment':
            return await this.testOmisePayment(args);
          case 'test_omise_customer':
            return await this.testOmiseCustomer(args);
          case 'run_test_suite':
            return await this.runTestSuite(args);
          case 'get_test_results':
            return await this.getTestResults(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        this.logger.error(`Tool execution failed: ${name}`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
          ]
        };
      }
    });
  }

  private async testA2ARegistration(args: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const agentInfo: AgentRegistrationInfo = {
        name: args.agentName || faker.company.name(),
        organization: args.organization || faker.company.name(),
        email: args.email || faker.internet.email(),
        description: faker.lorem.sentence(),
        redirectUris: ['https://test.example.com/oauth/callback'],
        scopes: ['read', 'write'],
        grantTypes: ['authorization_code', 'refresh_token']
      };

      const result = await this.a2aAuthService.registerAgent(agentInfo);
      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              scenario: 'A2A Registration',
              duration,
              result: {
                agentId: result.agentId,
                clientSecret: result.clientSecret ? '***masked***' : null,
                hasCertificate: !!result.certificate,
                oauthConfig: result.oauthConfig
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              scenario: 'A2A Registration',
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }

  private async testA2AAuthentication(args: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      const result = await this.a2aAuthService.authenticateAgent(
        args.clientId,
        args.clientSecret,
        args.securityLevel
      );
      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              scenario: 'A2A Authentication',
              duration,
              result: {
                success: result.success,
                agentIdentity: result.agentIdentity,
                sessionId: result.sessionId
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              scenario: 'A2A Authentication',
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }

  private async testA2ACommunication(args: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // First establish secure channel
      const channelResult = await this.a2aAuthService.establishSecureChannel(
        args.targetAgentId,
        this.config.securityLevel
      );

      if (!channelResult.success) {
        throw new Error('Failed to establish secure channel');
      }

      // Send secure message
      const messageResult = await this.a2aAuthService.sendSecureMessage(
        args.targetAgentId,
        args.messageType,
        args.payload,
        { encrypt: args.encrypt || false }
      );

      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              scenario: 'A2A Communication',
              duration,
              result: {
                channel: channelResult,
                message: messageResult
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              scenario: 'A2A Communication',
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }

  private async testOmisePayment(args: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Simulate Omise payment processing
      const paymentData = {
        amount: args.amount,
        currency: args.currency,
        description: args.description,
        customer: {
          email: faker.internet.email(),
          name: faker.person.fullName()
        },
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              scenario: 'Omise Payment',
              duration,
              result: {
                paymentId: faker.string.alphanumeric(10),
                status: 'successful',
                amount: paymentData.amount,
                currency: paymentData.currency,
                description: paymentData.description,
                processedAt: new Date().toISOString()
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              scenario: 'Omise Payment',
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }

  private async testOmiseCustomer(args: any): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Simulate Omise customer operations
      const customerData = {
        id: args.customerId,
        email: faker.internet.email(),
        name: faker.person.fullName(),
        created: new Date().toISOString(),
        metadata: {
          test: true,
          operation: args.operation
        }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 50));

      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              scenario: 'Omise Customer',
              duration,
              result: {
                operation: args.operation,
                customer: customerData
              }
            }, null, 2)
          }
        ]
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              scenario: 'Omise Customer',
              duration,
              error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2)
          }
        ]
      };
    }
  }

  private async runTestSuite(args: any): Promise<any> {
    const suiteName = args.suiteName || 'Default Test Suite';
    const scenarios = args.scenarios || ['registration', 'authentication', 'communication', 'payment', 'customer'];
    
    const suite: TestSuite = {
      name: suiteName,
      results: [],
      totalDuration: 0,
      successRate: 0
    };

    const startTime = Date.now();

    this.logger.info(`Starting test suite: ${suiteName}`, { scenarios });

    for (const scenario of scenarios) {
      const result = await this.runTestScenario(scenario);
      suite.results.push(result);
    }

    suite.totalDuration = Date.now() - startTime;
    suite.successRate = (suite.results.filter(r => r.success).length / suite.results.length) * 100;

    this.testResults.push(suite);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            scenario: 'Test Suite Execution',
            duration: suite.totalDuration,
            result: {
              suiteName: suite.name,
              totalTests: suite.results.length,
              successfulTests: suite.results.filter(r => r.success).length,
              failedTests: suite.results.filter(r => !r.success).length,
              successRate: `${suite.successRate.toFixed(2)}%`,
              results: suite.results
            }
          }, null, 2)
        }
      ]
    };
  }

  private async runTestScenario(scenario: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      switch (scenario) {
        case 'registration':
          await this.testA2ARegistration({});
          break;
        case 'authentication':
          // First register an agent
          const regResult = await this.a2aAuthService.registerAgent({
            name: faker.company.name(),
            organization: faker.company.name(),
            email: faker.internet.email(),
            description: 'Test agent for authentication',
            redirectUris: ['https://test.example.com/callback'],
            scopes: ['read', 'write'],
            grantTypes: ['authorization_code', 'refresh_token']
          });
          await this.testA2AAuthentication({
            clientId: regResult.agentId,
            clientSecret: regResult.clientSecret,
            securityLevel: this.config.securityLevel
          });
          break;
        case 'communication':
          // Setup for communication test
          const regResult2 = await this.a2aAuthService.registerAgent({
            name: faker.company.name(),
            organization: faker.company.name(),
            email: faker.internet.email(),
            description: 'Test agent for communication',
            redirectUris: ['https://test.example.com/callback'],
            scopes: ['read', 'write'],
            grantTypes: ['authorization_code', 'refresh_token']
          });
          await this.a2aAuthService.authenticateAgent(regResult2.agentId, regResult2.clientSecret);
          await this.testA2ACommunication({
            targetAgentId: 'target-agent-001',
            messageType: 'payment_request',
            payload: { amount: 1000, currency: 'THB' },
            encrypt: true
          });
          break;
        case 'payment':
          await this.testOmisePayment({
            amount: 1000,
            currency: 'THB',
            description: 'Test payment'
          });
          break;
        case 'customer':
          await this.testOmiseCustomer({
            customerId: faker.string.alphanumeric(10),
            operation: 'get'
          });
          break;
        default:
          throw new Error(`Unknown test scenario: ${scenario}`);
      }

      return {
        scenario,
        success: true,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        scenario,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async getTestResults(args: any): Promise<any> {
    const suiteName = args.suiteName;
    const results = suiteName 
      ? this.testResults.filter(suite => suite.name === suiteName)
      : this.testResults;

    const metrics = this.a2aAuthService.getSecurityMetrics();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            scenario: 'Get Test Results',
            duration: 0,
            result: {
              testSuites: results,
              securityMetrics: metrics,
              summary: {
                totalSuites: this.testResults.length,
                totalTests: this.testResults.reduce((sum, suite) => sum + suite.results.length, 0),
                overallSuccessRate: this.testResults.length > 0 
                  ? (this.testResults.reduce((sum, suite) => sum + suite.successRate, 0) / this.testResults.length).toFixed(2) + '%'
                  : '0%'
              }
            }
          }, null, 2)
        }
      ]
    };
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.info('MCP Test App started successfully');
  }

  public async stop(): Promise<void> {
    await this.server.close();
    this.logger.info('MCP Test App stopped');
  }

  public getTestResults(): TestSuite[] {
    return this.testResults;
  }

  public getSecurityMetrics(): any {
    return this.a2aAuthService.getSecurityMetrics();
  }
}

// Default test configuration
const defaultConfig: TestConfig = {
  serverUrl: 'https://api.omise.co',
  agentId: 'mcp-test-agent',
  agentName: 'MCP Test Agent',
  organization: 'Test Organization',
  securityLevel: 'high',
  testScenarios: ['registration', 'authentication', 'communication', 'payment', 'customer'],
  concurrentAgents: 5,
  messageCount: 100,
  enableEncryption: true,
  enableMTLS: true,
  enableOAuth: true,
  auditLogging: true
};

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const config = { ...defaultConfig };

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'server-url':
          config.serverUrl = value;
          break;
        case 'agent-id':
          config.agentId = value;
          break;
        case 'agent-name':
          config.agentName = value;
          break;
        case 'organization':
          config.organization = value;
          break;
        case 'security-level':
          config.securityLevel = value as SecurityLevel;
          break;
        case 'concurrent-agents':
          config.concurrentAgents = parseInt(value);
          break;
        case 'message-count':
          config.messageCount = parseInt(value);
          break;
        case 'enable-encryption':
          config.enableEncryption = value === 'true';
          break;
        case 'enable-mtls':
          config.enableMTLS = value === 'true';
          break;
        case 'enable-oauth':
          config.enableOAuth = value === 'true';
          break;
        case 'audit-logging':
          config.auditLogging = value === 'true';
          break;
      }
    }
  }

  const testApp = new MCPTestApp(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down MCP Test App...');
    await testApp.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down MCP Test App...');
    await testApp.stop();
    process.exit(0);
  });

  try {
    await testApp.start();
    console.log('MCP Test App is running. Use MCP client to interact with it.');
    console.log('Available tools: test_a2a_registration, test_a2a_authentication, test_a2a_communication, test_omise_payment, test_omise_customer, run_test_suite, get_test_results');
  } catch (error) {
    console.error('Failed to start MCP Test App:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MCPTestApp, TestConfig, TestResult, TestSuite };
