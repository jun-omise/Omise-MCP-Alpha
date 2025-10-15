/**
 * Agent-to-Agent (A2A) Communication Interface
 */
import { Logger } from '../utils/logger';
import { OAuth2Provider } from './oauth2-provider';
import { MutualTLSProvider } from './mutual-tls';
import { A2AMessage, A2AResponse, CommunicationConfig, MessageType, SecurityLevel } from '../types/auth';
export declare class A2ACommunication {
    private config;
    private logger;
    private oauthProvider;
    private mTLSProvider;
    private httpClient;
    private messageQueue;
    private activeConnections;
    constructor(config: CommunicationConfig, logger: Logger, oauthProvider: OAuth2Provider, mTLSProvider: MutualTLSProvider);
    /**
     * Initialize A2A communication with another agent
     */
    initializeConnection(targetAgentId: string, securityLevel?: SecurityLevel): Promise<AgentConnection>;
    /**
     * Send message to another agent
     */
    sendMessage(targetAgentId: string, messageType: MessageType, payload: any, options?: MessageOptions): Promise<A2AResponse>;
    /**
     * Receive and process incoming message
     */
    receiveMessage(message: A2AMessage): Promise<A2AResponse>;
    /**
     * Authenticate with target agent using OAuth 2.0
     */
    private authenticateWithAgent;
    /**
     * Perform TLS handshake for mTLS
     */
    private performTLSHandshake;
    /**
     * Send secure message to target agent
     */
    private sendSecureMessage;
    /**
     * Process incoming message
     */
    private processMessage;
    /**
     * Handle payment request message
     */
    private handlePaymentRequest;
    /**
     * Handle payment response message
     */
    private handlePaymentResponse;
    /**
     * Handle customer query message
     */
    private handleCustomerQuery;
    /**
     * Handle webhook notification message
     */
    private handleWebhookNotification;
    /**
     * Handle health check message
     */
    private handleHealthCheck;
    /**
     * Sign message for integrity verification
     */
    private signMessage;
    /**
     * Validate message signature
     */
    private validateMessageSignature;
    /**
     * Encrypt payload
     */
    private encryptPayload;
    /**
     * Decrypt payload
     */
    private decryptPayload;
    /**
     * Get target agent's certificate
     */
    private getTargetAgentCertificate;
    /**
     * Setup HTTP interceptors
     */
    private setupInterceptors;
    /**
     * Generate message ID
     */
    private generateMessageId;
    /**
     * Generate nonce for replay attack prevention
     */
    private generateNonce;
    /**
     * Generate code verifier for PKCE
     */
    private generateCodeVerifier;
    /**
     * Close connection to target agent
     */
    closeConnection(targetAgentId: string): Promise<void>;
    /**
     * Get connection status
     */
    getConnectionStatus(targetAgentId: string): ConnectionStatus | null;
    /**
     * List all active connections
     */
    listConnections(): ConnectionStatus[];
}
interface AgentConnection {
    targetAgentId: string;
    oauthToken: string;
    tlsContext: any;
    securityLevel: SecurityLevel;
    establishedAt: Date;
    lastActivity: Date;
    isActive: boolean;
    messageCount: number;
}
interface MessageOptions {
    encrypt?: boolean;
    priority?: 'low' | 'normal' | 'high';
    timeout?: number;
}
interface ConnectionStatus {
    targetAgentId: string;
    isActive: boolean;
    securityLevel: SecurityLevel;
    establishedAt: Date;
    lastActivity: Date;
    messageCount: number;
    hasTLS: boolean;
}
export {};
//# sourceMappingURL=a2a-communication.d.ts.map