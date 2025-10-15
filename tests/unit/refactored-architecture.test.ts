/**
 * Tests for Refactored Architecture
 * 
 * Tests the new dynamic tool registry, base tool handler, and error handling systems.
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ToolRegistry } from '../../src/core/tool-registry';
import { BaseToolHandler } from '../../src/core/base-tool-handler';
import { MCPError, ErrorCode } from '../../src/types/errors';
import { OmiseClient } from '../../src/utils/omise-client';
import { Logger } from '../../src/utils/logger';
import { RequestContext, ToolResult } from '../../src/types/mcp';
import { JSONSchema7 } from 'json-schema';

// Mock dependencies
jest.mock('../../src/utils/omise-client');
jest.mock('../../src/utils/logger');

describe('Refactored Architecture', () => {
  let mockOmiseClient: jest.Mocked<OmiseClient>;
  let mockLogger: jest.Mocked<Logger>;
  let toolRegistry: ToolRegistry;
  let requestContext: RequestContext;

  beforeEach(() => {
    mockOmiseClient = new OmiseClient({} as any, {} as any) as jest.Mocked<OmiseClient>;
    mockLogger = new Logger({} as any) as jest.Mocked<Logger>;
    toolRegistry = new ToolRegistry(mockLogger);
    
    requestContext = {
      requestId: 'test-request-123',
      timestamp: new Date().toISOString(),
      method: 'MCP_TOOL_CALL',
      url: 'tool://test_tool',
      headers: {},
      body: {}
    };
  });

  describe('ToolRegistry', () => {
    test('should register and retrieve tools', () => {
      const mockTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object' },
        execute: jest.fn()
      };

      toolRegistry.registerTool(mockTool);
      
      expect(toolRegistry.hasTool('test_tool')).toBe(true);
      expect(toolRegistry.getTool('test_tool')).toBe(mockTool);
      expect(toolRegistry.getToolCount()).toBe(1);
    });

    test('should register multiple tools', () => {
      const mockTools = [
        {
          name: 'tool1',
          description: 'Tool 1',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        },
        {
          name: 'tool2',
          description: 'Tool 2',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        }
      ];

      toolRegistry.registerTools(mockTools);
      
      expect(toolRegistry.getToolCount()).toBe(2);
      expect(toolRegistry.hasTool('tool1')).toBe(true);
      expect(toolRegistry.hasTool('tool2')).toBe(true);
    });

    test('should execute registered tools', async () => {
      const mockResult: ToolResult = {
        success: true,
        data: { test: 'data' },
        message: 'Success'
      };

      const mockTool = {
        name: 'test_tool',
        description: 'Test tool',
        inputSchema: { type: 'object' },
        execute: jest.fn().mockResolvedValue(mockResult)
      };

      toolRegistry.registerTool(mockTool);
      
      const result = await toolRegistry.executeTool('test_tool', { test: 'args' }, requestContext);
      
      expect(mockTool.execute).toHaveBeenCalledWith({ test: 'args' }, requestContext);
      expect(result).toBe(mockResult);
    });

    test('should throw error for unknown tools', async () => {
      await expect(
        toolRegistry.executeTool('unknown_tool', {}, requestContext)
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });

    test('should get tools by category', () => {
      const mockTools = [
        {
          name: 'payment_create',
          description: 'Create payment',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        },
        {
          name: 'payment_retrieve',
          description: 'Retrieve payment',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        },
        {
          name: 'customer_create',
          description: 'Create customer',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        }
      ];

      toolRegistry.registerTools(mockTools);
      
      const paymentTools = toolRegistry.getToolsByCategory('payment');
      expect(paymentTools).toHaveLength(2);
      expect(paymentTools.map(t => t.name)).toEqual(['payment_create', 'payment_retrieve']);
    });

    test('should provide registry statistics', () => {
      const mockTools = [
        {
          name: 'payment_create',
          description: 'Create payment',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        },
        {
          name: 'customer_create',
          description: 'Create customer',
          inputSchema: { type: 'object' },
          execute: jest.fn()
        }
      ];

      toolRegistry.registerTools(mockTools);
      
      const stats = toolRegistry.getStats();
      expect(stats.totalTools).toBe(2);
      expect(stats.categories).toEqual({
        payment: 1,
        customer: 1
      });
      expect(stats.tools).toEqual(['payment_create', 'customer_create']);
    });
  });

  describe('BaseToolHandler', () => {
    class TestToolHandler extends BaseToolHandler {
      readonly name = 'test_tool';
      readonly description = 'Test tool';
      readonly inputSchema: JSONSchema7 = {
        type: 'object',
        properties: {
          requiredField: { type: 'string' }
        },
        required: ['requiredField']
      };

      async execute(args: any, context: RequestContext): Promise<ToolResult> {
        this.logExecutionStart(args, context);
        this.validateInput(args);
        
        const result = this.createSuccessResult(
          { processed: args.requiredField },
          'Test completed',
          context
        );
        
        this.logExecutionComplete(100, context);
        return result;
      }
    }

    let testHandler: TestToolHandler;

    beforeEach(() => {
      testHandler = new TestToolHandler(mockOmiseClient, mockLogger);
    });

    test('should validate required fields', async () => {
      await expect(
        testHandler.execute({}, requestContext)
      ).rejects.toThrow(MCPError);
    });

    test('should execute successfully with valid input', async () => {
      const result = await testHandler.execute(
        { requiredField: 'test value' },
        requestContext
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ processed: 'test value' });
      expect(result.message).toBe('Test completed');
      expect(result.metadata?.requestId).toBe(requestContext.requestId);
    });

    test('should handle errors gracefully', async () => {
      class ErrorToolHandler extends BaseToolHandler {
        readonly name = 'error_tool';
        readonly description = 'Error tool';
        readonly inputSchema: JSONSchema7 = { type: 'object' };

        async execute(args: any, context: RequestContext): Promise<ToolResult> {
          throw new Error('Test error');
        }
      }

      const errorHandler = new ErrorToolHandler(mockOmiseClient, mockLogger);
      const result = await errorHandler.execute({}, requestContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
      expect(result.metadata?.errorCode).toBe(ErrorCode.INTERNAL_ERROR);
    });

    test('should handle MCP errors', async () => {
      class MCPErrorToolHandler extends BaseToolHandler {
        readonly name = 'mcp_error_tool';
        readonly description = 'MCP Error tool';
        readonly inputSchema: JSONSchema7 = { type: 'object' };

        async execute(args: any, context: RequestContext): Promise<ToolResult> {
          throw new MCPError(ErrorCode.VALIDATION_ERROR, 'Test MCP error');
        }
      }

      const mcpErrorHandler = new MCPErrorToolHandler(mockOmiseClient, mockLogger);
      const result = await mcpErrorHandler.execute({}, requestContext);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test MCP error');
      expect(result.metadata?.errorCode).toBe(ErrorCode.VALIDATION_ERROR);
    });

    test('should sanitize sensitive data in logs', () => {
      const sensitiveArgs = {
        card_number: '4111111111111111',
        security_code: '123',
        normal_field: 'normal value'
      };

      // Access private method for testing
      const sanitized = (testHandler as any).sanitizeArgs(sensitiveArgs);
      
      expect(sanitized.card_number).toBe('[REDACTED]');
      expect(sanitized.security_code).toBe('[REDACTED]');
      expect(sanitized.normal_field).toBe('normal value');
    });
  });

  describe('MCPError', () => {
    test('should create validation error', () => {
      const error = MCPError.validationError('Invalid input', 'field', 'value');
      
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.details?.field).toBe('field');
      expect(error.details?.value).toBe('value');
    });

    test('should create authentication error', () => {
      const error = MCPError.authenticationError('Auth failed');
      
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(error.message).toBe('Auth failed');
      expect(error.details?.reason).toBe('Invalid or missing authentication credentials');
    });

    test('should create rate limit error', () => {
      const error = MCPError.rateLimitError('Too many requests');
      
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_ERROR);
      expect(error.message).toBe('Too many requests');
      expect(error.details?.reason).toBe('Too many requests in a short time period');
    });

    test('should create not found error', () => {
      const error = MCPError.notFoundError('Charge', 'chrg_123');
      
      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
      expect(error.message).toBe("Charge with ID 'chrg_123' not found");
      expect(error.details?.reason).toBe('The requested resource does not exist');
    });

    test('should convert to JSON format', () => {
      const error = MCPError.validationError('Test error', 'field', 'value');
      const json = error.toJSON();
      
      expect(json.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.error.message).toBe('Test error');
      expect(json.error.details?.field).toBe('field');
      expect(json.error.timestamp).toBeDefined();
    });
  });

  describe('ErrorHandler utilities', () => {
    test('should identify MCP errors', () => {
      const mcpError = MCPError.validationError('Test');
      const regularError = new Error('Test');
      
      expect(MCPError.isMCPError(mcpError)).toBe(true);
      expect(MCPError.isMCPError(regularError)).toBe(false);
    });

    test('should identify validation errors', () => {
      const validationError = MCPError.validationError('Test');
      const authError = MCPError.authenticationError('Test');
      
      expect(MCPError.isValidationError(validationError)).toBe(true);
      expect(MCPError.isValidationError(authError)).toBe(false);
    });

    test('should identify retryable errors', () => {
      const retryableError = MCPError.internalError('Test');
      const nonRetryableError = MCPError.validationError('Test');
      
      expect(MCPError.isRetryableError(retryableError)).toBe(true);
      expect(MCPError.isRetryableError(nonRetryableError)).toBe(false);
    });

    test('should provide user-friendly messages', () => {
      const validationError = MCPError.validationError('Test');
      const authError = MCPError.authenticationError('Test');
      const rateLimitError = MCPError.rateLimitError('Test');
      
      expect(MCPError.getUserFriendlyMessage(validationError))
        .toBe('Please check your input and try again.');
      expect(MCPError.getUserFriendlyMessage(authError))
        .toBe('Please check your credentials and try again.');
      expect(MCPError.getUserFriendlyMessage(rateLimitError))
        .toBe('Too many requests. Please wait a moment and try again.');
    });
  });
});
