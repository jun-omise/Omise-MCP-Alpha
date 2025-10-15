/**
 * Refactored Omise MCP Server Main File
 *
 * This demonstrates how the main server file would look after implementing
 * the dynamic tool registry system, reducing complexity from 430+ lines to ~100 lines.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { CallToolRequestSchema, ListToolsRequestSchema, GetServerInfoRequestSchema, } from '@modelcontextprotocol/sdk/types';
import { loadConfig, validateOmiseKeys, getServerInfo } from './utils/config';
import { Logger } from './utils/logger';
import { OmiseClient } from './utils/omise-client';
import { ToolRegistry } from './core/tool-registry';
import { MCPError } from './types/errors';
// Import tool factories
import { PaymentToolsFactory } from './tools/refactored-payment-tools';
// import { CustomerToolsFactory } from './tools/refactored-customer-tools.js';
// import { TokenToolsFactory } from './tools/refactored-token-tools.js';
// ... other tool factories
/**
 * Register all tools with the registry
 */
async function registerAllTools(registry, omiseClient, logger) {
    logger.info('Registering all tools...');
    // Register payment tools
    const paymentTools = PaymentToolsFactory.createTools(omiseClient, logger);
    registry.registerToolHandlers(paymentTools);
    logger.info(`Registered ${paymentTools.length} payment tools`);
    // Register customer tools
    // const customerTools = CustomerToolsFactory.createTools(omiseClient, logger);
    // registry.registerToolHandlers(customerTools);
    // logger.info(`Registered ${customerTools.length} customer tools`);
    // Register token tools
    // const tokenTools = TokenToolsFactory.createTools(omiseClient, logger);
    // registry.registerToolHandlers(tokenTools);
    // logger.info(`Registered ${tokenTools.length} token tools`);
    // ... register other tool categories
    const stats = registry.getStats();
    logger.info('Tool registration complete', stats);
}
/**
 * Create request context from MCP request
 */
function createRequestContext(request) {
    return {
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        method: 'MCP_TOOL_CALL',
        url: `tool://${request.params.name}`,
        headers: {},
        body: request.params.arguments
    };
}
async function main() {
    try {
        // Load and validate configuration
        const config = loadConfig();
        validateOmiseKeys(config);
        // Initialize logger
        const logger = new Logger(config);
        // Initialize Omise client
        const omiseClient = new OmiseClient(config.omise, logger);
        // Initialize tool registry
        const toolRegistry = new ToolRegistry(logger);
        // Register all tools
        await registerAllTools(toolRegistry, omiseClient, logger);
        // Get server information
        const serverInfo = getServerInfo(config);
        // Initialize MCP server
        const server = new Server({
            name: config.server.name,
            version: config.server.version,
        }, {
            capabilities: {
                tools: {},
                resources: {},
            },
        });
        // Get server information handler
        server.setRequestHandler(GetServerInfoRequestSchema, async () => {
            return {
                name: serverInfo.name,
                version: serverInfo.version,
                description: serverInfo.description,
                capabilities: serverInfo.capabilities,
            };
        });
        // List tools handler
        server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = toolRegistry.getMCPTools();
            logger.info('List tools requested', {
                count: tools.length,
                tools: tools.map(t => t.name)
            });
            return { tools };
        });
        // Call tool handler - This is where the magic happens!
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const context = createRequestContext(request);
            const startTime = Date.now();
            try {
                logger.info(`Executing tool: ${name}`, {
                    requestId: context.requestId,
                    args: args ? Object.keys(args) : [],
                    rateLimitInfo: omiseClient.getRateLimitInfo()
                });
                // Execute tool using registry
                const result = await toolRegistry.executeTool(name, args, context);
                const duration = Date.now() - startTime;
                if (result.success) {
                    logger.info(`Tool execution successful: ${name}`, {
                        requestId: context.requestId,
                        duration,
                        rateLimitInfo: omiseClient.getRateLimitInfo()
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: true,
                                    data: result.data,
                                    message: result.message,
                                    metadata: {
                                        ...result.metadata,
                                        duration
                                    }
                                }, null, 2),
                            },
                        ],
                    };
                }
                else {
                    logger.warn(`Tool execution failed: ${name}`, {
                        requestId: context.requestId,
                        duration,
                        error: result.error
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: false,
                                    error: result.error,
                                    metadata: {
                                        ...result.metadata,
                                        duration
                                    }
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                // Handle MCP errors gracefully
                if (error instanceof MCPError) {
                    logger.error(`MCP Error in tool: ${name}`, error, {
                        requestId: context.requestId,
                        duration,
                        args
                    });
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    success: false,
                                    error: error.message,
                                    errorCode: error.code,
                                    metadata: {
                                        requestId: context.requestId,
                                        timestamp: new Date().toISOString(),
                                        duration
                                    }
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
                // Handle unexpected errors
                logger.error(`Unexpected error in tool: ${name}`, error, {
                    requestId: context.requestId,
                    duration,
                    args
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: 'An unexpected error occurred',
                                metadata: {
                                    requestId: context.requestId,
                                    timestamp: new Date().toISOString(),
                                    duration
                                }
                            }, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
        });
        // Start server
        const transport = new StdioServerTransport();
        await server.connect(transport);
        const stats = toolRegistry.getStats();
        logger.info('Omise MCP Server started successfully', {
            name: config.server.name,
            version: config.server.version,
            environment: config.omise.environment,
            apiVersion: config.omise.apiVersion,
            baseUrl: config.omise.baseUrl,
            totalTools: stats.totalTools,
            toolCategories: stats.categories,
            rateLimitEnabled: config.rateLimit.enabled,
            requestLogging: config.logging.enableRequestLogging,
            responseLogging: config.logging.enableResponseLogging
        });
    }
    catch (error) {
        console.error('Failed to start Omise MCP Server:', error);
        process.exit(1);
    }
}
// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start server
main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
//# sourceMappingURL=refactored-index.js.map