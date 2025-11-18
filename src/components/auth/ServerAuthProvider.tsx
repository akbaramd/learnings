/**
 * ServerAuthProvider Component
 * 
 * Server Component (no 'use client' = server-side by default)
 * This component:
 * 1. Uses createApiInstance directly (no HTTP calls - truly server-side)
 * 2. Fetches user data via upstream API (one-time on page load)
 * 3. If 401 → user is not authenticated → renders <NotAuthenticated>
 * 4. If 200 → user is authenticated → renders <Authenticated>
 * 
 * IMPORTANT: This is a SERVER COMPONENT - NO Redux, NO client-side code
 * Just fetches user data on server and conditionally renders children
 */

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { createApiInstance } from '@/app/api/generatedClient';
import type { User, UserRole } from '@/src/store/auth/auth.types';

interface ServerAuthProviderProps {
  authenticated: React.ReactNode;
  notAuthenticated: React.ReactNode;
}

/**
 * Fetch user data on server (one-time on page load)
 * Uses createApiInstance directly - NO HTTP calls, truly server-side
 */
async function fetchUserData(): Promise<{
  isAuthenticated: boolean;
  user: User | null;
}> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // If no tokens, user is not authenticated
    if (!accessToken && !refreshToken) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    // Create NextRequest from current headers for createApiInstance
    // This is needed to pass cookies and headers to the API instance
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const url = `${protocol}://${host}`;

    // Build cookie header string
    const cookieHeader = cookieStore
      .getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Create NextRequest for createApiInstance
    const req = new NextRequest(url, {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        'x-forwarded-for': headersList.get('x-forwarded-for') || '',
        'x-real-ip': headersList.get('x-real-ip') || '',
      },
    });

    // Use createApiInstance directly - NO HTTP calls, truly server-side
    const api = createApiInstance(req);
    
    // Call upstream API directly (server-side, no network)
    const upstream = await api.api.getCurrentUser({});
    const status = upstream.status ?? 200;

    // If 401, user is not authenticated
    if (status === 401) {
      return {
        isAuthenticated: false,
        user: null,
      };
    }

    // If 200 and has user data, user is authenticated
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data?.id) {
      const userProfile = upstream.data.data;
      // Ensure id exists (TypeScript check)
      if (!userProfile.id) {
        return {
          isAuthenticated: false,
          user: null,
        };
      }
      return {
        isAuthenticated: true,
        user: {
          id: userProfile.id,
          userName: userProfile.name || userProfile.firstName || 'Unknown',
          roles: (userProfile.roles || []) as UserRole[],
          firstName: userProfile.firstName || undefined,
          lastName: userProfile.lastName || undefined,
          nationalId: userProfile.nationalId || undefined,
          phone: userProfile.phone || undefined,
        },
      };
    }

    // Other status codes or invalid response - treat as not authenticated
    return {
      isAuthenticated: false,
      user: null,
    };
  } catch (error) {
    console.error('[ServerAuthProvider] Error fetching user data:', error);
    return {
      isAuthenticated: false,
      user: null,
    };
  }
}

export async function ServerAuthProvider({ 
  authenticated, 
  notAuthenticated 
}: ServerAuthProviderProps) {
  // Fetch user data on server (one-time on page load)
  // NO Redux here - this is server-side only
  const authState = await fetchUserData();

  // Conditionally render based on authentication status
  if (authState.isAuthenticated) {
    return <>{authenticated}</>;
  } else {
    return <>{notAuthenticated}</>;
  }
}

