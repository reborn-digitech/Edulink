import { enquiryThreadSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { readEnquiry } from "@/lib/enquiries";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound } from "../../helpers";

/** GET /api/v1/shared/enquiries/{enquiryId} — one thread from whichever side I stand on; not mine is a 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const ctx = await requireApiSession();
    if (!ctx.role) throw new AccessError("access.wrongRoleForThisAction");
    const { enquiryId } = await params;
    const thread = await asNotFound(() => readEnquiry(ctx, enquiryId));
    return ok(
      enquiryThreadSchema.parse({
        ...thread,
        createdAt: thread.createdAt.toISOString(),
        messages: thread.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/shared/enquiries/[enquiryId]");
  }
}
