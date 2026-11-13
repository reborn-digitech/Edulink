import "server-only";
import type { FamilyLeaving, LeavingSettleBody, LeavingSettlementView, SettlementChoice } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { readJson, writeJson } from "./json";
import { notifyGuardians } from "./notify";
import { noDuesFor } from "./no-dues";
import { dateToDay } from "./fees";
import { assertGuardianAccess } from "./tenancy";
import { forSchool } from "./tenant-context";
import { listContexts } from "./session";
import type { ActiveContext } from "./session";

/**
 * SETTLE ON LEAVING (R-61 Q2, the owner's decision of 10 October 2026).
 *
 * When a pupil (or a college student) is recorded as leaving, the departure
 * itself CANCELS every later instalment nothing was paid against
 * (school-record.ts `recordDeparture`, A3-journeys-15), and that stays. What
 * it could not decide for the office is listed here in one step: the
 * part-paid later instalments and the unpaid earlier ones — each with its
 * balance — and the items still out at the library, the hostel and the lab
 * (the no-dues lines, read-only: a book comes back through the library's own
 * writer, never through this one). The office decides each money line ONCE:
 *
 *   CANCEL  the balance is cancelled — the demand goes WAIVED, the amount
 *           already paid kept on it, so the ledger shows what was asked, what
 *           arrived and that the rest was let go; the dues list, the reminders
 *           and the family's "outstanding" stop chasing it;
 *   KEEP    the demand stays as it is, owed, and the office collects it or
 *           refunds and settles it by hand later.
 *
 * ONE WRITER: `settleOnLeaving`, one row per leaver (`LeavingSettlement`,
 * unique on the membership), refused a second time — the choices are a
 * record, not a draft. Audited `fees.leavingSettled` with the totals, never
 * a name. The guardians are told; the family's fees page reads the outcome
 * through `familyLeavingOutcome`. Nothing here moves money (decision 0003).
 */

type SettledLine = { demandId: string; label: string; dueDateKey: string; balancePaise: number; choice: SettlementChoice };

const OFFICE_READERS = ["ADMIN", "PRINCIPAL", "ACCOUNTS"] as const;

async function leaverOf(ctx: ActiveContext, studentMembershipId: string) {
  if (!ctx.schoolId || !ctx.role || !(OFFICE_READERS as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  const m = await db.membership.findFirst({ where: { id: studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT" }, select: { id: true, schoolId: true, leftAt: true, user: { select: { name: true, preferredName: true } } } });
  if (!m) throw new AccessError("fees.notFound", "NOT_FOUND");
  return m;
}

/** Everything the office sees about one leaver's settlement: what the departure cancelled, what is still owed, what is out, and the decision once made. */
export async function leavingSettlementFor(ctx: ActiveContext, studentMembershipId: string): Promise<LeavingSettlementView> {
  const m = await leaverOf(ctx, studentMembershipId);
  const leftOnKey = m.leftAt ? dateToDay(m.leftAt) : null;
  const [demands, settlement, clearance] = await Promise.all([
    db.feeDemand.findMany({ where: { schoolId: m.schoolId, studentMembershipId: m.id }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], select: { id: true, label: true, dueDate: true, netPaise: true, paidPaise: true, status: true } }),
    db.leavingSettlement.findUnique({ where: { studentMembershipId: m.id }, select: { decidedAt: true, decidedByUserId: true, linesJson: true } }),
    noDuesFor(m.id, "LEAVING"),
  ]);
  const decided = settlement ? readJson<SettledLine[]>(settlement.linesJson, []) : [];
  const choiceOf = new Map(decided.map((l) => [l.demandId, l.choice]));
  const owed = demands
    .filter((d) => (d.status === "OPEN" || d.status === "PART" || choiceOf.has(d.id)) && (choiceOf.has(d.id) || d.netPaise - d.paidPaise > 0))
    .map((d) => {
      const dueDateKey = dateToDay(d.dueDate);
      const recorded = decided.find((l) => l.demandId === d.id);
      return { demandId: d.id, label: d.label, dueDateKey, netPaise: d.netPaise, paidPaise: d.paidPaise, balancePaise: recorded ? recorded.balancePaise : Math.max(0, d.netPaise - d.paidPaise), later: leftOnKey !== null && dueDateKey > leftOnKey, choice: choiceOf.get(d.id) ?? null };
    });
  const cancelled = demands.filter((d) => d.status === "CANCELLED" && (leftOnKey === null || dateToDay(d.dueDate) > leftOnKey)).map((d) => ({ demandId: d.id, label: d.label, dueDateKey: dateToDay(d.dueDate), netPaise: d.netPaise }));
  const items = clearance.lines.filter((l) => l.itemsOut > 0).map((l) => ({ desk: l.desk, itemsOut: l.itemsOut, owedPaise: l.owedPaise }));
  const decider = settlement ? await db.user.findUnique({ where: { id: settlement.decidedByUserId }, select: { name: true } }) : null;
  return {
    studentMembershipId: m.id,
    studentName: m.user.preferredName ?? m.user.name,
    leftOnKey,
    owed,
    cancelled,
    items,
    settled: settlement
      ? { decidedAt: settlement.decidedAt.toISOString(), decidedBy: decider?.name ?? null, cancelledPaise: decided.filter((l) => l.choice === "CANCEL").reduce((a, l) => a + l.balancePaise, 0), keptPaise: decided.filter((l) => l.choice === "KEEP").reduce((a, l) => a + l.balancePaise, 0) }
      : null,
    canSettle: ctx.role === "ADMIN" && m.leftAt !== null && !settlement,
  };
}

/** The office records its choice on every owed line, once. */
export async function settleOnLeaving(ctx: ActiveContext, studentMembershipId: string, input: LeavingSettleBody): Promise<LeavingSettlementView> {
  if (ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const view = await leavingSettlementFor(ctx, studentMembershipId);
  if (!view.leftOnKey) throw new RuleRefusal("ownerDecisions.refuseNotLeft", 409);
  if (view.settled) throw new RuleRefusal("ownerDecisions.refuseSettledAlready", 409);
  const choices = new Map(input.lines.map((l) => [l.demandId, l.choice]));
  const owedIds = new Set(view.owed.map((l) => l.demandId));
  for (const id of choices.keys()) if (!owedIds.has(id)) throw new RuleRefusal("ownerDecisions.refuseLineUnknown", 422, undefined, "lines");
  const missing = view.owed.filter((l) => !choices.has(l.demandId));
  if (missing.length) throw new RuleRefusal("ownerDecisions.refuseLineMissing", 422, { count: missing.length }, "lines");
  const lines: SettledLine[] = view.owed.map((l) => ({ demandId: l.demandId, label: l.label, dueDateKey: l.dueDateKey, balancePaise: l.balancePaise, choice: choices.get(l.demandId)! }));
  const schoolId = ctx.schoolId!;
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const toCancel = lines.filter((l) => l.choice === "CANCEL").map((l) => l.demandId);
    if (toCancel.length) await tx.feeDemand.updateMany({ where: { id: { in: toCancel }, schoolId, studentMembershipId, status: { in: ["OPEN", "PART"] } }, data: { status: "WAIVED" } });
    await tx.leavingSettlement.create({ data: { schoolId, studentMembershipId, decidedByUserId: ctx.user.id, linesJson: writeJson(lines), itemsJson: writeJson(view.items), cancelledJson: writeJson(view.cancelled.map((c) => c.demandId)) } });
  });
  const cancelledPaise = lines.filter((l) => l.choice === "CANCEL").reduce((a, l) => a + l.balancePaise, 0);
  const keptPaise = lines.filter((l) => l.choice === "KEEP").reduce((a, l) => a + l.balancePaise, 0);
  await audit({ schoolId, actorUserId: ctx.user.id, action: "fees.leavingSettled", targetType: "Membership", targetId: studentMembershipId, meta: { lines: lines.length, cancelled: lines.filter((l) => l.choice === "CANCEL").length, cancelledPaise, keptPaise, itemsOut: view.items.reduce((a, i) => a + i.itemsOut, 0), byDeparture: view.cancelled.length } });
  await notifyGuardians(studentMembershipId, (child) => ({ schoolId, kind: "FEES", titleKey: "ownerDecisions.notifSettledTitle", titleVars: { child }, bodyKey: "ownerDecisions.notifSettledBody", bodyVars: { child, cancelled: (cancelledPaise / 100).toFixed(2), kept: (keptPaise / 100).toFixed(2) }, url: "/parent/fees" }), "MONEY").catch((error) => console.error("[leaving-settlement] guardians not told", error));
  return leavingSettlementFor(ctx, studentMembershipId);
}

/** The family's read of the outcome, for the child named or the guardian's first, under the MONEY grant as the fees page is. */
export async function familyLeavingOutcome(ctx: ActiveContext, childId?: string | null): Promise<FamilyLeaving> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const { children } = await listContexts(ctx.user.id);
  const selected = childId ?? children.find((c) => c.leftAt)?.studentMembershipId ?? children[0]?.studentMembershipId;
  if (!selected) throw new AccessError("access.notAllowed");
  const link = await assertGuardianAccess(ctx.user.id, selected, "MONEY");
  const schoolId = link.student.schoolId;
  const leftAt = link.student.leftAt;
  const leftOnKey = leftAt ? dateToDay(leftAt) : null;
  return forSchool(schoolId, async () => {
    const [settlement, cancelled] = await Promise.all([
      db.leavingSettlement.findUnique({ where: { studentMembershipId: selected }, select: { decidedAt: true, linesJson: true } }),
      leftAt ? db.feeDemand.findMany({ where: { schoolId, studentMembershipId: selected, status: "CANCELLED", dueDate: { gt: leftAt } }, orderBy: { dueDate: "asc" }, select: { label: true, dueDate: true, netPaise: true } }) : Promise.resolve([]),
    ]);
    const lines = settlement ? readJson<SettledLine[]>(settlement.linesJson, []) : [];
    return {
      studentMembershipId: selected,
      studentName: link.student.user.preferredName ?? link.student.user.name,
      leftOnKey,
      cancelledByDeparture: cancelled.map((d) => ({ label: d.label, dueDateKey: dateToDay(d.dueDate), netPaise: d.netPaise })),
      settlement: settlement
        ? { decidedAt: settlement.decidedAt.toISOString(), lines: lines.map((l) => ({ label: l.label, dueDateKey: l.dueDateKey, balancePaise: l.balancePaise, choice: l.choice })), cancelledPaise: lines.filter((l) => l.choice === "CANCEL").reduce((a, l) => a + l.balancePaise, 0), keptPaise: lines.filter((l) => l.choice === "KEEP").reduce((a, l) => a + l.balancePaise, 0) }
        : null,
    };
  });
}
