# Next.js Authentication & Routing Review

## Project Overview

### Router Type: **App Router**
- **Evidence**: Project uses Next.js App Router exclusively
- **Location**: `app/` directory structure with route groups `(auth)` and `(protected)`
- **Key Files**:
  - `app/(auth)/layout.tsx` - Public routes layout
  - `app/(protected)/layout.tsx` - Protected routes layout with auth guard
  - `app/layout.tsx` - Root layout with providers

### Runtime Configuration
- **Runtime**: Node.js (no Edge runtime usage detected)
- **Evidence**: All API routes use `await cookies()` from `next/headers` which requires Node.js runtime
- **Files**: All route handlers in `app/api/**/route.ts` use server-only APIs

### Authentication Library
- **Type**: Custom JWT-based authentication with BFF (Backend For Frontend) pattern
- **Pattern**: BFF Gateway Pattern - Client → Next.js API Routes → Upstream API
- **Token Storage**: HttpOnly Cookies (accessToken, refreshToken)
- **Client Library**: RTK Query (`@reduxjs/toolkit/query/react`)
- **Server Library**: Axios (custom Api class)

## Routing Map

### Authentication Endpoints

#### 1. `/api/auth/login` (POST)
- **File**: `app/api/auth/login/route.ts`
- **Method**: POST
- **Protection**: Public
- **Purpose**: Send OTP to user's phone
- **Key Code**:
```typescript:6:18:app/api/auth/login/route.ts
export async function POST(req: NextRequest) {
  try {
    const api = createApiForRequest(req);
    const body = await req.json();

    // Add scope parameter for the API call
    const requestBody = {
      ...body,
      scope: 'app' // Set scope to 'app' as required by the API
    };

    // استفاده از sendOtp برای ارسال کد OTP
    const upstream = await api.api.sendOtp(requestBody); 
    const status = upstream.status ?? upstream?.status ?? 200;
```

#### 2. `/api/auth/verify-otp` (POST)
- **File**: `app/api/auth/verify-otp/route.ts`
- **Method**: POST
- **Protection**: Public
- **Purpose**: Verify OTP and set tokens in HttpOnly cookies
- **Key Code**:
```typescript:36:61:app/api/auth/verify-otp/route.ts
    // Store tokens in session cookies if verification was successful
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { accessToken, refreshToken } = upstream.data.data;
      
      if (accessToken) {
        // Store access token in httpOnly cookie
        res.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60 // 15 minutes
        });
      }
      
      if (refreshToken) {
        // Store refresh token in httpOnly cookie
        res.cookies.set('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      }
```

#### 3. `/api/auth/refresh` (POST)
- **File**: `app/api/auth/refresh/route.ts`
- **Method**: POST
- **Protection**: Requires refresh token in cookie
- **Purpose**: Refresh access token, supports token rotation
- **Key Code**:
```typescript:52:77:app/api/auth/refresh/route.ts
    // Update tokens in cookies if refresh was successful
    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      const { accessToken, refreshToken: newRefreshToken } = upstream.data.data;
      
      if (accessToken) {
        // Update access token in httpOnly cookie
        res.cookies.set('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 15 * 60 // 15 minutes
        });
      }
      
      if (newRefreshToken) {
        // Update refresh token in httpOnly cookie (token rotation)
        res.cookies.set('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 60 * 60 // 7 days
        });
      }
```

#### 4. `/api/auth/logout` (POST)
- **File**: `app/api/auth/logout/route.ts`
- **Method**: POST
- **Protection**: Requires access token
- **Purpose**: Logout user and clear cookies
- **Key Code**:
```typescript:79:105:app/api/auth/logout/route.ts
    // پاک‌سازی کوکی‌ها - فقط در صورت موفقیت logout
    const res = NextResponse.json(response, { status });
    
    // Only clear cookies if logout API call was successful
    if (status === 200 && upstream.data?.isSuccess) {
      console.log('Logout successful, clearing cookies');
      
      // پاک‌سازی کوکی‌های احراز هویت
      res.cookies.set('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
      });
      
      res.cookies.set('refreshToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 0
      });
```

#### 5. `/api/auth/session` (GET)
- **File**: `app/api/auth/session/route.ts`
- **Method**: GET
- **Protection**: Public (returns auth status)
- **Purpose**: Check if user is authenticated, with auto-refresh logic
- **Key Code**:
```typescript:34:84:app/api/auth/session/route.ts
    // Only check if user can get their profile successfully
    const upstream = await api.api.getCurrentUser({}); 
    const status = upstream.status ?? 200;

    if (status === 200 && upstream.data?.isSuccess && upstream.data?.data) {
      // User is authenticated and can get profile
      const response: SessionResponse = {
        result: { authenticated: true },
        errors: null
      };
      return NextResponse.json(response, { status: 200 });
    } else if (status === 401 && refreshToken) {
      // Access token expired but refresh token exists - try to refresh
      try {
        const refreshApi = new Api({
          baseURL: baseURL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${refreshToken}`
          },
        });
        
        // Set Authorization header with refresh token
        const refreshUpstream = await refreshApi.api.refreshToken({ refreshToken });
        
        if (refreshUpstream.status === 200 && refreshUpstream.data?.isSuccess) {
          // Refresh successful, try getCurrentUser again with new access token
          const newAccessToken = refreshUpstream.data.data?.accessToken;
          if (newAccessToken) {
            api.instance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            const retryUpstream = await api.api.getCurrentUser({});
            if (retryUpstream.status === 200 && retryUpstream.data?.isSuccess && retryUpstream.data?.data) {
              const response: SessionResponse = {
                result: { authenticated: true },
                errors: null
              };
              return NextResponse.json(response, { status: 200 });
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
```

#### 6. `/api/auth/me` (GET)
- **File**: `app/api/auth/me/route.ts`
- **Method**: GET
- **Protection**: Requires authentication
- **Purpose**: Get current user profile
- **Key Code**:
```typescript:7:47:app/api/auth/me/route.ts
export async function GET(req: NextRequest) {
  try {
    const api = createApiInstance(req);

    // استفاده از getCurrentUser برای دریافت پروفایل کامل
    const upstream = await api.api.getCurrentUser({}); 
    const status = upstream.status ?? 200;

    // Strongly typed response structure
    const response: GetMeResponse = {
      result: status === 200 && upstream.data?.isSuccess && upstream.data.data?.id ? {
        id: upstream.data.data.id,
        name: upstream.data.data.name || undefined,
        firstName: upstream.data.data.firstName || undefined,
        lastName: upstream.data.data.lastName || undefined,
        nationalId: upstream.data.data.nationalId || undefined,
        phone: upstream.data.data.phone || undefined,
        roles: upstream.data.data.roles?.map(role => role as UserRole) || undefined,
        claims: upstream.data.data.claims || undefined,
        preferences: upstream.data.data.preferences || undefined
      } : null,
      errors: status !== 200 || !upstream.data?.isSuccess ? upstream.data?.errors || ['Failed to get user profile'] : null
    };

    const res = NextResponse.json(response, { status });
    
    // Cache-Control برای اطلاعات حساس
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    return res;
  } catch (error) {
    console.error('Get user profile BFF error:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error,
    });
    
    return handleApiError(error as AxiosError, req);
  }
```

### Client-Side API Client

#### RTK Query Base API
- **File**: `src/services/apiBase.ts`
- **Key Code**:
```typescript:4:18:src/services/apiBase.ts
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api', // فقط BFF - کلاینت فقط به Next.js API Routes می‌زند
    credentials: 'include', // کوکی‌های httpOnly سشن شما
    prepareHeaders: (headers) => {
      // در BFF pattern، توکن‌ها در کوکی‌های httpOnly ذخیره می‌شوند
      
      
      return headers;
    },
  }),
  tagTypes: ['Auth', 'Users', 'Facilities', 'Tours', 'Settings'],
  endpoints: () => ({}),
});
```

### Auth Queries (RTK Query)

#### File: `src/store/auth/auth.queries.ts`
- **Key Features**: 
  - `sendOtp` mutation
  - `verifyOtp` mutation
  - `checkSession` query
  - `getMe` query
  - `logout` mutation
  - `refreshToken` mutation

## Auth & Session Flow

### Login Flow
1. **User submits phone number** → `POST /api/auth/login` (sendOtp)
2. **Backend sends OTP** → Sets `refreshToken` cookie (forwarded from upstream)
3. **User submits OTP** → `POST /api/auth/verify-otp`
4. **Backend validates OTP** → Sets `accessToken` (15 min) and `refreshToken` (7 days) in HttpOnly cookies

### Logout Flow
1. **Client calls** → `POST /api/auth/logout`
2. **Backend calls upstream logout API** with refresh token
3. **Backend clears cookies** → Sets maxAge: 0 for both tokens

### Session Check Flow
1. **Protected layout checks** → `GET /api/auth/session`
2. **Server checks tokens** from cookies
3. **If 401** → Attempts automatic refresh
4. **Returns auth status** → `authenticated: true/false`

### Token Storage
- **Location**: HttpOnly Cookies
- **Access Token**: MaxAge 15 minutes (900 seconds)
- **Refresh Token**: MaxAge 7 days (604800 seconds)
- **Cookie Settings**:
  - `httpOnly: true` ✅
  - `secure: true` (in production) ✅
  - `sameSite: 'strict'` ✅
  - `path: '/'` ✅
  - No `domain` set (uses current domain)

### Token Refresh Strategy
- **Type**: Token Rotation (new refresh token issued)
- **Implementation**: `/api/auth/refresh` returns new tokens
- **Reuse Detection**: Not implemented (no jti tracking)
- **Blacklist**: Not implemented (no JTI/revocation)
- **Queue Strategy**: Not implemented (race conditions possible)

### Client Reauth (Missing)
- **Interceptor Strategy**: None (BFF pattern handles this server-side)
- **Queue Single Refresh**: Not implemented
- **Retry Policy**: Not implemented
- **Multi-Tab Sync**: Not implemented (no BroadcastChannel)
- **Request Queue**: Not implemented

## Middleware & Security

### Middleware
- **Status**: MISSING
- **File**: None (`middleware.ts` or `middleware.js` not found)
- **Impact**: No route-level protection, no matcher-based auth guards

### CSRF Protection
- **Status**: MISSING
- **Evidence**: No CSRF token validation in API routes
- **Risk**: Vulnerable to Cross-Site Request Forgery attacks

### CORS Configuration
- **Status**: Missing explicit configuration
- **Default**: Next.js default CORS settings
- **Risk**: Unknown cross-origin policies

### Rate Limiting
- **Status**: MISSING
- **Evidence**: No rate limiting on authentication endpoints
- **Risk**: Brute force attacks on OTP verification

### Security Headers
- **Configuration**: Present in `next.config.ts`
- **Headers Set**:
  - `X-Frame-Options: DENY` ✅
  - `X-Content-Type-Options: nosniff` ✅
  - `Referrer-Policy: origin-when-cross-origin` ✅
- **Missing Headers**:
  - `Content-Security-Policy` ❌
  - `X-XSS-Protection` ❌
  - `Strict-Transport-Security` ❌

## Caching & Data Fetching

### RTK Query Configuration
- **Client Cache**: 
  - `keepUnusedDataFor: 300` (5 minutes) for session check
  - `keepUnusedDataFor: 600` (10 minutes) for user profile
- **Refetch Behavior**:
  - `refetchOnMountOrArgChange: false`
  - `refetchOnFocus: false`
  - `refetchOnReconnect: true`

### Server-Side Caching
- **User Profile** (`/api/auth/me`):
  - Header: `Cache-Control: no-store, no-cache, must-revalidate` ✅
- **Session Check** (`/api/auth/session`):
  - No explicit cache headers (uses default)

## Environment Configuration

### Files
- **Config Files**: `next.config.ts`, `package.json`
- **Environment Files**: None found (`.env*` files not in repository)
- **Expected Variables**:
  - `NEXT_PUBLIC_API_BASE_URL` (default: `https://auth.wa-nezam.org`)
  - `UPSTREAM_API_BASE_URL` (default: `https://auth.wa-nezam.org`)
  - `NODE_ENV` (for secure cookie flags)

### Configuration Highlights
```typescript:next.config.ts
export default nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' }
        ]
      }
    ];
  }
}
```

## Problems

### Blocking Issues

#### 1. Missing Middleware for Route Protection
- **Location**: Root level (`middleware.ts` missing)
- **Severity**: Blocking
- **Impact**: Protected routes rely solely on client-side checks
- **Evidence**: `app/(protected)/layout.tsx` performs auth check but no server-side guard
- **Risk**: Users can access protected pages if they bypass client checks

#### 2. No Rate Limiting on Auth Endpoints
- **Location**: `app/api/auth/login/route.ts`, `app/api/auth/verify-otp/route.ts`
- **Severity**: High
- **Impact**: Vulnerable to brute force attacks on OTP verification
- **Evidence**: No rate limiting implementation detected
- **Risk**: Attackers can submit unlimited OTP attempts

#### 3. No CSRF Protection
- **Location**: All API routes
- **Severity**: High
- **Impact**: Vulnerable to Cross-Site Request Forgery
- **Evidence**: No CSRF token validation in any route
- **Risk**: Attackers can perform actions on behalf of authenticated users

### High Priority Issues

#### 4. Missing 401 Interceptor on Client
- **Location**: `src/store/auth/auth.queries.ts`
- **Severity**: High
- **Impact**: No automatic token refresh on client-side API calls
- **Evidence**: RTK Query baseQuery has no error handler
- **Code Reference**:
```typescript:49:56:src/store/auth/auth.queries.ts
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
```
- **Risk**: Users experience errors when tokens expire during usage

#### 5. No Token Refresh Queue (Race Condition)
- **Location**: `app/api/auth/refresh/route.ts`
- **Severity**: High
- **Impact**: Multiple simultaneous refresh attempts
- **Evidence**: No queue mechanism for concurrent refresh requests
- **Risk**: Token reuse detection will fail with concurrent requests

#### 6. No Multi-Tab Sync
- **Location**: Client-side auth state
- **Severity**: Medium-High
- **Impact**: Auth state desynchronized across browser tabs
- **Evidence**: No BroadcastChannel or storage event listeners
- **Risk**: Logout in one tab doesn't reflect in others until refresh

#### 7. No Reuse Detection for Refresh Tokens
- **Location**: `app/api/auth/refresh/route.ts`
- **Severity**: Medium-High
- **Impact**: Cannot detect token reuse (indicates compromise)
- **Evidence**: No JTI tracking or blacklist implementation
- **Risk**: Compromised refresh tokens can be reused until expiry

### Medium Priority Issues

#### 8. Inconsistent Server Interceptor Implementation
- **Location**: `app/api/generatedClient.ts`
- **Severity**: Medium
- **Issue**: Server interceptor exists but has bugs
- **Code Reference**:
```typescript:80:111:app/api/generatedClient.ts
  // Response interceptor - handle 401 errors
  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 unauthorized
      if (error.response?.status === 401) {
        // Try to refresh token if refresh token exists
        const { refreshToken } = await getTokensFromSystem();
        
        if (refreshToken) {
          // Attempt to refresh the token
          return http.post('/auth/refresh', { refreshToken })
            .then((refreshResponse) => {
              // Update the original request with new token
              const newAccessToken = refreshResponse.data.access_token;
              error.config.headers['authorization'] = `Bearer ${newAccessToken}`;
              
              // Retry the original request
              return http.request(error.config);
            })
            .catch((refreshError) => {
              // Refresh failed, redirect to login
              return handleUnauthorized(refreshError);
            });
        } else {
          // No refresh token, redirect to login
          return handleUnauthorized(error);
        }
      }
      
      return Promise.reject(error);
    }
  );
```
- **Problems**:
  - Crashes if refresh token is null
  - No queue for concurrent refresh requests
  - Uses wrong API endpoint path (`/auth/refresh` vs `/api/auth/refresh`)

#### 9. Missing Error Boundary for Auth Failures
- **Location**: `src/components/ErrorBoundary.tsx` (generic only)
- **Severity**: Medium
- **Impact**: Auth errors not handled gracefully
- **Evidence**: No auth-specific error boundary
- **Risk**: Poor user experience on auth failures

#### 10. Session Endpoint Has Complex Auto-Refresh Logic
- **Location**: `app/api/auth/session/route.ts` (lines 45-76)
- **Severity**: Medium
- **Issue**: Auto-refresh logic is fragile and hard to maintain
- **Risk**: Potential infinite loops if refresh fails repeatedly

### Low Priority Issues

#### 11. Cookie Domain Not Set
- **Location**: All cookie setters
- **Severity**: Low
- **Issue**: Cookies restricted to exact domain only
- **Impact**: No subdomain sharing capability

#### 12. No Content-Security-Policy Header
- **Location**: `next.config.ts`
- **Severity**: Low-Medium
- **Issue**: Missing CSP header
- **Impact**: XSS attack surface

#### 13. Missing HSTS Header
- **Location**: `next.config.ts`
- **Severity**: Low
- **Issue**: No Strict-Transport-Security header
- **Impact**: Downgrade attacks possible

## Recommendations

### 1. Implement Middleware for Route Protection (Blocking)

**Steps**:
1. Create `middleware.ts` in project root
2. Add matchers for protected routes
3. Check auth cookies and redirect if unauthenticated

**Example Implementation**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if accessing protected route
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/bills') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/wallet') ||
      pathname.startsWith('/notifications')) {
    
    // Check for auth cookies
    const accessToken = request.cookies.get('accessToken');
    const refreshToken = request.cookies.get('refreshToken');
    
    if (!accessToken && !refreshToken) {
      // Redirect to login
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // Check if accessing auth routes while authenticated
  if (pathname === '/login' || pathname === '/verify-otp') {
    const accessToken = request.cookies.get('accessToken');
    if (accessToken) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 2. Add Rate Limiting (High Priority)

**Steps**:
1. Install `next-rate-limit` or similar
2. Apply to authentication endpoints

**Example**:
```typescript
// lib/rateLimit.ts
import { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest, limit: number = 5, windowMs: number = 60000) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }
  
  if (entry.count >= limit) {
    return { success: false, message: 'Too many requests' };
  }
  
  entry.count++;
  return { success: true };
}
```

**Usage in `/api/auth/verify-otp/route.ts`**:
```typescript
export async function POST(req: NextRequest) {
  // Rate limit check
  const rateLimitResult = rateLimit(req, 5, 60000); // 5 attempts per minute
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { errors: ['Too many requests. Please try again later.'] },
      { status: 429 }
    );
  }
  
  // ... rest of the code
}
```

### 3. Add CSRF Protection (High Priority)

**Steps**:
1. Generate CSRF tokens for forms
2. Validate tokens on POST requests

**Example**:
```typescript
// lib/csrf.ts
import { randomBytes } from 'crypto';

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken; // In production, use HMAC
}

// In verify-otp route
export async function POST(req: NextRequest) {
  const body = await req.json();
  const csrfToken = body._csrf;
  const sessionToken = req.cookies.get('_csrf')?.value;
  
  if (!validateCSRFToken(csrfToken, sessionToken)) {
    return NextResponse.json({ errors: ['Invalid CSRF token'] }, { status: 403 });
  }
  
  // ... rest of code
}
```

### 4. Implement Client-Side 401 Interceptor (High Priority)

**Steps**:
1. Add error handling to RTK Query baseQuery
2. Implement refresh queue to prevent race conditions

**Example**:
```typescript
// src/store/auth/auth.queries.ts
let refreshPromise: Promise<string> | null = null;

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers) => {
    headers.set('content-type', 'application/json');
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);
    
    // Handle 401 Unauthorized
    if (result.error && result.error.status === 401 && !refreshPromise) {
      // Queue single refresh
      refreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => data.result.accessToken);
      
      try {
        const newToken = await refreshPromise;
        // Retry original request
        result = await baseQuery(args, api, extraOptions);
      } catch (error) {
        // Refresh failed, dispatch logout
        api.dispatch(setAnonymous());
      } finally {
        refreshPromise = null;
      }
    }
    
    return result;
  },
  // ... rest of config
});
```

### 5. Add Token Rotation and Reuse Detection (High Priority)

**Steps**:
1. Add JTI to JWT payload
2. Implement blacklist in database/cache
3. Store last used JTI per user

**Backend Required Changes**:
- Modify refresh endpoint to return `jti` in tokens
- Store revoked JTI values
- On refresh, check if old refresh token is blacklisted

**Frontend Integration**:
- No changes needed if backend handles blacklisting

### 6. Implement Multi-Tab Sync (Medium Priority)

**Steps**:
1. Use BroadcastChannel for cross-tab communication
2. Listen for auth state changes

**Example**:
```typescript
// src/hooks/useAuthSync.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setAnonymous, setUser } from '@/src/store/auth/auth.slice';

const authChannel = new BroadcastChannel('auth-sync');

export function useAuthSync() {
  const dispatch = useDispatch();
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_LOGOUT') {
        dispatch(setAnonymous());
        window.location.href = '/login';
      }
      if (event.data.type === 'AUTH_LOGIN') {
        dispatch(setUser(event.data.user));
      }
    };
    
    authChannel.addEventListener('message', handleMessage);
    
    return () => authChannel.removeEventListener('message', handleMessage);
  }, [dispatch]);
}

// In logout mutation
const logout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  authChannel.postMessage({ type: 'AUTH_LOGOUT' });
};
```

### 7. Add Security Headers (Medium Priority)

**Update `next.config.ts`**:
```typescript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
}
```

### 8. Fix Server Interceptor (Medium Priority)

**Update `app/api/generatedClient.ts`**:
```typescript
// Fix the refresh endpoint path
return http.post('/api/auth/refresh', { refreshToken })
  .then((refreshResponse) => {
    const newAccessToken = refreshResponse.data.result.accessToken; // Correct path
    error.config.headers['authorization'] = `Bearer ${newAccessToken}`;
    return http.request(error.config);
  })
```

### 9. Simplify Session Endpoint Logic (Medium Priority)

**Recommendation**: Remove auto-refresh logic from session endpoint
- Keep it simple: check if authenticated, return status
- Let client handle refresh if needed
- Reduces complexity and potential bugs

## Summary

### Strengths ✅
- HttpOnly cookies for token storage (XSS protection)
- Token rotation implemented
- Proper cookie flags (secure, httpOnly, sameSite)
- BFF pattern for API isolation
- Good separation of concerns (auth store, queries, types)
- Security headers partially configured

### Critical Gaps ❌
- No middleware for route protection
- No rate limiting
- No CSRF protection
- No client-side 401 interceptor
- No token reuse detection
- No multi-tab sync
- Race conditions in refresh logic

### Priority Actions
1. **Immediate**: Implement middleware
2. **Immediate**: Add rate limiting to auth endpoints
3. **Critical**: Add CSRF protection
4. **Critical**: Implement client-side 401 interceptor with queue
5. **High**: Add token reuse detection (backend coordination required)
6. **Medium**: Implement multi-tab sync
7. **Medium**: Add missing security headers

### Overall Assessment
The authentication implementation has a **solid foundation** with HttpOnly cookies and proper BFF pattern, but lacks several **critical security measures** that make it vulnerable to common attacks. The implementation needs middleware, rate limiting, CSRF protection, and proper error handling to be production-ready.

