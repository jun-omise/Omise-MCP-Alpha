/**
 * Capability-related MCP Tools
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
import type { OmiseCapability } from '../types/omise';
export declare class CapabilityTools {
    private omiseClient;
    private logger;
    constructor(omiseClient: OmiseClient, logger: Logger);
    getTools(): Tool[];
    private checkFeatureAvailability;
    private checkPaymentMethodAvailability;
    private checkCurrencySupport;
    getAvailablePaymentMethods(capability: OmiseCapability): {
        creditCards: string[];
        internetBanking: string[];
        convenienceStores: string[];
        eWallets: string[];
        installments: string[];
        other: string[];
    };
    checkCapabilityLimits(capability: OmiseCapability): {
        maxChargeAmount: number;
        maxTransferAmount: number;
        maxRefundAmount: number;
        maxScheduleCount: number;
        maxWebhookEndpoints: number;
        rateLimits: {
            requestsPerMinute: number;
            requestsPerHour: number;
            requestsPerDay: number;
        };
    };
    getSupportedCurrencies(capability: OmiseCapability): {
        currencies: string[];
        defaultCurrency: string;
        currencyDetails: Array<{
            code: string;
            name: string;
            symbol: string;
            decimalPlaces: number;
            minimumAmount: number;
        }>;
    };
    private getCurrencyName;
    private getCurrencySymbol;
    private getCurrencyDecimalPlaces;
    private getCurrencyMinimumAmount;
    retrieveCapability(params: any): Promise<ToolResult>;
}
export {};
//# sourceMappingURL=capability-tools.d.ts.map