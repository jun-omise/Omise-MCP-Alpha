/**
 * Refund-related MCP Tools
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
export declare class RefundTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateRefundId;
    private validateChargeId;
    private validateRefundReason;
    private validateRefundAmount;
    private sanitizeMetadata;
    createRefund(params: any): Promise<ToolResult>;
    retrieveRefund(params: any): Promise<ToolResult>;
    listRefunds(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=refund-tools.d.ts.map