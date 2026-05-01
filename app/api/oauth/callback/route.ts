// app/api/oauth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createApiInstance } from '@/app/api/generatedClient';

// ───────── OIDC Configuration (Static Constants) ─────────
const OIDC_CONFIG = {
    authority: process.env.OIDC_AUTHORITY || 'https://dejban.wa-nezam.org',
    clientId: process.env.OIDC_CLIENT_ID || 'refahi',
    clientSecret: process.env.OIDC_CLIENT_SECRET || '0TekJKdG8qaQqbr+EpJ8izfxi3DcLG0v9J1l9EwpP+A=',
    redirectUri: process.env.DEJBAN_CALLBACK_URL || 'http://localhost:3000/api/oauth/callback',
};

// ───────── Backend API Configuration ─────────
const BACKEND_CONFIG = {
    baseUrl: process.env.UPSTREAM_API_BASE_URL || 'https://auth.wa-nezam.org',
};

// ───────── Token Cookie Configuration ─────────
const COOKIE_CONFIG = {
    accessToken: {
        name: 'access_token',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 60 * 60, // 1 hour
    },
    refreshToken: {
        name: 'refresh_token',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
    },
};

// ───────── Type Definitions ─────────
interface OidcTokenResponse {
    access_token: string;
    refresh_token?: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
    scope?: string;
}

interface BackendLoginResponse {
    accessToken: string;
    refreshToken: string;
    expiryMinutes: number;
    userId: string;
    userName: string;
    email?: string;
    phoneNumber?: string;
    nationalCode?: string;
    membershipNumber?: string;
    isEngineer: boolean;
    roles: string[];
    isNewUser: boolean;
    isProfileComplete: boolean;
}

interface RequestInfo {
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
    scope: 'app' | 'panel';
    provider: string;
}

/**
 * Exchange OIDC authorization code for tokens using PKCE
 */
async function exchangeCodeForTokens(
    code: string,
    codeVerifier: string
): Promise<OidcTokenResponse | null> {
    const tokenEndpoint = OIDC_CONFIG.authority.replace(/\/$/, '') + '/connect/token';

    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', OIDC_CONFIG.redirectUri);
    params.append('client_id', OIDC_CONFIG.clientId);
    if (OIDC_CONFIG.clientSecret) {
        params.append('client_secret', OIDC_CONFIG.clientSecret);
    }
    params.append('code_verifier', codeVerifier);

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
        },
        body: params.toString(),
        cache: 'no-store',
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OIDC token exchange failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText.substring(0, 500),
        });
        return null;
    }

    const data = (await response.json()) as OidcTokenResponse;

    // Validate required field
    if (!data.access_token) {
        console.error('❌ OIDC response missing access_token');
        return null;
    }

    return data;
}

/**
 * Send OIDC tokens to backend and get system tokens
 */
async function loginWithBackend(
    oidcAccessToken: string,
    oidcRefreshToken: string | undefined,
    requestInfo: RequestInfo
): Promise<{ success: true; data: BackendLoginResponse } | { success: false; error: string }> {
    try {
        const req = new NextRequest(BACKEND_CONFIG.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const api = createApiInstance(req);

        const response = await api.api.oAuthLoginWithToken({
            oidcAccessToken,
            oidcRefreshToken: oidcRefreshToken ?? null,
            deviceId: requestInfo.deviceId ?? null,
            ipAddress: requestInfo.ipAddress ?? null,
            userAgent: requestInfo.userAgent ?? null,
            scope: requestInfo.scope,
            provider: requestInfo.provider,
        });

        if (response.status === 200 && response.data?.isSuccess && response.data?.data) {
            const d = response.data.data;

            // Validate and normalize required fields with fallbacks
            const accessToken = d.accessToken?.trim();
            const refreshToken = d.refreshToken?.trim();
            const userId = d.userId?.trim();
            const userName = d.userName?.trim();

            if (!accessToken || !refreshToken || !userId || !userName) {
                console.error('❌ Backend response missing required fields', {
                    hasAccessToken: !!accessToken,
                    hasRefreshToken: !!refreshToken,
                    hasUserId: !!userId,
                    hasUserName: !!userName,
                });
                return { success: false, error: 'Invalid response from authentication service' };
            }

            return {
                success: true,
                data:
            {
                accessToken,
                    refreshToken,
                    expiryMinutes: d.expiryMinutes ?? 60,
                userId,
                userName,
                email: d.email?.trim() ?? undefined,
                phoneNumber: d.phoneNumber?.trim() ?? undefined,
                nationalCode: d.nationalCode?.trim() ?? undefined,
                membershipNumber: d.membershipNumber?.trim() ?? undefined,
                isEngineer: d.isEngineer === true,
                roles: Array.isArray(d.roles) ? d.roles.map((r: unknown) => String(r)) : [],
                isNewUser: d.isNewUser === true,
                isProfileComplete: d.isProfileComplete === true,
            },
        };
        }

        const errorMsg =
            (Array.isArray(response.data?.errors) && response.data.errors[0]) ||
            response.data?.message ||
            `Backend login failed: ${response.status}`;

        console.error('❌ Backend OAuth login failed:', {
            status: response.status,
            message: response.data?.message,
            errors: response.data?.errors,
        });

        return { success: false, error: String(errorMsg) };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('💥 Exception calling backend OAuth login:', { message });
        return { success: false, error: 'Failed to connect to authentication service' };
    }
}

/**
 * Set token in HttpOnly cookie securely
 */
async function setTokenCookie(
    cookieName: string,
    tokenValue: string,
    options: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
        path: string;
        maxAge: number;
    }
): Promise<boolean> {
    try {
        const cookieStore = await cookies();

        cookieStore.set(cookieName, tokenValue, {
            httpOnly: options.httpOnly,
            secure: options.secure,
            sameSite: options.sameSite,
            path: options.path,
            maxAge: options.maxAge,
        });

        // Verify cookie was set (development only)
        if (process.env.NODE_ENV === 'development') {
            await new Promise((resolve) => setTimeout(resolve, 10));
            const verifyStore = await cookies();
            const verifyValue = verifyStore.get(cookieName)?.value;

            if (verifyValue !== tokenValue) {
                console.warn(`⚠️ Cookie verification failed for ${cookieName}`);
                return false;
            }
        }

        return true;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Failed to set cookie ${cookieName}:`, message);
        return false;
    }
}

/**
 * Clear authentication cookies
 */
async function clearAuthCookies(): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete(COOKIE_CONFIG.accessToken.name);
        cookieStore.delete(COOKIE_CONFIG.refreshToken.name);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to clear auth cookies:', message);
    }
}

/**
 * Safely extract string from URL param or header with fallback
 */
function extractString(
    value: string | null | undefined,
    fallback?: string
): string | undefined {
    if (value && value.trim()) {
        return value.trim();
    }
    return fallback;
}

/**
 * GET handler for OIDC callback
 * Flow: Exchange code → Call backend → Set cookies → Redirect with user info
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    // Prevent caching
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0');
    headers.set('Pragma', 'no-cache');

    try {
        const searchParams = req.nextUrl.searchParams;

        // Extract callback parameters
        const code = extractString(searchParams.get('code'));
        const state = extractString(searchParams.get('state'));
        const error = extractString(searchParams.get('error'));
        const errorDescription = extractString(searchParams.get('error_description'));

        // ───────── 0) Handle OIDC error ─────────
        if (error) {
            console.error('❌ Dejban OIDC Error:', {
                error,
                description: errorDescription?.substring(0, 200),
                state: state?.substring(0, 50),
                timestamp: new Date().toISOString(),
            });

            await clearAuthCookies();
            return NextResponse.redirect(
                new URL('/auth/login?error=oidc_error', req.url),
                { headers }
            );
        }

        // ───────── 1) Basic validation ─────────
        if (!code || !state) {
            console.warn('⚠️ Callback missing code or state', {
                hasCode: !!code,
                hasState: !!state,
            });

            await clearAuthCookies();
            return NextResponse.redirect(
                new URL('/auth/login?error=invalid_callback', req.url),
                { headers }
            );
        }

        // ───────── 2) Retrieve PKCE verifier from cookies ─────────
        const cookieStore = await cookies();
        const verifierCookieName = `dejban_cv_${state}`;
        const codeVerifier = extractString(cookieStore.get(verifierCookieName)?.value);

        if (!codeVerifier) {
            console.warn('⚠️ Missing or expired code_verifier', { state: state.substring(0, 20) });
            await clearAuthCookies();
            return NextResponse.redirect(
                new URL('/auth/login?error=session_expired', req.url),
                { headers }
            );
        }

        // ───────── 3) One-time use: Delete verifier cookie ─────────
        cookieStore.delete(verifierCookieName);
        cookieStore.delete(`dejban_ru_${state}`);

        // ───────── 4) Extract request context for backend call ─────────
        const requestInfo: RequestInfo = {
            deviceId: extractString(
                searchParams.get('deviceId') || req.headers.get('x-device-id')
            ),
            ipAddress: extractString(
                req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                req.headers.get('x-real-ip')
            ),
            userAgent: extractString(req.headers.get('user-agent')),
            scope: (searchParams.get('scope') as 'app' | 'panel') === 'panel' ? 'panel' : 'app',
            provider: extractString(searchParams.get('provider')) || 'Dejban',
        };

        // ───────── 5) Exchange code for OIDC tokens ─────────
        console.log('🔄 Exchanging OIDC code for tokens...', {
            state: state.substring(0, 20),
            provider: requestInfo.provider,
        });

        const oidcTokens = await exchangeCodeForTokens(code, codeVerifier);

        if (!oidcTokens?.access_token) {
            console.error('❌ Failed to obtain OIDC tokens');
            await clearAuthCookies();
            return NextResponse.redirect(
                new URL('/auth/login?error=token_exchange_failed', req.url),
                { headers }
            );
        }

        // ───────── 6) Call backend with OIDC tokens ─────────
        console.log('🔄 Calling backend OAuth login...', {
            tokenPrefix: oidcTokens.access_token.substring(0, 20) + '...',
            hasRefreshToken: !!oidcTokens.refresh_token,
        });

        const backendResult = await loginWithBackend(
            oidcTokens.access_token,
            oidcTokens.refresh_token,
            requestInfo
        );

        if (!backendResult.success) {
            console.error('❌ Backend OAuth login failed:', backendResult.error);
            await clearAuthCookies();

            const errorParam = backendResult.error.includes('ملی')
                ? 'user_not_found'
                : 'backend_login_failed';

            return NextResponse.redirect(
                new URL(`/auth/login?error=${errorParam}`, req.url),
                { headers }
            );
        }

        const userData = backendResult.data;

        // ───────── 7) 🔐 CRITICAL: Store system tokens in HttpOnly cookies ─────────
        const accessTokenSet = await setTokenCookie(
            COOKIE_CONFIG.accessToken.name,
            userData.accessToken,
            COOKIE_CONFIG.accessToken
        );

        const refreshTokenSet = await setTokenCookie(
            COOKIE_CONFIG.refreshToken.name,
            userData.refreshToken,
            COOKIE_CONFIG.refreshToken
        );

        if (!accessTokenSet || !refreshTokenSet) {
            console.error('❌ CRITICAL: Failed to set auth cookies');
            await clearAuthCookies();
            return NextResponse.redirect(
                new URL('/auth/login?error=cookie_set_failed', req.url),
                { headers }
            );
        }

        console.log('✅ Auth cookies set successfully', {
            userId: userData.userId,
            isNewUser: userData.isNewUser,
            isEngineer: userData.isEngineer,
        });

        // ───────── 8) Build redirect URL with user info (NOT tokens) ─────────
        const returnUrl = extractString(searchParams.get('returnUrl')) || '/';
        const redirectUrl = new URL(returnUrl, req.url);

        // Add user info as query params (only non-sensitive fields)
        redirectUrl.searchParams.set('auth_success', 'true');
        redirectUrl.searchParams.set('user_id', userData.userId);
        redirectUrl.searchParams.set('user_name', userData.userName);

        if (userData.isNewUser) {
            redirectUrl.searchParams.set('is_new_user', 'true');
        }

        if (!userData.isProfileComplete) {
            redirectUrl.searchParams.set('complete_profile', 'true');
        }

        // ───────── 9) Redirect to application with user info ─────────
        console.log('✅ OAuth login completed, redirecting...', {
            userId: userData.userId,
            returnUrl: redirectUrl.pathname,
        });

        return NextResponse.redirect(redirectUrl, { headers });

    } catch (error: unknown) {
        // ───────── Error handling ─────────
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('💥 Unhandled exception in OAuth callback:', {
            message,
            timestamp: new Date().toISOString(),
        });

        await clearAuthCookies();

        return NextResponse.redirect(
            new URL('/auth/login?error=callback_exception', req.url),
            { headers }
        );
    }
}