/* eslint-disable @typescript-eslint/no-require-imports */
// This file is a CommonJS entry point for Node.js/IIS, not bundled by Next.js
// NOTE: For IIS with standalone builds, we use the regular Next.js server
// The standalone server is designed for direct execution, not for iisnode
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const hostname = "localhost";

// Initialize Next.js app
// Next.js will automatically use the standalone build if available
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // CRITICAL: Normalize URL to remove IIS pipe paths
      // IIS may add /pipe/{guid} prefix which breaks NextAuth action parsing
      let url = req.url || "/";
      
      // Remove pipe path prefix if present (IIS URL Rewrite/ARR issue)
      // Pattern: /pipe/{guid}/api/auth/... -> /api/auth/...
      if (url.includes("/pipe/") && url.includes("/api/auth/")) {
        const pipeMatch = url.match(/\/pipe\/[^/]+\/(.+)/);
        if (pipeMatch) {
          url = "/" + pipeMatch[1];
          console.warn(`[IIS] Normalized URL from ${req.url} to ${url}`);
        }
      }
      
      const parsedUrl = parse(url, true);
      const { pathname, query } = parsedUrl;

      // Handle specific routes if needed
      if (pathname === "/a") {
        await app.render(req, res, "/a", query);
      } else if (pathname === "/b") {
        await app.render(req, res, "/b", query);
      } else {
        await handle(req, res, parsedUrl);
      }
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, async () => {
      console.log(`> Ready on http://localhost:${port}`);
      if (!dev) {
        console.log("> Running in production mode");
        console.log("> Standalone build files will be used automatically by Next.js");
      }
    });
});