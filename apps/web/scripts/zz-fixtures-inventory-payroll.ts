import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { COMPONENT_KIND, STATUTORY_CODES, type SalaryComponentCode, type SalaryFormula } from "@edulink/contracts";
import { computeSlip, daysInMonthOf, slipDigest } from "../src/lib/payroll-rules";
import { ZZ_ASSET_TAG } from "../src/lib/api-catalog/inventory";
import { ZZ_PAYROLL_MONTH, ZZ_PAYROLL_SETTINGS } from "../src/lib/api-catalog/payroll";

/**
 * The inventory and payroll fixtures for ZZ Northgate (the INVENTORY and
 * PAYROLL modules, 3 October 2026), for the screens and the API sweep.
 *
 * INVENTORY: two categories, a vendor, three items, one purchase record
 * that brought chalk and registers into the main store, two movements out
 * of it (chalk to the sweep's teacher, registers to a room), three assets
 * (ZZ-A-0001 with the sweep's teacher, one in the store, one in repair) and
 * one waiting ask. Written directly, keeping each place's stock the sum of
 * its movements; made once — a second run finds the bill and leaves it all.
 *
 * PAYROLL: the statutory settings the sweep sends back unchanged, one
 * structure, salaries for three people (the sweep's teacher — the grade-3
 * lead, as scripts/api-sweep.ts resolves it — the admin and the head), and
 * one LOCKED run for ZZ_PAYROLL_MONTH with their slips worked out by the
 * same pure function the app uses, its digest, shared with the head, and one
 * file cut from it. The PAN and bank account are sealed when the server has
 * FEES_SECRET_KEY; without it the salaries keep none.
 */
type Db = PrismaClient;

async function sweepTeacher(db: Db, schoolId: string) {
  const klass = await db.class.findFirst({ where: { schoolId, archivedAt: null, gradeLevel: "3", enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } });
  const lead = klass ? await db.classTeacher.findFirst({ where: { classId: klass.id, role: "LEAD" }, select: { teacherMembershipId: true } }) : null;
  return lead?.teacherMembershipId ?? null;
}

export async function buildInventory(db: Db, school: { id: string }, adminUserId: string): Promise<{ items: number; assets: number; movements: number; made: boolean }> {
  const schoolId = school.id;
  const existing = await db.purchaseRecord.findFirst({ where: { schoolId, invoiceRef: "ZZ/2026/001" }, select: { id: true } });
  const teacher = await sweepTeacher(db, schoolId);
  if (!existing) {
    const stationery = await db.inventoryCategory.upsert({ where: { schoolId_name: { schoolId, name: "ZZ Stationery" } }, create: { schoolId, name: "ZZ Stationery" }, update: {}, select: { id: true } });
    const electronics = await db.inventoryCategory.upsert({ where: { schoolId_name: { schoolId, name: "ZZ Electronics" } }, create: { schoolId, name: "ZZ Electronics", depreciationRateBp: 1500 }, update: {}, select: { id: true } });
    const vendor = await db.vendor.upsert({ where: { schoolId_name: { schoolId, name: "ZZ Shree Stationers" } }, create: { schoolId, name: "ZZ Shree Stationers", phone: "+912024000111", gstin: "27AAAAA0000A1Z5" }, update: {}, select: { id: true, name: true } });
    const item = (code: string, name: string, unit: string, reorderLevel: number, kind = "CONSUMABLE", categoryId: string | null = stationery.id) =>
      db.inventoryItem.upsert({ where: { schoolId_code: { schoolId, code } }, create: { schoolId, code, name, unit, reorderLevel, kind, categoryId }, update: {}, select: { id: true } });
    const chalk = await item("ZZ-CHALK", "ZZ White chalk (box of 100)", "box", 5);
    const reg = await item("ZZ-REG", "ZZ Attendance register", "piece", 10);
    const marker = await item("ZZ-MARKER", "ZZ Whiteboard marker", "piece", 5);
    const projector = await item("ZZ-PROJ", "ZZ Projector", "piece", 0, "ASSET", electronics.id);
    const lines = [
      { itemCode: "ZZ-CHALK", description: "ZZ White chalk (box of 100)", quantity: 20, unitPaise: 12_000, totalPaise: 240_000 },
      { itemCode: "ZZ-REG", description: "ZZ Attendance register", quantity: 30, unitPaise: 8_500, totalPaise: 255_000 },
      { itemCode: null, description: "ZZ Delivery", quantity: 1, unitPaise: 5_000, totalPaise: 5_000 },
    ];
    await db.$transaction(async (tx) => {
      const bill = await tx.purchaseRecord.create({ data: { schoolId, vendorId: vendor.id, vendorName: vendor.name, dateKey: "2026-09-01", invoiceRef: "ZZ/2026/001", location: "ZZ Main store", linesJson: JSON.stringify(lines), totalPaise: lines.reduce((a, l) => a + l.totalPaise, 0), note: "Term 2 stock.", createdByUserId: adminUserId }, select: { id: true } });
      const moves = [
        { itemId: chalk.id, kind: "PURCHASE", delta: 20, purchaseRecordId: bill.id, reference: "ZZ/2026/001" },
        { itemId: reg.id, kind: "PURCHASE", delta: 30, purchaseRecordId: bill.id, reference: "ZZ/2026/001" },
        { itemId: chalk.id, kind: "ISSUE", delta: -2, toMembershipId: teacher, reference: "ZZ term start" },
        { itemId: reg.id, kind: "ISSUE", delta: -5, toRoom: "ZZ Grade 3 A", reference: "ZZ term start" },
      ];
      for (const m of moves) await tx.stockMovement.create({ data: { schoolId, location: "ZZ Main store", byUserId: adminUserId, note: "", ...m } });
      await tx.inventoryStock.create({ data: { schoolId, itemId: chalk.id, location: "ZZ Main store", quantity: 18 } });
      await tx.inventoryStock.create({ data: { schoolId, itemId: reg.id, location: "ZZ Main store", quantity: 25 } });
    });
    const asset = async (tagNumber: string, name: string, data: { status: string; custodianMembershipId: string | null; location: string; costPaise: number; purchaseDate: string; itemId?: string }) => {
      const a = await db.asset.upsert({ where: { schoolId_tagNumber: { schoolId, tagNumber } }, create: { schoolId, tagNumber, name, categoryId: electronics.id, vendorId: null, purchaseDate: new Date(`${data.purchaseDate}T00:00:00Z`), costPaise: data.costPaise, location: data.location, custodianMembershipId: data.custodianMembershipId, status: data.status, itemId: data.itemId ?? null }, update: {}, select: { id: true } });
      await db.assetEvent.create({ data: { schoolId, assetId: a.id, kind: "CREATED", byUserId: adminUserId } });
      if (data.status === "REPAIR") await db.assetEvent.create({ data: { schoolId, assetId: a.id, kind: "REPAIR", note: "ZZ the paper feed jams", byUserId: adminUserId } });
    };
    await asset(ZZ_ASSET_TAG, "ZZ Projector, Grade 3 A", { status: teacher ? "IN_USE" : "IN_STORE", custodianMembershipId: teacher, location: "ZZ Grade 3 A", costPaise: 4_500_000, purchaseDate: "2025-06-10", itemId: projector.id });
    await asset("ZZ-A-0002", "ZZ Office laptop", { status: "IN_STORE", custodianMembershipId: null, location: "ZZ Main store", costPaise: 5_200_000, purchaseDate: "2024-07-01" });
    await asset("ZZ-A-0003", "ZZ Staff-room printer", { status: "REPAIR", custodianMembershipId: null, location: "ZZ Staff room", costPaise: 1_800_000, purchaseDate: "2023-11-15" });
    if (teacher) await db.inventoryRequest.create({ data: { schoolId, requesterMembershipId: teacher, itemId: marker.id, quantity: 4, note: "For the board in Grade 3 A." } });
  }
  const [items, assets, movements] = await Promise.all([db.inventoryItem.count({ where: { schoolId } }), db.asset.count({ where: { schoolId } }), db.stockMovement.count({ where: { schoolId } })]);
  return { items, assets, movements, made: !existing };
}

const STRUCTURE: { code: SalaryComponentCode; formula: SalaryFormula; value: number }[] = [
  { code: "BASIC", formula: "FIXED", value: 0 },
  { code: "HRA", formula: "PERCENT_OF_BASIC", value: 4000 },
  { code: "DA", formula: "PERCENT_OF_BASIC", value: 1000 },
  { code: "CONVEYANCE", formula: "FIXED", value: 160_000 },
  { code: "PF_EMPLOYEE", formula: "FIXED", value: 0 },
  { code: "PF_EMPLOYER", formula: "FIXED", value: 0 },
  { code: "ESI_EMPLOYEE", formula: "FIXED", value: 0 },
  { code: "ESI_EMPLOYER", formula: "FIXED", value: 0 },
  { code: "PT", formula: "FIXED", value: 0 },
  { code: "TDS", formula: "FIXED", value: 0 },
];

/** Sealing as the app does it (secret-box), when the key is there; otherwise nothing is sealed. */
async function sealer(): Promise<((plain: string, bound: string) => string) | null> {
  if (!process.env.FEES_SECRET_KEY) return null;
  try {
    const { seal } = await import("../src/lib/secret-box");
    return seal;
  } catch {
    return null;
  }
}

export async function buildPayroll(db: Db, school: { id: string; code: string }, adminUserId: string): Promise<{ salaries: number; slips: number; month: string; made: boolean }> {
  const schoolId = school.id;
  await db.payrollSettings.upsert({ where: { schoolId }, create: { schoolId, ...ZZ_PAYROLL_SETTINGS }, update: { ...ZZ_PAYROLL_SETTINGS } });
  const structure = await db.salaryStructure.upsert({ where: { schoolId_name: { schoolId, name: "ZZ Teaching staff" } }, create: { schoolId, name: "ZZ Teaching staff" }, update: {}, select: { id: true } });
  if ((await db.salaryComponent.count({ where: { structureId: structure.id } })) === 0) {
    await db.salaryComponent.createMany({ data: STRUCTURE.map((c, i) => ({ schoolId, structureId: structure.id, code: c.code, label: "", kind: COMPONENT_KIND[c.code], formula: c.formula, value: c.value, statutory: STATUTORY_CODES.includes(c.code), position: i })) });
  }
  const teacher = await sweepTeacher(db, schoolId);
  const admin = await db.membership.findFirst({ where: { schoolId, role: "ADMIN", status: "ACTIVE", user: { email: "zz.admin@zz.test" } }, select: { id: true } });
  const head = await db.membership.findFirst({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE" }, orderBy: { joinedAt: "asc" }, select: { id: true } });
  const seal = await sealer();
  const people = [
    { id: teacher, basic: 1_500_000, uan: "100900800701", esi: "3100900801", pan: "ZZZPA1234Z", account: "50100200300401", gender: null as string | null },
    { id: admin?.id ?? null, basic: 2_200_000, uan: "100900800702", esi: "", pan: "ZZZPB2345Z", account: "50100200300402", gender: null },
    { id: head?.id ?? null, basic: 4_000_000, uan: "100900800703", esi: "", pan: "ZZZPC3456Z", account: "50100200300403", gender: null },
  ].filter((p): p is typeof p & { id: string } => Boolean(p.id));
  for (const p of people) {
    const sealed = seal ? { panSealed: seal(p.pan, `payroll:${schoolId}:${p.id}:pan`), panLast4: p.pan.slice(-4), bankAccountSealed: seal(p.account, `payroll:${schoolId}:${p.id}:bank`), bankLast4: p.account.slice(-4), bankIfsc: "HDFC0001234", bankName: "ZZ HDFC Bank" } : {};
    const data = { structureId: structure.id, basicPaise: p.basic, pfUan: p.uan, esiNumber: p.esi || null, paymentMode: seal ? "BANK" : "CASH", ...sealed };
    await db.staffSalary.upsert({ where: { membershipId_effectiveFromKey: { membershipId: p.id, effectiveFromKey: "2026-04-01" } }, create: { schoolId, membershipId: p.id, effectiveFromKey: "2026-04-01", ...data }, update: {} });
  }
  // One LOCKED month, made once.
  const run = await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId, month: ZZ_PAYROLL_MONTH } }, select: { id: true } });
  if (!run) {
    const comps = STRUCTURE.map((c) => ({ code: c.code, label: "", formula: c.formula, value: c.value }));
    const members = await db.membership.findMany({ where: { id: { in: people.map((p) => p.id) } }, select: { id: true, role: true, user: { select: { name: true } }, staffRecord: { select: { designation: true, gender: true } } } });
    const salaries = await db.staffSalary.findMany({ where: { membershipId: { in: people.map((p) => p.id) } }, select: { membershipId: true, paymentMode: true, bankLast4: true } });
    const slips = members.map((m) => {
      const p = people.find((x) => x.id === m.id)!;
      const f = computeSlip({ month: ZZ_PAYROLL_MONTH, daysInMonth: daysInMonthOf(ZZ_PAYROLL_MONTH), lopHalfDays: 0, basicPaise: p.basic, components: comps, overrides: {}, settings: ZZ_PAYROLL_SETTINGS, gender: m.staffRecord?.gender ?? null, arrearsPaise: 0, tdsOverridePaise: m.role === "PRINCIPAL" ? 350_000 : null, advances: [] });
      const sal = salaries.find((s) => s.membershipId === m.id);
      return { schoolId, membershipId: m.id, staffName: m.user.name, department: m.role, designation: m.staffRecord?.designation ?? null, daysInMonth: daysInMonthOf(ZZ_PAYROLL_MONTH), lopHalfDays: 0, lopOverrideHalfDays: null, linesJson: JSON.stringify(f.lines), grossPaise: f.grossPaise, deductionsPaise: f.deductionsPaise, employerPaise: f.employerPaise, netPaise: f.netPaise, arrearsPaise: 0, tdsOverridePaise: m.role === "PRINCIPAL" ? 350_000 : null, notes: "", paymentMode: sal?.paymentMode ?? "BANK", bankLast4: sal?.bankLast4 ?? null };
    });
    const sum = (k: "grossPaise" | "deductionsPaise" | "employerPaise" | "netPaise") => slips.reduce((a, s) => a + s[k], 0);
    await db.$transaction(async (tx) => {
      const r = await tx.payrollRun.create({ data: { schoolId, month: ZZ_PAYROLL_MONTH, status: "LOCKED", headcount: slips.length, grossPaise: sum("grossPaise"), deductionsPaise: sum("deductionsPaise"), employerPaise: sum("employerPaise"), netPaise: sum("netPaise"), lockDigest: slipDigest(slips), sharedWithPrincipal: true, createdByUserId: adminUserId, lockedByUserId: adminUserId, lockedAt: new Date("2026-09-01T06:30:00Z") }, select: { id: true } });
      await tx.payslip.createMany({ data: slips.map((s) => ({ ...s, runId: r.id })) });
      // The ECR as the app cuts it, for the one file the fixture has.
      const ecr = slips
        .map((s) => {
          const lines = JSON.parse(s.linesJson) as { code: string; paise: number; basePaise?: number; epsPaise?: number; epsBasePaise?: number }[];
          const ee = lines.find((l) => l.code === "PF_EMPLOYEE");
          const er = lines.find((l) => l.code === "PF_EMPLOYER");
          const uan = people.find((p) => p.id === s.membershipId)!.uan;
          if (!ee) return null;
          const r2 = (p: number) => Math.round(p / 100);
          return [uan, s.staffName.toUpperCase(), r2(s.grossPaise), r2(ee.basePaise ?? 0), r2(er?.epsBasePaise ?? 0), r2(er?.epsBasePaise ?? 0), r2(ee.paise), r2(er?.epsPaise ?? 0), r2((er?.paise ?? 0) - (er?.epsPaise ?? 0)), 0, 0].join("#~#");
        })
        .filter(Boolean);
      const content = ecr.length ? ecr.join("\n") + "\n" : "";
      const pfTotal = slips.reduce((a, s) => a + (JSON.parse(s.linesJson) as { code: string; paise: number }[]).filter((l) => l.code === "PF_EMPLOYEE" || l.code === "PF_EMPLOYER").reduce((b, l) => b + l.paise, 0), 0);
      await tx.payrollExport.create({ data: { schoolId, runId: r.id, kind: "PF_ECR", fileName: `${school.code}-pf-ecr-${ZZ_PAYROLL_MONTH}.txt`, sha256: createHash("sha256").update(content).digest("hex"), rows: ecr.length, totalPaise: pfTotal, createdByUserId: adminUserId } });
    });
  }
  const [salaries, slips] = await Promise.all([db.staffSalary.count({ where: { schoolId } }), db.payslip.count({ where: { schoolId } })]);
  return { salaries, slips, month: ZZ_PAYROLL_MONTH, made: !run };
}
