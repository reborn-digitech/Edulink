import { collegeOfferingWorkSchema, collegeWorkCreatedSchema, collegeWorkSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { offeringWork, setOfferingWork } from "@/lib/college-homework";
import { spendTickets, ticketedHandouts } from "@/lib/api-reads/teaching";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** GET /api/v1/academics/offerings/{offeringId}/work — one offering's homework and the internal components its marks may go into (R-48). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    return ok(collegeOfferingWorkSchema.parse(await offeringWork(ctx, p.offeringId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/work");
  }
}

/**
 * POST /api/v1/academics/offerings/{offeringId}/work — set a piece of work on
 * the offering, with handouts uploaded through /api/v1/uploads (each a ticket
 * this person holds, spent only once the work exists, as on the school's door).
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = collegeWorkSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { handouts, ...input } = parsed.data;
    const attachments = await ticketedHandouts(ctx.user.id, handouts);
    const result = await setOfferingWork(ctx, p.offeringId, { ...input, dueAt: input.dueAt || undefined, attachments });
    await spendTickets(attachments.map((a) => a.fileId));
    return ok(collegeWorkCreatedSchema.parse({ ...result, handouts: attachments.length }), 201);
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/work");
  }
}
