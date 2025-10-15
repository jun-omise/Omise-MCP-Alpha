/**
 * Base Tool Handler
 *
 * Abstract base class for all MCP tools, providing common functionality
 * and standardized patterns inspired by Stripe's MCP implementation.
 */
import { MCPError, ErrorCode } from '../types/errors';
export class BaseToolHandler {
    omiseClient;
    logger;
    constructor(omiseClient, logger) {
        this.omiseClient = omiseClient;
        this.logger = logger;
    }
    /**
     * Validate input arguments against the tool's schema
     */
    validateInput(args) {
        if (!args || typeof args !== 'object') {
            throw new MCPError(ErrorCode.VALIDATION_ERROR, 'Invalid input: arguments must be an object');
        }
        // Basic validation - in a real implementation, you'd use AJV
        const requiredFields = this.inputSchema.required || [];
        for (const field of requiredFields) {
            if (!(field in args)) {
                throw new MCPError(ErrorCode.VALIDATION_ERROR, `Missing required field: ${field}`);
            }
        }
    }
    /**
     * Standardized error handling
     */
    handleError(error, context) {
        this.logger.error(`Tool execution error: ${this.name}`, error, {
            requestId: context.requestId,
            timestamp: context.timestamp
        });
        if (error instanceof MCPError) {
            return {
                success: false,
                error: error.message,
                metadata: {
                    requestId: context.requestId,
                    timestamp: new Date().toISOString(),
                    errorCode: error.code
                }
            };
        }
        return {
            success: false,
            error: 'An unexpected error occurred',
            metadata: {
                requestId: context.requestId,
                timestamp: new Date().toISOString(),
                errorCode: ErrorCode.INTERNAL_ERROR
            }
        };
    }
    /**
     * Create a successful result
     */
    createSuccessResult(data, message, context) {
        return {
            success: true,
            data,
            message: message || 'Operation completed successfully',
            metadata: {
                requestId: context?.requestId,
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * Create a failure result
     */
    createFailureResult(error, context) {
        return {
            success: false,
            error,
            metadata: {
                requestId: context?.requestId,
                timestamp: new Date().toISOString()
            }
        };
    }
    /**
     * Log tool execution start
     */
    logExecutionStart(args, context) {
        this.logger.info(`Starting tool execution: ${this.name}`, {
            requestId: context.requestId,
            args: this.sanitizeArgs(args),
            timestamp: context.timestamp
        });
    }
    /**
     * Log tool execution completion
     */
    logExecutionComplete(duration, context) {
        this.logger.info(`Tool execution completed: ${this.name}`, {
            requestId: context.requestId,
            duration,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Sanitize arguments for logging (remove sensitive data)
     */
    sanitizeArgs(args) {
        if (!args || typeof args !== 'object') {
            return args;
        }
        const sanitized = { ...args };
        const sensitiveFields = ['card_number', 'security_code', 'cvv', 'password', 'secret'];
        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    /**
     * Get rate limit information
     */
    getRateLimitInfo() {
        return this.omiseClient.getRateLimitInfo();
    }
    /**
     * Check if rate limit is exceeded
     */
    isRateLimited() {
        const rateLimitInfo = this.getRateLimitInfo();
        return rateLimitInfo ? rateLimitInfo.remaining <= 0 : false;
    }
    /**
     * Wait for rate limit reset if needed
     */
    async waitForRateLimit() {
        const rateLimitInfo = this.getRateLimitInfo();
        if (rateLimitInfo && rateLimitInfo.remaining <= 0) {
            const waitTime = rateLimitInfo.resetTime - Date.now();
            if (waitTime > 0) {
                this.logger.warn(`Rate limit exceeded, waiting ${waitTime}ms`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }
    /**
     * Execute with retry logic
     */
    async executeWithRetry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    break;
                }
                this.logger.warn(`Operation failed, retrying (${attempt}/${maxRetries})`, {
                    error: lastError.message,
                    delay
                });
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        throw lastError;
    }
    /**
     * Get tool metadata
     */
    getMetadata() {
        return {
            name: this.name,
            description: this.description,
            inputSchema: this.inputSchema
        };
    }
}
//# sourceMappingURL=base-tool-handler.js.map