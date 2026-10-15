import "server-only";

/**
 * CERTIFICATES FOR A SCHOOL'S OWN DOMAIN, ASKED OF THE HOSTING PLATFORM (website-builder B, 15 October 2026).
 *
 * The sites are served by a Fly app (FLY_SITES_APP) answering at SITE_CNAME_TARGET; a school's website lives only
 * on the school's own domain (16 Oct 2026), which needs a certificate of its own on that app, issued by Fly once the
 * domain's DNS points at it. Three calls to Fly's GraphQL API with FLY_API_TOKEN: addCertificate (ask), app.certificate (how is it), and
 * deleteCertificate (the school removed the domain). Each answers a small outcome and never throws: a network
 * failure or a refusal is `{ ok: false, error }` with a code the page words (FLY_ERROR), and the job tries again.
 *
 * Unset in development (src/lib/site-env.ts flyConfig is null): nothing is asked, and the domain library records
 * certStatus NONE with the sentence that certificates are issued on the hosted platform.
 */

export const FLY_GRAPHQL = "https://api.fly.io/graphql";
const TIMEOUT_MS = 10_000;

export type FlyConfig = { token: string; app: string };
export type CertState = "REQUESTED" | "ISSUED" | "FAILED";
export type FlyOutcome<T> = { ok: true; value: T } | { ok: false; error: string };
type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

async function call<T>(cfg: FlyConfig, query: string, variables: Record<string, unknown>, fetchImpl: FetchLike): Promise<FlyOutcome<T>> {
  try {
    const res = await fetchImpl(FLY_GRAPHQL, {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.token}`, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { ok: false, error: `FLY_HTTP_${res.status}` };
    const body = (await res.json()) as { data?: T; errors?: { message?: string }[] };
    if (body.errors?.length) return { ok: false, error: (body.errors[0]?.message ?? "FLY_ERROR").slice(0, 200) };
    if (!body.data) return { ok: false, error: "FLY_EMPTY" };
    return { ok: true, value: body.data };
  } catch {
    return { ok: false, error: "FLY_UNREACHABLE" };
  }
}

/** Read Fly's certificate fields as our three states. */
export function certStateOf(cert: { configured?: boolean | null; clientStatus?: string | null; issued?: { nodes?: unknown[] | null } | null } | null | undefined): CertState {
  if (!cert) return "REQUESTED";
  const status = (cert.clientStatus ?? "").toLowerCase();
  if (/fail|error|invalid/.test(status)) return "FAILED";
  if (status === "ready" || (cert.issued?.nodes?.length ?? 0) > 0) return "ISSUED";
  return "REQUESTED";
}

const CERT_FIELDS = "hostname configured clientStatus issued { nodes { type expiresAt } }";

/** Ask Fly for a certificate for one hostname. Asking again for one Fly already has is not a failure. */
export async function requestCertificate(cfg: FlyConfig, hostname: string, fetchImpl: FetchLike = fetch): Promise<FlyOutcome<CertState>> {
  const query = `mutation($appId: ID!, $hostname: String!) { addCertificate(appId: $appId, hostname: $hostname) { certificate { ${CERT_FIELDS} } } }`;
  const r = await call<{ addCertificate?: { certificate?: Parameters<typeof certStateOf>[0] } }>(cfg, query, { appId: cfg.app, hostname }, fetchImpl);
  if (!r.ok) return /already|taken|exists/i.test(r.error) ? { ok: true, value: "REQUESTED" } : r;
  return { ok: true, value: certStateOf(r.value.addCertificate?.certificate) };
}

/** How Fly's certificate for one hostname stands. */
export async function certificateState(cfg: FlyConfig, hostname: string, fetchImpl: FetchLike = fetch): Promise<FlyOutcome<CertState>> {
  const query = `query($appName: String!, $hostname: String!) { app(name: $appName) { certificate(hostname: $hostname) { ${CERT_FIELDS} } } }`;
  const r = await call<{ app?: { certificate?: Parameters<typeof certStateOf>[0] } | null }>(cfg, query, { appName: cfg.app, hostname }, fetchImpl);
  if (!r.ok) return r;
  return { ok: true, value: certStateOf(r.value.app?.certificate) };
}

/** Take the certificate for one hostname off the sites app; a hostname Fly does not have is not a failure. */
export async function removeCertificate(cfg: FlyConfig, hostname: string, fetchImpl: FetchLike = fetch): Promise<FlyOutcome<true>> {
  const query = `mutation($appId: ID!, $hostname: String!) { deleteCertificate(appId: $appId, hostname: $hostname) { app { name } } }`;
  const r = await call<unknown>(cfg, query, { appId: cfg.app, hostname }, fetchImpl);
  if (!r.ok && !/not found|could not find|does not exist/i.test(r.error)) return r;
  return { ok: true, value: true };
}
