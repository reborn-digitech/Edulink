import { NextResponse } from "next/server";
import { apiErrorSchema, EXPERT_APPLICATION_DOCUMENT_MAX_BYTES, expertApplicationBodySchema, expertApplicationReceivedSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { submitExpertApplication } from "@/lib/expert-applications";
import { getLocale, getT } from "@/lib/i18n/server";
import { retryHintKey } from "@/lib/rate-limit";

/** Multipart framing around the document and the JSON part: boundaries, headers, a few kilobytes of fields. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

/**
 * POST /api/v1/public/expert-applications — an expert's application from the login page (15 Oct 2026), the web's
 * /register/expert and, later, the phone's. Signed out is fine and nothing signs in: no account is made.
 *
 * A multipart body: `application`, the fields as JSON (expertApplicationBodySchema), and `document`, one PDF,
 * JPG or PNG of at most 5 MB. A JSON body of the fields alone is read too, and refused for the missing document
 * with the field named — so an empty body is a 422, as every form door's is. A body above the document's cap
 * is 413 before it is read. 201 with the address the operator will write to; 422 with the field for a refusal
 * of the form; 429 with Retry-After at the hourly limit per address (only a valid application counts).
 */
export async function POST(request: Request) {
  try {
    const t = await getT();
    const declared = Number(request.headers.get("content-length") ?? "");
    if (Number.isFinite(declared) && declared > EXPERT_APPLICATION_DOCUMENT_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "TOO_LARGE", issues: { document: t("refusal.fileTooLargeLimit", { mb: EXPERT_APPLICATION_DOCUMENT_MAX_BYTES / (1024 * 1024) }) } }),
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }

    let fields: unknown = null;
    let document: File | null = null;
    if ((request.headers.get("content-type") ?? "").toLowerCase().startsWith("multipart/form-data")) {
      const form = await request.formData().catch(() => null);
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

