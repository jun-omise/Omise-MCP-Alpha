/**
 * OAuth2Provider Unit Tests
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { OAuth2Provider } from '../../src/auth/oauth2-provider';
import { Logger } from '../../src/utils/logger';
import { 
  mockOAuthConfig, 
  mockAgentRegistrationInfo,
  createMockAgentIdentity,
  mockTokenResponse
} from '../fixtures/auth-fixtures';
import { 
  createMockLogger,
  mockSuccessfulResponses,
  mockErrorResponses,
  mockCrypto
} from '../mocks/auth-mocks';

// Mock crypto module
jest.mock('crypto', () => mockCrypto);

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ sub: 'test-client', scopes: ['read', 'write'] }))
}));

describe('OAuth2Provider', () => {
  let oauthProvider: OAuth2Provider;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = createMockLogger();
    oauthProvider = new OAuth2Provider(mockOAuthConfig, mockLogger);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('registerClient', () => {
    it('should register a new OAuth client successfully', async () => {
      // Act
      const result = await oauthProvider.registerClient(mockAgentRegistrationInfo);

      // Assert
      expect(result).toBeDefined();
      expect(result.clientId).toBeDefined();
      expect(result.clientSecret).toBeDefined();
      expect(result.name).toBe(mockAgentRegistrationInfo.name);
      expect(result.redirectUris).toEqual(mockAgentRegistrationInfo.redirectUris);
      expect(result.scopes).toEqual(mockAgentRegistrationInfo.scopes);
      expect(result.grantTypes).toEqual(mockAgentRegistrationInfo.grantTypes);
      expect(result.isActive).toBe(true);
      expect(result.createdAt).toBeInstanceOf(Date);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'OAuth client registered',
        expect.objectContaining({
          clientId: result.clientId,
          name: result.name,
          scopes: result.scopes
        })
      );
    });

    it('should use default scopes when not provided', async () => {
      // Arrange
      const clientInfo = { ...mockAgentRegistrationInfo };
      delete clientInfo.scopes;

      // Act
      const result = await oauthProvider.registerClient(clientInfo);

      // Assert
      expect(result.scopes).toEqual(['read', 'write']);
    });

    it('should use default grant types when not provided', async () => {
      // Arrange
      const clientInfo = { ...mockAgentRegistrationInfo };
      delete clientInfo.grantTypes;

      // Act
      const result = await oauthProvider.registerClient(clientInfo);

      // Assert
      expect(result.grantTypes).toEqual(['authorization_code', 'refresh_token']);
    });
  });

  describe('generateAuthorizationUrl', () => {
    it('should generate authorization URL successfully', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Act
      const authUrl = oauthProvider.generateAuthorizationUrl(authRequest);

      // Assert
      expect(authUrl).toContain(mockOAuthConfig.authorizationEndpoint);
      expect(authUrl).toContain(`client_id=${client.clientId}`);
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=read+write');
      expect(authUrl).toContain('code_challenge_method=S256');
    });

    it('should throw error for invalid client', () => {
      // Arrange
      const authRequest = {
        clientId: 'invalid-client',
        redirectUri: 'https://invalid.com/callback',
        scope: ['read'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Act & Assert
      expect(() => oauthProvider.generateAuthorizationUrl(authRequest))
        .toThrow('Invalid or inactive client');
    });

    it('should throw error for invalid redirect URI', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: 'https://invalid.com/callback',
        scope: ['read'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Act & Assert
      expect(() => oauthProvider.generateAuthorizationUrl(authRequest))
        .toThrow('Invalid redirect URI');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange authorization code for access token successfully', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Generate authorization URL to store the code
      oauthProvider.generateAuthorizationUrl(authRequest);

      // Act
      const tokenResponse = await oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-code-verifier'
      );

      // Assert
      expect(tokenResponse).toBeDefined();
      expect(tokenResponse.access_token).toBeDefined();
      expect(tokenResponse.token_type).toBe('Bearer');
      expect(tokenResponse.expires_in).toBe(mockOAuthConfig.accessTokenExpiry);
      expect(tokenResponse.refresh_token).toBeDefined();
      expect(tokenResponse.scope).toBe('read write');

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Access token issued',
        expect.objectContaining({
          clientId: client.clientId,
          scope: ['read', 'write']
        })
      );
    });

    it('should throw error for invalid client', async () => {
      // Act & Assert
      await expect(oauthProvider.exchangeCodeForToken(
        'test-code',
        'invalid-client',
        'invalid-secret',
        'https://test.com/callback',
        'test-verifier'
      )).rejects.toThrow('Invalid or inactive client');
    });

    it('should throw error for invalid client secret', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);

      // Act & Assert
      await expect(oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        'invalid-secret',
        client.redirectUris[0],
        'test-verifier'
      )).rejects.toThrow('Invalid client secret');
    });

    it('should throw error for invalid authorization code', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);

      // Act & Assert
      await expect(oauthProvider.exchangeCodeForToken(
        'invalid-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-verifier'
      )).rejects.toThrow('Invalid or expired authorization code');
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Generate and exchange token
      oauthProvider.generateAuthorizationUrl(authRequest);
      const tokenResponse = await oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-code-verifier'
      );

      // Act
      const refreshedToken = await oauthProvider.refreshAccessToken(tokenResponse.refresh_token);

      // Assert
      expect(refreshedToken).toBeDefined();
      expect(refreshedToken.access_token).toBeDefined();
      expect(refreshedToken.refresh_token).toBeDefined();
      expect(refreshedToken.access_token).not.toBe(tokenResponse.access_token);
      expect(refreshedToken.refresh_token).not.toBe(tokenResponse.refresh_token);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Access token refreshed',
        expect.objectContaining({
          clientId: client.clientId
        })
      );
    });

    it('should throw error for invalid refresh token', async () => {
      // Act & Assert
      await expect(oauthProvider.refreshAccessToken('invalid-refresh-token'))
        .rejects.toThrow('Invalid refresh token');
    });
  });

  describe('validateToken', () => {
    it('should validate access token successfully', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Generate and exchange token
      oauthProvider.generateAuthorizationUrl(authRequest);
      const tokenResponse = await oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-code-verifier'
      );

      // Act
      const agentIdentity = await oauthProvider.validateToken(tokenResponse.access_token);

      // Assert
      expect(agentIdentity).toBeDefined();
      expect(agentIdentity.clientId).toBe(client.clientId);
      expect(agentIdentity.name).toBe(client.name);
      expect(agentIdentity.scopes).toEqual(['read', 'write']);
      expect(agentIdentity.issuedAt).toBeInstanceOf(Date);
      expect(agentIdentity.expiresAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid token', async () => {
      // Act & Assert
      await expect(oauthProvider.validateToken('invalid-token'))
        .rejects.toThrow('Invalid token');
    });

    it('should throw error for expired token', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Generate and exchange token
      oauthProvider.generateAuthorizationUrl(authRequest);
      const tokenResponse = await oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-code-verifier'
      );

      // Mock expired token by manipulating the token store
      const tokenStore = (oauthProvider as any).tokenStore;
      const tokenData = tokenStore.get(tokenResponse.access_token);
      if (tokenData) {
        tokenData.expiresAt = new Date(Date.now() - 1000); // Expired 1 second ago
      }

      // Act & Assert
      await expect(oauthProvider.validateToken(tokenResponse.access_token))
        .rejects.toThrow('Token expired');
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      // Arrange
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Generate and exchange token
      oauthProvider.generateAuthorizationUrl(authRequest);
      const tokenResponse = await oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-code-verifier'
      );

      // Act
      await oauthProvider.revokeToken(tokenResponse.access_token);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Token revoked',
        expect.objectContaining({
          clientId: client.clientId
        })
      );

      // Verify token is no longer valid
      await expect(oauthProvider.validateToken(tokenResponse.access_token))
        .rejects.toThrow('Invalid token');
    });

    it('should handle revoking non-existent token gracefully', async () => {
      // Act & Assert - should not throw
      await expect(oauthProvider.revokeToken('non-existent-token'))
        .resolves.toBeUndefined();
    });
  });

  describe('cleanup tasks', () => {
    it('should clean up expired tokens and codes', async () => {
      // Arrange
      jest.useFakeTimers();
      
      const client = await oauthProvider.registerClient(mockAgentRegistrationInfo);
      const authRequest = {
        clientId: client.clientId,
        redirectUri: client.redirectUris[0],
        scope: ['read', 'write'],
        state: 'test-state',
        codeVerifier: 'test-code-verifier'
      };

      // Generate authorization URL and exchange token
      oauthProvider.generateAuthorizationUrl(authRequest);
      const tokenResponse = await oauthProvider.exchangeCodeForToken(
        'test-code',
        client.clientId,
        client.clientSecret,
        client.redirectUris[0],
        'test-code-verifier'
      );

      // Mock expired token
      const tokenStore = (oauthProvider as any).tokenStore;
      const tokenData = tokenStore.get(tokenResponse.access_token);
      if (tokenData) {
        tokenData.expiresAt = new Date(Date.now() - 1000);
      }

      // Act - advance time to trigger cleanup
      jest.advanceTimersByTime(60000);

      // Assert - token should be cleaned up
      await expect(oauthProvider.validateToken(tokenResponse.access_token))
        .rejects.toThrow('Invalid token');
    });
  });
});
