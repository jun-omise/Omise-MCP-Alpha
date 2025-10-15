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
import { MCPError, ErrorCode } from '../types/errors';

export abstract class BaseToolHandler {
  protected omiseClient: OmiseClient;
  protected logger: Logger;

  // Abstract properties that must be implemented by subclasses
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: JSONSchema7;

  constructor(omiseClient: OmiseClient, logger: Logger) {
    this.omiseClient = omiseClient;
    this.logger = logger;
  }

  /**
   * Main execution method - must be implemented by subclasses
   */
  abstract execute(args: any, context: RequestContext): Promise<ToolResult>;

  /**
   * Validate input arguments against the tool's schema
   */
  protected validateInput(args: any): void {
    if (!args || typeof args !== 'object') {
      throw new MCPError(
        ErrorCode.VALIDATION_ERROR,
        'Invalid input: arguments must be an object'
      );
    }

    // Basic validation - in a real implementation, you'd use AJV
    const requiredFields = this.inputSchema.required || [];
    for (const field of requiredFields) {
      if (!(field in args)) {
        throw new MCPError(
          ErrorCode.VALIDATION_ERROR,
          `Missing required field: ${field}`
        );
      }
    }
  }

  /**
   * Standardized error handling
   */
  protected handleError(error: Error, context: RequestContext): ToolResult {
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
  protected createSuccessResult(data: any, message?: string, context?: RequestContext): ToolResult {
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
  protected createFailureResult(error: string, context?: RequestContext): ToolResult {
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
  protected logExecutionStart(args: any, context: RequestContext): void {
    this.logger.info(`Starting tool execution: ${this.name}`, {
      requestId: context.requestId,
      args: this.sanitizeArgs(args),
      timestamp: context.timestamp
    });
  }

  /**
   * Log tool execution completion
   */
  protected logExecutionComplete(duration: number, context: RequestContext): void {
    this.logger.info(`Tool execution completed: ${this.name}`, {
      requestId: context.requestId,
      duration,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Sanitize arguments for logging (remove sensitive data)
   */
  private sanitizeArgs(args: any): any {
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
  protected getRateLimitInfo() {
    return this.omiseClient.getRateLimitInfo();
  }

  /**
   * Check if rate limit is exceeded
   */
  protected isRateLimited(): boolean {
    const rateLimitInfo = this.getRateLimitInfo();
    return rateLimitInfo ? rateLimitInfo.remaining <= 0 : false;
  }

  /**
   * Wait for rate limit reset if needed
   */
  protected async waitForRateLimit(): Promise<void> {
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
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
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

    throw lastError!;
  }

  /**
   * Get tool metadata
   */
  getMetadata(): {
    name: string;
    description: string;
    inputSchema: JSONSchema7;
  } {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema
    };
  }
}