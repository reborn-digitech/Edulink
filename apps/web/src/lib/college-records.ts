import "server-only";
import { isCollegeKind } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { recordDeparture } from "./school-record";
import { noDuesFor, cautionReturnFor } from "./no-dues";
import { collegeDesk, kindOf } from "./college-office";
import { myStudentConsent } from "./student-consent";
import type { ActiveContext } from "./session";
import { isDateKey } from "./dates";

/**
 * A COLLEGE STUDENT'S RECORD AND LEAVING (4 October 2026).
 *
 * THE CERTIFICATE'S COLLEGE FIELDS. A college issues the school's
 * certificates (bonafide, character, transfer) and three of its own
 * (migration, provisional, course completion) from the same engine —
 * templates with [[placeholders]], serials under the year's lock, the public
 * check by code. `collegeFacts` is what the [[college.*]] placeholders read:
 * the programme, the university's PRN, the year of entry, the APAAR and ABC
 * ids from the record, and the year of passing and the result from the
 * exams module's published term result when there is one. A placeholder
 * that reads nothing prints a dash and is named on the issue screen, as
 * every certificate does.
 *
 * LEAVING. The office records a college student's leaving only when the
 * LEAVING no-dues clearance is complete (library, hostel, accounts, the lab);
 * the departure itself is the school's (school-record.ts `recordDeparture`:
 * the leaving record, the TC's data, and the ALUMNUS membership opened in the
 * same transaction); the programme enrolment closes (COMPLETED for a
 * graduate, LEFT otherwise); and the caution deposit the college returns,
 * net of anything still owed, is RECORDED on the clearance with the bank's
 * reference — paid from the college's own account (decision 0003).
 */

export type CollegeFacts = { programme: string | null; prn: string | null; yearOfEntry: string | null; yearOfPassing: string | null; apaarId: string | null; abcId: string | null; result: string | null };

/**
 * The exams module's year of passing and result: the latest PUBLISHED term
 * result the student passed (TermResult under a ResultRun, the exams
 * builder's), its publication year and its class (DISTINCTION, FIRST …) or
 * status. Until the exams module holds one, both print a dash.
 */
async function passingOf(studentMembershipId: string): Promise<{ yearOfPassing: string | null; result: string | null }> {
  const r = await db.termResult.findFirst({ where: { studentMembershipId, status: "PASS", run: { status: "PUBLISHED" } }, orderBy: { run: { publishedAt: "desc" } }, select: { status: true, cls: true, run: { select: { publishedAt: true } } } });
  if (!r) return { yearOfPassing: null, result: null };
  return { yearOfPassing: r.run.publishedAt ? String(r.run.publishedAt.getUTCFullYear()) : null, result: r.cls ?? r.status };
}

export async function collegeFacts(schoolId: string, studentMembershipId: string): Promise<CollegeFacts | null> {
  if (!isCollegeKind(await kindOf(schoolId))) return null;
  const [record, seat, enrolment] = await Promise.all([
    db.pupilRecord.findUnique({ where: { studentMembershipId }, select: { prn: true, apaarId: true, abcId: true, yearOfEntry: true } }),
    db.studentProgramme.findUnique({ where: { studentMembershipId }, select: { prn: true, programmeId: true, entryYear: true } }),
    db.programmeEnrolment.findFirst({ where: { studentMembershipId }, orderBy: { createdAt: "desc" }, select: { programmeId: true, yearOfEntry: true } }),
  ]);
  const programmeId = seat?.programmeId ?? enrolment?.programmeId ?? null;
  const programme = programmeId ? await db.programme.findFirst({ where: { id: programmeId, schoolId }, select: { name: true } }) : null;
  const passing = await passingOf(studentMembershipId);
  const entry = record?.yearOfEntry ?? enrolment?.yearOfEntry ?? seat?.entryYear ?? null;
  return { programme: programme?.name ?? null, prn: record?.prn ?? seat?.prn ?? null, yearOfEntry: entry === null ? null : String(entry), yearOfPassing: passing.yearOfPassing, apaarId: record?.apaarId ?? null, abcId: record?.abcId ?? null, result: passing.result };
}

/**
 * A college student leaves (see the docblock): the clearance must be
 * complete, then the school's departure, the enrolment closed, the caution
 * deposit recorded. Leaving twice is refused by the departure as it is today.
 */
export async function leaveCollege(ctx: ActiveContext, studentMembershipId: string, input: { leftOn: string; reason: "TRANSFERRED" | "GRADUATED" | "LEFT"; cautionReturnRef?: string }): Promise<{ studentMembershipId: string; cautionReturnPaise: number; alumnus: boolean }> {
  const d = await collegeDesk(ctx, ["ADMIN"]);
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: d.schoolId, role: "STUDENT" }, select: { id: true, userId: true, leftAt: true } });
  if (!m) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  // A day on the calendar (TA-113): new Date("2026-02-30T12:00:00Z") is 2 March, a day nobody typed.
  if (!isDateKey(input.leftOn)) throw new AccessError("refusal.leaveDateInvalid");
  const clearance = await noDuesFor(m.id, "LEAVING");
  if (!clearance.completed) throw new AccessError("collegeOffice.refuseNoDuesOpen");
  const cautionReturnPaise = await cautionReturnFor(d.schoolId, m.id);
  const result = await recordDeparture(ctx, m.id, { reason: input.reason, leftOn: new Date(`${input.leftOn}T12:00:00Z`) });
  if (!result.ok) throw new AccessError(result.errorKey);
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.programmeEnrolment.updateMany({ where: { studentMembershipId: m.id, status: "ACTIVE" }, data: { status: input.reason === "GRADUATED" ? "COMPLETED" : "LEFT" } });
    await tx.noDuesClearance.upsert({
      where: { studentMembershipId_event_cycleKey: { studentMembershipId: m.id, event: "LEAVING", cycleKey: "" } },
      create: { schoolId: d.schoolId, studentMembershipId: m.id, event: "LEAVING", cycleKey: "", completedAt: new Date(), cautionReturnPaise, cautionReturnRef: input.cautionReturnRef?.trim() || null },
      update: { cautionReturnPaise, cautionReturnRef: input.cautionReturnRef?.trim() || null, completedAt: clearance.completedAt ?? new Date() },
    });
  });
  const alumnus = Boolean(await db.membership.findFirst({ where: { userId: m.userId, schoolId: d.schoolId, role: "ALUMNUS", status: "ACTIVE" }, select: { id: true } }));
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.leaving", targetType: "Membership", targetId: m.id, meta: { reason: input.reason, cautionReturnPaise } });
  return { studentMembershipId: m.id, cautionReturnPaise, alumnus };
}

/**
 * THE ADULT STUDENT'S OWN ACCOUNT (`/student/account`): the grants their
 * guardians hold (the foundation's StudentConsent, changed at
 * /student/consent), whether two-step sign-in is on, where their own data
 * export is (the family export, which covers the student), and whether each
 * no-dues clearance stands complete.
 */
export async function studentAccount(ctx: ActiveContext) {
  if (ctx.role !== "STUDENT" || !ctx.membershipId || !ctx.schoolId) throw new AccessError("access.wrongRoleForThisAction");
  const [consent, user, clearances] = await Promise.all([
    myStudentConsent(ctx),
    db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { totpEnabledAt: true } }),
    isCollegeKind(await kindOf(ctx.schoolId)) ? Promise.all((["EXAM_FORM", "HOSTEL_EXIT", "LEAVING"] as const).map(async (event) => ({ event, completed: (await noDuesFor(ctx.membershipId!, event)).completed }))) : Promise.resolve([]),
  ]);
  return { consentApplies: consent.applies, grants: consent.grants.map((g) => ({ grant: g.grant, on: g.on })), twoFactorOn: Boolean(user.totpEnabledAt), exportPath: "/api/v1/family/export", noDues: clearances };
}
