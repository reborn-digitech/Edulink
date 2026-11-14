import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { currentAcademicYear } from "./academic-year";
import { isDateKey } from "./dates";
import { readJson, writeJson } from "./json";
import { sealingAvailable, seal, open } from "./secret-box";
import { isDeployedServer, readFeesGatewayTransport } from "./env";
import { notify } from "./notify";
import { standingOf } from "./college-office";
import { FEE_ORDER_RECONCILE_AFTER_MS } from "./constants";
import type { GatewayAccount } from "./gateway";
import type { ActiveContext } from "./session";
import type { FeeConcessionKind, FeeHeadKind } from "./constants";
import { FEE_HEAD_KINDS } from "./constants";
import { isCollegeKind } from "./institution";

/**
 * Fees: what a school asks its families for.
 *
 * THIS FILE IS THE ASKING SIDE — heads, structures, who is on which plan, the
 * concessions, and the DEMANDS those produce (one row per pupil per
 * instalment: the materialised due). `fees-payments.ts` is the receiving side
 * and `fees-reports.ts` the reading side. The split follows the money: nothing
 * here ever changes a `paidPaise`.
 *
 * MONEY IS INTEGER PAISE THROUGHOUT. A percentage concession, or an amount
 * on one head, is applied per line and rounded half up to the paisa; a flat
 * amount on all heads is taken ONCE PER INSTALMENT and spread across the
 * lines pro rata, so the sum of the lines is the demand and the receipt can
 * print the same numbers the demand carried.
 *
 * A DEMAND IS REGENERATED ONLY WHILE UNTOUCHED. Assigning a plan, changing a
 * concession or moving a pupil to another structure rewrites the pupil's
 * unpaid demands — OPEN ones, and ones a 100 % concession wrote as PAID with
 * nothing owed — and leaves any with money against them exactly as they
 * are — a family that has paid Term 1 must not find Term 1 rewritten under
 * them. A published structure is frozen for the same reason: a change after
 * publishing is a new structure.
 */

export type FeeCaller = { schoolId: string; userId: string; role: string | null; membershipId: string | null };

/**
 * The office — and, at a college, the ACCOUNTS desk (4 Oct 2026), which keeps
 * the same ledger by its role rather than by a module. ACCOUNTS is offered
 * only to a college (invitableRolesFor), so a school's ledger has no such
 * keeper.
 */
function office(ctx: ActiveContext): FeeCaller {
  if ((ctx.role !== "ADMIN" && ctx.role !== "ACCOUNTS") || !ctx.schoolId || !ctx.membershipId) throw new AccessError("fees.refuseOffice");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId };
}

export function officeOrHead(ctx: ActiveContext): FeeCaller {
  if ((ctx.role !== "ADMIN" && ctx.role !== "PRINCIPAL" && ctx.role !== "ACCOUNTS") || !ctx.schoolId || !ctx.membershipId) throw new AccessError("fees.refuseOffice");
  return { schoolId: ctx.schoolId, userId: ctx.user.id, role: ctx.role, membershipId: ctx.membershipId };
}
export { office as requireFeesOffice };

/** A calendar day as a UTC-midnight instant, and back. Due dates are days, not moments. */
export function dayToDate(dateKey: string): Date {
  if (!isDateKey(dateKey)) throw new AccessError("fees.refuseDate");
  return new Date(`${dateKey}T00:00:00.000Z`);
}
export function dateToDay(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

export type FeeSettings = {
  upiId: string | null;
  upiPayee: string | null;
  receiptPrefix: string;
  bankNote: string | null;
  gateway: { provider: string; keyId: string; mode: "TEST" | "LIVE"; updatedAt: Date } | null;
  /** Whether a gateway account CAN be saved here: the sealing key is present. */
  sealingAvailable: boolean;
  transport: "devbox" | "razorpay" | "off";
  /** From this age a pupil may read their own dues (never pay); null means pupils see no fees. */
  pupilFeeViewAge: number | null;
};

export async function feeSettings(schoolId: string): Promise<FeeSettings> {
  const [school, gateway] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { feeUpiId: true, feeUpiPayee: true, feeReceiptPrefix: true, feeBankNote: true, pupilFeeViewAge: true } }),
    db.feeGatewayAccount.findUnique({ where: { schoolId }, select: { provider: true, keyId: true, mode: true, updatedAt: true } }),
  ]);
  return {
    upiId: school.feeUpiId,
    upiPayee: school.feeUpiPayee,
    receiptPrefix: school.feeReceiptPrefix,
    bankNote: school.feeBankNote,
    gateway: gateway ? { provider: gateway.provider, keyId: gateway.keyId, mode: gateway.mode as "TEST" | "LIVE", updatedAt: gateway.updatedAt } : null,
    sealingAvailable: sealingAvailable(),
    transport: readFeesGatewayTransport(),
    pupilFeeViewAge: school.pupilFeeViewAge,
  };
}

const UPI_ID = /^[A-Za-z0-9.\-_]{2,256}@[A-Za-z]{2,64}$/;

export async function saveFeeSettings(ctx: ActiveContext, input: { upiId?: string | null; upiPayee?: string | null; receiptPrefix?: string; bankNote?: string | null; pupilFeeViewAge?: number | null }): Promise<void> {
  const caller = office(ctx);
  // The pupil's age gate: a whole number of years between 5 and 25, or null (no pupil sees fees). Left out of the input, it stays as it is.
  if (input.pupilFeeViewAge !== undefined && input.pupilFeeViewAge !== null && (!Number.isInteger(input.pupilFeeViewAge) || input.pupilFeeViewAge < 5 || input.pupilFeeViewAge > 25)) throw new AccessError("fees.refusePupilViewAge");
  const upiId = input.upiId?.trim() || null;
  if (upiId && !UPI_ID.test(upiId)) throw new AccessError("fees.refuseUpiId");
  const upiPayee = input.upiPayee?.trim().slice(0, 80) || null;
  if (upiId && !upiPayee) throw new AccessError("fees.refuseUpiPayee");
  const receiptPrefix = (input.receiptPrefix ?? "RCPT").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 12) || "RCPT";
  const bankNote = input.bankNote?.trim().slice(0, 600) || null;
  // THE PAYEE IS ON RECORD (TA-131, testing analysis of 13 November 2026). Every UPI link a family opens pays this id,
  // and the office that sets it can also confirm the claims, so a change of the id or the payee name is audited with
  // a masked form of the old and the new, in the same transaction as the write, and the rest of the office and the
  // head are told: a payee swapped and later put back no longer leaves two rows that each say only "upi: true".
  const before = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { feeUpiId: true, feeUpiPayee: true } });
  const payeeChanged = (before.feeUpiId ?? null) !== upiId || (before.feeUpiPayee ?? null) !== upiPayee;
  const payeeMeta: Record<string, unknown> = payeeChanged ? { payeeChanged: true, upiFrom: maskUpiId(before.feeUpiId), upiTo: maskUpiId(upiId), payeeFrom: maskPayee(before.feeUpiPayee), payeeTo: maskPayee(upiPayee) } : { payeeChanged: false };
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.school.update({ where: { id: caller.schoolId }, data: { feeUpiId: upiId, feeUpiPayee: upiPayee, feeReceiptPrefix: receiptPrefix, feeBankNote: bankNote, ...(input.pupilFeeViewAge !== undefined ? { pupilFeeViewAge: input.pupilFeeViewAge } : {}) } });
    await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.settings", targetType: "School", targetId: caller.schoolId, meta: { upi: Boolean(upiId), receiptPrefix, ...payeeMeta, ...(input.pupilFeeViewAge !== undefined ? { pupilFeeViewAge: input.pupilFeeViewAge } : {}) } }, tx);
  });
  if (!payeeChanged) return;
  const others = await db.membership.findMany({ where: { schoolId: caller.schoolId, role: { in: ["ADMIN", "ACCOUNTS", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null, userId: { not: caller.userId } }, select: { userId: true } });
  const from = maskUpiId(before.feeUpiId) ?? "—";
  const to = maskUpiId(upiId) ?? "—";
  await Promise.all(
    [...new Set(others.map((o) => o.userId))].map((userId) =>
      notify({ userId, schoolId: caller.schoolId, kind: "FEES", titleKey: "notifTitle.feeUpiChanged", bodyKey: "notifBody.feeUpiChanged", bodyVars: { from, to }, url: "/admin/fees/settings", urgent: true, meta: { schoolId: caller.schoolId } }).catch(() => undefined),
    ),
  );
}

/** A UPI id with all but the first two letters of its name hidden: "ab*****@okhdfc". */
export function maskUpiId(upiId: string | null): string | null {
  if (!upiId) return null;
  const at = upiId.lastIndexOf("@");
  const name = at >= 0 ? upiId.slice(0, at) : upiId;
  const bank = at >= 0 ? upiId.slice(at) : "";
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}${bank}`;
}

/** A payee name with only its first letter shown. */
function maskPayee(payee: string | null): string | null {
  return payee ? `${payee.slice(0, 1)}***` : null;
}

/**
 * Whether a checkout may be opened with this key (TA-447, testing analysis of 13 November 2026). On a deployed server
 * with the real gateway transport a test key (rzp_test_…) would take test payments the gateway never moves money
 * for, and the ledger would issue real receipts in the school's real series for them; such a key is refused there.
 * The devbox transport and a local machine keep taking test keys, which is what they are for.
 */
export function gatewayKeyTakesPayments(keyId: string): boolean {
  if (readFeesGatewayTransport() !== "razorpay" || !isDeployedServer()) return true;
  return keyId.startsWith("rzp_live_");
}

/**
 * The school's own gateway keys, sealed. `keyId` stays readable — it goes to
 * the parent's checkout — and the two secrets are sealed under
 * FEES_SECRET_KEY. Saving without that key is refused with a sentence, not a
 * stack trace, and the settings page already said so.
 */
export async function saveGatewayAccount(ctx: ActiveContext, input: { keyId: string; secret: string; webhookSecret: string; mode: "TEST" | "LIVE" }): Promise<void> {
  const caller = office(ctx);
  if (!sealingAvailable()) throw new AccessError("fees.refuseNoSealingKey");
  const keyId = input.keyId.trim();
  const secret = input.secret.trim();
  const webhookSecret = input.webhookSecret.trim();
  if (!/^rzp_(test|live)_[A-Za-z0-9]{6,40}$/.test(keyId)) throw new AccessError("fees.refuseKeyId");
  if (secret.length < 8 || webhookSecret.length < 8) throw new AccessError("fees.refuseSecrets");
  // The mode is the key's own (TA-447): a live key is live, and a test key is test; a test key sent as Live is
  // refused rather than stored and shown as live.
  const mode = keyId.startsWith("rzp_live_") ? "LIVE" : "TEST";
  if (mode === "TEST" && input.mode === "LIVE") throw new AccessError("fees.refuseKeyMode");
  await refuseWhileCheckoutsOpen(caller.schoolId);
  await db.feeGatewayAccount.upsert({
    where: { schoolId: caller.schoolId },
    create: { schoolId: caller.schoolId, provider: "RAZORPAY", keyId, secretEnc: seal(secret, `${caller.schoolId}:secret`), webhookSecretEnc: seal(webhookSecret, `${caller.schoolId}:webhook`), mode },
    update: { keyId, secretEnc: seal(secret, `${caller.schoolId}:secret`), webhookSecretEnc: seal(webhookSecret, `${caller.schoolId}:webhook`), mode },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.gatewaySave", targetType: "School", targetId: caller.schoolId, meta: { keyId, mode } });
}

export async function removeGatewayAccount(ctx: ActiveContext): Promise<void> {
  const caller = office(ctx);
  await refuseWhileCheckoutsOpen(caller.schoolId);
  await db.feeGatewayAccount.deleteMany({ where: { schoolId: caller.schoolId } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.gatewayRemove", targetType: "School", targetId: caller.schoolId });
}

/**
 * KEYS ARE NOT CHANGED UNDER AN OPEN CHECKOUT (TA-448, testing analysis of 13 November 2026). An order is created,
 * signed and confirmed under the keys of the moment; replacing or removing them while a family is in the checkout
 * made that family's capture answer "bad signature" at the confirm and the webhook. So while an online order younger
 * than the hold (the half hour after which the reconcile job asks the gateway about it) is still open, the keys stay.
 */
async function refuseWhileCheckoutsOpen(schoolId: string): Promise<void> {
  const open = await db.feePayment.count({ where: { schoolId, method: "ONLINE", status: "INITIATED", gatewayOrderId: { not: null }, createdAt: { gte: new Date(Date.now() - FEE_ORDER_RECONCILE_AFTER_MS) } } });
  if (open > 0) throw new AccessError("fees.refuseGatewayOrdersOpen");
}

/** The account with its secrets opened — for the checkout, the webhook and the reconcile job only. */
export async function gatewayAccountFor(schoolId: string): Promise<(GatewayAccount & { webhookSecret: string }) | null> {
  const row = await db.feeGatewayAccount.findUnique({ where: { schoolId } });
  if (!row) return null;
  return { keyId: row.keyId, secret: open(row.secretEnc, `${schoolId}:secret`), webhookSecret: open(row.webhookSecretEnc, `${schoolId}:webhook`), mode: row.mode as "TEST" | "LIVE" };
}

/* -------------------------------------------------------------------------- */
/* Heads                                                                       */
/* -------------------------------------------------------------------------- */

export type FeeHeadRow = { id: string; name: string; code: string; kind: FeeHeadKind; sortOrder: number; retiredAt: Date | null; inUse: boolean };

export async function listHeads(schoolId: string, opts: { includeRetired?: boolean } = {}): Promise<FeeHeadRow[]> {
  const rows = await db.feeHead.findMany({
    where: { schoolId, ...(opts.includeRetired ? {} : { retiredAt: null }) },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { lines: true } } },
  });
  return rows.map((h) => ({ id: h.id, name: h.name, code: h.code, kind: (FEE_HEAD_KINDS as readonly string[]).includes(h.kind) ? (h.kind as FeeHeadKind) : "OTHER", sortOrder: h.sortOrder, retiredAt: h.retiredAt, inUse: h._count.lines > 0 }));
}

export async function saveHead(ctx: ActiveContext, input: { id?: string; name: string; code: string; kind: FeeHeadKind; sortOrder?: number }): Promise<string> {
  const caller = office(ctx);
  const name = input.name.trim().slice(0, 60);
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (name.length < 2) throw new AccessError("fees.refuseHeadName");
  if (code.length < 2) throw new AccessError("fees.refuseHeadCode");
  const kind: FeeHeadKind = (FEE_HEAD_KINDS as readonly string[]).includes(input.kind) ? input.kind : "OTHER";
  const clash = await db.feeHead.findFirst({ where: { schoolId: caller.schoolId, code, ...(input.id ? { id: { not: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new AccessError("fees.refuseHeadCodeTaken", "FORBIDDEN", { code });
  if (input.id) {
    const existing = await db.feeHead.findFirst({ where: { id: input.id, schoolId: caller.schoolId }, select: { id: true } });
    if (!existing) throw new AccessError("fees.notFound", "NOT_FOUND");
    await db.feeHead.update({ where: { id: input.id }, data: { name, code, kind, sortOrder: input.sortOrder ?? 0 } });
    await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.headUpdate", targetType: "FeeHead", targetId: input.id, meta: { name, code } });
    return input.id;
  }
  const created = await db.feeHead.create({ data: { schoolId: caller.schoolId, name, code, kind, sortOrder: input.sortOrder ?? 0 }, select: { id: true } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.headCreate", targetType: "FeeHead", targetId: created.id, meta: { name, code } });
  return created.id;
}

/** Retired heads stay on every line that already uses them; they just leave the picker. */
export async function retireHead(ctx: ActiveContext, headId: string, restore = false): Promise<void> {
  const caller = office(ctx);
  const head = await db.feeHead.findFirst({ where: { id: headId, schoolId: caller.schoolId }, select: { id: true } });
  if (!head) throw new AccessError("fees.notFound", "NOT_FOUND");
  await db.feeHead.update({ where: { id: headId }, data: { retiredAt: restore ? null : new Date() } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: restore ? "fees.headRestore" : "fees.headRetire", targetType: "FeeHead", targetId: headId });
}

/* -------------------------------------------------------------------------- */
/* Structures                                                                  */
/* -------------------------------------------------------------------------- */

export type StructureLineInput = { headId: string; amountPaise: number };
export type StructureInstalmentInput = { label: string; dueDateKey: string; lines: StructureLineInput[] };
export type StructureInput = { name: string; gradeLevel: string | null; instalments: StructureInstalmentInput[] };

export type StructureSummary = {
  id: string;
  name: string;
  gradeLevel: string | null;
  academicYearId: string;
  yearName: string;
  instalments: number;
  totalPaise: number;
  pupils: number;
  publishedAt: Date | null;
  archivedAt: Date | null;
  /** Open to families to choose for their child (fees-family.ts). */
  selfEnrol: boolean;
};

export async function listStructures(ctx: ActiveContext, opts: { academicYearId?: string; includeArchived?: boolean } = {}): Promise<StructureSummary[]> {
  const caller = officeOrHead(ctx);
  const rows = await db.feeStructure.findMany({
    where: { schoolId: caller.schoolId, ...(opts.academicYearId ? { academicYearId: opts.academicYearId } : {}), ...(opts.includeArchived ? {} : { archivedAt: null }) },
    orderBy: [{ createdAt: "desc" }],
    include: { year: { select: { name: true } }, instalments: { include: { lines: { select: { amountPaise: true } } } }, _count: { select: { plans: true } } },
  });
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel,
    academicYearId: s.academicYearId,
    yearName: s.year.name,
    instalments: s.instalments.length,
    totalPaise: s.instalments.reduce((sum, i) => sum + i.lines.reduce((a, l) => a + l.amountPaise, 0), 0),
    pupils: s._count.plans,
    publishedAt: s.publishedAt,
    archivedAt: s.archivedAt,
    selfEnrol: s.selfEnrol,
  }));
}

export type StructureDetail = StructureSummary & {
  instalmentRows: { id: string; label: string; sortOrder: number; dueDateKey: string; totalPaise: number; lines: { id: string; headId: string; headName: string; headCode: string; amountPaise: number }[] }[];
  /** Demands already paid against — the reason a published structure cannot change. */
  paidDemands: number;
};

export async function getStructure(ctx: ActiveContext, structureId: string): Promise<StructureDetail> {
  const caller = officeOrHead(ctx);
  const s = await db.feeStructure.findFirst({
    where: { id: structureId, schoolId: caller.schoolId },
    include: {
      year: { select: { name: true } },
      instalments: { orderBy: { sortOrder: "asc" }, include: { lines: { include: { head: { select: { name: true, code: true } } } }, _count: { select: { demands: { where: { paidPaise: { gt: 0 } } } } } } },
      _count: { select: { plans: true } },
    },
  });
  if (!s) throw new AccessError("fees.notFound", "NOT_FOUND");
  const instalmentRows = s.instalments.map((i) => ({
    id: i.id,
    label: i.label,
    sortOrder: i.sortOrder,
    dueDateKey: dateToDay(i.dueDate),
    totalPaise: i.lines.reduce((a, l) => a + l.amountPaise, 0),
    lines: i.lines.map((l) => ({ id: l.id, headId: l.headId, headName: l.head.name, headCode: l.head.code, amountPaise: l.amountPaise })),
  }));
  return {
    id: s.id,
    name: s.name,
    gradeLevel: s.gradeLevel,
    academicYearId: s.academicYearId,
    yearName: s.year.name,
    instalments: instalmentRows.length,
    totalPaise: instalmentRows.reduce((a, i) => a + i.totalPaise, 0),
    pupils: s._count.plans,
    publishedAt: s.publishedAt,
    archivedAt: s.archivedAt,
    selfEnrol: s.selfEnrol,
    instalmentRows,
    paidDemands: s.instalments.reduce((a, i) => a + i._count.demands, 0),
  };
}

function checkStructureInput(input: StructureInput, headIds: Set<string>): { name: string; gradeLevel: string | null; instalments: { label: string; dueDate: Date; lines: StructureLineInput[] }[] } {
  const name = input.name.trim().slice(0, 80);
  if (name.length < 2) throw new AccessError("fees.refuseStructureName");
  const gradeLevel = input.gradeLevel?.trim().slice(0, 12) || null;
  if (!Array.isArray(input.instalments) || input.instalments.length === 0 || input.instalments.length > 12) throw new AccessError("fees.refuseInstalments");
  const instalments = input.instalments.map((i) => {
    const label = i.label.trim().slice(0, 40);
    if (label.length < 1) throw new AccessError("fees.refuseInstalmentLabel");
    const dueDate = dayToDate(i.dueDateKey);
    if (!Array.isArray(i.lines) || i.lines.length === 0) throw new AccessError("fees.refuseLines");
    const seen = new Set<string>();
    const lines = i.lines.map((l) => {
      if (!headIds.has(l.headId)) throw new AccessError("fees.refuseUnknownHead");
      if (seen.has(l.headId)) throw new AccessError("fees.refuseDuplicateHead");
      seen.add(l.headId);
      if (!Number.isInteger(l.amountPaise) || l.amountPaise < 0 || l.amountPaise > 100_000_000_00) throw new AccessError("fees.refuseAmount");
      return { headId: l.headId, amountPaise: l.amountPaise };
    });
    return { label, dueDate, lines };
  });
  if (instalments.every((i) => i.lines.every((l) => l.amountPaise === 0))) throw new AccessError("fees.refuseZeroStructure");
  return { name, gradeLevel, instalments };
}

export async function createStructure(ctx: ActiveContext, input: StructureInput & { academicYearId?: string }): Promise<string> {
  const caller = office(ctx);
  const year = input.academicYearId
    ? await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId: caller.schoolId }, select: { id: true } })
    : await currentAcademicYear(caller.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  const heads = await db.feeHead.findMany({ where: { schoolId: caller.schoolId, retiredAt: null }, select: { id: true } });
  const checked = checkStructureInput(input, new Set(heads.map((h) => h.id)));
  const created = await db.feeStructure.create({
    data: {
      schoolId: caller.schoolId,
      academicYearId: year.id,
      name: checked.name,
      gradeLevel: checked.gradeLevel,
      instalments: {
        create: checked.instalments.map((i, index) => ({
          schoolId: caller.schoolId,
          label: i.label,
          sortOrder: index,
          dueDate: i.dueDate,
          lines: { create: i.lines.map((l) => ({ schoolId: caller.schoolId, headId: l.headId, amountPaise: l.amountPaise })) },
        })),
      },
    },
    select: { id: true },
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.structureCreate", targetType: "FeeStructure", targetId: created.id, meta: { name: checked.name, instalments: checked.instalments.length } });
  return created.id;
}

/** Only a draft can change. A published structure is what every demand under it points at. */
export async function updateStructure(ctx: ActiveContext, structureId: string, input: StructureInput): Promise<void> {
  const caller = office(ctx);
  const existing = await db.feeStructure.findFirst({ where: { id: structureId, schoolId: caller.schoolId }, select: { id: true, publishedAt: true, archivedAt: true } });
  if (!existing) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (existing.publishedAt || existing.archivedAt) throw new AccessError("fees.refusePublishedEdit");
  const heads = await db.feeHead.findMany({ where: { schoolId: caller.schoolId, retiredAt: null }, select: { id: true } });
  const checked = checkStructureInput(input, new Set(heads.map((h) => h.id)));
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.feeInstalment.deleteMany({ where: { structureId } });
    await tx.feeStructure.update({
      where: { id: structureId },
      data: {
        name: checked.name,
        gradeLevel: checked.gradeLevel,
        instalments: {
          create: checked.instalments.map((i, index) => ({
            schoolId: caller.schoolId,
            label: i.label,
            sortOrder: index,
            dueDate: i.dueDate,
            lines: { create: i.lines.map((l) => ({ schoolId: caller.schoolId, headId: l.headId, amountPaise: l.amountPaise })) },
          })),
        },
      },
    });
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.structureUpdate", targetType: "FeeStructure", targetId: structureId, meta: { name: checked.name } });
}

export async function publishStructure(ctx: ActiveContext, structureId: string): Promise<void> {
  const caller = office(ctx);
  const s = await db.feeStructure.findFirst({ where: { id: structureId, schoolId: caller.schoolId }, select: { id: true, publishedAt: true, archivedAt: true } });
  if (!s) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (s.archivedAt) throw new AccessError("fees.refuseArchived");
  if (s.publishedAt) return;
  await db.feeStructure.update({ where: { id: structureId }, data: { publishedAt: new Date() } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.structurePublish", targetType: "FeeStructure", targetId: structureId });
}

/** Archiving hides a structure from assignment; pupils already on it and their demands are untouched. */
export async function archiveStructure(ctx: ActiveContext, structureId: string): Promise<void> {
  const caller = office(ctx);
  const s = await db.feeStructure.findFirst({ where: { id: structureId, schoolId: caller.schoolId }, select: { id: true } });
  if (!s) throw new AccessError("fees.notFound", "NOT_FOUND");
  await db.feeStructure.update({ where: { id: structureId }, data: { archivedAt: new Date() } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.structureArchive", targetType: "FeeStructure", targetId: structureId });
}

/**
 * Open a structure to families, or close it again. Only a published, live
 * structure can be open: a draft's numbers may still change and an archived
 * one takes nobody. Closing it leaves every pupil already on it exactly
 * where they are.
 */
export async function setStructureSelfEnrol(ctx: ActiveContext, structureId: string, open: boolean): Promise<void> {
  const caller = office(ctx);
  const s = await db.feeStructure.findFirst({ where: { id: structureId, schoolId: caller.schoolId }, select: { id: true, publishedAt: true, archivedAt: true, selfEnrol: true } });
  if (!s) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (open && !s.publishedAt) throw new AccessError("fees.refuseSelfEnrolDraft");
  if (open && s.archivedAt) throw new AccessError("fees.refuseArchived");
  if (s.selfEnrol === open) return;
  await db.feeStructure.update({ where: { id: structureId }, data: { selfEnrol: open } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: open ? "fees.structureOpen" : "fees.structureClose", targetType: "FeeStructure", targetId: structureId });
}

/* -------------------------------------------------------------------------- */
/* Demands                                                                     */
/* -------------------------------------------------------------------------- */

export type DemandLine = { headId: string; code: string; name: string; grossPaise: number; concessionPaise: number };

type ConcessionRow = { headId: string | null; kind: string; value: number };

/** A college office's concession limit when it has set none (Rs 5,000): college-fees.ts's officeSettings and the rewrite below. */
export const CONCESSION_LIMIT_DEFAULT_PAISE = 500_000;

/**
 * The time a whole-school fee write may take (TA-132, testing analysis of 13 November 2026): an assignment of up to
 * 2,000 pupils or a year's carry-forward is many statements a pupil, past Prisma's five-second default that a deployed
 * server keeps. Two minutes, as such a batch needs on a hosted database; a failure still rolls back whole.
 */
export const WHOLE_SCHOOL_TX_MS = 120_000;

/**
 * One line's own concession: percentages (on this head or on all) on the
 * line, and an amount on THIS head capped at the line. Rounded half up to the
 * paisa. A flat amount on all heads is not a line's business — it is taken
 * once per instalment by `concessionOnInstalment`, never once per line, or a
 * "₹500 off" on a three-line term would come off three times.
 */
export function concessionOnLine(grossPaise: number, headId: string, concessions: ConcessionRow[]): number {
  let off = 0;
  for (const c of concessions) {
    if (c.headId && c.headId !== headId) continue;
    if (c.kind === "PERCENT") off += Math.round((grossPaise * c.value) / 10000);
    else if (c.headId) off += c.value;
  }
  return Math.max(0, Math.min(grossPaise, off));
}

/**
 * The concession on each line of one instalment, in the lines' order. The
 * per-line concessions first; then the flat all-heads amounts, summed and
 * taken once against the instalment: spread pro rata by the line's gross,
 * rounded half up, each share capped at what the line has left, the last
 * line taking the remainder, and the whole capped at the instalment's gross
 * so no demand goes below zero. A rounding remainder a capped line could not
 * hold goes to the first line that still has room.
 */
export function concessionOnInstalment(lines: { headId: string; grossPaise: number }[], concessions: ConcessionRow[]): number[] {
  const off = lines.map((l) => concessionOnLine(l.grossPaise, l.headId, concessions));
  const flat = concessions.filter((c) => !c.headId && c.kind === "AMOUNT").reduce((a, c) => a + c.value, 0);
  const grossTotal = lines.reduce((a, l) => a + l.grossPaise, 0);
  if (flat <= 0 || grossTotal <= 0) return off;
  const room = (i: number) => lines[i]!.grossPaise - off[i]!;
  let left = Math.min(flat, grossTotal - off.reduce((a, x) => a + x, 0));
  const spread = left;
  for (let i = 0; i < lines.length && left > 0; i += 1) {
    const share = i === lines.length - 1 ? left : Math.min(left, Math.round((spread * lines[i]!.grossPaise) / grossTotal));
    const take = Math.min(room(i), share);
    off[i]! += take;
    left -= take;
  }
  for (let i = 0; i < lines.length && left > 0; i += 1) {
    const take = Math.min(room(i), left);
    off[i]! += take;
    left -= take;
  }
  return off;
}

/**
 * Rewrites a pupil's demands for a year from their plan and their live
 * concessions. Untouched demands are recomputed; touched ones are left
 * exactly as they stand; demands for instalments the plan no longer has are
 * removed only if untouched. Runs inside the caller's transaction.
 *
 * UNTOUCHED means no money has ever been allocated to it — paidPaise 0 and
 * not one allocation row — and it is either OPEN or the PAID-with-nothing-owed
 * a 100 % concession writes. That last case is why the status alone is not
 * the test: such a demand was never paid by anyone, and revoking the
 * concession must reopen it with the new net.
 *
 * EMPTIED (TA-126, testing analysis of 13 November 2026) is a demand money
 * once sat on that holds none now: the payment was reversed or refunded in
 * full, so its allocation rows stay for the trail but paidPaise (the sum of
 * the PAID and REFUNDED allocations) is 0. It used to be kept as it stood, so
 * a pupil moved to another structure, or taken off their plan, still owed the
 * old structure's term beside the new one's. It is now rewritten like an
 * untouched demand, and where the plan no longer asks for it, it is CANCELLED
 * rather than deleted, keeping its allocation rows; a demand cancelled that
 * way is opened again if the pupil, still on the roll, is moved back.
 */
export async function regenerateDemands(tx: typeof db, schoolId: string, studentMembershipId: string, academicYearId: string): Promise<{ written: number; kept: number }> {
  await lockPupilDemands(tx, schoolId, studentMembershipId, academicYearId);
  const plan = await tx.studentFeePlan.findUnique({
    where: { studentMembershipId_academicYearId: { studentMembershipId, academicYearId } },
    include: { structure: { include: { instalments: { orderBy: { sortOrder: "asc" }, include: { lines: { include: { head: { select: { code: true, name: true } } } } } } } } },
  });
  const existing = await tx.feeDemand.findMany({ where: { schoolId, studentMembershipId, academicYearId, instalmentId: { not: null } }, include: { _count: { select: { allocations: true } } } });
  const onRoll = (await tx.membership.findUnique({ where: { id: studentMembershipId }, select: { leftAt: true } }))?.leftAt === null;
  const untouched = (d: (typeof existing)[number]) => d.paidPaise === 0 && d._count.allocations === 0 && (d.status === "OPEN" || (d.status === "PAID" && d.netPaise === 0));
  const emptied = (d: (typeof existing)[number]) => d.paidPaise === 0 && d._count.allocations > 0 && (d.status === "OPEN" || (d.status === "CANCELLED" && onRoll));
  const rewritable = (d: (typeof existing)[number]) => untouched(d) || emptied(d);
  const cancelEmptied = async (rows: typeof existing) => {
    const ids = rows.filter((d) => emptied(d) && d.status === "OPEN").map((d) => d.id);
    if (ids.length) await tx.feeDemand.updateMany({ where: { id: { in: ids }, schoolId, status: "OPEN", paidPaise: 0 }, data: { status: "CANCELLED" } });
    return ids.length;
  };
  if (!plan) {
    const removable = existing.filter(untouched).map((d) => d.id);
    if (removable.length) await tx.feeDemand.deleteMany({ where: { id: { in: removable } } });
    const cancelled = await cancelEmptied(existing);
    return { written: 0, kept: existing.length - removable.length - cancelled };
  }
  // A PUPIL ADMITTED PART-WAY THROUGH THE YEAR (A3-journeys-16): an instalment whose day fell before the admission
  // date is due on the admission date instead, so a child admitted on 5 October is not "overdue" on day one with
  // reminders already scheduled for a July term. The amount is the structure's; only the day moves. The admission
  // date is the pupil record's (written by admissions, the college's admit and the office), date-only at UTC midnight.
  const admitted = (await tx.pupilRecord.findUnique({ where: { studentMembershipId }, select: { admissionDate: true } }))?.admissionDate ?? null;
  const dueOn = (day: Date) => (admitted && admitted.getTime() > day.getTime() ? admitted : day);
  // A college's concession above the office's limit waits for the principal (college-fees.ts): only an APPROVED one is applied.
  const approved = await tx.feeConcession.findMany({ where: { schoolId, studentMembershipId, academicYearId, revokedAt: null, approvalStatus: "APPROVED" }, select: { id: true, headId: true, kind: true, value: true, grantedByUserId: true, approvedByUserId: true } });
  const back = new Set<string>();
  // THE OFFICE'S LIMIT AT EVERY REWRITE (TA-004, testing analysis of 13 November 2026). A college office applies a
  // concession on its own word only while what its own concessions take together stays within the limit; a plan
  // moved to a dearer structure can take them past it. Then they go back to the principal (PENDING) and are not
  // applied until approved. Only a college's office approves its own (approvedByUserId is the granter); a school's
  // concession carries no approver and a principal's approval another user, so neither is touched.
  const officeOwn = approved.filter((c) => c.approvedByUserId !== null && c.approvedByUserId === c.grantedByUserId);
  if (officeOwn.length) {
    const takes = plan.structure.instalments.reduce((a, inst) => a + concessionOnInstalment(inst.lines.map((l) => ({ headId: l.headId, grossPaise: l.amountPaise })), officeOwn).reduce((x, y) => x + y, 0), 0);
    const limit = (await tx.collegeOfficeSettings.findUnique({ where: { schoolId }, select: { concessionLimitPaise: true } }))?.concessionLimitPaise ?? CONCESSION_LIMIT_DEFAULT_PAISE;
    if (takes > limit) {
      for (const c of officeOwn) back.add(c.id);
      await tx.feeConcession.updateMany({ where: { id: { in: [...back] }, schoolId }, data: { approvalStatus: "PENDING", approvedByUserId: null, approvedAt: null } });
      await audit({ schoolId, action: "college.fees.concessionBackToPrincipal", targetType: "Membership", targetId: studentMembershipId, meta: { concessions: back.size, takesPaise: takes, limitPaise: limit } }, tx);
    }
  }
  const concessions: ConcessionRow[] = approved.filter((c) => !back.has(c.id));
  const wanted = new Set(plan.structure.instalments.map((i) => i.id));
  let written = 0;
  let kept = 0;
  for (const inst of plan.structure.instalments) {
    const off = concessionOnInstalment(
      inst.lines.map((l) => ({ headId: l.headId, grossPaise: l.amountPaise })),
      concessions,
    );
    const lines: DemandLine[] = inst.lines.map((l, i) => ({ headId: l.headId, code: l.head.code, name: l.head.name, grossPaise: l.amountPaise, concessionPaise: off[i]! }));
    const grossPaise = lines.reduce((a, l) => a + l.grossPaise, 0);
    const concessionPaise = lines.reduce((a, l) => a + l.concessionPaise, 0);
    const netPaise = grossPaise - concessionPaise;
    const current = existing.find((d) => d.instalmentId === inst.id);
    if (current && !rewritable(current)) {
      kept += 1;
      continue;
    }
    const data = { label: inst.label, dueDate: dueOn(inst.dueDate), grossPaise, concessionPaise, netPaise, linesJson: writeJson(lines), status: netPaise === 0 ? "PAID" : "OPEN" };
    if (current) await tx.feeDemand.update({ where: { id: current.id }, data });
    else await tx.feeDemand.create({ data: { schoolId, studentMembershipId, academicYearId, instalmentId: inst.id, ...data } });
    written += 1;
  }
  const notWanted = existing.filter((d) => d.instalmentId && !wanted.has(d.instalmentId));
  const stale = notWanted.filter(untouched).map((d) => d.id);
  if (stale.length) await tx.feeDemand.deleteMany({ where: { id: { in: stale } } });
  await cancelEmptied(notWanted);
  return { written, kept };
}

/**
 * ⚠ THE PUPIL'S DEMANDS ARE LOCKED BEFORE THEY ARE READ (TA-133, testing analysis of 13 November 2026). A payment
 * settling (fees-payments.ts openDemands) locks the pupil's OPEN and PART demands; a concession, a plan change or an
 * unassignment used to read and rewrite them with no lock, so a demand being paid at that moment could be rewritten
 * OPEN under the payment or deleted with its allocation. This takes the same rows plus the rest of the year's, in id
 * order as openDemands does, so the two wait for each other and never deadlock.
 */
export async function lockPupilDemands(tx: typeof db, schoolId: string, studentMembershipId: string, academicYearId: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "schoolId" = ${schoolId} AND "studentMembershipId" = ${studentMembershipId} AND ("status" IN ('OPEN', 'PART') OR "academicYearId" = ${academicYearId}) ORDER BY "id" FOR UPDATE`;
}

export type AssignResult = { assigned: number; moved: number; unchanged: number; refused: { studentMembershipId: string; name: string }[] };

/**
 * Put pupils on a structure — a whole class or a named few — and generate
 * their demands. A pupil already on another structure is moved only while
 * nothing has been paid this year; one with money against a demand is
 * refused by name, because moving them would mean rewriting a paid term.
 */
export async function assignPlans(ctx: ActiveContext, input: { structureId: string; classId?: string; studentMembershipIds?: string[] }): Promise<AssignResult> {
  return assignPlansAs(office(ctx), input, { matchStanding: true });
}

/**
 * AT A COLLEGE THE OFFICE'S PLAN DOOR PUTS A STUDENT ONLY ON THEIR OWN STRUCTURE (TA-082, testing analysis of 13
 * November 2026). A college's fee follows the student's programme, year of study and admission category, and a lower
 * one is a concession, which at a college names its authority and waits for the principal above the office's limit
 * (college-fees.ts; this file's grantConcession refuses a college for that reason, campaign S-1). The school's plan
 * door put a college student on any published structure, so a cheaper one was a concession with neither. At a college
 * it now refuses a structure that is not the one the student's standing calls for; `raiseDemands` already matches.
 */
async function refuseOffStanding(schoolId: string, structureId: string, pupilIds: string[]): Promise<void> {
  const kind = (await db.school.findUnique({ where: { id: schoolId }, select: { kind: true } }))?.kind;
  if (!isCollegeKind(kind)) return;
  const structure = await db.feeStructure.findFirst({ where: { id: structureId, schoolId }, select: { programmeId: true, yearOfStudy: true, category: true, year: { select: { startDate: true } } } });
  if (!structure) return;
  if (!structure.programmeId) throw new AccessError("fees.refuseCollegeStanding");
  for (const id of pupilIds) {
    const s = await standingOf(id, structure.year.startDate.getUTCFullYear());
    if (s.programmeId !== structure.programmeId || s.yearOfStudy !== structure.yearOfStudy || s.category !== structure.category) throw new AccessError("fees.refuseCollegeStanding");
  }
}

/**
 * The one writer of a pupil's plan. The office calls it through
 * `assignPlans`; a guardian choosing an open structure for their child
 * (fees-family.ts) calls it with themselves as the caller, after its own
 * checks — so a self-enrolment writes the plan and its demands exactly as an
 * office assignment does, and the ledger keeps one writer.
 */
export async function assignPlansAs(caller: FeeCaller, input: { structureId: string; classId?: string; studentMembershipIds?: string[] }, opts: { matchStanding?: boolean; onlyIfNoPlan?: boolean } = {}): Promise<AssignResult> {
  const structure = await db.feeStructure.findFirst({ where: { id: input.structureId, schoolId: caller.schoolId }, select: { id: true, academicYearId: true, publishedAt: true, archivedAt: true } });
  if (!structure) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (!structure.publishedAt) throw new AccessError("fees.refuseAssignDraft");
  if (structure.archivedAt) throw new AccessError("fees.refuseArchived");

  let ids: string[] = [];
  if (input.classId) {
    const klass = await db.class.findFirst({ where: { id: input.classId, schoolId: caller.schoolId }, select: { id: true } });
    if (!klass) throw new AccessError("fees.notFound", "NOT_FOUND");
    const enrolled = await db.enrollment.findMany({ where: { classId: klass.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true } });
    ids = enrolled.map((e) => e.studentMembershipId);
  }
  if (input.studentMembershipIds?.length) ids.push(...input.studentMembershipIds);
  ids = [...new Set(ids)];
  if (ids.length === 0) throw new AccessError("fees.refuseNobody");
  if (ids.length > 2000) throw new AccessError("fees.refuseTooMany");

  const pupils = await db.membership.findMany({ where: { id: { in: ids }, schoolId: caller.schoolId, role: "STUDENT" }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  if (pupils.length !== ids.length) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (opts.matchStanding) await refuseOffStanding(caller.schoolId, structure.id, ids);

  const result: AssignResult = { assigned: 0, moved: 0, unchanged: 0, refused: [] };
  // A whole class is many statements a pupil, so the transaction is given more than Prisma's five-second default
  // (TA-132, testing analysis of 13 November 2026): the default rolled a large assignment back whole on a deployed
  // server, where only development lengthens it.
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    for (const pupil of pupils) {
      // ONE PLAN WRITER AT A TIME PER PUPIL (TA-584): two guardians choosing at once, or a guardian choosing while the
      // office assigns the class, each read "no plan yet" and the second moved the child off the first's choice (or
      // met the unique key as a 500). The pupil's plan is now decided under a lock, read again under it, and a
      // family's choice (onlyIfNoPlan) is refused there when a plan already stands. The demands are locked too
      // (TA-133), before the paid check below, so a payment settling now is counted.
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`fee-plan:${pupil.id}:${structure.academicYearId}`}))`;
      await lockPupilDemands(tx, caller.schoolId, pupil.id, structure.academicYearId);
      const plan = await tx.studentFeePlan.findUnique({ where: { studentMembershipId_academicYearId: { studentMembershipId: pupil.id, academicYearId: structure.academicYearId } }, select: { id: true, structureId: true } });
      if (plan && opts.onlyIfNoPlan) throw new AccessError("fees.refuseSelfEnrolHasPlan");
      if (plan?.structureId === structure.id) {
        // Same structure: regenerate so a changed concession or a fresh
        // instalment shows up, but count it as unchanged.
        await regenerateDemands(tx, caller.schoolId, pupil.id, structure.academicYearId);
        result.unchanged += 1;
        continue;
      }
      if (plan) {
        const paid = await tx.feeDemand.count({ where: { studentMembershipId: pupil.id, academicYearId: structure.academicYearId, paidPaise: { gt: 0 } } });
        if (paid > 0) {
          result.refused.push({ studentMembershipId: pupil.id, name: pupil.user.preferredName ?? pupil.user.name });
          continue;
        }
        await tx.studentFeePlan.update({ where: { id: plan.id }, data: { structureId: structure.id } });
        result.moved += 1;
      } else {
        await tx.studentFeePlan.create({ data: { schoolId: caller.schoolId, studentMembershipId: pupil.id, structureId: structure.id, academicYearId: structure.academicYearId } });
        result.assigned += 1;
      }
      await regenerateDemands(tx, caller.schoolId, pupil.id, structure.academicYearId);
    }
  }, { timeout: WHOLE_SCHOOL_TX_MS });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.assign", targetType: "FeeStructure", targetId: structure.id, meta: { assigned: result.assigned, moved: result.moved, unchanged: result.unchanged, refused: result.refused.length, classId: input.classId ?? null } });
  return result;
}

/** Take a pupil off their plan for the year — only while nothing is paid. Their untouched demands go with it. */
export async function unassignPlan(ctx: ActiveContext, studentMembershipId: string, academicYearId: string): Promise<void> {
  const caller = office(ctx);
  const plan = await db.studentFeePlan.findFirst({ where: { studentMembershipId, academicYearId, schoolId: caller.schoolId }, select: { id: true } });
  if (!plan) throw new AccessError("fees.notFound", "NOT_FOUND");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    // Counted under the pupil's lock (TA-133), so a payment settling at this moment is seen before the plan goes.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`fee-plan:${studentMembershipId}:${academicYearId}`}))`;
    await lockPupilDemands(tx, caller.schoolId, studentMembershipId, academicYearId);
    const paid = await tx.feeDemand.count({ where: { studentMembershipId, academicYearId, paidPaise: { gt: 0 } } });
    if (paid > 0) throw new AccessError("fees.refuseUnassignPaid");
    await tx.studentFeePlan.delete({ where: { id: plan.id } });
    await regenerateDemands(tx, caller.schoolId, studentMembershipId, academicYearId);
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.unassign", targetType: "Membership", targetId: studentMembershipId, meta: { academicYearId } });
}

/* -------------------------------------------------------------------------- */
/* Concessions                                                                 */
/* -------------------------------------------------------------------------- */

export async function grantConcession(
  ctx: ActiveContext,
  input: { studentMembershipId: string; academicYearId?: string; headId: string | null; kind: FeeConcessionKind; value: number; reason: string },
): Promise<string> {
  const caller = office(ctx);
  // A college's concessions go through accounts/concessions (college-fees.ts), which records the
  // sanctioning authority and holds one above the office's limit for the principal. This school
  // door has neither, so at a college it would grant any concession at once (campaign S-1).
  const kind = (await db.school.findUnique({ where: { id: caller.schoolId }, select: { kind: true } }))?.kind;
  if (isCollegeKind(kind)) throw new AccessError("fees.refuseCollegeConcession");
  const pupil = await db.membership.findFirst({ where: { id: input.studentMembershipId, schoolId: caller.schoolId, role: "STUDENT" }, select: { id: true } });
  if (!pupil) throw new AccessError("fees.notFound", "NOT_FOUND");
  const year = input.academicYearId
    ? await db.academicYear.findFirst({ where: { id: input.academicYearId, schoolId: caller.schoolId }, select: { id: true } })
    : await currentAcademicYear(caller.schoolId);
  if (!year) throw new AccessError("fees.refuseNoYear");
  if (input.headId) {
    const head = await db.feeHead.findFirst({ where: { id: input.headId, schoolId: caller.schoolId }, select: { id: true } });
    if (!head) throw new AccessError("fees.refuseUnknownHead");
  }
  const reason = input.reason.trim().slice(0, 200);
  if (reason.length < 3) throw new AccessError("fees.refuseReason");
  if (input.kind === "PERCENT" && (!Number.isInteger(input.value) || input.value <= 0 || input.value > 10000)) throw new AccessError("fees.refusePercent");
  if (input.kind === "AMOUNT" && (!Number.isInteger(input.value) || input.value <= 0)) throw new AccessError("fees.refuseAmount");
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const created = await tx.feeConcession.create({
      data: { schoolId: caller.schoolId, studentMembershipId: pupil.id, academicYearId: year.id, headId: input.headId, kind: input.kind, value: input.value, reason, grantedByUserId: caller.userId },
      select: { id: true },
    });
    await regenerateDemands(tx, caller.schoolId, pupil.id, year.id);
    return created.id;
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.concessionGrant", targetType: "Membership", targetId: pupil.id, meta: { concessionId: id, kind: input.kind, value: input.value, headId: input.headId } });
  return id;
}

export async function revokeConcession(ctx: ActiveContext, concessionId: string): Promise<void> {
  const caller = office(ctx);
  const c = await db.feeConcession.findFirst({ where: { id: concessionId, schoolId: caller.schoolId }, select: { id: true, studentMembershipId: true, academicYearId: true, revokedAt: true } });
  if (!c) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (c.revokedAt) return;
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    await tx.feeConcession.update({ where: { id: c.id }, data: { revokedAt: new Date() } });
    await regenerateDemands(tx, caller.schoolId, c.studentMembershipId, c.academicYearId);
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.concessionRevoke", targetType: "Membership", targetId: c.studentMembershipId, meta: { concessionId } });
}

/* -------------------------------------------------------------------------- */
/* Reading one pupil                                                           */
/* -------------------------------------------------------------------------- */

export type DemandRow = {
  id: string;
  label: string;
  dueDateKey: string;
  grossPaise: number;
  concessionPaise: number;
  netPaise: number;
  paidPaise: number;
  outstandingPaise: number;
  status: string;
  overdue: boolean;
  lines: DemandLine[];
};

export function toDemandRow(d: { id: string; label: string; dueDate: Date; grossPaise: number; concessionPaise: number; netPaise: number; paidPaise: number; status: string; linesJson: string }, todayKeyInZone: string): DemandRow {
  const dueDateKey = dateToDay(d.dueDate);
  const outstandingPaise = d.status === "OPEN" || d.status === "PART" ? Math.max(0, d.netPaise - d.paidPaise) : 0;
  return {
    id: d.id,
    label: d.label,
    dueDateKey,
    grossPaise: d.grossPaise,
    concessionPaise: d.concessionPaise,
    netPaise: d.netPaise,
    paidPaise: d.paidPaise,
    outstandingPaise,
    status: d.status,
    overdue: outstandingPaise > 0 && dueDateKey < todayKeyInZone,
    lines: readJson<DemandLine[]>(d.linesJson, []),
  };
}

export type PupilLedger = {
  pupil: { studentMembershipId: string; name: string; studentCode: string | null; gradeLevel: string | null; className: string | null; leftAt: Date | null };
  year: { id: string; name: string } | null;
  plan: { structureId: string; structureName: string } | null;
  demands: DemandRow[];
  concessions: { id: string; headId: string | null; headName: string | null; kind: string; value: number; reason: string; grantedBy: string; createdAt: Date; revokedAt: Date | null }[];
  payments: {
    id: string;
    amountPaise: number;
    method: string;
    status: string;
    reference: string | null;
    note: string | null;
    paidAt: Date | null;
    claimedAt: Date | null;
    createdAt: Date;
    collectedBy: string | null;
    payer: string | null;
    receipt: { id: string; serial: string } | null;
    reversalReason: string | null;
    refundedPaise: number;
  }[];
  totals: { netPaise: number; paidPaise: number; outstandingPaise: number; overduePaise: number };
};

/** Everything the office (or, through the family read, a guardian) sees about one pupil's fees this year. */
export async function pupilLedger(schoolId: string, studentMembershipId: string, opts: { academicYearId?: string; todayKey: string }): Promise<PupilLedger> {
  const pupil = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT" },
    select: { id: true, studentCode: true, gradeLevel: true, leftAt: true, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } },
  });
  if (!pupil) throw new AccessError("fees.notFound", "NOT_FOUND");
  const year = opts.academicYearId
    ? await db.academicYear.findFirst({ where: { id: opts.academicYearId, schoolId }, select: { id: true, name: true } })
    : await currentAcademicYear(schoolId).then((y) => (y ? { id: y.id, name: y.name } : null));
  const [plan, demands, concessions, payments] = await Promise.all([
    year ? db.studentFeePlan.findUnique({ where: { studentMembershipId_academicYearId: { studentMembershipId, academicYearId: year.id } }, select: { structureId: true, structure: { select: { name: true } } } }) : null,
    year ? db.feeDemand.findMany({ where: { schoolId, studentMembershipId, academicYearId: year.id }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }) : [],
    year ? db.feeConcession.findMany({ where: { schoolId, studentMembershipId, academicYearId: year.id }, orderBy: { createdAt: "desc" }, include: { head: { select: { name: true } }, grantedBy: { select: { name: true } } } }) : [],
    db.feePayment.findMany({
      where: { schoolId, studentMembershipId, status: { not: "FAILED" } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { receipt: { select: { id: true, serial: true } }, collectedBy: { select: { name: true } }, payer: { select: { name: true } }, refunds: { where: { status: "DONE" }, select: { amountPaise: true } } },
    }),
  ]);
  const rows = demands.map((d) => toDemandRow(d, opts.todayKey));
  const asked = rows.filter((d) => d.status !== "CANCELLED" && d.status !== "CARRIED");
  const received = rows.filter((d) => d.status !== "CANCELLED");
  return {
    pupil: { studentMembershipId: pupil.id, name: pupil.user.preferredName ?? pupil.user.name, studentCode: pupil.studentCode, gradeLevel: pupil.gradeLevel, className: pupil.enrollments[0]?.class.name ?? null, leftAt: pupil.leftAt },
    year,
    plan: plan ? { structureId: plan.structureId, structureName: plan.structure.name } : null,
    demands: rows,
    concessions: concessions.map((c) => ({ id: c.id, headId: c.headId, headName: c.head?.name ?? null, kind: c.kind, value: c.value, reason: c.reason, grantedBy: c.grantedBy.name, createdAt: c.createdAt, revokedAt: c.revokedAt })),
    payments: payments.map((p) => ({
      id: p.id,
      amountPaise: p.amountPaise,
      method: p.method,
      status: p.status,
      reference: p.reference,
      note: p.note,
      paidAt: p.paidAt,
      claimedAt: p.claimedAt,
      createdAt: p.createdAt,
      collectedBy: p.collectedBy?.name ?? null,
      payer: p.payer?.name ?? null,
      receipt: p.receipt,
      reversalReason: p.reversalReason,
      refundedPaise: p.refunds.reduce((a, r) => a + r.amountPaise, 0),
    })),
    // THE RULE (fees-reports.ts has it in full): outstanding and overdue are
    // per demand — Σ max(0, net − paid) over OPEN and PART rows, never netted
    // across a pupil's demands, so an overpaid Term 1 does not hide Term 2's
    // balance. Net leaves out CANCELLED rows (they ask nothing) and CARRIED
    // ones (their balance is next year's opening balance). Paid leaves out
    // only CANCELLED rows: money paid on a demand before it was carried was
    // received in THIS year against this year's receipts and stays in this
    // year's paid total, so after a carry-forward paid may exceed net here —
    // the difference is exactly what the opening balance was reduced by.
    totals: {
      netPaise: asked.reduce((a, d) => a + d.netPaise, 0),
      paidPaise: received.reduce((a, d) => a + d.paidPaise, 0),
      outstandingPaise: rows.reduce((a, d) => a + d.outstandingPaise, 0),
      overduePaise: rows.filter((d) => d.overdue).reduce((a, d) => a + d.outstandingPaise, 0),
    },
  };
}

/** A class's pupils with their plan and totals — the assignment screen. */
export async function classFeeRoster(ctx: ActiveContext, classId: string, todayKeyInZone: string) {
  const caller = officeOrHead(ctx);
  const klass = await db.class.findFirst({ where: { id: classId, schoolId: caller.schoolId }, select: { id: true, name: true, gradeLevel: true } });
  if (!klass) throw new AccessError("fees.notFound", "NOT_FOUND");
  const year = await currentAcademicYear(caller.schoolId);
  const enrolled = await db.enrollment.findMany({
    where: { classId, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
    select: { student: { select: { id: true, studentCode: true, user: { select: { name: true, preferredName: true } } } } },
    orderBy: { student: { user: { name: "asc" } } },
  });
  const ids = enrolled.map((e) => e.student.id);
  const [plans, demands] = await Promise.all([
    year ? db.studentFeePlan.findMany({ where: { studentMembershipId: { in: ids }, academicYearId: year.id }, select: { studentMembershipId: true, structure: { select: { id: true, name: true } } } }) : [],
    year ? db.feeDemand.findMany({ where: { studentMembershipId: { in: ids }, academicYearId: year.id }, select: { studentMembershipId: true, netPaise: true, paidPaise: true, status: true, dueDate: true } }) : [],
  ]);
  const planOf = new Map(plans.map((p) => [p.studentMembershipId, p.structure]));
  return {
    klass,
    year: year ? { id: year.id, name: year.name } : null,
    pupils: enrolled.map((e) => {
      const mine = demands.filter((d) => d.studentMembershipId === e.student.id && (d.status === "OPEN" || d.status === "PART" || d.status === "PAID"));
      const netPaise = mine.reduce((a, d) => a + d.netPaise, 0);
      const paidPaise = mine.reduce((a, d) => a + d.paidPaise, 0);
      // Per demand, as everywhere: Σ max(0, net − paid) over the open rows.
      const balance = (d: (typeof mine)[number]) => (d.status === "PAID" ? 0 : Math.max(0, d.netPaise - d.paidPaise));
      const outstandingPaise = mine.reduce((a, d) => a + balance(d), 0);
      const overduePaise = mine.filter((d) => dateToDay(d.dueDate) < todayKeyInZone).reduce((a, d) => a + balance(d), 0);
      const plan = planOf.get(e.student.id);
      return { studentMembershipId: e.student.id, name: e.student.user.preferredName ?? e.student.user.name, studentCode: e.student.studentCode, structureId: plan?.id ?? null, structureName: plan?.name ?? null, netPaise, paidPaise, outstandingPaise, overduePaise };
    }),
  };
}
