# راهنمای تست Preview تلگرام

## تغییرات اعمال شده

### 1. ✅ OG Tags کامل
- تمام meta tags برای Open Graph و Twitter Card اضافه شد
- تصویر OG با ابعاد 1200×630
- URL مطلق و HTTPS
- تمام اطلاعات سازمان اضافه شد

### 2. ✅ Middleware برای دسترسی ربات تلگرام
- مسیر `/public/*` بدون نیاز به authentication
- ربات تلگرام می‌تواند صفحات را برای preview بخواند
- X-Frame-Options برای مسیرهای public حذف شد

### 3. ✅ Headers مناسب
- Content-Type: text/html; charset=utf-8
- Cache-Control برای OG images
- Access-Control-Allow-Origin برای images

## تست سریع

### 1. تست دسترسی ربات تلگرام

```bash
# تست HEAD request
curl -A "TelegramBot (like TwitterBot)" -I https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0

# باید برگرداند:
# HTTP/1.1 200 OK
# Content-Type: text/html; charset=utf-8

# تست GET request
curl -A "TelegramBot (like TwitterBot)" -L https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0

# باید HTML کامل با OG tags برگرداند
```

### 2. بررسی OG Tags در HTML

```bash
curl -s -A "TelegramBot (like TwitterBot)" https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0 | grep -i "og:"

# باید ببینید:
# <meta property="og:type" content="website">
# <meta property="og:title" content="...">
# <meta property="og:description" content="...">
# <meta property="og:image" content="https://...">
# <meta property="og:image:width" content="1200">
# <meta property="og:image:height" content="630">
```

### 3. تست دسترسی تصویر OG

```bash
curl -I https://account.wa-nezam.org/api/og-image-canvas?text=نظرسنجی&width=1200&height=630

# باید برگرداند:
# HTTP/1.1 200 OK
# Content-Type: image/png
# Cache-Control: public, max-age=3600, s-maxage=3600
```

### 4. تست در تلگرام

1. لینک را با پارامتر refresh ارسال کنید:
   ```
   https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0?tg_refresh=1
   ```

2. یا از @WebPageBot استفاده کنید:
   ```
   /start
   https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0
   ```

## مشکلات احتمالی و راه حل

### مشکل 1: ربات تلگرام 403 می‌دهد
**راه حل**: 
- بررسی کنید که Cloudflare/WAF ربات را block نمی‌کند
- در Cloudflare: Security → WAF → Create rule برای allow TelegramBot User-Agent

### مشکل 2: Preview نمی‌آید
**راه حل**:
- کش تلگرام را با اضافه کردن `?tg_refresh=1` پاک کنید
- مطمئن شوید که OG image URL مطلق و HTTPS است
- بررسی کنید که تصویر کمتر از 5MB است

### مشکل 3: تصویر نمایش داده نمی‌شود
**راه حل**:
- بررسی کنید که `/api/og-image-canvas` public است
- مطمئن شوید که تصویر 1200×630 یا بزرگتر است
- بررسی کنید که Content-Type: image/png است

## بررسی نهایی

✅ OG tags در HTML سرور هستند (نه با JS)
✅ تصویر OG قابل دسترسی است
✅ ربات تلگرام می‌تواند صفحه را بخواند
✅ مسیر `/public/*` نیاز به auth ندارد
✅ Headers مناسب تنظیم شده‌اند

## نکات مهم

1. **کش تلگرام**: تلگرام لینک‌ها را کش می‌کند. بعد از تغییرات، از `?tg_refresh=1` استفاده کنید.

2. **Cloudflare**: اگر از Cloudflare استفاده می‌کنید، مطمئن شوید که Bot Fight Mode ربات تلگرام را block نمی‌کند.

3. **WAF**: اگر WAF دارید، User-Agent `TelegramBot` را در allowlist قرار دهید.

4. **HTTPS**: مطمئن شوید که تمام URLها (مخصوصاً og:image) HTTPS هستند.

