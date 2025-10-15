/**
 * Standardized Error Types and Codes
 *
 * Inspired by Stripe's error handling patterns for consistent
 * error responses across all MCP tools.
 */
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_PARAMETER = "INVALID_PARAMETER",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    INVALID_FORMAT = "INVALID_FORMAT",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
    QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
    OMISE_API_ERROR = "OMISE_API_ERROR",
    OMISE_INVALID_REQUEST = "OMISE_INVALID_REQUEST",
    OMISE_CARD_ERROR = "OMISE_CARD_ERROR",
    OMISE_INSUFFICIENT_FUNDS = "OMISE_INSUFFICIENT_FUNDS",
    OMISE_DECLINED = "OMISE_DECLINED",
    NETWORK_ERROR = "NETWORK_ERROR",
    TIMEOUT_ERROR = "TIMEOUT_ERROR",
    CONNECTION_ERROR = "CONNECTION_ERROR",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    CACHE_ERROR = "CACHE_ERROR",
    BUSINESS_LOGIC_ERROR = "BUSINESS_LOGIC_ERROR",
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED"
}
export interface ErrorDetails {
    field?: string;
    value?: any;
    reason?: string;
    suggestion?: string;
    documentation?: string;
}
export declare class MCPError extends Error {
    readonly code: ErrorCode;
    readonly details?: ErrorDetails;
    readonly timestamp: string;
    readonly requestId?: string;
    constructor(code: ErrorCode, message: string, details?: ErrorDetails, requestId?: string);
    /**
     * Convert error to JSON format for API responses
     */
    toJSON(): {
        error: {
            code: ErrorCode;
            message: string;
            details?: ErrorDetails;
            timestamp: string;
            requestId?: string;
        };
    };
    /**
     * Create a validation error
     */
    static validationError(message: string, field?: string, value?: any): MCPError;
    /**
     * Create an authentication error
     */
    static authenticationError(message?: string): MCPError;
    /**
     * Create a rate limit error
     */
    static rateLimitError(message?: string): MCPError;
    /**
     * Create an Omise API error
     */
    static omiseApiError(message: string, omiseError?: any): MCPError;
    /**
     * Create a resource not found error
     */
    static notFoundError(resource: string, id?: string): MCPError;
    /**
     * Create an internal error
     */
    static internalError(message?: string): MCPError;
}
/**
 * Error response format for API responses
 */
export interface ErrorResponse {
    success: false;
    error: {
        code: ErrorCode;
        message: string;
        details?: ErrorDetails;
        timestamp: string;
        requestId?: string;
    };
    metadata?: {
        requestId?: string;
        timestamp?: string;
        duration?: number;
    };
}
/**
 * Success response format for API responses
 */
export interface SuccessResponse<T = any> {
    success: true;
    data: T;
    message?: string;
    metadata?: {
        requestId?: string;
        timestamp?: string;
        duration?: number;
    };
}
/**
 * Union type for all possible API responses
 */
export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;
/**
 * Error handler utility functions
 */
export declare class ErrorHandler {
    /**
     * Check if an error is a known MCP error
     */
    static isMCPError(error: any): error is MCPError;
    /**
     * Check if an error is a validation error
     */
    static isValidationError(error: any): boolean;
    /**
     * Check if an error is an authentication error
     */
    static isAuthenticationError(error: any): boolean;
    /**
     * Check if an error is a rate limit error
     */
    static isRateLimitError(error: any): boolean;
    /**
     * Check if an error is an Omise API error
     */
    static isOmiseApiError(error: any): boolean;
    /**
     * Check if an error is retryable
     */
    static isRetryableError(error: any): boolean;
    /**
     * Get user-friendly error message
     */
    static getUserFriendlyMessage(error: any): string;
}
//# sourceMappingURL=errors.d.ts.map