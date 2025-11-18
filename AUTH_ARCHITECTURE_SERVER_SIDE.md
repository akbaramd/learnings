# معماری احراز هویت Server-Side

## 📋 خلاصه

سیستم احراز هویت به **Server-Side** تبدیل شد تا:
- ✅ Authentication در **server** چک شود (نه client)
- ✅ اطلاعات کاربر از **server** گرفته شود
- ✅ از **middleware** برای route protection استفاده شود
- ✅ **SSR** و **performance** بهتر شود

---

## 🏗️ معماری جدید

### Flow کلی

```
User Request
    ↓
Middleware (Server-Side)
    ├─→ Check cookies (accessToken/refreshToken)
    ├─→ Protected route + No cookies → Redirect to /login
    ├─→ Auth page + Has cookies → Redirect to /dashboard
    └─→ Allow access
    ↓
Root Layout (Server Component)
    ├─→ ServerAuthProvider
    │   ├─→ Check auth status (server-side)
    │   ├─→ Fetch user profile if authenticated
    │   └─→ Pass to AuthStateProvider (client)
    ↓
Page Render
```

---

## 🔧 کامپوننت‌های جدید

### 1. Middleware (`middleware.ts`)

**مسئولیت:**
- ✅ چک کردن cookies قبل از render صفحه
- ✅ Redirect کردن unauthenticated users از protected routes
- ✅ Redirect کردن authenticated users از auth pages
- ✅ اجازه دسترسی به public routes

**ویژگی‌ها:**
- Server-side execution (قبل از render)
- Performance بهتر (جلوگیری از render صفحات protected)
- SSR safe

**Protected Routes:**
```typescript
const protectedPaths = [
  '/dashboard',
  '/bills',
  '/profile',
  '/wallet',
  '/notifications',
  '/surveys',
  '/tours',
  '/facilities',
  '/admin',
];
```

---

### 2. ServerAuthProvider (`src/components/auth/ServerAuthProvider.tsx`)

**مسئولیت:**
- ✅ Server Component برای چک کردن authentication
- ✅ فراخوانی `/api/auth/session` و `/api/auth/me` در server
- ✅ دریافت اطلاعات کاربر از server
- ✅ Pass کردن state به client component

**ویژگی‌ها:**
- Server Component (no 'use client')
- Direct API calls (not HTTP fetch)
- SSR support

---

### 3. AuthStateProvider (`src/components/auth/AuthStateProvider.tsx`)

**مسئولیت:**
- ✅ Client Component برای sync کردن Redux state
- ✅ دریافت initial state از server
- ✅ به‌روزرسانی Redux با server state

**ویژگی‌ها:**
- Client Component (needs 'use client' for Redux)
- Syncs server state with client state
- Handles hydration

---

## 📝 تغییرات در Layout

### قبل (Client-Side)

```typescript
// app/layout.tsx
<AuthInitializer /> // Client component - checks auth in browser
```

### بعد (Server-Side)

```typescript
// app/layout.tsx
<ServerAuthProvider> // Server component - checks auth on server
  <ClientProviders>
    {children}
  </ClientProviders>
</ServerAuthProvider>
```

---

## 🔄 مقایسه با سیستم قبلی

### سیستم قبلی (Client-Side)
- ❌ `AuthInitializer` client component بود
- ❌ Authentication در browser چک می‌شد
- ❌ نیاز به hydration داشت
- ❌ Race condition بین middleware و client state

### سیستم جدید (Server-Side)
- ✅ `ServerAuthProvider` server component است
- ✅ Authentication در server چک می‌شود
- ✅ SSR support کامل
- ✅ No race condition (middleware + server check)

---

## 🎯 مزایا

### 1. Performance
- ✅ جلوگیری از render صفحات protected برای unauthenticated users
- ✅ Server-side check سریع‌تر از client-side
- ✅ کمتر hydration overhead

### 2. Security
- ✅ Authentication در server (امن‌تر)
- ✅ Cookies در server چک می‌شوند
- ✅ کمتر exposure در client

### 3. SSR Support
- ✅ Server-side rendering کامل
- ✅ SEO بهتر
- ✅ Initial load سریع‌تر

### 4. User Experience
- ✅ Redirect سریع‌تر (قبل از render)
- ✅ کمتر flash of content
- ✅ Smooth transitions

---

## 📊 Flow Diagram

```
┌─────────────────────────────────────────┐
│         User Request                     │
│    GET /dashboard                        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Middleware (Server)              │
│  ┌───────────────────────────────────┐  │
│  │ Check cookies:                     │  │
│  │ - accessToken?                    │  │
│  │ - refreshToken?                    │  │
│  └───────────────────────────────────┘  │
│                  │                        │
│    ┌─────────────┴─────────────┐         │
│    │                           │         │
│    ▼                           ▼         │
│  Has cookies              No cookies     │
│    │                           │         │
│    │                           ▼         │
│    │                    Redirect /login   │
│    │                           │         │
│    │                           └─────────┘
│    │
│    ▼
│  Allow access
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│      Root Layout (Server Component)      │
│  ┌───────────────────────────────────┐  │
│  │ ServerAuthProvider                 │  │
│  │  ├─→ Check /api/auth/session       │  │
│  │  ├─→ If authenticated:             │  │
│  │  │    └─→ Fetch /api/auth/me       │  │
│  │  └─→ Pass to AuthStateProvider     │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│    AuthStateProvider (Client Component)  │
│  ┌───────────────────────────────────┐  │
│  │ Sync Redux State:                  │  │
│  │  ├─→ setUser(user)                 │  │
│  │  ├─→ setAuthStatus('authenticated')│  │
│  │  └─→ setInitialized(true)           │  │
│  └───────────────────────────────────┘  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Page Render                    │
│    (Protected Layout + Content)         │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Benefits

### Server-Side Authentication
- ✅ Cookies در server چک می‌شوند (امن‌تر)
- ✅ کمتر exposure در client-side code
- ✅ جلوگیری از client-side manipulation

### Middleware Protection
- ✅ Route protection قبل از render
- ✅ جلوگیری از access به protected routes
- ✅ Performance بهتر

---

## 📝 فایل‌های تغییر یافته

### فایل‌های جدید:
1. `middleware.ts` - Server-side route protection
2. `src/components/auth/ServerAuthProvider.tsx` - Server component برای auth check
3. `src/components/auth/AuthStateProvider.tsx` - Client component برای Redux sync

### فایل‌های تغییر یافته:
1. `app/layout.tsx` - استفاده از ServerAuthProvider به جای AuthInitializer

### فایل‌های حذف شده (اختیاری):
- `src/components/auth/AuthInitializer.tsx` - دیگر استفاده نمی‌شود (می‌توان حذف کرد)

---

## 🎓 نحوه کار

### 1. Middleware Check (اولین خط دفاع)

```typescript
// middleware.ts
if (isProtectedPath(pathname) && !hasAuth) {
  return NextResponse.redirect('/login?r=' + pathname);
}
```

### 2. ServerAuthProvider (دومین خط دفاع)

```typescript
// ServerAuthProvider.tsx
const authState = await checkAuthStatus(); // Server-side
// Returns: { isAuthenticated: boolean, user: User | null }
```

### 3. AuthStateProvider (Sync با Redux)

```typescript
// AuthStateProvider.tsx
useEffect(() => {
  if (initialIsAuthenticated && initialUser) {
    dispatch(setUser(initialUser));
    dispatch(setAuthStatus('authenticated'));
  }
}, [initialIsAuthenticated, initialUser]);
```

---

## ✅ نتیجه

سیستم اکنون:
- ✅ **Server-Side Authentication** دارد
- ✅ **Middleware** برای route protection دارد
- ✅ **SSR Support** کامل دارد
- ✅ **Performance** بهتر دارد
- ✅ **Security** بهتر دارد

**Authentication در server انجام می‌شود و client فقط state را sync می‌کند.**

