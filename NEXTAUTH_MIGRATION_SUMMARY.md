# NextAuth Migration Summary

## Overview
This document summarizes the migration from custom authentication to NextAuth v5 with OTP provider.

## ✅ Completed Steps

### 1. NextAuth Configuration
- **File**: `app/api/auth/[...nextauth]/route.ts`
- **Status**: ✅ Complete
- **Features**:
  - Custom OTP provider with `challengeId` and `otp` credentials
  - Server-side token refresh in JWT callback
  - Token rotation support
  - Access token and refresh token stored in JWT (server-side only)
  - Tokens accessible in session for client and server

### 2. NextAuth Session Provider
- **File**: `src/components/auth/NextAuthProvider.tsx`
- **Status**: ✅ Complete
- **Usage**: Wrapped in root layout to provide session context

### 3. Verify OTP Page Migration
- **File**: `app/(auth)/verify-otp/page.tsx`
- **Status**: ✅ Complete
- **Changes**:
  - Replaced `useVerifyOtpMutation` with NextAuth `signIn('otp', ...)`
  - Uses `challengeId` and `otp` from Redux store
  - Handles NextAuth session establishment
  - Redirects after successful authentication

### 4. Protected Layout Migration
- **File**: `app/(protected)/layout.tsx`
- **Status**: ✅ Complete
- **Changes**:
  - Replaced `useAuth()` with `useSession()` from NextAuth
  - Uses NextAuth session status for authentication checks

### 5. Protected Route Guard Migration
- **File**: `src/components/auth/ProtectedRouteGuard.tsx`
- **Status**: ✅ Complete
- **Changes**:
  - Uses `useSession()` instead of `useAuth()`
  - Redirects based on NextAuth session status

## ⚠️ Remaining Tasks

### 6. Update API Routes to Use NextAuth Session
**Status**: ⚠️ Pending

**Current State**: API routes get tokens from httpOnly cookies
**Target State**: API routes should get tokens from NextAuth session

**Files to Update**:
- `app/api/generatedClient.ts` - Get access token from NextAuth session
- `app/api/auth/me/route.ts` - Use NextAuth session
- `app/api/auth/session/route.ts` - Use NextAuth session
- Other API routes that need authentication

**Implementation**:
```typescript
// In API routes, use NextAuth auth() function
import { auth } from '@/app/api/auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await auth();
  const accessToken = session?.accessToken;
  // Use accessToken for API calls
}
```

### 7. Update generatedClient to Use NextAuth Session
**Status**: ⚠️ Pending

**Current State**: `createApiInstance` gets tokens from cookies
**Target State**: Should get tokens from NextAuth session

**File**: `app/api/generatedClient.ts`

**Implementation**:
- Import NextAuth `auth()` function
- Get session in `createApiInstance` or interceptor
- Use `session.accessToken` for Authorization header
- Handle token refresh through NextAuth JWT callback

### 8. Update useAuth Hook (Optional)
**Status**: ⚠️ Optional

**Options**:
1. **Keep useAuth for backward compatibility** - Wrap NextAuth session
2. **Migrate fully to NextAuth** - Replace all `useAuth()` calls with `useSession()`

**Recommendation**: Option 1 for gradual migration

## 🔐 Security Features

### Token Storage
- ✅ Access token: Stored in NextAuth JWT (server-side only)
- ✅ Refresh token: Stored in NextAuth JWT (server-side only)
- ✅ Tokens never exposed to client (except accessToken in session for API calls)
- ✅ Token rotation on refresh

### Token Refresh
- ✅ Automatic refresh in JWT callback when access token expires
- ✅ Refresh token rotation (new refresh token on each refresh)
- ✅ Server-side only (client never sees refresh token)

## 📝 Environment Variables

Add to `.env.local`:
```bash
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

## 🧪 Testing Checklist

- [ ] OTP verification works with NextAuth
- [ ] Session persists across page reloads
- [ ] Token refresh works automatically
- [ ] Protected routes redirect when unauthenticated
- [ ] API routes can access tokens from NextAuth session
- [ ] Logout clears NextAuth session
- [ ] Multiple tabs sync session state

## 🔄 Migration Path

1. ✅ NextAuth configuration and OTP provider
2. ✅ Verify OTP page migration
3. ✅ Protected layout migration
4. ⚠️ API routes migration (in progress)
5. ⚠️ generatedClient migration (pending)
6. ⚠️ Optional: useAuth hook migration

## 📚 Next Steps

1. **Update API routes** to use NextAuth `auth()` function
2. **Update generatedClient** to get tokens from NextAuth session
3. **Test thoroughly** with real OTP flow
4. **Remove old cookie-based auth** once migration is complete
5. **Update documentation** for new authentication flow

## 🐛 Known Issues

- None currently

## 💡 Notes

- NextAuth v5 uses `auth()` function for server-side session access
- Client-side uses `useSession()` hook
- Tokens are stored in JWT, not cookies (more secure)
- Refresh token is never exposed to client
- Token refresh happens automatically in JWT callback

