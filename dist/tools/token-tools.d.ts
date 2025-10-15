/**
 * Token-related MCP Tools
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
export declare class TokenTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateTokenId;
    private validateCardNumber;
    private validateExpirationDate;
    private maskCardNumber;
    createToken(params: any): Promise<ToolResult>;
    retrieveToken(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=token-tools.d.ts.map