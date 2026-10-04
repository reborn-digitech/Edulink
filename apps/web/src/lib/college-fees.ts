import "server-only";
import { SCHOLARSHIP_SCHEME_TABLE, type CollegeCategory, type ScholarshipScheme, type StudentLedger } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { notify } from "./notify";
import { readJson, writeJson } from "./json";
import { todayKey } from "./dates";
import { currentAcademicYear } from "./academic-year";
import { assignPlansAs, createStructure, dateToDay, dayToDate, publishStructure, regenerateDemands } from "./fees";
import { collegeDesk, collegeStudent, kindOf, MONEY_READ, MONEY_WRITE, nameOf, officeUserIds, standingOf, yearKeyOf } from "./college-office";
import { isCollegeKind } from "./institution";
import { assertGuardianAccess } from "./tenancy";
import { forSchool } from "./tenant-context";
import { getT } from "./i18n/server";
import type { ActiveContext } from "./session";

/**
 * A COLLEGE'S FEES (4 October 2026; the ACCOUNTS desk, which hangs on no
 * module). The school's fee module (fees.ts, fees-payments.ts) is the ledger
 * — heads, structures, plans, demands, receipts, the bank import with UTR
 * matching — and a college keeps its money in it unchanged. What a college
 * adds sits here:
 *
 * STRUCTURES BY PROGRAMME, YEAR AND CATEGORY. A college structure is a
 * FeeStructure with `programmeId`, `yearOfStudy` and `category` set, the fee
 * regulating authority's approval reference and the late-fee slabs, one
 * instalment per term. A student is put on the one that matches their
 * programme, year of study and admission category (`raiseDemands`, idempotent:
 * a second run finds everyone already on their structure and changes
 * nothing; a student whose structure is missing is listed by name).
 *
 * CONCESSIONS WITH THE AUTHORITY NAMED, and the principal's approval above
 * the office's limit (CollegeOfficeSettings): a concession worth more than
 * the limit is written PENDING and NOT applied until the principal approves.
 *
 * THE LEDGER NET OF THE STATE'S SHARE (`ledgerFor`). What a scholarship is
 * expected to bring (APPLIED: the office's estimate; SANCTIONED: the
 * sanctioned amount) is a receivable set against the year's open demands in
 * due order, so the family sees what it owes net of it. A disbursement is a
 * payment on the ledger (scholarships.ts records it as the bank credit it
 * is); a lapse takes the receivable away and the demand is the family's
 * again. Computed on read, never stored.
 *
 * MESS AND ROUTE FEES: a month's mess charge for each boarder and a term's
 * route fee for each rider, as demands under the MESS and TRANSPORT heads,
 * each raised once.
 */

/* -------------------------------------------------------------------------- */
/* Structures                                                                  */
/* -------------------------------------------------------------------------- */

type Slab = { afterDays: number; paise: number };

export async function listCollegeStructures(ctx: ActiveContext, academicYearId?: string) {
  const d = await collegeDesk(ctx, MONEY_READ);
  const year = academicYearId ? await db.academicYear.findFirst({ where: { id: academicYearId, schoolId: d.schoolId }, select: { id: true, name: true } }) : await currentAcademicYear(d.schoolId);
  if (!year) return { structures: [], year: null };
  const rows = await db.feeStructure.findMany({
    where: { schoolId: d.schoolId, academicYearId: year.id, programmeId: { not: null }, archivedAt: null },
    orderBy: [{ programmeId: "asc" }, { yearOfStudy: "asc" }, { category: "asc" }],
    include: { instalments: { orderBy: { sortOrder: "asc" }, include: { lines: { select: { amountPaise: true } } } }, _count: { select: { plans: true } } },
  });
  return {
    year: { id: year.id, name: year.name },
    structures: rows.map((s) => {
      const terms = s.instalments.map((i) => ({ label: i.label, dueDateKey: dateToDay(i.dueDate), totalPaise: i.lines.reduce((a, l) => a + l.amountPaise, 0) }));
      return { id: s.id, name: s.name, programmeId: s.programmeId!, yearOfStudy: s.yearOfStudy ?? 1, category: s.category as CollegeCategory, approvalRef: s.approvalRef, published: Boolean(s.publishedAt), totalPaise: terms.reduce((a, t) => a + t.totalPaise, 0), terms, lateFeeSlabs: readJson<Slab[]>(s.lateFeeSlabsJson, []), students: s._count.plans };
    }),
  };
}

/**
 * A structure as the authority approved it: one per programme, year of study,
 * category and academic year (a second for the same four is refused — a
 * change after publishing is a new year's structure or an archived one
 * replaced). Written through the fee module and published at once, since an
 * approved fee is not a draft.
 */
export async function createCollegeStructure(
  ctx: ActiveContext,
  input: { academicYearId?: string; programmeId: string; yearOfStudy: number; category: CollegeCategory; approvalRef: string; name: string; terms: { label: string; dueDateKey: string; lines: { headId: string; amountPaise: number }[] }[]; lateFeeSlabs: Slab[] },
): Promise<{ id: string }> {
  const d = await collegeDesk(ctx, MONEY_WRITE);
  const programme = await db.programme.findFirst({ where: { id: input.programmeId, schoolId: d.schoolId }, select: { id: true } });
  if (!programme) throw new AccessError("collegeOffice.refuseProgramme");
  const year = input.academicYearId ? await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId: d.schoolId }, select: { id: true } }) : await currentAcademicYear(d.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const clash = await db.feeStructure.findFirst({ where: { schoolId: d.schoolId, academicYearId: year.id, programmeId: input.programmeId, yearOfStudy: input.yearOfStudy, category: input.category, archivedAt: null }, select: { id: true } });
  if (clash) throw new AccessError("collegeOffice.refuseStructureExists");
  const slabs = [...input.lateFeeSlabs].sort((a, b) => a.afterDays - b.afterDays);
  const id = await createStructure(ctx, { academicYearId: year.id, name: input.name, gradeLevel: null, instalments: input.terms });
  await db.feeStructure.update({ where: { id }, data: { programmeId: input.programmeId, yearOfStudy: input.yearOfStudy, category: input.category, approvalRef: input.approvalRef.trim(), lateFeeSlabsJson: writeJson(slabs) } });
  await publishStructure(ctx, id);
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.fees.structure", targetType: "FeeStructure", targetId: id, meta: { programmeId: input.programmeId, yearOfStudy: input.yearOfStudy, category: input.category } });
  return { id };
}

/** The late fee a demand overdue by `days` carries under the structure's slabs: the highest slab reached. */
export function lateFeeFor(days: number, slabs: readonly Slab[]): number {
  let fee = 0;
  for (const s of slabs) if (days >= s.afterDays) fee = Math.max(fee, s.paise);
  return fee;
}

/**
 * Every active student of the college on the structure their programme, year
 * of study and category call for, with their demands for each term. A second
 * run changes nothing (the fee module's assignment keeps a student on the
 * same structure as unchanged); a student with nothing paid moves to the
 * right structure; one with money paid against another is refused by the fee
 * module and counted.
 */
export async function raiseDemands(ctx: ActiveContext, input: { academicYearId?: string; programmeId?: string }) {
  const d = await collegeDesk(ctx, MONEY_WRITE);
  const year = input.academicYearId ? await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId: d.schoolId } }) : await currentAcademicYear(d.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const startYear = year.startDate.getUTCFullYear();
  const enrolments = await db.programmeEnrolment.findMany({
    where: { schoolId: d.schoolId, status: "ACTIVE", ...(input.programmeId ? { programmeId: input.programmeId } : {}), student: { status: "ACTIVE", leftAt: null } },
    select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
  });
  const structures = await db.feeStructure.findMany({ where: { schoolId: d.schoolId, academicYearId: year.id, programmeId: { not: null }, publishedAt: { not: null }, archivedAt: null }, select: { id: true, programmeId: true, yearOfStudy: true, category: true } });
  const byStructure = new Map<string, string[]>();
  const noStructure: { studentMembershipId: string; name: string }[] = [];
  for (const e of enrolments) {
    const s = await standingOf(e.studentMembershipId, startYear);
    const match = structures.find((x) => x.programmeId === s.programmeId && x.yearOfStudy === s.yearOfStudy && x.category === s.category);
    if (!match) {
      noStructure.push({ studentMembershipId: e.studentMembershipId, name: nameOf(e.student.user) });
      continue;
    }
    byStructure.set(match.id, [...(byStructure.get(match.id) ?? []), e.studentMembershipId]);
  }
  const caller = { schoolId: d.schoolId, userId: d.userId, role: d.role, membershipId: d.membershipId };
  let assigned = 0;
  let unchanged = 0;
  let refused = 0;
  for (const [structureId, ids] of byStructure) {
    const r = await assignPlansAs(caller, { structureId, studentMembershipIds: ids });
    assigned += r.assigned + r.moved;
    unchanged += r.unchanged;
    refused += r.refused.length;
  }
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.fees.raise", targetType: "AcademicYear", targetId: year.id, meta: { students: enrolments.length, assigned, unchanged, refused, noStructure: noStructure.length } });
  return { students: enrolments.length, assigned, unchanged, noStructure, refused };
}

/* -------------------------------------------------------------------------- */
/* Concessions                                                                 */
/* -------------------------------------------------------------------------- */

export async function officeSettings(schoolId: string): Promise<{ concessionLimitPaise: number }> {
  const row = await db.collegeOfficeSettings.findUnique({ where: { schoolId }, select: { concessionLimitPaise: true } });
  return { concessionLimitPaise: row?.concessionLimitPaise ?? 500_000 };
}

export async function accountsSettingsFor(ctx: ActiveContext) {
  const d = await collegeDesk(ctx, MONEY_READ);
  return officeSettings(d.schoolId);
}

export async function saveOfficeSettings(ctx: ActiveContext, input: { concessionLimitPaise: number }) {
  const d = await collegeDesk(ctx, ["ADMIN"]);
  await db.collegeOfficeSettings.upsert({ where: { schoolId: d.schoolId }, create: { schoolId: d.schoolId, concessionLimitPaise: input.concessionLimitPaise, updatedByUserId: d.userId }, update: { concessionLimitPaise: input.concessionLimitPaise, updatedByUserId: d.userId } });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.fees.settings", targetType: "School", targetId: d.schoolId, meta: { concessionLimitPaise: input.concessionLimitPaise } });
  return officeSettings(d.schoolId);
}

/** What a concession takes off this year's demands, in paise: worked out on the gross the student's plan asks. */
async function concessionWorth(schoolId: string, studentMembershipId: string, academicYearId: string, c: { headId: string | null; kind: string; value: number }): Promise<number> {
  const demands = await db.feeDemand.findMany({ where: { schoolId, studentMembershipId, academicYearId, instalmentId: { not: null } }, select: { linesJson: true } });
  const lines = demands.flatMap((x) => readJson<{ headId: string; grossPaise: number }[]>(x.linesJson, []));
  const gross = lines.filter((l) => !c.headId || l.headId === c.headId).reduce((a, l) => a + l.grossPaise, 0);
  if (c.kind === "PERCENT") return Math.round((gross * c.value) / 10000);
  // An amount is taken per instalment (fees.ts), so its worth is the amount once per term, never more than the gross.
  return Math.min(gross, c.value * Math.max(1, demands.length));
}

/**
 * A concession at a college: the reason and the sanctioning authority
 * recorded; worth more than the office's limit, it waits for the principal
 * and is not applied until approved.
 */
export async function grantCollegeConcession(ctx: ActiveContext, input: { studentMembershipId: string; headId?: string | null; kind: "PERCENT" | "AMOUNT"; value: number; reason: string; authority: string }): Promise<{ id: string; approvalStatus: "APPROVED" | "PENDING"; valuePaise: number }> {
  const d = await collegeDesk(ctx, MONEY_WRITE);
  const student = await collegeStudent(d.schoolId, input.studentMembershipId);
  const year = await currentAcademicYear(d.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  if (input.headId && !(await db.feeHead.findFirst({ where: { id: input.headId, schoolId: d.schoolId }, select: { id: true } }))) throw new AccessError("fees.refuseUnknownHead");
  if (input.kind === "PERCENT" && (input.value <= 0 || input.value > 10000)) throw new AccessError("fees.refusePercent");
  const reason = input.reason.trim().slice(0, 200);
  if (reason.length < 3) throw new AccessError("fees.refuseReason");
  const valuePaise = await concessionWorth(d.schoolId, student.id, year.id, { headId: input.headId ?? null, kind: input.kind, value: input.value });
  const { concessionLimitPaise } = await officeSettings(d.schoolId);
  const approvalStatus = valuePaise > concessionLimitPaise ? "PENDING" : "APPROVED";
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const row = await tx.feeConcession.create({ data: { schoolId: d.schoolId, studentMembershipId: student.id, academicYearId: year.id, headId: input.headId ?? null, kind: input.kind, value: input.value, reason, grantedByUserId: d.userId, authority: input.authority.trim().slice(0, 120), approvalStatus, ...(approvalStatus === "APPROVED" ? { approvedByUserId: d.userId, approvedAt: new Date() } : {}) }, select: { id: true } });
    if (approvalStatus === "APPROVED") await regenerateDemands(tx, d.schoolId, student.id, year.id);
    return row.id;
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.fees.concession", targetType: "Membership", targetId: student.id, meta: { concessionId: id, kind: input.kind, value: input.value, valuePaise, approvalStatus } });
  if (approvalStatus === "PENDING") {
    const principals = await officeUserIds(d.schoolId, ["PRINCIPAL"]);
    await Promise.all(principals.map((userId) => notify({ userId, schoolId: d.schoolId, kind: "SYSTEM", titleKey: "collegeOffice.notifConcessionAsk", titleVars: { name: nameOf(student.user) }, url: "/accounts/concessions" }).catch(() => undefined)));
  }
  return { id, approvalStatus, valuePaise };
}

export async function pendingConcessions(ctx: ActiveContext) {
  const d = await collegeDesk(ctx, MONEY_READ);
  const rows = await db.feeConcession.findMany({ where: { schoolId: d.schoolId, approvalStatus: "PENDING", revokedAt: null }, orderBy: { createdAt: "asc" }, include: { student: { select: { user: { select: { name: true, preferredName: true } } } }, grantedBy: { select: { name: true } } } });
  const items = [];
  for (const c of rows) items.push({ id: c.id, studentMembershipId: c.studentMembershipId, studentName: nameOf(c.student.user), kind: c.kind, value: c.value, valuePaise: await concessionWorth(d.schoolId, c.studentMembershipId, c.academicYearId, c), reason: c.reason, authority: c.authority, grantedBy: c.grantedBy.name, createdAt: c.createdAt.toISOString() });
  return { items };
}

/** The principal's word on a concession above the limit: approved, it is applied now; refused, it never is. */
export async function decideConcession(ctx: ActiveContext, concessionId: string, input: { approve: boolean; note?: string }): Promise<{ approvalStatus: string }> {
  const d = await collegeDesk(ctx, ["PRINCIPAL"]);
  const c = await db.feeConcession.findFirst({ where: { id: concessionId, schoolId: d.schoolId }, select: { id: true, approvalStatus: true, studentMembershipId: true, academicYearId: true, grantedByUserId: true } });
  if (!c) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  if (c.approvalStatus !== "PENDING") return { approvalStatus: c.approvalStatus };
  const approvalStatus = input.approve ? "APPROVED" : "REFUSED";
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.feeConcession.update({ where: { id: c.id }, data: { approvalStatus, approvedByUserId: d.userId, approvedAt: new Date() } });
    if (input.approve) await regenerateDemands(tx, d.schoolId, c.studentMembershipId, c.academicYearId);
  });
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: input.approve ? "college.fees.concessionApprove" : "college.fees.concessionRefuse", targetType: "FeeConcession", targetId: c.id, meta: { note: input.note?.trim().slice(0, 300) ?? null } });
  await notify({ userId: c.grantedByUserId, schoolId: d.schoolId, kind: "SYSTEM", titleKey: input.approve ? "collegeOffice.notifConcessionApproved" : "collegeOffice.notifConcessionRefused", url: "/accounts/concessions" }).catch(() => undefined);
  return { approvalStatus };
}

/* -------------------------------------------------------------------------- */
/* The ledger net of the state's share                                         */
/* -------------------------------------------------------------------------- */

/** What one claim is still expected to bring: the estimate while APPLIED, the sanction while SANCTIONED, nothing once settled or gone. */
export function claimReceivable(c: { status: string; expectedPaise: number; sanctionedPaise: number | null; disbursedPaise: number | null }): number {
  if (c.status === "APPLIED") return Math.max(0, c.expectedPaise);
  if (c.status === "SANCTIONED") return Math.max(0, (c.sanctionedPaise ?? 0) - (c.disbursedPaise ?? 0));
  return 0;
}

/**
 * THE STUDENT'S LEDGER FOR A YEAR (the function other builders read): each
 * demand with the scholarship receivable set against it (the claims'
 * receivable, spread over the open demands in due order, never more than a
 * demand still owes), what was paid, and what the family owes net of the
 * state's share. `academicYearId` defaults to the current year. Plain reads;
 * the caller has bound the person.
 */
export async function ledgerFor(studentMembershipId: string, academicYearId?: string): Promise<StudentLedger> {
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, role: "STUDENT" }, select: { id: true, schoolId: true, user: { select: { name: true, preferredName: true } }, school: { select: { timezone: true } } } });
  if (!m) throw new AccessError("collegeOffice.notFound", "NOT_FOUND");
  const today = todayKey(m.school.timezone);
  const year = academicYearId ? await db.academicYear.findFirst({ where: { id: academicYearId, schoolId: m.schoolId } }) : await currentAcademicYear(m.schoolId);
  const standing = await standingOf(m.id, year ? year.startDate.getUTCFullYear() : null);
  const empty = { demandPaise: 0, scholarshipReceivablePaise: 0, paidPaise: 0, netDuePaise: 0 };
  if (!year) return { student: { studentMembershipId: m.id, name: nameOf(m.user), programmeId: standing.programmeId, category: standing.category, yearOfStudy: standing.yearOfStudy }, year: null, terms: [], claims: [], totals: empty, todayKey: today };
  const yearKey = yearKeyOf(year.startDate);
  const [demands, claims, plan] = await Promise.all([
    db.feeDemand.findMany({ where: { studentMembershipId: m.id, academicYearId: year.id, status: { notIn: ["CANCELLED", "CARRIED"] } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    db.scholarshipClaim.findMany({ where: { studentMembershipId: m.id, academicYear: yearKey }, orderBy: { createdAt: "asc" } }),
    db.studentFeePlan.findUnique({ where: { studentMembershipId_academicYearId: { studentMembershipId: m.id, academicYearId: year.id } }, select: { structure: { select: { lateFeeSlabsJson: true } } } }),
  ]);
  const slabs = readJson<Slab[]>(plan?.structure.lateFeeSlabsJson, []);
  let pool = claims.reduce((a, c) => a + claimReceivable(c), 0);
  const terms = demands.map((x) => {
    const outstanding = x.status === "OPEN" || x.status === "PART" ? Math.max(0, x.netPaise - x.paidPaise) : 0;
    const receivable = Math.min(pool, outstanding);
    pool -= receivable;
    const dueKey = dateToDay(x.dueDate);
    const netDue = outstanding - receivable;
    const overdueDays = netDue > 0 && dueKey < today ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dueKey}T00:00:00Z`)) / 86_400_000) : 0;
    return { demandId: x.id, label: x.label, dueDateKey: dueKey, demandPaise: x.netPaise, scholarshipReceivablePaise: receivable, paidPaise: x.paidPaise, netDuePaise: netDue, status: x.status, overdue: overdueDays > 0, lateFeePaise: overdueDays > 0 ? lateFeeFor(overdueDays, slabs) : 0 };
  });
  return {
    student: { studentMembershipId: m.id, name: nameOf(m.user), programmeId: standing.programmeId, category: standing.category, yearOfStudy: standing.yearOfStudy },
    year: { id: year.id, name: year.name },
    terms,
    claims: claims.map((c) => ({ id: c.id, scheme: c.scheme as ScholarshipScheme, status: c.status as StudentLedger["claims"][number]["status"], receivablePaise: claimReceivable(c), sanctionedPaise: c.sanctionedPaise, disbursedPaise: c.disbursedPaise })),
    totals: terms.reduce((t, x) => ({ demandPaise: t.demandPaise + x.demandPaise, scholarshipReceivablePaise: t.scholarshipReceivablePaise + x.scholarshipReceivablePaise, paidPaise: t.paidPaise + x.paidPaise, netDuePaise: t.netDuePaise + x.netDuePaise }), empty),
    todayKey: today,
  };
}

/** The desk's read of one student's ledger. */
export async function officeLedger(ctx: ActiveContext, studentMembershipId: string): Promise<StudentLedger> {
  const d = await collegeDesk(ctx, MONEY_READ);
  await collegeStudent(d.schoolId, studentMembershipId);
  return ledgerFor(studentMembershipId);
}

/**
 * The student's own ledger, or a guardian's read of it: a minor's guardian
 * always, an adult's only while the student grants MONEY (parentMaySee, via
 * assertGuardianAccess with the grant named).
 */
export async function myLedger(ctx: ActiveContext, childId?: string): Promise<StudentLedger> {
  if (ctx.role === "STUDENT" && ctx.membershipId && ctx.schoolId) {
    if (!isCollegeKind(await kindOf(ctx.schoolId))) throw new AccessError("collegeOffice.refuseNotCollege", "NOT_FOUND");
    return ledgerFor(ctx.membershipId);
  }
  if (ctx.role === "PARENT") {
    const link = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, status: "ACTIVE", ...(childId ? { studentMembershipId: childId } : {}) }, orderBy: { createdAt: "asc" }, select: { studentMembershipId: true, studentSchoolId: true } });
    if (!link) throw new AccessError("access.notYourChild", "NOT_FOUND");
    if (!isCollegeKind(await kindOf(link.studentSchoolId))) throw new AccessError("collegeOffice.refuseNotCollege", "NOT_FOUND");
    await assertGuardianAccess(ctx.user.id, link.studentMembershipId, "MONEY");
    // A guardian's session carries no school: the child's college's rows are read under its binding.
    return forSchool(link.studentSchoolId, () => ledgerFor(link.studentMembershipId));
  }
  throw new AccessError("access.wrongRoleForThisAction");
}

/** For scholarships.ts: the eligible heads' gross for a student's year — what a scheme's share is worked out on. */
export async function eligibleGrossPaise(schoolId: string, studentMembershipId: string, academicYearId: string): Promise<number> {
  const heads = new Set((await db.feeHead.findMany({ where: { schoolId, kind: { in: ["TUITION", "DEVELOPMENT", "EXAM"] } }, select: { id: true } })).map((h) => h.id));
  const demands = await db.feeDemand.findMany({ where: { schoolId, studentMembershipId, academicYearId, status: { notIn: ["CANCELLED", "CARRIED"] } }, select: { linesJson: true } });
  return demands.flatMap((x) => readJson<{ headId: string; grossPaise: number; concessionPaise: number }[]>(x.linesJson, [])).filter((l) => heads.has(l.headId)).reduce((a, l) => a + l.grossPaise - l.concessionPaise, 0);
}

/** The scheme's share of the eligible fee, the office's starting estimate of a claim. */
export async function expectedShare(schoolId: string, studentMembershipId: string, academicYearId: string, scheme: ScholarshipScheme): Promise<number> {
  const pct = SCHOLARSHIP_SCHEME_TABLE[scheme].coversPercent;
  if (pct <= 0) return 0;
  return Math.round(((await eligibleGrossPaise(schoolId, studentMembershipId, academicYearId)) * pct) / 100);
}

/* -------------------------------------------------------------------------- */
/* Mess and route fees                                                         */
/* -------------------------------------------------------------------------- */

async function headOfKind(schoolId: string, kind: "MESS" | "TRANSPORT") {
  const head = await db.feeHead.findFirst({ where: { schoolId, kind, retiredAt: null }, orderBy: { sortOrder: "asc" }, select: { id: true, code: true, name: true } });
  if (!head) throw new AccessError(kind === "MESS" ? "collegeOffice.refuseNoMessHead" : "collegeOffice.refuseNoTransportHead");
  return head;
}

/** One demand for an extra charge (instalment-less, like a library fine), unless the same label already stands for the student. */
async function raiseOnce(schoolId: string, academicYearId: string, studentMembershipId: string, label: string, dueKey: string, head: { id: string; code: string; name: string }, paise: number): Promise<boolean> {
  const exists = await db.feeDemand.findFirst({ where: { schoolId, studentMembershipId, academicYearId, instalmentId: null, label, status: { not: "CANCELLED" } }, select: { id: true } });
  if (exists) return false;
  await db.feeDemand.create({ data: { schoolId, studentMembershipId, academicYearId, instalmentId: null, label, dueDate: dayToDate(dueKey), grossPaise: paise, concessionPaise: 0, netPaise: paise, linesJson: writeJson([{ headId: head.id, code: head.code, name: head.name, grossPaise: paise, concessionPaise: 0 }]), status: "OPEN" } });
  return true;
}

/**
 * THE MESS BILL for a month: each boarder with a bed that month, at their
 * hostel's monthly charge, under the MESS head, due on the tenth of the
 * following month. A hostel with no charge is skipped; a month billed twice
 * bills nobody twice.
 */
export async function billMess(ctx: ActiveContext, input: { month: string; hostelId?: string }): Promise<{ billed: number; already: number; skipped: number }> {
  const d = await collegeDesk(ctx, MONEY_WRITE, "HOSTEL");
  if (!/^\d{4}-\d{2}$/.test(input.month)) throw new AccessError("collegeOffice.refuseDates");
  const year = await currentAcademicYear(d.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const head = await headOfKind(d.schoolId, "MESS");
  const t = await getT();
  const first = `${input.month}-01`;
  const [y, mo] = input.month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
  const due = new Date(Date.UTC(y, mo, 10)).toISOString().slice(0, 10);
  const hostels = await db.hostel.findMany({ where: { schoolId: d.schoolId, ...(input.hostelId ? { id: input.hostelId } : {}) }, select: { id: true, messMonthlyPaise: true } });
  let billed = 0;
  let already = 0;
  let skipped = 0;
  for (const h of hostels) {
    const boarders = await db.hostelAllotment.findMany({ where: { schoolId: d.schoolId, room: { hostelId: h.id }, fromDate: { lte: last }, OR: [{ toDate: null }, { toDate: { gte: first } }] }, select: { membershipId: true } });
    if (h.messMonthlyPaise <= 0) {
      skipped += boarders.length;
      continue;
    }
    for (const b of [...new Set(boarders.map((x) => x.membershipId))]) {
      if (await raiseOnce(d.schoolId, year.id, b, t("collegeOffice.messLabel", { month: input.month }), due, head, h.messMonthlyPaise)) billed += 1;
      else already += 1;
    }
  }
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.fees.mess", targetType: "School", targetId: d.schoolId, meta: { month: input.month, billed, already } });
  return { billed, already, skipped };
}

/**
 * A TERM'S ROUTE FEE for each student riding a route that charges one (a
 * campus shuttle on a loop has no roster and charges nobody), under the
 * TRANSPORT head. Raised once per student, route and term label.
 */
export async function raiseRouteFees(ctx: ActiveContext, input: { termLabel: string; dueDateKey: string }): Promise<{ raised: number; already: number }> {
  const d = await collegeDesk(ctx, MONEY_WRITE, "TRANSPORT");
  const year = await currentAcademicYear(d.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const head = await headOfKind(d.schoolId, "TRANSPORT");
  const t = await getT();
  const routes = await db.transportRoute.findMany({ where: { schoolId: d.schoolId, active: true, kind: "FIXED", feePerTermPaise: { gt: 0 } }, select: { id: true, name: true, feePerTermPaise: true } });
  let raised = 0;
  let already = 0;
  for (const r of routes) {
    const riders = await db.transportAllotment.findMany({ where: { schoolId: d.schoolId, routeId: r.id, OR: [{ toDateKey: null }, { toDateKey: { gte: input.dueDateKey } }], student: { role: "STUDENT", leftAt: null } }, select: { studentMembershipId: true } });
    for (const rider of [...new Set(riders.map((x) => x.studentMembershipId))]) {
      if (await raiseOnce(d.schoolId, year.id, rider, t("collegeOffice.routeFeeLabel", { term: input.termLabel.trim(), route: r.name }), input.dueDateKey, head, r.feePerTermPaise)) raised += 1;
      else already += 1;
    }
  }
  await audit({ schoolId: d.schoolId, actorUserId: d.userId, action: "college.fees.route", targetType: "School", targetId: d.schoolId, meta: { term: input.termLabel, raised, already } });
  return { raised, already };
}

