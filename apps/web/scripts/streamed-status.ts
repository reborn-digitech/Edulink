/**
 * The status a BROWSER sees for a page that refused inside a loading boundary.
 *
 * Since the audit's UI pass (a641052b) forty segments carry a `loading.tsx`.
 * Next then streams the shell with a 200 at once and, when the page throws
 * `redirect()` or `notFound()` afterwards, puts the refusal into the RSC
 * payload as a digest: `NEXT_REDIRECT;replace;/switch;307;` or
 * `NEXT_HTTP_ERROR_FALLBACK;404`. The browser follows it; the page's own data
 * is never rendered, because the throw precedes it. An HTTP client that reads
 * the status alone would call every such refusal a 200, which is what the page
 * sweep did on 6 October 2026 (98 rows). This reads the digest so the sweep
 * judges what the person in the browser gets. R-64 in
 * docs/audit-2026-10-05/08-remaining-risks.md records the trade.
 */
export type StreamedStatus = { status: number; loc: string | null; streamed: boolean };

const REDIRECT = /NEXT_REDIRECT;(?:push|replace);([^;"\\\s]+);(\d{3});/;
const HTTP_ERROR = /NEXT_HTTP_ERROR_FALLBACK;(\d{3})/;

export function streamedStatus(status: number, body: string, loc: string | null): StreamedStatus {
  if (status !== 200) return { status, loc, streamed: false };
  const r = REDIRECT.exec(body);
  if (r) return { status: Number(r[2]), loc: r[1]!, streamed: true };
  const e = HTTP_ERROR.exec(body);
  if (e) return { status: Number(e[1]), loc: null, streamed: true };
  return { status, loc, streamed: false };
}
