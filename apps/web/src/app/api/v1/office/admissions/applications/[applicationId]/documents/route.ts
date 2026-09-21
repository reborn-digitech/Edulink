import { applicationDocumentsSaveSchema, applicationSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { attachDocuments } from "@/lib/admissions";
import { spendTickets, ticketedHandouts } from "@/lib/api-reads/teaching";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/admissions/applications/{applicationId}/documents — attach files
 * uploaded through /api/v1/uploads. Every id must be a ticket this person
 * holds, unspent; the ticket's sniffed type and size are what is recorded.
 */
export async function POST(request: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { applicationId } = await params;
    const parsed = applicationDocumentsSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const attachments = await ticketedHandouts(ctx.user.id, parsed.data.documents.map((d) => ({ fileId: d.fileId, name: d.name })));
    const view = await attachDocuments(ctx, applicationId, parsed.data.documents.map((d, i) => ({ key: d.key, attachment: attachments[i]! })));
    await spendTickets(attachments.map((a) => a.fileId));
    return ok(applicationSchema.parse(view));
  } catch (error) {
    return apiFailure(error, "api/v1/office/admissions/applications/[applicationId]/documents");
  }
}
