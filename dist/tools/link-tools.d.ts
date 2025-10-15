/**
 * Payment Link-related MCP Tools
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
import { OmiseLink } from '../types/omise';
export declare class LinkTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private validateLinkId;
    private validateCurrency;
    private validateAmount;
    private validateExpirationDate;
    private validateTaxId;
    private validateCustomFields;
    private validateBranding;
    private sanitizeMetadata;
    private calculateTaxAndFees;
    generateQRCode(paymentUri: string): string;
    calculateLinkStatistics(link: OmiseLink): {
        totalViews: number;
        conversionRate: number;
        averagePaymentAmount: number;
        totalRevenue: number;
    };
    createLink(params: any): Promise<ToolResult>;
    retrieveLink(params: any): Promise<ToolResult>;
    listLinks(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=link-tools.d.ts.map