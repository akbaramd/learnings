// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 configuration with custom OTP provider
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createApiInstance } from '@/app/api/generatedClient';
import { getRequestInfo } from '@/src/lib/requestInfo';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// CRITICAL: Set runtime to nodejs for NextAuth
// This ensures NextAuth can use Node.js APIs (crypto, etc.)
// and prevents issues with session endpoint
export const runtime = 'nodejs';

// Note: Removed pendingRefreshTokens Map - using direct cookie setting instead
// This simplifies the refresh token handling and eliminates race conditions

/**
 * Normalize URL to remove IIS pipe paths
 * IIS URL Rewrite/ARR may add /pipe/{guid} prefix which breaks NextAuth action parsing
 * Example: /pipe/dd865ec1-ff07-4cbd-82b9-cb89bc3c434a/api/auth/providers -> /api/auth/providers
 */
function normalizeIisUrl(req: NextRequest): NextRequest {
  try {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Remove pipe path prefix if present (IIS URL Rewrite/ARR issue)
    // Pattern: /pipe/{guid}/api/auth/... -> /api/auth/...
    if (pathname.includes('/pipe/') && pathname.includes('/api/auth/')) {
      const pipeMatch = pathname.match(/\/pipe\/[^/]+\/(.+)/);
      if (pipeMatch) {
        const normalizedPath = '/' + pipeMatch[1];
        const normalizedUrl = new URL(normalizedPath + url.search, url.origin);
        
        console.warn(`[NextAuth][IIS] Normalized URL from ${pathname} to ${normalizedPath}`);
        
        // Create new request with normalized URL
        return new NextRequest(normalizedUrl, {
          method: req.method,
          headers: req.headers,
          body: req.body,
        });
      }
    }
  } catch (error) {
    console.error('[NextAuth][IIS] Error normalizing URL:', error);
  }
  
  return req;
}

// Extend NextAuth types to include our custom token fields
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    // refreshToken is NOT in session - it's stored in HttpOnly Cookie only
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
    // Provider for sending OTP (does not authenticate, just stores OTP data in session)
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
          return null;
        }

        try {
          // Extract deviceId, userAgent, ipAddress from credentials
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
          const response = await api.api.sendOtp({
            nationalCode,
            purpose: 'login',
            scope: 'app',
            deviceId: requestInfo.deviceId || null,
            userAgent: requestInfo.userAgent || null,
            ipAddress: requestInfo.ipAddress || null,
          });

          // Extract challengeId and maskedPhoneNumber from upstream response
          if (response.status === 200 && response.data?.isSuccess && response.data?.data?.challengeId) {
            const challengeId = response.data.data.challengeId;
            const maskedPhoneNumber = response.data.data.maskedPhoneNumber || undefined;

            // Return user object with OTP data (not authenticated yet)
            // The id 'otp-sent' is used to identify this as an OTP-sent session
            return {
              id: 'otp-sent',
              challengeId,
              maskedPhoneNumber,
              nationalCode,
            };
          }

          return null;
        } catch (error) {
          console.error('[NextAuth] Error sending OTP:', error);
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
              // 🔥 CRITICAL: Set refreshToken in HttpOnly Cookie
              // This is required for the refresh provider to work
              // The refresh provider reads refreshToken from cookies, not from JWT
              // ⚠️ CRITICAL: If cookie set fails, we MUST NOT return tokens
              // Otherwise, refresh provider won't be able to read refresh token from cookie
              let cookieSetSuccess = false;
              try {
                const { cookies } = await import('next/headers');
                const cookieStore = await cookies();
                
                cookieStore.set('refreshToken', refreshToken, {
                  httpOnly: true, // 🔥 CRITICAL: JS cannot access
                  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                  sameSite: 'strict', // CSRF protection
                  path: '/', // Available for all paths
                  maxAge: 7 * 24 * 60 * 60, // 7 days
                });
                
                cookieSetSuccess = true;
                
                if (process.env.NODE_ENV === 'development') {
                  console.log('[NextAuth][OTP] ✅ Refresh token set in HttpOnly Cookie');
                }
              } catch (cookieError) {
                // 🔥 CRITICAL: If setting cookie fails, we MUST fail the authentication
                // Otherwise, refresh provider won't be able to read refresh token from cookie
                console.error('[NextAuth][OTP] ❌ CRITICAL: Failed to set refreshToken cookie:', cookieError);
                console.error('[NextAuth][OTP] ❌ Cannot proceed - refresh provider needs cookie');
                // Return null to fail the authentication
                return null;
              }
              
              // Only return tokens if cookie was set successfully
              if (cookieSetSuccess) {
                return {
                  id: userId || 'unknown',
                  accessToken,
                  refreshToken,
                  userId: userId || 'unknown',
                };
              }
              
              // Should not reach here, but just in case
              return null;
            }
          }

          return null;
        } catch (error) {
          console.error('[NextAuth] Error verifying OTP:', error);
          return null;
        }
      },
    }),
    // Provider for refreshing tokens (updates existing session with new tokens)
    Credentials({
      id: 'refresh',
      name: 'Refresh Token',
      credentials: {
        deviceId: { label: 'Device ID', type: 'text', required: false },
        userAgent: { label: 'User Agent', type: 'text', required: false },
        ipAddress: { label: 'IP Address', type: 'text', required: false },
      },
      async authorize(credentials, req) {
        try {
          // Extract deviceId, userAgent, ipAddress from credentials
          const bodyParams: Record<string, unknown> = {
            deviceId: (credentials.deviceId as string | null | undefined) || null,
            userAgent: (credentials.userAgent as string | null | undefined) || null,
            ipAddress: (credentials.ipAddress as string | null | undefined) || null,
          };

          // Create API instance from request
          const api = createApiInstance(req as NextRequest);
          const requestInfo = getRequestInfo(req as NextRequest, bodyParams);

          // 🔥 CRITICAL: Get refresh token ONLY from cookies (NOT from credentials or session)
          // Refresh token is stored in HttpOnly Cookie for security
          // It should NEVER be passed from client or stored in session
          const cookieStore = await cookies();
          const refreshToken = cookieStore.get('refreshToken')?.value || null;

          if (process.env.NODE_ENV === 'development') {
            console.log('[NextAuth][Refresh] 🔍 Reading refresh token from cookie:', {
              hasRefreshToken: !!refreshToken,
              refreshTokenLength: refreshToken?.length || 0,
              refreshTokenPreview: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null',
            });
          }

          if (!refreshToken) {
            console.error('[NextAuth][Refresh] ❌ No refresh token found in cookies');
            // 🔥 DEBUG: List all cookies to see what's available
            if (process.env.NODE_ENV === 'development') {
              const allCookies = cookieStore.getAll();
              console.log('[NextAuth][Refresh] 🔍 All available cookies:', allCookies.map(c => c.name));
            }
            return null;
          }

          // Call refresh token endpoint directly to upstream
          // This is server-side only, tokens never exposed to client
          // 🔥 DEBUG: Log refresh token being sent
          if (process.env.NODE_ENV === 'development') {
            console.log('[NextAuth][Refresh] 🔄 Calling upstream refresh API with token:', {
              tokenLength: refreshToken.length,
              tokenPreview: `${refreshToken.substring(0, 20)}...`,
              deviceId: requestInfo.deviceId || 'null',
            });
          }
          
          const response = await api.api.refreshToken({
            refreshToken,
            deviceId: requestInfo.deviceId || null,
            userAgent: requestInfo.userAgent || null,
            ipAddress: requestInfo.ipAddress || null,
          });
          
          // 🔥 DEBUG: Log upstream response
          if (process.env.NODE_ENV === 'development') {
            console.log('[NextAuth][Refresh] 📥 Upstream refresh response:', {
              status: response.status,
              isSuccess: response.data?.isSuccess,
              message: response.data?.message,
              hasNewRefreshToken: !!response.data?.data?.refreshToken,
              newTokenLength: response.data?.data?.refreshToken?.length || 0,
            });
          }

          // Extract tokens from upstream response
          // upstream.data.data contains: { accessToken, refreshToken, userId }
          if (response.status === 200 && response.data?.isSuccess && response.data?.data) {
            const upstreamData = response.data.data as {
              accessToken?: string;
              refreshToken?: string;
              userId?: string;
            };
            
            const accessToken = upstreamData.accessToken;
            const newRefreshToken = upstreamData.refreshToken;
            const userId = upstreamData.userId;

            if (accessToken && newRefreshToken) {
              // 🔥 CRITICAL: Set new refresh token in HttpOnly Cookie (token rotation)
              // After token rotation, the old refresh token is invalidated
              // We must update the cookie with the new refresh token
              try {
                const cookieStore = await cookies();

                cookieStore.set('refreshToken', newRefreshToken, {
                  httpOnly: true, // 🔥 CRITICAL: JS cannot access
                  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                  sameSite: 'strict', // CSRF protection
                  path: '/', // Available for all paths
                  maxAge: 7 * 24 * 60 * 60, // 7 days
                });

                if (process.env.NODE_ENV === 'development') {
                  console.log('[NextAuth][Refresh] ✅ New refresh token set in HttpOnly Cookie (token rotation)');
                }
              } catch (cookieError) {
                console.error('[NextAuth][Refresh] ❌ Failed to set new refreshToken cookie:', cookieError);
                return null; // Fail the refresh if we can't set the cookie
              }
              
              // Return user object with new tokens (token rotation)
              // Refresh token is stored in Map and will be set in response header in POST handler
              return {
                id: userId || 'unknown',
                accessToken,
                refreshToken: newRefreshToken, // New refresh token (token rotation)
                userId: userId || 'unknown',
              };
            }
          }

          console.error('[NextAuth][Refresh] Refresh token failed:', {
            status: response.status,
            isSuccess: response.data?.isSuccess,
            message: response.data?.message,
            errors: response.data?.errors,
          });

          return null;
        } catch (error) {
          console.error('[NextAuth][Refresh] Error refreshing token:', error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - store tokens or OTP data
      if (user) {
        // For send-otp provider: store OTP data (not authenticated yet)
        if (user.id === 'otp-sent') {
          return {
            ...token,
            challengeId: user.challengeId,
            maskedPhoneNumber: user.maskedPhoneNumber,
            nationalCode: user.nationalCode,
            userId: 'otp-sent', // Mark as OTP-sent session
          };
        }
        
        // Type assertion for token with our custom fields
        const customToken = token as typeof token & {
          accessToken?: string;
          refreshToken?: string;
          userId?: string;
        };
        
        // For refresh provider: update tokens (token rotation)
        // Detect refresh provider: user has tokens AND token already has userId (was authenticated before)
        // This means we're refreshing an existing authenticated session
        if (user.accessToken && user.refreshToken && customToken.userId && customToken.userId !== 'otp-sent') {
          return {
            ...token,
            accessToken: user.accessToken,
            // Note: refreshToken is stored in HttpOnly cookie, not in JWT
            userId: user.userId || customToken.userId, // Preserve existing userId
            accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
            error: undefined, // Clear any previous error
            // Preserve other token fields
          };
        }
        
        // For otp provider: store tokens (authenticated for first time)
        // This happens when user verifies OTP and gets tokens for the first time
        if (user.accessToken && user.refreshToken) {
          return {
            ...token,
            accessToken: user.accessToken,
            // Note: refreshToken is stored in HttpOnly cookie, not in JWT
            userId: user.userId,
            accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
            // Clear OTP data after successful authentication
            challengeId: undefined,
            maskedPhoneNumber: undefined,
            nationalCode: undefined,
          };
        }
      }

      // Type assertion for token with our custom fields
      const customToken = token as typeof token & {
        accessToken?: string;
        refreshToken?: string;
        accessTokenExpires?: number;
        userId?: string;
        challengeId?: string;
        maskedPhoneNumber?: string;
        nationalCode?: string;
        error?: string;
      };

      // If there's already an error, don't try to refresh again
      // This prevents infinite refresh loops and blocking session checks
      if (customToken.error === 'RefreshAccessTokenError') {
        return token; // Return as-is, session will be invalid
      }

      // If no access token exists, user is not logged in
      if (!customToken.accessToken) {
        return token; // No tokens = no session, return quickly
      }

      // Check if access token is expired
      if (customToken.accessTokenExpires && Date.now() < customToken.accessTokenExpires) {
        // Token is still valid
        return token;
      }

      // Token expired - mark as error and let client handle refresh
      // Refresh will be handled by provider 'refresh' via signIn('refresh') in client
      return { ...token, error: 'RefreshAccessTokenError' };
    },

    async session({ session, token }) {
      // Type assertion for token with our custom fields
      const customToken = token as typeof token & {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
        challengeId?: string;
        maskedPhoneNumber?: string;
        nationalCode?: string;
        error?: string;
      };

      // For OTP-sent sessions (not authenticated yet)
      if (customToken.userId === 'otp-sent') {
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

      // CRITICAL: If there's a refresh error or no access token, return session without tokens
      // This ensures session check completes quickly and NextAuth will mark as unauthenticated
      if (customToken.error === 'RefreshAccessTokenError' || !customToken.accessToken) {
        // Return session without tokens - NextAuth will treat as unauthenticated
        return {
          ...session,
          accessToken: undefined, // Explicitly clear accessToken
          user: {
            ...session.user,
            id: '',
          },
        };
      }

      // Attach accessToken to session (for authenticated users)
      // 🔥 CRITICAL: refreshToken is NOT in session - it's stored in HttpOnly Cookie only
      // This ensures refreshToken is never exposed to client-side JavaScript
      if (customToken) {
        session.accessToken = customToken.accessToken;
        // refreshToken is NOT added to session - it's only in HttpOnly Cookie
        if (customToken.userId) {
          session.user.id = customToken.userId;
        }
        // Clear OTP data for authenticated sessions
        session.challengeId = undefined;
        session.maskedPhoneNumber = undefined;
        session.nationalCode = undefined;
      }

      return session;
    },
  },

  events: {
    async signIn({ user, account }) {
      // 🔥 CRITICAL: In NextAuth v5, cookies().set() in authorize callback may not work
      // We need to set refresh token cookie in response headers using events
      // This is called after authorize() succeeds and before jwt() callback
      if (user?.refreshToken && account?.provider === 'otp') {
        // Refresh token will be set in JWT callback
        if (process.env.NODE_ENV === 'development') {
          console.log('[NextAuth][Events][SignIn] OTP signIn successful, refreshToken will be set in JWT');
        }
      }
      
      if (user?.refreshToken && account?.provider === 'refresh') {
        // Refresh token rotation - new refresh token will be set in JWT callback
        if (process.env.NODE_ENV === 'development') {
          console.log('[NextAuth][Events][SignIn] Refresh signIn successful, new refreshToken will be set in JWT');
        }
      }
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
  
  // CRITICAL: Trust host to prevent issues in development and IIS
  // This ensures NextAuth can determine the correct URL for session endpoint
  trustHost: true,
  
  // CRITICAL: Set AUTH_URL for IIS deployments
  // This helps NextAuth determine the correct base URL when behind IIS proxy
  // Set this environment variable to your production URL (e.g., https://yourdomain.com)
  // If not set, NextAuth will try to infer from headers (which may fail with IIS pipe paths)
  ...(process.env.AUTH_URL && { url: process.env.AUTH_URL }),
});

// Export handlers for GET and POST with URL normalization
// CRITICAL: Normalize URLs before passing to NextAuth handlers to fix IIS pipe path issues
export async function GET(req: NextRequest) {
  // Normalize URL to remove IIS pipe paths
  const normalizedReq = normalizeIisUrl(req);
  const response = await handlers.GET(normalizedReq);
  
  // 🔥 CRITICAL: Forward refresh token cookie from NextAuth response
  // NextAuth may set cookies in response headers, we need to forward them
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && process.env.NODE_ENV === 'development') {
    console.log('[NextAuth][GET] Set-Cookie header:', setCookie);
  }
  
  return response;
}

export async function POST(req: NextRequest) {
  // Normalize URL to remove IIS pipe paths
  const normalizedReq = normalizeIisUrl(req);
  const response = await handlers.POST(normalizedReq);
  
  // Note: Removed complex pendingRefreshTokens logic
  // Direct cookie setting in authorize callback should suffice
  
  // 🔥 CRITICAL: Forward refresh token cookie from NextAuth response
  // NextAuth may set cookies in response headers, we need to forward them
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && process.env.NODE_ENV === 'development') {
    console.log('[NextAuth][POST] Set-Cookie header:', setCookie);
  }
  
  return response;
}

