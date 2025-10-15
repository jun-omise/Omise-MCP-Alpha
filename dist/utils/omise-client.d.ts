/**
 * Omise API Client
 */
import { OmiseConfig, OmiseCharge, OmiseCustomer, OmiseToken, CreateChargeRequest, CreateCustomerRequest, CreateTokenRequest, OmiseListResponse } from '../types/omise';
import { Logger } from './logger';
import { RateLimitInfo } from '../types/mcp';
export declare class OmiseClient {
    private client;
    private config;
    private logger;
    private rateLimitInfo;
    private requestQueue;
    private isProcessingQueue;
    constructor(config: OmiseConfig, logger: Logger);
    private setupInterceptors;
    private generateRequestId;
    private updateRateLimitInfo;
    private handleRateLimitError;
    private handleApiError;
    private executeWithRetry;
    private sleep;
    private processQueue;
    getRateLimitInfo(): RateLimitInfo | null;
    createCharge(params: CreateChargeRequest): Promise<OmiseCharge>;
    getCharge(chargeId: string): Promise<OmiseCharge>;
    listCharges(params?: any): Promise<OmiseListResponse<OmiseCharge>>;
    createCustomer(params: CreateCustomerRequest): Promise<OmiseCustomer>;
    getCustomer(customerId: string): Promise<OmiseCustomer>;
    listCustomers(params?: any): Promise<OmiseListResponse<OmiseCustomer>>;
    createToken(params: CreateTokenRequest): Promise<OmiseToken>;
    getToken(tokenId: string): Promise<OmiseToken>;
    get<T>(endpoint: string, params?: any): Promise<T>;
    post<T>(endpoint: string, data?: any): Promise<T>;
    put<T>(endpoint: string, data?: any): Promise<T>;
    delete<T>(endpoint: string): Promise<T>;
}
//# sourceMappingURL=omise-client.d.ts.map