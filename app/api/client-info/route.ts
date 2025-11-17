// app/api/client-info/route.ts
// Returns client information including IP address, user agent, etc.
import { NextRequest, NextResponse } from 'next/server';
import { getClientIpWithFallback, getRequestUserAgent } from '@/src/lib/requestInfo';

/**
 * GET /api/client-info
 * Returns client information (IP address, user agent)
 * This endpoint is safe to call from client-side to get IP address
 * 
 * IP Detection Strategy:
 * 1. First tries to extract from request headers (x-forwarded-for, x-real-ip, etc.)
 * 2. If headers don't provide valid IP or return localhost, uses external IP service
 * 3. Falls back gracefully if all methods fail
 */
export async function GET(req: NextRequest) {
  try {
    // Get IP address with external service fallback
    const ipAddress = await getClientIpWithFallback(req);
    const userAgent = getRequestUserAgent(req);

    const response = {
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: Date.now(),
    };

    const res = NextResponse.json(response, { status: 200 });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('[ClientInfo] Error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        ipAddress: null,
        userAgent: null,
        timestamp: Date.now(),
        error: 'Failed to get client info',
      },
      { status: 200 } // Always return 200, even on error, to not break client
    );
  }
}

