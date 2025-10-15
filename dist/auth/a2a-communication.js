/**
 * Agent-to-Agent (A2A) Communication Interface
 */
import crypto from 'crypto';
import axios from 'axios';
export class A2ACommunication {
    config;
    logger;
    oauthProvider;
    mTLSProvider;
    httpClient;
    messageQueue;
    activeConnections;
    constructor(config, logger, oauthProvider, mTLSProvider) {
        this.config = config;
        this.logger = logger;
        this.oauthProvider = oauthProvider;
        this.mTLSProvider = mTLSProvider;
        this.messageQueue = new Map();
        this.activeConnections = new Map();
        this.httpClient = axios.create({
            timeout: config.requestTimeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': `${config.agentId}/1.0.0`
            }
        });
        this.setupInterceptors();
    }
    /**
     * Initialize A2A communication with another agent
     */
    async initializeConnection(targetAgentId, securityLevel = 'high') {
        try {
            this.logger.info('Initializing A2A connection', { targetAgentId, securityLevel });
            // Step 1: OAuth 2.0 Authentication
            const oauthToken = await this.authenticateWithAgent(targetAgentId);
            // Step 2: mTLS Handshake (if security level is high)
            let tlsContext = null;
            if (securityLevel === 'high') {
                tlsContext = await this.performTLSHandshake(targetAgentId);
            }
            // Step 3: Establish secure channel
            const connection = {
                targetAgentId,
                oauthToken,
                tlsContext,
                securityLevel,
                establishedAt: new Date(),
                lastActivity: new Date(),
                isActive: true,
                messageCount: 0
            };
            this.activeConnections.set(targetAgentId, connection);
            this.logger.info('A2A connection established', {
                targetAgentId,
                securityLevel,
                hasTLS: !!tlsContext
            });
            return connection;
        }
        catch (error) {
            this.logger.error('Failed to initialize A2A connection', error, { targetAgentId });
            throw error;
        }
    }
    /**
     * Send message to another agent
     */
    async sendMessage(targetAgentId, messageType, payload, options = {}) {
        const connection = this.activeConnections.get(targetAgentId);
        if (!connection || !connection.isActive) {
            throw new Error(`No active connection to agent: ${targetAgentId}`);
        }
        try {
            // Create message
            const message = {
                id: this.generateMessageId(),
                from: this.config.agentId,
                to: targetAgentId,
                type: messageType,
                payload,
                timestamp: new Date(),
                nonce: this.generateNonce(),
                signature: '',
                encryption: options.encrypt || false
            };
            // Sign message
            message.signature = await this.signMessage(message);
            // Encrypt message if requested
            if (message.encryption) {
                message.payload = await this.encryptPayload(message.payload, targetAgentId);
            }
            // Send message
            const response = await this.sendSecureMessage(targetAgentId, message, connection);
            // Update connection activity
            connection.lastActivity = new Date();
            connection.messageCount++;
            this.logger.info('Message sent successfully', {
                messageId: message.id,
                targetAgentId,
                messageType,
                encrypted: message.encryption
            });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to send message', error, {
                targetAgentId,
                messageType
            });
            throw error;
        }
    }
    /**
     * Receive and process incoming message
     */
    async receiveMessage(message) {
        try {
            this.logger.info('Processing incoming message', {
                messageId: message.id,
                from: message.from,
                type: message.type
            });
            // Validate message signature
            const isValidSignature = await this.validateMessageSignature(message);
            if (!isValidSignature) {
                throw new Error('Invalid message signature');
            }
            // Check for replay attacks
            if (this.messageQueue.has(message.id)) {
                throw new Error('Duplicate message detected (replay attack)');
            }
            // Decrypt payload if encrypted
            let payload = message.payload;
            if (message.encryption) {
                payload = await this.decryptPayload(payload, message.from);
            }
            // Process message based on type
            const response = await this.processMessage(message.from, message.type, payload);
            // Store message to prevent replay attacks
            this.messageQueue.set(message.id, message);
            this.logger.info('Message processed successfully', {
                messageId: message.id,
                from: message.from,
                type: message.type
            });
            return response;
        }
        catch (error) {
            this.logger.error('Failed to process message', error, {
                messageId: message.id,
                from: message.from
            });
            throw error;
        }
    }
    /**
     * Authenticate with target agent using OAuth 2.0
     */
    async authenticateWithAgent(targetAgentId) {
        // This is a simplified OAuth flow - in production, implement full OAuth 2.0 flow
        const authRequest = {
            clientId: this.config.agentId,
            redirectUri: `${this.config.baseUrl}/oauth/callback`,
            scope: ['read', 'write'],
            codeVerifier: this.generateCodeVerifier()
        };
        const authUrl = this.oauthProvider.generateAuthorizationUrl(authRequest);
        // In a real implementation, this would involve user interaction
        // For A2A, we'll simulate the authorization code exchange
        const mockAuthCode = 'mock_auth_code_' + crypto.randomBytes(16).toString('hex');
        const tokenResponse = await this.oauthProvider.exchangeCodeForToken(mockAuthCode, this.config.agentId, this.config.clientSecret, authRequest.redirectUri, authRequest.codeVerifier);
        return tokenResponse.access_token;
    }
    /**
     * Perform TLS handshake for mTLS
     */
    async performTLSHandshake(targetAgentId) {
        // Get or issue certificate for this agent
        const agentCert = await this.mTLSProvider.issueAgentCertificate(this.config.agentId, {
            name: this.config.agentName,
            organization: this.config.organization
        });
        // Create TLS context
        const tlsContext = this.mTLSProvider.createTLSContext(agentCert);
        // Validate target agent's certificate
        const targetCert = await this.getTargetAgentCertificate(targetAgentId);
        const isValid = await this.mTLSProvider.validateAgentCertificate(targetCert, targetAgentId);
        if (!isValid) {
            throw new Error(`Invalid certificate for agent: ${targetAgentId}`);
        }
        return tlsContext;
    }
    /**
     * Send secure message to target agent
     */
    async sendSecureMessage(targetAgentId, message, connection) {
        const requestConfig = {
            method: 'POST',
            url: `${this.config.baseUrl}/api/v1/a2a/message`,
            data: message,
            headers: {
                'Authorization': `Bearer ${connection.oauthToken}`,
                'X-Agent-ID': this.config.agentId,
                'X-Message-ID': message.id,
                'X-Nonce': message.nonce
            }
        };
        // Add TLS context if available
        if (connection.tlsContext) {
            requestConfig.httpsAgent = connection.tlsContext;
        }
        const response = await this.httpClient.request(requestConfig);
        return response.data;
    }
    /**
     * Process incoming message
     */
    async processMessage(from, type, payload) {
        switch (type) {
            case 'payment_request':
                return await this.handlePaymentRequest(from, payload);
            case 'payment_response':
                return await this.handlePaymentResponse(from, payload);
            case 'customer_query':
                return await this.handleCustomerQuery(from, payload);
            case 'webhook_notification':
                return await this.handleWebhookNotification(from, payload);
            case 'health_check':
                return await this.handleHealthCheck(from, payload);
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    }
    /**
     * Handle payment request message
     */
    async handlePaymentRequest(from, payload) {
        // Implement payment request handling logic
        return {
            success: true,
            messageId: this.generateMessageId(),
            payload: { status: 'received', processedAt: new Date() },
            timestamp: new Date()
        };
    }
    /**
     * Handle payment response message
     */
    async handlePaymentResponse(from, payload) {
        // Implement payment response handling logic
        return {
            success: true,
            messageId: this.generateMessageId(),
            payload: { status: 'processed', processedAt: new Date() },
            timestamp: new Date()
        };
    }
    /**
     * Handle customer query message
     */
    async handleCustomerQuery(from, payload) {
        // Implement customer query handling logic
        return {
            success: true,
            messageId: this.generateMessageId(),
            payload: { status: 'query_processed', processedAt: new Date() },
            timestamp: new Date()
        };
    }
    /**
     * Handle webhook notification message
     */
    async handleWebhookNotification(from, payload) {
        // Implement webhook notification handling logic
        return {
            success: true,
            messageId: this.generateMessageId(),
            payload: { status: 'webhook_processed', processedAt: new Date() },
            timestamp: new Date()
        };
    }
    /**
     * Handle health check message
     */
    async handleHealthCheck(from, payload) {
        return {
            success: true,
            messageId: this.generateMessageId(),
            payload: {
                status: 'healthy',
                timestamp: new Date(),
                agentId: this.config.agentId,
                uptime: process.uptime()
            },
            timestamp: new Date()
        };
    }
    /**
     * Sign message for integrity verification
     */
    async signMessage(message) {
        const messageData = {
            id: message.id,
            from: message.from,
            to: message.to,
            type: message.type,
            payload: message.payload,
            timestamp: message.timestamp,
            nonce: message.nonce
        };
        const messageString = JSON.stringify(messageData);
        const signature = crypto
            .createHmac('sha256', this.config.signingKey)
            .update(messageString)
            .digest('hex');
        return signature;
    }
    /**
     * Validate message signature
     */
    async validateMessageSignature(message) {
        // In a real implementation, you would validate the signature using the sender's public key
        // For now, we'll do a simple validation
        return message.signature.length > 0;
    }
    /**
     * Encrypt payload
     */
    async encryptPayload(payload, targetAgentId) {
        const payloadString = JSON.stringify(payload);
        const cipher = crypto.createCipher('aes-256-gcm', this.config.encryptionKey);
        let encrypted = cipher.update(payloadString, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        return JSON.stringify({
            encrypted,
            authTag: authTag.toString('hex'),
            targetAgentId
        });
    }
    /**
     * Decrypt payload
     */
    async decryptPayload(encryptedPayload, fromAgentId) {
        const { encrypted, authTag } = JSON.parse(encryptedPayload);
        const decipher = crypto.createDecipher('aes-256-gcm', this.config.encryptionKey);
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
    /**
     * Get target agent's certificate
     */
    async getTargetAgentCertificate(targetAgentId) {
        // In a real implementation, this would fetch the certificate from a certificate store
        // or from the agent directly
        return 'mock_certificate_' + targetAgentId;
    }
    /**
     * Setup HTTP interceptors
     */
    setupInterceptors() {
        this.httpClient.interceptors.request.use((config) => {
            this.logger.debug('A2A request', {
                method: config.method,
                url: config.url,
                headers: config.headers
            });
            return config;
        }, (error) => {
            this.logger.error('A2A request error', error);
            return Promise.reject(error);
        });
        this.httpClient.interceptors.response.use((response) => {
            this.logger.debug('A2A response', {
                status: response.status,
                data: response.data
            });
            return response;
        }, (error) => {
            this.logger.error('A2A response error', error);
            return Promise.reject(error);
        });
    }
    /**
     * Generate message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
    /**
     * Generate nonce for replay attack prevention
     */
    generateNonce() {
        return crypto.randomBytes(16).toString('hex');
    }
    /**
     * Generate code verifier for PKCE
     */
    generateCodeVerifier() {
        return crypto.randomBytes(32).toString('base64url');
    }
    /**
     * Close connection to target agent
     */
    async closeConnection(targetAgentId) {
        const connection = this.activeConnections.get(targetAgentId);
        if (connection) {
            connection.isActive = false;
            this.activeConnections.delete(targetAgentId);
            this.logger.info('A2A connection closed', { targetAgentId });
        }
    }
    /**
     * Get connection status
     */
    getConnectionStatus(targetAgentId) {
        const connection = this.activeConnections.get(targetAgentId);
        if (!connection) {
            return null;
        }
        return {
            targetAgentId,
            isActive: connection.isActive,
            securityLevel: connection.securityLevel,
            establishedAt: connection.establishedAt,
            lastActivity: connection.lastActivity,
            messageCount: connection.messageCount,
            hasTLS: !!connection.tlsContext
        };
    }
    /**
     * List all active connections
     */
    listConnections() {
        return Array.from(this.activeConnections.values()).map(conn => this.getConnectionStatus(conn.targetAgentId));
    }
}
//# sourceMappingURL=a2a-communication.js.map