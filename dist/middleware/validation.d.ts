/**
 * Input Validation Middleware
 *
 * Provides AJV-based validation for tool inputs with decorators
 * and standardized error handling.
 */
import { JSONSchemaType } from 'ajv';
/**
 * Validation decorator for tool methods
 */
export declare function validateToolInput<T>(schema: JSONSchemaType<T>): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Validation utility class
 */
export declare class ValidationService {
    private static instance;
    private validators;
    private constructor();
    static getInstance(): ValidationService;
    /**
     * Validate data against a schema
     */
    validate<T>(schema: JSONSchemaType<T>, data: any): T;
    /**
     * Validate with custom error message
     */
    validateWithMessage<T>(schema: JSONSchemaType<T>, data: any, errorMessage: string): T;
    /**
     * Check if data is valid without throwing
     */
    isValid<T>(schema: JSONSchemaType<T>, data: any): boolean;
    /**
     * Get validation errors without throwing
     */
    getValidationErrors<T>(schema: JSONSchemaType<T>, data: any): any[];
}
/**
 * Common validation schemas
 */
export declare const CommonSchemas: {
    /**
     * Currency code validation
     */
    currency: {
        type: "string";
        pattern: string;
        description: string;
    };
    /**
     * Amount validation
     */
    amount: {
        type: "number";
        minimum: number;
        description: string;
    };
    /**
     * Pagination limit
     */
    limit: {
        type: "number";
        minimum: number;
        maximum: number;
        default: number;
        description: string;
    };
    /**
     * Pagination offset
     */
    offset: {
        type: "number";
        minimum: number;
        default: number;
        description: string;
    };
    /**
     * Order direction
     */
    order: {
        type: "string";
        enum: string[];
        default: string;
        description: string;
    };
    /**
     * Date-time string
     */
    dateTime: {
        type: "string";
        format: string;
        description: string;
    };
    /**
     * URI string
     */
    uri: {
        type: "string";
        format: string;
        description: string;
    };
    /**
     * Email string
     */
    email: {
        type: "string";
        format: string;
        description: string;
    };
    /**
     * Metadata object
     */
    metadata: {
        type: "object";
        additionalProperties: {
            type: "string";
        };
        description: string;
    };
};
/**
 * Validation helper functions
 */
export declare class ValidationHelpers {
    /**
     * Validate currency code
     */
    static validateCurrency(currency: string): string;
    /**
     * Validate amount
     */
    static validateAmount(amount: number): number;
    /**
     * Validate pagination parameters
     */
    static validatePagination(limit?: number, offset?: number): {
        limit: number;
        offset: number;
    };
    /**
     * Validate date range
     */
    static validateDateRange(from?: string, to?: string): {
        from?: Date;
        to?: Date;
    };
}
//# sourceMappingURL=validation.d.ts.map