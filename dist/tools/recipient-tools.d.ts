/**
 * Recipient-related MCP Tools
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
export declare class RecipientTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateRecipientId;
    private validateEmail;
    private validateTaxId;
    private validateBankAccount;
    private sanitizeMetadata;
    createRecipient(params: any): Promise<ToolResult>;
    retrieveRecipient(params: any): Promise<ToolResult>;
    listRecipients(params: any): Promise<ToolResult>;
    updateRecipient(params: any): Promise<ToolResult>;
    destroyRecipient(params: any): Promise<ToolResult>;
    verifyRecipient(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=recipient-tools.d.ts.map