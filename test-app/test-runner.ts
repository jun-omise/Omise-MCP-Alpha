/**
 * Test Runner for MCP Test App
 * 
 * Provides automated testing capabilities for the MCP server
 * with various test scenarios and performance benchmarks.
 */

import { MCPTestApp, TestConfig, TestSuite } from './mcp-test-app';
import { Logger } from '../src/utils/logger';
import { faker } from '@faker-js/faker';

interface TestScenario {
  name: string;
  description: string;
  setup?: () => Promise<void>;
  test: () => Promise<boolean>;
  cleanup?: () => Promise<void>;
  timeout?: number;
}

interface PerformanceTest {
  name: string;
  description: string;
  iterations: number;
  concurrent: boolean;
  test: () => Promise<any>;
}

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  errors: string[];
}

class MCPTestRunner {
  private logger: Logger;
  private testApp: MCPTestApp;
  private config: TestConfig;
  private scenarios: TestScenario[] = [];
  private performanceTests: PerformanceTest[] = [];
  private results: TestSuite[] = [];

  constructor(config: TestConfig) {
    this.config = config;
    this.logger = new Logger('MCP-Test-Runner');
    this.testApp = new MCPTestApp(config);
    this.setupTestScenarios();
    this.setupPerformanceTests();
  }

  private setupTestScenarios(): void {
    this.scenarios = [
      {
        name: 'basic_registration',
        description: 'Test basic agent registration',
        test: async () => {
          const result = await this.testApp.runTestSuite({
            suiteName: 'Basic Registration Test',
            scenarios: ['registration']
          });
          return result.success;
        }
      },
      {
        name: 'authentication_flow',
        description: 'Test complete authentication flow',
        test: async () => {
          const result = await this.testApp.runTestSuite({
            suiteName: 'Authentication Flow Test',
            scenarios: ['registration', 'authentication']
          });
          return result.success;
        }
      },
      {
        name: 'secure_communication',
        description: 'Test secure A2A communication',
        test: async () => {
          const result = await this.testApp.runTestSuite({
            suiteName: 'Secure Communication Test',
            scenarios: ['registration', 'authentication', 'communication']
          });
          return result.success;
        }
      },
      {
        name: 'omise_integration',
        description: 'Test Omise payment and customer operations',
        test: async () => {
          const result = await this.testApp.runTestSuite({
            suiteName: 'Omise Integration Test',
            scenarios: ['payment', 'customer']
          });
          return result.success;
        }
      },
      {
        name: 'end_to_end',
        description: 'Test complete end-to-end flow',
        test: async () => {
          const result = await this.testApp.runTestSuite({
            suiteName: 'End-to-End Test',
            scenarios: ['registration', 'authentication', 'communication', 'payment', 'customer']
          });
          return result.success;
        }
      },
      {
        name: 'error_handling',
        description: 'Test error handling and edge cases',
        test: async () => {
          try {
            // Test with invalid parameters
            await this.testApp.testA2AAuthentication({
              clientId: 'invalid-client',
              clientSecret: 'invalid-secret',
              securityLevel: 'high'
            });
            return false; // Should have failed
          } catch (error) {
            return true; // Expected to fail
          }
        }
      },
      {
        name: 'security_validation',
        description: 'Test security validations',
        test: async () => {
          try {
            // Test with invalid security level
            const result = await this.testApp.testA2AAuthentication({
              clientId: 'test-client',
              clientSecret: 'test-secret',
              securityLevel: 'invalid-level' as any
            });
            return false; // Should have failed
          } catch (error) {
            return true; // Expected to fail
          }
        }
      }
    ];
  }

  private setupPerformanceTests(): void {
    this.performanceTests = [
      {
        name: 'registration_performance',
        description: 'Test agent registration performance',
        iterations: 100,
        concurrent: false,
        test: async () => {
          const startTime = Date.now();
          await this.testApp.testA2ARegistration({
            agentName: faker.company.name(),
            organization: faker.company.name(),
            email: faker.internet.email()
          });
          return Date.now() - startTime;
        }
      },
      {
        name: 'authentication_performance',
        description: 'Test authentication performance',
        iterations: 50,
        concurrent: false,
        test: async () => {
          // First register an agent
          const regResult = await this.testApp.testA2ARegistration({
            agentName: faker.company.name(),
            organization: faker.company.name(),
            email: faker.internet.email()
          });
          
          const startTime = Date.now();
          await this.testApp.testA2AAuthentication({
            clientId: regResult.agentId,
            clientSecret: regResult.clientSecret,
            securityLevel: 'standard'
          });
          return Date.now() - startTime;
        }
      },
      {
        name: 'message_sending_performance',
        description: 'Test message sending performance',
        iterations: 200,
        concurrent: true,
        test: async () => {
          const startTime = Date.now();
          await this.testApp.testA2ACommunication({
            targetAgentId: 'target-agent-001',
            messageType: 'payment_request',
            payload: { amount: 1000, currency: 'THB' },
            encrypt: true
          });
          return Date.now() - startTime;
        }
      },
      {
        name: 'payment_processing_performance',
        description: 'Test payment processing performance',
        iterations: 100,
        concurrent: false,
        test: async () => {
          const startTime = Date.now();
          await this.testApp.testOmisePayment({
            amount: faker.number.int({ min: 100, max: 10000 }),
            currency: 'THB',
            description: faker.commerce.productDescription()
          });
          return Date.now() - startTime;
        }
      },
      {
        name: 'concurrent_operations',
        description: 'Test concurrent operations performance',
        iterations: 50,
        concurrent: true,
        test: async () => {
          const startTime = Date.now();
          const promises = Array.from({ length: 10 }, () =>
            this.testApp.testOmiseCustomer({
              customerId: faker.string.alphanumeric(10),
              operation: 'get'
            })
          );
          await Promise.all(promises);
          return Date.now() - startTime;
        }
      }
    ];
  }

  public async runAllTests(): Promise<TestSuite> {
    this.logger.info('Starting comprehensive test suite');
    const startTime = Date.now();

    const results: any[] = [];
    let successCount = 0;

    for (const scenario of this.scenarios) {
      this.logger.info(`Running scenario: ${scenario.name}`);
      const scenarioStartTime = Date.now();
      
      try {
        if (scenario.setup) {
          await scenario.setup();
        }

        const success = await scenario.test();
        const duration = Date.now() - scenarioStartTime;
        
        results.push({
          scenario: scenario.name,
          success,
          duration,
          description: scenario.description
        });

        if (success) {
          successCount++;
        }

        if (scenario.cleanup) {
          await scenario.cleanup();
        }
      } catch (error) {
        const duration = Date.now() - scenarioStartTime;
        results.push({
          scenario: scenario.name,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          description: scenario.description
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    const successRate = (successCount / this.scenarios.length) * 100;

    const testSuite: TestSuite = {
      name: 'Comprehensive Test Suite',
      results,
      totalDuration,
      successRate
    };

    this.results.push(testSuite);
    this.logger.info(`Test suite completed. Success rate: ${successRate.toFixed(2)}%`);

    return testSuite;
  }

  public async runPerformanceTests(): Promise<BenchmarkResult[]> {
    this.logger.info('Starting performance tests');
    const benchmarkResults: BenchmarkResult[] = [];

    for (const perfTest of this.performanceTests) {
      this.logger.info(`Running performance test: ${perfTest.name}`);
      
      const times: number[] = [];
      const errors: string[] = [];
      let successCount = 0;

      const startTime = Date.now();

      if (perfTest.concurrent) {
        // Run concurrent tests
        const promises = Array.from({ length: perfTest.iterations }, async () => {
          try {
            const time = await perfTest.test();
            times.push(time);
            successCount++;
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
          }
        });

        await Promise.all(promises);
      } else {
        // Run sequential tests
        for (let i = 0; i < perfTest.iterations; i++) {
          try {
            const time = await perfTest.test();
            times.push(time);
            successCount++;
          } catch (error) {
            errors.push(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      }

      const totalTime = Date.now() - startTime;
      const averageTime = times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
      const minTime = times.length > 0 ? Math.min(...times) : 0;
      const maxTime = times.length > 0 ? Math.max(...times) : 0;
      const successRate = (successCount / perfTest.iterations) * 100;

      benchmarkResults.push({
        name: perfTest.name,
        iterations: perfTest.iterations,
        totalTime,
        averageTime,
        minTime,
        maxTime,
        successRate,
        errors
      });

      this.logger.info(`Performance test ${perfTest.name} completed:`, {
        iterations: perfTest.iterations,
        averageTime: `${averageTime.toFixed(2)}ms`,
        successRate: `${successRate.toFixed(2)}%`
      });
    }

    return benchmarkResults;
  }

  public async runLoadTest(duration: number, concurrentUsers: number): Promise<any> {
    this.logger.info(`Starting load test: ${duration}ms, ${concurrentUsers} concurrent users`);
    
    const startTime = Date.now();
    const results: any[] = [];
    let requestCount = 0;
    let errorCount = 0;

    const runUser = async (userId: number): Promise<void> => {
      while (Date.now() - startTime < duration) {
        try {
          const testType = Math.random();
          let result;

          if (testType < 0.3) {
            result = await this.testApp.testOmisePayment({
              amount: faker.number.int({ min: 100, max: 10000 }),
              currency: 'THB',
              description: faker.commerce.productDescription()
            });
          } else if (testType < 0.6) {
            result = await this.testApp.testOmiseCustomer({
              customerId: faker.string.alphanumeric(10),
              operation: 'get'
            });
          } else {
            result = await this.testApp.testA2ACommunication({
              targetAgentId: 'target-agent-001',
              messageType: 'payment_request',
              payload: { amount: 1000, currency: 'THB' },
              encrypt: true
            });
          }

          results.push({
            userId,
            timestamp: Date.now(),
            success: result.success,
            duration: result.duration || 0
          });

          requestCount++;
        } catch (error) {
          errorCount++;
          results.push({
            userId,
            timestamp: Date.now(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    };

    // Start concurrent users
    const userPromises = Array.from({ length: concurrentUsers }, (_, i) => runUser(i));
    await Promise.all(userPromises);

    const totalTime = Date.now() - startTime;
    const requestsPerSecond = (requestCount / totalTime) * 1000;
    const errorRate = (errorCount / requestCount) * 100;

    const loadTestResult = {
      duration: totalTime,
      concurrentUsers,
      totalRequests: requestCount,
      successfulRequests: requestCount - errorCount,
      failedRequests: errorCount,
      requestsPerSecond: requestsPerSecond.toFixed(2),
      errorRate: errorRate.toFixed(2) + '%',
      results
    };

    this.logger.info('Load test completed:', loadTestResult);
    return loadTestResult;
  }

  public async generateReport(): Promise<string> {
    const securityMetrics = this.testApp.getSecurityMetrics();
    const testResults = this.results;
    
    const report = `
# MCP Test Report

## Test Configuration
- Agent ID: ${this.config.agentId}
- Agent Name: ${this.config.agentName}
- Organization: ${this.config.organization}
- Security Level: ${this.config.securityLevel}
- Encryption Enabled: ${this.config.enableEncryption}
- mTLS Enabled: ${this.config.enableMTLS}
- OAuth Enabled: ${this.config.enableOAuth}

## Test Results Summary
${testResults.map(suite => `
### ${suite.name}
- Total Tests: ${suite.results.length}
- Successful: ${suite.results.filter(r => r.success).length}
- Failed: ${suite.results.filter(r => !r.success).length}
- Success Rate: ${suite.successRate.toFixed(2)}%
- Total Duration: ${suite.totalDuration}ms
`).join('')}

## Security Metrics
- Total Requests: ${securityMetrics.totalRequests}
- Successful Requests: ${securityMetrics.successfulRequests}
- Failed Requests: ${securityMetrics.failedRequests}
- Blocked Requests: ${securityMetrics.blockedRequests}
- Average Response Time: ${securityMetrics.averageResponseTime}ms

## Top Error Codes
${securityMetrics.topErrorCodes.map(error => `- ${error.code}: ${error.count} occurrences`).join('\n')}

## Top Agents by Request Count
${securityMetrics.topAgents.map(agent => `- ${agent.agentId}: ${agent.requestCount} requests`).join('\n')}

## Security Events
${securityMetrics.securityEvents.map(event => `- ${event.type}: ${event.count} occurrences`).join('\n')}

## Recommendations
${this.generateRecommendations(testResults, securityMetrics)}
`;

    return report;
  }

  private generateRecommendations(testResults: TestSuite[], securityMetrics: any): string {
    const recommendations: string[] = [];

    // Check success rate
    const overallSuccessRate = testResults.reduce((sum, suite) => sum + suite.successRate, 0) / testResults.length;
    if (overallSuccessRate < 95) {
      recommendations.push('- Consider investigating failed test cases to improve reliability');
    }

    // Check response time
    if (securityMetrics.averageResponseTime > 1000) {
      recommendations.push('- Response times are high, consider performance optimization');
    }

    // Check error rate
    const errorRate = (securityMetrics.failedRequests / securityMetrics.totalRequests) * 100;
    if (errorRate > 5) {
      recommendations.push('- Error rate is high, review error handling and validation');
    }

    // Check blocked requests
    if (securityMetrics.blockedRequests > 0) {
      recommendations.push('- Some requests were blocked, review rate limiting and security policies');
    }

    if (recommendations.length === 0) {
      recommendations.push('- All tests passed successfully! System is performing well.');
    }

    return recommendations.join('\n');
  }

  public async start(): Promise<void> {
    await this.testApp.start();
  }

  public async stop(): Promise<void> {
    await this.testApp.stop();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  const config: TestConfig = {
    serverUrl: 'https://api.omise.co',
    agentId: 'test-runner-agent',
    agentName: 'Test Runner Agent',
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

  const testRunner = new MCPTestRunner(config);

  try {
    await testRunner.start();

    switch (command) {
      case 'all':
        await testRunner.runAllTests();
        break;
      case 'performance':
        await testRunner.runPerformanceTests();
        break;
      case 'load':
        const duration = parseInt(args[1]) || 60000; // 1 minute default
        const concurrentUsers = parseInt(args[2]) || 10;
        await testRunner.runLoadTest(duration, concurrentUsers);
        break;
      case 'report':
        const report = await testRunner.generateReport();
        console.log(report);
        break;
      default:
        console.log('Available commands: all, performance, load, report');
        break;
    }

    const report = await testRunner.generateReport();
    console.log(report);

  } catch (error) {
    console.error('Test runner failed:', error);
  } finally {
    await testRunner.stop();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { MCPTestRunner, TestScenario, PerformanceTest, BenchmarkResult };
