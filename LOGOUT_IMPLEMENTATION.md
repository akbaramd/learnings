# Logout Implementation - NextAuth Best Practices

## Overview

This document describes the logout implementation following NextAuth best practices. The pattern ensures complete logout from both backend and NextAuth session.

## Pattern

The logout flow follows this sequence:

1. **Backend API Call** - Clear server-side session, cookies, and Redux state
2. **NextAuth signOut()** - Clear client-side session
3. **Redirect** - Redirect to login page

## Implementation

### 1. Logout Utility (`src/lib/logout.ts`)

A reusable utility function that handles the complete logout flow:

```typescript
import { performLogout } from '@/src/lib/logout';
import { useLogoutMutation } from '@/src/store/auth';

const [logout] = useLogoutMutation();

await performLogout(
  async () => {
    // Step 1: Call backend logout API
    await logout({ refreshToken: undefined }).unwrap();
  },
  {
    returnUrl: window.location.pathname,
    showToast: true,
  }
);
```

**Features:**
- Handles backend API call
- Calls NextAuth `signOut()` with `redirect: false`
- Shows toast notification (optional)
- Redirects to login page with returnUrl
- Error handling with fallback

### 2. NextAuth Configuration

Updated `app/api/auth/[...nextauth]/route.ts` to include custom sign-out page:

```typescript
pages: {
  signIn: '/login',
  signOut: '/login?logout=true', // Custom sign-out page
  error: '/login',
},
```

**Note:** The signOut page is optional and mainly for documentation. The actual logout is handled client-side via the utility.

### 3. Usage Example

**Logout Details Page** (`app/(protected)/profile/logout-details/page.tsx`):

```typescript
const handleLogout = async () => {
  await performLogout(
    async () => {
      await logout({ refreshToken: undefined }).unwrap();
    },
    {
      returnUrl: window.location.pathname,
      showToast: true,
    }
  );
};
```

## Why This Pattern?

### ✅ Benefits

1. **Complete Logout**: Clears both backend and NextAuth sessions
2. **Security**: Even if backend API fails, NextAuth session is cleared
3. **Consistency**: Single utility function ensures consistent logout behavior
4. **Error Handling**: Graceful fallback if any step fails
5. **User Experience**: Toast notifications and proper redirects

### ❌ What NOT to Do

- **Don't use providers for logout logic** - Providers are for authentication, not logout
- **Don't skip backend API call** - Always clear server-side session first
- **Don't use redirect in signOut()** - Use `redirect: false` and handle redirect manually
- **Don't forget error handling** - Always have fallback to clear session even on errors

## Flow Diagram

```
User Clicks Logout
    ↓
Call performLogout()
    ↓
Step 1: Backend API (/api/auth/logout)
    ├─→ Clear server-side session
    ├─→ Clear cookies (httpOnly)
    └─→ Clear Redux state (via mutation)
    ↓
Step 2: NextAuth signOut()
    ├─→ Clear client-side session
    └─→ Clear NextAuth JWT
    ↓
Step 3: Show Toast (optional)
    ↓
Step 4: Redirect to /login?r={returnUrl}&logout=true
    └─→ Full page reload (clears all state)
```

## Error Handling

The utility handles errors gracefully:

1. **Backend API fails**: Still calls NextAuth signOut() and redirects
2. **NextAuth signOut fails**: Still redirects (session cleared on next load)
3. **Both fail**: Still redirects for security

## Migration Notes

If you have existing logout code, migrate to use `performLogout()`:

**Before:**
```typescript
await logout().unwrap();
await signOut({ redirect: true, callbackUrl: '/login' });
```

**After:**
```typescript
await performLogout(
  async () => await logout().unwrap(),
  { returnUrl: window.location.pathname }
);
```

## Related Files

- `src/lib/logout.ts` - Logout utility
- `app/api/auth/logout/route.ts` - Backend logout API route
- `app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `app/(protected)/profile/logout-details/page.tsx` - Logout UI page
- `src/store/auth/auth.queries.ts` - Logout mutation

