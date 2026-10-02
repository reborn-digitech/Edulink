/**
 * Is this address one of Cloudflare's edges?
 *
 * Behind Cloudflare's proxy the hop that reaches the app is a Cloudflare edge,
 * so every per-address limit would key on a handful of edge addresses and a
 * whole city would share one login bucket. Cloudflare names the real caller in
 * CF-Connecting-IP — but anyone who reaches the app's origin directly (the
 * Fly address is public) can send that header too. So it is believed only when
 * the hop that delivered the request is itself inside Cloudflare's published
 * ranges (rate-limit.ts, clientAddress), and only with TRUST_CLOUDFLARE=1.
 *
 * The ranges are Cloudflare's own list, https://www.cloudflare.com/ips-v4 and
 * https://www.cloudflare.com/ips-v6, as fetched on 2 October 2026. Cloudflare
 * changes it rarely and announces it; a stale list fails safe — a new edge is
 * treated as an ordinary caller, never the other way round.
 */
export const CLOUDFLARE_RANGES: readonly string[] = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
  "2400:cb00::/32",
  "2606:4700::/32",
  "2803:f800::/32",
  "2405:b500::/32",
  "2405:8100::/32",
  "2a06:98c0::/29",
  "2c0f:f248::/32",
];

/** An address as bytes: 4 for IPv4 (and IPv4-mapped IPv6), 16 for IPv6; null when it is not an address. */
export function addressBytes(input: string): number[] | null {
  const addr = input.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(addr)) {
    const parts = addr.split(".").map(Number);
    return parts.every((n) => n <= 255) ? parts : null;
  }
  if (!addr.includes(":") || !/^[0-9a-f:.]+$/.test(addr)) return null;
  // An IPv4 tail (::ffff:1.2.3.4) becomes two groups.
  let text = addr;
  const v4Tail = /(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text);
  if (v4Tail) {
    const v4 = addressBytes(v4Tail[1]!);
    if (!v4) return null;
    text = text.slice(0, -v4Tail[1]!.length) + `${((v4[0]! << 8) | v4[1]!).toString(16)}:${((v4[2]! << 8) | v4[3]!).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  const bytes = groups.flatMap((g) => {
    const n = parseInt(g, 16);
    return [n >> 8, n & 0xff];
  });
  // IPv4-mapped (::ffff:a.b.c.d) is the IPv4 address.
  if (bytes.slice(0, 10).every((b) => b === 0) && bytes[10] === 0xff && bytes[11] === 0xff) return bytes.slice(12);
  return bytes;
}

/** Whether `addr` falls inside `cidr` ("a.b.c.d/n" or "x:y::/n"); false across families or on anything unparsable. */
export function inRange(addr: string, cidr: string): boolean {
  const [base, bitsText] = cidr.split("/");
  const a = addressBytes(addr);
  const b = addressBytes(base ?? "");
  const bits = Number(bitsText);
  if (!a || !b || a.length !== b.length || !Number.isInteger(bits) || bits < 0 || bits > a.length * 8) return false;
  for (let i = 0; i < a.length; i++) {
    const take = Math.min(8, Math.max(0, bits - i * 8));
    if (take === 0) return true;
    const mask = (0xff << (8 - take)) & 0xff;
    if ((a[i]! & mask) !== (b[i]! & mask)) return false;
  }
  return true;
}

export function isCloudflareAddress(addr: string): boolean {
  return CLOUDFLARE_RANGES.some((cidr) => inRange(addr, cidr));
}
