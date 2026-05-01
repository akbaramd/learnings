// app/api/oauth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ───────── Helper: Base64Url Encoding (No Padding) ─────────
function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function generateRandomBase64Url(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return bufferToBase64Url(array);
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToBase64Url(hashBuffer);
}

// ───────── Helper: Safe Cookie Name Encoder ─────────
/**
 * Encodes state for use in cookie names
 * PKCE state is base64url (safe chars), but we encode anyway for safety
 */
function encodeStateForCookie(state: string): string {
    return encodeURIComponent(state);
}

function decodeStateFromCookie(encodedState: string): string {
    try {
        return decodeURIComponent(encodedState);
    } catch {
        return encodedState; // Fallback if already decoded
    }
}

// ───────── Cookie Configuration (MUST MATCH CALLBACK) ─────────
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const, // 🔥 CRITICAL: 'lax' allows redirect flow, 'strict' blocks it
    path: '/',
    maxAge: 15 * 60, // 15 minutes (PKCE code expiry)
} as const;

const COOKIE_PREFIXES = {
    codeVerifier: 'dejban_cv_',
    returnUrl: 'dejban_ru_',
} as const;

/**
 * GET handler: Initiates OAuth flow with PKCE
 * Generates state/code_verifier, stores in cookies, redirects to OIDC provider
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    try {
        const searchParams = req.nextUrl.searchParams;
        const returnUrl = searchParams.get('returnUrl') || '/';
        const switchAccount = searchParams.get('switchAccount') === 'true';

        // ───────── 1) Generate PKCE values ─────────
        const state = generateRandomBase64Url(32); // 32 bytes = 43 chars base64url
        const codeVerifier = generateRandomBase64Url(64); // 64 bytes = 86 chars
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        // ───────── 2) Encode state for cookie names ─────────
        const encodedState = encodeStateForCookie(state);
        const verifierCookieName = `${COOKIE_PREFIXES.codeVerifier}${encodedState}`;
        const returnUrlCookieName = `${COOKIE_PREFIXES.returnUrl}${encodedState}`;

        // Debug logging (development only)
        if (process.env.NODE_ENV === 'development') {
            console.log('🔐 OAuth Login Init:', {
                state: state.substring(0, 20) + '...',
                encodedState,
                verifierCookieName,
                returnUrlCookieName,
                codeVerifierLength: codeVerifier.length,
                codeChallenge: codeChallenge.substring(0, 20) + '...',
            });
        }

        // ───────── 3) Store in cookies ─────────
        const cookieStore = await cookies();

        cookieStore.set(verifierCookieName, codeVerifier, COOKIE_OPTIONS);
        cookieStore.set(returnUrlCookieName, returnUrl, COOKIE_OPTIONS);

        // Verify cookies were set (development only)
        if (process.env.NODE_ENV === 'development') {
            await new Promise((resolve) => setTimeout(resolve, 10));
            const verifyStore = await cookies();
            const storedVerifier = verifyStore.get(verifierCookieName)?.value;

            if (storedVerifier !== codeVerifier) {
                console.error('❌ Cookie verification failed! Stored verifier mismatch.');
            } else {
                console.log('✅ Cookies set and verified successfully');
            }
        }

        // ───────── 4) Build OIDC authorize URL ─────────
        const authority = process.env.OIDC_AUTHORITY || 'https://dejban.wa-nezam.org';
        const clientId = process.env.OIDC_CLIENT_ID || 'refahi';
        const redirectUri = process.env.DEJBAN_CALLBACK_URL || 'http://localhost:3000/api/oauth/callback';
        const scope = 'openid profile offline_access';

        const authorizeEndpoint = authority.replace(/\/$/, '') + '/connect/authorize';
        const queryParams = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: scope,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state, // 🔥 Send RAW state (not encoded) to OIDC provider
        });

        if (switchAccount) {
            queryParams.append('prompt', 'login');
        }

        const authorizeUrl = `${authorizeEndpoint}?${queryParams.toString()}`;

        // ───────── 5) Redirect to OIDC provider ─────────
        const response = NextResponse.redirect(authorizeUrl);
        response.headers.set('Cache-Control', 'no-store, max-age=0');
        response.headers.set('Pragma', 'no-cache');

        console.log('🔄 Redirecting to OIDC provider', {
            authorizeUrl: authorizeUrl.substring(0, 100) + '...',
            state: state.substring(0, 20) + '...',
        });

        return response;

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('💥 OAuth login initiation failed:', { message });

        return NextResponse.json(
            { error: 'Failed to initiate authentication' },
            { status: 500 }
        );
    }
}