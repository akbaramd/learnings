# IIS Deployment Fixes for Next.js with NextAuth

## Problems Fixed

### 1. Standalone Mode Warning
**Issue**: `"next start" does not work with "output: standalone" configuration`

**Solution**: Updated `server.js` to automatically detect and use the standalone server in production:
- Checks if `.next/standalone/server.js` exists
- If found, uses the standalone server directly
- Otherwise, falls back to custom server (development mode)

### 2. NextAuth UnknownAction Error
**Issue**: `UnknownAction: Cannot parse action at /pipe/dd865ec1-ff07-4cbd-82b9-cb89bc3c434a/api/auth/providers`

**Root Cause**: IIS URL Rewrite/ARR adds a `/pipe/{guid}` prefix to URLs, which breaks NextAuth's action parsing.

**Solution**: Implemented URL normalization in multiple layers:
1. **NextAuth Route Handler** (`app/api/auth/[...nextauth]/route.ts`):
   - Added `normalizeIisUrl()` function to strip pipe paths
   - Wraps GET and POST handlers to normalize URLs before processing
   
2. **Custom Server** (`server.js`):
   - Normalizes URLs in development mode (non-standalone)
   - Logs warnings when normalization occurs

3. **IIS Configuration** (`web.config`):
   - Added forwarded headers (`X-Forwarded-Host`, `X-Forwarded-Proto`, `X-Forwarded-For`)
   - Helps NextAuth determine correct base URL

## Configuration Required

### Environment Variables

Add to your IIS environment variables or `.env` file:

```bash
# Required: Set your production URL
AUTH_URL=https://yourdomain.com

# Required: NextAuth secret
NEXTAUTH_SECRET=your-secret-key-change-in-production

# Optional: Port (defaults to 3000)
PORT=3000

# Optional: Node environment
NODE_ENV=production
```

**CRITICAL**: Set `AUTH_URL` to your production domain (e.g., `https://yourdomain.com`). This helps NextAuth determine the correct base URL when behind IIS proxy.

### IIS Application Pool Settings

1. **Node Version**: Ensure Node.js version matches your development environment
2. **Start Mode**: Set to `AlwaysRunning` for better performance
3. **Idle Timeout**: Increase if needed (default 20 minutes)

### Build and Deploy Process

1. **Build the application**:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Verify standalone output**:
   - Check that `.next/standalone/server.js` exists after build
   - This confirms standalone mode is working

3. **Deploy to IIS**:
   - Copy entire project folder to IIS directory
   - Ensure `node_modules` are installed (or copy from `.next/standalone/node_modules`)
   - Set up `web.config` in the root directory
   - Configure application pool to use Node.js

4. **Test the deployment**:
   - Visit `https://yourdomain.com/api/auth/providers`
   - Should return JSON without errors
   - Check server logs for any normalization warnings

## How It Works

### URL Normalization Flow

```
IIS Request: /pipe/{guid}/api/auth/providers
    ↓
web.config: Forwards headers, rewrites to server.js
    ↓
server.js: (Development only) Normalizes URL
    ↓
NextAuth Route: normalizeIisUrl() strips /pipe/{guid}
    ↓
NextAuth Handler: Processes /api/auth/providers correctly
```

### Standalone Mode Detection

```javascript
// server.js automatically detects standalone mode
const isStandalone = !dev && fs.existsSync('.next/standalone/server.js');

if (isStandalone) {
  // Use Next.js generated standalone server
  require('.next/standalone/server.js');
} else {
  // Use custom server (development)
  // ... custom server code
}
```

## Troubleshooting

### Still Getting UnknownAction Errors?

1. **Check AUTH_URL environment variable**:
   ```bash
   # In IIS, verify environment variable is set
   echo %AUTH_URL%
   ```

2. **Check server logs**:
   - Look for `[NextAuth][IIS] Normalized URL` warnings
   - If you see these, normalization is working
   - If not, the pipe path might be in a different format

3. **Verify web.config**:
   - Ensure `web.config` is in the root directory
   - Check that rewrite rules are correct
   - Verify forwarded headers are being set

4. **Test URL normalization manually**:
   ```bash
   # In Node.js console, test the regex:
   const pathname = '/pipe/dd865ec1-ff07-4cbd-82b9-cb89bc3c434a/api/auth/providers';
   const match = pathname.match(/\/pipe\/[^/]+\/(.+)/);
   console.log(match); // Should extract '/api/auth/providers'
   ```

### Standalone Server Not Found?

1. **Verify build output**:
   ```bash
   ls -la .next/standalone/server.js
   ```

2. **Check next.config.ts**:
   ```typescript
   output: 'standalone' // Must be set
   ```

3. **Rebuild the application**:
   ```bash
   rm -rf .next
   npm run build
   ```

### IIS Pipe Path Format Different?

If your IIS uses a different pipe path format, update the regex in:
- `app/api/auth/[...nextauth]/route.ts` - `normalizeIisUrl()` function
- `server.js` - URL normalization logic

Example for different format:
```javascript
// If format is /pipe-{guid}/api/auth/...
const pipeMatch = pathname.match(/\/pipe-[^/]+\/(.+)/);
```

## Files Modified

1. **server.js**:
   - Added standalone server detection
   - Added URL normalization for development mode
   - Added ESLint disable comment for CommonJS requires

2. **app/api/auth/[...nextauth]/route.ts**:
   - Added `normalizeIisUrl()` function
   - Wrapped GET and POST handlers with URL normalization
   - Added `AUTH_URL` environment variable support

3. **web.config**:
   - Added forwarded headers for NextAuth
   - Added outbound rules for URL preservation

## Testing Checklist

- [ ] Build completes successfully with `output: standalone`
- [ ] `.next/standalone/server.js` exists after build
- [ ] `AUTH_URL` environment variable is set in IIS
- [ ] `NEXTAUTH_SECRET` is set and secure
- [ ] `/api/auth/providers` endpoint works without errors
- [ ] `/api/auth/session` endpoint works correctly
- [ ] Login flow works end-to-end
- [ ] Server logs show URL normalization when needed
- [ ] No `UnknownAction` errors in logs

## Additional Notes

- **Performance**: URL normalization adds minimal overhead (regex match + URL parsing)
- **Logging**: Normalization warnings are logged to help debug IIS configuration issues
- **Compatibility**: Works with both standalone and non-standalone builds
- **Security**: Forwarded headers are properly validated by NextAuth

## Support

If issues persist:
1. Check NextAuth logs for specific error messages
2. Verify IIS URL Rewrite module is configured correctly
3. Test with a simple Node.js server to isolate IIS issues
4. Review IIS application pool logs for additional errors

