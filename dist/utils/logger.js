/**
 * Logging Configuration and Utilities
 */
import winston from 'winston';
export class Logger {
    logger;
    config;
    constructor(config) {
        this.config = config;
        this.logger = this.createLogger();
    }
    createLogger() {
        const transports = [];
        // Console output
        transports.push(new winston.transports.Console({
            level: this.config.logging.level,
            format: this.getConsoleFormat()
        }));
        // File output (production environment)
        if (this.config.omise.environment === 'production') {
            // Error log
            transports.push(new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: this.getFileFormat(),
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5
            }));
            // All logs
            transports.push(new winston.transports.File({
                filename: 'logs/combined.log',
                format: this.getFileFormat(),
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 10
            }));
            // Access log
            if (this.config.logging.enableRequestLogging) {
                transports.push(new winston.transports.File({
                    filename: 'logs/access.log',
                    level: 'info',
                    format: this.getFileFormat(),
                    maxsize: 100 * 1024 * 1024, // 100MB
                    maxFiles: 5
                }));
            }
        }
        return winston.createLogger({
            level: this.config.logging.level,
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
            transports,
            exitOnError: false
        });
    }
    getConsoleFormat() {
        if (this.config.logging.format === 'json') {
            return winston.format.combine(winston.format.timestamp(), winston.format.json());
        }
        else {
            return winston.format.combine(winston.format.colorize(), winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, ...meta }) => {
                let log = `${timestamp} [${level}]: ${message}`;
                if (Object.keys(meta).length > 0) {
                    log += ` ${JSON.stringify(meta)}`;
                }
                return log;
            }));
        }
    }
    getFileFormat() {
        return winston.format.combine(winston.format.timestamp(), winston.format.json());
    }
    // ============================================================================
    // Log Methods
    // ============================================================================
    info(message, ...meta) {
        this.logger.info(message, ...meta);
    }
    warn(message, ...meta) {
        this.logger.warn(message, ...meta);
    }
    error(message, error, ...meta) {
        this.logger.error(message, {
            ...meta,
            error: error.message,
            stack: error.stack
        });
    }
    debug(message, ...meta) {
        this.logger.debug(message, ...meta);
    }
    // ============================================================================
    // Structured Log Methods
    // ============================================================================
    /**
     * API Request Log
     */
    logRequest(method, url, headers, body) {
        if (this.config.logging.enableRequestLogging) {
            this.logger.info('API Request', {
                type: 'request',
                method,
                url,
                headers: this.sanitizeHeaders(headers),
                body: this.sanitizeBody(body),
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * API Response Log
     */
    logResponse(method, url, status, headers, body, duration) {
        if (this.config.logging.enableResponseLogging) {
            this.logger.info('API Response', {
                type: 'response',
                method,
                url,
                status,
                headers: this.sanitizeHeaders(headers),
                body: this.sanitizeBody(body),
                duration,
                timestamp: new Date().toISOString()
            });
        }
    }
    /**
     * Error Log
     */
    logError(error, context) {
        this.logger.error('Application Error', {
            type: 'error',
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Security Log
     */
    logSecurity(event, details) {
        this.logger.warn('Security Event', {
            type: 'security',
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Performance Log
     */
    logPerformance(operation, duration, details) {
        this.logger.info('Performance Metric', {
            type: 'performance',
            operation,
            duration,
            details,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Business Log
     */
    logBusiness(event, details) {
        this.logger.info('Business Event', {
            type: 'business',
            event,
            details,
            timestamp: new Date().toISOString()
        });
    }
    // ============================================================================
    // Utility Methods
    // ============================================================================
    /**
     * Mask sensitive information in headers
     */
    sanitizeHeaders(headers) {
        if (!headers)
            return headers;
        const sensitiveHeaders = ['authorization', 'x-api-key', 'cookie', 'x-auth-token'];
        const sanitized = { ...headers };
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        return sanitized;
    }
    /**
     * Mask sensitive information in body
     */
    sanitizeBody(body) {
        if (!body)
            return body;
        const sensitiveFields = ['password', 'secret', 'token', 'key', 'card_number', 'cvv'];
        const sanitized = JSON.parse(JSON.stringify(body));
        const sanitizeObject = (obj) => {
            if (typeof obj !== 'object' || obj === null)
                return obj;
            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    result[key] = '[REDACTED]';
                }
                else if (typeof value === 'object' && value !== null) {
                    result[key] = sanitizeObject(value);
                }
                else {
                    result[key] = value;
                }
            }
            return result;
        };
        return sanitizeObject(sanitized);
    }
    /**
     * Dynamic log level change
     */
    setLevel(level) {
        this.logger.level = level;
    }
    /**
     * Log file rotation
     */
    rotateLogs() {
        // Log rotation implementation
        this.logger.info('Log rotation initiated');
    }
    /**
     * Get log statistics
     */
    getLogStats() {
        return {
            level: this.logger.level,
            transports: this.logger.transports.length,
            timestamp: new Date().toISOString()
        };
    }
}
//# sourceMappingURL=logger.js.map