/**
 * OAuth 2.0 Provider for Agent-to-Agent Authentication
 */
import { Logger } from '../utils/logger';
import { AgentIdentity, TokenResponse, AuthorizationRequest } from '../types/auth';
export declare class OAuth2Provider {
    private config;
    private logger;
    private clientRegistry;
    private tokenStore;
    private codeStore;
    constructor(config: OAuth2Config, logger: Logger);
    /**
     * Register a new OAuth client (agent)
     */
    registerClient(clientInfo: OAuthClientRegistration): Promise<OAuthClient>;
    /**
     * Generate authorization URL for OAuth flow
     */
    generateAuthorizationUrl(request: AuthorizationRequest): string;
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken(code: string, clientId: string, clientSecret: string, redirectUri: string, codeVerifier: string): Promise<TokenResponse>;
    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(refreshToken: string): Promise<TokenResponse>;
    /**
     * Validate access token
     */
    validateToken(token: string): Promise<AgentIdentity>;
    /**
     * Revoke token
     */
    revokeToken(token: string): Promise<void>;
    /**
     * Generate access token (JWT)
     */
    private generateAccessToken;
    /**
     * Generate refresh token
     */
    private generateRefreshToken;
    /**
     * Generate client ID
     */
    private generateClientId;
    /**
     * Generate client secret
     */
    private generateClientSecret;
    /**
     * Generate state parameter
     */
    private generateState;
    /**
     * Generate code challenge for PKCE
     */
    private generateCodeChallenge;
    /**
     * Setup cleanup tasks for expired tokens and codes
     */
    private setupCleanupTasks;
}
interface OAuth2Config {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    authorizationCodeExpiry: number;
    jwtSecret: string;
}
interface OAuthClient {
    clientId: string;
    clientSecret: string;
    name: string;
    redirectUris: string[];
    scopes: string[];
    grantTypes: string[];
    createdAt: Date;
    isActive: boolean;
}
interface OAuthClientRegistration {
    name: string;
    redirectUris: string[];
    scopes?: string[];
    grantTypes?: string[];
}
export {};
//# sourceMappingURL=oauth2-provider.d.ts.map