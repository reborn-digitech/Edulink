import { adminInvitesQuerySchema, adminInvitesSchema, inviteCreateBodySchema, inviteCreatedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminInvites, apiRefused } from "@/lib/api-reads/admin";
import { createInvites } from "@/app/(app)/admin/invites/actions";

/** GET /api/v1/admin/people/invites — invitations by status, with the counts per tab. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = adminInvitesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const { status, role, q, expired } = parsed.data;
    return ok(adminInvitesSchema.parse(await adminInvites(ctx, { status, role, q, expired: expired === "1" })));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/invites");
  }
}

/**
 * POST /api/v1/admin/people/invites — invite a pasted list. The same action
 * the form calls, so every row's fate is reported and one bad address never
 * aborts the other 199; a refusal the action decides is a 422 here.
 */
export async function POST(request: Request) {
  try {
    await requireApiRole("ADMIN");
    const parsed = inviteCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const state = await createInvites(parsed.data);
    if (!state.ok) return apiRefused({ errorKey: state.errorKey, errorVars: state.errorVars, error: state.error });
    return ok(inviteCreatedSchema.parse({ sent: state.sent, outcomes: state.outcomes, problems: state.problems }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/invites");
  }
}
