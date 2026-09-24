import { certificateTemplateSaveSchema, certificateTemplateSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveTemplate } from "@/lib/certificates";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/certificate-templates/{templateId} — replace a template. */
export async function POST(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { templateId } = await params;
    const parsed = certificateTemplateSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(certificateTemplateSchema.parse(await saveTemplate(ctx, parsed.data, templateId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificate-templates/[templateId]");
  }
}
