# RTK Query Reauth with Single-Flight Queue - Implementation Summary

## ✅ What Was Implemented

### 1. Core Reauth Base Query (`src/store/api/baseApi.ts`)

**Features**:
- ✅ Single-flight refresh pattern (prevents concurrent refresh requests)
- ✅ Automatic 401 handling with token refresh
- ✅ Request retry after successful refresh
- ✅ Logout on refresh failure
- ✅ CSRF token support
- ✅ Cookie credentials included

**Key Implementation**:
```typescript
let refreshPromise: Promise<Response> | null = null;

export const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  
  // Handle 401 errors
  if (result?.error?.status === 401 && !url.startsWith('/auth/refresh')) {
    // Single-flight: only create one refresh request
    if (!refreshPromise) {
      refreshPromise = fetch('/api/auth/refresh', { 
        method: 'POST', 
        credentials: 'include' 
      });
    }
    
    const resp = await refreshPromise;
    refreshPromise = null;
    
    if (resp.ok) {
      // Retry original request
      return await rawBaseQuery(args, api, extraOptions);
    }
    
    // Logout on failure
    api.dispatch(setAnonymous());
    return { error: { status: 401, data: { errors: ['Session expired'] } } };
  }
  
  return result;
};
```

### 2. Auth API Updated

**File**: `src/store/auth/auth.queries.ts`

**Changes**:
- ✅ Uses `baseQueryWithReauth` instead of custom baseQuery
- ✅ All auth queries now have automatic reauth support
- ✅ No manual 401 handling needed

### 3. Store Integration

**Files**:
- `src/store/api/baseApi.ts` - Core reauth logic
- `src/services/apiBase.ts` - Re-exports for backward compatibility
- `src/store/index.ts` - Uses baseApi
- `src/store/auth/auth.queries.ts` - Uses reauth base query

## 🔄 Remaining Work

### Other Store Modules Need Migration

The following modules should be updated to use `baseQueryWithReauth`:

1. **`src/store/notifications/notifications.queries.ts`**
2. **`src/store/wallets/wallets.queries.ts`**
3. **`src/store/bills/bills.queries.ts`**
4. **`src/store/payments/payments.queries.ts`**
5. **`src/store/discounts/discounts.queries.ts`**

### Migration Pattern

**Before**:
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const someApi = createApi({
  reducerPath: 'someApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/some',
    credentials: 'include',
    prepareHeaders: (headers) => {
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  // ...
});
```

**After**:
```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/src/store/api/baseApi';

export const someApi = createApi({
  reducerPath: 'someApi',
  baseQuery: baseQueryWithReauth,
  // ... keep everything else the same
});
```

**Changes Required**:
1. Remove `fetchBaseQuery` import
2. Add `baseQueryWithReauth` import
3. Replace `baseQuery` config with just `baseQueryWithReauth`
4. Remove `baseUrl`, `credentials`, `prepareHeaders` (all handled by baseQuery)

## 🎯 Benefits

### Single-Flight Pattern
- **Problem**: Multiple concurrent requests getting 401 would trigger multiple refresh attempts
- **Solution**: Single `refreshPromise` shared across all requests
- **Benefit**: Only one refresh request, all others wait for the result

### Automatic Retry
- **Problem**: Failed requests due to expired tokens require manual retry
- **Solution**: Automatic retry after successful refresh
- **Benefit**: Seamless user experience, no manual intervention needed

### Centralized Logic
- **Problem**: Each API module would need its own auth logic
- **Solution**: Single shared base query
- **Benefit**: Consistent behavior, easier maintenance

## 🔍 How It Works

### Scenario 1: Token Expired During Active Session

```
User makes request → 401 error
↓
Single refresh request initiated (if none exists)
↓
All concurrent requests wait for refresh
↓
Refresh succeeds → Retry all original requests
↓
Success! User continues working
```

### Scenario 2: Refresh Failed

```
User makes request → 401 error
↓
Refresh attempted → Failed (invalid refresh token)
↓
Dispatch setAnonymous() action
↓
Redirect to login → User must login again
```

### Scenario 3: Concurrent Requests

```
Request A (401) ↓
Request B (401) → Both detect 401
Request C (401) ↓
↓
Only one refresh call is made
↓
All three wait for refresh result
↓
Refresh succeeds
↓
All three retry and succeed
```

## 🧪 Testing

### Manual Test

1. Open DevTools Network tab
2. Make several API requests simultaneously
3. Let token expire (or delete from cookies)
4. Make another request
5. Verify:
   - Only one refresh request is made
   - Other requests wait
   - All requests eventually succeed
   - User stays logged in

### Test Refresh Failure

1. Delete both accessToken and refreshToken cookies
2. Make an API request
3. Verify:
   - Refresh request fails
   - User is logged out
   - Redirected to login

## ⚠️ Important Notes

### Auth Endpoints Don't Require Reauth

The following endpoints should NOT use reauth (they're public or handle their own auth):
- POST `/api/auth/login` - Public endpoint
- POST `/api/auth/verify-otp` - Public endpoint  
- GET `/api/auth/session` - Uses its own refresh logic
- POST `/api/auth/logout` - Uses session

### CSRF Token

- CSRF token is automatically included in all requests
- No manual setup needed
- Token is read from `_csrf` cookie

## 📝 Next Steps

1. ✅ Core reauth base query implemented
2. ✅ Auth API uses reauth
3. ⏳ Update other store modules (notifications, wallets, bills, payments, discounts)
4. ⏳ Test with real tokens
5. ⏳ Deploy and monitor

## 🔗 Related Files

- `src/store/api/baseApi.ts` - Core implementation
- `src/store/auth/auth.queries.ts` - Example usage
- `src/lib/client-csrf.ts` - CSRF token helper
- `src/lib/csrf.ts` - Server-side CSRF

