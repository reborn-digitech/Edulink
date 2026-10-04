import { studentLedgerQuerySchema, studentLedgerSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myLedger } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/student/ledger — The student's own ledger net of the state's share; a guardian's read needs the MONEY grant for an adult. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT", "PARENT");
    const parsed = studentLedgerQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(studentLedgerSchema.parse(await myLedger(ctx, q.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/student/ledger");
  }
}
