import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { archiveTemplate } from "@/lib/certificates";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/office/certificate-templates/{templateId}/archive — retire a template. */
export async function POST(_request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { templateId } = await params;
    return ok(okSchema.parse(await archiveTemplate(ctx, templateId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/certificate-templates/[templateId]/archive");
  }
}
