import { noDuesClearBodySchema, noDuesQuerySchema, noDuesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { clearLine, noDuesView } from "@/lib/no-dues";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ studentMembershipId: string }> };

/** GET /api/v1/accounts/no-dues/{studentMembershipId} — One student's clearance for an event: each desk's line, what is owed and out, cleared or not. */
export async function GET(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "HOD");
    const { studentMembershipId } = await params;
    const parsed = noDuesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(noDuesSchema.parse(await noDuesView(ctx, studentMembershipId, q.event)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/no-dues/[studentMembershipId]");
  }
}

/** POST /api/v1/accounts/no-dues/{studentMembershipId} — A desk clears its own line by hand; a new due afterwards reopens it. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "LIBRARIAN", "WARDEN", "HOD");
    const { studentMembershipId } = await params;
    const parsed = noDuesClearBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(noDuesSchema.parse(await clearLine(ctx, studentMembershipId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/no-dues/[studentMembershipId]");
  }
}
