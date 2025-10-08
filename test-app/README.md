# MCP Test Application

A comprehensive test application for the Omise MCP server with A2A authentication and communication capabilities.

## Features

- **A2A Authentication Testing**: Test agent registration, authentication, and secure communication
- **Omise Integration Testing**: Test payment processing and customer operations
- **Performance Testing**: Benchmark performance with various load scenarios
- **Security Testing**: Validate security policies and error handling
- **Load Testing**: Test system behavior under concurrent load
- **Comprehensive Reporting**: Generate detailed test reports with metrics

## Installation

```bash
cd test-app
npm install
```

## Usage

### Basic Test App

Start the MCP test server:

```bash
npm run dev
```

Or build and run:

```bash
npm run build
npm start
```

### Test Runner

Run comprehensive tests:

```bash
# Run all tests
npx ts-node test-runner.ts all

# Run performance tests
npx ts-node test-runner.ts performance

# Run load test (60 seconds, 10 concurrent users)
npx ts-node test-runner.ts load 60000 10

# Generate test report
npx ts-node test-runner.ts report
```

### Command Line Options

The test app supports various command line options:

```bash
npx ts-node mcp-test-app.ts \
  --server-url https://api.omise.co \
  --agent-id my-test-agent \
  --agent-name "My Test Agent" \
  --organization "My Organization" \
  --security-level high \
  --concurrent-agents 10 \
  --message-count 1000 \
  --enable-encryption true \
  --enable-mtls true \
  --enable-oauth true \
  --audit-logging true
```

## Available Tools

The MCP test app provides the following tools:

### A2A Authentication Tools

- `test_a2a_registration`: Test agent registration
- `test_a2a_authentication`: Test agent authentication
- `test_a2a_communication`: Test secure A2A communication

### Omise Integration Tools

- `test_omise_payment`: Test payment processing
- `test_omise_customer`: Test customer operations

### Test Management Tools

- `run_test_suite`: Run comprehensive test suite
- `get_test_results`: Get test results and metrics

## Test Scenarios

### Basic Scenarios

1. **Agent Registration**: Test agent registration with various configurations
2. **Authentication Flow**: Test complete OAuth 2.0 authentication flow
3. **Secure Communication**: Test encrypted A2A message exchange
4. **Payment Processing**: Test Omise payment operations
5. **Customer Operations**: Test customer management operations

### Advanced Scenarios

1. **End-to-End Flow**: Complete workflow from registration to payment
2. **Error Handling**: Test error scenarios and edge cases
3. **Security Validation**: Test security policies and validations
4. **Performance Testing**: Benchmark system performance
5. **Load Testing**: Test under concurrent load conditions

## Configuration

### Test Configuration

```typescript
interface TestConfig {
  serverUrl: string;           // Omise API server URL
  agentId: string;            // Unique agent identifier
  agentName: string;          // Human-readable agent name
  organization: string;       // Organization name
  securityLevel: SecurityLevel; // Security level (basic/standard/high)
  testScenarios: string[];    // Scenarios to test
  concurrentAgents: number;   // Number of concurrent agents
  messageCount: number;       // Number of messages to send
  enableEncryption: boolean;  // Enable message encryption
  enableMTLS: boolean;        // Enable mutual TLS
  enableOAuth: boolean;       // Enable OAuth 2.0
  auditLogging: boolean;      // Enable audit logging
}
```

### Security Levels

- **basic**: Basic security with OAuth only
- **standard**: Standard security with OAuth and message signing
- **high**: High security with OAuth, mTLS, and encryption

## Test Results

### Test Suite Results

```typescript
interface TestSuite {
  name: string;              // Test suite name
  results: TestResult[];     // Individual test results
  totalDuration: number;     // Total execution time
  successRate: number;       // Success rate percentage
}
```

### Performance Benchmarks

```typescript
interface BenchmarkResult {
  name: string;              // Benchmark name
  iterations: number;        // Number of iterations
  totalTime: number;         // Total execution time
  averageTime: number;       // Average time per iteration
  minTime: number;           // Minimum time
  maxTime: number;           // Maximum time
  successRate: number;       // Success rate
  errors: string[];          // Error messages
}
```

## Security Metrics

The test app tracks comprehensive security metrics:

- **Request Statistics**: Total, successful, failed, and blocked requests
- **Response Times**: Average, minimum, and maximum response times
- **Error Analysis**: Top error codes and their frequencies
- **Agent Activity**: Top agents by request count
- **Security Events**: Authentication and authorization events

## Example Usage

### Using MCP Client

```bash
# Connect to the test app
mcp connect stdio -- npx ts-node mcp-test-app.ts

# List available tools
mcp list-tools

# Test agent registration
mcp call-tool test_a2a_registration --agent-name "Test Agent" --organization "Test Org" --email "test@example.com"

# Run test suite
mcp call-tool run_test_suite --suite-name "My Test Suite" --scenarios '["registration", "authentication", "communication"]'

# Get test results
mcp call-tool get_test_results
```

### Programmatic Usage

```typescript
import { MCPTestApp } from './mcp-test-app';

const config = {
  serverUrl: 'https://api.omise.co',
  agentId: 'my-test-agent',
  agentName: 'My Test Agent',
  organization: 'My Organization',
  securityLevel: 'high' as const,
  testScenarios: ['registration', 'authentication'],
  concurrentAgents: 5,
  messageCount: 100,
  enableEncryption: true,
  enableMTLS: true,
  enableOAuth: true,
  auditLogging: true
};

const testApp = new MCPTestApp(config);
await testApp.start();

// Run tests programmatically
const result = await testApp.runTestSuite({
  suiteName: 'My Test Suite',
  scenarios: ['registration', 'authentication', 'communication']
});

console.log('Test results:', result);
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check server URL and network connectivity
2. **Authentication Failed**: Verify OAuth configuration and credentials
3. **Certificate Errors**: Ensure mTLS certificates are properly configured
4. **Rate Limiting**: Adjust rate limits in configuration
5. **Timeout Errors**: Increase timeout values for slow networks

### Debug Mode

Enable debug logging:

```bash
DEBUG=mcp-test-app* npx ts-node mcp-test-app.ts
```

### Log Files

Test results and logs are stored in:
- `logs/test-app.log`: Application logs
- `logs/security.log`: Security events
- `logs/audit.log`: Audit trail
- `test-results/`: Test result files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
