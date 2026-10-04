import { recruiterCompanySchema, recruiterInvitationAnswerSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { answerInvitation } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ companyId: string }> };

/** POST /api/v1/recruiter/company/invitations/{companyId} — accept or decline a colleague's invitation to a company (campaign S-16). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const { companyId } = await params;
    const parsed = recruiterInvitationAnswerSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(recruiterCompanySchema.parse(await answerInvitation(ctx, companyId, parsed.data.accept)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/company/invitations/[companyId]");
  }
}
