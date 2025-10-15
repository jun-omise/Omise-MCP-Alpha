/**
 * Dispute-related MCP Tools
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
export declare class DisputeTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateDisputeId;
    private validateDocumentId;
    private validateContentType;
    private validateBase64Content;
    private sanitizeMetadata;
    listDisputes(params: any): Promise<ToolResult>;
    retrieveDispute(params: any): Promise<ToolResult>;
    acceptDispute(params: any): Promise<ToolResult>;
    updateDispute(params: any): Promise<ToolResult>;
    listDisputeDocuments(params: any): Promise<ToolResult>;
    retrieveDisputeDocument(params: any): Promise<ToolResult>;
    uploadDisputeDocument(params: any): Promise<ToolResult>;
    destroyDisputeDocument(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=dispute-tools.d.ts.map