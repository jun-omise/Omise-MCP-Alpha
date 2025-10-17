# Omise MCP Server

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/your-org/omise-mcp-server)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-supported-blue.svg)](https://www.docker.com/)

**Omise MCP Server** is a comprehensive server for integrating with Omise payment APIs using [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Implemented in TypeScript with full support for Omise API v2017-11-02.

## 🚀 Key Features

### 💳 Payment Processing
- **Charge Management**: Create, retrieve, update, capture, and reverse payments
- **Tokenization**: Secure card information tokenization
- **Source Management**: Support for various payment methods
- **Refunds**: Partial and full refund processing

### 👥 Customer Management
- **Customer Information**: Create, retrieve, update, and delete customers
- **Card Management**: Manage customer card information
- **Metadata**: Store custom information

### 🔄 Transfers & Recipients
- **Transfer Processing**: Send money to recipients
- **Recipient Management**: Create, verify, and manage recipients
- **Bank Accounts**: Manage bank account information

### 📅 Schedules & Recurring Payments
- **Recurring Payments**: Automatic payments based on schedules
- **Occurrence Management**: Manage schedule execution
- **Flexible Configuration**: Daily, weekly, and monthly schedules

### 🔍 Monitoring & Analytics
- **Event Management**: Track system events
- **Dispute Management**: Handle chargebacks
- **Webhooks**: Real-time notifications

### 🔗 Links & Chains
- **Payment Links**: Shareable payment links
- **Chain Management**: Multi-tenant support
- **Capability Check**: API functionality verification

## 📋 Supported APIs

| Category | Features | Tool Count | Documentation |
|---------|----------|------------|---------------|
| **Payment** | Charges, Tokens, Sources | 8 | [Omise Charges API](https://www.omise.co/charges-api) |
| **Customer** | Customer & Card Management | 7 | [Omise Customers API](https://www.omise.co/customers-api) |
| **Transfer** | Transfer & Recipient Management | 6 | [Omise Transfers API](https://www.omise.co/transfers-api) |
| **Refund** | Refund Processing | 3 | [Omise Refunds API](https://www.omise.co/refunds-api) |
| **Dispute** | Chargeback Processing | 7 | [Omise Disputes API](https://www.omise.co/disputes-api) |
| **Schedule** | Recurring Payments | 5 | [Omise Schedules API](https://www.omise.co/schedules-api) |
| **Event** | Event Management | 2 | [Omise Events API](https://www.omise.co/events-api) |
| **Webhook** | Notification Management | 5 | [Omise Webhooks API](https://www.omise.co/webhooks-api) |
| **Link** | Payment Links | 3 | [Omise Links API](https://www.omise.co/links-api) |
| **Chain** | Multi-tenant | 4 | [Omise Chains API](https://www.omise.co/chains-api) |
| **Capability** | Feature Verification | 1 | [Omise Capabilities API](https://www.omise.co/capabilities-api) |

**Total: 51 tools** covering all Omise API functionality

## 🛠️ Technology Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.2+
- **Framework**: Model Context Protocol (MCP)
- **HTTP Client**: Axios
- **Logging**: Winston
- **Testing**: Jest + MSW
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Prometheus + Grafana
- **Caching**: Redis
- **Log Aggregation**: Loki

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ 
- npm or yarn
- [Omise Account](https://dashboard.omise.co/) and API keys

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/omise-mcp-server.git
cd omise-mcp-server

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment configuration file
cp config/development.env .env

# Set environment variables
export OMISE_PUBLIC_KEY=pkey_test_xxxxxxxxxxxxxxxx
export OMISE_SECRET_KEY=skey_test_xxxxxxxxxxxxxxxx
export OMISE_ENVIRONMENT=test
export OMISE_API_VERSION=2019-05-29
export OMISE_BASE_URL=https://api.omise.co
export OMISE_VAULT_URL=https://vault.omise.co
```

#### 2.4. Environment-Specific Configuration

**For Development:**
```bash
cp config/development.env .env
# Use test API keys, enable verbose logging
```

**For Staging:**
```bash
cp config/staging.env .env
# Use test API keys, production-like settings
```

**For Production:**
```bash
cp config/production.env .env
# Use live API keys, optimized for performance
# OMISE_ENVIRONMENT=production
# OMISE_PUBLIC_KEY=pkey_live_xxxxxxxxxxxxxxxx
# OMISE_SECRET_KEY=skey_live_xxxxxxxxxxxxxxxx
```

#### 2.5. Verify Configuration

```bash
# Test your API key configuration
npm run dev

# Or verify with a simple check
echo $OMISE_PUBLIC_KEY | grep -q "pkey_" && echo "✅ Public key configured" || echo "❌ Public key missing"
echo $OMISE_SECRET_KEY | grep -q "skey_" && echo "✅ Secret key configured" || echo "❌ Secret key missing"
```

### 3. Start Development Server

```bash
# Start in development mode
npm run dev

# Or start in production mode
npm run build
npm start
```

### 4. Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Check available tools
curl http://localhost:3000/tools
```

## 📖 Usage

### Basic Payment Processing

```typescript
// Create a charge
const charge = await mcpClient.callTool('create_charge', {
  amount: 10000,        // 100.00 THB (smallest currency unit)
  currency: 'THB',
  description: 'Test payment',
  capture: true
});

// Create a customer
const customer = await mcpClient.callTool('create_customer', {
  email: 'customer@example.com',
  description: 'Test customer'
});

// Create a card token
const token = await mcpClient.callTool('create_token', {
  card: {
    name: 'John Doe',
    number: '4242424242424242',
    expiration_month: 12,
    expiration_year: 2025,
    security_code: '123'
  }
});
```

### Recurring Payment Setup

```typescript
// Create a schedule
const schedule = await mcpClient.callTool('create_schedule', {
  every: 1,
  period: 'month',
  start_date: '2024-01-01',
  charge: {
    customer: 'cust_123',
    amount: 5000,
    currency: 'THB',
    description: 'Monthly subscription'
  }
});
```

### Transfer Processing

```typescript
// Create a recipient
const recipient = await mcpClient.callTool('create_recipient', {
  name: 'John Doe',
  email: 'john@example.com',
  type: 'individual',
  bank_account: {
    brand: 'bbl',
    number: '1234567890',
    name: 'John Doe'
  }
});

// Execute transfer
const transfer = await mcpClient.callTool('create_transfer', {
  amount: 10000,
  recipient: recipient.id
});
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OMISE_PUBLIC_KEY` | Omise public key | ✓ | - |
| `OMISE_SECRET_KEY` | Omise secret key | ✓ | - |
| `OMISE_ENVIRONMENT` | Environment (test/production) | ✓ | - |
| `PORT` | Server port | - | 3000 |
| `HOST` | Server host | - | localhost |
| `LOG_LEVEL` | Log level | - | info |
| `LOG_FORMAT` | Log format | - | simple |
| `RATE_LIMIT_ENABLED` | Enable rate limiting | - | true |
| `RATE_LIMIT_MAX_REQUESTS` | Maximum requests | - | 100 |
| `RATE_LIMIT_WINDOW_MS` | Time window (ms) | - | 60000 |

### Obtaining Omise API Keys

1. Access [Omise Dashboard](https://dashboard.omise.co/)
2. Create an account or log in
3. Get keys from the **API Keys** section
4. **Test Environment**: Use keys starting with `pkey_test_` and `skey_test_`
5. **Production Environment**: Use keys starting with `pkey_live_` and `skey_live_`

> **Important**: Always use live keys in production and test keys in test environment.

## 🏗️ Project Structure

```
omise-mcp-server/
├── src/                          # Source code
│   ├── index.ts                  # Main server file
│   ├── types/                    # Type definitions
│   │   ├── omise.ts             # Omise API type definitions
│   │   ├── mcp.ts               # MCP type definitions
│   │   └── index.ts             # Type definition exports
│   ├── tools/                    # Tool implementations
│   │   ├── payment-tools.ts     # Payment-related tools
│   │   ├── customer-tools.ts    # Customer-related tools
│   │   ├── token-tools.ts       # Token-related tools
│   │   ├── source-tools.ts      # Source-related tools
│   │   ├── transfer-tools.ts    # Transfer-related tools
│   │   ├── recipient-tools.ts  # Recipient-related tools
│   │   ├── refund-tools.ts      # Refund-related tools
│   │   ├── dispute-tools.ts     # Dispute-related tools
│   │   ├── schedule-tools.ts    # Schedule-related tools
│   │   ├── event-tools.ts       # Event-related tools
│   │   ├── webhook-tools.ts     # Webhook-related tools
│   │   ├── link-tools.ts        # Link-related tools
│   │   ├── chain-tools.ts       # Chain-related tools
│   │   ├── capability-tools.ts  # Capability verification tools
│   │   └── index.ts             # Tool exports
│   └── utils/                    # Utilities
│       ├── config.ts            # Configuration management
│       ├── logger.ts            # Logging functionality
│       ├── omise-client.ts      # Omise API client
│       ├── health-check.ts      # Health check
│       └── index.ts             # Utility exports
├── tests/                        # Tests
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── auth/                     # Authentication tests
│   ├── error/                    # Error handling tests
│   ├── rate-limit/               # Rate limiting tests
│   ├── mocks/                    # Mocks
│   └── factories/                # Test factories
├── config/                       # Configuration files
│   ├── development.env          # Development environment
│   ├── staging.env              # Staging environment
│   └── production.env            # Production environment
├── monitoring/                   # Monitoring configuration
│   ├── prometheus.yml            # Prometheus configuration
│   ├── loki-config.yml          # Loki configuration
│   └── grafana/                  # Grafana configuration
├── nginx/                        # Nginx configuration
├── docker-compose.yml            # Docker Compose configuration
├── Dockerfile                    # Docker configuration
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## 🧪 Development

### Development Environment Setup

```bash
# Install development dependencies
npm install

# Start development server
npm run dev

# Watch mode
npm run watch
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Specific test categories
npm run test:unit
npm run test:integration
npm run test:auth
npm run test:error
npm run test:rate-limit
```

### Linting

```bash
# Run linting
npm run lint

# Auto-fix
npm run lint:fix
```

### Build

```bash
# Compile TypeScript
npm run build

# Production build
npm run build:production
```

## 🐳 Docker Deployment

### Development Environment

```bash
# Start development environment
docker-compose --env-file config/development.env up -d

# Check logs
docker-compose logs -f omise-mcp-server
```

### Production Environment

```bash
# Start production environment
docker-compose --env-file config/production.env up -d

# Health check
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/live
```

### Automated Deployment

```bash
# Run deployment script
./deploy.sh latest production
```

## 📊 Monitoring & Logs

### Prometheus Metrics

- **URL**: http://localhost:9090
- **Metrics**: CPU, memory, request count, response time
- **Alerts**: High load, error rate monitoring

### Grafana Dashboard

- **URL**: http://localhost:3001
- **Login**: admin / admin (default)
- **Dashboards**: System monitoring, application monitoring

### Log Management

```bash
# Application logs
docker-compose logs -f omise-mcp-server

# Nginx logs
docker-compose logs -f nginx

# All service logs
docker-compose logs -f
```

## 🔒 Security

### Security Features

- **Non-root user**: Run containers as non-root user
- **Security headers**: Proper HTTP header configuration
- **Rate limiting**: API call restrictions
- **Sensitive data masking**: Hide sensitive information in logs
- **Environment isolation**: Complete separation of test and production environments

### SSL/TLS Configuration

```bash
# Place SSL certificates
mkdir -p nginx/ssl
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

### Security Scanning

```bash
# Container security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image omise-mcp-server:latest
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
docker-compose logs omise-mcp-server

# Check environment variables
docker-compose config
```

#### 2. Health Check Fails

```bash
# Check health check endpoint directly
curl -v http://localhost:3000/health

# Check service connectivity
docker-compose exec omise-mcp-server ping redis
```

#### 3. Memory Issues

```bash
# Check memory usage
docker stats

# Remove unnecessary containers
docker system prune -a
```

### Log Analysis

```bash
# Check error logs
docker-compose logs omise-mcp-server | grep ERROR

# Analyze access logs
docker-compose logs nginx | grep "GET /"
```

## 📚 API Reference

### Payment Tools

#### create_charge
Create a new charge.

**Parameters:**
- `amount` (required): Amount in smallest currency unit
- `currency` (required): Currency code (THB, USD, JPY, etc.)
- `description` (optional): Charge description
- `customer` (optional): Customer ID
- `card` (optional): Card ID
- `source` (optional): Source ID
- `capture` (optional): Capture immediately (default: true)
- `return_uri` (optional): Redirect URI
- `metadata` (optional): Metadata

#### retrieve_charge
Retrieve charge information.

**Parameters:**
- `charge_id` (required): Charge ID to retrieve

#### list_charges
List charges.

**Parameters:**
- `limit` (optional): Number of items to retrieve (default: 20)
- `offset` (optional): Offset (default: 0)
- `order` (optional): Sort order (chronological/reverse_chronological)
- `status` (optional): Status filter
- `customer` (optional): Customer ID filter

### Customer Tools

#### create_customer
Create a new customer.

**Parameters:**
- `email` (optional): Customer email address
- `description` (optional): Customer description
- `card` (optional): Card ID
- `metadata` (optional): Metadata

#### retrieve_customer
Retrieve customer information.

**Parameters:**
- `customer_id` (required): Customer ID to retrieve

### Token Tools

#### create_token
Create a secure card token for payment processing.

**Parameters:**
- `card` (required): Card information
  - `name` (required): Cardholder name
  - `number` (required): Card number
  - `expiration_month` (required): Expiration month (1-12)
  - `expiration_year` (required): Expiration year (4 digits)
  - `city` (optional): Billing address city
  - `postal_code` (optional): Billing address postal code
  - `security_code` (optional): Security code (CVV/CVC)

## 🔗 External Links

### Omise Official Documentation

- [Omise API Documentation](https://www.omise.co/api-documentation)
- [Omise Charges API](https://www.omise.co/charges-api)
- [Omise Customers API](https://www.omise.co/customers-api)
- [Omise Transfers API](https://www.omise.co/transfers-api)
- [Omise Refunds API](https://www.omise.co/refunds-api)
- [Omise Disputes API](https://www.omise.co/disputes-api)
- [Omise Schedules API](https://www.omise.co/schedules-api)
- [Omise Events API](https://www.omise.co/events-api)
- [Omise Webhooks API](https://www.omise.co/webhooks-api)
- [Omise Links API](https://www.omise.co/links-api)
- [Omise Chains API](https://www.omise.co/chains-api)
- [Omise Capabilities API](https://www.omise.co/capabilities-api)

### Technical Documentation

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)

### Support

- **GitHub Issues**: [Bug reports and feature requests](https://github.com/your-org/omise-mcp-server/issues)
- **Omise Support**: [Omise official support](https://www.omise.co/support)
- **Community**: [Developer community](https://github.com/your-org/omise-mcp-server/discussions)

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions to the project are welcome! Please follow these steps:

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

### Development Guidelines

- Write code in TypeScript
- Maintain test coverage
- Follow ESLint rules
- Write clear commit messages

## 📈 Roadmap

### v1.1.0 (Planned)
- [ ] Additional payment method support
- [ ] Advanced reporting features
- [ ] Performance optimizations

### v1.2.0 (Planned)
- [ ] Enhanced multi-tenant support
- [ ] Advanced monitoring features
- [ ] Enhanced security features

## 📊 Statistics

- **Total Tools**: 51
- **Supported APIs**: 11 categories
- **Test Coverage**: 95%+
- **TypeScript**: 100%
- **Docker Support**: ✅
- **Monitoring Support**: ✅

---

**Omise MCP Server** - Achieve secure and efficient payment processing! 🚀