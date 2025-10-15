/**
 * Mutual TLS (mTLS) Implementation for Agent-to-Agent Communication
 */
import tls from 'tls';
import { Logger } from '../utils/logger';
import { AgentCertificate, mTLSConfig } from '../types/auth';
export declare class MutualTLSProvider {
    private config;
    private logger;
    private certificateStore;
    private ca;
    constructor(config: mTLSConfig, logger: Logger);
    /**
     * Initialize Certificate Authority
     */
    private initializeCertificateAuthority;
    /**
     * Generate CA Certificate
     */
    private generateCACertificate;
    /**
     * Issue certificate for agent
     */
    issueAgentCertificate(agentId: string, agentInfo: AgentInfo): Promise<AgentCertificate>;
    /**
     * Generate agent certificate
     */
    private generateAgentCertificate;
    /**
     * Validate agent certificate
     */
    validateAgentCertificate(certificate: string, agentId: string): Promise<boolean>;
    /**
     * Create TLS context for mTLS
     */
    createTLSContext(agentCert: AgentCertificate): tls.SecureContext;
    /**
     * Revoke agent certificate
     */
    revokeAgentCertificate(agentId: string): Promise<void>;
    /**
     * Get certificate status
     */
    getCertificateStatus(agentId: string): CertificateStatus | null;
    /**
     * List all issued certificates
     */
    listCertificates(): CertificateStatus[];
}
interface AgentInfo {
    name: string;
    organization?: string;
    email?: string;
    description?: string;
}
interface CertificateStatus {
    agentId: string;
    serialNumber: string;
    issuedAt: Date;
    expiresAt: Date;
    isExpired: boolean;
    expiresIn: number;
    status: 'valid' | 'expiring_soon' | 'expired';
}
export {};
//# sourceMappingURL=mutual-tls.d.ts.map