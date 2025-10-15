/**
 * Source-related MCP Tools
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
export declare class SourceTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateSourceId;
    private validateCurrency;
    private validateAmount;
    private validatePaymentMethod;
    private sanitizeMetadata;
    createSource(params: any): Promise<ToolResult>;
    retrieveSource(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=source-tools.d.ts.map