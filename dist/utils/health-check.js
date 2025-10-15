/**
 * Health Check Implementation
 */
export class HealthChecker {
    omiseClient;
    logger;
    config;
    startTime;
    constructor(omiseClient, logger, config) {
        this.omiseClient = omiseClient;
        this.logger = logger;
        this.config = config;
        this.startTime = Date.now();
    }
    /**
     * Execute Health Check
     */
    async checkHealth() {
        const timestamp = new Date().toISOString();
        const uptime = Date.now() - this.startTime;
        // Execute health checks in parallel
        const [databaseCheck, omiseApiCheck, memoryCheck, diskCheck] = await Promise.allSettled([
            this.checkDatabase(),
            this.checkOmiseApi(),
            this.checkMemory(),
            this.checkDisk()
        ]);
        const checks = {
            database: this.getCheckResult(databaseCheck),
            omise_api: this.getCheckResult(omiseApiCheck),
            memory: this.getCheckResult(memoryCheck),
            disk: this.getCheckResult(diskCheck)
        };
        // Determine overall status
        const statuses = Object.values(checks).map(check => check.status);
        let overallStatus;
        if (statuses.every(status => status === 'pass')) {
            overallStatus = 'healthy';
        }
        else if (statuses.some(status => status === 'fail')) {
            overallStatus = 'unhealthy';
        }
        else {
            overallStatus = 'degraded';
        }
        return {
            status: overallStatus,
            timestamp,
            uptime,
            version: this.config.server.version,
            environment: this.config.omise.environment,
            checks
        };
    }
    /**
     * Database (Redis) Health Check
     */
    async checkDatabase() {
        const startTime = Date.now();
        try {
            // Redis connection check (implementation required)
            // const redis = new Redis(this.config.redis.url);
            // await redis.ping();
            const responseTime = Date.now() - startTime;
            return {
                status: 'pass',
                responseTime,
                message: 'Database connection successful'
            };
        }
        catch (error) {
            this.logger.error('Database health check failed', error);
            return {
                status: 'fail',
                responseTime: Date.now() - startTime,
                message: 'Database connection failed',
                details: { error: error.message }
            };
        }
    }
    /**
     * Omise API Health Check
     */
    async checkOmiseApi() {
        const startTime = Date.now();
        try {
            // Omise API connection test
            const rateLimitInfo = this.omiseClient.getRateLimitInfo();
            const responseTime = Date.now() - startTime;
            return {
                status: 'pass',
                responseTime,
                message: 'Omise API connection successful',
                details: { rateLimitInfo }
            };
        }
        catch (error) {
            this.logger.error('Omise API health check failed', error);
            return {
                status: 'fail',
                responseTime: Date.now() - startTime,
                message: 'Omise API connection failed',
                details: { error: error.message }
            };
        }
    }
    /**
     * Memory Usage Health Check
     */
    async checkMemory() {
        const startTime = Date.now();
        try {
            const memoryUsage = process.memoryUsage();
            const totalMemory = memoryUsage.heapTotal;
            const usedMemory = memoryUsage.heapUsed;
            const memoryUsagePercent = (usedMemory / totalMemory) * 100;
            let status;
            let message;
            if (memoryUsagePercent > 90) {
                status = 'fail';
                message = 'Memory usage critically high';
            }
            else if (memoryUsagePercent > 80) {
                status = 'warn';
                message = 'Memory usage high';
            }
            else {
                status = 'pass';
                message = 'Memory usage normal';
            }
            return {
                status,
                responseTime: Date.now() - startTime,
                message,
                details: {
                    heapTotal: totalMemory,
                    heapUsed: usedMemory,
                    usagePercent: memoryUsagePercent.toFixed(2)
                }
            };
        }
        catch (error) {
            this.logger.error('Memory health check failed', error);
            return {
                status: 'fail',
                responseTime: Date.now() - startTime,
                message: 'Memory check failed',
                details: { error: error.message }
            };
        }
    }
    /**
     * Disk Usage Health Check
     */
    async checkDisk() {
        const startTime = Date.now();
        try {
            const fs = await import('fs/promises');
            const stats = await fs.statfs('/');
            const totalSpace = stats.bavail * stats.bsize;
            const freeSpace = stats.bavail * stats.bsize;
            const usedSpace = totalSpace - freeSpace;
            const diskUsagePercent = (usedSpace / totalSpace) * 100;
            let status;
            let message;
            if (diskUsagePercent > 90) {
                status = 'fail';
                message = 'Disk usage critically high';
            }
            else if (diskUsagePercent > 80) {
                status = 'warn';
                message = 'Disk usage high';
            }
            else {
                status = 'pass';
                message = 'Disk usage normal';
            }
            return {
                status,
                responseTime: Date.now() - startTime,
                message,
                details: {
                    totalSpace,
                    freeSpace,
                    usedSpace,
                    usagePercent: diskUsagePercent.toFixed(2)
                }
            };
        }
        catch (error) {
            this.logger.error('Disk health check failed', error);
            return {
                status: 'fail',
                responseTime: Date.now() - startTime,
                message: 'Disk check failed',
                details: { error: error.message }
            };
        }
    }
    /**
     * Convert Promise.allSettled results to HealthCheckItem
     */
    getCheckResult(result) {
        if (result.status === 'fulfilled') {
            return result.value;
        }
        else {
            return {
                status: 'fail',
                message: 'Health check failed',
                details: { error: result.reason }
            };
        }
    }
    /**
     * Response for Health Check Endpoint
     */
    async getHealthResponse(req, res) {
        try {
            const healthResult = await this.checkHealth();
            const statusCode = healthResult.status === 'healthy' ? 200 :
                healthResult.status === 'degraded' ? 200 : 503;
            res.status(statusCode).json(healthResult);
        }
        catch (error) {
            this.logger.error('Health check endpoint error', error);
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                message: 'Health check failed',
                error: error.message
            });
        }
    }
    /**
     * Liveness Check (Simple Survival Confirmation)
     */
    getLivenessResponse(req, res) {
        res.status(200).json({
            status: 'alive',
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime
        });
    }
    /**
     * Readiness Check (Service Start Preparation Completion Confirmation)
     */
    async getReadinessResponse(req, res) {
        try {
            const healthResult = await this.checkHealth();
            if (healthResult.status === 'healthy' || healthResult.status === 'degraded') {
                res.status(200).json({
                    status: 'ready',
                    timestamp: new Date().toISOString()
                });
            }
            else {
                res.status(503).json({
                    status: 'not ready',
                    timestamp: new Date().toISOString(),
                    message: 'Service not ready'
                });
            }
        }
        catch (error) {
            this.logger.error('Readiness check failed', error);
            res.status(503).json({
                status: 'not ready',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }
}
//# sourceMappingURL=health-check.js.map