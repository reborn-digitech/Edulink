import { NextResponse } from "next/server";
import { apiErrorSchema, EXPERT_APPLICATION_DOCUMENT_MAX_BYTES, expertApplicationBodySchema, expertApplicationReceivedSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { EXPERT_APPLICATION_TRIES, submitExpertApplication } from "@/lib/expert-applications";
import { getLocale, getT } from "@/lib/i18n/server";
import { consumeByCaller, retryHintKey } from "@/lib/rate-limit";

/** Multipart framing around the document and the JSON part: boundaries, headers, a few kilobytes of fields. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/** The body's bytes, or null once they have grown past the limit (the rest is never read). */
async function readBoundedBytes(request: Request, limit: number): Promise<Buffer | null> {
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * POST /api/v1/public/expert-applications — an expert's application from the login page (15 Oct 2026), the web's
 * /register/expert and, later, the phone's. Signed out is fine and nothing signs in: no account is made.
 *
 * A multipart body: `application`, the fields as JSON (expertApplicationBodySchema), and `document`, one PDF,
 * JPG or PNG of at most 5 MB. A JSON body of the fields alone is read too, and refused for the missing document
 * with the field named — so an empty body is a 422, as every form door's is. A body above the document's cap
 * is 413 before it is read. 201 with the address the operator will write to; 422 with the field for a refusal
 * of the form; 429 with Retry-After at the hourly limits per address (every post, then valid applications). An
 * address that is already an expert's or has an application waiting is answered 201 like any other, and its holder is
 * told by mail (TA-335).
 */
export async function POST(request: Request) {
  try {
    const t = await getT();
    const tooLarge = () =>
      NextResponse.json(
        apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "TOO_LARGE", issues: { document: t("refusal.fileTooLargeLimit", { mb: EXPERT_APPLICATION_DOCUMENT_MAX_BYTES / (1024 * 1024) }) } }),
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    // TA-335: every post counts against the caller's address before its body is read, valid or not; the stricter
    // hourly count of valid applications is the library's, below.
    const tries = await consumeByCaller("expert-apply-try", EXPERT_APPLICATION_TRIES);
    if (!tries.allowed) {
      const hint = retryHintKey(tries.retryAfterSeconds);
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("expertApply.refuseTooMany", { when: t(hint.key, hint.vars) }), code: "RATE_LIMITED", retryAfterSeconds: tries.retryAfterSeconds }),
        { status: 429, headers: { "Retry-After": String(tries.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const declared = Number(request.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > EXPERT_APPLICATION_DOCUMENT_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) return tooLarge();

    let fields: unknown = null;
    let document: File | null = null;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().startsWith("multipart/form-data")) {
      // TA-423: the cap holds for what arrives, not only for what was declared (a chunked body declares nothing).
      const bytes = await readBoundedBytes(request, EXPERT_APPLICATION_DOCUMENT_MAX_BYTES + MULTIPART_OVERHEAD_BYTES);
      if (bytes === null) return tooLarge();
      const form = await new Response(new Uint8Array(bytes), { headers: { "content-type": contentType } }).formData().catch(() => null);
      const raw = form?.get("application");
      if (typeof raw === "string") {
        try {
          fields = JSON.parse(raw);
        } catch {
          fields = null;
        }
      }
      const file = form?.get("document");
      document = file instanceof File ? file : null;
    } else {
      fields = await readJson(request);
    }

    const parsed = expertApplicationBodySchema.safeParse(fields);
    if (!parsed.success) return apiInvalid(parsed);
    const made = await submitExpertApplication(parsed.data, document, await getLocale());
    if (!made.ok) {
      const hint = made.retryAfterSeconds ? retryHintKey(made.retryAfterSeconds) : null;
      const sentence = t(made.errorKey, made.vars ?? (hint ? { when: t(hint.key, hint.vars) } : undefined));
      if (made.retryAfterSeconds) {
        return NextResponse.json(
          apiErrorSchema.parse({ error: sentence, code: "RATE_LIMITED", retryAfterSeconds: made.retryAfterSeconds }),
          { status: 429, headers: { "Retry-After": String(made.retryAfterSeconds), "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json(
        apiErrorSchema.parse({ error: sentence, code: "BAD_REQUEST", ...(made.field ? { issues: { [made.field]: sentence } } : {}) }),
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    return ok(expertApplicationReceivedSchema.parse({ ok: true, email: made.email }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/public/expert-applications");
  }
}

