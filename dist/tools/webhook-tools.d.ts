/**
 * Webhook Management-related MCP Tools
 */
interface Tool {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties?: Record<string, any>;
        required?: string[];
    };
}
import { OmiseClient } from '../utils/omise-client';
import { Logger } from '../utils/logger';
import { ToolResult } from '../types/mcp';
export declare class WebhookTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateEndpointId;
    private validateUrl;
    private validateEvents;
    private validateSecretKey;
    private sanitizeMetadata;
    verifyWebhookSignature(payload: string, signature: string, secretKey: string): boolean;
    generateWebhookSignature(payload: string, secretKey: string): string;
    checkEndpointHealth(url: string): Promise<{
        healthy: boolean;
        responseTime?: number;
        error?: string;
    }>;
    listWebhookEndpoints(params: any): Promise<ToolResult>;
    createWebhookEndpoint(params: any): Promise<ToolResult>;
    retrieveWebhookEndpoint(params: any): Promise<ToolResult>;
    updateWebhookEndpoint(params: any): Promise<ToolResult>;
    destroyWebhookEndpoint(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=webhook-tools.d.ts.map