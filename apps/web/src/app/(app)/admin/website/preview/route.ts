import { previewSitePage } from "@/lib/site-routes";
import { readBounded } from "@/lib/api-v1";

/**
 * /admin/website/preview?lang= — the draft as the page Publish would make (website-builder A, 15 Oct 2026), whole,
 * for the office and the head to open in a tab of its own; its other pages at /admin/website/preview/<page>
 * (website-two, 16 Oct 2026). POST `{ config, page, lang }` is the editor's live frame: a draft the editor holds and
 * has not saved, drawn the same way (src/lib/site-routes.ts). Never cached, never indexed; signed out, not the office,
 * or the module off, it is the 404 every refusal here is.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return previewSitePage(request, new URL(request.url).searchParams.get("page") ?? "");
}

export async function POST(request: Request) {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > 512 * 1024) return new Response(null, { status: 413 });
  // TA-423: the same cap by what arrives, not only by what was declared.
  const text = await readBounded(request, 512 * 1024).catch(() => null);
  if (text === null) return new Response(null, { status: 413 });
  let body: { config?: unknown; page?: unknown } | null;
  try {
    body = JSON.parse(text) as { config?: unknown; page?: unknown } | null;
  } catch {
    body = null;
  }
  if (!body || typeof body !== "object" || !body.config || typeof body.config !== "object") return new Response(null, { status: 422 });
  return previewSitePage(request, typeof body.page === "string" ? body.page : "", body.config);
}
