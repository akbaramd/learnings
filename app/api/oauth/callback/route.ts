import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError } from 'next-auth';

// ⚠️ هشدار جدی: فقط و فقط از فایل کانفیگ اصلی ایمپورت کنید
import { signIn } from "@/app/api/auth/[...nextauth]/route";

// ───────── Configuration & Constants ─────────

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const REDIRECT_URI = process.env.Dejban_Callback || (APP_BASE_URL + '/api/oauth/callback');

// ───────── Type Definitions ─────────

type ScopeType = 'app' | 'panel';

interface RequestMetadata {
    deviceId: string;
    ipAddress: string | null;
    userAgent: string | null;
    scope: ScopeType;
    provider: string;
}

interface OAuthCallbackParams {
    code: string | null;
    state: string | null;
    error: string | null;
}

function isNextRedirectError(error: unknown): boolean {
    console.log("redirect error" , error)
    return error instanceof Error &&
        'digest' in error &&
        typeof error.digest === 'string' &&
        error.digest.startsWith('NEXT_REDIRECT');
}

// ───────── Utility Functions ─────────

function sanitizeString(value: string | null | undefined, fallback: string = ''): string {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
}

function createSafeUrl(path: string, baseUrl: string): URL {
    try {
        return new URL(path, baseUrl);
    } catch (e) {
        console.error("[OAuth Callback] Critical Error: Invalid Base URL provided -> " + baseUrl);
        return new URL(path, 'http://localhost:3000');
    }
}

// ───────── Route Handler ─────────

export async function GET(req: NextRequest): Promise<NextResponse> {
    const headers = new Headers();
    headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    try {
        const { searchParams } = req.nextUrl;

        const params: OAuthCallbackParams = {
            code: sanitizeString(searchParams.get('code'), ""),
            state: sanitizeString(searchParams.get('state'), ""),
            error: sanitizeString(searchParams.get('error'), "")
        };

        if (params.error) {
            console.warn("[OAuth Callback] Provider returned an error: " + params.error);
            return NextResponse.redirect(createSafeUrl('/error?error=' + params.error, APP_BASE_URL), { headers });
        }

        if (!params.code || !params.state) {
            console.error("[OAuth Callback] Missing mandatory parameters.");
            return NextResponse.redirect(createSafeUrl('/error?error=invalid_callback_params', APP_BASE_URL), { headers });
        }

        const cookieStore = await cookies();
        const verifierCookieName = 'dejban_cv_' + params.state;
        const codeVerifier = sanitizeString(cookieStore.get(verifierCookieName)?.value, "");

        if (!codeVerifier) {
            console.error("[OAuth Callback] Code verifier not found or expired.");
            return NextResponse.redirect(createSafeUrl('/error?error=session_expired_or_invalid_state', APP_BASE_URL), { headers });
        }

        try {
            cookieStore.delete(verifierCookieName);
            cookieStore.delete('dejban_ru_' + params.state);
        } catch (cookieError) {
            console.warn("[OAuth Callback] Failed to delete temporary cookies. Ignored.", cookieError);
        }

        const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
        const cleanIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : null;

        const requestMetadata: RequestMetadata = {
            deviceId: sanitizeString(searchParams.get('deviceId') || req.headers.get('x-device-id'), 'unknown-device'),
            ipAddress: sanitizeString(cleanIp, ""),
            userAgent: sanitizeString(req.headers.get('user-agent'), ""),
            scope: searchParams.get('scope') === 'panel' ? 'panel' : 'app',
            provider: sanitizeString(searchParams.get('provider'), 'Dejban'),
        };

        console.info("[OAuth Callback] Attempting NextAuth signIn for device: " + requestMetadata.deviceId);

        // واگذاری عملیات به NextAuth
        await signIn("dejban", {
            code: params.code,
            codeVerifier: codeVerifier,
            redirectUri: REDIRECT_URI,
            deviceId: requestMetadata.deviceId,
            ipAddress: requestMetadata.ipAddress,
            userAgent: requestMetadata.userAgent,
            redirectTo: '/',
        });

        // پشتیبان در صورت عدم پرتاب خطای ریدایرکت
        return NextResponse.redirect(createSafeUrl('/', APP_BASE_URL), { headers });

    } catch (error: unknown) {
        if (isNextRedirectError(error)) {
            // اجازه عبور به ریدایرکت‌های موفق فریم‌ورک
            throw error;
        }

        if (error instanceof AuthError) {
            console.error("[OAuth Callback] NextAuth Error: " + error.type);
            return NextResponse.redirect(createSafeUrl('/error?error=' + error.type, APP_BASE_URL), { headers });
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown exception occurred';
        console.error("[OAuth Callback] Critical Unhandled Exception: " + errorMessage);

        return NextResponse.redirect(createSafeUrl('/error?error=callback_exception', APP_BASE_URL), { headers });
    }
}
