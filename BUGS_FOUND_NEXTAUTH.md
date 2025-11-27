# 🐛 باگ‌های شناسایی شده در NextAuth Route

## 🔴 باگ 1: چک کردن refreshToken از JWT به جای Cookie
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 485)

**مشکل:**
```typescript
// ❌ WRONG: چک می‌کند که آیا refreshToken در JWT token وجود دارد
if (!customToken.accessToken && !customToken.refreshToken) {
  return token; // No tokens = no session, return quickly
}
```

**چرا باگ است:**
- Refresh token باید فقط در HttpOnly Cookie ذخیره شود
- JWT token ممکن است refresh token قدیمی داشته باشد (بعد از token rotation)
- باید از cookie چک کنیم، نه از JWT token

**راه‌حل:**
```typescript
// ✅ CORRECT: چک می‌کند که آیا refreshToken در cookie وجود دارد
if (!customToken.accessToken) {
  // Check if refreshToken exists in cookie
  let refreshTokenFromCookie: string | null = null;
  try {
    const cookieStore = await cookies();
    refreshTokenFromCookie = cookieStore.get('refreshToken')?.value || null;
  } catch (cookieError) {
    // Ignore cookie error
  }
  
  if (!refreshTokenFromCookie) {
    return token; // No tokens = no session, return quickly
  }
}
```

---

## 🟡 باگ 2: Import تکراری cookies
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 8, 271, 366)

**مشکل:**
- در خط 8، `cookies` از `next/headers` import شده
- در خط 271 و 366 دوباره import می‌شود: `const { cookies } = await import('next/headers');`

**چرا باگ است:**
- Import تکراری غیرضروری است
- می‌تواند باعث confusion شود

**راه‌حل:**
- از import موجود در خط 8 استفاده کنیم
- یا همه جا از dynamic import استفاده کنیم (برای جلوگیری از مشکلات context)

---

## 🟡 باگ 3: اگر cookie set نشود، inconsistency ایجاد می‌شود
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 285-288, 380-383, 537-540)

**مشکل:**
```typescript
try {
  cookieStore.set('refreshToken', refreshToken, { ... });
} catch (cookieError) {
  // If setting cookie fails, log but continue (token is still in JWT)
  console.error('[NextAuth][OTP] ⚠️ Failed to set refreshToken cookie:', cookieError);
}
// ❌ اگر cookie set نشود، JWT token refresh token دارد اما cookie ندارد
```

**چرا باگ است:**
- اگر cookie set نشود، JWT token refresh token دارد اما cookie ندارد
- در refresh provider، refresh token از cookie خوانده می‌شود → null → refresh fail
- اما JWT token refresh token دارد → inconsistency

**راه‌حل:**
- اگر cookie set نشود، باید error throw کنیم یا token را null کنیم
- یا حداقل warning بدهیم که inconsistency وجود دارد

---

## 🟡 باگ 4: Race Condition در Token Rotation
**مکان:** `app/api/auth/[...nextauth]/route.ts` (خط 362-383, 521-540)

**مشکل:**
- اگر چند request همزمان refresh کنند، ممکن است cookie overwrite شود
- Request 1: refresh → cookie set می‌شود
- Request 2: refresh → cookie overwrite می‌شود (با refresh token قدیمی)

**چرا باگ است:**
- Token rotation: بعد از refresh، refresh token قدیمی invalid می‌شود
- اگر cookie overwrite شود با refresh token قدیمی، refresh بعدی fail می‌شود

**راه‌حل:**
- از single-flight pattern استفاده کنیم (مثل baseApi.ts)
- یا از lock استفاده کنیم

---

## ✅ خلاصه باگ‌ها

1. 🔴 **باگ 1**: چک کردن refreshToken از JWT به جای Cookie (خط 485)
2. 🟡 **باگ 2**: Import تکراری cookies
3. 🟡 **باگ 3**: اگر cookie set نشود، inconsistency ایجاد می‌شود
4. 🟡 **باگ 4**: Race Condition در Token Rotation

### اولویت رفع:
1. 🔴 **باگ 1** (Critical): باید فوراً رفع شود
2. 🟡 **باگ 3** (Important): باید رفع شود
3. 🟡 **باگ 4** (Medium): بهتر است رفع شود
4. 🟡 **باگ 2** (Low): می‌تواند رفع شود

