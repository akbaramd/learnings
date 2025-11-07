# اصلاحات OG Tags برای Telegram Preview

## تغییرات اعمال شده

### ✅ 1. استانداردسازی OG Tags
- **حذف `other` field**: تمام OG tags اکنون فقط با `property=` هستند (نه `name=`)
- **Next.js Metadata API**: به صورت خودکار `property=` می‌سازد
- **حذف duplicate tags**: دیگر `name="og:*"` و `property="og:*"` همزمان نداریم

### ✅ 2. بهبود Headers برای OG Image
- **Cache-Control**: `public, max-age=31536000, immutable` (کش طولانی)
- **Access-Control-Allow-Origin**: `*` (دسترسی cross-origin)
- **Content-Type**: `image/png` (دقیق و صحیح)

### ✅ 3. پشتیبانی از ربات‌ها در fetchSurveyDetails
- **تشخیص Bot**: ربات‌ها نیازی به cookie ندارند
- **User-Agent forwarding**: برای debugging

### ✅ 4. Middleware برای دسترسی ربات تلگرام
- **مسیر `/public/*`**: بدون نیاز به authentication
- **شناسایی TelegramBot**: دسترسی کامل به صفحات
- **Headers مناسب**: Content-Type و حذف X-Frame-Options

## تست با curl

### 1. تست دسترسی ربات تلگرام به صفحه

```bash
curl -I -A "TelegramBot (like TwitterBot)" \
  https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0
```

**انتظار:**
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
```

### 2. بررسی OG Tags در HTML

```bash
curl -s -A "TelegramBot (like TwitterBot)" \
  https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0 \
  | grep -iE 'property="og:|name="twitter:'
```

**انتظار:** باید ببینید:
```html
<meta property="og:type" content="website">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="...">
<meta property="og:image" content="...">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
<meta name="twitter:card" content="summary_large_image">
```

**⚠️ نباید ببینید:**
- `name="og:*"` (فقط `property="og:*"` باید باشد)

### 3. تست دسترسی به تصویر OG

```bash
curl -I "https://account.wa-nezam.org/api/og-image-canvas?text=نظرسنجی&width=1200&height=630&org=سازمان%20نظام%20مهندسی%20ساختمان%20آذربایجان%20غربی" \
  -A "TelegramBot (like TwitterBot)"
```

**انتظار:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

### 4. تست کامل HTML برای ربات

```bash
curl -s -A "TelegramBot (like TwitterBot)" \
  https://account.wa-nezam.org/public/surveys/58b010b6-d463-4dff-8668-5f36ecd6c7d0 \
  | head -100
```

**بررسی:**
- ✅ Status: 200 (نه 302/403/404)
- ✅ Content-Type: text/html
- ✅ OG tags با `property=` (نه `name=`)
- ✅ تصویر OG با URL مطلق و HTTPS

## مشکلات احتمالی و راه حل

### مشکل 1: ربات 403 می‌گیرد
**راه حل:**
- بررسی Cloudflare/WAF: Rule برای `/public/surveys/*` با Security Level = Essentially Off
- بررسی middleware: مطمئن شوید که `/public/*` bypass می‌شود

### مشکل 2: Preview نمی‌آید
**راه حل:**
- کش تلگرام: از `?tg=1` استفاده کنید
- بررسی OG tags: فقط `property=` باید باشد
- بررسی تصویر: URL باید مطلق و HTTPS باشد

### مشکل 3: تصویر نمایش داده نمی‌شود
**راه حل:**
- بررسی endpoint: `/api/og-image-canvas` باید public باشد
- بررسی headers: Content-Type باید `image/png` باشد
- بررسی Cache-Control: باید `public` باشد

## نکات مهم

1. **OG Tags**: Next.js Metadata API به صورت خودکار `property=` می‌سازد
2. **تصویر Dynamic**: endpoint `/api/og-image-canvas` public است و نیاز به auth ندارد
3. **Middleware**: ربات تلگرام می‌تواند صفحات `/public/*` را بخواند
4. **Headers**: تصویر OG با cache طولانی و CORS باز

## بعد از Deploy

1. تست‌های curl بالا را اجرا کنید
2. لینک را با `?tg=1` در تلگرام ارسال کنید
3. اگر preview نیامد، خروجی curl را بررسی کنید

