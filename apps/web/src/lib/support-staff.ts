import "server-only";
import type { SupportStaffCreate, SupportStaffCreated } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { audit } from "./audit";
import { assertModuleOn } from "./modules";
import { normalisePhone } from "./phone";
import { RuleRefusal } from "./rule-refusal";
import { todayKey } from "./dates";
import { writeJson } from "./json";
import { salaryViewOf, saveSalary } from "./payroll";
import type { ActiveContext } from "./session";

/**
 * owner-batch-item2a (27 October 2026): SUPPORT STAFF WITHOUT A LOGIN.
 *
 * WHAT WAS WRONG. Everyone on a pay run is a Membership with a User
 * (Payslip, StaffSalary and StaffRecord all name a membership), the run's
 * roll is the school's staff roles, and the only support role was DRIVER.
 * There was no way for the office to put a cleaner, cook, guard or peon on
 * the books, so none of them could have a salary, a slip, or a PF or ESI
 * line.
 *
 * WHAT IT IS. One role, SUPPORT, with the job in the staff record's
 * designation (the owner's decision: not a role per job). The office adds a
 * worker here: a User with no email, no phone, no password and no handle —
 * nobody can sign in as it — an ACTIVE SUPPORT membership, and a staff
 * record with the designation, the joining date and the number the office
 * rings them on (StaffRecord.contactPhone, never the account's sign-in
 * phone, which is unique and proved by its owner). SUPPORT is in
 * SCHOOL_STAFF_ROLES, so the staff register, the staff list and the payroll
 * (the roll, salaries, advances recorded by the office, the run, the slips
 * and the files) take them like anyone else. A salary given here is saved by
 * payroll's own writer (saveSalary), once the worker exists; should it be
 * refused, the worker made a moment ago is taken away again, so the office
 * never finds half a person.
 *
 * A SECOND PRESS. The same name, job and joining day added within ten
 * minutes is answered with the worker the first press made (duplicate:
 * true), under a lock per school so two presses at once make one person.
 * Two people of the same name and job joining the same day ten minutes
 * apart is the office's to do on purpose, a while later.
 */

/** How long a second identical add is taken for the same press. */
const SAME_PRESS_MS = 10 * 60 * 1000;

type Tx = typeof db;

/** How long a press that found the worker waits for the first press to save the salary, and how often it looks. */
const SALARY_WAIT_MS = 5_000;
const SALARY_LOOK_MS = 50;

export async function addSupportStaff(ctx: ActiveContext, input: SupportStaffCreate, retried = false): Promise<SupportStaffCreated> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  const schoolId = ctx.schoolId;
  const name = input.name.trim().replace(/\s+/g, " ");
  const designation = input.designation.trim().replace(/\s+/g, " ");

  const phone = input.phone.trim() === "" ? null : normalisePhone(input.phone);
  if (input.phone.trim() !== "" && !phone) throw new RuleRefusal("supportStaff.refusePhone", 422, undefined, "phone");

  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, isTestFixture: true } });
  if (input.joinedOnKey > todayKey(school.timezone)) throw new RuleRefusal("supportStaff.refuseJoinedLater", 422, undefined, "joinedOnKey");

  // The salary is checked before anybody is made: the module, and a structure of this school's still in use.
  if (input.salary) {
    await assertModuleOn(schoolId, "PAYROLL");
    const structure = await db.salaryStructure.findFirst({ where: { id: input.salary.structureId, schoolId, archivedAt: null }, select: { id: true } });
    if (!structure) throw new RuleRefusal("payroll.refuseUnknownStructure", 422, undefined, "salary.structureId");
  }

  const joinedOn = new Date(`${input.joinedOnKey}T00:00:00.000Z`);
  const made = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // One add at a time per school, so two presses at once see each other.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`support-staff:${schoolId}`}))`;
    const same = await tx.membership.findFirst({
      where: {
        schoolId,
        role: "SUPPORT",
        status: "ACTIVE",
        leftAt: null,
        joinedAt: { gte: new Date(Date.now() - SAME_PRESS_MS) },
        user: { name: { equals: name, mode: "insensitive" } },
        staffRecord: { is: { designation: { equals: designation, mode: "insensitive" }, joinedOn } },
      },
      select: { id: true, staffRecord: { select: { contactPhone: true } } },
    });
    if (same) return { membershipId: same.id, userId: null, phone: same.staffRecord?.contactPhone ?? null, duplicate: true as const };
    const user = await tx.user.create({
      data: {
        name,
        // No email, phone, password or handle: an account nobody can sign in as.
        email: null,
        phone: null,
        passwordHash: null,
        // A worker made at a test school is a test person too, and keeps out of the cross-school directories as they do.
        isTestFixture: school.isTestFixture,
        prefs: writeJson({ theme: "system" }),
      },
      select: { id: true },
    });
    const membership = await tx.membership.create({ data: { userId: user.id, schoolId, role: "SUPPORT", status: "ACTIVE" }, select: { id: true } });
    await tx.staffRecord.create({ data: { schoolId, membershipId: membership.id, designation, joinedOn, contactPhone: phone } });
    return { membershipId: membership.id, userId: user.id, phone, duplicate: false as const };
  });

  if (made.duplicate) {
    // The worker another press made, with the salary it saved (qb-B, QB-06: this answered `salary: null`). That press
    // saves the salary just after its worker is made, so a press fired with it may arrive in between: it waits a
    // moment for the salary. Should the first press's salary have been refused, its worker is gone again; this press
    // then adds afresh once, and meets the same refusal itself.
    let salary = await salaryViewOf(schoolId, made.membershipId);
    for (let waited = 0; input.salary && !salary?.salary && waited < SALARY_WAIT_MS; waited += SALARY_LOOK_MS) {
      await new Promise((resolve) => setTimeout(resolve, SALARY_LOOK_MS));
      salary = await salaryViewOf(schoolId, made.membershipId);
      if (!salary) break;
    }
    if (!salary && !retried) return addSupportStaff(ctx, input, true);
    return { membershipId: made.membershipId, name, role: "SUPPORT", designation, joinedOnKey: input.joinedOnKey, phone: made.phone, salary: salary?.salary ? salary : null, duplicate: true };
  }

  let salary: SupportStaffCreated["salary"] = null;
  if (input.salary) {
    try {
      salary = await saveSalary(ctx, {
        membershipId: made.membershipId,
        structureId: input.salary.structureId,
        effectiveFrom: input.salary.effectiveFrom ?? input.joinedOnKey,
        basicPaise: input.salary.basicPaise,
        overrides: {},
        pfUan: "",
        esiNumber: "",
        pan: "",
        bankAccount: "",
        bankIfsc: "",
        bankName: "",
        upiId: "",
        paymentMode: input.salary.paymentMode,
      });
    } catch (error) {
      // Refused after the worker was made: take the worker away again, so the office finds nobody half added.
      await removeJustMade(schoolId, made.membershipId, made.userId);
      throw error;
    }
  }

  // What was done, never the phone: the log is read by the whole office.
  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "staff.support.add",
    targetType: "Membership",
    targetId: made.membershipId,
    meta: { designation, joinedOn: input.joinedOnKey, hasPhone: phone !== null, salary: salary !== null, mode: input.salary?.paymentMode ?? null },
  });

  return { membershipId: made.membershipId, name, role: "SUPPORT", designation, joinedOnKey: input.joinedOnKey, phone, salary, duplicate: false };
}

/** The worker this request made, removed when their salary was refused: the salary rows, the record, the membership, the account (which holds nothing else). */
async function removeJustMade(schoolId: string, membershipId: string, userId: string | null): Promise<void> {
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.staffSalary.deleteMany({ where: { schoolId, membershipId } });
    await tx.staffRecord.deleteMany({ where: { schoolId, membershipId } });
    await tx.membership.deleteMany({ where: { schoolId, id: membershipId, role: "SUPPORT" } });
    if (userId) await tx.user.deleteMany({ where: { id: userId, email: null, passwordHash: null, memberships: { none: {} } } });
  });
}
