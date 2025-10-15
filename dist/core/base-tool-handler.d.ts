/**
 * Base Tool Handler
 *
 * Abstract base class for all MCP tools, providing common functionality
 * and standardized patterns inspired by Stripe's MCP implementation.
 */
import { JSONSchema7 } from 'json-schema';
import { OmiseClient } from '../utils/omise-client';
import { Logger } from '../utils/logger';
import { RequestContext, ToolResult } from '../types/mcp';
export declare abstract class BaseToolHandler {
    protected omiseClient: OmiseClient;
    protected logger: Logger;
    abstract readonly name: string;
    abstract readonly description: string;
    abstract readonly inputSchema: JSONSchema7;
    constructor(omiseClient: OmiseClient, logger: Logger);
    /**
     * Main execution method - must be implemented by subclasses
     */
    abstract execute(args: any, context: RequestContext): Promise<ToolResult>;
    /**
     * Validate input arguments against the tool's schema
     */
    protected validateInput(args: any): void;
    /**
     * Standardized error handling
     */
    protected handleError(error: Error, context: RequestContext): ToolResult;
    /**
     * Create a successful result
     */
    protected createSuccessResult(data: any, message?: string, context?: RequestContext): ToolResult;
    /**
     * Create a failure result
     */
    protected createFailureResult(error: string, context?: RequestContext): ToolResult;
    /**
     * Log tool execution start
     */
    protected logExecutionStart(args: any, context: RequestContext): void;
    /**
     * Log tool execution completion
     */
    protected logExecutionComplete(duration: number, context: RequestContext): void;
    /**
     * Sanitize arguments for logging (remove sensitive data)
     */
    private sanitizeArgs;
    /**
     * Get rate limit information
     */
    protected getRateLimitInfo(): import("../types/mcp").RateLimitInfo | null;
    /**
     * Check if rate limit is exceeded
     */
    protected isRateLimited(): boolean;
    /**
     * Wait for rate limit reset if needed
     */
    protected waitForRateLimit(): Promise<void>;
    /**
     * Execute with retry logic
     */
    protected executeWithRetry<T>(operation: () => Promise<T>, maxRetries?: number, delay?: number): Promise<T>;
    /**
     * Get tool metadata
     */
    getMetadata(): {
        name: string;
        description: string;
        inputSchema: JSONSchema7;
    };
}
//# sourceMappingURL=base-tool-handler.d.ts.map