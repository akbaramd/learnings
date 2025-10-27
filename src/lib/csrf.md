# CSRF Protection Implementation Guide

## Overview

This project implements CSRF (Cross-Site Request Forgery) protection using the **Double-Submit Cookie Pattern with HMAC**.

### How It Works

1. **Cookie**: A non-HttpOnly cookie (`_csrf`) is set with HMAC signature
2. **Token**: The client reads this cookie and sends the raw token value in requests
3. **Verification**: Server verifies the token matches the cookie value + HMAC signature

## Setup

### 1. Environment Variable

Add to your `.env.local`:

```bash
# Generate a random 32-byte secret:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

CSRF_SECRET=your-generated-32-byte-base64-secret
```

### 2. Middleware

The middleware (`middleware.ts`) automatically sets the CSRF cookie on every request.

## Client-Side Usage

### Reading the Token

```typescript
import { getCsrfToken, getCsrfHeader } from '@/src/lib/client-csrf';

// Get token as string
const token = getCsrfToken(); // Returns the raw token (without signature)

// Get header object for requests
const headers = getCsrfHeader(); // Returns { 'x-csrf-token': 'value' }
```

### RTK Query Example

Update your RTK Query base configuration:

```typescript
// src/store/auth/auth.queries.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getCsrfHeader } from '@/src/lib/client-csrf';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      
      // Add CSRF token to headers
      const csrfHeaders = getCsrfHeader();
      Object.assign(headers, csrfHeaders);
      
      return headers;
    },
  }),
  // ... rest of config
});
```

### Axios Example

```typescript
import axios from 'axios';
import { getCsrfHeader } from '@/src/lib/client-csrf';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const csrfHeaders = getCsrfHeader();
  config.headers = { ...config.headers, ...csrfHeaders };
  return config;
});
```

## Server-Side Usage

### API Route Protection

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfFromRequest } from '@/src/lib/csrf';

export async function POST(req: NextRequest) {
  // Option 1: Verify from header
  const isValid = verifyCsrfFromRequest(req);
  
  // Option 2: Verify from body field
  const body = await req.json();
  const isValid = verifyCsrfFromRequest(req, body.csrfToken);
  
  if (!isValid) {
    return NextResponse.json(
      { errors: ['Invalid CSRF token'] },
      { status: 403 }
    );
  }
  
  // Process the request...
}
```

### Exclude Public Endpoints

Public endpoints (like login, logout) should **NOT** require CSRF:

```typescript
// Skip CSRF for public endpoints
if (pathname.startsWith('/api/auth/login') || 
    pathname.startsWith('/api/auth/logout')) {
  // No CSRF check needed
}
```

## API Endpoints

### Endpoints Requiring CSRF

All **state-changing** endpoints should verify CSRF:
- ✅ POST `/api/bills/*` (create/update/delete)
- ✅ PUT/PATCH `/api/wallets/*`
- ✅ DELETE `/api/notifications/*`
- ✅ Any mutation that changes server state

### Endpoints NOT Requiring CSRF

Read-only or public endpoints:
- ❌ GET requests (idempotent)
- ❌ `/api/auth/login` (public endpoint)
- ❌ `/api/auth/logout` (already authenticated)
- ❌ `/api/auth/session` (read-only check)

## Security Notes

### Why Non-HttpOnly Cookie?

- JavaScript must be able to read the cookie to send it in requests
- The cookie is protected by `SameSite=Strict` to prevent cross-site access
- HMAC signature prevents tampering

### Why HMAC?

The HMAC signature ensures:
1. Token cannot be modified without detection
2. Each token is unique and tied to the session
3. Server validates both the value AND signature

## Testing

### Manual Test

1. Open browser DevTools → Application → Cookies
2. Check for `_csrf` cookie
3. Make a POST request
4. Verify `x-csrf-token` header is sent with the cookie value

### Generate Secret

```bash
# Generate CSRF_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Troubleshooting

### "Invalid CSRF token" Error

**Causes:**
1. CSRF_SECRET not set or changed
2. Cookie expired (maxAge: 24h)
3. SameSite cookie blocked (check browser settings)
4. Client not sending token in header

**Solutions:**
1. Check `.env.local` has valid CSRF_SECRET
2. Clear cookies and reload
3. Check browser console for CSRF cookie
4. Verify token is sent in request headers

### Token Not Being Sent

**Check:**
- Client code includes `getCsrfHeader()` in prepareHeaders
- Header name is exactly `x-csrf-token`
- Cookie is accessible (non-HttpOnly)

## References

- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double-Submit Cookie Pattern](https://owasp.org/www-community/attacks/csrf)

