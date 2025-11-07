# PWA Icons

This directory should contain the following icon files for PWA, generated from `logo-blue.png`:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels (Apple touch icon)
- `icon-192x192.png` - 192x192 pixels (Android)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (Splash screen)

**Important:** The master logo file `logo-blue.png` is located in the `public/` directory and is used as the primary icon.

## How to Generate Icons

1. Use the existing `logo-blue.png` from `public/` directory as the master icon
2. Use an online tool like:
   - https://www.pwabuilder.com/imageGenerator
   - https://realfavicongenerator.net/
   - https://www.favicon-generator.org/
   
   Upload `logo-blue.png` and generate all required sizes. Download them and place in this `public/icons` directory.

3. Or use ImageMagick (if installed):
```bash
# Assuming logo-blue.png is in public/
mkdir -p public/icons
convert public/logo-blue.png -resize 72x72 public/icons/icon-72x72.png
convert public/logo-blue.png -resize 96x96 public/icons/icon-96x96.png
convert public/logo-blue.png -resize 128x128 public/icons/icon-128x128.png
convert public/logo-blue.png -resize 144x144 public/icons/icon-144x144.png
convert public/logo-blue.png -resize 152x152 public/icons/icon-152x152.png
convert public/logo-blue.png -resize 192x192 public/icons/icon-192x192.png
convert public/logo-blue.png -resize 384x384 public/icons/icon-384x384.png
convert public/logo-blue.png -resize 512x512 public/icons/icon-512x512.png
```

## Current Setup

- **Primary Icon**: `/logo-blue.png` (used as fallback)
- **App Name**: سامانه رفاهی
- **Theme Color**: #3A3080 (dark blue from logo)

The PWA will work with just `logo-blue.png`, but having optimized icons in different sizes will provide better performance and appearance on different devices.

