// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 configuration with custom OTP provider
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createApiInstance } from '@/app/api/generatedClient';
import { getRequestInfo } from '@/src/lib/requestInfo';
import { NextRequest } from 'next/server';

// Extend NextAuth types to include our custom token fields
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    // For send-otp provider
    challengeId?: string;
    maskedPhoneNumber?: string;
    nationalCode?: string;
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
    // For send-otp provider
    challengeId?: string;
    maskedPhoneNumber?: string;
    nationalCode?: string;
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
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
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
}

// NextAuth configuration
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Provider for sending OTP (does not authenticate, just sends OTP)
    Credentials({
      id: 'send-otp',
      name: 'Send OTP',
      credentials: {
        nationalCode: { label: 'National Code', type: 'text' },
        deviceId: { label: 'Device ID', type: 'text', required: false },
        userAgent: { label: 'User Agent', type: 'text', required: false },
        ipAddress: { label: 'IP Address', type: 'text', required: false },
      },
      async authorize(credentials, req) {
        if (!credentials?.nationalCode) {
          console.error('[NextAuth] send-otp: Missing nationalCode');
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
          const api = createApiInstance(req as NextRequest);
          const requestInfo = getRequestInfo(req as NextRequest, bodyParams);

          // Extract national code
          const nationalCode = String(credentials.nationalCode);

          // Call send OTP endpoint directly to upstream
          // This is server-side only
          const response = await api.api.sendOtp({
            nationalCode,
            purpose: 'login',
            scope: 'app',
            deviceId: requestInfo.deviceId || null,
            userAgent: requestInfo.userAgent || null,
            ipAddress: requestInfo.ipAddress || null,
          });

          // Log response for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('[NextAuth] send-otp response:', {
              status: response.status,
              isSuccess: response.data?.isSuccess,
              hasData: !!response.data?.data,
              hasChallengeId: !!response.data?.data?.challengeId,
            });
          }

          // Extract challengeId and maskedPhoneNumber from response
          if (response.status === 200 && response.data?.isSuccess && response.data?.data?.challengeId) {
            const data = response.data.data;
            // Return special user object with OTP data (not for authentication)
            // This will be handled specially in the login page
            return {
              id: 'otp-sent', // Special ID to indicate OTP was sent
              challengeId: data.challengeId || undefined,
              maskedPhoneNumber: data.maskedPhoneNumber || undefined,
              nationalCode: nationalCode,
            };
          }

          // Log why we're returning null
          console.error('[NextAuth] send-otp: Invalid response', {
            status: response.status,
            isSuccess: response.data?.isSuccess,
            message: response.data?.message,
            errors: response.data?.errors,
            hasData: !!response.data?.data,
            hasChallengeId: !!response.data?.data?.challengeId,
          });

          return null;
        } catch (error) {
          console.error('[NextAuth] Error sending OTP:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : 'Unknown',
            type: typeof error,
          });
          return null;
        }
      },
    }),

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
      // Handle send-otp provider (does not authenticate, just sends OTP)
      if (user && user.id === 'otp-sent') {
        // Store OTP data temporarily but don't create a session
        // This will be handled specially in the login page
        return {
          ...token,
          otpSent: true,
          challengeId: user.challengeId,
          maskedPhoneNumber: user.maskedPhoneNumber,
          nationalCode: user.nationalCode,
        };
      }

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
      };

      // Check if access token is expired
      if (customToken.accessTokenExpires && Date.now() < customToken.accessTokenExpires) {
        // Token is still valid
        return token;
      }

      // Token expired, refresh it
      if (customToken.refreshToken) {
        try {
          const refreshed = await refreshAccessToken(customToken.refreshToken);
          
          if (refreshed) {
            return {
              ...token,
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken, // Token rotation
              accessTokenExpires: Date.now() + refreshed.expiresIn * 1000,
            };
          }
        } catch (error) {
          console.error('[NextAuth] Error refreshing token in JWT callback:', error);
          // Return expired token - session will be invalidated
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }

      // No refresh token or refresh failed
      return { ...token, error: 'RefreshAccessTokenError' };
    },

    async session({ session, token }) {
      // Type assertion for token with our custom fields
      const customToken = token as typeof token & {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
        otpSent?: boolean;
        challengeId?: string;
        maskedPhoneNumber?: string;
        nationalCode?: string;
      };

      // Handle send-otp case (don't create a session, just return OTP data)
      if (customToken.otpSent) {
        // Return a special session that indicates OTP was sent
        // This will be handled in the login page
        return {
          ...session,
          user: {
            ...session.user,
            id: 'otp-sent',
          },
          challengeId: customToken.challengeId,
          maskedPhoneNumber: customToken.maskedPhoneNumber,
          nationalCode: customToken.nationalCode,
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
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days (matches refresh token lifetime)
  },

  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',

  debug: process.env.NODE_ENV === 'development',
});

// Export handlers for GET and POST
export const { GET, POST } = handlers;

