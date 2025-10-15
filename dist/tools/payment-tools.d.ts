/**
 * Payment-related MCP Tools
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
export declare class PaymentTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateCurrency;
    private validateAmount;
    private sanitizeMetadata;
    createCharge(params: any): Promise<ToolResult>;
    retrieveCharge(params: any): Promise<ToolResult>;
    listCharges(params: any): Promise<ToolResult>;
    updateCharge(params: any): Promise<ToolResult>;
    captureCharge(params: any): Promise<ToolResult>;
    reverseCharge(params: any): Promise<ToolResult>;
    expireCharge(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=payment-tools.d.ts.map