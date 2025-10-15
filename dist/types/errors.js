/**
 * Standardized Error Types and Codes
 *
 * Inspired by Stripe's error handling patterns for consistent
 * error responses across all MCP tools.
 */
export var ErrorCode;
(function (ErrorCode) {
    // Validation errors
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_PARAMETER"] = "INVALID_PARAMETER";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    ErrorCode["INVALID_FORMAT"] = "INVALID_FORMAT";
    // Authentication errors
    ErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    // Rate limiting errors
    ErrorCode["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    ErrorCode["RATE_LIMIT_EXCEEDED"] = "RATE_LIMIT_EXCEEDED";
    ErrorCode["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    // Omise API errors
    ErrorCode["OMISE_API_ERROR"] = "OMISE_API_ERROR";
    ErrorCode["OMISE_INVALID_REQUEST"] = "OMISE_INVALID_REQUEST";
    ErrorCode["OMISE_CARD_ERROR"] = "OMISE_CARD_ERROR";
    ErrorCode["OMISE_INSUFFICIENT_FUNDS"] = "OMISE_INSUFFICIENT_FUNDS";
    ErrorCode["OMISE_DECLINED"] = "OMISE_DECLINED";
    // Network errors
    ErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    ErrorCode["CONNECTION_ERROR"] = "CONNECTION_ERROR";
    // Internal errors
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["CONFIGURATION_ERROR"] = "CONFIGURATION_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["CACHE_ERROR"] = "CACHE_ERROR";
    // Business logic errors
    ErrorCode["BUSINESS_LOGIC_ERROR"] = "BUSINESS_LOGIC_ERROR";
    ErrorCode["DUPLICATE_RESOURCE"] = "DUPLICATE_RESOURCE";
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["OPERATION_NOT_ALLOWED"] = "OPERATION_NOT_ALLOWED";
})(ErrorCode || (ErrorCode = {}));
export class MCPError extends Error {
    code;
    details;
    timestamp;
    requestId;
    constructor(code, message, details, requestId) {
        super(message);
        this.name = 'MCPError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
        this.requestId = requestId;
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MCPError);
        }
    }
    /**
     * Convert error to JSON format for API responses
     */
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: this.timestamp,
                requestId: this.requestId
            }
        };
    }
    /**
     * Create a validation error
     */
    static validationError(message, field, value) {
        return new MCPError(ErrorCode.VALIDATION_ERROR, message, { field, value, reason: 'Invalid input provided' });
    }
    /**
     * Create an authentication error
     */
    static authenticationError(message = 'Authentication failed') {
        return new MCPError(ErrorCode.AUTHENTICATION_ERROR, message, { reason: 'Invalid or missing authentication credentials' });
    }
    /**
     * Create a rate limit error
     */
    static rateLimitError(message = 'Rate limit exceeded') {
        return new MCPError(ErrorCode.RATE_LIMIT_ERROR, message, { reason: 'Too many requests in a short time period' });
    }
    /**
     * Create an Omise API error
     */
    static omiseApiError(message, omiseError) {
        return new MCPError(ErrorCode.OMISE_API_ERROR, message, { reason: 'Omise API returned an error', value: omiseError });
    }
    /**
     * Create a resource not found error
     */
    static notFoundError(resource, id) {
        const message = id
            ? `${resource} with ID '${id}' not found`
            : `${resource} not found`;
        return new MCPError(ErrorCode.RESOURCE_NOT_FOUND, message, { reason: 'The requested resource does not exist' });
    }
    /**
     * Create an internal error
     */
    static internalError(message = 'An internal error occurred') {
        return new MCPError(ErrorCode.INTERNAL_ERROR, message, { reason: 'An unexpected error occurred in the server' });
    }
}
/**
 * Error handler utility functions
 */
export class ErrorHandler {
    /**
     * Check if an error is a known MCP error
     */
    static isMCPError(error) {
        return error instanceof MCPError;
    }
    /**
     * Check if an error is a validation error
     */
    static isValidationError(error) {
        return this.isMCPError(error) &&
            (error.code.startsWith('VALIDATION_') ||
                error.code.startsWith('INVALID_') ||
                error.code.startsWith('MISSING_'));
    }
    /**
     * Check if an error is an authentication error
     */
    static isAuthenticationError(error) {
        return this.isMCPError(error) &&
            (error.code.startsWith('AUTHENTICATION_') ||
                error.code.startsWith('INVALID_CREDENTIALS') ||
                error.code.startsWith('TOKEN_') ||
                error.code.startsWith('INSUFFICIENT_PERMISSIONS'));
    }
    /**
     * Check if an error is a rate limit error
     */
    static isRateLimitError(error) {
        return this.isMCPError(error) &&
            (error.code.startsWith('RATE_LIMIT_') ||
                error.code.startsWith('QUOTA_'));
    }
    /**
     * Check if an error is an Omise API error
     */
    static isOmiseApiError(error) {
        return this.isMCPError(error) && error.code.startsWith('OMISE_');
    }
    /**
     * Check if an error is retryable
     */
    static isRetryableError(error) {
        if (!this.isMCPError(error)) {
            return false;
        }
        const retryableCodes = [
            ErrorCode.NETWORK_ERROR,
            ErrorCode.TIMEOUT_ERROR,
            ErrorCode.CONNECTION_ERROR,
            ErrorCode.RATE_LIMIT_ERROR,
            ErrorCode.INTERNAL_ERROR
        ];
        return retryableCodes.includes(error.code);
    }
    /**
     * Get user-friendly error message
     */
    static getUserFriendlyMessage(error) {
        if (this.isMCPError(error)) {
            switch (error.code) {
                case ErrorCode.VALIDATION_ERROR:
                    return 'Please check your input and try again.';
                case ErrorCode.AUTHENTICATION_ERROR:
                    return 'Please check your credentials and try again.';
                case ErrorCode.RATE_LIMIT_ERROR:
                    return 'Too many requests. Please wait a moment and try again.';
                case ErrorCode.OMISE_API_ERROR:
                    return 'Payment processing error. Please try again or contact support.';
                case ErrorCode.RESOURCE_NOT_FOUND:
                    return 'The requested item was not found.';
                default:
                    return 'An error occurred. Please try again or contact support.';
            }
        }
        return 'An unexpected error occurred. Please try again or contact support.';
    }
}
//# sourceMappingURL=errors.js.map