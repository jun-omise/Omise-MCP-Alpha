/**
 * Customer-related MCP Tools
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
import type { ToolResult } from '../types/mcp';
export declare class CustomerTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateCustomerId;
    private validateCardId;
    private validateEmail;
    private sanitizeMetadata;
    createCustomer(params: any): Promise<ToolResult>;
    retrieveCustomer(params: any): Promise<ToolResult>;
    listCustomers(params: any): Promise<ToolResult>;
    updateCustomer(params: any): Promise<ToolResult>;
    destroyCustomer(params: any): Promise<ToolResult>;
    listCustomerCards(params: any): Promise<ToolResult>;
    retrieveCustomerCard(params: any): Promise<ToolResult>;
    updateCustomerCard(params: any): Promise<ToolResult>;
    destroyCustomerCard(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=customer-tools.d.ts.map