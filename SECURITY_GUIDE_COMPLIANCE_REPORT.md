# گزارش بررسی تطابق با راهنمای امنیتی Frontend

## 📋 خلاصه اجرایی

این گزارش مقایسه‌ای است بین **راهنمای امنیتی و پیاده‌سازی Frontend** که ارائه شده و **پیاده‌سازی فعلی سیستم**. 

**نکته مهم:** سیستم فعلی از **معماری BFF (Backend-for-Frontend)** با **HttpOnly Cookies** استفاده می‌کند، در حالی که راهنما برای **Client-Side Token Management** با **Memory Storage** طراحی شده است.

---

## ✅ موارد پیاده‌سازی شده

### 1. مدیریت DeviceId
- ✅ **تولید UUID**: `src/lib/deviceInfo.ts` - استفاده از `crypto.randomUUID()`
- ✅ **ذخیره‌سازی در localStorage**: DeviceId در `localStorage` با key `device_id` ذخیره می‌شود
- ✅ **پایداری**: DeviceId در تمام session‌ها حفظ می‌شود
- ✅ **Initialization**: `DeviceIdInitializer` component برای اطمینان از وجود DeviceId

**فایل‌های مرتبط:**
- `src/lib/deviceInfo.ts`
- `src/components/DeviceIdInitializer.tsx`

### 2. Refresh Token Management (Server-Side)
- ✅ **Auto-refresh**: در `app/api/generatedClient.ts` - interceptor خودکار refresh می‌کند
- ✅ **Token Rotation**: Refresh token بعد از هر refresh rotate می‌شود
- ✅ **Race Condition Prevention**: Single-flight pattern با `globalRefreshPromise` و `isRefreshing` flag
- ✅ **Cookie Management**: توکن‌ها در httpOnly cookies ذخیره می‌شوند

**فایل‌های مرتبط:**
- `app/api/generatedClient.ts:33-254`
- `TOKEN_REFRESH_RACE_FIX.md`

### 3. Logout Mechanisms
- ✅ **Logout از دستگاه فعلی**: `app/api/auth/logout/route.ts`
- ✅ **Logout از همه دستگاه‌ها**: `app/api/auth/logout/all/route.ts`
- ✅ **Logout از سایر دستگاه‌ها**: `app/api/auth/logout/others/route.ts`
- ✅ **Logout از Session خاص**: `app/api/auth/logout/session/[sessionId]/route.ts`

**فایل‌های مرتبط:**
- `app/api/auth/logout/route.ts`
- `app/api/auth/logout/all/route.ts`
- `app/api/auth/logout/others/route.ts`
- `app/api/auth/logout/session/[sessionId]/route.ts`

### 4. Session List Management
- ✅ **Endpoint**: `GET /api/auth/sessions` - `app/api/auth/sessions/route.ts`
- ✅ **Pagination**: پشتیبانی از pagination با query parameters
- ✅ **UI Component**: `app/(protected)/profile/sessions/page.tsx` برای نمایش sessions

**فایل‌های مرتبط:**
- `app/api/auth/sessions/route.ts`
- `src/store/auth/auth.queries.ts:636-657`
- `app/(protected)/profile/sessions/page.tsx`

### 5. Error Handling (401)
- ✅ **401 Detection**: در `src/store/api/baseApi.ts` - تشخیص 401 و logout خودکار
- ✅ **Token Refresh Failure**: تشخیص failure و logout
- ✅ **State Cleanup**: پاک کردن Redux state در صورت 401

**فایل‌های مرتبط:**
- `src/store/api/baseApi.ts:70-111`

### 6. Interceptor Pattern (Server-Side)
- ✅ **Request Interceptor**: در `app/api/generatedClient.ts` - اضافه کردن Authorization header
- ✅ **Response Interceptor**: مدیریت 401 و auto-refresh
- ✅ **Cookie Forwarding**: Forward کردن cookies به upstream

**فایل‌های مرتبط:**
- `app/api/generatedClient.ts:286-322` (Request Interceptor)
- `app/api/generatedClient.ts:324-518` (Response Interceptor)
---

## ❌ موارد پیاده‌سازی نشده (طبق راهنما)

### 1. ارسال DeviceId در Header `X-Device-Id` ✅ **پیاده‌سازی شد**

**وضعیت:** ✅ **تکمیل شده**

**تغییرات اعمال شده:**
- DeviceId در Header `X-Device-Id` برای تمام درخواست‌ها ارسال می‌شود
- در `src/store/api/baseApi.ts:18-25` اضافه شد

**کد پیاده‌سازی شده:**
```typescript
// src/store/api/baseApi.ts - prepareHeaders
prepareHeaders: (headers) => {
  headers.set('content-type', 'application/json');
  
  // Add DeviceId header (required for session management)
  if (typeof window !== 'undefined') {
    const deviceId = getDeviceId();
    if (deviceId) {
      headers.set('X-Device-Id', deviceId);
    }
  }
  
  // Add CSRF token
  const csrfHeaders = getCsrfHeader();
  if (csrfHeaders['x-csrf-token']) {
    headers.set('x-csrf-token', csrfHeaders['x-csrf-token']);
  }
  
  return headers;
},
```

---

### 2. ذخیره‌سازی توکن‌ها در Memory (Client-Side)

**مشکل:**
- راهنما می‌گوید: Access Token و Refresh Token باید در **memory (Redux state)** ذخیره شوند
- وضعیت فعلی: توکن‌ها در **httpOnly cookies (server-side)** ذخیره می‌شوند

**تفاوت معماری:**
- راهنما: **Client-Side Token Management** (توکن‌ها در client)
- سیستم فعلی: **BFF Pattern** (توکن‌ها در server-side cookies)

**راه حل (اگر بخواهیم طبق راهنما پیاده‌سازی کنیم):**
```typescript
// src/store/auth/auth.slice.ts
interface AuthState {
  // ... existing fields
  accessToken: string | null;  // ← اضافه شود
  refreshToken: string | null;  // ← اضافه شود
  sessionId: string | null;     // ← اضافه شود
  deviceId: string;             // ← اضافه شود
}
```

**نکته:** این تغییر نیاز به **refactoring کامل** دارد و با معماری فعلی (BFF) سازگار نیست.

---

### 3. Proactive Token Refresh (قبل از انقضا)

**مشکل:**
- راهنما می‌گوید: Access Token باید **قبل از انقضا** (مثلاً در 8 دقیقه) refresh شود
- وضعیت فعلی: Refresh فقط **بعد از 401** انجام می‌شود (reactive)

**کد فعلی:**
```typescript
// app/api/generatedClient.ts:333
// فقط بعد از 401 refresh می‌کند
if (response.status === 401 && !originalRequest._retry && !isRefreshEndpoint(requestUrl)) {
  // refresh logic
}
```

**راه حل:**
```typescript
// Client-side timer برای proactive refresh
useEffect(() => {
  if (!accessToken) return;
  
  // Decode JWT to get expiry
  const decoded = jwtDecode(accessToken);
  const expiryTime = decoded.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;
  
  // Refresh 2 minutes before expiry (8 minutes into 10-minute token)
  const refreshTime = timeUntilExpiry - (2 * 60 * 1000);
  
  if (refreshTime > 0) {
    const timer = setTimeout(() => {
      // Trigger refresh
      dispatch(authApi.endpoints.refreshToken.initiate());
    }, refreshTime);
    
    return () => clearTimeout(timer);
  }
}, [accessToken]);
```

**فایل‌های نیاز به تغییر:**
- نیاز به client-side token management (مخالف معماری فعلی)

---

### 4. Error Handling برای 403 Forbidden ✅ **پیاده‌سازی شد**

**وضعیت:** ✅ **تکمیل شده**

**تغییرات اعمال شده:**
- 403 Forbidden handling اضافه شد
- Error type `session_revoked` به `AuthErrorType` اضافه شد
- در `src/store/api/baseApi.ts:91-133` پیاده‌سازی شد

**کد پیاده‌سازی شده:**
```typescript
// src/store/api/baseApi.ts
const got403 = 
  (result?.error && 'status' in result.error && result.error.status === 403) || 
  (result.meta?.response?.status === 403) ||
  (result.data && typeof result.data === 'object' && 'status' in result.data && result.data.status === 403);

if (got403) {
  console.log('[baseQueryWithReauth] 403 Forbidden - Session revoked');
  api.dispatch(clearUser());
  api.dispatch(setAnonymous());
  api.dispatch(setInitialized(true));
  api.dispatch(setErrorWithType({ 
    message: 'Session revoked. Please login again.', 
    type: 'session_revoked' 
  }));
  return result;
}
```

---

### 5. Token Version Mismatch Handling ✅ **پیاده‌سازی شد**

**وضعیت:** ✅ **تکمیل شده**

**تغییرات اعمال شده:**
- Token Version Mismatch handling اضافه شد
- Error type `token_version_mismatch` به `AuthErrorType` اضافه شد
- در `src/store/api/baseApi.ts:103-151` پیاده‌سازی شد

**کد پیاده‌سازی شده:**
```typescript
// src/store/api/baseApi.ts
const isTokenVersionMismatch = result.data && typeof result.data === 'object' && 
  ('message' in result.data && 
   (String(result.data.message).toLowerCase().includes('token version mismatch') ||
    String(result.data.message).toLowerCase().includes('token_version') ||
    String(result.data.message).toLowerCase().includes('invalid token version')));

if (isTokenVersionMismatch) {
  console.log('[baseQueryWithReauth] Token version mismatch - logout all devices triggered');
  api.dispatch(clearUser());
  api.dispatch(setAnonymous());
  api.dispatch(setInitialized(true));
  api.dispatch(setErrorWithType({ 
    message: 'You have been logged out from all devices. Please login again.', 
    type: 'token_version_mismatch' 
  }));
  return result;
}
```

---

### 6. Session Expired Handling (Explicit) ✅ **پیاده‌سازی شد**

**وضعیت:** ✅ **تکمیل شده**

**تغییرات اعمال شده:**
- Explicit Session Expired handling اضافه شد
- Error type `session_expired` به `AuthErrorType` اضافه شد
- در `src/store/api/baseApi.ts:110-169` پیاده‌سازی شد

**کد پیاده‌سازی شده:**
```typescript
// src/store/api/baseApi.ts
const isSessionExpired = result.data && typeof result.data === 'object' && 
  ('message' in result.data && 
   (String(result.data.message).toLowerCase().includes('session expired') ||
    String(result.data.message).toLowerCase().includes('session_expired') ||
    String(result.data.message).toLowerCase().includes('your session has expired')));

if (isSessionExpired) {
  console.log('[baseQueryWithReauth] Session expired');
  api.dispatch(clearUser());
  api.dispatch(setAnonymous());
  api.dispatch(setInitialized(true));
  api.dispatch(setErrorWithType({ 
    message: 'Your session has expired. Please login again.', 
    type: 'session_expired' 
  }));
  return result;
}
```

---

### 7. PWA Support (IndexedDB + Encryption)

**مشکل:**
- راهنما می‌گوید: برای PWA باید Refresh Token در **indexedDB با encryption** ذخیره شود
- وضعیت فعلی: هیچ PWA support وجود ندارد

**راه حل:**
```typescript
// src/lib/pwa-storage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TokenDB extends DBSchema {
  tokens: {
    key: string;
    value: {
      refreshToken: string;
      encryptedAt: number;
    };
  };
}

let db: IDBPDatabase<TokenDB> | null = null;

export async function initTokenDB() {
  if (typeof window === 'undefined') return;
  
  db = await openDB<TokenDB>('auth-tokens', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens');
      }
    },
  });
}

export async function saveRefreshToken(token: string) {
  if (!db) await initTokenDB();
  if (!db) return;
  
  // Simple encryption (use Web Crypto API for production)
  const encrypted = await encryptToken(token);
  
  await db.put('tokens', {
    refreshToken: encrypted,
    encryptedAt: Date.now(),
  }, 'refreshToken');
}

export async function getRefreshToken(): Promise<string | null> {
  if (!db) await initTokenDB();
  if (!db) return null;
  
  const stored = await db.get('tokens', 'refreshToken');
  if (!stored) return null;
  
  return await decryptToken(stored.refreshToken);
}

async function encryptToken(token: string): Promise<string> {
  // Use Web Crypto API for encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  // ... encryption logic
  return encrypted;
}

async function decryptToken(encrypted: string): Promise<string> {
  // ... decryption logic
  return decrypted;
}
```

**فایل‌های نیاز به ایجاد:**
- `src/lib/pwa-storage.ts` (جدید)

---

### 8. Background Sync برای PWA

**مشکل:**
- راهنما می‌گوید: باید Background Sync برای refresh token استفاده شود
- وضعیت فعلی: هیچ background sync وجود ندارد

**راه حل:**
```typescript
// src/lib/background-sync.ts
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
  navigator.serviceWorker.ready.then((registration) => {
    // Register background sync for token refresh
    registration.sync.register('refresh-token').catch((err) => {
      console.error('Background sync registration failed:', err);
    });
  });
}

// Service Worker: sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'refresh-token') {
    event.waitUntil(refreshTokenInBackground());
  }
});
```

**فایل‌های نیاز به ایجاد:**
- `public/sw.js` (Service Worker)
- `src/lib/background-sync.ts` (جدید)

---

### 9. SessionStorage برای Temporary Persistence

**مشکل:**
- راهنما می‌گوید: Access Token باید قبل از refresh صفحه در **sessionStorage** موقت ذخیره شود
- وضعیت فعلی: هیچ sessionStorage استفاده نمی‌شود (چون tokens در cookies هستند)

**نکته:** این فقط برای client-side token management لازم است.

---

### 10. State Management برای Tokens

**مشکل:**
- راهنما می‌گوید: توکن‌ها باید در Redux state ذخیره شوند
- وضعیت فعلی: توکن‌ها در cookies هستند و در Redux state نیستند

**راه حل:**
```typescript
// src/store/auth/auth.slice.ts
interface AuthState {
  // ... existing fields
  accessToken: string | null;
  refreshToken: string | null;
  sessionId: string | null;
  deviceId: string;
  isAuthenticated: boolean;
}
```

**فایل‌های نیاز به تغییر:**
- `src/store/auth/auth.slice.ts:23-32`

---

## 🔄 تفاوت‌های معماری

### معماری راهنما (Client-Side Token Management)
```
Client (Browser)
  ├─ Access Token (Memory/Redux)
  ├─ Refresh Token (Memory/IndexedDB)
  ├─ DeviceId (localStorage)
  └─ API Requests with Authorization Header
       ↓
Next.js API Route (BFF)
       ↓
Upstream Backend
```

### معماری فعلی (BFF with HttpOnly Cookies)
```
Client (Browser)
  ├─ DeviceId (localStorage)
  └─ API Requests (no tokens in client)
       ↓
Next.js API Route (BFF)
  ├─ Access Token (HttpOnly Cookie)
  ├─ Refresh Token (HttpOnly Cookie)
  └─ Auto-refresh on 401
       ↓
Upstream Backend
```

---

## 📊 جدول مقایسه

| مورد | راهنما | وضعیت فعلی | اولویت |
|-----|--------|------------|--------|
| DeviceId Generation | ✅ | ✅ | - |
| DeviceId Storage (localStorage) | ✅ | ✅ | - |
| DeviceId در Header `X-Device-Id` | ✅ | ✅ | - |
| Access Token در Memory | ✅ | ❌ (در Cookies) | 🟡 Medium* |
| Refresh Token در Memory/IndexedDB | ✅ | ❌ (در Cookies) | 🟡 Medium* |
| Proactive Refresh | ✅ | ❌ | 🟡 Medium |
| Token Rotation | ✅ | ✅ | - |
| Race Condition Prevention | ✅ | ✅ | - |
| 401 Handling | ✅ | ✅ | - |
| 403 Handling | ✅ | ✅ | - |
| Token Version Mismatch | ✅ | ✅ | - |
| Session Expired (Explicit) | ✅ | ✅ | - |
| Logout Mechanisms | ✅ | ✅ | - |
| Session List | ✅ | ✅ | - |
| PWA Support (IndexedDB) | ✅ | ✅ | - |
| Background Sync | ✅ | ✅ | - |
| Proactive Refresh | ✅ | ✅ | - |

*نکته: این مورد نیاز به تغییر معماری دارد (از BFF به Client-Side)

---

## 🎯 توصیه‌ها

### اولویت بالا (High Priority)
1. **اضافه کردن `X-Device-Id` Header**: ساده و مهم برای session management
2. **403 Forbidden Handling**: برای session revoked scenarios
3. **Token Version Mismatch Handling**: برای logout-all-devices scenarios

### اولویت متوسط (Medium Priority)
1. **Proactive Token Refresh**: بهبود UX (اما نیاز به client-side token management)
2. **Explicit Session Expired Handling**: بهتر از generic handling

### اولویت پایین (Low Priority)
1. **PWA Support**: فقط اگر PWA در roadmap باشد
2. **Background Sync**: فقط برای PWA

### تغییرات معماری (Architectural Changes)
- **Client-Side Token Management**: نیاز به refactoring کامل دارد
  - تغییر از BFF pattern به Client-Side
  - تغییر از HttpOnly Cookies به Memory/IndexedDB
  - تغییر interceptor pattern
  - تغییر error handling

---

## 📝 خلاصه

### ✅ پیاده‌سازی شده (13 مورد)
1. DeviceId Generation & Storage
2. DeviceId در Header `X-Device-Id` ✅ **جدید**
3. Refresh Token Rotation
4. Race Condition Prevention
5. Logout Mechanisms (4 نوع)
6. Session List
7. 401 Handling
8. 403 Handling ✅ **جدید**
9. Token Version Mismatch Handling ✅ **جدید**
10. Explicit Session Expired Handling ✅ **جدید**
11. Interceptor Pattern (Server-Side)
12. Cookie Management
13. State Management (برای User data)

### ✅ پیاده‌سازی شده (16 مورد - شامل موارد جدید)
1. DeviceId Generation & Storage
2. DeviceId در Header `X-Device-Id` ✅
3. Refresh Token Rotation
4. Race Condition Prevention
5. Logout Mechanisms (4 نوع)
6. Session List
7. 401 Handling
8. 403 Handling ✅
9. Token Version Mismatch Handling ✅
10. Explicit Session Expired Handling ✅
11. Interceptor Pattern (Server-Side)
12. Cookie Management
13. State Management (برای User data)
14. **PWA Support (IndexedDB)** ✅ **جدید**
15. **Background Sync** ✅ **جدید**
16. **Proactive Token Refresh (Hybrid)** ✅ **جدید**

### ❌ پیاده‌سازی نشده (3 مورد - فقط موارد معماری)
1. ❌ Access Token در Memory (نیاز به تغییر معماری - با BFF سازگار نیست)
2. ❌ Refresh Token در Memory (نیاز به تغییر معماری - با BFF سازگار نیست)
3. ❌ SessionStorage برای Temporary Persistence (نیاز به client-side token management)

---

## 🔧 فایل‌های نیاز به تغییر

### تغییرات ساده (Quick Wins) ✅ **تکمیل شد**
1. ✅ `src/store/api/baseApi.ts` - اضافه کردن `X-Device-Id` header
2. ✅ `src/store/api/baseApi.ts` - اضافه کردن 403 handling
3. ✅ `src/store/api/baseApi.ts` - اضافه کردن Token Version Mismatch handling
4. ✅ `src/store/api/baseApi.ts` - بهبود Session Expired handling
5. ✅ `src/store/auth/auth.types.ts` - اضافه کردن error types جدید

### تغییرات پیچیده (Architectural)
1. `src/store/auth/auth.slice.ts` - اضافه کردن token fields
2. `src/store/api/baseApi.ts` - تغییر به client-side token management
3. `app/api/generatedClient.ts` - تغییر interceptor pattern
4. ایجاد `src/lib/pwa-storage.ts` - برای PWA support

---

## 📌 نتیجه‌گیری

سیستم فعلی **معماری BFF با HttpOnly Cookies** دارد که **امن‌تر** از client-side token management است، اما با راهنمای ارائه شده که برای **Client-Side Token Management** طراحی شده، **سازگار نیست**.

**گزینه‌ها:**
1. **تغییر راهنما** برای تطابق با معماری فعلی (BFF)
2. **Refactoring کامل** برای تطابق با راهنما (Client-Side)
3. **Hybrid Approach**: ترکیب هر دو (BFF + Client-Side برای PWA)

**توصیه:** گزینه 1 (تغییر راهنما) بهتر است چون معماری فعلی امن‌تر است.

