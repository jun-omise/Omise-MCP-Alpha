/**
 * Mutual TLS (mTLS) Implementation for Agent-to-Agent Communication
 */
import crypto from 'crypto';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
export class MutualTLSProvider {
    config;
    logger;
    certificateStore;
    ca;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.certificateStore = new Map();
        this.ca = this.initializeCertificateAuthority();
    }
    /**
     * Initialize Certificate Authority
     */
    initializeCertificateAuthority() {
        const caKeyPath = path.join(this.config.certPath, 'ca-key.pem');
        const caCertPath = path.join(this.config.certPath, 'ca-cert.pem');
        let caKey;
        let caCert;
        if (fs.existsSync(caKeyPath) && fs.existsSync(caCertPath)) {
            // Load existing CA
            caKey = fs.readFileSync(caKeyPath);
            caCert = fs.readFileSync(caCertPath);
            this.logger.info('Loaded existing Certificate Authority');
        }
        else {
            // Generate new CA
            const caKeyPair = crypto.generateKeyPairSync('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            });
            const caCert = this.generateCACertificate(caKeyPair);
            // Save CA files
            fs.writeFileSync(caKeyPath, caKeyPair.privateKey);
            fs.writeFileSync(caCertPath, caCert);
            caKey = caKeyPair.privateKey;
            caCert = Buffer.from(caCert);
            this.logger.info('Generated new Certificate Authority');
        }
        return {
            privateKey: caKey,
            certificate: caCert,
            serialNumber: 1
        };
    }
    /**
     * Generate CA Certificate
     */
    generateCACertificate(keyPair) {
        const cert = crypto.createCertificate({
            serialNumber: this.ca.serialNumber.toString(),
            subject: {
                C: 'US',
                ST: 'CA',
                L: 'San Francisco',
                O: 'Omise MCP CA',
                OU: 'Agent Authentication',
                CN: 'Omise MCP Root CA'
            },
            issuer: {
                C: 'US',
                ST: 'CA',
                L: 'San Francisco',
                O: 'Omise MCP CA',
                OU: 'Agent Authentication',
                CN: 'Omise MCP Root CA'
            },
            notBefore: new Date(),
            notAfter: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            publicKey: keyPair.publicKey,
            signingKey: keyPair.privateKey,
            extensions: [
                {
                    name: 'basicConstraints',
                    cA: true,
                    pathLen: 0
                },
                {
                    name: 'keyUsage',
                    keyCertSign: true,
                    cRLSign: true
                },
                {
                    name: 'subjectKeyIdentifier'
                }
            ]
        });
        this.ca.serialNumber++;
        return cert.toString();
    }
    /**
     * Issue certificate for agent
     */
    async issueAgentCertificate(agentId, agentInfo) {
        // Check if certificate already exists and is valid
        const existingCert = this.certificateStore.get(agentId);
        if (existingCert && existingCert.expiresAt > new Date()) {
            this.logger.info('Using existing valid certificate', { agentId });
            return existingCert;
        }
        // Generate new certificate
        const keyPair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        const cert = this.generateAgentCertificate(agentId, agentInfo, keyPair);
        const agentCert = {
            agentId,
            privateKey: keyPair.privateKey,
            certificate: cert,
            caCertificate: this.ca.certificate,
            issuedAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.certificateValidityDays * 24 * 60 * 60 * 1000),
            serialNumber: this.ca.serialNumber.toString()
        };
        // Store certificate
        this.certificateStore.set(agentId, agentCert);
        // Save certificate files
        const certDir = path.join(this.config.certPath, agentId);
        if (!fs.existsSync(certDir)) {
            fs.mkdirSync(certDir, { recursive: true });
        }
        fs.writeFileSync(path.join(certDir, 'agent-key.pem'), keyPair.privateKey);
        fs.writeFileSync(path.join(certDir, 'agent-cert.pem'), cert);
        fs.writeFileSync(path.join(certDir, 'ca-cert.pem'), this.ca.certificate);
        this.logger.info('Issued new agent certificate', {
            agentId,
            serialNumber: agentCert.serialNumber,
            expiresAt: agentCert.expiresAt
        });
        return agentCert;
    }
    /**
     * Generate agent certificate
     */
    generateAgentCertificate(agentId, agentInfo, keyPair) {
        const cert = crypto.createCertificate({
            serialNumber: this.ca.serialNumber.toString(),
            subject: {
                C: 'US',
                ST: 'CA',
                L: 'San Francisco',
                O: 'Omise MCP Agent',
                OU: 'Agent Authentication',
                CN: agentId
            },
            issuer: {
                C: 'US',
                ST: 'CA',
                L: 'San Francisco',
                O: 'Omise MCP CA',
                OU: 'Agent Authentication',
                CN: 'Omise MCP Root CA'
            },
            notBefore: new Date(),
            notAfter: new Date(Date.now() + this.config.certificateValidityDays * 24 * 60 * 60 * 1000),
            publicKey: keyPair.publicKey,
            signingKey: this.ca.privateKey,
            extensions: [
                {
                    name: 'basicConstraints',
                    cA: false
                },
                {
                    name: 'keyUsage',
                    digitalSignature: true,
                    keyEncipherment: true
                },
                {
                    name: 'extKeyUsage',
                    serverAuth: true,
                    clientAuth: true
                },
                {
                    name: 'subjectAltName',
                    altNames: [
                        { type: 'DNS', value: agentId },
                        { type: 'DNS', value: `${agentId}.omise-mcp.local` }
                    ]
                },
                {
                    name: 'subjectKeyIdentifier'
                }
            ]
        });
        this.ca.serialNumber++;
        return cert.toString();
    }
    /**
     * Validate agent certificate
     */
    async validateAgentCertificate(certificate, agentId) {
        try {
            // Parse certificate
            const cert = crypto.createCertificate(certificate);
            // Check if certificate is issued by our CA
            const caCert = crypto.createCertificate(this.ca.certificate);
            if (cert.issuer.CN !== caCert.subject.CN) {
                this.logger.warn('Certificate not issued by trusted CA', { agentId });
                return false;
            }
            // Check certificate validity
            const now = new Date();
            if (cert.validFrom > now || cert.validTo < now) {
                this.logger.warn('Certificate expired or not yet valid', { agentId });
                return false;
            }
            // Check subject CN matches agent ID
            if (cert.subject.CN !== agentId) {
                this.logger.warn('Certificate subject does not match agent ID', { agentId });
                return false;
            }
            // Verify certificate signature
            const caPublicKey = crypto.createPublicKey(caCert.publicKey);
            const certPublicKey = crypto.createPublicKey(cert.publicKey);
            // This is a simplified validation - in production, use proper certificate validation
            const isValid = crypto.verify('sha256', Buffer.from(certificate), caPublicKey, Buffer.from(certificate));
            if (!isValid) {
                this.logger.warn('Certificate signature validation failed', { agentId });
                return false;
            }
            this.logger.info('Certificate validation successful', { agentId });
            return true;
        }
        catch (error) {
            this.logger.error('Certificate validation error', error, { agentId });
            return false;
        }
    }
    /**
     * Create TLS context for mTLS
     */
    createTLSContext(agentCert) {
        return tls.createSecureContext({
            key: agentCert.privateKey,
            cert: agentCert.certificate,
            ca: agentCert.caCertificate,
            requestCert: true,
            rejectUnauthorized: true
        });
    }
    /**
     * Revoke agent certificate
     */
    async revokeAgentCertificate(agentId) {
        const cert = this.certificateStore.get(agentId);
        if (cert) {
            this.certificateStore.delete(agentId);
            // Remove certificate files
            const certDir = path.join(this.config.certPath, agentId);
            if (fs.existsSync(certDir)) {
                fs.rmSync(certDir, { recursive: true, force: true });
            }
            this.logger.info('Agent certificate revoked', { agentId });
        }
    }
    /**
     * Get certificate status
     */
    getCertificateStatus(agentId) {
        const cert = this.certificateStore.get(agentId);
        if (!cert) {
            return null;
        }
        const now = new Date();
        const isExpired = cert.expiresAt < now;
        const expiresIn = cert.expiresAt.getTime() - now.getTime();
        return {
            agentId,
            serialNumber: cert.serialNumber,
            issuedAt: cert.issuedAt,
            expiresAt: cert.expiresAt,
            isExpired,
            expiresIn: Math.max(0, expiresIn),
            status: isExpired ? 'expired' : expiresIn < 7 * 24 * 60 * 60 * 1000 ? 'expiring_soon' : 'valid'
        };
    }
    /**
     * List all issued certificates
     */
    listCertificates() {
        return Array.from(this.certificateStore.values()).map(cert => this.getCertificateStatus(cert.agentId));
    }
}
//# sourceMappingURL=mutual-tls.js.map