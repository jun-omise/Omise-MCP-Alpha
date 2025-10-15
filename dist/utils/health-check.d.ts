/**
 * Health Check Implementation
 */
import { Request, Response } from 'express';
import { OmiseClient } from './omise-client';
import { Logger } from './logger';
import { ServerConfig } from '../types/mcp';
export interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: {
        database: HealthCheckItem;
        omise_api: HealthCheckItem;
        memory: HealthCheckItem;
        disk: HealthCheckItem;
    };
}
export interface HealthCheckItem {
    status: 'pass' | 'fail' | 'warn';
    responseTime?: number;
    message?: string;
    details?: any;
}
export declare class HealthChecker {
    private omiseClient;
    private logger;
    private config;
    private startTime;
    constructor(omiseClient: OmiseClient, logger: Logger, config: ServerConfig);
    /**
     * Execute Health Check
     */
    checkHealth(): Promise<HealthCheckResult>;
    /**
     * Database (Redis) Health Check
     */
    private checkDatabase;
    /**
     * Omise API Health Check
     */
    private checkOmiseApi;
    /**
     * Memory Usage Health Check
     */
    private checkMemory;
    /**
     * Disk Usage Health Check
     */
    private checkDisk;
    /**
     * Convert Promise.allSettled results to HealthCheckItem
     */
    private getCheckResult;
    /**
     * Response for Health Check Endpoint
     */
    getHealthResponse(req: Request, res: Response): Promise<void>;
    /**
     * Liveness Check (Simple Survival Confirmation)
     */
    getLivenessResponse(req: Request, res: Response): void;
    /**
     * Readiness Check (Service Start Preparation Completion Confirmation)
     */
    getReadinessResponse(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=health-check.d.ts.map