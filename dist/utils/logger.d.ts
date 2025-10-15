/**
 * Logging Configuration and Utilities
 */
import { ServerConfig } from '../types/mcp';
export declare class Logger {
    private logger;
    private config;
    constructor(config: ServerConfig);
    private createLogger;
    private getConsoleFormat;
    private getFileFormat;
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, error: Error, ...meta: any[]): void;
    debug(message: string, ...meta: any[]): void;
    /**
     * API Request Log
     */
    logRequest(method: string, url: string, headers: any, body?: any): void;
    /**
     * API Response Log
     */
    logResponse(method: string, url: string, status: number, headers: any, body?: any, duration?: number): void;
    /**
     * Error Log
     */
    logError(error: Error, context?: any): void;
    /**
     * Security Log
     */
    logSecurity(event: string, details: any): void;
    /**
     * Performance Log
     */
    logPerformance(operation: string, duration: number, details?: any): void;
    /**
     * Business Log
     */
    logBusiness(event: string, details: any): void;
    /**
     * Mask sensitive information in headers
     */
    private sanitizeHeaders;
    /**
     * Mask sensitive information in body
     */
    private sanitizeBody;
    /**
     * Dynamic log level change
     */
    setLevel(level: string): void;
    /**
     * Log file rotation
     */
    rotateLogs(): void;
    /**
     * Get log statistics
     */
    getLogStats(): any;
}
//# sourceMappingURL=logger.d.ts.map