/** The bearer token on a request, if the caller sent one. Shared by the session reader and the tenant resolver. */
export function bearerToken(hdrs: Headers): string | null {
  const raw = hdrs.get("authorization");
  if (!raw) return null;
  const match = /^Bearer\s+([A-Za-z0-9_-]{20,})$/.exec(raw.trim());
  return match?.[1] ?? null;
}
