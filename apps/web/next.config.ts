import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "node:path";

// Serwist compiles src/sw.ts -> public/sw.js at build time.
// Disabled in dev: a live service worker caching HMR chunks makes every
// edit look like it silently failed.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const isDev = process.env.NODE_ENV === "development";

/**
 * The Content Security Policy, one string.
 *
 * WHAT IT DOES AND DOES NOT PROMISE. Scripts allow 'unsafe-inline' because the
 * theme script in <head> is inline by design (it must run before first paint,
 * and Next's own hydration scripts are inline too); a nonce-per-request policy
 * needs middleware on every route and is Phase 1's follow-up, not its first
 * step. What this policy does close, today: any script, style, font, image or
 * fetch to a host that is not this one; framing by any other site; forms
 * posting anywhere but here; plugins. The app serves every asset itself — no
 * font host, no CDN, no analytics — so 'self' is the honest allow-list.
 *
 * Dev needs 'unsafe-eval' and a websocket for Turbopack's HMR; production gets
 * neither.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // A self-contained server for the container: .next/standalone carries the
  // app and only the node_modules it traced. The root is the workspace, not
  // this package, so the traced files keep their apps/web paths.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@node-rs/argon2", "web-push"],
  // Workspace packages ship TypeScript source, not a build; Next compiles them.
  transpilePackages: ["@edulink/i18n", "@edulink/contracts", "@edulink/api-client"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Two years, subdomains included; the preload flag is left off until
          // the domain has been on HTTPS long enough to be sure.
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
      {
        // The SW must never be served stale or it can pin users to an old app shell.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default withSerwist(nextConfig);
