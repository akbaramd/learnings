# 🔍 تحلیل ریشه‌ای باگ "Invalid Refresh Token"

## مشکل شناسایی شده

از لاگ می‌بینیم:
```
[NextAuth][Refresh] 🔍 Reading refresh token from cookie: {
  hasRefreshToken: true,
  refreshTokenLength: 43,
  refreshTokenPreview: 'Ro3dks1b9O7EeAf0bRjU...'
}
[NextAuth][Refresh] 🔄 Calling upstream refresh API with token: {
  tokenLength: 43,
  tokenPreview: 'Ro3dks1b9O7EeAf0bRjU...',
  deviceId: 'device-922faef6-1371-49ae-a392-8fa60a586866'
}
[NextAuth][Refresh] 📥 Upstream refresh response: {
  status: 200,
  isSuccess: false,
  message: 'Invalid refresh token',
  hasNewRefreshToken: false,
  newTokenLength: 0
}
```

**مشکل:** Refresh token از cookie خوانده می‌شود اما upstream می‌گوید invalid است.

## تحلیل ریشه‌ای

### 🔴 مشکل اصلی: Refresh Token قدیمی در Cookie

**سناریو:**
1. **Login/OTP**: Refresh token در cookie set می‌شود ✅
2. **Refresh 1**: Refresh token قدیمی از cookie خوانده می‌شود → refresh موفق → refresh token جدید باید در cookie set شود
3. **مشکل**: در NextAuth v5، `cookies().set()` در `authorize` callback ممکن است cookie را set نکند ❌
4. **نتیجه**: Refresh token قدیمی در cookie باقی می‌ماند
5. **Token Rotation**: بعد از refresh موفق، refresh token قدیمی invalid می‌شود
6. **Refresh 2**: Refresh token قدیمی از cookie خوانده می‌شود → Invalid refresh token ❌

### 🔴 مشکل فنی: NextAuth v5 Cookie Set در Authorize Callback

**مشکل:**
- در NextAuth v5، `cookies().set()` در `authorize` callback ممکن است cookie را set نکند
- Cookie در response header قرار نمی‌گیرد
- Refresh token جدید در cookie set نمی‌شود

**راه‌حل‌های ممکن:**
1. ✅ استفاده از response manipulation در route handler
2. ✅ استفاده از middleware برای set کردن cookie
3. ✅ استفاده از events برای set کردن cookie
4. ⚠️ استفاده از JWT callback برای set کردن cookie (ممکن است کار نکند)

## راه‌حل پیشنهادی

### ✅ راه‌حل 1: Response Manipulation در Route Handler

در route handler، بعد از NextAuth response، cookie را set کنیم:

```typescript
export async function POST(req: NextRequest) {
  const normalizedReq = normalizeIisUrl(req);
  const response = await handlers.POST(normalizedReq);
  
  // 🔥 CRITICAL: Set refresh token cookie in response if needed
  // This is a workaround for NextAuth v5 cookie set issue in authorize callback
  // We need to check if refresh token needs to be set from JWT token
  // But we don't have access to JWT token here...
  
  return response;
}
```

**مشکل:** در route handler، به JWT token دسترسی نداریم.

### ✅ راه‌حل 2: استفاده از Middleware

استفاده از middleware برای set کردن cookie بعد از NextAuth response:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if this is a NextAuth callback
  if (request.nextUrl.pathname.startsWith('/api/auth/callback/')) {
    // Set refresh token cookie from response
    // But we don't have access to refresh token here...
  }
  
  return response;
}
```

**مشکل:** در middleware، به refresh token دسترسی نداریم.

### ✅ راه‌حل 3: استفاده از Response Headers در Authorize Callback

در NextAuth v5، نمی‌توانیم مستقیماً response headers را modify کنیم.

### 🔥 راه‌حل 4: استفاده از Response Manipulation با JWT Token

در JWT callback، refresh token جدید را در JWT token ذخیره می‌کنیم. سپس در route handler، از JWT token استفاده می‌کنیم تا cookie را set کنیم.

**اما مشکل:** در route handler، به JWT token دسترسی نداریم.

## راه‌حل نهایی: استفاده از Response Headers

در NextAuth v5، نمی‌توانیم مستقیماً response headers را modify کنیم. اما می‌توانیم از `events` استفاده کنیم.

**اما مشکل:** `events.signIn` نمی‌تواند response headers را modify کند.

## نتیجه

مشکل اصلی این است که در NextAuth v5، `cookies().set()` در `authorize` callback ممکن است cookie را set نکند. این یک مشکل شناخته شده در NextAuth v5 است.

**راه‌حل موقت:**
- اگر cookie set نشود، refresh fail می‌شود (که الان اعمال شده است)
- اما مشکل این است که refresh token قدیمی در cookie باقی می‌ماند

**راه‌حل دائمی:**
- باید از middleware یا response manipulation استفاده کنیم
- یا باید از یک API route جداگانه برای refresh استفاده کنیم که cookie را set کند

