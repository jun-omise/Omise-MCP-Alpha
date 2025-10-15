/**
 * Input Validation Middleware
 *
 * Provides AJV-based validation for tool inputs with decorators
 * and standardized error handling.
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { MCPError, ErrorCode } from '../types/errors';
// Create AJV instance with formats
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
/**
 * Validation decorator for tool methods
 */
export function validateToolInput(schema) {
    const validate = ajv.compile(schema);
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (args) {
            const isValid = validate(args);
            if (!isValid) {
                const errors = validate.errors?.map(error => ({
                    field: error.instancePath || error.schemaPath,
                    message: error.message,
                    value: error.data
                })) || [];
                throw new MCPError(ErrorCode.VALIDATION_ERROR, 'Invalid input parameters', {
                    reason: 'Input validation failed',
                    value: errors
                });
            }
            return originalMethod.call(this, args);
        };
        return descriptor;
    };
}
/**
 * Validation utility class
 */
export class ValidationService {
    static instance;
    validators = new Map();
    constructor() { }
    static getInstance() {
        if (!ValidationService.instance) {
            ValidationService.instance = new ValidationService();
        }
        return ValidationService.instance;
    }
    /**
     * Validate data against a schema
     */
    validate(schema, data) {
        const schemaKey = JSON.stringify(schema);
        if (!this.validators.has(schemaKey)) {
            const validate = ajv.compile(schema);
            this.validators.set(schemaKey, validate);
        }
        const validate = this.validators.get(schemaKey);
        const isValid = validate(data);
        if (!isValid) {
            const errors = validate.errors?.map(error => ({
                field: error.instancePath || error.schemaPath,
                message: error.message,
                value: error.data
            })) || [];
            throw new MCPError(ErrorCode.VALIDATION_ERROR, 'Validation failed', {
                reason: 'Input validation failed',
                value: errors
            });
        }
        return data;
    }
    /**
     * Validate with custom error message
     */
    validateWithMessage(schema, data, errorMessage) {
        try {
            return this.validate(schema, data);
        }
        catch (error) {
            if (error instanceof MCPError) {
                throw new MCPError(error.code, errorMessage, error.details);
            }
            throw error;
        }
    }
    /**
     * Check if data is valid without throwing
     */
    isValid(schema, data) {
        try {
            this.validate(schema, data);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get validation errors without throwing
     */
    getValidationErrors(schema, data) {
        const schemaKey = JSON.stringify(schema);
        if (!this.validators.has(schemaKey)) {
            const validate = ajv.compile(schema);
            this.validators.set(schemaKey, validate);
        }
        const validate = this.validators.get(schemaKey);
        validate(data);
        return validate.errors || [];
    }
}
/**
 * Common validation schemas
 */
export const CommonSchemas = {
    /**
     * Currency code validation
     */
    currency: {
        type: 'string',
        pattern: '^[A-Z]{3}$',
        description: 'ISO 4217 currency code'
    },
    /**
     * Amount validation
     */
    amount: {
        type: 'number',
        minimum: 1,
        description: 'Amount in smallest currency unit'
    },
    /**
     * Pagination limit
     */
    limit: {
        type: 'number',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of items to retrieve'
    },
    /**
     * Pagination offset
     */
    offset: {
        type: 'number',
        minimum: 0,
        default: 0,
        description: 'Number of items to skip'
    },
    /**
     * Order direction
     */
    order: {
        type: 'string',
        enum: ['chronological', 'reverse_chronological'],
        default: 'chronological',
        description: 'Sort order'
    },
    /**
     * Date-time string
     */
    dateTime: {
        type: 'string',
        format: 'date-time',
        description: 'ISO 8601 date-time string'
    },
    /**
     * URI string
     */
    uri: {
        type: 'string',
        format: 'uri',
        description: 'Valid URI string'
    },
    /**
     * Email string
     */
    email: {
        type: 'string',
        format: 'email',
        description: 'Valid email address'
    },
    /**
     * Metadata object
     */
    metadata: {
        type: 'object',
        additionalProperties: {
            type: 'string'
        },
        description: 'Additional metadata'
    }
};
/**
 * Validation helper functions
 */
export class ValidationHelpers {
    /**
     * Validate currency code
     */
    static validateCurrency(currency) {
        if (!/^[A-Z]{3}$/.test(currency)) {
            throw new MCPError(ErrorCode.INVALID_FORMAT, 'Invalid currency code', {
                field: 'currency',
                value: currency,
                reason: 'Must be a 3-letter uppercase currency code'
            });
        }
        return currency;
    }
    /**
     * Validate amount
     */
    static validateAmount(amount) {
        if (!Number.isInteger(amount) || amount < 1) {
            throw new MCPError(ErrorCode.INVALID_PARAMETER, 'Invalid amount', {
                field: 'amount',
                value: amount,
                reason: 'Must be a positive integer'
            });
        }
        return amount;
    }
    /**
     * Validate pagination parameters
     */
    static validatePagination(limit, offset) {
        const validatedLimit = limit ? Math.min(Math.max(1, limit), 100) : 20;
        const validatedOffset = offset ? Math.max(0, offset) : 0;
        return {
            limit: validatedLimit,
            offset: validatedOffset
        };
    }
    /**
     * Validate date range
     */
    static validateDateRange(from, to) {
        const result = {};
        if (from) {
            const fromDate = new Date(from);
            if (isNaN(fromDate.getTime())) {
                throw new MCPError(ErrorCode.INVALID_FORMAT, 'Invalid from date', {
                    field: 'from',
                    value: from,
                    reason: 'Must be a valid ISO 8601 date-time string'
                });
            }
            result.from = fromDate;
        }
        if (to) {
            const toDate = new Date(to);
            if (isNaN(toDate.getTime())) {
                throw new MCPError(ErrorCode.INVALID_FORMAT, 'Invalid to date', {
                    field: 'to',
                    value: to,
                    reason: 'Must be a valid ISO 8601 date-time string'
                });
            }
            result.to = toDate;
        }
        if (result.from && result.to && result.from > result.to) {
            throw new MCPError(ErrorCode.INVALID_PARAMETER, 'Invalid date range', {
                reason: 'From date must be before to date'
            });
        }
        return result;
    }
}
//# sourceMappingURL=validation.js.map