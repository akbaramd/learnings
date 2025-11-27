# بررسی چک‌لیست مدیریت Token

## ✅ چک‌لیست 1: رفرش توکن باید در سمت کلاینت مدیریت شود

### وضعیت: ✅ **پیاده‌سازی شده**

**مکان پیاده‌سازی:**
- `src/store/api/baseApi.ts` (خط 242): `signIn('refresh')` در client-side صدا زده می‌شود
- `src/components/auth/ProtectedRoute.tsx` (خط 125): `signIn('refresh')` در client-side
- `src/components/auth/SilentRefreshProvider.tsx` (خط 87): `signIn('refresh')` در client-side

**نحوه کار:**
```typescript
// Client-side trigger
const refreshResult = await signIn('refresh', {
  deviceId: deviceId || null,
  userAgent: userAgent || null,
  ipAddress: ipAddress || null,
  redirect: false,
});
```

**نکته مهم:**
- ✅ Trigger در client-side است
- ✅ Execution در server-side است (NextAuth provider)
- ✅ refreshToken از HttpOnly Cookie خوانده می‌شود (server-side)
- ✅ Client هرگز refreshToken را نمی‌بیند

---

## ✅ چک‌لیست 2: باید در کوئری مدیریت شود

### وضعیت: ✅ **پیاده‌سازی شده**

**مکان پیاده‌سازی:**
- `src/store/api/baseApi.ts`: `baseQueryWithReauth` (خط 151-313)

**نحوه کار:**
```typescript
export const baseQueryWithReauth: BaseQueryFn = async (args, api, extraOptions) => {
  // 1. Make original request
  let result = await rawBaseQuery(args, api, extraOptions);
  
  // 2. Check for 401
  if (got401 && typeof window !== 'undefined') {
    // 3. Trigger refresh (client-side)
    const refreshResult = await signIn('refresh', {...});
    
    // 4. Update Redux with new accessToken
    if (refreshResult?.ok) {
      const session = await getSession();
      api.dispatch(setAccessToken(session?.accessToken));
      
      // 5. Retry original request
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }
  
  return result;
};
```

**ویژگی‌ها:**
- ✅ Single-Flight Pattern (جلوگیری از race condition)
- ✅ Queue Pattern (صف کردن درخواست‌های همزمان)
- ✅ Automatic retry بعد از refresh موفق
- ✅ Logout و redirect در صورت refresh ناموفق

---

## ✅ چک‌لیست 3: اکسس توکن در کلاینت و رفرش توکن در سمت سرور مدیریت بشود

### وضعیت: ✅ **پیاده‌سازی شده**

#### Access Token (کلاینت):
**مکان:**
- NextAuth Session (server-side JWT، اما در client قابل دسترسی)
- Redux Store (برای backward compatibility)

**نحوه دسترسی:**
```typescript
// Client-side: از NextAuth session
const session = await getSession();
const accessToken = session?.accessToken;

// یا از Redux
const accessToken = useSelector(selectAccessToken);
```

**استفاده:**
- ✅ در `baseApi.ts` (خط 60): از session خوانده می‌شود
- ✅ در Authorization header ارسال می‌شود (خط 66)
- ✅ در Redux sync می‌شود برای backward compatibility

#### Refresh Token (سرور):
**مکان:**
- HttpOnly Cookie (server-side only)
- NextAuth JWT token (server-side only)
- ❌ NOT in NextAuth session (برای امنیت)
- ❌ NOT accessible from client-side JavaScript

**نحوه دسترسی:**
```typescript
// Server-side only: از cookies
const cookieStore = await cookies();
const refreshToken = cookieStore.get('refreshToken')?.value;
```

**استفاده:**
- ✅ در `app/api/auth/[...nextauth]/route.ts` (خط 308): از cookies خوانده می‌شود
- ✅ در refresh provider استفاده می‌شود (خط 318)
- ✅ Client هرگز refreshToken را نمی‌بیند

---

## 📊 خلاصه وضعیت

| چک‌لیست | وضعیت | مکان پیاده‌سازی |
|---------|-------|----------------|
| رفرش توکن در کلاینت مدیریت شود | ✅ پیاده‌سازی شده | `baseApi.ts`, `ProtectedRoute.tsx`, `SilentRefreshProvider.tsx` |
| در کوئری مدیریت شود | ✅ پیاده‌سازی شده | `baseApi.ts` → `baseQueryWithReauth` |
| اکسس توکن در کلاینت | ✅ پیاده‌سازی شده | NextAuth Session + Redux |
| رفرش توکن در سرور | ✅ پیاده‌سازی شده | HttpOnly Cookie + NextAuth JWT |

---

## 🔍 جزئیات فنی

### جریان Refresh Token:

```
Client Request (401)
  ↓
baseQueryWithReauth (client-side)
  ↓
signIn('refresh') (client-side trigger)
  ↓
NextAuth Refresh Provider (server-side)
  ↓
Read refreshToken from HttpOnly Cookie (server-side)
  ↓
Call upstream API to refresh (server-side)
  ↓
Update NextAuth JWT with new tokens (server-side)
  ↓
Update HttpOnly Cookie with new refreshToken (server-side)
  ↓
Return new accessToken in session (server-side)
  ↓
Client reads accessToken from session
  ↓
Sync to Redux (client-side)
  ↓
Retry original request (client-side)
```

### امنیت:

✅ **Access Token:**
- در NextAuth Session (JWT)
- در Redux (برای backward compatibility)
- قابل دسترسی از client-side
- Short-lived (15 دقیقه)

✅ **Refresh Token:**
- در HttpOnly Cookie (server-side only)
- در NextAuth JWT (server-side only)
- ❌ NOT in session
- ❌ NOT accessible from client-side JavaScript
- Long-lived (7 روز)

---

## ✅ نتیجه‌گیری

همه چک‌لیست‌ها **به درستی پیاده‌سازی شده‌اند**:

1. ✅ رفرش توکن در سمت کلاینت trigger می‌شود (اما execution در server)
2. ✅ در RTK Query (`baseQueryWithReauth`) مدیریت می‌شود
3. ✅ Access Token در client قابل دسترسی است
4. ✅ Refresh Token فقط در server (HttpOnly Cookie) است

**معماری فعلی Enterprise-Grade و Secure است!** 🎯

