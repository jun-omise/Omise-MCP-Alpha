/**
 * OAuth 2.0 Provider for Agent-to-Agent Authentication
 */
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
export class OAuth2Provider {
    config;
    logger;
    clientRegistry;
    tokenStore;
    codeStore;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.clientRegistry = new Map();
        this.tokenStore = new Map();
        this.codeStore = new Map();
        this.setupCleanupTasks();
    }
    /**
     * Register a new OAuth client (agent)
     */
    async registerClient(clientInfo) {
        const clientId = this.generateClientId();
        const clientSecret = this.generateClientSecret();
        const client = {
            clientId,
            clientSecret,
            name: clientInfo.name,
            redirectUris: clientInfo.redirectUris,
            scopes: clientInfo.scopes || ['read', 'write'],
            grantTypes: clientInfo.grantTypes || ['authorization_code', 'refresh_token'],
            createdAt: new Date(),
            isActive: true
        };
        this.clientRegistry.set(clientId, client);
        this.logger.info('OAuth client registered', {
            clientId,
            name: client.name,
            scopes: client.scopes
        });
        return client;
    }
    /**
     * Generate authorization URL for OAuth flow
     */
    generateAuthorizationUrl(request) {
        const client = this.clientRegistry.get(request.clientId);
        if (!client || !client.isActive) {
            throw new Error('Invalid or inactive client');
        }
        if (!client.redirectUris.includes(request.redirectUri)) {
            throw new Error('Invalid redirect URI');
        }
        const state = this.generateState();
        const codeChallenge = this.generateCodeChallenge(request.codeVerifier);
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: request.clientId,
            redirect_uri: request.redirectUri,
            scope: request.scope.join(' '),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });
        const authUrl = `${this.config.authorizationEndpoint}?${params.toString()}`;
        // Store authorization request for validation
        this.codeStore.set(state, {
            clientId: request.clientId,
            redirectUri: request.redirectUri,
            scope: request.scope,
            codeVerifier: request.codeVerifier,
            state,
            expiresAt: new Date(Date.now() + this.config.authorizationCodeExpiry)
        });
        return authUrl;
    }
    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code, clientId, clientSecret, redirectUri, codeVerifier) {
        const client = this.clientRegistry.get(clientId);
        if (!client || !client.isActive) {
            throw new Error('Invalid or inactive client');
        }
        if (client.clientSecret !== clientSecret) {
            throw new Error('Invalid client secret');
        }
        // Find authorization code
        const authCode = Array.from(this.codeStore.values())
            .find(codeData => codeData.clientId === clientId && codeData.redirectUri === redirectUri);
        if (!authCode || authCode.expiresAt < new Date()) {
            throw new Error('Invalid or expired authorization code');
        }
        // Verify code challenge
        const expectedChallenge = this.generateCodeChallenge(codeVerifier);
        if (authCode.codeChallenge !== expectedChallenge) {
            throw new Error('Invalid code verifier');
        }
        // Generate tokens
        const accessToken = this.generateAccessToken(clientId, authCode.scope);
        const refreshToken = this.generateRefreshToken(clientId);
        const tokenResponse = {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: this.config.accessTokenExpiry,
            refresh_token: refreshToken,
            scope: authCode.scope.join(' ')
        };
        // Store tokens
        this.tokenStore.set(accessToken, {
            clientId,
            scope: authCode.scope,
            expiresAt: new Date(Date.now() + this.config.accessTokenExpiry * 1000),
            refreshToken
        });
        // Clean up authorization code
        this.codeStore.delete(authCode.state);
        this.logger.info('Access token issued', {
            clientId,
            scope: authCode.scope
        });
        return tokenResponse;
    }
    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        const tokenData = Array.from(this.tokenStore.values())
            .find(data => data.refreshToken === refreshToken);
        if (!tokenData) {
            throw new Error('Invalid refresh token');
        }
        if (tokenData.expiresAt < new Date()) {
            throw new Error('Refresh token expired');
        }
        const client = this.clientRegistry.get(tokenData.clientId);
        if (!client || !client.isActive) {
            throw new Error('Client not found or inactive');
        }
        // Generate new tokens
        const newAccessToken = this.generateAccessToken(tokenData.clientId, tokenData.scope);
        const newRefreshToken = this.generateRefreshToken(tokenData.clientId);
        // Update token store
        this.tokenStore.delete(tokenData.refreshToken);
        this.tokenStore.set(newAccessToken, {
            clientId: tokenData.clientId,
            scope: tokenData.scope,
            expiresAt: new Date(Date.now() + this.config.accessTokenExpiry * 1000),
            refreshToken: newRefreshToken
        });
        this.logger.info('Access token refreshed', {
            clientId: tokenData.clientId
        });
        return {
            access_token: newAccessToken,
            token_type: 'Bearer',
            expires_in: this.config.accessTokenExpiry,
            refresh_token: newRefreshToken,
            scope: tokenData.scope.join(' ')
        };
    }
    /**
     * Validate access token
     */
    async validateToken(token) {
        const tokenData = this.tokenStore.get(token);
        if (!tokenData) {
            throw new Error('Invalid token');
        }
        if (tokenData.expiresAt < new Date()) {
            this.tokenStore.delete(token);
            throw new Error('Token expired');
        }
        const client = this.clientRegistry.get(tokenData.clientId);
        if (!client || !client.isActive) {
            throw new Error('Client not found or inactive');
        }
        return {
            clientId: tokenData.clientId,
            name: client.name,
            scopes: tokenData.scope,
            issuedAt: new Date(tokenData.expiresAt.getTime() - this.config.accessTokenExpiry * 1000),
            expiresAt: tokenData.expiresAt
        };
    }
    /**
     * Revoke token
     */
    async revokeToken(token) {
        const tokenData = this.tokenStore.get(token);
        if (tokenData) {
            this.tokenStore.delete(token);
            this.tokenStore.delete(tokenData.refreshToken);
            this.logger.info('Token revoked', {
                clientId: tokenData.clientId
            });
        }
    }
    /**
     * Generate access token (JWT)
     */
    generateAccessToken(clientId, scopes) {
        const payload = {
            sub: clientId,
            scopes,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + this.config.accessTokenExpiry
        };
        return jwt.sign(payload, this.config.jwtSecret, {
            algorithm: 'HS256'
        });
    }
    /**
     * Generate refresh token
     */
    generateRefreshToken(clientId) {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Generate client ID
     */
    generateClientId() {
        return `agent_${crypto.randomBytes(16).toString('hex')}`;
    }
    /**
     * Generate client secret
     */
    generateClientSecret() {
        return crypto.randomBytes(32).toString('hex');
    }
    /**
     * Generate state parameter
     */
    generateState() {
        return crypto.randomBytes(16).toString('hex');
    }
    /**
     * Generate code challenge for PKCE
     */
    generateCodeChallenge(codeVerifier) {
        return crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url');
    }
    /**
     * Setup cleanup tasks for expired tokens and codes
     */
    setupCleanupTasks() {
        setInterval(() => {
            const now = new Date();
            // Clean up expired tokens
            for (const [token, data] of this.tokenStore.entries()) {
                if (data.expiresAt < now) {
                    this.tokenStore.delete(token);
                }
            }
            // Clean up expired authorization codes
            for (const [state, code] of this.codeStore.entries()) {
                if (code.expiresAt < now) {
                    this.codeStore.delete(state);
                }
            }
        }, 60000); // Run every minute
    }
}
//# sourceMappingURL=oauth2-provider.js.map