import { okSchema, staffRecordSaveSchema, staffRecordViewSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { setStaffRecord, staffRecordFor, SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/people/{membershipId}/staff-record — a member of staff's record as it stands; the office edits, the head reads. Another school's id is a 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    const member = await db.membership.findFirst({
      where: { id: membershipId, schoolId: ctx.schoolId, role: { in: [...SCHOOL_STAFF_ROLES] } },
      select: { role: true, user: { select: { name: true } } },
    });
    const record = member ? await staffRecordFor(ctx, membershipId) : null;
    if (!member || !record) throw new AccessError("refusal.notAMemberHere", "NOT_FOUND");
    // The view's record is the save's shape: the contract keeps the record's fields and drops the rest.
    return ok(staffRecordViewSchema.parse({ membershipId, name: member.user.name, role: member.role, canEdit: ctx.role === "ADMIN", record }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/staff-record");
  }
}

/** POST the same path — the office writes the whole record; a code off its list, a date that is not one or a day in the future is a 422 with the sentence. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = staffRecordSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setStaffRecord(ctx, membershipId, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/staff-record");
  }
}
