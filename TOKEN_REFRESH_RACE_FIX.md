# 🔁 Token Refresh Race Condition Fix

## ✅ مشکل حل شده

### مشکل اصلی:
وقتی چند درخواست همزمان با `accessToken` منقضی شده ارسال می‌شدند، هر کدام refresh را جداگانه انجام می‌دادند:
- چند درخواست refresh پشت سر هم
- Cookie‌ها overwrite می‌شدند
- Race بین token قدیمی و جدید → بعضی 401 برمی‌گرداندند

### راه‌حل پیاده‌سازی شده:

#### 1. Lock Flag (`isRefreshing`)
```typescript
let isRefreshing = false;
```

#### 2. Atomic Check-and-Set Pattern
```typescript
async function refreshAccessToken(req: NextRequest) {
  // Step 1: Check if refresh is already in progress
  if (isRefreshing) {
    // Wait for existing promise
    if (globalRefreshPromise) {
      return await globalRefreshPromise;
    }
  }
  
  // Step 2: Acquire lock BEFORE creating promise
  isRefreshing = true;
  
  // Step 3: Create promise
  globalRefreshPromise = (async () => {
    // ... refresh logic ...
  })();
  
  // Step 4: Release lock in finally
  finally {
    globalRefreshPromise = null;
    isRefreshing = false; // CRITICAL: Release lock
  }
}
```

### جریان کار:

```
Request 1 (401) → Check isRefreshing (false) → Set isRefreshing = true → Create promise
Request 2 (401) → Check isRefreshing (true) → Wait for globalRefreshPromise
Request 3 (401) → Check isRefreshing (true) → Wait for globalRefreshPromise
...
Request 1 completes → Release lock → All waiting requests get result
```

### مزایا:

1. **Single-Flight Pattern**: فقط یک refresh در هر زمان
2. **Atomic Lock**: جلوگیری از race condition
3. **Shared Promise**: همه درخواست‌های همزمان از همان نتیجه استفاده می‌کنند
4. **Cookie Consistency**: Cookie‌ها فقط یک بار overwrite می‌شوند

### فایل تغییر یافته:
- `app/api/generatedClient.ts:25-27, 36-75, 225-232`

---

## ✅ نتیجه

**Race condition کاملاً حل شده است!**

حالا اگر 10 درخواست همزمان با 401 بیایند:
- فقط **یک** refresh انجام می‌شود
- همه 10 درخواست منتظر همان refresh می‌مانند
- همه از همان token جدید استفاده می‌کنند
- هیچ race condition وجود ندارد

