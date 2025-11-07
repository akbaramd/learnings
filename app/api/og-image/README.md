# Dynamic OG Image Generation

Two approaches for generating dynamic Open Graph images with Persian text support.

## Approach 1: ImageResponse (Edge Runtime) - `/api/og-image`

**Current implementation** - Uses Next.js ImageResponse API with edge runtime.

### Features:
- ✅ Works in edge runtime (fast)
- ✅ No additional dependencies
- ✅ Vazirmatn font support
- ✅ RTL text support
- ✅ Base64 output support

### Usage:
```
GET /api/og-image?text=نظرسنجی&width=1200&height=630
```

### Query Parameters:
- `text`: Text to display (URL encoded)
- `format`: `png` (default) or `base64`
- `width`: Image width (default: 1200)
- `height`: Image height (default: 630)
- `bgColor`: Background color hex (default: #2563eb)
- `textColor`: Text color hex (default: #ffffff)

---

## Approach 2: Canvas (Node.js Runtime) - `/api/og-image-canvas`

**Alternative implementation** - Uses node-canvas for better Persian text rendering.

### Features:
- ✅ Better Persian text rendering
- ✅ More control over text positioning
- ✅ Proper RTL support
- ⚠️ Requires `canvas` package
- ⚠️ Node.js runtime only (not edge)

### Installation:

```bash
npm install canvas
# or
yarn add canvas
```

### Usage:
```
GET /api/og-image-canvas?text=نظرسنجی&width=1200&height=630
```

### Query Parameters:
Same as Approach 1.

### Font Setup:

For best results, place Vazirmatn font in one of these locations:
1. `public/fonts/Vazirmatn-SemiBold.ttf`
2. `node_modules/vazirmatn/fonts/ttf/Vazirmatn-SemiBold.ttf`

Or install via npm:
```bash
npm install vazirmatn
```

---

## Comparison

| Feature | ImageResponse | Canvas |
|---------|--------------|--------|
| Runtime | Edge | Node.js |
| Dependencies | None | canvas package |
| Persian Support | Good | Excellent |
| Performance | Fast | Good |
| Text Control | Limited | Full control |
| RTL Support | Good | Excellent |

## Recommendation

- **Use `/api/og-image`** (ImageResponse) for production - faster, no dependencies
- **Use `/api/og-image-canvas`** (Canvas) if you need better Persian text rendering and more control

Both endpoints support the same query parameters and return formats (PNG or base64).

