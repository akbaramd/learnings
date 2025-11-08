# 🏗️ ساختار کامل Authentication - مستندات نهایی

## 📋 فهرست مطالب

1. [معماری کلی](#معماری-کلی)
2. [Middleware - نیاز یا حذف؟](#middleware---نیاز-یا-حذف)
3. [جریان‌های Authentication](#جریان‌های-authentication)
4. [لایه‌های امنیتی](#لایه‌های-امنیتی)
5. [State Management](#state-management)
6. [Token Management](#token-management)
7. [نقش هر Component](#نقش-هر-component)

---

## 🏛️ معماری کلی

### ساختار لایه‌ای

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   React UI   │  │  Redux Store │  │   Cookies    │      │
│  │  Components  │  │   (State)    │  │  (auth=1)    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│              Next.js App Router (BFF Layer)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Middleware  │  │  API Routes  │  │  Layouts     │      │
│  │  (Route      │  │  (BFF Proxy)  │  │  (Protected) │      │
│  │  Guard)      │  │               │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         generatedClient.ts (Axios Instance)          │   │
│  │  - Token Refresh Interceptor (Server-side)           │   │
│  │  - Cookie Management                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP Requests
┌─────────────────────────────────────────────────────────────┐
│              Upstream Backend API                            │
│  - Authentication Endpoints                                  │
│  - Protected Resources                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Middleware - نیاز یا حذف؟

### تحلیل Middleware فعلی

**فایل:** `middleware.ts`

**وظایف فعلی:**
1. ✅ Route Protection: چک می‌کند که آیا user برای protected routes authenticated است
2. ✅ Public Routes: اجازه دسترسی به `/public/*` بدون authentication
3. ✅ Telegram Bot Support: اجازه دسترسی به bot‌ها برای preview
4. ✅ Auth Pages Redirect: redirect authenticated users از `/login` و `/verify-otp` به dashboard

### ⚠️ مشکل: Redundancy با ProtectedLayout

**مشکل اصلی:**
- Middleware بر اساس **cookies** تصمیم می‌گیرد
- ProtectedLayout بر اساس **Redux state** و **`/api/auth/me`** تصمیم می‌گیرد
- این دو می‌توانند desync شوند → race condition

**مثال مشکل:**
```
1. User logout می‌کند
2. Cookies پاک می‌شوند (server-side)
3. Redux state هنوز authenticated است
4. Middleware: "no cookies" → redirect to login ✅
5. ProtectedLayout: "Redux authenticated" → اجازه دسترسی ❌
```

### ✅ راه‌حل: Middleware را نگه داریم اما ساده کنیم

**چرا Middleware نیاز است:**
1. **Early Protection**: قبل از render صفحه، route را protect می‌کند
2. **Performance**: جلوگیری از render صفحات protected برای unauthenticated users
3. **SSR Safety**: در SSR، Redux state ممکن است هنوز hydrate نشده باشد
4. **Telegram Bot**: نیاز به logic خاص برای bot‌ها

**چرا ProtectedLayout هم نیاز است:**
1. **Client-side Check**: بعد از hydration، Redux state را چک می‌کند
2. **Server-side Truth**: `/api/auth/me` را چک می‌کند (source of truth)
3. **Dynamic Redirects**: می‌تواند returnUrl را handle کند
4. **State Sync**: می‌تواند Redux را با server sync کند

### 🎯 توصیه: Middleware را نگه داریم اما بهبود دهیم

**بهبودهای پیشنهادی:**
1. Middleware فقط برای **early protection** استفاده شود
2. ProtectedLayout برای **client-side validation** و **state sync**
3. هر دو از **cookies** به عنوان source of truth استفاده کنند
4. Middleware فقط redirect کند، ProtectedLayout state را sync کند

---

## 🔄 جریان‌های Authentication

### 1. Login Flow

```
User enters national code
    ↓
POST /api/auth/login (sendOtp)
    ↓
Challenge ID stored in Redux
    ↓
User enters OTP
    ↓
POST /api/auth/verify-otp
    ↓
Server validates OTP
    ↓
Server sets cookies:
  - accessToken (15 min)
  - refreshToken (7 days)
  - auth=1 (7 days) ← SSR flag
    ↓
Redux: setAuthStatus('authenticated')
Redux: setUser(userData)
Redux: setInitialized(true)
    ↓
Redirect to returnUrl or /dashboard
```

**فایل‌های کلیدی:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/verify-otp/page.tsx`
- `app/api/auth/verify-otp/route.ts`
- `src/store/auth/auth.queries.ts`

---

### 2. Logout Flow

```
User clicks logout
    ↓
POST /api/auth/logout
    ↓
Server clears cookies:
  - accessToken (maxAge: 0)
  - refreshToken (maxAge: 0)
  - auth (maxAge: 0)
    ↓
Redux: clearUser()
Redux: setAuthStatus('anonymous')
Redux: setInitialized(true)
    ↓
ProtectedLayout detects anonymous
    ↓
Redirect to /login?logout=true
```

**فایل‌های کلیدی:**
- `app/(protected)/profile/logout-details/page.tsx`
- `app/api/auth/logout/route.ts`
- `src/store/auth/auth.queries.ts`
- `app/(protected)/layout.tsx`

---

### 3. Token Refresh Flow

```
Client makes request
    ↓
Server detects expired accessToken
    ↓
generatedClient.ts interceptor:
  - Reads refreshToken from cookies
  - Calls POST /auth/refresh
    ↓
Server validates refreshToken
    ↓
Server sets new cookies:
  - accessToken (new, 15 min)
  - refreshToken (new, 7 days)
    ↓
Server retries original request
    ↓
Server adds header: x-token-refreshed: true
    ↓
Client receives response
    ↓
baseApi.ts detects header
    ↓
Redux: dispatch(getMe.initiate())
    ↓
Redux state synced with server
```

**فایل‌های کلیدی:**
- `app/api/generatedClient.ts` (server-side interceptor)
- `src/store/api/baseApi.ts` (client-side detection)
- `app/api/auth/me/route.ts` (header forwarding)

---

### 4. Protected Route Access Flow

```
User navigates to /dashboard
    ↓
┌─────────────────────────────────────┐
│  MIDDLEWARE (Server-side)           │
│  - Checks cookies                   │
│  - If no cookies → redirect /login  │
│  - If cookies exist → allow         │
└─────────────────────────────────────┘
    ↓
Page renders
    ↓
┌─────────────────────────────────────┐
│  PROTECTED LAYOUT (Client-side)     │
│  1. Check auth cookie (auth=1)      │
│     → Set isInitialized = true      │
│  2. Check /api/auth/me              │
│     → If 401 → redirect /login      │
│     → If 200 → allow                │
│  3. If Redux not synced             │
│     → dispatch(getMe.initiate())    │
└─────────────────────────────────────┘
    ↓
Page content renders
```

**فایل‌های کلیدی:**
- `middleware.ts`
- `app/(protected)/layout.tsx`

---

## 🔐 لایه‌های امنیتی

### Layer 1: Middleware (Server-side, Early Protection)

**نقش:**
- اولین خط دفاع
- جلوگیری از render صفحات protected برای unauthenticated users
- Performance optimization

**چک می‌کند:**
- Cookies: `accessToken` یا `refreshToken` وجود دارد؟

**عمل می‌کند:**
- اگر cookies ندارند → redirect به `/login?r={pathname}`
- اگر cookies دارند → اجازه دسترسی

**محدودیت:**
- فقط cookies را چک می‌کند (نه validity)
- نمی‌تواند Redux state را sync کند
- نمی‌تواند dynamic redirects را handle کند

---

### Layer 2: ProtectedLayout (Client-side, Validation & Sync)

**نقش:**
- دومین خط دفاع
- Validation دقیق‌تر
- State synchronization
- Dynamic redirects

**چک می‌کند:**
1. Cookie `auth=1` → Set `isInitialized = true`
2. `/api/auth/me` endpoint → Server-side truth
3. Redux state → Client-side state

**عمل می‌کند:**
- اگر `/api/auth/me` → 401 → redirect به `/login?logout=true`
- اگر `/api/auth/me` → 200 → اجازه دسترسی
- اگر Redux not synced → trigger `getMe` to sync

**مزایا:**
- می‌تواند Redux state را sync کند
- می‌تواند dynamic redirects را handle کند
- می‌تواند returnUrl را manage کند

---

### Layer 3: API Routes (BFF Layer)

**نقش:**
- Proxy بین client و upstream backend
- Token refresh handling
- Cookie management

**عمل می‌کند:**
- هر request → check accessToken validity
- اگر expired → refresh token automatically
- Set/clear cookies based on auth state

**فایل کلیدی:**
- `app/api/generatedClient.ts`

---

### Layer 4: baseApi.ts (Client-side, 401 Handling)

**نقش:**
- آخرین خط دفاع
- Handle 401 errors
- Detect token refresh

**عمل می‌کند:**
- اگر 401 دریافت کرد → clear Redux state → redirect
- اگر `x-token-refreshed` header دید → sync Redux state

**فایل کلیدی:**
- `src/store/api/baseApi.ts`

---

## 📦 State Management

### Redux Store Structure

```typescript
interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'anonymous' | 'otp-sent';
  user: User | null;
  challengeId: string | null;
  maskedPhoneNumber: string | null;
  nationalCode: string | null;
  error: string | null;
  errorType: 'network' | 'validation' | 'server' | null;
  isInitialized: boolean; // ← Critical for isReady
}
```

### isReady Logic

```typescript
const isReady = authStatus !== 'idle' && isInitialized;
```

**چرا مهم است:**
- `isReady = false` → ProtectedLayout منتظر می‌ماند
- `isReady = true` → ProtectedLayout می‌تواند تصمیم بگیرد

**چگونه set می‌شود:**
1. Cookie `auth=1` → `isInitialized = true` (SSR hydration)
2. `getMe` query → `isInitialized = true` (after fetch)
3. Logout → `isInitialized = true` (after clear)

---

## 🍪 Token Management

### Cookie Structure

| Cookie | Type | MaxAge | Purpose |
|--------|------|--------|---------|
| `accessToken` | httpOnly | 15 min | API authentication |
| `refreshToken` | httpOnly | 7 days | Token refresh |
| `auth` | readable | 7 days | SSR hydration flag |

### Token Refresh Strategy

**Server-side (BFF):**
- `generatedClient.ts` interceptor
- Automatic refresh on 401
- Updates cookies automatically
- Adds `x-token-refreshed` header

**Client-side:**
- `baseApi.ts` detects header
- Triggers `getMe` to sync Redux
- No manual refresh needed

---

## 🧩 نقش هر Component

### 1. Middleware (`middleware.ts`)

**مسئولیت:**
- ✅ Early route protection
- ✅ Public routes handling
- ✅ Telegram bot support
- ✅ Auth pages redirect

**نباید:**
- ❌ State management
- ❌ Complex validation
- ❌ Dynamic redirects

---

### 2. ProtectedLayout (`app/(protected)/layout.tsx`)

**مسئولیت:**
- ✅ Client-side validation
- ✅ State synchronization
- ✅ Dynamic redirects
- ✅ ReturnUrl handling

**عمل می‌کند:**
- Check `/api/auth/me` (server-side truth)
- Sync Redux state if needed
- Redirect based on auth status

---

### 3. API Routes (BFF Layer)

**مسئولیت:**
- ✅ Proxy requests to upstream
- ✅ Token refresh handling
- ✅ Cookie management
- ✅ Error handling

**فایل‌های کلیدی:**
- `app/api/auth/login/route.ts`
- `app/api/auth/verify-otp/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/generatedClient.ts`

---

### 4. Redux Store

**مسئولیت:**
- ✅ Client-side state management
- ✅ Query caching
- ✅ State synchronization

**فایل‌های کلیدی:**
- `src/store/auth/auth.slice.ts`
- `src/store/auth/auth.queries.ts`
- `src/store/api/baseApi.ts`
- `src/hooks/useAuth.ts`

---

## ✅ توصیه نهایی: Middleware را نگه داریم

### چرا؟

1. **Performance**: جلوگیری از render صفحات protected
2. **SSR Safety**: در SSR، Redux state ممکن است hydrate نشده باشد
3. **Early Protection**: اولین خط دفاع
4. **Telegram Bot**: نیاز به logic خاص

### اما باید:

1. **ساده بماند**: فقط cookies را چک کند
2. **با ProtectedLayout هماهنگ باشد**: هر دو از cookies استفاده کنند
3. **Fallback داشته باشد**: اگر middleware fail شد، ProtectedLayout handle کند

---

## 🎯 ساختار نهایی پیشنهادی

```
┌─────────────────────────────────────────────────────────┐
│  User Request                                            │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  MIDDLEWARE (First Check)                                │
│  - Check cookies                                         │
│  - If no cookies → redirect /login                      │
│  - If cookies exist → allow                             │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  Page Renders                                            │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  PROTECTED LAYOUT (Second Check)                         │
│  1. Check auth cookie → Set isInitialized               │
│  2. Check /api/auth/me → Server-side truth              │
│  3. If Redux not synced → Sync                          │
│  4. If 401 → Redirect /login                            │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│  Page Content Renders                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 خلاصه

### Middleware: ✅ نگه داریم

**نقش:**
- Early protection
- Performance optimization
- SSR safety

**محدودیت:**
- فقط cookies را چک می‌کند
- نمی‌تواند state sync کند

### ProtectedLayout: ✅ نگه داریم

**نقش:**
- Client-side validation
- State synchronization
- Dynamic redirects

**مزایا:**
- می‌تواند Redux sync کند
- می‌تواند `/api/auth/me` را چک کند

### نتیجه:

**هر دو نیاز هستند** اما با نقش‌های متفاوت:
- Middleware: **Early protection** (server-side)
- ProtectedLayout: **Validation & sync** (client-side)

این دو لایه با هم یک سیستم امنیتی قوی و قابل اعتماد ایجاد می‌کنند.

