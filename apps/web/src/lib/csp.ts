/**
 * The Content Security Policy, built in one place.
 *
 * TWO SHAPES. A PAGE gets a policy with a nonce minted for that one response:
 * a script runs only if it carries the nonce, or was loaded by one that does
 * ('strict-dynamic'). There is no 'unsafe-inline' for scripts, so markup an
 * attacker manages to put on a page cannot run. Everything that is not a page
 * — the API, files, the static assets — gets the policy without a nonce, in
 * which no inline script runs at all, because none of them is a document.
 *
 * WHAT IT CLOSES BESIDES: any script, style, font, image or fetch to a host
 * that is not this one; framing by any other site; forms posting anywhere
 * but here; plugins. The app serves every asset itself — no font host, no
 * CDN, no analytics — so 'self' is the honest allow-list, with one named
 * exception: the school's own gateway's checkout.
 *
 * STYLES KEEP 'unsafe-inline': React writes style attributes, and a style
 * cannot run code. Dev needs 'unsafe-eval' and a websocket for Turbopack's
 * HMR; production gets neither.
 *
 * No imports, on purpose: the middleware runs on the edge and next.config
 * runs before the app exists, and both read this file.
 */
export function contentSecurityPolicy(opts: { nonce?: string; dev: boolean }): string {
  const { nonce, dev } = opts;
  // checkout.razorpay.com is the ONE outside script: the school's own
  // gateway's checkout, added to the page by the family's fees screen when a
  // school has entered its keys. Under 'strict-dynamic' it runs because a
  // trusted script loaded it; the host stays named for a browser that does
  // not know 'strict-dynamic'. The money goes to the school (decision 0003).
  const script = ["'self'", ...(nonce ? [`'nonce-${nonce}'`, "'strict-dynamic'"] : []), "https://checkout.razorpay.com", ...(dev ? ["'unsafe-eval'"] : [])];
  return [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "font-src 'self' data:",
    `connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com${dev ? " ws: wss:" : ""}`,
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "worker-src 'self'",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");
}

/** The request header the layout reads the response's nonce from. */
export const NONCE_HEADER = "x-nonce";

/** Whether a path is a document the middleware writes a nonce for: not the API, not a file Next serves. */
export function isPage(pathname: string): boolean {
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return false;
  // A last segment with an extension is a file from public/: the icons, the manifest, the service worker.
  return !/\.[A-Za-z0-9]{2,12}$/.test(pathname);
}
