# 🔍 تحلیل باگ "Invalid Refresh Token"

## مشکل شناسایی شده

از لاگ می‌بینیم:
```
[NextAuth][Refresh] 🔍 Reading refresh token from cookie: {
  hasRefreshToken: true,
  refreshTokenLength: 43,
  refreshTokenPreview: 'Ro3dks1b9O7EeAf0bRjU...'
}
[NextAuth][Refresh] Refresh token failed: {
  status: 200,
  isSuccess: false,
  message: 'Invalid refresh token',
  errors: []
}
```

**مشکل:** Refresh token از cookie خوانده می‌شود اما upstream می‌گوید invalid است.

## علت احتمالی

### 🔴 سناریو 1: Refresh Token قدیمی در Cookie
**مشکل:**
1. Refresh 1: refresh token قدیمی از cookie خوانده می‌شود → refresh موفق → refresh token جدید در cookie set می‌شود
2. اما در NextAuth v5، `cookies().set()` در `authorize` callback ممکن است cookie را set نکند
3. Refresh token قدیمی در cookie باقی می‌ماند
4. بعد از token rotation، refresh token قدیمی invalid می‌شود
5. Refresh 2: refresh token قدیمی از cookie خوانده می‌شود → Invalid refresh token

### 🔴 سناریو 2: Cookie Set نمی‌شود
**مشکل:**
- در NextAuth v5، `cookies().set()` در `authorize` callback ممکن است cookie را set نکند
- Cookie در response header قرار نمی‌گیرد
- Refresh token جدید در cookie set نمی‌شود
- Refresh token قدیمی در cookie باقی می‌ماند

## راه‌حل‌های اعمال شده

### ✅ 1. Verification بعد از Cookie Set
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 419-445)

بعد از `cookieStore.set()`، verify می‌کنیم که cookie set شده است:

```typescript
// Wait a bit for cookie to be set
await new Promise(resolve => setTimeout(resolve, 50));
const verifyCookieStore = await cookies();
const verifyRefreshToken = verifyCookieStore.get('refreshToken')?.value || null;

if (!verifyRefreshToken || verifyRefreshToken !== newRefreshToken) {
  // Cookie was not set or token doesn't match - fail
  cookieSetSuccess = false;
} else {
  cookieSetSuccess = true;
}
```

### ✅ 2. Fail اگر Cookie Set نشود
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 445-450)

اگر cookie set نشود، refresh fail می‌شود:

```typescript
if (!cookieSetSuccess) {
  return null; // Fail the refresh
}
```

### ✅ 3. Enhanced Logging
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 349-355, 367-385)

Logging اضافه شده برای debug:
- Log refresh token که از cookie خوانده می‌شود
- Log refresh token که به upstream ارسال می‌شود
- Log response از upstream
- Log verification بعد از cookie set

## تست پیشنهادی

1. **تست Cookie Set:**
   - بعد از refresh، چک کنید که cookie set شده است
   - لاگ `Cookie set verification` را بررسی کنید

2. **تست Token Rotation:**
   - Refresh 1: refresh token قدیمی → باید موفق شود
   - Refresh 2: refresh token جدید → باید موفق شود
   - اگر Refresh 2 fail شود، یعنی cookie set نشده است

3. **تست Invalid Token:**
   - اگر refresh token invalid است، باید fail شود
   - اما باید مطمئن شویم که refresh token جدید در cookie set شده است

## نتیجه

با logging اضافه شده، می‌توانیم ببینیم:
- آیا refresh token از cookie خوانده می‌شود؟
- آیا refresh token جدید در cookie set می‌شود؟
- آیا refresh token جدید با refresh token قدیمی متفاوت است؟

اگر cookie set نشود، refresh fail می‌شود و refresh token قدیمی در cookie باقی نمی‌ماند.

