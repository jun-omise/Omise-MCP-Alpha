/**
 * A2A Authentication Service - Main Integration Point
 */
import { Logger } from '../utils/logger';
import { SecurityLevel, MessageType, AuthenticationResult, HealthCheckResult } from '../types/auth';
export declare class A2AAuthService {
    private config;
    private logger;
    private oauthProvider;
    private mTLSProvider;
    private a2aCommunication;
    private securityPolicy;
    private auditLog;
    private rateLimitStore;
    constructor(config: A2AServiceConfig, logger: Logger);
    /**
     * Register a new agent for A2A communication
     */
    registerAgent(agentInfo: AgentRegistrationInfo): Promise<AgentRegistrationResult>;
    /**
     * Authenticate agent for A2A communication
     */
    authenticateAgent(clientId: string, clientSecret: string, securityLevel?: SecurityLevel): Promise<AuthenticationResult>;
    /**
     * Establish secure A2A communication channel
     */
    establishSecureChannel(targetAgentId: string, securityLevel?: SecurityLevel): Promise<SecureChannelResult>;
    /**
     * Send secure message to another agent
     */
    sendSecureMessage(targetAgentId: string, messageType: MessageType, payload: any, options?: MessageSendOptions): Promise<MessageSendResult>;
    /**
     * Perform health check on target agent
     */
    performHealthCheck(targetAgentId: string): Promise<HealthCheckResult>;
    /**
     * Get security metrics
     */
    getSecurityMetrics(): SecurityMetrics;
    /**
     * Validate agent information
     */
    private validateAgentInfo;
    /**
     * Validate security policy compliance
     */
    private validateSecurityPolicy;
    /**
     * Check rate limiting
     */
    private isRateLimited;
    /**
     * Log audit event
     */
    private logAuditEvent;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Generate audit ID
     */
    private generateAuditId;
}
interface A2AServiceConfig {
    agentId: string;
    agentName: string;
    organization?: string;
    baseUrl: string;
    oauth: {
        enabled: boolean;
        clientSecret: string;
        accessTokenExpiry: number;
        refreshTokenExpiry: number;
        authorizationCodeExpiry: number;
        jwtSecret: string;
    };
    mtls: {
        enabled: boolean;
        certPath: string;
        certificateValidityDays: number;
        keySize: number;
    };
    security: {
        level: SecurityLevel;
        requireMFA: boolean;
        maxSessionDuration: number;
        allowedIPs: string[];
        allowedUserAgents: string[];
        rateLimitPerMinute: number;
        encryptionRequired: boolean;
        signingKey: string;
        encryptionKey: string;
        auditLogging: boolean;
    };
    communication: {
        requestTimeout: number;
        maxRetries: number;
        retryDelay: number;
    };
}
interface AgentRegistrationInfo {
    name: string;
    organization?: string;
    email?: string;
    description?: string;
    redirectUris: string[];
    scopes?: string[];
    grantTypes?: string[];
}
interface AgentRegistrationResult {
    success: boolean;
    agentId: string;
    clientSecret: string;
    certificate?: AgentCertificate;
    oauthConfig: {
        authorizationEndpoint: string;
        tokenEndpoint: string;
        clientId: string;
    };
}
interface SecureChannelResult {
    success: boolean;
    targetAgentId: string;
    securityLevel: SecurityLevel;
    connectionId: string;
    hasTLS: boolean;
    healthStatus: string;
    establishedAt: Date;
}
interface MessageSendOptions {
    encrypt?: boolean;
    priority?: 'low' | 'normal' | 'high';
    timeout?: number;
}
interface MessageSendResult {
    success: boolean;
    messageId: string;
    targetAgentId: string;
    timestamp: Date;
    encrypted: boolean;
}
interface SecurityMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    blockedRequests: number;
    averageResponseTime: number;
    topErrorCodes: Array<{
        code: number;
        count: number;
    }>;
    topAgents: Array<{
        agentId: string;
        requestCount: number;
    }>;
    securityEvents: Array<{
        type: string;
        count: number;
        lastOccurrence: Date;
    }>;
}
export {};
//# sourceMappingURL=a2a-auth-service.d.ts.map