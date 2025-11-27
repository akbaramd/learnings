# ✅ رفع مشکل Refresh Token در Cookie

## مشکل شناسایی شده

**مشکل:** Refresh token در JWT ذخیره می‌شد اما در HttpOnly Cookie set نمی‌شد. در نتیجه:
- Refresh provider نمی‌توانست refresh token را از cookie بخواند
- بعد از token rotation، refresh token جدید در cookie set نمی‌شد

## راه‌حل اعمال شده

### ✅ 1. OTP Provider - Set Refresh Token در Cookie
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 267-288)

بعد از دریافت refresh token از upstream، آن را در HttpOnly Cookie set می‌کنیم:

```typescript
if (accessToken && refreshToken) {
  // 🔥 CRITICAL: Set refreshToken in HttpOnly Cookie
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}
```

### ✅ 2. Refresh Provider - Read Refresh Token از Cookie
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 331-332)

Refresh provider فقط از cookie می‌خواند (نه از credentials یا session):

```typescript
// 🔥 CRITICAL: Get refresh token ONLY from cookies
const cookieStore = await cookies();
const refreshToken = cookieStore.get('refreshToken')?.value || null;
```

### ✅ 3. Refresh Provider - Set New Refresh Token در Cookie (Token Rotation)
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 362-383)

بعد از token rotation، refresh token جدید را در cookie set می‌کنیم:

```typescript
if (accessToken && newRefreshToken) {
  // 🔥 CRITICAL: Set new refreshToken in HttpOnly Cookie (token rotation)
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}
```

### ✅ 4. JWT Callback - Read Refresh Token از Cookie
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 499-514)

وقتی access token expire می‌شود، refresh token را از cookie می‌خوانیم (نه از JWT):

```typescript
// 🔥 CRITICAL: Get refresh token from HttpOnly Cookie (NOT from JWT token)
let refreshTokenFromCookie: string | null = null;
try {
  const cookieStore = await cookies();
  refreshTokenFromCookie = cookieStore.get('refreshToken')?.value || null;
} catch (cookieError) {
  console.error('[NextAuth][JWT] Error reading refreshToken from cookie:', cookieError);
}

// CRITICAL: Only attempt refresh if we have a refresh token in cookie
if (!refreshTokenFromCookie) {
  return { ...token, error: 'RefreshAccessTokenError' };
}
```

### ✅ 5. JWT Callback - Set New Refresh Token در Cookie (Token Rotation)
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 521-540)

بعد از token rotation در JWT callback، refresh token جدید را در cookie set می‌کنیم:

```typescript
if (refreshed) {
  // 🔥 CRITICAL: Set new refreshToken in HttpOnly Cookie (token rotation)
  const cookieStore = await cookies();
  cookieStore.set('refreshToken', refreshed.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}
```

## خلاصه تغییرات

### ✅ چک‌لیست کامل:

1. ✅ **OTP Provider**: Refresh token در cookie set می‌شود
2. ✅ **Refresh Provider**: Refresh token از cookie خوانده می‌شود
3. ✅ **Refresh Provider**: Refresh token جدید در cookie set می‌شود (token rotation)
4. ✅ **JWT Callback**: Refresh token از cookie خوانده می‌شود
5. ✅ **JWT Callback**: Refresh token جدید در cookie set می‌شود (token rotation)

### 🔒 امنیت:

- ✅ Refresh token فقط در HttpOnly Cookie ذخیره می‌شود
- ✅ Refresh token هرگز در session یا response body قرار نمی‌گیرد
- ✅ JavaScript نمی‌تواند به refresh token دسترسی داشته باشد
- ✅ Token rotation: بعد از هر refresh، refresh token جدید در cookie set می‌شود

## نتیجه

حالا refresh token به درستی:
- ✅ در HttpOnly Cookie ذخیره می‌شود
- ✅ از cookie خوانده می‌شود (نه از JWT یا credentials)
- ✅ بعد از token rotation، refresh token جدید در cookie set می‌شود

مشکل `[NextAuth][Refresh] No refresh token found in cookies` باید حل شده باشد.

