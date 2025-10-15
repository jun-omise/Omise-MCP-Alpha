/**
 * Simple Tests for Refactored Architecture
 * 
 * Basic tests for the new error handling and core concepts
 * without complex dependencies.
 */

import { describe, test, expect } from '@jest/globals';
import { MCPError, ErrorCode, ErrorHandler } from '../../src/types/errors';

describe('Refactored Architecture - Core Components', () => {
  describe('MCPError', () => {
    test('should create validation error', () => {
      const error = MCPError.validationError('Invalid input', 'field', 'value');
      
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.details?.field).toBe('field');
      expect(error.details?.value).toBe('value');
      expect(error.timestamp).toBeDefined();
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

    test('should create internal error', () => {
      const error = MCPError.internalError('Test error');
      
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.details?.reason).toBe('An unexpected error occurred in the server');
    });

    test('should convert to JSON format', () => {
      const error = MCPError.validationError('Test error', 'field', 'value');
      const json = error.toJSON();
      
      expect(json.error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.error.message).toBe('Test error');
      expect(json.error.details?.field).toBe('field');
      expect(json.error.timestamp).toBeDefined();
    });

    test('should maintain stack trace', () => {
      const error = MCPError.internalError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('MCPError');
    });
  });

  describe('ErrorHandler utilities', () => {
    test('should identify MCP errors', () => {
      const mcpError = MCPError.validationError('Test');
      const regularError = new Error('Test');
      
      expect(ErrorHandler.isMCPError(mcpError)).toBe(true);
      expect(ErrorHandler.isMCPError(regularError)).toBe(false);
    });

    test('should identify validation errors', () => {
      const validationError = MCPError.validationError('Test');
      const authError = MCPError.authenticationError('Test');
      
      expect(ErrorHandler.isValidationError(validationError)).toBe(true);
      expect(ErrorHandler.isValidationError(authError)).toBe(false);
    });

    test('should identify authentication errors', () => {
      const authError = MCPError.authenticationError('Test');
      const validationError = MCPError.validationError('Test');
      
      expect(ErrorHandler.isAuthenticationError(authError)).toBe(true);
      expect(ErrorHandler.isAuthenticationError(validationError)).toBe(false);
    });

    test('should identify rate limit errors', () => {
      const rateLimitError = MCPError.rateLimitError('Test');
      const validationError = MCPError.validationError('Test');
      
      expect(ErrorHandler.isRateLimitError(rateLimitError)).toBe(true);
      expect(ErrorHandler.isRateLimitError(validationError)).toBe(false);
    });

    test('should identify Omise API errors', () => {
      const omiseError = MCPError.omiseApiError('Test');
      const validationError = MCPError.validationError('Test');
      
      expect(ErrorHandler.isOmiseApiError(omiseError)).toBe(true);
      expect(ErrorHandler.isOmiseApiError(validationError)).toBe(false);
    });

    test('should identify retryable errors', () => {
      const retryableError = MCPError.internalError('Test');
      const nonRetryableError = MCPError.validationError('Test');
      
      expect(ErrorHandler.isRetryableError(retryableError)).toBe(true);
      expect(ErrorHandler.isRetryableError(nonRetryableError)).toBe(false);
    });

    test('should provide user-friendly messages', () => {
      const validationError = MCPError.validationError('Test');
      const authError = MCPError.authenticationError('Test');
      const rateLimitError = MCPError.rateLimitError('Test');
      const omiseError = MCPError.omiseApiError('Test');
      const notFoundError = MCPError.notFoundError('Resource');
      const regularError = new Error('Test');
      
      expect(ErrorHandler.getUserFriendlyMessage(validationError))
        .toBe('Please check your input and try again.');
      expect(ErrorHandler.getUserFriendlyMessage(authError))
        .toBe('Please check your credentials and try again.');
      expect(ErrorHandler.getUserFriendlyMessage(rateLimitError))
        .toBe('Too many requests. Please wait a moment and try again.');
      expect(ErrorHandler.getUserFriendlyMessage(omiseError))
        .toBe('Payment processing error. Please try again or contact support.');
      expect(ErrorHandler.getUserFriendlyMessage(notFoundError))
        .toBe('The requested item was not found.');
      expect(ErrorHandler.getUserFriendlyMessage(regularError))
        .toBe('An unexpected error occurred. Please try again or contact support.');
    });
  });

  describe('Error Code Enum', () => {
    test('should have all expected error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
      expect(ErrorCode.RATE_LIMIT_ERROR).toBe('RATE_LIMIT_ERROR');
      expect(ErrorCode.OMISE_API_ERROR).toBe('OMISE_API_ERROR');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND');
    });

    test('should have validation-related codes', () => {
      expect(ErrorCode.INVALID_PARAMETER).toBe('INVALID_PARAMETER');
      expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');
      expect(ErrorCode.INVALID_FORMAT).toBe('INVALID_FORMAT');
    });

    test('should have authentication-related codes', () => {
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
      expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
      expect(ErrorCode.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS');
    });

    test('should have network-related codes', () => {
      expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ErrorCode.TIMEOUT_ERROR).toBe('TIMEOUT_ERROR');
      expect(ErrorCode.CONNECTION_ERROR).toBe('CONNECTION_ERROR');
    });
  });

  describe('Error Details Interface', () => {
    test('should support optional fields', () => {
      const error = MCPError.validationError('Test', 'field', 'value');
      
      expect(error.details?.field).toBe('field');
      expect(error.details?.value).toBe('value');
      expect(error.details?.reason).toBe('Invalid input provided');
      expect(error.details?.suggestion).toBeUndefined();
      expect(error.details?.documentation).toBeUndefined();
    });

    test('should support all detail fields', () => {
      const error = new MCPError(
        ErrorCode.VALIDATION_ERROR,
        'Test',
        {
          field: 'testField',
          value: 'testValue',
          reason: 'Test reason',
          suggestion: 'Test suggestion',
          documentation: 'Test docs'
        }
      );
      
      expect(error.details?.field).toBe('testField');
      expect(error.details?.value).toBe('testValue');
      expect(error.details?.reason).toBe('Test reason');
      expect(error.details?.suggestion).toBe('Test suggestion');
      expect(error.details?.documentation).toBe('Test docs');
    });
  });
});
