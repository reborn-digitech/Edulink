import { certificateTemplateSaveSchema, certificateTemplateSchema, certificateTemplatesViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveTemplate, templatesView } from "@/lib/certificates";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/certificate-templates — the templates, the presets, the placeholders. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(certificateTemplatesViewSchema.parse(await templatesView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificate-templates");
  }
}

/** POST /api/v1/office/certificate-templates — create one. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = certificateTemplateSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(certificateTemplateSchema.parse(await saveTemplate(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificate-templates");
  }
}
