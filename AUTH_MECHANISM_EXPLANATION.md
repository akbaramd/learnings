# 🔐 Authentication Mechanism - Complete Explanation

## 📋 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [State Management](#state-management)
3. [Login Flow](#login-flow)
4. [Logout Flow](#logout-flow)
5. [Token Refresh Mechanism](#token-refresh-mechanism)
6. [Route Protection](#route-protection)
7. [Components & Hooks](#components--hooks)
8. [API Routes](#api-routes)

---

## 🏗️ Architecture Overview

### **Three-Layer Authentication System**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │   Layouts    │  │   Hooks      │      │
│  │  (login.tsx) │  │ (layout.tsx) │  │ (useAuth.ts) │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │   Redux Store   │                        │
│                  │  (auth.slice.ts) │                        │
│                  └────────┬────────┘                        │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│              BFF LAYER (Next.js API Routes)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/auth/*  │  │ Middleware   │  │ generated    │      │
│  │  (BFF)       │  │ (route.ts)   │  │ Client       │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────┐
│              UPSTREAM LAYER (Backend API)                    │
│         https://account.wa-nezam.org/api/*                  │
└──────────────────────────────────────────────────────────────┘
```

### **Key Components**

1. **Client Layer**: React components, hooks, Redux store
2. **BFF Layer**: Next.js API routes (Backend-for-Frontend pattern)
3. **Upstream Layer**: External backend API

---

## 📦 State Management

### **Redux Auth Slice** (`auth.slice.ts`)

#### **State Structure**
```typescript
interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error' | 'otp-sent';
  user: User | null;
  challengeId: string | null;        // For OTP flow
  maskedPhoneNumber: string | null;  // For OTP display
  nationalCode: string | null;       // For resending OTP
  error: string | null;
  errorType: AuthErrorType | null;
  isInitialized: boolean;             // Critical: determines isReady
}
```

#### **Key Actions**
- `setUser(user)`: Sets user data, status → 'authenticated'
- `clearUser()`: Clears user, status → 'anonymous'
- `setAuthStatus(status)`: Changes auth status
- `setAnonymous()`: Sets status to 'anonymous', clears all data
- `setInitialized(true)`: Marks auth as initialized (enables isReady)
- `setChallengeId(id)`: Stores OTP challenge ID
- `clearChallengeId()`: Clears OTP data

#### **Status Flow**
```
idle → loading → otp-sent → authenticated
  ↓       ↓          ↓            ↓
anonymous ←──────────┴────────────┘
  ↑
  └── (on logout/error)
```

---

## 🔑 Login Flow

### **Step-by-Step Process**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER VISITS /login                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. MIDDLEWARE CHECK (middleware.ts)                          │
│    - If has cookies → redirect to /dashboard                 │
│    - If logout=true → allow access                           │
│    - If no cookies → allow access                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. LOGIN PAGE (login/page.tsx)                              │
│    - useAuth() hook checks isAuthenticated                  │
│    - If authenticated → redirect to dashboard               │
│    - If logout flow → set status to 'anonymous'             │
│    - User enters national code                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SEND OTP (auth.queries.ts)                               │
│    POST /api/auth/login                                      │
│    Body: { nationalCode: "1234567890" }                     │
│                                                              │
│    BFF Route: app/api/auth/login/route.ts                   │
│    - Calls upstream: POST /auth/login                        │
│    - Returns: { challengeId, maskedPhoneNumber }            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. REDUX STATE UPDATE (auth.queries.ts onQueryStarted)      │
│    - dispatch(setChallengeId(challengeId))                  │
│    - dispatch(setMaskedPhoneNumber(maskedPhone))            │
│    - dispatch(setNationalCode(nationalCode))                 │
│    - dispatch(setAuthStatus('otp-sent'))                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. AUTO REDIRECT (login/page.tsx useEffect)                 │
│    - Detects challengeId && authStatus === 'otp-sent'       │
│    - Redirects to: /verify-otp?r={returnUrl}&logout={flag}  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. VERIFY OTP PAGE (verify-otp/page.tsx)                    │
│    - Shows masked phone number                              │
│    - User enters 6-digit OTP                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. VERIFY OTP (auth.queries.ts)                              │
│    POST /api/auth/verify-otp                                 │
│    Body: { challengeId, otpCode }                           │
│                                                              │
│    BFF Route: app/api/auth/verify-otp/route.ts               │
│    - Calls upstream: POST /auth/verify-otp                   │
│    - Server sets cookies: accessToken, refreshToken          │
│    - Returns: { userId, isSuccess: true }                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. REDUX STATE UPDATE (auth.queries.ts onQueryStarted)      │
│    - dispatch(clearChallengeId())                            │
│    - dispatch(setAuthStatus('authenticated'))               │
│    - dispatch(authApi.endpoints.getMe.initiate())           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. FETCH USER PROFILE (auth.queries.ts)                     │
│     GET /api/auth/me                                         │
│     - BFF calls upstream: GET /auth/me                      │
│     - Returns: { id, name, roles, ... }                     │
│     - dispatch(setUser(userProfile))                        │
│     - dispatch(setInitialized(true))                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. REDIRECT (verify-otp/page.tsx)                          │
│     - safeResolveReturnUrl() determines destination:        │
│       * If logout=true → /dashboard                          │
│       * If returnUrl exists → returnUrl                      │
│       * Otherwise → /dashboard                               │
│     - router.replace(redirectTo)                             │
└─────────────────────────────────────────────────────────────┘
```

### **Key Files in Login Flow**

1. **`app/(auth)/login/page.tsx`**
   - Handles national code input
   - Validates national code format
   - Calls `sendOtpMutation`
   - Redirects to verify-otp when OTP sent

2. **`app/(auth)/verify-otp/page.tsx`**
   - Handles OTP input
   - Calls `verifyOtpMutation`
   - Redirects after successful verification

3. **`src/store/auth/auth.queries.ts`**
   - `sendOtp`: Mutation to send OTP
   - `verifyOtp`: Mutation to verify OTP
   - `getMe`: Query to fetch user profile
   - All mutations update Redux state via `onQueryStarted`

4. **`app/api/auth/login/route.ts`** (BFF)
   - Proxies request to upstream
   - Returns `ApplicationResult<SendOtpData>`

5. **`app/api/auth/verify-otp/route.ts`** (BFF)
   - Proxies request to upstream
   - Forwards cookies from upstream response
   - Returns `ApplicationResult<VerifyOtpData>`

---

## 🚪 Logout Flow

### **Step-by-Step Process**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS LOGOUT (logout-details/page.tsx)             │
│    handleLogout() called                                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. CLEAR LOCAL STATE FIRST (logout-details/page.tsx)        │
│    - dispatch(clearUser())                                   │
│    - dispatch(clearChallengeId())                            │
│    - dispatch(setAnonymous())                                │
│    - Status → 'anonymous'                                    │
│    - This triggers ProtectedLayout to detect change         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CALL LOGOUT API (if authenticated)                        │
│    POST /api/auth/logout                                     │
│    Body: { refreshToken: undefined }                        │
│                                                              │
│    BFF Route: app/api/auth/logout/route.ts                   │
│    - Gets tokens from cookies                                │
│    - If no tokens → return success (already logged out)      │
│    - Calls upstream: POST /auth/logout                       │
│    - Clears cookies: maxAge: 0                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. REDUX STATE UPDATE (auth.queries.ts onQueryStarted)      │
│    - dispatch(clearUser())                                   │
│    - dispatch(clearChallengeId())                           │
│    - dispatch(setAuthStatus('anonymous'))                   │
│    - Status is now 'anonymous'                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PROTECTED LAYER DETECTS CHANGE (layout.tsx)              │
│    useEffect([isAuthenticated, isReady, authStatus])        │
│    - Detects authStatus === 'anonymous'                      │
│    - Even if isReady is false, redirects immediately        │
│    - window.location.href = '/login?logout=true&r={path}'    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. MIDDLEWARE CHECK (middleware.ts)                          │
│    - Sees logout=true query param                            │
│    - Allows access to /login even if cookies exist          │
│    - This prevents redirect loop                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. LOGIN PAGE (login/page.tsx)                              │
│    - Detects logout=true                                     │
│    - Sets status to 'anonymous' if needed                    │
│    - User can login again                                    │
│    - After login, redirects to /dashboard (not returnUrl)   │
└─────────────────────────────────────────────────────────────┘
```

### **Key Files in Logout Flow**

1. **`app/(protected)/profile/logout-details/page.tsx`**
   - Logout UI page
   - Clears local state first
   - Calls logout API
   - Has fallback redirect with setTimeout

2. **`app/(protected)/layout.tsx`**
   - Monitors `authStatus` changes
   - Redirects to login when `authStatus === 'anonymous'`
   - Prioritizes `authStatus` over `isReady` for immediate redirect

3. **`src/store/auth/auth.queries.ts`**
   - `logout`: Mutation to logout
   - Clears state in `onQueryStarted`

4. **`app/api/auth/logout/route.ts`** (BFF)
   - Handles logout on server
   - Clears cookies
   - Returns success even if already logged out

5. **`middleware.ts`**
   - Allows access to `/login` if `logout=true`
   - Prevents redirect loops

---

## 🔄 Token Refresh Mechanism

### **Server-Side Token Refresh**

```
┌─────────────────────────────────────────────────────────────┐
│ IMPORTANT: Token refresh is ENTIRELY server-side             │
│ No client-side refresh token handling needed                 │
└─────────────────────────────────────────────────────────────┘
```

### **How It Works**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT MAKES REQUEST                                      │
│    GET /api/wallets/balance                                  │
│    - Cookies: accessToken, refreshToken                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BFF ROUTE (app/api/wallets/balance/route.ts)             │
│    - Uses createApiInstance(req)                            │
│    - Generated client automatically includes cookies          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GENERATED CLIENT (generatedClient.ts)                     │
│    - Axios interceptor detects 401                           │
│    - Automatically calls POST /auth/refresh                  │
│    - If refresh succeeds → retries original request         │
│    - If refresh fails → returns 401                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CLIENT RECEIVES RESPONSE                                  │
│    - If 200: Request succeeded (token refreshed)            │
│    - If 401: Refresh failed → logout                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. BASE QUERY HANDLES 401 (baseApi.ts)                       │
│    - Detects 401 or token refresh failure                    │
│    - dispatch(clearUser())                                   │
│    - dispatch(setAnonymous())                                │
│    - dispatch(setInitialized(true))                          │
│    - Layout detects change → redirects to login             │
└─────────────────────────────────────────────────────────────┘
```

### **Key Files**

1. **`app/api/generatedClient.ts`**
   - Axios instance with interceptors
   - Automatically refreshes token on 401
   - Retries original request after refresh

2. **`src/store/api/baseApi.ts`**
   - `baseQueryWithReauth`: RTK Query base query
   - Detects 401 errors
   - Clears user state and sets anonymous

---

## 🛡️ Route Protection

### **Middleware** (`middleware.ts`)

#### **Protected Routes**
```typescript
const protectedPaths = [
  '/dashboard',
  '/bills',
  '/profile',
  '/wallet',
  '/notifications',
  '/surveys',      // Protected surveys
  '/tours',
  '/facilities',
  '/admin',
];
```

#### **Logic Flow**
```
Request → Middleware
    │
    ├─→ Public route (/public/*) → Allow
    │
    ├─→ API route (/api/*) → Allow
    │
    ├─→ Protected route + No cookies → Redirect to /login?r={path}
    │
    ├─→ Auth page (/login, /verify-otp) + Has cookies + No logout=true
    │   → Redirect to /dashboard or returnUrl
    │
    └─→ Auth page + logout=true → Allow (logout flow)
```

### **Protected Layout** (`app/(protected)/layout.tsx`)

#### **Protection Logic**
```typescript
useEffect(() => {
  // Priority 1: Check authStatus (works even if isReady is false)
  if (authStatus === 'anonymous') {
    window.location.href = `/login?logout=true&r=${returnUrl}`;
    return;
  }
  
  // Priority 2: Wait for auth to be ready
  if (!isReady) {
    return; // Wait...
  }
  
  // Priority 3: Check authentication
  if (!isAuthenticated) {
    window.location.href = `/login?logout=true&r=${returnUrl}`;
    return;
  }
  
  // User is authenticated, allow access
}, [isAuthenticated, isReady, authStatus]);
```

#### **Why This Order?**
- `authStatus === 'anonymous'` check first: Handles logout immediately
- `isReady` check second: Prevents premature redirects during initialization
- `isAuthenticated` check last: Final authentication check

---

## 🎣 Components & Hooks

### **useAuth Hook** (`src/hooks/useAuth.ts`)

#### **What It Provides**
```typescript
const {
  // State
  authStatus,        // 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'error' | 'otp-sent'
  isAuthenticated,  // boolean
  isLoading,        // boolean
  isReady,          // boolean (isInitialized && !isLoading)
  user,             // User | null
  userId,           // string | null
  userName,         // string | null
  roles,            // UserRole[]
  challengeId,      // string | null
  maskedPhone,      // string | null
  error,            // string | null
  
  // API Methods
  sendOtp,          // (nationalCode) => Promise
  verifyOtp,         // (challengeId, otpCode) => Promise
  logout,            // () => Promise
  refreshToken,      // () => Promise
  
  // Utility Methods
  resetAuthState,   // () => void
  forceAnonymous,   // () => void
  clearAuthError,   // () => void
} = useAuth();
```

#### **Key Selectors Used**
- `selectAuthStatus`: Current auth status
- `selectIsAuthenticated`: `status === 'authenticated'`
- `selectAuthReady`: `isInitialized && !isLoading`
- `selectUser`: User data
- `selectChallengeId`: OTP challenge ID

### **Auth Queries** (`src/store/auth/auth.queries.ts`)

#### **Mutations**
1. **`sendOtp`**
   - Endpoint: `POST /api/auth/login`
   - Updates: `challengeId`, `maskedPhoneNumber`, `nationalCode`
   - Sets status: `'otp-sent'`

2. **`verifyOtp`**
   - Endpoint: `POST /api/auth/verify-otp`
   - Clears: `challengeId`
   - Sets status: `'authenticated'`
   - Triggers: `getMe` query

3. **`logout`**
   - Endpoint: `POST /api/auth/logout`
   - Clears: `user`, `challengeId`
   - Sets status: `'anonymous'`

#### **Queries**
1. **`getMe`**
   - Endpoint: `GET /api/auth/me`
   - Updates: `user` data
   - Sets: `isInitialized = true`
   - Sets status: `'authenticated'`

2. **`validateNationalCode`**
   - Endpoint: `POST /api/auth/validate-national-code`
   - Validates national code format and existence

---

## 🔌 API Routes (BFF Pattern)

### **Structure**
All API routes follow Backend-for-Frontend (BFF) pattern:

```
Client → /api/auth/login → Upstream: /auth/login
Client → /api/auth/verify-otp → Upstream: /auth/verify-otp
Client → /api/auth/logout → Upstream: /auth/logout
Client → /api/auth/me → Upstream: /auth/me
```

### **Common Pattern**
```typescript
// app/api/auth/[endpoint]/route.ts
export async function POST(req: NextRequest) {
  try {
    // 1. Get API instance (uses UPSTREAM_API_BASE_URL)
    const api = createApiInstance(req);
    
    // 2. Call upstream API
    const upstream = await api.api.upstreamMethod({ ... });
    
    // 3. Transform to ApplicationResult<T>
    const response: ResponseType = {
      isSuccess: !!upstream.data?.data,
      message: upstream.data?.message || 'Success',
      errors: upstream.data?.errors || undefined,
      data: upstream.data?.data || undefined
    };
    
    // 4. Create response with headers
    const res = NextResponse.json(response, { status: upstream.status ?? 200 });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    
    // 5. Forward upstream cookies
    const setCookie = upstream.headers?.['set-cookie'];
    if (setCookie) {
      if (Array.isArray(setCookie)) {
        setCookie.forEach(c => res.headers.append('set-cookie', c));
      } else {
        res.headers.set('set-cookie', setCookie as string);
      }
    }
    
    return res;
  } catch (error) {
    return handleApiError(error as AxiosError);
  }
}
```

### **Key Routes**

1. **`app/api/auth/login/route.ts`**
   - POST `/api/auth/login`
   - Calls: `POST /auth/login` (upstream)
   - Returns: `ApplicationResult<SendOtpData>`

2. **`app/api/auth/verify-otp/route.ts`**
   - POST `/api/auth/verify-otp`
   - Calls: `POST /auth/verify-otp` (upstream)
   - Forwards cookies from upstream
   - Returns: `ApplicationResult<VerifyOtpData>`

3. **`app/api/auth/logout/route.ts`**
   - POST `/api/auth/logout`
   - Calls: `POST /auth/logout` (upstream)
   - Clears cookies: `maxAge: 0`
   - Returns: `ApplicationResult<LogoutData>`

4. **`app/api/auth/me/route.ts`**
   - GET `/api/auth/me`
   - Calls: `GET /auth/me` (upstream)
   - Returns: `ApplicationResult<UserProfile>`

---

## 🔍 Critical State Transitions

### **isReady Logic**
```typescript
isReady = isInitialized && !isLoading
```

**Why isReady is Critical:**
- `ProtectedLayout` waits for `isReady` before checking authentication
- Prevents premature redirects during initialization
- `isInitialized` is set to `true` when:
  - `getMe` query completes (success or error)
  - `baseQueryWithReauth` detects 401 and sets it explicitly

### **Status Priority in ProtectedLayout**
```typescript
// Priority order:
1. authStatus === 'anonymous' → Redirect immediately (even if !isReady)
2. !isReady → Wait
3. !isAuthenticated → Redirect
```

**Why This Order?**
- Logout can happen before `isReady` becomes `true`
- Checking `authStatus === 'anonymous'` first handles this case
- Ensures logout redirects work in production

---

## 🐛 Common Issues & Solutions

### **Issue 1: Logout Not Redirecting**
**Problem:** After logout, user stays on page or redirects to dashboard

**Solution:**
- Clear local state first: `dispatch(setAnonymous())`
- Set `isInitialized = true` in `baseApi.ts` when 401 detected
- Check `authStatus === 'anonymous'` before `isReady` in layout

### **Issue 2: Login Redirects to Dashboard When Should Go to Survey**
**Problem:** User clicks login on survey page, but redirects to dashboard

**Solution:**
- Pass `returnUrl` in query params: `/login?r=/surveys/123`
- Use `safeResolveReturnUrl()` to validate and use returnUrl
- If `logout=true`, always redirect to dashboard (not returnUrl)

### **Issue 3: Token Refresh Fails But User Stays Logged In**
**Problem:** 401 errors don't trigger logout

**Solution:**
- `baseQueryWithReauth` detects 401 and token refresh failures
- Automatically clears user state and sets anonymous
- Layout detects change and redirects

---

## 📝 Summary

### **Login Flow**
1. User enters national code → `sendOtp` → Get `challengeId`
2. Redirect to verify-otp → User enters OTP → `verifyOtp`
3. Server sets cookies → Fetch user profile → Redirect to dashboard

### **Logout Flow**
1. Clear local state → `setAnonymous()`
2. Call logout API → Clear cookies
3. Layout detects `authStatus === 'anonymous'` → Redirect to login

### **Token Refresh**
- Entirely server-side in `generatedClient.ts`
- Client only sees 401 if refresh fails
- `baseQueryWithReauth` handles 401 → Logout

### **Route Protection**
- Middleware: Checks cookies, redirects unauthenticated users
- ProtectedLayout: Monitors auth state, redirects on logout
- Priority: `authStatus` > `isReady` > `isAuthenticated`

---

## 🎯 Key Takeaways

1. **State Management**: Redux store holds all auth state
2. **BFF Pattern**: All API calls go through Next.js API routes
3. **Server-Side Refresh**: Token refresh is automatic and transparent
4. **Status Priority**: `authStatus` check before `isReady` for logout
5. **Cookie-Based**: Tokens stored in httpOnly cookies
6. **Type Safety**: All responses use `ApplicationResult<T>` structure

---

**Last Updated:** Based on current codebase implementation

