/**
 * Omise MCP Server Main File
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, GetServerInfoRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { loadConfig, validateOmiseKeys, getServerInfo } from './utils/config';
import { Logger } from './utils/logger';
import { OmiseClient } from './utils/omise-client';
import { PaymentTools } from './tools/payment-tools';
import { CustomerTools } from './tools/customer-tools';
import { TokenTools } from './tools/token-tools';
import { SourceTools } from './tools/source-tools';
import { TransferTools } from './tools/transfer-tools';
import { RecipientTools } from './tools/recipient-tools';
import { RefundTools } from './tools/refund-tools';
import { DisputeTools } from './tools/dispute-tools';
import { ScheduleTools } from './tools/schedule-tools';
import { EventTools } from './tools/event-tools';
import { WebhookTools } from './tools/webhook-tools';
import { LinkTools } from './tools/link-tools';
import { ChainTools } from './tools/chain-tools';
import { CapabilityTools } from './tools/capability-tools';
async function main() {
    try {
        // Load and validate configuration
        const config = loadConfig();
        validateOmiseKeys(config);
        // Initialize logger
        const logger = new Logger(config);
        // Initialize Omise client
        const omiseClient = new OmiseClient(config.omise, logger);
        // Initialize tools
        const paymentTools = new PaymentTools(omiseClient, logger);
        const customerTools = new CustomerTools(omiseClient, logger);
        const tokenTools = new TokenTools(omiseClient, logger);
        const sourceTools = new SourceTools(omiseClient, logger);
        const transferTools = new TransferTools(omiseClient, logger);
        const recipientTools = new RecipientTools(omiseClient, logger);
        const refundTools = new RefundTools(omiseClient, logger);
        const disputeTools = new DisputeTools(omiseClient, logger);
        const scheduleTools = new ScheduleTools(omiseClient, logger);
        const eventTools = new EventTools(omiseClient, logger);
        const webhookTools = new WebhookTools(omiseClient, logger);
        const linkTools = new LinkTools(omiseClient, logger);
        const chainTools = new ChainTools(omiseClient, logger);
        const capabilityTools = new CapabilityTools(omiseClient, logger);
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
        // Get server information
        server.setRequestHandler(GetServerInfoRequestSchema, async () => {
            return {
                name: serverInfo.name,
                version: serverInfo.version,
                description: serverInfo.description,
                capabilities: serverInfo.capabilities,
            };
        });
        // Get list of tools
        server.setRequestHandler(ListToolsRequestSchema, async () => {
            const allTools = [
                ...paymentTools.getTools(),
                ...customerTools.getTools(),
                ...tokenTools.getTools(),
                ...sourceTools.getTools(),
                ...transferTools.getTools(),
                ...recipientTools.getTools(),
                ...refundTools.getTools(),
                ...disputeTools.getTools(),
                ...scheduleTools.getTools(),
                ...eventTools.getTools(),
                ...webhookTools.getTools(),
                ...linkTools.getTools(),
                ...chainTools.getTools(),
                ...capabilityTools.getTools(),
            ];
            logger.info('Available tools', { count: allTools.length, tools: allTools.map(t => t.name) });
            return {
                tools: allTools,
            };
        });
        // Handle tool execution
        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            const startTime = Date.now();
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            try {
                logger.info(`Executing tool: ${name}`, {
                    requestId,
                    args: args ? Object.keys(args) : [],
                    rateLimitInfo: omiseClient.getRateLimitInfo()
                });
                let result;
                switch (name) {
                    // Charge API tools
                    case 'create_charge':
                        result = await paymentTools.createCharge(args);
                        break;
                    case 'retrieve_charge':
                        result = await paymentTools.retrieveCharge(args);
                        break;
                    case 'list_charges':
                        result = await paymentTools.listCharges(args);
                        break;
                    case 'update_charge':
                        result = await paymentTools.updateCharge(args);
                        break;
                    case 'capture_charge':
                        result = await paymentTools.captureCharge(args);
                        break;
                    case 'reverse_charge':
                        result = await paymentTools.reverseCharge(args);
                        break;
                    case 'expire_charge':
                        result = await paymentTools.expireCharge(args);
                        break;
                    // Customer API tools
                    case 'create_customer':
                        result = await customerTools.createCustomer(args);
                        break;
                    case 'retrieve_customer':
                        result = await customerTools.retrieveCustomer(args);
                        break;
                    case 'list_customers':
                        result = await customerTools.listCustomers(args);
                        break;
                    case 'update_customer':
                        result = await customerTools.updateCustomer(args);
                        break;
                    case 'destroy_customer':
                        result = await customerTools.destroyCustomer(args);
                        break;
                    case 'list_customer_cards':
                        result = await customerTools.listCustomerCards(args);
                        break;
                    case 'retrieve_customer_card':
                        result = await customerTools.retrieveCustomerCard(args);
                        break;
                    case 'update_customer_card':
                        result = await customerTools.updateCustomerCard(args);
                        break;
                    case 'destroy_customer_card':
                        result = await customerTools.destroyCustomerCard(args);
                        break;
                    // Token API tools
                    case 'create_token':
                        result = await tokenTools.createToken(args);
                        break;
                    case 'retrieve_token':
                        result = await tokenTools.retrieveToken(args);
                        break;
                    // Source API tools
                    case 'create_source':
                        result = await sourceTools.createSource(args);
                        break;
                    case 'retrieve_source':
                        result = await sourceTools.retrieveSource(args);
                        break;
                    // Transfer API tools
                    case 'create_transfer':
                        result = await transferTools.createTransfer(args);
                        break;
                    case 'retrieve_transfer':
                        result = await transferTools.retrieveTransfer(args);
                        break;
                    case 'list_transfers':
                        result = await transferTools.listTransfers(args);
                        break;
                    case 'update_transfer':
                        result = await transferTools.updateTransfer(args);
                        break;
                    case 'destroy_transfer':
                        result = await transferTools.destroyTransfer(args);
                        break;
                    // Recipient API tools
                    case 'create_recipient':
                        result = await recipientTools.createRecipient(args);
                        break;
                    case 'retrieve_recipient':
                        result = await recipientTools.retrieveRecipient(args);
                        break;
                    case 'list_recipients':
                        result = await recipientTools.listRecipients(args);
                        break;
                    case 'update_recipient':
                        result = await recipientTools.updateRecipient(args);
                        break;
                    case 'destroy_recipient':
                        result = await recipientTools.destroyRecipient(args);
                        break;
                    case 'verify_recipient':
                        result = await recipientTools.verifyRecipient(args);
                        break;
                    // Refund API tools
                    case 'create_refund':
                        result = await refundTools.createRefund(args);
                        break;
                    case 'retrieve_refund':
                        result = await refundTools.retrieveRefund(args);
                        break;
                    case 'list_refunds':
                        result = await refundTools.listRefunds(args);
                        break;
                    // Dispute API tools
                    case 'list_disputes':
                        result = await disputeTools.listDisputes(args);
                        break;
                    case 'retrieve_dispute':
                        result = await disputeTools.retrieveDispute(args);
                        break;
                    case 'accept_dispute':
                        result = await disputeTools.acceptDispute(args);
                        break;
                    case 'update_dispute':
                        result = await disputeTools.updateDispute(args);
                        break;
                    case 'list_dispute_documents':
                        result = await disputeTools.listDisputeDocuments(args);
                        break;
                    case 'retrieve_dispute_document':
                        result = await disputeTools.retrieveDisputeDocument(args);
                        break;
                    case 'upload_dispute_document':
                        result = await disputeTools.uploadDisputeDocument(args);
                        break;
                    case 'destroy_dispute_document':
                        result = await disputeTools.destroyDisputeDocument(args);
                        break;
                    // Schedule API tools
                    case 'create_schedule':
                        result = await scheduleTools.createSchedule(args);
                        break;
                    case 'retrieve_schedule':
                        result = await scheduleTools.retrieveSchedule(args);
                        break;
                    case 'list_schedules':
                        result = await scheduleTools.listSchedules(args);
                        break;
                    case 'destroy_schedule':
                        result = await scheduleTools.destroySchedule(args);
                        break;
                    case 'list_schedule_occurrences':
                        result = await scheduleTools.listScheduleOccurrences(args);
                        break;
                    // Event API tools
                    case 'list_events':
                        result = await eventTools.listEvents(args);
                        break;
                    case 'retrieve_event':
                        result = await eventTools.retrieveEvent(args);
                        break;
                    // Webhook API tools
                    case 'webhook_endpoint_list':
                        result = await webhookTools.listWebhookEndpoints(args);
                        break;
                    case 'webhook_endpoint_create':
                        result = await webhookTools.createWebhookEndpoint(args);
                        break;
                    case 'webhook_endpoint_retrieve':
                        result = await webhookTools.retrieveWebhookEndpoint(args);
                        break;
                    case 'webhook_endpoint_update':
                        result = await webhookTools.updateWebhookEndpoint(args);
                        break;
                    case 'webhook_endpoint_destroy':
                        result = await webhookTools.destroyWebhookEndpoint(args);
                        break;
                    // Link API tools
                    case 'create_link':
                        result = await linkTools.createLink(args);
                        break;
                    case 'retrieve_link':
                        result = await linkTools.retrieveLink(args);
                        break;
                    case 'list_links':
                        result = await linkTools.listLinks(args);
                        break;
                    // Chain API tools
                    case 'create_chain':
                        result = await chainTools.createChain(args);
                        break;
                    case 'retrieve_chain':
                        result = await chainTools.retrieveChain(args);
                        break;
                    case 'list_chains':
                        result = await chainTools.listChains(args);
                        break;
                    case 'list_chain_revisions':
                        result = await chainTools.listChainRevisions(args);
                        break;
                    // Capability API tools
                    case 'retrieve_capability':
                        result = await capabilityTools.retrieveCapability(args);
                        break;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
                const duration = Date.now() - startTime;
                result.metadata = {
                    requestId,
                    timestamp: new Date().toISOString(),
                    duration
                };
                if (result.success) {
                    logger.info(`Tool execution successful: ${name}`, {
                        requestId,
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
                                    metadata: result.metadata,
                                }, null, 2),
                            },
                        ],
                    };
                }
                else {
                    logger.warn(`Tool execution failed: ${name}`, {
                        requestId,
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
                                    metadata: result.metadata,
                                }, null, 2),
                            },
                        ],
                        isError: true,
                    };
                }
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger.error(`Tool execution error: ${name}`, error, {
                    requestId,
                    duration,
                    args
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: error instanceof Error ? error.message : 'Unknown error occurred',
                                metadata: {
                                    requestId,
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
        logger.info('Omise MCP Server started successfully', {
            name: config.server.name,
            version: config.server.version,
            environment: config.omise.environment,
            apiVersion: config.omise.apiVersion,
            baseUrl: config.omise.baseUrl,
            supportedTools: serverInfo.supportedTools.length,
            supportedResources: serverInfo.supportedResources.length,
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
// Catch unhandled exceptions and process termination
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
//# sourceMappingURL=index.js.map