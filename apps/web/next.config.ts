import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

// Serwist compiles src/sw.ts -> public/sw.js at build time.
// Disabled in dev: a live service worker caching HMR chunks makes every
// edit look like it silently failed.
const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["@node-rs/argon2", "web-push"],
  // Workspace packages ship TypeScript source, not a build; Next compiles them.
  transpilePackages: ["@edulink/i18n", "@edulink/contracts", "@edulink/api-client"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
