/**
 * Custom auth function for server-side session retrieval
 * Works with NextAuth v5
 * 
 * Usage:
 * import { auth } from '@/src/lib/auth';
 * 
 * // In API routes or server components:
 * const session = await auth();
 * const accessToken = session?.accessToken;
 * const refreshToken = session?.refreshToken;
 */

import { NextRequest } from 'next/server';
import { auth as nextAuth } from '@/app/api/auth/[...nextauth]/route';

/**
 * Get server-side session using NextAuth
 * 
 * @param _req - Optional NextRequest for request context (NextAuth v5 handles this automatically)
 * @returns Session object with accessToken and refreshToken, or null if not authenticated
 */
export async function auth(_req?: NextRequest) {
  try {
    // NextAuth v5's auth() function automatically reads from request context
    // The req parameter is kept for API compatibility but v5 doesn't need it
    const session = await nextAuth();
    
    return session;
  } catch (error) {
    console.error('[auth] Error getting session:', error);
    return null;
  }
}

/**
 * Get access token from session
 * 
 * @param req - Optional NextRequest for request context
 * @returns Access token string or null
 */
export async function getAccessToken(req?: NextRequest): Promise<string | null> {
  const session = await auth(req);
  return session?.accessToken || null;
}



