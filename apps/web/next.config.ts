import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import path from "node:path";
import { contentSecurityPolicy } from "./src/lib/csp";

// Serwist compiles src/sw.ts -> public/sw.js at build time.
// Disabled in dev: a live service worker caching HMR chunks makes every
// edit look like it silently failed.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  // The navigation fallback must itself be precached, or a page the phone
  // has never opened fails with a browser error offline instead of the
  // offline page (found by the campaign's offline probe: /offline was not in
  // the manifest). A fresh revision per build keeps it current.
  additionalPrecacheEntries: [{ url: "/offline", revision: `${Date.now()}` }],
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const isDev = process.env.NODE_ENV === "development";

/**
 * The policy for everything that is NOT a page — the API, files, static
 * assets — where no inline script runs at all. A page's policy carries a
 * nonce minted per response, so it is written by the middleware, which
 * replaces this header on the documents it serves. See src/lib/csp.ts.
 */
const csp = contentSecurityPolicy({ dev: isDev });

/**
 * HSTS: two years, subdomains included. The preload flag is a promise about
 * every subdomain of the domain, kept by browsers for months after it is
 * withdrawn, so it is the operator's to make: HSTS_PRELOAD=1 adds it, once
 * the production domain is fixed and everything under it is on HTTPS.
 */
const hsts = `max-age=63072000; includeSubDomains${process.env.HSTS_PRELOAD === "1" ? "; preload" : ""}`;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Whether the browser's push key was present when this build ran. A
  // NEXT_PUBLIC_ value is fixed into the client bundle at build time, so a key
  // set only on the host at runtime reaches the server and never a browser;
  // env.ts reads this marker at boot to say so (the Dockerfile's build arg).
  env: { VAPID_PUBLIC_KEY_BUILT: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ? "1" : "0" },
  // A self-contained server for the container: .next/standalone carries the
  // app and only the node_modules it traced. The root is the workspace, not
  // this package, so the traced files keep their apps/web paths.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // The PDF renderer reads the Devanagari font from disk at request time; the
  // standalone build only carries what is imported, so the files are named.
  outputFileTracingIncludes: { "/api/v1/shared/report-cards/[cardId]/pdf": ["./src/lib/pdf-fonts/*.ttf"], "/api/v1/teaching/classes/[classId]/report-cards/pdf": ["./src/lib/pdf-fonts/*.ttf"], "/api/v1/shared/certificates/[certificateId]/pdf": ["./src/lib/pdf-fonts/*.ttf"] },
  serverExternalPackages: ["@node-rs/argon2", "web-push"],
  // Workspace packages ship TypeScript source, not a build; Next compiles them.
  transpilePackages: ["@edulink/i18n", "@edulink/contracts", "@edulink/api-client", "@edulink/tokens"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: hsts }]),
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
