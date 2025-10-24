# BFF Authentication Implementation

این پروژه پیاده‌سازی کامل احراز هویت با الگوی BFF (Backend for Frontend) است.

## معماری

```
React/RTK Query (client)
   └─→ Next.js API Routes (/api/*) [BFF]
           └─→ Api.ts (Axios-bound SDK) ─→ Backend (auth.wa-nezam.org)
```

## ویژگی‌ها

- ✅ **BFF-only**: کلاینت فقط به `/api/...` می‌زند
- ✅ **httpOnly Cookies**: Refresh token در کوکی امن
- ✅ **RTK Query**: کش و state management
- ✅ **Protected Routes**: محافظت خودکار صفحات
- ✅ **Auto Bootstrap**: بررسی session در load اولیه

## فایل‌های کلیدی

### Server-side (BFF)
- `app/api/auth/login/route.ts` - لاگین
- `app/api/auth/logout/route.ts` - خروج
- `app/api/auth/session/route.ts` - بررسی session
- `app/api/auth/refresh/route.ts` - تازه‌سازی توکن
- `app/api/users/me/route.ts` - پروفایل کاربر

### Client-side
- `src/services/auth.api.ts` - RTK Query endpoints احراز هویت
- `src/services/users.api.ts` - RTK Query endpoints کاربران
- `src/features/auth/auth.slice.ts` - Auth state management
- `src/features/auth/auth.middleware.ts` - Orchestration middleware
- `src/hooks/useAuth.ts` - Hook برای استفاده آسان
- `src/components/ProtectedRoute.tsx` - محافظت صفحات
- `src/components/AuthProvider.tsx` - Bootstrap provider

## استفاده

### 1. لاگین
```tsx
import { useAuth } from '@/src/hooks/useAuth';

function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login({ username: 'user', password: 'pass' }).unwrap();
      // موفق - کاربر به صفحه اصلی هدایت می‌شود
    } catch (error) {
      // خطا - نمایش پیام خطا
    }
  };
}
```

### 2. محافظت صفحه
```tsx
import { ProtectedRoute } from '@/src/components/ProtectedRoute';

function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>محتوای محافظت‌شده</div>
    </ProtectedRoute>
  );
}
```

### 3. بررسی وضعیت احراز هویت
```tsx
import { useAuth } from '@/src/hooks/useAuth';

function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginButton />;
  }
  
  return (
    <div>
      خوش آمدید {user?.userName}
      <button onClick={logout}>خروج</button>
    </div>
  );
}
```

## متغیرهای محیطی

```bash
# کلاینت فقط به BFF می‌زند
NEXT_PUBLIC_API_BASE_URL=/api

# BFF به بک‌اند اصلی
UPSTREAM_API_BASE_URL=https://auth.wa-nezam.org
```

## سناریوهای تست

1. **ورود**: لاگین موفق → هدایت به dashboard
2. **خروج**: logout → پاک‌سازی کش → هدایت به login
3. **رفرش صفحه**: بررسی session → نمایش مناسب UI
4. **401 خطا**: invalidate auth → هدایت به login
5. **چند تب**: همگام‌سازی وضعیت بین تب‌ها

## نکات مهم

- Refresh token هرگز در کلاینت ذخیره نمی‌شود
- تمام درخواست‌ها از طریق BFF انجام می‌شود
- کش RTK Query به‌صورت خودکار مدیریت می‌شود
- خطاهای 401 به‌صورت خودکار هندل می‌شوند
