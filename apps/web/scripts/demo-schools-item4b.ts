// owner-batch-item4b (27 October 2026) — the whole file is item 4b's.
/**
 * SUNRISE'S OTHER MODULES, WITH DATA (item 4b of the owner's batch of 27
 * October 2026). Sunrise Public School had INVENTORY, PAYROLL, WEBSITE and
 * ALUMNI switched on and nothing in them, and docs/demo-schools.md said "Not
 * seeded: a review round, online payments". This file fills them, called once
 * from demo-schools.ts main (inside its `// owner-batch-item4b` fence) after
 * every other builder, so the payroll's roll holds every member of staff the
 * other builders made:
 *
 *   inventory   six categories, two vendors, 25 items, two purchase records
 *               with their scanned bills, issues to staff (their "My items"),
 *               a department and a room, five tagged assets (three with a
 *               custodian), one stock count at the main store, one waiting ask;
 *   payroll     the statutory settings, a teaching and a support structure, a
 *               salary for every member of staff (bank for most, UPI for the
 *               driver and the warden, cash for the cleaner, the numbers sealed
 *               by payroll's own saveSalary), the cleaner sunrise.support01 added
 *               the way the office adds one (support-staff.ts addSupportStaff, no
 *               login) and then given the sign-in a first sign-in would give,
 *               last month's run LOCKED, shared with the head, its bank, UPI and
 *               PF files cut, and every slip recorded paid (the bank slips as a
 *               batch with their UTRs, the UPI slips each with its UTR, the
 *               cleaner's in cash) so the run is PAID; a recorded advance and a
 *               teacher's waiting ask; this month's run DRAFT;
 *   website     a published site with six pages (home, about, academics,
 *               admissions, gallery, contact), a school post with a picture for
 *               the news and the hero, the teachers' photos (placeholder
 *               pictures made in code, scripts/png.ts) as an album with consent,
 *               a prospectus PDF, one open review link, three days of visits, one
 *               enquiry, and www.sunrisepublicschool.test waiting for its DNS;
 *   alumni      the feed open to alumni posts, five adult alumni
 *               (sunrise.alumni01..05) each listed in the directory by their own
 *               act, one a mentor by the office's, a post by each and by
 *               sunrise.pupil49 (a minor, so not listed), a room between
 *               pupil49 and his grade-8 teacher, a note from the office;
 *   reviews     a parents' round answered and closed by the head, and a pupils'
 *               round open with some answers in;
 *   fees        the school's gateway in TEST mode (devbox transport: no account
 *               anywhere is called), its UPI id, and four families' payments:
 *               one online and settled, one online and failed, one UPI claim
 *               waiting for the office, one UPI claim the office confirmed.
 *
 * Every write goes through the app's own library function where one exists,
 * as an actor whose session is made here (userAgent "zz-walk") and deleted at
 * the end, as demo-college-stream.ts does. IDEMPOTENT: each step looks for
 * its row first and does nothing when it is there, so a second run adds
 * nothing (the website's draft is saved again only when it differs).
 */
import { randomBytes } from "node:crypto";
import { gstinCheckChar, SITE_PAGES, SITE_SECTIONS, type SalaryComponentCode, type SalaryFormula, type SiteConfig, type SitePage } from "@edulink/contracts";
import type { ActiveContext } from "../src/lib/session";
import { REVIEW_QUESTIONS } from "../src/lib/constants";
import { addDaysToKey, todayKey } from "../src/lib/dates";
import { askForItem, createAsset, recordMovement, recordPurchase, saveCategory, saveItem, saveVendor, stockTake } from "../src/lib/inventory";
import { askAdvance, draftRun, lockRun, payrollExport, recordAdvance, savePayrollSettings, saveSalary, saveStructure, shareRun } from "../src/lib/payroll";
import { recordPaymentLines, recordSalaryPayment } from "../src/lib/salary-payments";
import { slipRefsOf } from "../src/lib/salary-payment-rules";
import { addSupportStaff } from "../src/lib/support-staff";
import { publishSite, saveSite } from "../src/lib/site-admin";
import { defaultSiteConfig } from "../src/lib/site-config";
import { uploadSiteFile } from "../src/lib/site-files";
import { createSiteShare, siteShares } from "../src/lib/site-share";
import { saveSiteDomain } from "../src/lib/site-domains";
import { storeFile } from "../src/lib/storage";
import { openAlumnus } from "../src/lib/alumni-membership";
import { joinAlumniDirectory, sendAlumniNote, setAlumniFeedMode, setAlumnusMentor } from "../src/lib/alumni";
import { closeReviewRound, openReviewRound, submitReview } from "../src/lib/reviews";
import { saveFeeSettings, saveGatewayAccount } from "../src/lib/fees";
import { claimUpiPayment, confirmClaim, failOnlinePayment, settleOnlinePayment, startOnlineCheckout, startUpiPayment } from "../src/lib/fees-payments";
import { db, upsertUser, type Ctx } from "./zz-fixtures";
import { fixturePng } from "./png";

const DOMAIN = "demo.relay.test";
const TZ = "Asia/Kolkata";
const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/* -------------------------------------------------------------------------- */
/* what the demo script hands in (demo-schools.ts Built, structurally)         */
/* -------------------------------------------------------------------------- */

type Person = { user: { id: string; email: string | null; name: string }; membership: { id: string } };
export type Item4bSchool = {
  school: { id: string; name: string; slug: string };
  admin: Person;
  principal: Person;
  formTeachers: Person[];
  subjectTeachers: Person[];
  spare: Person;
  classes: { id: string; grade: string; name: string; teacher: Person }[];
  pupils: { membershipId: string; userId: string; email: string; name: string; grade: string; seat: number; parentUserId: string | null }[];
};

/** What the run made, for the roster section and the console. */
export type Item4bResult = {
  inventory: { items: number; purchases: number; issues: number; assets: number; stockTake: boolean };
  payroll: { lastMonth: string; lastStatus: string; thisMonth: string; thisStatus: string; salaries: number; payments: number; supportMembershipId: string };
  website: { pages: string[]; live: boolean; shareUrl: string | null; domain: string; versionId: string | null };
  alumni: { emails: string[]; listed: number; mentor: string; posts: number };
  reviews: { closedRoundId: string; openRoundId: string; closedResponses: number; openResponses: number };
  fees: { gateway: string; payments: { label: string; pupil: string; parent: string; status: string; paymentId: string }[] };
  accounts: { email: string; name: string; role: string; look: string }[];
};

let lastResult: Item4bResult | null = null;

/* -------------------------------------------------------------------------- */
/* actors for the library calls, deleted at the end (as demo-college-stream.ts) */
/* -------------------------------------------------------------------------- */

const PREFS = { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } as const;
const sessionIds: string[] = [];
async function actor(userId: string, schoolId: string | null, role: string, membershipId: string | null): Promise<ActiveContext> {
  const u = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, isMinor: true, isSuperuser: true, isAppAdmin: true } });
  const session = await db.session.create({ data: { userId, tokenHash: `zz-walk-${randomBytes(24).toString("hex")}`, activeSchoolId: schoolId, activeRole: role, userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
  sessionIds.push(session.id);
  return { sessionId: session.id, membershipId, schoolId, role: role as ActiveContext["role"], user: { id: u.id, name: u.name, preferredName: null, email: u.email, avatarKey: null, isMinor: u.isMinor, isSuperuser: u.isSuperuser, isAppAdmin: u.isAppAdmin, prefs: PREFS as unknown as ActiveContext["user"]["prefs"] } };
}
const staffActor = (b: Item4bSchool, p: Person, role: string) => actor(p.user.id, b.school.id, role, p.membership.id);

/** A one-page PDF: enough for the store's byte sniff and a browser to open (as zz-website.ts). */
function fixturePdf(): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
}

function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return m === 1 ? `${y - 1}-12` : `${y}-${pad(m - 1)}`;
}

/* -------------------------------------------------------------------------- */
/* inventory                                                                   */
/* -------------------------------------------------------------------------- */

const CATEGORIES: [string, number | null][] = [["Stationery", null], ["Science laboratory", null], ["Sports", null], ["Housekeeping", null], ["Electronics", 1500], ["Furniture", 1000]];
type ItemSpec = { code: string; name: string; unit: string; reorder: number; category: string; kind?: "CONSUMABLE" | "ASSET" };
const ITEMS: ItemSpec[] = [
  { code: "ST-CHALK", name: "White chalk, box of 100", unit: "box", reorder: 10, category: "Stationery" },
  { code: "ST-DUSTER", name: "Blackboard duster", unit: "piece", reorder: 10, category: "Stationery" },
  { code: "ST-MARKER", name: "Whiteboard marker, black", unit: "piece", reorder: 20, category: "Stationery" },
  { code: "ST-REGISTER", name: "Attendance register", unit: "piece", reorder: 10, category: "Stationery" },
  { code: "ST-A4", name: "A4 paper, ream of 500", unit: "ream", reorder: 15, category: "Stationery" },
  { code: "ST-BOOKLET", name: "Answer booklet, 24 pages", unit: "piece", reorder: 200, category: "Stationery" },
  { code: "ST-STAPLES", name: "Stapler pins, box", unit: "box", reorder: 10, category: "Stationery" },
  { code: "ST-CHART", name: "Chart paper, sheet", unit: "sheet", reorder: 50, category: "Stationery" },
  { code: "SC-BEAKER", name: "Glass beaker, 250 ml", unit: "piece", reorder: 10, category: "Science laboratory" },
  { code: "SC-TESTTUBE", name: "Test tube, 15 ml", unit: "piece", reorder: 50, category: "Science laboratory" },
  { code: "SC-LITMUS", name: "Litmus paper, booklet", unit: "booklet", reorder: 10, category: "Science laboratory" },
  { code: "SC-LAMP", name: "Spirit lamp", unit: "piece", reorder: 5, category: "Science laboratory" },
  { code: "SC-MAGNET", name: "Bar magnet, pair", unit: "pair", reorder: 5, category: "Science laboratory" },
  { code: "SC-ROBOKIT", name: "Microcontroller kit (robotics)", unit: "kit", reorder: 4, category: "Science laboratory" },
  { code: "SP-CRICKET", name: "Cricket ball, leather", unit: "piece", reorder: 6, category: "Sports" },
  { code: "SP-FOOTBALL", name: "Football, size 5", unit: "piece", reorder: 4, category: "Sports" },
  { code: "SP-ROPE", name: "Skipping rope", unit: "piece", reorder: 10, category: "Sports" },
  { code: "SP-CONE", name: "Training cone", unit: "piece", reorder: 20, category: "Sports" },
  { code: "HK-CLEANER", name: "Floor cleaner, 5 litre can", unit: "can", reorder: 4, category: "Housekeeping" },
  { code: "HK-BROOM", name: "Soft broom", unit: "piece", reorder: 6, category: "Housekeeping" },
  { code: "HK-HANDWASH", name: "Hand wash, 5 litre can", unit: "can", reorder: 4, category: "Housekeeping" },
  { code: "HK-DUSTBIN", name: "Classroom dustbin", unit: "piece", reorder: 4, category: "Housekeeping" },
  { code: "EL-PROJECTOR", name: "Classroom projector", unit: "piece", reorder: 0, category: "Electronics", kind: "ASSET" },
  { code: "EL-LAPTOP", name: "Laptop", unit: "piece", reorder: 0, category: "Electronics", kind: "ASSET" },
  { code: "FU-DESK", name: "Pupil desk, double", unit: "piece", reorder: 0, category: "Furniture", kind: "ASSET" },
];

async function buildInventory(b: Item4bSchool): Promise<Item4bResult["inventory"]> {
  const s = b.school.id;
  const admin = await staffActor(b, b.admin, "ADMIN");
  const categoryIds = new Map<string, string>();
  for (const [name, rate] of CATEGORIES) {
    const found = await db.inventoryCategory.findFirst({ where: { schoolId: s, name }, select: { id: true } });
    categoryIds.set(name, found?.id ?? (await saveCategory(admin, { name, depreciationRateBp: rate })).id);
  }
  const vendor = async (name: string, phone: string, gstinBase: string, address: string) =>
    (await db.vendor.findFirst({ where: { schoolId: s, name }, select: { id: true } }))?.id ?? (await saveVendor(admin, { name, phone, gstin: `${gstinBase}${gstinCheckChar(gstinBase)}`, address })).id;
  const stationer = await vendor("Shree Ganesh Traders", "+912027291188", "27AAQFS4821K1Z", "Shop 4, Baner Road, Pune 411045");
  const scientific = await vendor("Deccan Scientific Suppliers", "+912026870044", "27AAFCD7342M1Z", "Budhwar Peth, Pune 411002");
  for (const it of ITEMS) {
    if (await db.inventoryItem.findUnique({ where: { schoolId_code: { schoolId: s, code: it.code } }, select: { id: true } })) continue;
    await saveItem(admin, { code: it.code, name: it.name, categoryId: categoryIds.get(it.category)!, unit: it.unit, reorderLevel: it.reorder, kind: it.kind ?? "CONSUMABLE" });
  }

  // Two bills with their scans: the term's stationery, sports and housekeeping into the main store; the lab's into the lab.
  const bills = [
    {
      invoiceRef: "SGT/2026/0412", vendorId: stationer, dateKey: "2026-06-05", location: "Main store", note: "Term 1 stock, delivered before the school reopened.",
      lines: [["ST-CHALK", 30, 110_00], ["ST-DUSTER", 20, 45_00], ["ST-MARKER", 60, 28_00], ["ST-REGISTER", 25, 85_00], ["ST-A4", 20, 290_00], ["ST-BOOKLET", 600, 6_00], ["ST-STAPLES", 20, 18_00], ["ST-CHART", 100, 8_00], ["SP-CRICKET", 12, 340_00], ["SP-FOOTBALL", 8, 650_00], ["SP-ROPE", 20, 60_00], ["SP-CONE", 30, 45_00], ["HK-CLEANER", 10, 420_00], ["HK-BROOM", 15, 90_00], ["HK-HANDWASH", 8, 380_00], ["HK-DUSTBIN", 12, 150_00], [null, 1, 250_00]] as [string | null, number, number][],
    },
    {
      invoiceRef: "DSS/26-27/0187", vendorId: scientific, dateKey: "2026-07-20", location: "Science lab", note: "For the grade 6 to 10 practicals and the robotics club.",
      lines: [["SC-BEAKER", 40, 75_00], ["SC-TESTTUBE", 150, 12_00], ["SC-LITMUS", 20, 35_00], ["SC-LAMP", 12, 140_00], ["SC-MAGNET", 15, 95_00], ["SC-ROBOKIT", 8, 1_450_00]] as [string | null, number, number][],
    },
  ];
  for (const bill of bills) {
    if (await db.purchaseRecord.findFirst({ where: { schoolId: s, invoiceRef: bill.invoiceRef }, select: { id: true } })) continue;
    const scan = await storeFile(new File([fixturePdf()], `${bill.invoiceRef.replace(/\//g, "-")}.pdf`, { type: "application/pdf" }));
    await recordPurchase(
      admin,
      { vendorId: bill.vendorId, vendorName: "", dateKey: bill.dateKey, invoiceRef: bill.invoiceRef, location: bill.location, note: bill.note, billFileId: null, lines: bill.lines.map(([itemCode, quantity, unitPaise]) => ({ itemCode, description: itemCode ? "" : "Delivery to the school", quantity, unitPaise })) },
      { storedFileId: scan.fileId },
    );
  }

  // Issues: chalk to every form teacher, markers to the English teacher, the games kit to the PE teacher, kits and beakers from the lab,
  // answer booklets to the exam desk, cleaner to housekeeping (a department: the cleaner signs in only for payslips).
  const [t5, t6, t7, t8, t9, t10] = b.formTeachers as [Person, Person, Person, Person, Person, Person];
  const [english, games] = b.subjectTeachers as [Person, Person];
  const issues: { ref: string; code: string; qty: number; location: string; to?: Person; room?: string; dept?: string; note: string }[] = [
    ...[t5, t6, t7, t8, t9, t10].map((t, i) => ({ ref: `SPS-ISS-${pad(i + 1)}`, code: "ST-CHALK", qty: 3, location: "Main store", to: t, note: "Term start." })),
    { ref: "SPS-ISS-07", code: "ST-MARKER", qty: 6, location: "Main store", to: english, note: "For the English room's whiteboard." },
    { ref: "SPS-ISS-08", code: "SP-CRICKET", qty: 4, location: "Main store", to: games, note: "Inter-house cricket." },
    { ref: "SPS-ISS-09", code: "SP-FOOTBALL", qty: 2, location: "Main store", to: games, note: "Games period." },
    { ref: "SPS-ISS-10", code: "SC-ROBOKIT", qty: 4, location: "Science lab", to: t8, note: "Robotics club, grade 8." },
    { ref: "SPS-ISS-11", code: "SC-BEAKER", qty: 10, location: "Science lab", to: t9, note: "Grade 9 practicals." },
    { ref: "SPS-ISS-12", code: "ST-BOOKLET", qty: 200, location: "Main store", dept: "Examinations", note: "Term 1 examinations." },
    { ref: "SPS-ISS-13", code: "ST-REGISTER", qty: 6, location: "Main store", room: "Staff room", note: "One per form class." },
    { ref: "SPS-ISS-14", code: "HK-CLEANER", qty: 2, location: "Main store", dept: "Housekeeping", note: "October." },
  ];
  for (const i of issues) {
    if (await db.stockMovement.findFirst({ where: { schoolId: s, reference: i.ref }, select: { id: true } })) continue;
    await recordMovement(admin, { itemCode: i.code, kind: "ISSUE", quantity: i.qty, location: i.location, toMembershipId: i.to?.membership.id ?? null, toRoom: i.room ?? "", toDepartment: i.dept ?? "", reference: i.ref, note: i.note });
  }

  // The half-term count at the main store: a box of chalk and a ream short, the rest as the rows say.
  let counted = false;
  if (!(await db.stockMovement.findFirst({ where: { schoolId: s, reference: "stock-take" }, select: { id: true } }))) {
    const onHand = async (code: string) => (await db.inventoryStock.findFirst({ where: { schoolId: s, location: "Main store", item: { code } }, select: { quantity: true } }))?.quantity ?? 0;
    await stockTake(admin, { location: "Main store", note: "Half-term count.", counts: [{ itemCode: "ST-CHALK", counted: (await onHand("ST-CHALK")) - 1 }, { itemCode: "ST-A4", counted: (await onHand("ST-A4")) - 1 }, { itemCode: "ST-DUSTER", counted: await onHand("ST-DUSTER") }, { itemCode: "HK-BROOM", counted: await onHand("HK-BROOM") }] });
    counted = true;
  }

  // Tagged assets: two projectors and a laptop with a custodian, a spare laptop in the store, a desk set in a room.
  const assets = [
    { tagNumber: "SPS-A-0001", name: "Projector, Grade 9 · A", itemCode: "EL-PROJECTOR", category: "Electronics", purchaseDateKey: "2025-06-10", costPaise: 42_000_00, location: "Room 901", custodian: t9, warrantyUntilKey: "2027-06-09" },
    { tagNumber: "SPS-A-0002", name: "Projector, Grade 10 · A", itemCode: "EL-PROJECTOR", category: "Electronics", purchaseDateKey: "2025-06-10", costPaise: 42_000_00, location: "Room 1001", custodian: t10, warrantyUntilKey: "2027-06-09" },
    { tagNumber: "SPS-A-0003", name: "Office laptop", itemCode: "EL-LAPTOP", category: "Electronics", purchaseDateKey: "2024-07-01", costPaise: 56_000_00, location: "Office", custodian: b.admin, warrantyUntilKey: null },
    { tagNumber: "SPS-A-0004", name: "Spare laptop", itemCode: "EL-LAPTOP", category: "Electronics", purchaseDateKey: "2024-07-01", costPaise: 54_500_00, location: "Main store", custodian: null, warrantyUntilKey: null },
    { tagNumber: "SPS-A-0005", name: "Pupil desks, Grade 5 · A (set of 20)", itemCode: "FU-DESK", category: "Furniture", purchaseDateKey: "2022-05-20", costPaise: 96_000_00, location: "Room 501", custodian: null, warrantyUntilKey: null },
  ];
  for (const a of assets) {
    if (await db.asset.findUnique({ where: { schoolId_tagNumber: { schoolId: s, tagNumber: a.tagNumber } }, select: { id: true } })) continue;
    await createAsset(admin, { tagNumber: a.tagNumber, name: a.name, itemCode: a.itemCode, categoryId: categoryIds.get(a.category)!, purchaseDateKey: a.purchaseDateKey, costPaise: a.costPaise, vendorId: null, warrantyUntilKey: a.warrantyUntilKey, location: a.location, custodianMembershipId: a.custodian?.membership.id ?? null, method: "STRAIGHT_LINE", depreciationRateBp: null, condition: a.tagNumber === "SPS-A-0005" ? "FAIR" : "GOOD", note: "" });
  }

  // One waiting ask from the grade-7 form teacher.
  const askNote = "For the grade 7 project wall.";
  if (!(await db.inventoryRequest.findFirst({ where: { schoolId: s, requesterMembershipId: t7.membership.id, note: askNote }, select: { id: true } }))) {
    await askForItem(await staffActor(b, t7, "TEACHER"), { itemCode: "ST-CHART", itemText: "", quantity: 20, note: askNote });
  }

  const [items, purchases, issued, assetRows] = await Promise.all([
    db.inventoryItem.count({ where: { schoolId: s } }),
    db.purchaseRecord.count({ where: { schoolId: s } }),
    db.stockMovement.count({ where: { schoolId: s, kind: "ISSUE" } }),
    db.asset.count({ where: { schoolId: s } }),
  ]);
  return { items, purchases, issues: issued, assets: assetRows, stockTake: counted };
}

/* -------------------------------------------------------------------------- */
/* payroll                                                                     */
/* -------------------------------------------------------------------------- */

const STATUTORY: { code: SalaryComponentCode; formula: SalaryFormula; value: number }[] = [
  { code: "PF_EMPLOYEE", formula: "FIXED", value: 0 },
  { code: "PF_EMPLOYER", formula: "FIXED", value: 0 },
  { code: "ESI_EMPLOYEE", formula: "FIXED", value: 0 },
  { code: "ESI_EMPLOYER", formula: "FIXED", value: 0 },
  { code: "PT", formula: "FIXED", value: 0 },
  { code: "TDS", formula: "FIXED", value: 0 },
];
const STRUCTURES = {
  teaching: { name: "Teaching and office staff", components: [{ code: "BASIC" as SalaryComponentCode, formula: "FIXED" as SalaryFormula, value: 0 }, { code: "HRA" as SalaryComponentCode, formula: "PERCENT_OF_BASIC" as SalaryFormula, value: 2400 }, { code: "DA" as SalaryComponentCode, formula: "PERCENT_OF_BASIC" as SalaryFormula, value: 1000 }, { code: "CONVEYANCE" as SalaryComponentCode, formula: "FIXED" as SalaryFormula, value: 1_600_00 }, ...STATUTORY] },
  support: { name: "Support staff", components: [{ code: "BASIC" as SalaryComponentCode, formula: "FIXED" as SalaryFormula, value: 0 }, { code: "DA" as SalaryComponentCode, formula: "PERCENT_OF_BASIC" as SalaryFormula, value: 1500 }, { code: "HRA" as SalaryComponentCode, formula: "PERCENT_OF_BASIC" as SalaryFormula, value: 1000 }, { code: "CONVEYANCE" as SalaryComponentCode, formula: "FIXED" as SalaryFormula, value: 800_00 }, ...STATUTORY] },
};
const SUPPORT = { email: `sunrise.support01@${DOMAIN}`, name: "Sakharam Shinde", designation: "Cleaner", phone: "+919822070101", joinedOnKey: "2026-08-01", basicPaise: 11_000_00 };
const UPI_PAID = new Set([`sunrise.driver01@${DOMAIN}`, `sunrise.warden@${DOMAIN}`]);
const UPI_IDS: Record<string, string> = { [`sunrise.driver01@${DOMAIN}`]: "ramesh.gaikwad@okhdfcbank", [`sunrise.warden@${DOMAIN}`]: "prakash.more@ybl" };

/** A month's basic for each member of staff, by what they do. */
function basicFor(role: string, email: string | null): number {
  if (role === "PRINCIPAL") return 92_000_00;
  if (role === "ADMIN") return 38_000_00;
  if (role === "TEACHER") {
    const form = /\.teacher(\d)@/.exec(email ?? "");
    if (form) return 46_000_00 + Number(form[1]) * 1_500_00;
    if (/\.spare\d@/.test(email ?? "")) return 34_000_00;
    return 42_000_00;
  }
  if (role === "LIBRARIAN") return 26_000_00;
  if (role === "DRIVER") return 18_000_00;
  if (role === "WARDEN") return 21_000_00;
  if (role === "SUPPORT") return 11_000_00;
  return 20_000_00;
}

async function buildPayroll(ctx: Ctx, b: Item4bSchool, accounts: Item4bResult["accounts"]): Promise<Item4bResult["payroll"]> {
  const s = b.school.id;
  const admin = await staffActor(b, b.admin, "ADMIN");
  if (!(await db.payrollSettings.findUnique({ where: { schoolId: s }, select: { schoolId: true } }))) {
    await savePayrollSettings(admin, { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "Sunrise Education Trust", pfEstablishmentCode: "PUPUN0045821000", esiEmployerCode: "33000458210001001" });
  }
  const structureId = async (spec: (typeof STRUCTURES)["teaching"]) =>
    (await db.salaryStructure.findFirst({ where: { schoolId: s, name: spec.name }, select: { id: true } }))?.id ?? (await saveStructure(admin, { name: spec.name, components: spec.components.map((c) => ({ ...c, label: "" })) })).id;
  const teaching = await structureId(STRUCTURES.teaching);
  const support = await structureId(STRUCTURES.support);

  // The cleaner, added the way the office adds one (no login), then given the sign-in a first sign-in would give.
  let worker = await db.membership.findFirst({ where: { schoolId: s, role: "SUPPORT", user: { email: SUPPORT.email } }, select: { id: true, userId: true } });
  if (!worker) {
    const made = await addSupportStaff(admin, { name: SUPPORT.name, phone: SUPPORT.phone, designation: SUPPORT.designation, joinedOnKey: SUPPORT.joinedOnKey, salary: { structureId: support, basicPaise: SUPPORT.basicPaise, paymentMode: "CASH", effectiveFrom: SUPPORT.joinedOnKey } });
    const row = await db.membership.findUniqueOrThrow({ where: { id: made.membershipId }, select: { id: true, userId: true } });
    await db.user.update({ where: { id: row.userId }, data: { email: SUPPORT.email, passwordHash: ctx.passwordHash, emailVerifiedAt: new Date(), isTestFixture: true } });
    // The office completes the salary page: the UAN and the ESI number on the same revision, still paid in cash.
    await saveSalary(admin, { membershipId: row.id, structureId: support, effectiveFrom: SUPPORT.joinedOnKey, basicPaise: SUPPORT.basicPaise, overrides: {}, pfUan: "100945821099", esiNumber: "3300458299", pan: "", bankAccount: "", bankIfsc: "", bankName: "", upiId: "", paymentMode: "CASH" });
    worker = row;
  } else {
    await upsertUser(ctx, SUPPORT.email, SUPPORT.name);
  }
  accounts.push({ email: SUPPORT.email, name: SUPPORT.name, role: "Support staff (cleaner), paid in cash", look: "/account/payslips (the slip of last month, paid in cash), /account" });

  // A salary for every member of staff on the roll: bank for most, UPI for two, the cleaner's in cash above.
  const roll = await db.membership.findMany({ where: { schoolId: s, role: { in: ["ADMIN", "PRINCIPAL", "TEACHER", "DRIVER", "LIBRARIAN", "WARDEN", "SUPPORT"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, user: { select: { email: true, name: true } } }, orderBy: { joinedAt: "asc" } });
  let n = 0;
  for (const m of roll) {
    n += 1;
    if (await db.staffSalary.findFirst({ where: { membershipId: m.id }, select: { id: true } })) continue;
    const email = m.user.email;
    const onTeaching = m.role === "ADMIN" || m.role === "PRINCIPAL" || m.role === "TEACHER";
    const upi = email && UPI_PAID.has(email) ? UPI_IDS[email]! : "";
    await saveSalary(admin, {
      membershipId: m.id,
      structureId: onTeaching ? teaching : support,
      effectiveFrom: "2026-04-01",
      basicPaise: basicFor(m.role, email),
      overrides: {},
      pfUan: `1009458${pad(n, 5)}`,
      esiNumber: onTeaching ? "" : `33004582${pad(n)}`,
      pan: onTeaching ? `AAAP${(m.user.name.replace(/[^A-Za-z]/g, "")[0] ?? "X").toUpperCase()}${pad(n, 4)}K` : "",
      bankAccount: upi ? "" : `5010045821${pad(n, 4)}`,
      bankIfsc: upi ? "" : "HDFC0001234",
      bankName: upi ? "" : "HDFC Bank, Baner",
      upiId: upi,
      paymentMode: upi ? "UPI" : m.role === "SUPPORT" ? "CASH" : "BANK",
    });
  }

  const today = todayKey(TZ);
  const thisMonth = today.slice(0, 7);
  const lastMonth = previousMonth(thisMonth);
  const paidOn = `${thisMonth}-01`;

  // Last month: drafted, locked, shared with the head, its files cut, every slip recorded paid.
  let last = await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: s, month: lastMonth } }, select: { id: true, status: true } });
  if (!last || last.status === "DRAFT") {
    await draftRun(admin, lastMonth);
    await lockRun(admin, lastMonth);
    await shareRun(admin, lastMonth, true);
    last = await db.payrollRun.findUniqueOrThrow({ where: { schoolId_month: { schoolId: s, month: lastMonth } }, select: { id: true, status: true } });
  }
  if (!(await db.payrollExport.findFirst({ where: { runId: last.id }, select: { id: true } }))) {
    for (const kind of ["PF_ECR", "BANK_ADVICE", "UPI_ADVICE"] as const) await payrollExport(admin, lastMonth, kind);
  }
  if (last.status === "LOCKED") {
    const slips = await db.payslip.findMany({ where: { runId: last.id }, select: { id: true, membershipId: true, staffName: true, netPaise: true, paymentMode: true } });
    const refs = slipRefsOf(lastMonth, slips);
    const paid = new Set((await db.salaryPayment.findMany({ where: { runId: last.id, voidedAt: null }, select: { payslipId: true } })).map((p) => p.payslipId));
    const due = slips.filter((x) => x.netPaise > 0 && !paid.has(x.id)).sort((a, z) => refs.get(a.membershipId)!.localeCompare(refs.get(z.membershipId)!));
    const digits = lastMonth.replace("-", "");
    const bank = due.filter((x) => x.paymentMode === "BANK");
    if (bank.length) {
      const answer = await recordPaymentLines(admin, lastMonth, bank.map((x, i) => ({ line: i + 1, slipRef: refs.get(x.membershipId)!, reference: `HDFCN${digits}${pad(Number(refs.get(x.membershipId)!.slice(-3)), 5)}`, dateKey: paidOn, amountPaise: x.netPaise })), "bank-batch");
      if (!answer.accepted) throw new Error(`the bank slips were refused: ${JSON.stringify(answer.lines.filter((l) => l.outcome === "REFUSED"))}`);
    }
    for (const x of due.filter((y) => y.paymentMode !== "BANK")) {
      const seq = Number(refs.get(x.membershipId)!.slice(-3));
      if (x.paymentMode === "UPI") await recordSalaryPayment(admin, lastMonth, x.membershipId, { mode: "UPI", amountPaise: x.netPaise, paidOn, reference: `6${digits.slice(2)}${pad(seq, 7)}`, note: "Paid from the school's UPI app." }, "upi-app");
      else if (x.paymentMode === "CASH") await recordSalaryPayment(admin, lastMonth, x.membershipId, { mode: "CASH", amountPaise: x.netPaise, paidOn, reference: "", note: "Paid in cash at the office; signed for in the cash book." });
      else await recordSalaryPayment(admin, lastMonth, x.membershipId, { mode: "CHEQUE", amountPaise: x.netPaise, paidOn, reference: `40${pad(seq, 4)}`, note: "" });
    }
  }

  // An advance the office handed over, recovered from this month; and one teacher's ask waiting.
  const [games] = [b.subjectTeachers[1]!];
  if (!(await db.staffAdvance.findFirst({ where: { schoolId: s, membershipId: games.membership.id }, select: { id: true } }))) {
    await recordAdvance(admin, { membershipId: games.membership.id, amountPaise: 10_000_00, monthlyRecoveryPaise: 2_500_00, reason: "Medical expenses; recovered over four months." });
  }
  const asker = b.formTeachers[1]!;
  if (!(await db.staffAdvance.findFirst({ where: { schoolId: s, membershipId: asker.membership.id }, select: { id: true } }))) {
    await askAdvance(await staffActor(b, asker, "TEACHER"), { amountPaise: 5_000_00, reason: "School fees for my daughter, due this month." });
  }

  // This month: a draft, drawn once.
  if (!(await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: s, month: thisMonth } }, select: { id: true } }))) await draftRun(admin, thisMonth);

  const [lastRow, thisRow, salaries, payments] = await Promise.all([
    db.payrollRun.findUniqueOrThrow({ where: { schoolId_month: { schoolId: s, month: lastMonth } }, select: { status: true } }),
    db.payrollRun.findUniqueOrThrow({ where: { schoolId_month: { schoolId: s, month: thisMonth } }, select: { status: true } }),
    db.staffSalary.count({ where: { schoolId: s } }),
    db.salaryPayment.count({ where: { schoolId: s, voidedAt: null } }),
  ]);
  return { lastMonth, lastStatus: lastRow.status, thisMonth, thisStatus: thisRow.status, salaries, payments, supportMembershipId: worker.id };
}

/* -------------------------------------------------------------------------- */
/* the website                                                                 */
/* -------------------------------------------------------------------------- */

const SITE_POST_TITLE = "Science exhibition 2026: the robotics corner";
const SIX_PAGES: SitePage[] = ["HOME", "ABOUT", "ACADEMICS", "ADMISSIONS", "GALLERY", "CONTACT"];
const SITE_DOMAIN = "www.sunrisepublicschool.test";
const PROSPECTUS = "sunrise-prospectus-2027-28.pdf";
const ENQUIRY_NAME = "Swati Kulkarni";

/** Two configs the same for this builder's purpose: the consent stamps, which the save writes itself, left out. */
function canonical(config: Partial<SiteConfig>): string {
  return JSON.stringify(config, (k, v) => (k === "consentByUserId" || k === "consentAt" ? undefined : v));
}

async function buildWebsite(b: Item4bSchool): Promise<Item4bResult["website"]> {
  const s = b.school.id;
  const admin = await staffActor(b, b.admin, "ADMIN");

  // A post the site may carry (school-wide, approved, for everyone) with a picture: the news item, the hero and the gallery.
  let post = await db.post.findFirst({ where: { schoolId: s, title: SITE_POST_TITLE, scope: "SCHOOL" }, select: { id: true, media: true } });
  if (!post) {
    const stored = await storeFile(new File([new Uint8Array(fixturePng(960, 540))], "sunrise-exhibition.png", { type: "image/png" }));
    post = await db.post.create({
      data: { schoolId: s, authorUserId: b.admin.user.id, authorMembershipId: b.admin.membership.id, scope: "SCHOOL", title: SITE_POST_TITLE, body: "Grades 6 to 10 showed forty working models at this year's exhibition. The grade 8 line-follower climbed the ramp on its first try in front of the parents.", tags: JSON.stringify(["science", "exhibition", "robotics"]), media: JSON.stringify([{ fileId: stored.fileId, kind: "image", alt: "Placeholder picture for the exhibition's robotics corner" }]), category: "EVENTS", audience: "ALL", status: "APPROVED", reviewedAt: new Date(), reviewedByMembershipId: b.admin.membership.id },
      select: { id: true, media: true },
    });
  }
  const postFileId = (JSON.parse(post.media) as { fileId: string }[])[0]!.fileId;

  // The teachers' photos: placeholder pictures uploaded for the site, each with the teacher's name as its words.
  const teachers = [...b.formTeachers.map((t, i) => ({ t, line: `class teacher of Grade ${b.classes[i]!.grade}` })), ...b.subjectTeachers.map((t, i) => ({ t, line: i === 0 ? "English" : "Art and physical education" }))];
  const photos: { fileId: string; alt: string }[] = [];
  for (const [i, { t, line }] of teachers.entries()) {
    const name = `sunrise-teacher-${pad(i + 1)}.png`;
    let row = await db.schoolSiteFile.findFirst({ where: { schoolId: s, name }, select: { fileId: true } });
    if (!row) {
      const made = await uploadSiteFile(admin, new File([new Uint8Array(fixturePng(400 + i, 400 + i))], name, { type: "image/png" }), "IMAGE");
      if (!made.ok) throw new Error(`the teacher's photo was refused: ${made.errorKey}`);
      row = { fileId: made.file.fileId };
    }
    photos.push({ fileId: row.fileId, alt: `${t.user.name}, ${line}` });
  }
  let prospectus = await db.schoolSiteFile.findFirst({ where: { schoolId: s, name: PROSPECTUS }, select: { fileId: true } });
  if (!prospectus) {
    const made = await uploadSiteFile(admin, new File([fixturePdf()], PROSPECTUS, { type: "application/pdf" }), "PDF");
    if (!made.ok) throw new Error(`the prospectus was refused: ${made.errorKey}`);
    prospectus = { fileId: made.file.fileId };
  }

  const row = await db.school.findUniqueOrThrow({ where: { id: s }, select: { slug: true, locale: true, profileAbout: true, addressLine: true, city: true, region: true, postalCode: true, contactEmail: true, contactPhone: true, board: true, affiliationNumber: true, kind: true, medium: true, timezone: true } });
  const today = todayKey(row.timezone);
  const picture = (alt: string) => ({ fileId: postFileId, postId: post.id, alt, consent: true });
  const base = defaultSiteConfig(row);
  const want: Partial<SiteConfig> = {
    template: "CLASSIC",
    colour: "#0f766e",
    accent: "#b45309",
    language: "en",
    offerOtherLanguages: true,
    motto: "Curious minds, kind hearts",
    about: `${row.profileAbout.trim() || base.about}\n\nSunrise was founded in 1998 by a group of Baner parents and teachers. It is a co-educational day school of about three hundred pupils, one section a grade, with small classes and a teacher who knows every child by name.`,
    address: base.address,
    phones: row.contactPhone ? [row.contactPhone] : [],
    email: base.email,
    hours: "Monday to Friday, 8:00 to 3:30; Saturday, 8:00 to 12:30",
    mapUrl: "https://www.openstreetmap.org/#map=16/18.5590/73.7868",
    foundedYear: 1998,
    medium: "English",
    principalMessage: "Every child at Sunrise is known by name. We ask our pupils to be curious, to be kind, and to finish what they start; the rest follows.",
    principalNamed: false,
    sections: SITE_SECTIONS.map((code) => ({ code, on: !["FACULTY", "DISCLOSURE", "ACHIEVEMENTS", "FACILITIES"].includes(code) })),
    pages: SITE_PAGES.map((code) => ({ code, on: SIX_PAGES.includes(code), title: code === "GALLERY" ? "Our teachers and our days" : "", lead: code === "ADMISSIONS" ? "Admissions for 2027–28 open in January." : "", seoTitle: "", seoDescription: "" })),
    admissionsText: "Grades 5 and 6 take a short entrance test in January; other grades are admitted on the previous school's report and a conversation with the head. Ask below and the office will write back within two working days.",
    enquiryForm: true,
    enquiryFields: ["GRADE", "EMAIL", "VISIT"],
    newsPostIds: [post.id],
    gallery: [{ postId: post.id, fileId: postFileId, consent: true }],
    heroStyle: "PICTURE",
    heroPicture: picture("Placeholder picture: the exhibition's robotics corner"),
    announcement: { text: "Admissions for 2027–28 open in January", from: today, to: addDaysToKey(today, 60) },
    social: { facebook: "", instagram: "", youtube: "", whatsapp: "" },
    academicsText: "CBSE for grades 5 to 10, in English. Science is taught in the lab from grade 6, and the robotics club meets on Wednesdays. Hindi from grade 5; Marathi as an activity.",
    academicsSubjects: true,
    prospectusFileId: prospectus.fileId,
    albums: [{ id: "our-teachers", title: "Our teachers", pictures: photos.map((p) => ({ fileId: p.fileId, postId: null, alt: p.alt, consent: true })) }],
    facilities: [],
    achievements: [],
    downloads: [],
    customPages: [],
  };
  const stored = await db.schoolSite.findUnique({ where: { schoolId: s }, select: { configJson: true } });
  const current = stored ? (JSON.parse(stored.configJson) as Partial<SiteConfig>) : {};
  const changed = Object.keys(want).some((k) => canonical({ [k]: (want as Record<string, unknown>)[k] }) !== canonical({ [k]: (current as Record<string, unknown>)[k] }));
  if (changed) {
    const saved = await saveSite(admin, want);
    if (!saved.ok) throw new Error(`the site's draft was refused on ${saved.field}: ${saved.errorKey}`);
  }
  let live = await db.schoolSiteVersion.findFirst({ where: { schoolId: s, liveAt: { not: null } }, select: { id: true } });
  if (changed || !live) {
    await publishSite(admin);
    live = await db.schoolSiteVersion.findFirst({ where: { schoolId: s, liveAt: { not: null } }, select: { id: true } });
  }

  // One open review link (the token is shown only when made), the domain waiting for its DNS, three days of visits, one enquiry.
  let shareUrl: string | null = null;
  if ((await siteShares(admin)).length === 0) shareUrl = (await createSiteShare(admin, 7)).url;
  await saveSiteDomain(admin, SITE_DOMAIN);
  for (let i = 1; i <= 3; i++) {
    const dateKey = addDaysToKey(today, -i);
    for (const [page, count] of [["home", 18 + i * 3], ["admissions", 6 + i], ["about", 3 + i]] as const) {
      await db.schoolSiteVisit.upsert({ where: { schoolId_dateKey_page: { schoolId: s, dateKey, page } }, create: { schoolId: s, dateKey, page, count }, update: { count } });
    }
  }
  if (!(await db.schoolSiteEnquiry.findFirst({ where: { schoolId: s, name: ENQUIRY_NAME }, select: { id: true } }))) {
    await db.schoolSiteEnquiry.create({ data: { schoolId: s, name: ENQUIRY_NAME, contact: "+91 98220 77011", email: `swati.kulkarni.enquiry@${DOMAIN}`, grade: "Grade 5", wantsVisit: true, message: "We are moving to Baner in March. Is there a seat in grade 5 for 2027–28, and when is the entrance test?", locale: "en", status: "NEW" } });
  }
  const version = live ? await db.schoolSiteVersion.findUnique({ where: { id: live.id }, select: { pagesHtml: true } }) : null;
  const pages = version ? ["home", ...Object.keys(JSON.parse(version.pagesHtml) as Record<string, unknown>).filter((p) => !p.includes("/"))] : [];
  return { pages: [...new Set(pages)], live: Boolean(live), shareUrl, domain: SITE_DOMAIN, versionId: live?.id ?? null };
}

/* -------------------------------------------------------------------------- */
/* alumni                                                                      */
/* -------------------------------------------------------------------------- */

const ALUMNI = [
  { n: 1, name: "Neha Kulkarni", left: 2018, born: "2002-03-14", city: "Bengaluru", occupation: "Software engineer", pref: "EMAIL" as const, post: { title: "From the robotics room to writing software", body: "I built my first line-follower in the Sunrise lab in grade 8. Eight years on I write software for payments. If a grade 10 pupil wants to talk about engineering, the office knows how to reach me." } },
  { n: 2, name: "Rohan Deshpande", left: 2019, born: "2003-07-22", city: "Pune", occupation: "Resident doctor", pref: "OFFICE" as const, post: { title: "Medicine after Sunrise: start with biology you enjoy", body: "Grade 9 biology with the microscope is where it began for me. Medicine is long; do it because you like the subject, not for the entrance test." } },
  { n: 3, name: "Aditi Joshi", left: 2021, born: "2005-01-09", city: "Ahmedabad", occupation: "Design student", pref: "OFFICE" as const, post: { title: "Thank you to the art room", body: "The art room's Saturday hours got me into design school. Thank you to everyone who kept the room open." } },
  { n: 4, name: "Kunal Patil", left: 2023, born: "2007-05-30", city: "Pune", occupation: "Engineering student", pref: "NONE" as const, post: { title: "Two years at engineering college", body: "Mathematics in grade 10 felt hard; first-year engineering mathematics felt easier because of it. Keep the practice going." } },
  { n: 5, name: "Sana Sheikh", left: 2024, born: "2008-02-11", city: "Delhi", occupation: "Economics student", pref: "EMAIL" as const, post: { title: "Debating club, still", body: "I still debate, now at university. The Sunrise club taught me to listen first. Happy to judge a round when I am home for Diwali." } },
];
const PUPIL49_POST = { title: "Hello from Nagpur", body: "My new school has a robotics club too. I miss the grade 8 line-follower team. All the best for the exhibition!" };
const NOTE_TITLE = "Annual day on 18 December: alumni welcome";

async function buildAlumni(ctx: Ctx, b: Item4bSchool, accounts: Item4bResult["accounts"]): Promise<Item4bResult["alumni"]> {
  const s = b.school.id;
  const admin = await staffActor(b, b.admin, "ADMIN");
  await setAlumniFeedMode(admin, "POST");
  const emails: string[] = [];
  let mentor = "";
  for (const a of ALUMNI) {
    const email = `sunrise.alumni${pad(a.n)}@${DOMAIN}`;
    emails.push(email);
    const user = await upsertUser(ctx, email, a.name, { birthdate: new Date(`${a.born}T00:00:00Z`), isMinor: false });
    const leftAt = new Date(`${a.left}-04-30T06:30:00Z`);
    if (!(await db.membership.findUnique({ where: { userId_schoolId_role: { userId: user.id, schoolId: s, role: "STUDENT" } }, select: { id: true } }))) {
      await db.membership.create({ data: { userId: user.id, schoolId: s, role: "STUDENT", status: "ACTIVE", joinedAt: new Date(`${a.left - 6}-06-15T04:00:00Z`), leftAt, gradeLevel: "10" } });
    }
    await openAlumnus(db as unknown as Parameters<typeof openAlumnus>[0], user.id, s, leftAt);
    const alumnus = await db.membership.findUniqueOrThrow({ where: { userId_schoolId_role: { userId: user.id, schoolId: s, role: "ALUMNUS" } }, select: { id: true } });
    // The directory entry is the alumnus's own act.
    const profile = await db.alumniProfile.findUnique({ where: { membershipId: alumnus.id }, select: { listed: true } });
    if (!profile?.listed) await joinAlumniDirectory(await actor(user.id, s, "ALUMNUS", alumnus.id), { city: a.city, occupation: a.occupation, contactPref: a.pref });
    if (a.n === 1) {
      await setAlumnusMentor(admin, alumnus.id, true);
      mentor = email;
    }
    if (!(await db.post.findFirst({ where: { schoolId: s, authorUserId: user.id, title: a.post.title }, select: { id: true } }))) {
      await db.post.create({ data: { schoolId: s, authorUserId: user.id, authorMembershipId: alumnus.id, scope: "SCHOOL", category: "PEOPLE", title: a.post.title, body: a.post.body, tags: "[]", media: "[]", status: "APPROVED", reviewedAt: new Date(), reviewedByMembershipId: b.admin.membership.id, createdAt: new Date(Date.now() - (6 - a.n) * 86_400_000) } });
    }
    accounts.push({ email, name: a.name, role: `Alumnus (left grade 10 in ${a.left}), listed${a.n === 1 ? ", mentor" : ""}`, look: "/alumni, /alumni/directory, /alumni/staff, /bulletin" });
  }

  // The leaver of August, a minor: a post and a room with his grade-8 teacher; never listed (a minor cannot be).
  const p49 = await db.membership.findFirst({ where: { schoolId: s, role: "ALUMNUS", user: { email: `sunrise.pupil49@${DOMAIN}` } }, select: { id: true, userId: true } });
  if (p49) {
    if (!(await db.post.findFirst({ where: { schoolId: s, authorUserId: p49.userId, title: PUPIL49_POST.title }, select: { id: true } }))) {
      await db.post.create({ data: { schoolId: s, authorUserId: p49.userId, authorMembershipId: p49.id, scope: "SCHOOL", category: "PEOPLE", title: PUPIL49_POST.title, body: PUPIL49_POST.body, tags: "[]", media: "[]", status: "APPROVED", reviewedAt: new Date(), reviewedByMembershipId: b.admin.membership.id } });
    }
    const teacher = b.classes.find((c) => c.grade === "8")!.teacher;
    const pairKey = `${s}:${[p49.userId, teacher.user.id].sort().join(":")}`;
    if (!(await db.conversation.findUnique({ where: { pairKey }, select: { id: true } }))) {
      const sent = new Date(Date.now() - 3 * 86_400_000);
      const replied = new Date(sent.getTime() + 4 * 3_600_000);
      await db.conversation.create({
        data: {
          schoolId: s, pairKey, createdById: p49.userId, lastMessageAt: replied,
          participants: { create: [{ schoolId: s, userId: p49.userId, lastReadAt: replied }, { schoolId: s, userId: teacher.user.id, lastReadAt: replied }] },
          messages: { create: [{ schoolId: s, authorUserId: p49.userId, body: "Namaste sir! Could you send the robotics club's wiring notes? The club here is starting the same robot.", createdAt: sent }, { schoolId: s, authorUserId: teacher.user.id, body: "Of course, Ayaan. I will send them through the office by Friday. Good luck in Nagpur!", createdAt: replied }] },
        },
      });
    }
  }
  if (!(await db.alumniNote.findFirst({ where: { schoolId: s, title: NOTE_TITLE }, select: { id: true } }))) {
    await sendAlumniNote(admin, { batchYear: null, title: NOTE_TITLE, body: "The annual day is on Thursday 18 December at 5 pm. Alumni are welcome from 4.30; write to the office if you would like to help with the science corner." });
  }
  const [listed, posts] = await Promise.all([
    db.alumniProfile.count({ where: { schoolId: s, listed: true } }),
    db.post.count({ where: { schoolId: s, authorMembershipId: { in: (await db.membership.findMany({ where: { schoolId: s, role: "ALUMNUS" }, select: { id: true } })).map((m) => m.id) } } }),
  ]);
  return { emails, listed, mentor, posts };
}

/* -------------------------------------------------------------------------- */
/* the review rounds                                                           */
/* -------------------------------------------------------------------------- */

async function buildReviews(b: Item4bSchool): Promise<Item4bResult["reviews"]> {
  const s = b.school.id;
  const head = await staffActor(b, b.principal, "PRINCIPAL");
  const today = todayKey(TZ);
  const teacherIds = [...b.formTeachers, ...b.subjectTeachers].map((t) => t.membership.id);
  const score = (a: number, t: number) => Object.fromEntries(REVIEW_QUESTIONS.map((q, qi) => [q, 3 + ((a * 5 + t * 3 + qi) % 3)]));
  const round = async (audience: "PARENTS" | "STUDENTS", closesIn: number, respondents: { userId: string; role: "PARENT" | "STUDENT"; membershipId: string | null }[], close: boolean) => {
    const found = await db.reviewRound.findFirst({ where: { schoolId: s, createdByMembershipId: b.principal.membership.id, audience }, select: { id: true } });
    if (found) return found.id;
    const opened = await openReviewRound(head, { teacherMembershipIds: teacherIds, audience, closesDateKey: addDaysToKey(today, closesIn) });
    if (!opened.ok || !opened.roundId) throw new Error(`the ${audience} round was refused: ${opened.ok ? "no id" : opened.errorKey}`);
    for (const [ai, r] of respondents.entries()) {
      const who = await actor(r.userId, r.role === "PARENT" ? null : s, r.role, r.membershipId);
      // Each answers for the teachers who teach their child or them; the rest are refused by the rule and skipped.
      for (const [ti, teacherMembershipId] of teacherIds.entries()) await submitReview(who, { roundId: opened.roundId, teacherMembershipId, scores: score(ai, ti) });
    }
    if (close) await closeReviewRound(head, opened.roundId);
    return opened.roundId;
  };
  const parents = b.pupils.filter((p) => ["7", "8", "9", "10"].includes(p.grade) && p.parentUserId).map((p) => ({ userId: p.parentUserId!, role: "PARENT" as const, membershipId: null }));
  const pupils = b.pupils.filter((p) => ["9", "10"].includes(p.grade) && p.seat < 4).map((p) => ({ userId: p.userId, role: "STUDENT" as const, membershipId: p.membershipId }));
  const closedRoundId = await round("PARENTS", 7, parents, true);
  const openRoundId = await round("STUDENTS", 14, pupils, false);
  const [closedResponses, openResponses] = await Promise.all([db.reviewResponse.count({ where: { roundId: closedRoundId } }), db.reviewResponse.count({ where: { roundId: openRoundId } })]);
  return { closedRoundId, openRoundId, closedResponses, openResponses };
}

/* -------------------------------------------------------------------------- */
/* online payments, in test mode                                               */
/* -------------------------------------------------------------------------- */

async function buildOnlinePayments(b: Item4bSchool): Promise<Item4bResult["fees"]> {
  const s = b.school.id;
  const admin = await staffActor(b, b.admin, "ADMIN");
  // The school's own gateway keys in TEST mode. FEES_GATEWAY_TRANSPORT is unset here, so the devbox transport mints the
  // orders and settles them through the webhook's own door: no gateway account anywhere is called.
  const gateway = await db.feeGatewayAccount.findUnique({ where: { schoolId: s }, select: { keyId: true, mode: true } });
  if (!gateway) await saveGatewayAccount(admin, { keyId: "rzp_test_SunriseDemo2026", secret: randomBytes(18).toString("hex"), webhookSecret: randomBytes(18).toString("hex"), mode: "TEST" });
  const school = await db.school.findUniqueOrThrow({ where: { id: s }, select: { feeUpiId: true, feeReceiptPrefix: true, feeBankNote: true } });
  if (!school.feeUpiId) await saveFeeSettings(admin, { upiId: "sunrisepublicschool@hdfcbank", upiPayee: "Sunrise Public School", receiptPrefix: school.feeReceiptPrefix, bankNote: school.feeBankNote });

  const plan: { label: string; grade: string; seat: number; method: "ONLINE" | "UPI"; end: "PAID" | "FAILED" | "CLAIMED" | "CONFIRMED" }[] = [
    { label: "Online, paid", grade: "9", seat: 2, method: "ONLINE", end: "PAID" },
    { label: "Online, failed at the bank", grade: "10", seat: 3, method: "ONLINE", end: "FAILED" },
    { label: "UPI, claim waiting for the office", grade: "5", seat: 2, method: "UPI", end: "CLAIMED" },
    { label: "UPI, claim confirmed by the office", grade: "8", seat: 3, method: "UPI", end: "CONFIRMED" },
  ];
  const out: Item4bResult["fees"]["payments"] = [];
  for (const [i, p] of plan.entries()) {
    const pupil = b.pupils.find((x) => x.grade === p.grade && x.seat === p.seat && x.parentUserId);
    if (!pupil) continue;
    const parentEmail = (await db.user.findUniqueOrThrow({ where: { id: pupil.parentUserId! }, select: { email: true } })).email ?? "";
    let payment = await db.feePayment.findFirst({ where: { schoolId: s, studentMembershipId: pupil.membershipId, method: p.method, payerUserId: pupil.parentUserId }, select: { id: true, status: true } });
    if (!payment) {
      const demand = await db.feeDemand.findFirst({ where: { schoolId: s, studentMembershipId: pupil.membershipId, status: { in: ["OPEN", "PART"] } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], select: { id: true } });
      if (!demand) continue;
      const parent = await actor(pupil.parentUserId!, null, "PARENT", null);
      if (p.method === "ONLINE") {
        const started = await startOnlineCheckout(parent, { studentMembershipId: pupil.membershipId, demandIds: [demand.id] });
        if (p.end === "PAID") await settleOnlinePayment(s, { orderId: started.orderId, gatewayPaymentId: `pay_devbox${Date.now()}${i}`, amountPaise: started.amountPaise, gatewayMethod: "upi" });
        else await failOnlinePayment(s, started.orderId, "devbox: declined by the bank (test mode)");
        payment = { id: started.paymentId, status: "" };
      } else {
        const started = await startUpiPayment(parent, { studentMembershipId: pupil.membershipId, demandIds: [demand.id] });
        await claimUpiPayment(parent, { paymentId: started.paymentId, utr: `62${todayKey(TZ).replace(/-/g, "").slice(2)}${pad(i + 1, 4)}` });
        if (p.end === "CONFIRMED") await confirmClaim(admin, started.paymentId);
        payment = { id: started.paymentId, status: "" };
      }
    }
    const now = await db.feePayment.findUniqueOrThrow({ where: { id: payment.id }, select: { status: true } });
    out.push({ label: p.label, pupil: pupil.name, parent: parentEmail, status: now.status, paymentId: payment.id });
  }
  const account = await db.feeGatewayAccount.findUniqueOrThrow({ where: { schoolId: s }, select: { keyId: true, mode: true } });
  return { gateway: `${account.keyId} (${account.mode})`, payments: out };
}

/* -------------------------------------------------------------------------- */
/* the one entry point, and what the roster says                               */
/* -------------------------------------------------------------------------- */

/** Builds item 4b's modules at Sunrise; idempotent. The accounts it made are returned for the roster's staff table. */
export async function buildSunriseItem4b(ctx: Ctx, b: Item4bSchool): Promise<Item4bResult> {
  const accounts: Item4bResult["accounts"] = [];
  try {
    const inventory = await buildInventory(b);
    const payroll = await buildPayroll(ctx, b, accounts);
    const website = await buildWebsite(b);
    const alumni = await buildAlumni(ctx, b, accounts);
    const reviews = await buildReviews(b);
    const fees = await buildOnlinePayments(b);
    lastResult = { inventory, payroll, website, alumni, reviews, fees, accounts };
    return lastResult;
  } finally {
    if (sessionIds.length) await db.session.deleteMany({ where: { id: { in: sessionIds.splice(0) } } });
  }
}

/** The roster's section for item 4b's modules (it replaces the old "Not seeded" line). */
export function item4bRosterSection(): string {
  const r = lastResult;
  if (!r) return "Not seeded: a review round and online payments (the Sunrise modules builder did not run).";
  return `## Sunrise's other modules (inventory, payroll, website, alumni, reviews, online payments)

| Module | What is there | Where |
|---|---|---|
| Inventory | ${r.inventory.items} items in six categories, two vendors, ${r.inventory.purchases} purchase records with their scanned bills, ${r.inventory.issues} issues (chalk to every form teacher, the games kit to the PE teacher, robotics kits and beakers from the lab, booklets to the exam desk, cleaner to housekeeping), ${r.inventory.assets} tagged assets (projectors in grades 9 and 10, the office laptop), a half-term stock count at the main store, one waiting ask from the grade-7 teacher | /admin/inventory, /admin/inventory/items, /admin/inventory/purchases, /admin/inventory/movements, /admin/inventory/assets, /admin/inventory/requests; /account/items as a teacher |
| Payroll | Settings, a teaching and a support structure, ${r.payroll.salaries} salaries (bank for most, UPI for the driver and the warden, cash for the cleaner); ${r.payroll.lastMonth} ${r.payroll.lastStatus} with ${r.payroll.payments} recorded payments (bank batch with UTRs, UPI with UTRs, cash), shared with the head, PF, bank and UPI files cut; ${r.payroll.thisMonth} ${r.payroll.thisStatus}; a recorded advance (the PE teacher) and a waiting ask (the grade-6 teacher) | /admin/payroll, /admin/payroll/runs/${r.payroll.lastMonth}, /admin/payroll/runs/${r.payroll.thisMonth}, /admin/payroll/salaries, /admin/payroll/advances; /account/payslips as any member of staff |
| Website | Published, ${r.website.pages.length} pages (${r.website.pages.join(", ")}); a school post with a picture as news and hero, the teachers' photos as an album (placeholder pictures, consent ticked), a prospectus PDF, one open review link (shown once when made), three days of visits, one new enquiry; ${r.website.domain} waiting for its DNS (PENDING_DNS) | /admin/website, /admin/website/publish, /admin/website/domain, /admin/website/review; /sites/${"sunrise-public-school"} as the admin or the head; http://sunrise-public-school.localhost:3000/ in development |
| Alumni | The feed open to alumni posts; ${r.alumni.emails.length} adult alumni each listed in the directory, ${r.alumni.mentor.split("@")[0]} a mentor; ${r.alumni.posts} alumni posts; sunrise.pupil49 (a minor, not listed) with a room with his grade-8 teacher; a note from the office | /admin/alumni; /alumni, /alumni/directory as an alumnus |
| Reviews | A parents' round answered (${r.reviews.closedResponses} answers) and closed by the head; a pupils' round open (${r.reviews.openResponses} answers so far, grades 9 and 10) | /admin/reviews; /reviews as a grade 5–10 pupil |
| Online fees (TEST mode) | The school's gateway ${r.fees.gateway} on the devbox transport (no account anywhere is called) and its UPI id; ${r.fees.payments.map((p) => `${p.label.toLowerCase()} (${p.pupil}, ${p.parent.split("@")[0]}: ${p.status})`).join("; ")} | /admin/fees/settings, /admin/fees/claims, /admin/fees; /parent/fees as each parent; /dev/payments as the operator |

A school has no faculty profiles (they are a college's), so the teachers' photos are an album on the Gallery page, not the Faculty page.`;
}
// end owner-batch-item4b
