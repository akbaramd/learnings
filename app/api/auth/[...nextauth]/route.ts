// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 configuration with custom OTP provider
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createApiInstance } from '@/app/api/generatedClient';
import { getRequestInfo } from '@/src/lib/requestInfo';
import { NextRequest } from 'next/server';

// CRITICAL: Set runtime to nodejs for NextAuth
// This ensures NextAuth can use Node.js APIs (crypto, etc.)
// and prevents issues with session endpoint
export const runtime = 'nodejs';

// Extend NextAuth types to include our custom token fields
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  }
}

// Note: JWT types are handled by NextAuth v5 internally
// We'll use type assertions where needed

/**
 * Refresh access token using refresh token
 * This is called server-side only, refresh token is never exposed to client
 * 
 * Note: In NextAuth JWT callback, we don't have direct access to NextRequest.
 * We'll create a minimal request object for the API instance.
 * 
 * CRITICAL: This function has a timeout to prevent blocking session checks.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  // Add timeout to prevent blocking session checks
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), 3000); // 3 second timeout
  });

  const refreshPromise = (async () => {
    try {
      // Create a minimal request for API instance
      // We need this to call the upstream API
      const baseUrl = process.env.UPSTREAM_API_BASE_URL || 'https://auth.wa-nezam.org';
      const req = new NextRequest(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const api = createApiInstance(req);

      // Call refresh token endpoint directly
      const response = await api.api.refreshToken({
        refreshToken,
        deviceId: null, // Will be extracted from request if available
        userAgent: null,
        ipAddress: null,
      });

      if (response.status === 200 && response.data?.isSuccess && response.data?.data) {
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        if (accessToken && newRefreshToken) {
          return {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 15 * 60, // 15 minutes in seconds
          };
        }
      }

      return null;
    } catch (error) {
      console.error('[NextAuth] Error refreshing access token:', error);
      return null;
    }
  })();

  // Race between refresh and timeout
  return Promise.race([refreshPromise, timeoutPromise]);
}

// NextAuth configuration
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Provider for verifying OTP (authenticates user)
    Credentials({
      id: 'otp',
      name: 'OTP Authentication',
      credentials: {
        challengeId: { label: 'Challenge ID', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
        deviceId: { label: 'Device ID', type: 'text', required: false },
        userAgent: { label: 'User Agent', type: 'text', required: false },
        ipAddress: { label: 'IP Address', type: 'text', required: false },
      },
      async authorize(credentials, req) {
        if (!credentials?.challengeId || !credentials?.otp) {
          return null;
        }

        try {
          // Extract deviceId, userAgent, ipAddress from credentials (sent from client)
          // These are passed as additional fields in signIn call
          const bodyParams: Record<string, unknown> = {
            deviceId: (credentials.deviceId as string | null | undefined) || null,
            userAgent: (credentials.userAgent as string | null | undefined) || null,
            ipAddress: (credentials.ipAddress as string | null | undefined) || null,
          };

          // Create API instance from request
          // This calls upstream API directly (server-side only)
          const api = createApiInstance(req as NextRequest);
          const requestInfo = getRequestInfo(req as NextRequest, bodyParams);

          // Extract credentials with proper types
          const challengeId = String(credentials.challengeId);
          const otpCode = String(credentials.otp);

          // Call verify OTP endpoint directly to upstream
          // This is server-side only, tokens never exposed to client
          const response = await api.api.verifyOtp({
            challengeId,
            otpCode,
            scope: 'app',
            deviceId: requestInfo.deviceId || null,
            userAgent: requestInfo.userAgent || null,
            ipAddress: requestInfo.ipAddress || null,
          });

          // Extract tokens from upstream response
          // upstream.data.data contains: { accessToken, refreshToken, userId }
          if (response.status === 200 && response.data?.isSuccess && response.data?.data) {
            const upstreamData = response.data.data as {
              accessToken?: string;
              refreshToken?: string;
              userId?: string;
            };
            
            const accessToken = upstreamData.accessToken;
            const refreshToken = upstreamData.refreshToken;
            const userId = upstreamData.userId;

            if (accessToken && refreshToken) {
              return {
                id: userId || 'unknown',
                accessToken,
                refreshToken,
                userId: userId || 'unknown',
              };
            }
          }

          return null;
        } catch (error) {
          console.error('[NextAuth] Error verifying OTP:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - store tokens (for verify-otp provider)
      if (user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          userId: user.userId,
          accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };
      }

      // Type assertion for token with our custom fields
      const customToken = token as typeof token & {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        userId?: string;
        error?: string;
      };

      // CRITICAL: If there's already an error, don't try to refresh again
      // This prevents infinite refresh loops and blocking session checks
      if (customToken.error === 'RefreshAccessTokenError') {
        return token; // Return as-is, session will be invalid
      }

      // CRITICAL: If no tokens exist at all, return immediately (user not logged in)
      // This prevents unnecessary refresh attempts and speeds up session checks
      if (!customToken.accessToken && !customToken.refreshToken) {
        return token; // No tokens = no session, return quickly
      }

      // Check if access token is expired
      if (customToken.accessTokenExpires && Date.now() < customToken.accessTokenExpires) {
        // Token is still valid
        return token;
      }

      // Token expired, try to refresh it
      // CRITICAL: Only attempt refresh if we have a refresh token
      if (!customToken.refreshToken) {
        // No refresh token available, mark as error
        return { ...token, error: 'RefreshAccessTokenError' };
      }

      try {
        const refreshed = await refreshAccessToken(customToken.refreshToken);
        
        if (refreshed) {
          return {
            ...token,
            accessToken: refreshed.accessToken,
            refreshToken: refreshed.refreshToken, // Token rotation
            accessTokenExpires: Date.now() + refreshed.expiresIn * 1000,
            error: undefined, // Clear any previous error
          };
        }
      } catch (error) {
        console.error('[NextAuth] Error refreshing token in JWT callback:', error);
        // Return expired token - session will be invalidated
        return { ...token, error: 'RefreshAccessTokenError' };
      }

      // Refresh failed or returned null
      return { ...token, error: 'RefreshAccessTokenError' };
    },

    async session({ session, token }) {
      // Type assertion for token with our custom fields
      const customToken = token as typeof token & {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
        error?: string;
      };

      // CRITICAL: If there's a refresh error or no access token, return session without tokens
      // This ensures session check completes quickly and NextAuth will mark as unauthenticated
      if (customToken.error === 'RefreshAccessTokenError' || !customToken.accessToken) {
        // Return session without tokens - NextAuth will treat as unauthenticated
        return {
          ...session,
          user: {
            ...session.user,
            id: '',
          },
        };
      }

      // Attach tokens to session (for authenticated users)
      if (customToken) {
        session.accessToken = customToken.accessToken;
        session.refreshToken = customToken.refreshToken;
        if (customToken.userId) {
          session.user.id = customToken.userId;
        }
      }

      return session;
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/login?logout=true', // Custom sign-out page (optional, handled client-side)
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches refresh token lifetime)
  },

  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',

  debug: process.env.NODE_ENV === 'development',
  
  // CRITICAL: Explicit base path to ensure NextAuth endpoints are accessible
  // This prevents issues with service workers or routing
  basePath: '/api/auth',
  
  // CRITICAL: Trust host to prevent issues in development
  // This ensures NextAuth can determine the correct URL for session endpoint
  trustHost: true,
});

// Export handlers for GET and POST
export const { GET, POST } = handlers;

