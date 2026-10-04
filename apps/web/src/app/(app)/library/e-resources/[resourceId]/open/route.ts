import { getT } from "@/lib/i18n/server";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { openEResource } from "@/lib/college-campus";

/**
 * Opening an e-resource from the web (campaign 2026-10-04, G-3): the open is
 * counted (openEResource: a college member of STUDENT, FACULTY or HOD — or the
 * desk — with LIBRARY on, an active resource of their own college) and the
 * browser is sent on to the publisher's https link with a 302. A refusal is a
 * plain sentence with its status: 403 for the wrong role, a school or the
 * module off (MODULE_OFF), 404 for a resource that is not here or not active.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ resourceId: string }> }) {
  const t = await getT();
  try {
    const ctx = await requireApiUser();
    const { resourceId } = await params;
    const { url } = await openEResource(ctx, resourceId);
    // Saved https-only (saveEResource); refused here too rather than sending anyone to another scheme.
    if (!url.startsWith("https://")) throw new AccessError("collegeOffice.refuseUrl");
    return new Response(null, { status: 302, headers: { location: url, "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  } catch (error) {
    if (error instanceof AccessError) {
      const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
      return new Response(t(error.key, error.vars), { status, headers: { "content-type": "text/plain; charset=utf-8", ...(error.code === "MODULE_OFF" ? { "x-edulink-code": "MODULE_OFF" } : {}) } });
    }
    console.error("[e-resource open]", error);
    return new Response(t("common.somethingWrong"), { status: 500 });
  }
}
