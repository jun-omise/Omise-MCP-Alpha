/**
 * A2A Authentication Service - Main Integration Point
 */
import { OAuth2Provider } from './oauth2-provider';
import { MutualTLSProvider } from './mutual-tls';
import { A2ACommunication } from './a2a-communication';
export class A2AAuthService {
    config;
    logger;
    oauthProvider;
    mTLSProvider;
    a2aCommunication;
    securityPolicy;
    auditLog;
    rateLimitStore;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.auditLog = [];
        this.rateLimitStore = new Map();
        // Initialize security policy
        this.securityPolicy = {
            requireMFA: config.security.requireMFA,
            maxSessionDuration: config.security.maxSessionDuration,
            allowedIPs: config.security.allowedIPs,
            allowedUserAgents: config.security.allowedUserAgents,
            rateLimitPerMinute: config.security.rateLimitPerMinute,
            encryptionRequired: config.security.encryptionRequired,
            auditLogging: config.security.auditLogging
        };
        // Initialize OAuth provider
        const oauthConfig = {
            authorizationEndpoint: `${config.baseUrl}/oauth/authorize`,
            tokenEndpoint: `${config.baseUrl}/oauth/token`,
            accessTokenExpiry: config.oauth.accessTokenExpiry,
            refreshTokenExpiry: config.oauth.refreshTokenExpiry,
            authorizationCodeExpiry: config.oauth.authorizationCodeExpiry,
            jwtSecret: config.oauth.jwtSecret
        };
        this.oauthProvider = new OAuth2Provider(oauthConfig, logger);
        // Initialize mTLS provider
        const mTLSConfig = {
            certPath: config.mtls.certPath,
            certificateValidityDays: config.mtls.certificateValidityDays,
            keySize: config.mtls.keySize
        };
        this.mTLSProvider = new MutualTLSProvider(mTLSConfig, logger);
        // Initialize A2A communication
        const commConfig = {
            agentId: config.agentId,
            agentName: config.agentName,
            organization: config.organization,
            baseUrl: config.baseUrl,
            clientSecret: config.oauth.clientSecret,
            signingKey: config.security.signingKey,
            encryptionKey: config.security.encryptionKey,
            requestTimeout: config.communication.requestTimeout,
            maxRetries: config.communication.maxRetries,
            retryDelay: config.communication.retryDelay
        };
        this.a2aCommunication = new A2ACommunication(commConfig, logger, this.oauthProvider, this.mTLSProvider);
        this.logger.info('A2A Authentication Service initialized', {
            agentId: config.agentId,
            securityLevel: config.security.level,
            mTLSEnabled: config.mtls.enabled,
            oauthEnabled: config.oauth.enabled
        });
    }
    /**
     * Register a new agent for A2A communication
     */
    async registerAgent(agentInfo) {
        try {
            this.logger.info('Registering new agent', { name: agentInfo.name });
            // Validate agent information
            this.validateAgentInfo(agentInfo);
            // Register OAuth client
            const oauthClient = await this.oauthProvider.registerClient({
                name: agentInfo.name,
                redirectUris: agentInfo.redirectUris,
                scopes: agentInfo.scopes,
                grantTypes: agentInfo.grantTypes
            });
            // Issue mTLS certificate if enabled
            let agentCertificate = null;
            if (this.config.mtls.enabled) {
                agentCertificate = await this.mTLSProvider.issueAgentCertificate(oauthClient.clientId, {
                    name: agentInfo.name,
                    organization: agentInfo.organization,
                    email: agentInfo.email,
                    description: agentInfo.description
                });
            }
            // Log registration
            this.logAuditEvent({
                agentId: oauthClient.clientId,
                action: 'agent_registered',
                resource: 'agent',
                success: true,
                details: { name: agentInfo.name, hasCertificate: !!agentCertificate }
            });
            const result = {
                success: true,
                agentId: oauthClient.clientId,
                clientSecret: oauthClient.clientSecret,
                certificate: agentCertificate,
                oauthConfig: {
                    authorizationEndpoint: this.config.baseUrl + '/oauth/authorize',
                    tokenEndpoint: this.config.baseUrl + '/oauth/token',
                    clientId: oauthClient.clientId
                }
            };
            this.logger.info('Agent registered successfully', {
                agentId: oauthClient.clientId,
                name: agentInfo.name
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to register agent', error, { name: agentInfo.name });
            this.logAuditEvent({
                agentId: 'unknown',
                action: 'agent_registration_failed',
                resource: 'agent',
                success: false,
                details: { error: error.message }
            });
            throw error;
        }
    }
    /**
     * Authenticate agent for A2A communication
     */
    async authenticateAgent(clientId, clientSecret, securityLevel = 'standard') {
        try {
            this.logger.info('Authenticating agent', { clientId, securityLevel });
            // Check rate limiting
            if (this.isRateLimited(clientId)) {
                throw new Error('Rate limit exceeded');
            }
            // Validate OAuth credentials
            const tokenResponse = await this.oauthProvider.exchangeCodeForToken('mock_code', // In real implementation, this would be from OAuth flow
            clientId, clientSecret, 'http://localhost/callback', 'mock_verifier');
            // Validate agent identity
            const agentIdentity = await this.oauthProvider.validateToken(tokenResponse.access_token);
            // Check security policy compliance
            this.validateSecurityPolicy(agentIdentity, securityLevel);
            // Log successful authentication
            this.logAuditEvent({
                agentId: clientId,
                action: 'authentication_success',
                resource: 'auth',
                success: true,
                details: { securityLevel, scopes: agentIdentity.scopes }
            });
            const result = {
                success: true,
                agentIdentity,
                sessionId: this.generateSessionId()
            };
            this.logger.info('Agent authenticated successfully', {
                agentId,
                securityLevel,
                scopes: agentIdentity.scopes
            });
            return result;
        }
        catch (error) {
            this.logger.error('Agent authentication failed', error, { clientId });
            this.logAuditEvent({
                agentId: clientId,
                action: 'authentication_failed',
                resource: 'auth',
                success: false,
                details: { error: error.message }
            });
            return {
                success: false,
                error: error.message
            };
        }
    }
    /**
     * Establish secure A2A communication channel
     */
    async establishSecureChannel(targetAgentId, securityLevel = 'standard') {
        try {
            this.logger.info('Establishing secure channel', { targetAgentId, securityLevel });
            // Initialize connection
            const connection = await this.a2aCommunication.initializeConnection(targetAgentId, securityLevel);
            // Perform health check
            const healthCheck = await this.performHealthCheck(targetAgentId);
            const result = {
                success: true,
                targetAgentId,
                securityLevel,
                connectionId: connection.targetAgentId,
                hasTLS: !!connection.tlsContext,
                healthStatus: healthCheck.status,
                establishedAt: connection.establishedAt
            };
            this.logger.info('Secure channel established', {
                targetAgentId,
                securityLevel,
                hasTLS: result.hasTLS
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to establish secure channel', error, { targetAgentId });
            throw error;
        }
    }
    /**
     * Send secure message to another agent
     */
    async sendSecureMessage(targetAgentId, messageType, payload, options = {}) {
        try {
            this.logger.info('Sending secure message', {
                targetAgentId,
                messageType,
                encrypted: options.encrypt
            });
            // Check rate limiting
            if (this.isRateLimited(targetAgentId)) {
                throw new Error('Rate limit exceeded for target agent');
            }
            // Send message
            const response = await this.a2aCommunication.sendMessage(targetAgentId, messageType, payload, {
                encrypt: options.encrypt || this.securityPolicy.encryptionRequired,
                priority: options.priority,
                timeout: options.timeout
            });
            // Log message
            this.logAuditEvent({
                agentId: this.config.agentId,
                action: 'message_sent',
                resource: 'communication',
                success: true,
                details: {
                    targetAgentId,
                    messageType,
                    encrypted: options.encrypt,
                    messageId: response.messageId
                }
            });
            const result = {
                success: true,
                messageId: response.messageId,
                targetAgentId,
                timestamp: response.timestamp,
                encrypted: options.encrypt || this.securityPolicy.encryptionRequired
            };
            this.logger.info('Secure message sent successfully', {
                messageId: result.messageId,
                targetAgentId,
                encrypted: result.encrypted
            });
            return result;
        }
        catch (error) {
            this.logger.error('Failed to send secure message', error, {
                targetAgentId,
                messageType
            });
            this.logAuditEvent({
                agentId: this.config.agentId,
                action: 'message_send_failed',
                resource: 'communication',
                success: false,
                details: {
                    targetAgentId,
                    messageType,
                    error: error.message
                }
            });
            throw error;
        }
    }
    /**
     * Perform health check on target agent
     */
    async performHealthCheck(targetAgentId) {
        try {
            const startTime = Date.now();
            const response = await this.a2aCommunication.sendMessage(targetAgentId, 'health_check', { timestamp: new Date() }, { encrypt: false });
            const responseTime = Date.now() - startTime;
            const status = response.success ? 'healthy' : 'unhealthy';
            return {
                service: targetAgentId,
                status,
                responseTime,
                lastCheck: new Date(),
                details: response.payload
            };
        }
        catch (error) {
            this.logger.error('Health check failed', error, { targetAgentId });
            return {
                service: targetAgentId,
                status: 'unhealthy',
                responseTime: 0,
                lastCheck: new Date(),
                details: { error: error.message }
            };
        }
    }
    /**
     * Get security metrics
     */
    getSecurityMetrics() {
        const totalRequests = this.auditLog.length;
        const successfulRequests = this.auditLog.filter(log => log.success).length;
        const failedRequests = totalRequests - successfulRequests;
        const blockedRequests = this.auditLog.filter(log => log.action.includes('blocked') || log.action.includes('rate_limit')).length;
        const errorCodes = this.auditLog
            .filter(log => !log.success)
            .reduce((acc, log) => {
            const code = log.details?.statusCode || 'unknown';
            acc[code] = (acc[code] || 0) + 1;
            return acc;
        }, {});
        const topErrorCodes = Object.entries(errorCodes)
            .map(([code, count]) => ({ code: parseInt(code) || 0, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        const agentRequests = this.auditLog.reduce((acc, log) => {
            acc[log.agentId] = (acc[log.agentId] || 0) + 1;
            return acc;
        }, {});
        const topAgents = Object.entries(agentRequests)
            .map(([agentId, requestCount]) => ({ agentId, requestCount }))
            .sort((a, b) => b.requestCount - a.requestCount)
            .slice(0, 10);
        const securityEvents = this.auditLog
            .filter(log => log.action.includes('security') || log.action.includes('auth'))
            .reduce((acc, log) => {
            const type = log.action;
            if (!acc[type]) {
                acc[type] = { count: 0, lastOccurrence: log.timestamp };
            }
            acc[type].count++;
            if (log.timestamp > acc[type].lastOccurrence) {
                acc[type].lastOccurrence = log.timestamp;
            }
            return acc;
        }, {});
        const securityEventsArray = Object.entries(securityEvents)
            .map(([type, data]) => ({ type, count: data.count, lastOccurrence: data.lastOccurrence }));
        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            blockedRequests,
            averageResponseTime: 0, // Would need to track this separately
            topErrorCodes,
            topAgents,
            securityEvents: securityEventsArray
        };
    }
    /**
     * Validate agent information
     */
    validateAgentInfo(agentInfo) {
        if (!agentInfo.name || agentInfo.name.trim().length === 0) {
            throw new Error('Agent name is required');
        }
        if (!agentInfo.redirectUris || agentInfo.redirectUris.length === 0) {
            throw new Error('At least one redirect URI is required');
        }
        // Validate redirect URIs
        for (const uri of agentInfo.redirectUris) {
            try {
                new URL(uri);
            }
            catch {
                throw new Error(`Invalid redirect URI: ${uri}`);
            }
        }
        // Validate scopes
        const allowedScopes = ['read', 'write', 'admin'];
        if (agentInfo.scopes) {
            for (const scope of agentInfo.scopes) {
                if (!allowedScopes.includes(scope)) {
                    throw new Error(`Invalid scope: ${scope}`);
                }
            }
        }
    }
    /**
     * Validate security policy compliance
     */
    validateSecurityPolicy(agentIdentity, securityLevel) {
        // Check if encryption is required for high security level
        if (securityLevel === 'high' && !this.config.mtls.enabled) {
            throw new Error('mTLS is required for high security level');
        }
        // Check scopes
        if (securityLevel === 'high' && !agentIdentity.scopes.includes('admin')) {
            throw new Error('Admin scope required for high security level');
        }
    }
    /**
     * Check rate limiting
     */
    isRateLimited(agentId) {
        const now = new Date();
        const rateLimitInfo = this.rateLimitStore.get(agentId);
        if (!rateLimitInfo) {
            this.rateLimitStore.set(agentId, {
                agentId,
                requestsPerMinute: 1,
                requestsPerHour: 1,
                requestsPerDay: 1,
                resetTime: new Date(now.getTime() + 60000),
                isBlocked: false
            });
            return false;
        }
        if (now > rateLimitInfo.resetTime) {
            // Reset rate limit
            rateLimitInfo.requestsPerMinute = 1;
            rateLimitInfo.resetTime = new Date(now.getTime() + 60000);
            rateLimitInfo.isBlocked = false;
            return false;
        }
        if (rateLimitInfo.requestsPerMinute >= this.securityPolicy.rateLimitPerMinute) {
            rateLimitInfo.isBlocked = true;
            return true;
        }
        rateLimitInfo.requestsPerMinute++;
        return false;
    }
    /**
     * Log audit event
     */
    logAuditEvent(event) {
        if (!this.securityPolicy.auditLogging) {
            return;
        }
        const auditEntry = {
            id: this.generateAuditId(),
            timestamp: new Date(),
            ...event
        };
        this.auditLog.push(auditEntry);
        // Keep only last 10000 entries
        if (this.auditLog.length > 10000) {
            this.auditLog = this.auditLog.slice(-10000);
        }
    }
    /**
     * Generate session ID
     */
    generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate audit ID
     */
    generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=a2a-auth-service.js.map