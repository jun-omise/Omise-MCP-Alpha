/**
 * Transfer-related MCP Tools
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
export declare class TransferTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateTransferId;
    private validateRecipientId;
    private validateCurrency;
    private validateAmount;
    private validateScheduledDate;
    private sanitizeMetadata;
    createTransfer(params: any): Promise<ToolResult>;
    retrieveTransfer(params: any): Promise<ToolResult>;
    listTransfers(params: any): Promise<ToolResult>;
    updateTransfer(params: any): Promise<ToolResult>;
    destroyTransfer(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=transfer-tools.d.ts.map