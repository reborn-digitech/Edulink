/**
 * The API leg of the sweep: every endpoint in the catalog, as every role and
 * signed out, asserting the status alone — the same shape as the page sweep.
 *
 *   npm run api:sweep                       against NEXT_PUBLIC_APP_URL (default :3000)
 *   npm run api:sweep -- --only=/shared/joins   only the endpoints whose path contains the text:
 *                                               a check of one change, not the sweep's count
 *   npm run api:sweep -- --chunk=2/6        the second of six consecutive slices of the catalog, in catalog order
 *                                           (16 Oct 2026): the whole catalog is two and a half hours on `next dev`,
 *                                           and a server that stops answering ends a run; run zz:fixtures before each
 *   npm run api:sweep -- --features=on      with every platform feature switched on for the run, as the ZZ
 *                                           operator, and back off at its end (audited both ways); add
 *                                           --plans=on to make the three plans active the same way (402 swept)
 *   npm run api:sweep -- --variants=off     the per-role walk alone, without the role variants (owner-batch-item13, below)
 *   npm run api:sweep -- --clean-since=<ISO> [--clean-until=<ISO>]
 *                                               no sweep: take away what a run that never reached its own
 *                                               clean-up wrote to the ZZ fixture schools in that window (W-13)
 *
 * Sessions are minted on ZZ Northgate exactly as the page sweep mints its
 * own, sent as bearer tokens (not cookies — the point is the phone's door),
 * and deleted at the end. A GET is expected to answer 200 for a permitted
 * role and 403 for the rest; a POST/DELETE with an empty body answers the
 * catalog's emptyBodyStatus (422 for a body it validates) for a permitted
 * role and 403 for the rest; signed out is 401 for anything not open to
 * anyone. An endpoint with a path parameter and no sample is skipped and
 * listed, so the gap is visible rather than silent.
 *
 * MODULES AND COLLEGES (SWEEPS-4 and W-17, 4 Oct 2026). A door whose module
 * the actor's school has off answers 403 MODULE_OFF for every role, and that
 * is what is expected there; a college's door (one filed in the college's
 * catalog files) at a school may answer 403 MODULE_OFF, the one answer a
 * college-only door gives a school. Every call is timed, and the slowest
 * twenty doors are printed at the end (SWEEPS-3).
 *
 * FEATURES AND PLANS (16 Oct 2026, scripts/sweep-features.ts). Before the walk the run reads the platform's feature
 * switches, the plans the operator has made active and each actor's entitlements. A door whose catalog `feature` is
 * off answers 404 FEATURE_OFF to every role token, before any other refusal (role-gate.ts rule 3), and that is the
 * expected answer, counted as a pass; a door whose feature is on but needs a plan the actor's role must hold, while
 * that plan is active and the actor holds no entitlement, answers 402 PLAN_REQUIRED (a `planFree` door asks the switch
 * alone). Signed out, a door is 401 as before — the gate reads a session — except an `anyone` door of a feature, whose
 * handler answers 404 FEATURE_OFF itself while the switch is off. `--features=on` switches every feature that is off
 * on for the run as the ZZ operator, through the operator's door (audited), and back off at the end, in a `finally`
 * and on a signal; `--plans=on` does the same for the plans' active switches, so the 402 path can be swept.
 *
 * BY DESIGN, NOT BY A LIST (G4-2, decided 5 Oct 2026: keep 404 and MODULE_OFF): the module gate's answer is
 * judged from the door's own `module` (published as `x-module`) against the actor's school's modules, and a
 * college's door at a school from the catalog file it is filed in (`COLLEGE_DOORS`, published as `x-college`),
 * so a new door is classified where it is catalogued and no path or count is kept here; a 404 for another
 * tenant's sample is what a GET's `[200, 404]` already allows. Path prefixes are not used: the college's doors
 * share them with the school's (`/library/eresources` is a college's, `/library/titles` a school's).
 *
 * ROLE VARIANTS (owner-batch-item13, 1 Nov 2026). Beside the walk as one person per role, every door that declares a
 * `reach` (the relation its handler requires: catalog types.ts REACHES) or a duty is walked as the role's VARIANTS —
 * a timetable-only teacher, a co-teacher and another class's teacher, a second admin without the head's pages, the
 * guardian of another child, a classmate and a pupil of another class, a support worker, another expert and one under
 * review, another school's office, another college teacher (scripts/sweep-sessions.ts SWEEP_VARIANTS). What each must
 * meet is the reach's pair (REACH_PAIRS): one the reach lets through answers what the role's own actor answered for
 * the same call; one it refuses answers 403 or 404; one without the door's duty meets the gate's 403. A variant
 * answered otherwise is reported as a finding (`✗ VARIANT …`), with the door, the variant, expected and got; a
 * refused variant whose empty body was refused by the parser first (422), with no valid body to send, is counted as
 * not reaching the fence rather than as a pass. `--variants=off` runs the old walk alone.
 */
import { createHash, randomBytes } from "node:crypto";
import { fixturePng } from "./png";
import { Prisma, PrismaClient } from "@prisma/client";
import { ENDPOINTS, type Endpoint, type SweepFixture } from "../src/lib/api-catalog";
import { declaredStatus, doorForKind, featuresOf, permits, reachRefusalFor } from "../src/lib/api-catalog/types";
import { COLLEGE_DOORS } from "./college-doors";
import { dutiesForRole, isCollegeKind, isDutyRole, parseDuties } from "@edulink/contracts";
import { ROLES, type Role } from "../src/lib/constants";
import { parseTeachingDays } from "../src/lib/dates";
import { HOLIDAY_KIND_META, type HolidayKind } from "../src/lib/holiday-kinds";
import { restoreSweepThrowaways, SWEEP_APPRAISAL, SWEEP_DOOR_IDS } from "./sweep-doors";
import { inOwnWindow } from "./sweep-window";
import { crossPlan, FIXTURE_ID, PLATFORM_WIDE } from "./cross-sampler";
import { PLACEMENT_FIXTURE } from "../src/lib/api-catalog/placement-fixture";
import { keepSessionsAlive, purgeSessionsOnSignal, SWEEP_VARIANTS, sweepSessionExpiry, variantCalls, variantCallCount, type SweepVariant, type VariantCall, type VariantId } from "./sweep-sessions";
import { describeGateState, doorGate, gateFlags, readGateState, runSwitches, type GateState } from "./sweep-features";
import { healthAnswers, RETRY_PAUSE_MS, RETRY_TIMEOUT_MS, retryOnceIfHealthy } from "./sweep-retry";
import { isLiveRun, liveRunSkip } from "./sweep-live-run";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const minted: string[] = [];
const results: { endpoint: string; role: string; expected: number | number[] | string; got: number; ok: boolean }[] = [];
const skipped: string[] = [];

/**
 * TWO HOURS, RENEWED WHILE THE RUN LIVES (A3-S-15, 5 Oct 2026; was 24 hours, W-13). The catalog is some 16,000
 * calls, two to four hours on `next dev`, and a one-hour session expired mid-run; a day-long one outlived a run
 * stopped by hand. Now each session lasts two hours, `keepSessionsAlive` renews the run's own every twenty
 * minutes, a signal deletes them (`purgeSessionsOnSignal`), and the `finally` at the end deletes them as before
 * (scripts/sweep-sessions.ts).
 */

/** Each actor's person, for the plans: whether they hold an entitlement (sweep-features.ts). Filled by `mint`. */
const userOf: Partial<Record<Role, string>> = {};
/** The switches, the active plans and the actors' entitlements, read after the actors are minted (main, crossProbe). */
let gate: GateState = { on: new Set(), activePlans: new Set(), entitled: new Map() };
/** How many calls were judged by the feature gate (404 FEATURE_OFF) and by the plans (402 PLAN_REQUIRED). */
const gated = { FEATURE_OFF: 0, PLAN_REQUIRED: 0 };

/**
 * The answer the feature gate gives this caller at this door before anything else, or null when it lets them by.
 * A role token meets the session's gate (role-gate.ts rule 3); signed out, only an `anyone` door of a feature answers
 * for the feature (its handler asks the switch), every other door being the session's 401 first.
 */
function featureAnswer(e: Endpoint, role: Role | null): { status: 404 | 402; code: "FEATURE_OFF" | "PLAN_REQUIRED" } | null {
  if (role === null && e.access !== "anyone") return null;
  return featureAnswerFor(e, role, role ? (userOf[role] ?? null) : null);
}
/** The same for a person (a role variant's: their own entitlements decide a plan; owner-batch-item13). */
function featureAnswerFor(e: Endpoint, role: Role | null, userId: string | null): { status: 404 | 402; code: "FEATURE_OFF" | "PLAN_REQUIRED" } | null {
  const g = doorGate(e, { role, userId }, gate);
  if (g.state === "off") return { status: 404, code: "FEATURE_OFF" };
  if (g.state === "plan") return { status: 402, code: "PLAN_REQUIRED" };
  return null;
}

/** Where each actor stands: its school's modules and whether that school is a college (a guardian: the children's schools). Filled by `actors()`. */
type Tenant = { schoolId: string | null; modules: Set<string>; college: boolean; kind: string | null };
const tenantOf: Partial<Record<Role, Tenant>> = {};
/** Each actor's duties (5 Oct 2026): a FACULTY's or HOD's from their membership, the ADMIN's office duties (owner-batch-item9), [] for the rest — a door naming `duties` expects 403 without one. */
const dutiesOf: Partial<Record<Role, string[]>> = {};
/** permits() as this actor: the role, and the duties the sweep's actor of that role holds. */
const actorPermits = (e: Endpoint, role: Role): boolean => permits(e, role, dutiesOf[role] ?? []);
async function tenantAt(schoolId: string): Promise<Tenant> {
  const [school, rows] = await Promise.all([db.school.findUnique({ where: { id: schoolId }, select: { kind: true } }), db.schoolModule.findMany({ where: { schoolId }, select: { module: true } })]);
  return { schoolId, modules: new Set(rows.map((r) => r.module)), college: isCollegeKind(school?.kind ?? "SCHOOL"), kind: school?.kind ?? "SCHOOL" };
}
async function familyTenant(parentUserId: string): Promise<Tenant> {
  const children = await db.guardianship.findMany({ where: { parentUserId, status: "ACTIVE" }, select: { studentSchoolId: true } });
  const ids = [...new Set(children.map((c) => c.studentSchoolId))];
  const [schools, rows] = await Promise.all([db.school.findMany({ where: { id: { in: ids } }, select: { kind: true } }), db.schoolModule.findMany({ where: { schoolId: { in: ids } }, select: { module: true } })]);
  return { schoolId: null, modules: new Set(rows.map((r) => r.module)), college: schools.some((s) => isCollegeKind(s.kind)), kind: null };
}

// The college's catalog files (scripts/college-doors.ts): a door filed there is a college's, which a school answers 403 MODULE_OFF (W-17).

/**
 * Whether a permitted role's answer may, or must, be the module gate's 403 MODULE_OFF (SWEEPS-4):
 * "must" where the actor's school has the door's module off (the gate answers before the handler);
 * "may" for a college's door at a school, and for a guardian, whose session names no school and whose
 * answer is the handler's for the child's school; "no" otherwise.
 */
function moduleOff(e: Endpoint, role: Role): "must" | "may" | "no" {
  return moduleOffAt(e, tenantOf[role]);
}
/** The same, for a tenant (a role variant's school: owner-batch-item13). */
function moduleOffAt(e: Endpoint, t: Tenant | undefined): "must" | "may" | "no" {
  if (!t) return "no";
  if (e.module && !t.modules.has(e.module)) return t.schoolId ? "must" : "may";
  if (!t.college && COLLEGE_DOORS.has(e)) return "may";
  return "no";
}

/**
 * A door for other kinds of institution at the actor's school (owner-batch-item5, `kinds`): the gate answers 404
 * NOT_FOUND to every role, after the feature and before anything else (role-gate.ts rule 4). A guardian's session
 * names no school, so its handler decides and the ordinary expectation holds.
 */
function kindGone(e: Endpoint, role: Role): boolean {
  return kindGoneAt(e, tenantOf[role]);
}
function kindGoneAt(e: Endpoint, t: Tenant | undefined): boolean {
  return Boolean(e.kinds && t?.schoolId && t.kind && !doorForKind(e, t.kind));
}
/** How many calls were judged by the kind gate (404 at another kind of institution). */
let kindGated = 0;

/** One call's answer: the status, the refusal's code (the x-edulink-code header, or the envelope's on a 403), and how long it took. */
type Answer = { status: number; code: string | null; ms: number };
/** Every call's time, for the slowest doors at the end (SWEEPS-3). */
const timings: { door: string; ms: number }[] = [];

/** Whether `got` is what `want` allows, with the module gate's answer where `off` says. */
function judge(want: number | number[], off: "must" | "may" | "no", got: Answer): boolean {
  const isModuleOff = got.status === 403 && got.code === "MODULE_OFF";
  if (off === "must") return isModuleOff;
  return (Array.isArray(want) ? want.includes(got.status) : want === got.status) || (off === "may" && isModuleOff);
}
const wanted = (want: number | number[], off: "must" | "may" | "no"): number | number[] | string => (off === "must" ? "403 MODULE_OFF" : off === "may" ? `${JSON.stringify(want)} or 403 MODULE_OFF` : want);

async function mint(userId: string, role: Role, schoolId: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const s = await db.session.create({
    data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: schoolId, activeRole: role, userAgent: "api-sweep", expiresAt: sweepSessionExpiry() },
  });
  minted.push(s.id);
  userOf[role] = userId;
  return token;
}

/** Ids from ZZ Northgate for endpoints with a parameter; null where the fixture lacks the thing. */
/**
 * A lesson today whose teacher is away today, and someone in who is free
 * for it. zz:fixtures marks one ZZ teacher absent today and covers one of
 * their lessons; the sweep's assign then repeats that cover (a no-op) and
 * its clear takes it off, which the fixture restore puts back.
 */
async function substitutionFixture(s: string): Promise<{ substitutionSlotId: string | null; substituteMembershipId: string | null }> {
  const today = new Date().toISOString().slice(0, 10);
  const cover = await db.substitution.findFirst({ where: { schoolId: s, dateKey: today }, select: { slotId: true, substituteMembershipId: true }, orderBy: { createdAt: "asc" } });
  return { substitutionSlotId: cover?.slotId ?? null, substituteMembershipId: cover?.substituteMembershipId ?? null };
}

/** The ZZ report cards: a published Term 1 set and a draft set, and the school's rules read back as a body. */
async function reportCardFixture(s: string): Promise<{ reportCardId: string | null; draftReportCardId: string | null; reportCardTitle: string | null; reportCardConfig: Record<string, unknown> | null }> {
  const [published, draft, school] = await Promise.all([
    db.reportCard.findFirst({ where: { schoolId: s, status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, select: { id: true, title: true } }),
    db.reportCard.findFirst({ where: { schoolId: s, status: "DRAFT" }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    db.school.findUnique({ where: { id: s }, select: { reportCardConfig: true } }),
  ]);
  let config: Record<string, unknown> | null = null;
  try {
    config = school?.reportCardConfig ? (JSON.parse(school.reportCardConfig) as Record<string, unknown>) : null;
  } catch {
    config = null;
  }
  return { reportCardId: published?.id ?? null, draftReportCardId: draft?.id ?? null, reportCardTitle: published?.title ?? null, reportCardConfig: config };
}

/** A 32 by 16 PNG: what the sweep sets a signature and a seal with, so the two doors are tried with a picture they take. */
const SWEEP_PNG = `data:image/png;base64,${fixturePng(32, 16).toString("base64")}`;

/** The ZZ certificates: an active template (and its body to send back), a retired one, an issued certificate, one still to revoke, and a printed code. */
async function certificateFixture(s: string): Promise<{ certificateTemplateId: string | null; certificateTemplate: Record<string, unknown> | null; retiredTemplateId: string | null; certificateId: string | null; revocableCertificateId: string | null; certificateCode: string | null; cancelledCertificateRequestId: string | null; declinedCertificateRequestId: string | null; penNumber: string | null; penChangeId: string | null; penChangeToPen: string | null; recordChangeId: string | null; paperSignatureId: string | null; teacherPaperSignatureId: string | null; otherPupilSignatureId: string | null; signaturePng: string | null; gigContributionId: string | null; gigWithdrawnContributionId: string | null; gigBookingId: string | null; gigUnheldBookingId: string | null; gigSlotId: string | null; gigPaymentId: string | null; gigPaidPayoutId: string | null; gigInvoiceId: string | null; gigExpertUserId: string | null }> {
  const [active, retired, issued, revocable] = await Promise.all([
    db.certificateTemplate.findFirst({ where: { schoolId: s, active: true, kind: "BONAFIDE" }, orderBy: { createdAt: "asc" } }),
    db.certificateTemplate.findFirst({ where: { schoolId: s, active: false }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    db.issuedCertificate.findFirst({ where: { schoolId: s, revokedAt: null }, orderBy: { issuedAt: "asc" }, select: { id: true, code: true } }),
    db.issuedCertificate.findFirst({ where: { schoolId: s, revokedAt: null, kind: "STUDY" }, orderBy: { issuedAt: "desc" }, select: { id: true } }),
  ]);
  let body: Record<string, unknown> | null = null;
  if (active) {
    try {
      body = { kind: active.kind, name: active.name, locale: active.locale, title: active.title, intro: active.intro, rows: JSON.parse(active.rowsJson), outro: active.outro, layout: JSON.parse(active.layoutJson), serialPrefix: active.serialPrefix, active: true };
    } catch {
      body = null;
    }
  }
  const [cancelled, declined] = await Promise.all([
    db.certificateRequest.findFirst({ where: { schoolId: s, status: "CANCELLED" }, select: { id: true } }),
    db.certificateRequest.findFirst({ where: { schoolId: s, status: "DECLINED" }, select: { id: true } }),
  ]);
  const pen = await db.user.findFirst({ where: { penNumber: { not: null }, memberships: { some: { schoolId: s, role: "STUDENT", status: "ACTIVE" } } }, select: { penNumber: true } });
  // A pending request first; otherwise the newest settled one, which every write answers as it stands — so the sweep stays repeatable after its own rejection.
  const penChange = (await db.penChangeRequest.findFirst({ where: { schoolId: s, status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true, toPen: true } })) ?? (await db.penChangeRequest.findFirst({ where: { schoolId: s }, orderBy: { createdAt: "desc" }, select: { id: true, toPen: true } }));
  // The fixture's settled ask, by id (zz-fixtures.ts `buildRecordChanges`): deciding it and taking it back are both answered as it stands.
  const recordChange = await db.recordChangeRequest.findFirst({ where: { schoolId: s, id: { in: ["zz-fixture-record-change", "zz-fixture-record-change-southbank"] }, status: { not: "PENDING" } }, select: { id: true } });
  // The fixture's settled signature (zz-fixtures.ts `buildSignatures`), whose decision is answered as it stands.
  // A teacher's questions for the bank (zz-fixtures.ts `buildGigQuestions`): the one that waits, and one its author took back.
  const gigs = await db.questionContribution.findMany({ where: { authorSchoolId: s, stem: { startsWith: "ZZ " }, status: { in: ["SUBMITTED", "WITHDRAWN"] } }, orderBy: { id: "asc" }, select: { id: true, status: true } });
  const gig = (status: string) => gigs.find((g) => g.status === status)?.id ?? null;
  // Sessions (zz-fixtures.ts `buildGigSessions`): pupil 01's confirmed seat where the school has one, else the school's first; and the seat their family said was not held.
  const gigSeats = await db.gigBooking.findMany({ where: { schoolId: s, slot: { title: { startsWith: "ZZ " } }, status: { in: ["CONFIRMED", "UNHELD"] } }, orderBy: { id: "asc" }, select: { id: true, slotId: true, status: true, student: { select: { user: { select: { email: true } } } } } });
  const gigSeat = gigSeats.find((b) => b.status === "CONFIRMED" && b.student.user.email === "zz.pupil01@zz.test") ?? gigSeats.find((b) => b.status === "CONFIRMED") ?? null;
  const gigUnheld = gigSeats.find((b) => b.status === "UNHELD") ?? null;
  // A paid seat's payment on hold, paid by the sweep's parent (zz-fixtures.ts `buildGigSessions`).
  const gigPayment = await db.sessionPayment.findFirst({ where: { status: "HELD", payer: { email: "zz.parent01@zz.test" }, booking: { schoolId: s } }, orderBy: { id: "asc" }, select: { id: true } });
  // The ZZ expert's PAID payout with its tax invoice (zz-fixtures.ts `buildGigSessions`): recording it again is refused, the invoice PDF is read.
  const gigExpert = await db.user.findUnique({ where: { email: "zz.expert1@zz.test" }, select: { id: true } });
  const gigPaidPayout = gigExpert ? await db.expertPayout.findFirst({ where: { expertUserId: gigExpert.id, status: "PAID" }, orderBy: { id: "asc" }, select: { id: true, invoice: { select: { id: true } } } }) : null;
  // Two settled lines, because no one line serves both doors (CI runs 41415675038 and 41432347740, 2 November 2026):
  // the family's GET shared/signatures/{signatureId} wants a line on ONE pupil's paper, the certificate's, so the
  // other guardian and the classmate are refused at ownChild (a report card set is the whole class's, which they
  // are in); the decide door wants a line its teacher reads back, and since item 14 a teacher reads only their own
  // line on a card set of a class they hold (signatures.ts mine()), where the office and the head read any. So the
  // first is the settled line with the lowest id, the admin's certificate line on a fresh database, and the second
  // the fixture's SIGNED teacher line on the report card set (zz-fixtures.ts buildSignatures), null where none is.
  const paperSignature = await db.paperSignature.findFirst({ where: { schoolId: s, status: { not: "PENDING" }, slot: { in: ["LEFT", "RIGHT"] } }, orderBy: { id: "asc" }, select: { id: true } });
  const teacherPaperSignature = await db.paperSignature.findFirst({ where: { schoolId: s, status: { not: "PENDING" }, slot: { in: ["LEFT", "RIGHT"] }, role: "TEACHER", paperKind: "REPORT_CARD_SET" }, orderBy: { id: "asc" }, select: { id: true } });
  // A signed line on another pupil's certificate (zz-fixtures.ts `buildSignatures`): what the sweep's pupil and parent must be refused.
  const otherPupilSignature = await db.paperSignature.findFirst({ where: { schoolId: s, paperKind: "CERTIFICATE", status: "SIGNED", slot: "LEFT", paperId: { in: (await db.issuedCertificate.findMany({ where: { schoolId: s, student: { user: { email: { not: "zz.pupil01@zz.test" } } } }, select: { id: true } })).map((c) => c.id) } }, orderBy: { id: "asc" }, select: { id: true } });
  return { certificateTemplateId: active?.id ?? null, certificateTemplate: body, retiredTemplateId: retired?.id ?? null, certificateId: issued?.id ?? null, revocableCertificateId: revocable?.id ?? null, certificateCode: issued?.code ?? null, cancelledCertificateRequestId: cancelled?.id ?? null, declinedCertificateRequestId: declined?.id ?? null, penNumber: pen?.penNumber ?? null, penChangeId: penChange?.id ?? null, penChangeToPen: penChange?.toPen ?? null, recordChangeId: recordChange?.id ?? null, paperSignatureId: paperSignature?.id ?? null, teacherPaperSignatureId: teacherPaperSignature?.id ?? null, otherPupilSignatureId: otherPupilSignature?.id ?? null, signaturePng: SWEEP_PNG, gigContributionId: gig("SUBMITTED"), gigWithdrawnContributionId: gig("WITHDRAWN"), gigBookingId: gigSeat?.id ?? null, gigUnheldBookingId: gigUnheld?.id ?? null, gigSlotId: gigSeat?.slotId ?? null, gigPaymentId: gigPayment?.id ?? null, gigPaidPayoutId: gigPaidPayout?.id ?? null, gigInvoiceId: gigPaidPayout?.invoice?.id ?? null, gigExpertUserId: gigExpert?.id ?? null };
}

/** The ZZ admissions: the open cycle and its body, the closed one, the sweep parent's application (the same guardian `actors()` picks) and one in each settled state. */
async function admissionFixture(s: string): Promise<Pick<SweepFixture, "admissionCycleId" | "admissionCycle" | "closedCycleId" | "admissionGrade" | "admissionSlotId" | "cancelledSlotId" | "applicationId" | "offeredApplicationId" | "acceptedApplicationId" | "admittedApplicationId" | "waitlistedApplicationId" | "withdrawnApplicationId">> {
  const [open, closed, cancelled, guardian] = await Promise.all([
    db.admissionCycle.findFirst({ where: { schoolId: s, status: "OPEN" }, orderBy: { createdAt: "asc" } }),
    db.admissionCycle.findFirst({ where: { schoolId: s, status: "CLOSED" }, orderBy: { createdAt: "asc" }, select: { id: true } }),
    db.entranceSlot.findFirst({ where: { schoolId: s, cancelledAt: { not: null } }, select: { id: true } }),
    db.guardianship.findFirst({ where: { studentSchoolId: s, status: "ACTIVE" }, select: { parentUserId: true } }),
  ]);
  let body: Record<string, unknown> | null = null;
  let grade: string | null = null;
  if (open) {
    try {
      const grades = JSON.parse(open.gradesJson) as { grade: string; seats: number }[];
      grade = grades[0]?.grade ?? null;
      body = { academicYearId: open.academicYearId, name: open.name, grades, documents: JSON.parse(open.documentsJson), testRequired: open.testRequired, notice: open.notice, feeStructureId: open.feeStructureId, opensAt: open.opensAt?.toISOString().slice(0, 10) ?? null, closesAt: open.closesAt?.toISOString().slice(0, 10) ?? null };
    } catch {
      body = null;
    }
  }
  // The SUBMITTED one must carry documents: the verify step refuses an empty folder, rightly.
  const mine = (status: string) => (open && guardian ? db.application.findFirst({ where: { cycleId: open.id, applicantUserId: guardian.parentUserId, status, ...(status === "SUBMITTED" ? { documentsJson: { not: "[]" } } : {}) }, orderBy: { number: "asc" }, select: { id: true, testSlotId: true } }) : Promise.resolve(null));
  const [submitted, offered, accepted, admitted, waitlisted, withdrawn] = await Promise.all([mine("SUBMITTED"), mine("OFFERED"), mine("ACCEPTED"), mine("ADMITTED"), mine("WAITLISTED"), mine("WITHDRAWN")]);
  return { admissionCycleId: open?.id ?? null, admissionCycle: body, closedCycleId: closed?.id ?? null, admissionGrade: grade, admissionSlotId: submitted?.testSlotId ?? null, cancelledSlotId: cancelled?.id ?? null, applicationId: submitted?.id ?? null, offeredApplicationId: offered?.id ?? null, acceptedApplicationId: accepted?.id ?? null, admittedApplicationId: admitted?.id ?? null, waitlistedApplicationId: waitlisted?.id ?? null, withdrawnApplicationId: withdrawn?.id ?? null };
}

/**
 * The doors that used to be skipped for want of a sample. scripts/sweep-doors.ts builds their rows
 * (zz:fixtures) and puts the throwaways back (main, before the walk); this reads their ids, each only
 * when the row is there and in the state its door needs, so a fixture not yet built is a skip rather
 * than a 404 that passes. One write here: a session minted for the office actor alone, so the
 * sign-out door signs out something real (200) and is a 404 to everyone whose session it is not.
 */
type DoorFields = "mySessionId" | "revokedInviteId" | "publishedExamSeriesId" | "archivedExamSeriesId" | "closedEnquiryId" | "mentorThreadId" | "competitionEntryId" | "appraisalId" | "appraisal" | "goneAppraisalId" | "gonePlanTemplateId" | "goneAbsenceNoteId" | "goneExpertSlotId" | "familyReportCardId" | "expertCalendarToken" | "periodId" | "period" | "archivedFeeStructureId" | "revokedConcessionId" | "familyPaymentId" | "quietBroadcastId" | "expertProfileId" | "notContentTeamUserId" | "globalPostId" | "bankTopicId" | "bankQuestionId" | "fileId";
async function doorFixture(s: string, applicationId: string | null): Promise<Pick<SweepFixture, DoorFields>> {
  const ids = SWEEP_DOOR_IDS;
  const has = async (q: Promise<{ id: string } | null>) => (await q)?.id ?? null;
  const office = await db.membership.findFirst({ where: { schoolId: s, role: "ADMIN", status: "ACTIVE", user: { email: "zz.admin@zz.test" } }, select: { userId: true } });
  let mySessionId: string | null = null;
  if (office) {
    const spare = await db.session.create({ data: { userId: office.userId, tokenHash: createHash("sha256").update(randomBytes(32)).digest("hex"), activeSchoolId: s, activeRole: "ADMIN", userAgent: "api-sweep (to sign out)", expiresAt: sweepSessionExpiry() } });
    minted.push(spare.id);
    mySessionId = spare.id;
  }
  const pupil01 = await db.membership.findFirst({ where: { schoolId: s, role: "STUDENT", user: { email: "zz.pupil01@zz.test" } }, select: { id: true } });
  const parent01 = await db.user.findUnique({ where: { email: "zz.parent01@zz.test" }, select: { id: true } });
  const competition = await db.competition.findFirst({ where: { id: ids.competition, status: "PUBLISHED", registrationClosesAt: { gt: new Date() } }, select: { id: true } });
  const entry = (studentEmail: string) => (competition ? db.competitionEntry.findFirst({ where: { competitionId: competition.id, schoolId: s, student: { user: { email: studentEmail } } }, select: { id: true } }) : Promise.resolve(null));
  const appraisal = await has(db.staffAppraisal.findFirst({ where: { id: ids.appraisal, schoolId: s }, select: { id: true } }));
  const period = await db.timetablePeriod.findFirst({ where: { schoolId: s, archivedAt: null }, orderBy: { position: "asc" }, select: { id: true, name: true, startMinute: true, endMinute: true, kind: true } });
  const expert = await db.expertProfile.findFirst({ where: { user: { email: "zz.expert1@zz.test" } }, select: { id: true, calendarToken: true } });
  // The first document of the sweep parent's sent application: the parent and the office may open it.
  let fileId: string | null = null;
  if (applicationId) {
    const app = await db.application.findUnique({ where: { id: applicationId }, select: { documentsJson: true } });
    try {
      fileId = (JSON.parse(app?.documentsJson ?? "[]") as { fileId?: string }[])[0]?.fileId ?? null;
    } catch {
      fileId = null;
    }
  }
  const myPayment = parent01 ? await db.feePayment.findFirst({ where: { schoolId: s, payerUserId: parent01.id }, orderBy: { createdAt: "asc" }, select: { id: true } }) : null;
  const question = await db.quizQuestion.findFirst({ orderBy: { id: "asc" }, select: { id: true, topicId: true } });
  return {
    mySessionId,
    revokedInviteId: await has(db.invite.findFirst({ where: { id: ids.revokedInvite, schoolId: s, status: "REVOKED" }, select: { id: true } })),
    publishedExamSeriesId: await has(db.examSeries.findFirst({ where: { schoolId: s, publishedAt: { not: null }, archivedAt: null }, orderBy: { createdAt: "asc" }, select: { id: true } })),
    archivedExamSeriesId: await has(db.examSeries.findFirst({ where: { id: ids.archivedExamSeries, schoolId: s, archivedAt: { not: null } }, select: { id: true } })),
    closedEnquiryId: await has(db.enquiry.findFirst({ where: { id: ids.closedEnquiry, schoolId: s, status: "CLOSED" }, select: { id: true } })),
    mentorThreadId: pupil01 ? await has(db.mentorThread.findFirst({ where: { schoolId: s, studentMembershipId: pupil01.id, status: "ACTIVE", expert: { user: { email: "zz.expert3@zz.test" } } }, select: { id: true } })) : null,
    competitionEntryId: await has(entry("zz.pupil01@zz.test")),
    appraisalId: appraisal,
    appraisal: appraisal ? { ...SWEEP_APPRAISAL } : null,
    goneAppraisalId: await has(db.staffAppraisal.findFirst({ where: { id: ids.goneAppraisal, schoolId: s }, select: { id: true } })),
    gonePlanTemplateId: await has(db.lessonPlanTemplate.findFirst({ where: { id: ids.gonePlanTemplate, schoolId: s }, select: { id: true } })),
    goneAbsenceNoteId: await has(db.absenceNote.findFirst({ where: { id: ids.goneAbsenceNote, schoolId: s }, select: { id: true } })),
    goneExpertSlotId: await has(db.expertSlot.findFirst({ where: { id: ids.goneExpertSlot, bookedAt: null }, select: { id: true } })),
    familyReportCardId: pupil01 ? await has(db.reportCard.findFirst({ where: { schoolId: s, studentMembershipId: pupil01.id, status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, select: { id: true } })) : null,
    expertCalendarToken: expert?.calendarToken ?? null,
    periodId: period?.id ?? null,
    period: period ? { name: period.name, startMinute: period.startMinute, endMinute: period.endMinute, kind: period.kind } : null,
    archivedFeeStructureId: await has(db.feeStructure.findFirst({ where: { id: ids.archivedFeeStructure, schoolId: s, archivedAt: { not: null } }, select: { id: true } })),
    revokedConcessionId: await has(db.feeConcession.findFirst({ where: { id: ids.revokedConcession, schoolId: s, revokedAt: { not: null } }, select: { id: true } })),
    familyPaymentId: myPayment?.id ?? (await has(db.feePayment.findFirst({ where: { schoolId: s, status: "PAID" }, select: { id: true } }))),
    quietBroadcastId: await has(db.broadcast.findFirst({ where: { schoolId: s, messages: { none: { status: { in: ["FAILED", "UNDELIVERED"] } } } }, orderBy: { createdAt: "asc" }, select: { id: true } })),
    expertProfileId: expert?.id ?? null,
    notContentTeamUserId: office?.userId ?? null,
    globalPostId: await has(db.post.findFirst({ where: { schoolId: s, scope: "GLOBAL", status: "APPROVED" }, orderBy: { createdAt: "asc" }, select: { id: true } })),
    bankTopicId: question?.topicId ?? null,
    bankQuestionId: question?.id ?? null,
    fileId,
  };
}

/**
 * The placement fixture at ZZ Vidya College (scripts/zz-placement.ts), the same for whichever school the fixture is
 * read: zz.cstudent02's consented, live application in the open drive and their membership (R-30). Null when
 * zz:fixtures has not built the placement rows.
 */
async function placementFixture(): Promise<Pick<SweepFixture, "placementApplicationId" | "placementApplicantMembershipId">> {
  const app = await db.driveApplication.findFirst({ where: { driveId: PLACEMENT_FIXTURE.openDrive, consentAt: { not: null }, withdrawnAt: null, student: { user: { email: "zz.cstudent02@zz.test" } } }, select: { id: true, studentMembershipId: true } });
  return { placementApplicationId: app?.id ?? null, placementApplicantMembershipId: app?.studentMembershipId ?? null };
}

async function fixture(slug = "zz-northgate-school"): Promise<SweepFixture> {
  const school = await db.school.findUniqueOrThrow({ where: { slug } });
  const s = school.id;
  const first = async <T extends { id: string }>(q: Promise<T | null>) => (await q)?.id ?? null;
  /**
   * This school's waiting fixture among the ids the builder gives (zz-fixtures.ts `waitingIds`), made new
   * first: a request lives thirty days, and a fixture built in August must still be waiting in October.
   * Null when the fixtures have not made it.
   */
  // An hour back, not now: a row "created" during the run is one the run's own clean-up takes away (sweepAway), and the
  // fixture's waiting join and claim went with every run until zz:fixtures made them again.
  const again = { status: "PENDING", createdAt: new Date(Date.now() - 3_600_000), decidedAt: null, declineReason: null };
  const waitingJoin = async (ids: string[]) => {
    await db.joinRequest.updateMany({ where: { id: { in: ids }, schoolId: s }, data: again });
    return first(db.joinRequest.findFirst({ where: { id: { in: ids }, schoolId: s }, select: { id: true } }));
  };
  const waitingClaim = async (ids: string[]) => {
    await db.guardianClaim.updateMany({ where: { id: { in: ids }, schoolId: s }, data: again });
    return first(db.guardianClaim.findFirst({ where: { id: { in: ids }, schoolId: s }, select: { id: true } }));
  };
  // The grade-3 class first: the exams, cards, records, syllabus and certificates fixtures all live there, and the teacher actor is its lead.
  const klass = (await db.class.findFirst({ where: { schoolId: s, archivedAt: null, gradeLevel: "3", enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } })) ?? (await db.class.findFirst({ where: { schoolId: s, archivedAt: null, enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } }));
  // Pupil 01 first, the child the STUDENT and PARENT actors are (see actors below): "the first active
  // enrolment" was heap order, pupil 01 on the laptop and another child on CI's fresh database, where the
  // pupil's own absence-note doors then answered the pupil 403 and the parent 404 (run 36842613891).
  const student = klass
    ? ((await db.enrollment.findFirst({ where: { classId: klass.id, status: "ACTIVE", student: { user: { email: "zz.pupil01@zz.test" } } }, select: { studentMembershipId: true } }))
      ?? (await db.enrollment.findFirst({ where: { classId: klass.id, status: "ACTIVE" }, orderBy: { id: "asc" }, select: { studentMembershipId: true } })))
    : null;
  const lead = klass ? await db.classTeacher.findFirst({ where: { classId: klass.id, role: "LEAD" }, select: { teacherMembershipId: true } }) : null;
  const admissions = await admissionFixture(s);
  return {
    schoolId: s,
    classId: klass?.id ?? null,
    studentMembershipId: student?.studentMembershipId ?? null,
    // R-61 Q2 (10 Oct 2026): the departed pupil of zz-fixtures.ts `buildDepartures`, for the settle-on-leaving doors.
    departedMembershipId: await first(db.membership.findFirst({ where: { schoolId: s, role: "STUDENT", leftAt: { not: null } }, orderBy: { leftAt: "desc" }, select: { id: true } })),
    teacherMembershipId: lead?.teacherMembershipId ?? null,
    // zz.admin first (owner-batch-item13: Northgate has a second admin, the variant without the head's pages), else the first by joining.
    adminMembershipId: (await first(db.membership.findFirst({ where: { schoolId: s, role: "ADMIN", status: "ACTIVE", user: { email: { in: ["zz.admin@zz.test", "zz.admin.b@zz.test"] } } }, select: { id: true } }))) ?? (await first(db.membership.findFirst({ where: { schoolId: s, role: "ADMIN", status: "ACTIVE" }, orderBy: { joinedAt: "asc" }, select: { id: true } }))),
    examSeriesId: await first(db.examSeries.findFirst({ where: { schoolId: s, archivedAt: null }, select: { id: true } })),
    examSlotId: await first(db.examSlot.findFirst({ where: { schoolId: s }, select: { id: true } })),
    assignmentId: await first(db.assignment.findFirst({ where: { schoolId: s }, select: { id: true } })),
    attendanceDeviceId: await first(db.attendanceDevice.findFirst({ where: { schoolId: s }, orderBy: { id: "asc" }, select: { id: true } })),
    postId: await first(db.post.findFirst({ where: { schoolId: s }, select: { id: true } })),
    heldCommentId: await first(db.comment.findFirst({ where: { schoolId: s, status: "PENDING" }, orderBy: { createdAt: "asc" }, select: { id: true } })),
    // The fixture's own two rows, by id (zz-fixtures.ts `buildWaiting`), made new first: a request
    // lives thirty days, and a fixture built in August must still be waiting in October.
    joinRequestId: await waitingJoin(["zz-fixture-join", "zz-fixture-join-southbank"]),
    guardianClaimId: await waitingClaim(["zz-fixture-claim", "zz-fixture-claim-southbank"]),
    otherClassJoinRequestId: await waitingJoin(["zz-fixture-join-other"]),
    otherFamilyClaimId: await waitingClaim(["zz-fixture-claim-other"]),
    conversationId: await first(db.conversation.findFirst({ where: { schoolId: s }, select: { id: true } })),
    remarkThreadId: await first(db.remarkThread.findFirst({ where: { schoolId: s }, select: { id: true } })),
    // One a pupil could actually enter today, so the sweep's POST proves the door and not a closed date: the
    // school's own (scripts/sweep-doors.ts; its dates move with each zz:fixtures), else a platform one still open.
    competitionId: (await first(db.competition.findFirst({ where: { id: SWEEP_DOOR_IDS.competition, organizerSchoolId: s, status: "PUBLISHED", registrationClosesAt: { gt: new Date() } }, select: { id: true } })))
      ?? (await first(db.competition.findFirst({ where: { status: "PUBLISHED", registrationClosesAt: { gt: new Date() }, organizerSchoolId: null }, select: { id: true } }))),
    // A CLOSED vacancy, the fixture's first (its own staff still read it, and the close door refuses it): never an open one, which the close door would take off the board.
    vacancyId: (await first(db.jobPosting.findFirst({ where: { id: SWEEP_DOOR_IDS.closedPosting, schoolId: s, status: "CLOSED" }, select: { id: true } }))) ?? (await first(db.jobPosting.findFirst({ where: { schoolId: s, status: "CLOSED" }, select: { id: true } }))),
    // The fixture's open admission enquiry, by id; another of the school's otherwise.
    enquiryId: (await first(db.enquiry.findFirst({ where: { id: SWEEP_DOOR_IDS.openEnquiry, schoolId: s, status: "OPEN" }, select: { id: true } }))) ?? (await first(db.enquiry.findFirst({ where: { schoolId: s }, select: { id: true } }))),
    meetingSlotId: await first(db.meetingSlot.findFirst({ where: { schoolId: s }, select: { id: true } })),
    inviteId: await first(db.invite.findFirst({ where: { schoolId: s }, select: { id: true } })),
    leaveRequestId: await first(db.leaveRequest.findFirst({ where: { schoolId: s }, select: { id: true } })),
    reviewRoundId: await first(db.reviewRound.findFirst({ where: { schoolId: s }, select: { id: true } })),
    academicYearId: await first(db.academicYear.findFirst({ where: { schoolId: s }, select: { id: true } })),
    termId: await first(db.term.findFirst({ where: { schoolId: s }, select: { id: true } })),
    notificationId: await first(db.notification.findFirst({ where: { schoolId: s }, select: { id: true } })),
    feeHeadId: await first(db.feeHead.findFirst({ where: { schoolId: s }, select: { id: true } })),
    feeStructureId: await first(db.feeStructure.findFirst({ where: { schoolId: s, publishedAt: { not: null }, archivedAt: null }, select: { id: true } })),
    // The fixture's counter payment first (CASH, PAID): no UPI claim, so the confirm door can never receipt it.
    feePaymentId: (await first(db.feePayment.findFirst({ where: { schoolId: s, status: "PAID", method: "CASH" }, orderBy: { createdAt: "asc" }, select: { id: true } }))) ?? (await first(db.feePayment.findFirst({ where: { schoolId: s, status: "PAID" }, select: { id: true } }))),
    feeReceiptId: await first(db.feeReceipt.findFirst({ where: { schoolId: s }, select: { id: true } })),
    broadcastId: await first(db.broadcast.findFirst({ where: { schoolId: s }, select: { id: true } })),
    // An OPEN one, so the sweep's note and close both have a door; zz:fixtures leaves one open on every run.
    // …and on a pupil of the sampled class, so its lead — the sweep's teacher — may add a note; the newest open incident is often one an earlier sweep opened on another class.
    incidentId: await first(db.incident.findFirst({ where: { schoolId: s, status: "OPEN", ...(klass ? { student: { enrollments: { some: { classId: klass.id, status: "ACTIVE" } } } } : {}) }, orderBy: { createdAt: "desc" }, select: { id: true } })),
    circularId: await first(db.post.findFirst({ where: { schoolId: s, requiresAck: true, status: "APPROVED" }, orderBy: { createdAt: "desc" }, select: { id: true } })),
    // The grade's MATHEMATICS unit and lesson, by name: the reach table (sweep-sessions.ts teachesSubject) counts on
    // the subject teacher, who takes English there, being refused, and the fixture writes an English unit at every
    // position and an English lesson last, so "first by position" and "newest" each land on English on a fresh
    // database (CI run 41376053419, 2 November 2026: two 200s where 403 was expected).
    syllabusUnitId: klass ? await first(db.syllabusUnit.findFirst({ where: { schoolId: s, subject: "Mathematics", gradeLevel: (await db.class.findUniqueOrThrow({ where: { id: klass.id }, select: { gradeLevel: true } })).gradeLevel ?? "" }, orderBy: { position: "asc" }, select: { id: true } })) : null,
    lessonPlanId: klass ? await first(db.lessonPlan.findFirst({ where: { classId: klass.id, subject: "Mathematics" }, orderBy: { createdAt: "desc" }, select: { id: true } })) : null,
    ...(await substitutionFixture(s)),
    // A cover the sweep's head was asked to take today (zz-fixtures.ts `buildHeadCover`; the grade-3 lead teaches every staffed period, so no honest cover names them), so the acknowledge door answers 200 for the PRINCIPAL and 404 for the others; null skips both doors.
    myCoverId: await first(db.substitution.findFirst({ where: { schoolId: s, dateKey: new Date().toISOString().slice(0, 10), substitute: { role: "PRINCIPAL", user: { email: "zz.principal@zz.test" } } }, select: { id: true } })),
    // The fixture's template (scripts/sweep-doors.ts), not the throwaway the DELETE takes away.
    planTemplateId: (await first(db.lessonPlanTemplate.findFirst({ where: { id: SWEEP_DOOR_IDS.planTemplate, schoolId: s }, select: { id: true } }))) ?? (await first(db.lessonPlanTemplate.findFirst({ where: { schoolId: s, id: { not: SWEEP_DOOR_IDS.gonePlanTemplate } }, orderBy: { createdAt: "asc" }, select: { id: true } }))),
    ...(await reportCardFixture(s)),
    ...(await certificateFixture(s)),
    ...admissions,
    // The file the link door opens is a document of the sweep parent's application.
    ...(await doorFixture(s, admissions.applicationId)),
    ...(await placementFixture()),
    // A finished generation run, never the live one (1 Nov 2026; scripts/sweep-live-run.ts guards the calls too).
    finishedQuizJobId: await first(db.quizGenJob.findFirst({ where: { active: null, state: { in: ["STOPPED", "FINISHED", "FAILED"] } }, orderBy: { createdAt: "desc" }, select: { id: true } })),
    todayKey: new Date().toISOString().slice(0, 10),
  };
}

async function actors(): Promise<Record<Role, string>> {
  const school = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" } });
  const byEmail = async (email: string) => (await db.user.findUniqueOrThrow({ where: { email }, select: { id: true } })).id;
  // The teacher is the LEAD of the class the fixture samples, so the class-scoped writes (incidents, lessons) are theirs to make; "the first teacher" depended on row order and broke when the fixtures were rebuilt.
  const sampledClass = (await db.class.findFirst({ where: { schoolId: school.id, archivedAt: null, gradeLevel: "3", enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } })) ?? (await db.class.findFirst({ where: { schoolId: school.id, archivedAt: null, enrollments: { some: { status: "ACTIVE" } } }, select: { id: true } }));
  const lead = sampledClass ? await db.classTeacher.findFirst({ where: { classId: sampledClass.id, role: "LEAD" }, select: { teacher: { select: { userId: true } } } }) : null;
  const teacher = lead ? { userId: lead.teacher.userId } : await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "TEACHER", status: "ACTIVE" }, select: { userId: true } });
  // The pupil and the guardian BY NAME: pupil 01 and their parent, whom the fixtures give the certificate
  // requests, the record and the remark thread the samples point at. "The first pupil" was whichever row the
  // database returned first, and the sweep's own writes move rows: each run signed in as a different child,
  // and the one after a rebuild was refused another pupil's certificate request with a 404 that was right.
  const pupil = (await db.membership.findFirst({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: "zz.pupil01@zz.test" } }, select: { id: true, userId: true } }))
    ?? (await db.membership.findFirstOrThrow({ where: { schoolId: school.id, role: "STUDENT", status: "ACTIVE" }, orderBy: { id: "asc" }, select: { id: true, userId: true } }));
  const guardian = (await db.guardianship.findFirst({ where: { studentMembershipId: pupil.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, orderBy: { id: "asc" }, select: { parentUserId: true } }))
    ?? (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: school.id, status: "ACTIVE" }, orderBy: { id: "asc" }, select: { parentUserId: true } }));
  // zz.expert1 by name, whose windows, sessions, calendar feed and closed enquiry the fixtures give the sweep; "the first ZZ expert" was row order.
  const expert = (await db.expertProfile.findFirst({ where: { user: { email: "zz.expert1@zz.test" } }, select: { userId: true } })) ?? (await db.expertProfile.findFirst({ where: { user: { email: { endsWith: "@zz.test" } } }, select: { userId: true } }));
  const northgate = await tenantAt(school.id);
  for (const role of ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"] as Role[]) tenantOf[role] = northgate;
  tenantOf.PARENT = await familyTenant(guardian.parentUserId);
  const out: Partial<Record<Role, string>> = {
    ADMIN: await mint(await byEmail("zz.admin@zz.test"), "ADMIN", school.id),
    PRINCIPAL: await mint(await byEmail("zz.principal@zz.test"), "PRINCIPAL", school.id),
    TEACHER: await mint(teacher.userId, "TEACHER", school.id),
    STUDENT: await mint(pupil.userId, "STUDENT", school.id),
    PARENT: await mint(guardian.parentUserId, "PARENT", null),
  };
  if (expert) out.EXPERT = await mint(expert.userId, "EXPERT", null);
  // The office's duties (owner-batch-item9): Northgate's admin holds the head's pages (zz-fixtures), so the head's doors expect 200.
  {
    const office = await db.membership.findFirst({ where: { schoolId: school.id, role: "ADMIN", status: "ACTIVE", leftAt: null, user: { email: "zz.admin@zz.test" } }, select: { dutiesJson: true } });
    const head = (await db.membership.count({ where: { schoolId: school.id, role: "PRINCIPAL", status: "ACTIVE", leftAt: null } })) > 0;
    dutiesOf.ADMIN = dutiesForRole("ADMIN", office?.dutiesJson, head);
  }
  // The module roles (3 Oct 2026), each at Northgate, which zz-fixtures gives every module: a driver, the library's desk, a warden and an alumnus.
  const moduleActors: [Role, string][] = [["DRIVER", "zz.driver01@zz.test"], ["LIBRARIAN", "zz.librarian@zz.test"], ["WARDEN", "zz.warden@zz.test"], ["ALUMNUS", "zz.alumni01@zz.test"]];
  for (const [role, email] of moduleActors) {
    const member = await db.membership.findFirst({ where: { schoolId: school.id, role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true } });
    if (member) out[role] = await mint(member.userId, role, school.id);
  }
  // The college's six staff roles (4 Oct 2026), each at ZZ Vidya College (zz-college.ts), which has every module on;
  // and the recruiter, an outside account with no school. A Northgate sample is another tenant's row to them: 404.
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  if (vidya) {
    const college = await tenantAt(vidya.id);
    for (const role of ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as Role[]) tenantOf[role] = college;
    const collegeActors: [Role, string][] = [["FACULTY", "zz.faculty01@zz.test"], ["HOD", "zz.hod01@zz.test"], ["EXAM_CONTROLLER", "zz.examctrl@zz.test"], ["IQAC", "zz.iqac@zz.test"], ["TPO", "zz.tpo@zz.test"], ["ACCOUNTS", "zz.accounts@zz.test"]];
    for (const [role, email] of collegeActors) {
      const member = await db.membership.findFirst({ where: { schoolId: vidya.id, role, status: "ACTIVE", leftAt: null, user: { email } }, select: { userId: true, dutiesJson: true } });
      if (member) out[role] = await mint(member.userId, role, vidya.id);
      if (member && isDutyRole(role)) dutiesOf[role] = parseDuties(member.dutiesJson);
    }
  }
  const recruiter = await db.recruiterProfile.findFirst({ where: { user: { email: "zz.recruiter01@zz.test" }, disabledAt: null }, select: { userId: true } });
  if (recruiter) out.RECRUITER = await mint(recruiter.userId, "RECRUITER", null);
  return out as Record<Role, string>;
}

/* owner-batch-item13 (1 Nov 2026): the role variants ------------------------------------------------------------ */

/** `--variants=off`: the per-role walk alone. */
const VARIANTS_OFF = process.argv.includes("--variants=off");
/** A minted variant: its token, person, school (modules, kind) and the duties it holds. */
type VariantActor = { variant: SweepVariant; token: string; userId: string; tenant: Tenant; duties: string[] };
const variantActors = new Map<VariantId, VariantActor>();
/** The answers the role's own actor got, by door, role and body ("empty" or "body"): what an allowed variant is held to. */
const baseAnswers = new Map<string, number>();
const baseKey = (e: Endpoint, role: Role, body: "empty" | "body") => `${e.method} ${e.path}|${role}|${body}`;
/** Every variant call: the door, the variant, the verdict its reach gives, what was expected and what came back. */
const variantResults: { door: string; variant: VariantId; role: Role; verdict: string; reach: string | null; body: boolean; expected: string; got: number; ok: boolean; unproved: boolean }[] = [];
/** The variants the fixtures do not hold (a person missing, or one holding a duty the table says they lack), each with why. */
const variantsMissing: string[] = [];

/**
 * One session per role variant (scripts/sweep-sessions.ts SWEEP_VARIANTS), minted as the role's own actors are and
 * deleted with them. A person the fixtures do not hold is reported and their calls left out; a variant meant to hold
 * no duty that holds one (the second admin given the head's pages by hand) is left out too, since every expectation
 * of the table would be wrong for them.
 */
async function mintVariants(): Promise<void> {
  const schools = new Map<string, { id: string; tenant: Tenant } | null>();
  const schoolOf = async (slug: string) => {
    if (!schools.has(slug)) {
      const row = await db.school.findUnique({ where: { slug }, select: { id: true } });
      schools.set(slug, row ? { id: row.id, tenant: await tenantAt(row.id) } : null);
    }
    return schools.get(slug)!;
  };
  for (const variant of SWEEP_VARIANTS) {
    const role = variant.role as Role;
    const at = variant.school ? await schoolOf(variant.school) : null;
    if (variant.school && !at) { variantsMissing.push(`${variant.id}: no ${variant.school}`); continue; }
    let userId: string | null = null;
    let duties: string[] = [];
    if (at) {
      const where = "email" in variant.person ? { user: { email: variant.person.email } } : { user: { name: variant.person.supportName, email: null } };
      const member = await db.membership.findFirst({ where: { schoolId: at.id, role, status: "ACTIVE", leftAt: null, ...where }, select: { userId: true, dutiesJson: true } });
      if (member) {
        userId = member.userId;
        const head = (await db.membership.count({ where: { schoolId: at.id, role: "PRINCIPAL", status: "ACTIVE", leftAt: null } })) > 0;
        duties = dutiesForRole(role, member.dutiesJson, head);
      }
    } else if ("email" in variant.person) {
      const user = await db.user.findUnique({ where: { email: variant.person.email }, select: { id: true } });
      userId = user?.id ?? null;
      if (userId && role === "PARENT" && !(await db.guardianship.count({ where: { parentUserId: userId, status: "ACTIVE" } }))) userId = null;
      if (userId && role === "EXPERT" && !(await db.expertProfile.findUnique({ where: { userId }, select: { id: true } }))) userId = null;
    }
    if (!userId) { variantsMissing.push(`${variant.id}: ${"email" in variant.person ? variant.person.email : variant.person.supportName} is not a ${role} ${variant.school ? `at ${variant.school}` : "here"} — run zz:fixtures`); continue; }
    if (duties.length) { variantsMissing.push(`${variant.id}: holds ${duties.join(", ")}, which the variant table says they lack`); continue; }
    const token = randomBytes(32).toString("base64url");
    const sess = await db.session.create({ data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId: at?.id ?? null, activeRole: role, userAgent: "api-sweep", expiresAt: sweepSessionExpiry() } });
    minted.push(sess.id);
    const tenant = at ? at.tenant : role === "PARENT" ? await familyTenant(userId) : { schoolId: null, modules: new Set<string>(), college: false, kind: null };
    variantActors.set(variant.id, { variant, token, userId, tenant, duties });
  }
}

/**
 * The variant walk at one door (owner-batch-item13), after the role's own actors were walked there. The platform's
 * gates are judged first, as for the role's own actor (a feature off or a plan the person lacks, the kind, a module
 * off at the variant's school); then the verdict: an allowed variant must answer what the role's own actor answered
 * (both a success counts as the same), a refused one 403 or 404 (a 2xx where the door says it `filters`), one without
 * the duty or the role the gate's 403.
 */
async function walkVariants(e: Endpoint, path: string, goodBody: Record<string, unknown> | null): Promise<void> {
  if (VARIANTS_OFF || e.path === "/api/v1/auth/logout" || e.path === "/api/v1/events") return;
  const calls = variantCalls(e, (id) => variantActors.has(id), path, goodBody ? JSON.stringify(goodBody) : null);
  for (const call of calls) {
    const actor = variantActors.get(call.variant)!;
    const role = actor.variant.role as Role;
    for (const body of call.withBody && goodBody ? [false, true] : [false]) {
      const got = await hit(e, actor.token, path, body ? JSON.stringify(goodBody) : undefined);
      const { expected, ok, unproved } = judgeVariant(e, call, actor, role, body, got);
      variantResults.push({ door: `${e.method} ${e.path}`, variant: call.variant, role, verdict: call.verdict, reach: call.reach, body, expected, got: got.status, ok, unproved });
    }
  }
}

function judgeVariant(e: Endpoint, call: VariantCall, actor: VariantActor, role: Role, body: boolean, got: Answer): { expected: string; ok: boolean; unproved: boolean } {
  const byFeature = featureAnswerFor(e, role, actor.userId);
  if (byFeature) return { expected: `${byFeature.status} ${byFeature.code}`, ok: got.status === byFeature.status && got.code === byFeature.code, unproved: true };
  // A plan the variant's person does not hold, answered by the handler itself (a door whose feature the gate leaves to it): the platform's answer, not the reach's.
  if (got.status === 402 && got.code === "PLAN_REQUIRED") return { expected: "402 PLAN_REQUIRED (the variant's person holds no plan)", ok: true, unproved: true };
  if (actor.tenant.schoolId && kindGoneAt(e, actor.tenant)) return { expected: "404 (a door for another kind of institution)", ok: got.status === 404, unproved: true };
  if (call.verdict === "role" || call.verdict === "duty") return { expected: call.verdict === "duty" ? "403 (the gate: without the door's duty)" : "403 (the gate: the role is not named)", ok: got.status === 403, unproved: false };
  const off = moduleOffAt(e, actor.tenant);
  if (off === "must") return { expected: "403 MODULE_OFF", ok: got.status === 403 && got.code === "MODULE_OFF", unproved: true };
  const success = (n: number) => n >= 200 && n < 300;
  if (call.verdict === "allowed") {
    const base = baseAnswers.get(baseKey(e, role, body ? "body" : "empty"));
    if (base === undefined) {
      // No actor of the role was walked (the support worker): the catalog's own expectation for the role.
      const want = body ? [200, 201] : expected(e, role);
      return { expected: `${JSON.stringify(want)} (the catalog, no actor of the role)`, ok: judge(want, off, got), unproved: false };
    }
    const same = got.status === base || (success(got.status) && success(base)) || (off === "may" && got.status === 403 && got.code === "MODULE_OFF");
    return { expected: `${base} (as the ${role} actor, whom the ${call.reach} reach lets through too)`, ok: same, unproved: base === 403 || base === 404 };
  }
  // Refused.
  const refusal = reachRefusalFor(e, role);
  const answered = got.status !== 0 && got.status < 500;
  // The sweep's sample is a row this variant reaches after all (a school-wide post, the variant's own letter): nothing to ask.
  if (refusal === "notAtSample") return { expected: "any answer (the sample is a row the variant reaches; the refusal is not asked here)", ok: answered, unproved: true };
  // The empty body names no row (the row is in the valid body alone): the call answers the variant's own, which proves nothing.
  if (!body && !call.namedByPath) return { expected: "any answer (the empty body names no row; the valid body asks the refusal)", ok: answered, unproved: true };
  if (refusal === "filters") return { expected: "2xx narrowed to what the variant reaches (the door filters)", ok: success(got.status) || got.status === 403 || got.status === 404, unproved: true };
  if (refusal === "unprocessable" && got.status === 422) return { expected: `403, 404 or 422 (the ${call.reach} reach refuses ${call.variant}; the door answers a row it does not reach 422)`, ok: true, unproved: !body && e.method !== "GET" };
  if (got.status === 403 || got.status === 404 || (off === "may" && got.status === 403)) return { expected: `403 or 404 (the ${call.reach} reach refuses ${call.variant})`, ok: true, unproved: false };
  // The parser refused the empty body before the handler asked about the row: nothing proved, nothing found.
  if (!body && e.method !== "GET" && got.status === 422) return { expected: `403 or 404 (the ${call.reach} reach refuses ${call.variant})`, ok: true, unproved: true };
  return { expected: `403 or 404 (the ${call.reach} reach refuses ${call.variant})`, ok: false, unproved: false };
}

/** The variant walk's report: every mismatch as a finding, then the counts (owner-batch-item13). */
function printVariants(): void {
  if (VARIANTS_OFF) { console.log("· role variants: off (--variants=off)"); return; }
  for (const m of variantsMissing) console.log(`· variant left out: ${m}`);
  const failed = variantResults.filter((r) => !r.ok);
  for (const r of failed) console.log(`✗ VARIANT ${r.door}${r.body ? " (valid body)" : ""} as ${r.variant} (${r.role}, ${r.verdict}${r.reach ? ` at ${r.reach}` : ""}): expected ${r.expected}, got ${r.got}`);
  const by = new Map<string, { calls: number; failed: number; unproved: number }>();
  for (const r of variantResults) {
    const row = by.get(r.variant) ?? { calls: 0, failed: 0, unproved: 0 };
    row.calls++;
    if (!r.ok) row.failed++;
    if (r.ok && r.unproved) row.unproved++;
    by.set(r.variant, row);
  }
  for (const [id, row] of by) console.log(`· variant ${id}: ${row.calls} calls, ${row.failed} unexpected, ${row.unproved} as expected without reaching the reach (a platform gate, the parser first, or the role's own actor refused too)`);
  const doors = new Set(variantResults.map((r) => r.door)).size;
  console.log(`role variants: ${variantResults.length - failed.length}/${variantResults.length} as expected over ${doors} doors, ${failed.length} unexpected, ${variantResults.filter((r) => r.ok && r.unproved).length} without reaching the reach.`);
}
/* end owner-batch-item13 ------------------------------------------------------------------------------------------ */

/**
 * Whether the fixture school is closed today by its own calendar — a day off
 * its teaching week, or a closing holiday. The staff self check-in and the
 * substitution assignment (whose sample names today's lesson) refuse a closed
 * day by design, so on a Sunday or a holiday in the school's zone those doors
 * answer 403 to every permitted role and the sweep must expect that rather
 * than 200 — run 178 on Gandhi Jayanti (2 October 2026) found the second.
 */
const CLOSED_DAY_DOORS = ["/api/v1/staff/attendance/check-in", "/api/v1/office/substitutions"];
/** Whether this door, sent a good body today, is refused by the fixture school's calendar rather than let through. */
const refusedOnClosedDay = (e: Endpoint): boolean => e.method === "POST" && CLOSED_DAY_DOORS.includes(e.path) && checkInClosedToday;
const CLOSING_KINDS = (Object.keys(HOLIDAY_KIND_META) as HolidayKind[]).filter((k) => HOLIDAY_KIND_META[k].closesSchool);
let checkInClosedToday = false;
async function readCheckInClosure(slug = "zz-northgate-school"): Promise<void> {
  const school = await db.school.findUniqueOrThrow({ where: { slug }, select: { id: true, timezone: true, teachingDays: true } });
  const key = new Intl.DateTimeFormat("en-CA", { timeZone: school.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const week = parseTeachingDays(school.teachingDays);
  const closed = await db.holiday.findFirst({ where: { schoolId: school.id, startDateKey: { lte: key }, endDateKey: { gte: key }, kind: { in: CLOSING_KINDS } }, select: { id: true } });
  checkInClosedToday = !week.includes(new Date(`${key}T00:00:00Z`).getUTCDay()) || closed !== null;
  if (checkInClosedToday) console.log(`· ${key} is a closed day for the fixture school: the staff check-in and the substitution assignment are expected to refuse`);
}

function expected(e: Endpoint, role: Role | null): number | number[] {
  if (role === null) return e.access === "anyone" ? (e.emptyBodyStatus ?? 200) : 401;
  // The operator and the content team hold no school role: every role token is refused.
  if (e.access === "operator" || e.access === "app-admin") return 403;
  // An account door is decided by the person's memberships, which a sweep
  // actor holding one role cannot be read for from here: let through or refused.
  if (e.access === "account") return e.method === "GET" ? [200, 403, 404] : [200, 403, 404, 422];
  // "signed-in" is every role but the limited ones (the module roles, the college's staff roles, the recruiter), which pass only where `limitedRoles` names them (catalog types.ts).
  const permitted = actorPermits(e, role);
  if (!permitted) return 403;
  // The check-in takes no body, so its empty-body probe meets the calendar;
  // the substitution door's empty body is refused by the parser first (422),
  // and its closed-day answer is what the valid-body probe expects below.
  if (e.path === "/api/v1/staff/attendance/check-in" && checkInClosedToday) return 403;
  // A GET's emptyBodyStatus is the permitted actor's answer to the sample as it stands (catalog types.ts).
  if (e.method === "GET") return e.path === "/api/v1/events" ? 200 : (declaredStatus(e, role) ?? [200, 404]);
  return declaredStatus(e, role) ?? [200, 404, 422];
}

/**
 * A status of 0 is a socket the server dropped or a call past its timer, not an answer: the dev server sheds its
 * keep-alive connections while it compiles a route in the background, and a busy one can sit on a request for longer
 * than the call's eight seconds. So (1 Nov 2026, scripts/sweep-retry.ts) a dropped call is followed by a patient look
 * at /api/health; while it answers, the call is sent once more after a short pause, with a longer timer, and counted
 * in the summary ("N calls retried once"). Two runs that day had ended hours in on one unanswered request with
 * health answering 200 right after.
 */
async function hit(e: Endpoint, token: string | null, path: string, body?: string): Promise<Answer> {
  const first = await hitOnce(e, token, path, body);
  const door = `${e.method} ${e.path}`;
  const outcome = await retryOnceIfHealthy(first, {
    healthy: () => healthAnswers(BASE),
    pause: () => new Promise((resolve) => setTimeout(resolve, RETRY_PAUSE_MS)),
    again: () => hitOnce(e, token, path, body, RETRY_TIMEOUT_MS),
  });
  if ("gone" in outcome) throw new ServerGone(door, outcome.gone === "health" ? "and /api/health did not answer" : "dropped again on its one retry, /api/health answering");
  if (outcome.retried) retriedCalls.push(door);
  return outcome.answer;
}
/** The generation runs that are live now (queued, running, stopping or marked active): their ids, which no call may name. */
async function liveRunIds(): Promise<string[]> {
  const rows = await db.quizGenJob.findMany({ where: { OR: [{ active: true }, { state: { in: ["QUEUED", "RUNNING", "STOPPING"] } }] }, select: { id: true, state: true, active: true } });
  return rows.filter(isLiveRun).map((r) => r.id);
}

/** The calls a dropped answer was retried for, once each, while /api/health answered. */
const retriedCalls: string[] = [];

/**
 * The server gone is not a result. The desktop app stops the dev server on
 * its own now and then, and on 2 October 2026 a sweep marched through 468
 * doors after it had, reporting "got 0" for each and spending twenty
 * minutes to say one thing. When a dropped call's health look does not
 * answer, or its one retry is dropped too (scripts/sweep-retry.ts), the run
 * ends here with the door it stopped at and the flag that resumes from it,
 * exit code 2, so a dead server costs seconds and reads as itself and not
 * as 468 failures.
 */
export class ServerGone extends Error {
  constructor(public readonly at: string, why?: string) {
    super(`the server at ${BASE} stopped answering at ${at}${why ? ` (${why})` : ""}`);
  }
}

async function hitOnce(e: Endpoint, token: string | null, path: string, body?: string, timeoutMs = 8_000): Promise<Answer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  const done = (status: number, code: string | null = null): Answer => {
    const ms = Math.round(performance.now() - started);
    timings.push({ door: `${e.method} ${e.path}`, ms });
    return { status, code, ms };
  };
  try {
    const res = await fetch(BASE + path, {
      method: e.method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(e.method === "GET" ? {} : { "content-type": "application/json" }) },
      body: e.method === "GET" ? undefined : (body ?? "{}"),
      signal: controller.signal,
    });
    if (e.path === "/api/v1/events") {
      controller.abort(); // a stream: the status is the answer
      return done(res.status);
    }
    // A refusal's envelope says which: MODULE_OFF is the module gate's (and a college's door at a school); the
    // header says FEATURE_OFF and PLAN_REQUIRED (16 Oct 2026), including on the calendar feed, which has no envelope.
    let code: string | null = res.headers.get("x-edulink-code");
    if (res.status === 403) code = ((await res.json().catch(() => null)) as { code?: string } | null)?.code ?? code;
    else await res.arrayBuffer().catch(() => null);
    return done(res.status, code);
  } catch (err) {
    // The stream opened — the events door alone. Any other door that ran past the timer gave NO answer, which
    // is retried and then reported as 0: it used to count as 200, and a slow refusal passed as a door let through.
    if ((err as { name?: string }).name === "AbortError" && e.path === "/api/v1/events") return done(200);
    return done(0);
  } finally {
    clearTimeout(timer);
  }
}

/** The slowest twenty doors by their slowest call, with the median and the number of calls (SWEEPS-3). */
function printSlowest(): void {
  if (timings.length === 0) return;
  const all = timings.map((t) => t.ms).sort((a, b) => a - b);
  const at = (q: number) => all[Math.min(all.length - 1, Math.floor(q * all.length))]!;
  const byDoor = new Map<string, number[]>();
  for (const t of timings) byDoor.set(t.door, [...(byDoor.get(t.door) ?? []), t.ms]);
  const rows = [...byDoor].map(([door, ms]) => {
    const sorted = [...ms].sort((a, b) => a - b);
    return { door, max: sorted[sorted.length - 1]!, median: sorted[Math.floor(sorted.length / 2)]!, calls: sorted.length };
  });
  rows.sort((a, b) => b.max - a.max);
  console.log(`\ntimings: ${timings.length} calls, median ${at(0.5)} ms, p95 ${at(0.95)} ms, max ${all[all.length - 1]} ms. Slowest twenty doors:`);
  console.log(`${"max ms".padStart(7)} ${"median".padStart(7)} ${"calls".padStart(5)}  door`);
  for (const r of rows.slice(0, 20)) console.log(`${String(r.max).padStart(7)} ${String(r.median).padStart(7)} ${String(r.calls).padStart(5)}  ${r.door}`);
}

/**
 * The cross-tenant and cross-person probes (`--cross=school`, `--cross=person`).
 *
 * The ordinary sweep proves each door opens for the right role with the
 * school's own ids. These two prove it stays shut for the WRONG ids: every
 * catalogued endpoint whose sample carries an id is called by ZZ Northgate's
 * actors with another school's ids (school), or with a classmate the family
 * actors are not linked to (person). A refusal is a pass — 401, 403, 404,
 * 405 and 422 all keep the fence — and a 2xx is reported as a breach. NO
 * ANSWER IS NOT A REFUSAL: with the server down every call came back with
 * nothing, and the probe counted each as a door that stayed shut (found
 * 2026-09-29, when the app had stopped the dev server). The probe now asks
 * /api/health first and stops if it is not answered, and a call that gets
 * no answer or a 5xx is reported apart and fails the run.
 * Platform-wide surfaces (shared, competitions, vacancies, experts, the
 * operator's and the content team's) are outside a school's fence and skipped.
 */
const CROSS_MODE = (process.argv.find((a) => a.startsWith("--cross="))?.slice(8) ?? null) as "school" | "person" | null;
/** `--chunk=i/n`: the i-th of n consecutive slices of the catalog, so a long run can be taken in parts that add up to it. */
const CHUNK = ((m) => (m ? { i: Number(m[1]), n: Number(m[2]) } : null))(process.argv.find((a) => a.startsWith("--chunk="))?.match(/^--chunk=(\d+)\/(\d+)$/) ?? null);
function inChunk(index: number): boolean {
  if (!CHUNK) return true;
  const from = Math.floor(((CHUNK.i - 1) * ENDPOINTS.length) / CHUNK.n);
  const to = Math.floor((CHUNK.i * ENDPOINTS.length) / CHUNK.n);
  return index >= from && index < to;
}
/** `--only=a,b`: the endpoints whose catalog path contains any of these. */
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",").filter(Boolean) ?? null;
const CROSS_SCHOOL = process.argv.find((a) => a.startsWith("--other="))?.slice(8) ?? "zz-southbank-school";

/** Doors that answer for another school ON PURPOSE, with what they give away. */
const CROSS_SCHOOL_BY_DESIGN: Record<string, string> = {
  "GET /api/v1/office/pupils/by-pen/{pen}": "answers HERE / ELSEWHERE_ACTIVE / ELSEWHERE_LEFT / NONE by state alone; the other school's name, class and record stay behind the fence (pen.ts)",
};

async function crossProbe(mode: "school" | "person") {
  const health = await fetch(BASE + "/api/health").then((r) => r.status, () => 0);
  if (health !== 200) throw new Error(`cross-${mode}: ${BASE}/api/health answered ${health}; the server is down, and nothing was tried`);
  const tokens = await actors();
  const home = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true } });
  const homeFx = await fixture();
  const byDesign: string[] = [];
  const ownData: string[] = [];
  /** The doors tried with a body or a path of the probe's own, named so the count can be read. */
  const tried: string[] = [];
  // A door that answers 2xx is a breach only if the answer carries the other person's id or name; a family door that
  // ignores a childId it was not built to take and answers the caller's OWN child is not a leak — it is listed apart.
  const check = async (e: Endpoint, role: Role, path: string, body: Record<string, unknown> | null, label: string, mustNotCarry: string[] = []) => {
    const res = await hitText(e, tokens[role], path, body ? JSON.stringify(body) : undefined);
    const twoXx = res.status >= 200 && res.status < 300;
    const leak = twoXx && mustNotCarry.some((needle) => needle && res.text.includes(needle));
    // No answer, or the server's own failure, says nothing about the fence.
    const unanswered = res.status === 0 || res.status >= 500;
    const ok = !unanswered && (!twoXx || (mustNotCarry.length > 0 && !leak));
    if (twoXx && !leak && mustNotCarry.length > 0) ownData.push(`${e.method} ${e.path} as ${role}: ${res.status}, answered without the other person`);
    results.push({ endpoint: `${e.method} ${e.path}${body ? " (valid body)" : ""} [${label}]`, role, expected: [401, 403, 404, 422], got: res.status, ok });
  };
  if (mode === "school") {
    const fx = await fixture(CROSS_SCHOOL);
    const swapper = fixtureSwapper();
    /** The fixed-path doors tried with another tenant's rows in place of the fixture's (W-14), named so the count can be read. */
    const swapped: string[] = [];
    /** The doors reached with another school's ids in the body or on the query string (R-30, scripts/cross-sampler.ts), named so the count can be read. */
    const byBodyOrQuery: string[] = [];
    for (const e of ENDPOINTS) {
      const key = `${e.method} ${e.path}`;
      // What to send is decided by crossPlan alone (scripts/cross-sampler.ts), which a dry count reads the same way.
      const cross = crossPlan(e, homeFx, fx);
      if (cross.kind === "public") { skipped.push(`${key} (public)`); continue; }
      if (cross.kind === "platform-wide") { skipped.push(`${key} (platform-wide)`); continue; }
      if (CROSS_SCHOOL_BY_DESIGN[key]) { byDesign.push(`${key}: ${CROSS_SCHOOL_BY_DESIGN[key]}`); continue; }
      if (cross.kind === "no-row") { skipped.push(`${key} (${CROSS_SCHOOL} has no row for its sample)`); continue; }
      if (cross.kind === "none") { skipped.push(`${key} (no id in the path)`); continue; }
      if (cross.kind === "body-not-ids") { skipped.push(`${key} (its body differs at ${CROSS_SCHOOL} in more than ids)`); continue; }
      if (cross.kind === "query-incomplete") { skipped.push(`${key} (its query needs more than ${CROSS_SCHOOL}'s id)`); continue; }
      if (cross.kind === "no-sample") { skipped.push(`${key} (no sample)`); continue; }
      // The other school's ids in the path (the probe's own, or the sample's), in the body, or on the query string.
      if (cross.kind === "path" || cross.kind === "body" || cross.kind === "query") {
        // A valid body, so the refusal is the fence's and not the parser's.
        const body = cross.kind === "query" ? null : cross.body;
        if (e.probe) tried.push(`${key}${body ? " (valid body)" : ""}`);
        if (cross.kind !== "path") byBodyOrQuery.push(`${key} (${cross.kind === "body" ? `${cross.swapped} id(s) in the body` : "the query"})`);
        const label = cross.kind === "path" ? "another school's ids" : cross.kind === "body" ? "another school's ids in the body" : "another school's ids on the query";
        for (const role of (ROLES as readonly Role[]).filter((r) => tokens[r])) {
          if (!actorPermits(e, role)) continue; // a role the door refuses anyway (or the actor lacks its duty) proves nothing here
          await check(e, role, cross.path, body, label, cross.kind === "query" ? cross.needles : []);
        }
        continue;
      }
      /**
       * A FIXED PATH (W-14, 4 Oct 2026). Ninety-seven doors — every college module's and the school
       * modules' fixed-id ones — were left out here without a word, because their sample is a string
       * carrying the fixture's ids (src/lib/api-catalog/*-fixture.ts) rather than a function of the
       * fixture. Each such id is looked up (its table and its tenant) and swapped for a row of the same
       * table at another tenant: Southbank for Northgate's, the other two colleges (ZZ Shastri, the demo
       * college) for a college's. The actors of the fixture's own tenant then call it, and anyone who
       * holds no school. A door that cannot be swapped is skipped with the reason.
       */
      const { fixed, body } = cross;
      const plan = await swapper.plan(fixed, body);
      if (plan.kind === "none") { skipped.push(`${key} (no id in the path)`); continue; }
      if (plan.kind === "skip") { skipped.push(`${key} (${plan.reason})`); continue; }
      // The fixture tenant's own actors, and those who hold no school (a guardian, an expert, a recruiter).
      const roles = (ROLES as readonly Role[]).filter((r) => tokens[r] && actorPermits(e, r) && ((tenantOf[r]?.schoolId ?? null) === null || tenantOf[r]!.schoolId === plan.homeId));
      if (roles.length === 0) { skipped.push(`${key} (no actor of ${plan.homeSlug} may call it)`); continue; }
      for (const t of plan.targets) {
        if (t.reason !== null) { skipped.push(`${key} at ${t.slug} (${t.reason})`); continue; }
        swapped.push(`${key} at ${t.slug}`);
        for (const role of roles) await check(e, role, t.path, t.body, `${t.slug}'s ids`, t.needles);
      }
    }
    console.log(`· ${swapped.length} fixed-path probes with another tenant's rows (W-14)`);
    for (const d of byBodyOrQuery) console.log(`· by body or query: ${d}`);
    console.log(`· ${byBodyOrQuery.length} doors with no id in the path probed with ${CROSS_SCHOOL}'s ids in the body or the query (R-30)`);
  } else {
    // A guardian asks for a child that is not theirs; a teacher for a pupil in a class they do not teach.
    // The guardian the PARENT actor IS (actors(), above): pupil 01's. "The first guardianship" could be another
    // family's, and the child chosen as "not theirs" would then be measured against the wrong parent.
    const theirs = await db.membership.findFirst({ where: { schoolId: home.id, role: "STUDENT", status: "ACTIVE", leftAt: null, user: { email: "zz.pupil01@zz.test" } }, select: { id: true } });
    const guardian =
      (theirs ? await db.guardianship.findFirst({ where: { studentMembershipId: theirs.id, status: "ACTIVE", relation: { not: "SCHOOL" } }, orderBy: { id: "asc" }, select: { parentUserId: true } }) : null) ??
      (await db.guardianship.findFirstOrThrow({ where: { studentSchoolId: home.id, status: "ACTIVE" }, orderBy: { id: "asc" }, select: { parentUserId: true } }));
    const linked = (await db.guardianship.findMany({ where: { parentUserId: guardian.parentUserId }, select: { studentMembershipId: true } })).map((g) => g.studentMembershipId);
    const notMine = await db.membership.findFirst({ where: { schoolId: home.id, role: "STUDENT", status: "ACTIVE", leftAt: null, id: { notIn: linked } }, orderBy: { id: "asc" }, select: { id: true } });
    const teacherLead = homeFx.classId ? await db.classTeacher.findFirst({ where: { classId: homeFx.classId, role: "LEAD" }, select: { teacherMembershipId: true } }) : null;
    const taught = teacherLead ? (await db.classTeacher.findMany({ where: { teacherMembershipId: teacherLead.teacherMembershipId }, select: { classId: true } })).map((c) => c.classId) : [];
    const untaughtPupil = await db.enrollment.findFirst({ where: { schoolId: home.id, status: "ACTIVE", classId: { notIn: taught }, class: { archivedAt: null }, student: { status: "ACTIVE", leftAt: null } }, select: { studentMembershipId: true } });
    if (!notMine) throw new Error("no unlinked pupil to probe with");
    const nameOf = async (id: string) => (await db.membership.findUniqueOrThrow({ where: { id }, select: { user: { select: { name: true } } } })).user.name;
    const notMineNeedles = [notMine.id, await nameOf(notMine.id)];
    // The queue's two decisions, by the people who may decide SOME and not these: a teacher of another class,
    // and a guardian of another child. A valid decision is sent, so the refusal is the rule's.
    const decide = (path: string) => ENDPOINTS.find((e) => e.method === "POST" && e.path === path)!;
    if (homeFx.otherClassJoinRequestId) {
      const e = decide("/api/v1/shared/joins/{requestId}/decide");
      await check(e, "TEACHER", `/api/v1/shared/joins/${homeFx.otherClassJoinRequestId}/decide`, { decision: "APPROVE" }, "a join by another class's code");
      tried.push(`POST ${e.path} as TEACHER (valid body)`);
    } else skipped.push("POST /api/v1/shared/joins/{requestId}/decide (no join by another class's code in the fixtures)");
    if (homeFx.otherFamilyClaimId) {
      const e = decide("/api/v1/shared/claims/{claimId}/decide");
      await check(e, "PARENT", `/api/v1/shared/claims/${homeFx.otherFamilyClaimId}/decide`, { decision: "APPROVE" }, "a claim on a child not theirs");
      tried.push(`POST ${e.path} as PARENT (valid body)`);
    } else skipped.push("POST /api/v1/shared/claims/{claimId}/decide (no claim on another family's child in the fixtures)");
    // An ask to change the record of a child who is not theirs, still waiting (zz-fixtures.ts `buildRecordChanges`):
    // the guardian and the pupil each try to take it back. The loop below tries the same door with the id of their
    // OWN settled ask and another child on the query string, which the door does not read; that proves nothing of
    // the fence, so the ask itself is another family's here.
    const othersAsk = await db.recordChangeRequest.findFirst({ where: { schoolId: home.id, status: "PENDING", studentMembershipId: { notIn: [...linked, ...(theirs ? [theirs.id] : [])] } }, orderBy: { id: "asc" }, select: { id: true } });
    if (othersAsk) {
      const e = decide("/api/v1/family/record/changes/{requestId}/withdraw");
      for (const role of ["PARENT", "STUDENT"] as const) {
        await check(e, role, `/api/v1/family/record/changes/${othersAsk.id}/withdraw`, null, "an ask about a child not theirs");
        tried.push(`POST ${e.path} as ${role}`);
      }
    } else skipped.push("POST /api/v1/family/record/changes/{requestId}/withdraw (no ask waiting on another family's child in the fixtures)");
    // A question ANOTHER teacher wrote for the bank (zz-fixtures.ts `buildGigQuestions`): the sweep's teacher reads, changes and takes back none of it.
    const mineGig = homeFx.gigContributionId ? await db.questionContribution.findUnique({ where: { id: homeFx.gigContributionId }, select: { authorUserId: true, topicId: true } }) : null;
    const othersGig = mineGig ? await db.questionContribution.findFirst({ where: { authorSchoolId: home.id, stem: { startsWith: "ZZ " }, status: "SUBMITTED", authorUserId: { not: mineGig.authorUserId } }, orderBy: { id: "asc" }, select: { id: true } }) : null;
    if (mineGig && othersGig) {
      const text = { stem: "ZZ probe: what is two and two?", choices: ["3", "4"], solution: "Two and two make four." };
      const body = { topicId: mineGig.topicId, difficulty: 1, answerIndex: 1, en: text, hi: text, mr: text, terms: true };
      for (const [method, tail, send] of [["GET", "", null], ["POST", "", body], ["POST", "/withdraw", null]] as const) {
        const e = ENDPOINTS.find((x) => x.method === method && x.path === `/api/v1/gigs/questions/{contributionId}${tail}`)!;
        await check(e, "TEACHER", `/api/v1/gigs/questions/${othersGig.id}${tail}`, send, "another teacher's question for the bank");
        tried.push(`${method} ${e.path} as TEACHER${send ? " (valid body)" : ""}`);
      }
    } else skipped.push("/api/v1/gigs/questions/{contributionId} (no other teacher's question in the fixtures)");
    // Another pupil's seat in a session (zz-fixtures.ts `buildGigSessions`, pupil 02's in the workshop): the sweep's pupil and their
    // parent neither agree to it, give it up, rate it nor say it was not held; and the sweep's teacher, whose booking it is not, neither marks nor cancels it.
    const othersSeat = await db.gigBooking.findFirst({ where: { schoolId: home.id, status: "CONFIRMED", slot: { title: { startsWith: "ZZ " } }, studentMembershipId: { notIn: [...linked, ...(theirs ? [theirs.id] : [])] } }, orderBy: { id: "asc" }, select: { id: true } });
    if (othersSeat) {
      const door = (tail: string) => ENDPOINTS.find((x) => x.method === "POST" && x.path === `/api/v1/gigs/sessions/{bookingId}/${tail}`)!;
      for (const [tail, body, roles] of [["consent", { approve: true }, ["PARENT"]], ["cancel", { reason: "" }, ["PARENT", "STUDENT"]], ["unheld", null, ["PARENT", "STUDENT"]], ["rate", { rating: 5 }, ["PARENT", "STUDENT"]], ["close", { outcome: "DELIVERED" }, ["TEACHER"]], ["cancel", { reason: "ZZ probe: not my seat" }, ["TEACHER"]]] as const) {
        for (const role of roles) {
          await check(door(tail), role, `/api/v1/gigs/sessions/${othersSeat.id}/${tail}`, body, role === "TEACHER" ? "a seat in another provider's session" : "another pupil's seat in a session");
          tried.push(`POST ${door(tail).path} as ${role}${body ? " (valid body)" : ""}`);
        }
      }
      // seats (17 Oct 2026): another pupil's meeting link is nobody's here — not the sweep's pupil, their parent, nor a teacher whose session it is not.
      const join = ENDPOINTS.find((x) => x.method === "GET" && x.path === "/api/v1/gigs/sessions/{bookingId}/join")!;
      for (const role of ["PARENT", "STUDENT", "TEACHER"] as const) {
        await check(join, role, `/api/v1/gigs/sessions/${othersSeat.id}/join`, null, role === "TEACHER" ? "the link of a seat in another provider's session" : "another pupil's meeting link");
        tried.push(`GET ${join.path} as ${role}`);
      }
    } else skipped.push("/api/v1/gigs/sessions/{bookingId}/* (no other pupil's seat in the fixtures)");
    // A picture on another pupil's certificate: the sweep's pupil and their parent are refused it.
    if (homeFx.otherPupilSignatureId) {
      const e = ENDPOINTS.find((x) => x.method === "GET" && x.path === "/api/v1/shared/signatures/{signatureId}")!;
      for (const role of ["PARENT", "STUDENT"] as const) {
        await check(e, role, `/api/v1/shared/signatures/${homeFx.otherPupilSignatureId}`, null, "a picture on another pupil's certificate");
        tried.push(`GET ${e.path} as ${role}`);
      }
    } else skipped.push("GET /api/v1/shared/signatures/{signatureId} (no signed line on another pupil's certificate in the fixtures)");
    const untaughtNeedles = untaughtPupil ? [untaughtPupil.studentMembershipId, await nameOf(untaughtPupil.studentMembershipId)] : [];
    for (const e of ENDPOINTS) {
      if (e.access === "anyone" || PLATFORM_WIDE.some((re) => re.test(e.path))) continue;
      const permitted = (r: Role) => e.access === "signed-in" || (Array.isArray(e.access) && e.access.includes(r));
      const base = typeof e.sample === "function" ? e.sample(homeFx) : (e.sample ?? e.path);
      if (base === null || /\{\w+\}/.test(base)) continue;
      const body = e.sampleBody ? e.sampleBody(homeFx) : null;
      // PARENT: every family door with another child's id on the query string.
      if (e.path.startsWith("/api/v1/family/") && permitted("PARENT")) {
        const path = `${base}${base.includes("?") ? "&" : "?"}childId=${notMine.id}`;
        await check(e, "PARENT", path, body, "a child not theirs", notMineNeedles);
      }
      // TEACHER: any door whose sample names the fixture pupil, with a pupil from a class the teacher does not teach.
      if (untaughtPupil && homeFx.studentMembershipId && permitted("TEACHER") && (base.includes(homeFx.studentMembershipId) || (body && JSON.stringify(body).includes(homeFx.studentMembershipId)))) {
        const swap = (v: string) => v.split(homeFx.studentMembershipId!).join(untaughtPupil.studentMembershipId);
        const swappedBody = body ? (JSON.parse(swap(JSON.stringify(body))) as Record<string, unknown>) : null;
        await check(e, "TEACHER", swap(base), swappedBody, "a pupil of a class they do not teach", untaughtNeedles);
      }
    }
  }
  const failed = results.filter((r) => !r.ok);
  for (const r of failed) console.log(r.got === 0 || r.got >= 500 ? `✗ NO ANSWER ${r.endpoint} as ${r.role}: got ${r.got}` : `✗ BREACH ${r.endpoint} as ${r.role}: got ${r.got}`);
  for (const d of tried) console.log(`· tried: ${d}`);
  for (const b of byDesign) console.log(`· by design: ${b}`);
  for (const o of ownData) console.log(`· own data: ${o}`);
  // Every door not tried says why (W-14); the doors with no id at all are only counted.
  const noId = skipped.filter((x) => x.endsWith("(no id in the path)"));
  for (const x of skipped.filter((y) => !y.endsWith("(no id in the path)"))) console.log(`· skipped: ${x}`);
  if (noId.length) console.log(`· skipped: ${noId.length} doors with no id in the path to swap`);
  printSlowest();
  console.log(`cross-${mode}: ${results.length - failed.length}/${results.length} doors stayed shut, ${failed.filter((r) => r.got !== 0 && r.got < 500).length} opened, ${failed.filter((r) => r.got === 0 || r.got >= 500).length} unanswered, ${skipped.length} skipped.`);
  if (failed.length > 0) process.exitCode = 1;
}

/** The colleges a college's fixture id is swapped into, and the school a school's is (`--other`). */
const CROSS_COLLEGES = ["zz-vidya-college", "zz-shastri-college", "saraswati-college"];
type SwapTarget = { slug: string; path: string; body: Record<string, unknown> | null; needles: string[]; reason: null } | { slug: string; reason: string };
type SwapPlan = { kind: "none" } | { kind: "skip"; reason: string } | { kind: "swap"; homeId: string; homeSlug: string; targets: SwapTarget[] };

/**
 * Finds what a fixed sample's ids are — the table and the tenant of each, read
 * as the owner, a table per kind of id found once — and the same table's row at
 * the other tenants. An id found only after the "?" filters a list, which may
 * rightly answer 200 with nothing in it: such a probe is a breach only if the
 * answer carries the other tenant's id.
 */
function fixtureSwapper() {
  type Model = { name: string; tenant: boolean };
  const models: Model[] = Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => f.name === "id" && f.type === "String"))
    .map((m) => ({ name: m.name, tenant: m.fields.some((f) => f.name === "schoolId") }));
  type Delegate = { findFirst: (args: unknown) => Promise<{ id: string; schoolId?: string | null } | null> };
  const delegate = (name: string) => (db as unknown as Record<string, Delegate>)[name[0]!.toLowerCase() + name.slice(1)];
  const modelOfKind = new Map<string, Model>();
  const located = new Map<string, { model: Model; schoolId: string | null } | null>();
  const slugs = new Map<string, { id: string; college: boolean } | null>();
  const school = async (slug: string) => {
    if (!slugs.has(slug)) {
      const row = await db.school.findUnique({ where: { slug }, select: { id: true, kind: true } });
      slugs.set(slug, row ? { id: row.id, college: isCollegeKind(row.kind) } : null);
    }
    return slugs.get(slug)!;
  };
  const locate = async (id: string) => {
    if (located.has(id)) return located.get(id)!;
    const kind = id.match(/^c(zz[a-z]+)/)![1]!;
    const known = modelOfKind.get(kind);
    let found: { model: Model; schoolId: string | null } | null = null;
    for (const model of known ? [known] : models) {
      try {
        const row = await delegate(model.name)?.findFirst({ where: { id }, select: model.tenant ? { id: true, schoolId: true } : { id: true } });
        if (row) {
          found = { model, schoolId: model.tenant ? (row.schoolId ?? null) : null };
          modelOfKind.set(kind, model);
          break;
        }
      } catch {
        /* not this table */
      }
    }
    located.set(id, found);
    return found;
  };
  const otherRow = async (model: Model, schoolId: string) => {
    try {
      return (await delegate(model.name)?.findFirst({ where: { schoolId }, select: { id: true }, orderBy: { id: "asc" } }))?.id ?? null;
    } catch {
      return null;
    }
  };
  return {
    async plan(path: string, body: Record<string, unknown> | null): Promise<SwapPlan> {
      const bodyText = body ? JSON.stringify(body) : "";
      const ids = [...new Set([...`${path} ${bodyText}`.matchAll(FIXTURE_ID)].map((m) => m[0]))];
      if (ids.length === 0) return { kind: "none" };
      const found = new Map<string, { model: Model; schoolId: string | null }>();
      for (const id of ids) {
        const at = await locate(id);
        if (!at) return { kind: "skip", reason: `${id} is in no table: the fixture has not made it` };
        found.set(id, at);
      }
      const homes = [...new Set([...found.values()].map((f) => f.schoolId).filter((x): x is string => x !== null))];
      if (homes.length === 0) return { kind: "skip", reason: `only rows shared across tenants (${[...new Set([...found.values()].map((f) => f.model.name))].join(", ")})` };
      if (homes.length > 1) return { kind: "skip", reason: "ids of two tenants in one sample" };
      const home = await db.school.findUniqueOrThrow({ where: { id: homes[0]! }, select: { slug: true, kind: true } });
      const others = isCollegeKind(home.kind) ? CROSS_COLLEGES.filter((x) => x !== home.slug) : [home.slug === CROSS_SCHOOL ? "zz-northgate-school" : CROSS_SCHOOL];
      const targets: SwapTarget[] = [];
      for (const slug of others) {
        const other = await school(slug);
        if (!other) { targets.push({ slug, reason: "no such tenant here" }); continue; }
        const swap = new Map<string, string>();
        let missing: string | null = null;
        for (const [id, at] of found) {
          if (at.schoolId === null) continue; // a shared row (a company) stays itself
          const twin = await otherRow(at.model, other.id);
          if (!twin) { missing = `no ${at.model.name} at ${slug}`; break; }
          swap.set(id, twin);
        }
        if (missing) { targets.push({ slug, reason: missing }); continue; }
        const apply = (text: string) => [...swap].reduce((acc, [from, to]) => acc.split(from).join(to), text);
        const [route, query = ""] = path.split("?");
        const strict = [...swap.keys()].some((id) => route!.includes(id) || bodyText.includes(id));
        targets.push({ slug, path: apply(path), body: body ? (JSON.parse(apply(bodyText)) as Record<string, unknown>) : null, needles: strict || !query ? [] : [...swap.values()], reason: null });
      }
      return { kind: "swap", homeId: homes[0]!, homeSlug: home.slug, targets };
    },
  };
}

async function hitText(e: Endpoint, token: string | null, path: string, body?: string): Promise<{ status: number; text: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  const started = performance.now();
  try {
    const res = await fetch(BASE + path, { method: e.method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(e.method === "GET" ? {} : { "content-type": "application/json" }) }, body: e.method === "GET" ? undefined : (body ?? "{}"), signal: controller.signal });
    return { status: res.status, text: await res.text() };
  } catch {
    return { status: 0, text: "" };
  } finally {
    clearTimeout(timer);
    timings.push({ door: `${e.method} ${e.path}`, ms: Math.round(performance.now() - started) });
  }
}

/**
 * What a run wrote, taken away again. Every write endpoint is called with a
 * valid body as every permitted role, and each call that succeeds leaves a
 * row: after a few months a fixture pupil had 142 health checks and 205
 * incidents, all "ZZ Sweep" (the walk of 2026-10-01). So the run notes when
 * it started and, at the end, deletes every row of every school-scoped
 * model that a ZZ fixture school gained since — nothing older, nothing of
 * any other school. Models are read from Prisma's own model list, so a new
 * table is covered without being named here; a row another row still points
 * at (a fee head under a line, both new) waits for the next pass.
 *
 * A ROW THE RUN REPLACED GOES TOO: an endpoint that removes and re-saves (a
 * signature, the seal) leaves a row made during the run where a fixture's
 * stood, and this cannot tell the two apart. So a run still ends with
 * zz:fixtures, as the rules say, and the last line here says so.
 */
async function sweepAway(startedAt: Date, until?: Date) {
  // The ZZ fixture schools alone (W-13): the demo college is a test fixture too, and no sweep writes there.
  const schools = (await db.school.findMany({ where: { isTestFixture: true, slug: { startsWith: "zz-" } }, select: { id: true } })).map((s) => s.id);
  if (schools.length === 0) return;
  const models = Prisma.dmmf.datamodel.models.filter((m) => m.fields.some((f) => f.name === "schoolId") && m.fields.some((f) => f.name === "createdAt"));
  let remaining = models.map((m) => m.name);
  let removed = 0;
  const byModel = new Map<string, number>();
  for (let pass = 0; pass < 4 && remaining.length > 0; pass++) {
    const next: string[] = [];
    for (const name of remaining) {
      const delegate = (db as unknown as Record<string, { deleteMany: (args: unknown) => Promise<{ count: number }> }>)[name[0]!.toLowerCase() + name.slice(1)];
      if (!delegate) continue;
      try {
        const count = (await delegate.deleteMany({ where: { schoolId: { in: schools }, createdAt: until ? { gte: startedAt, lt: until } : { gte: startedAt } } })).count;
        removed += count;
        if (count) byModel.set(name, (byModel.get(name) ?? 0) + count);
      } catch {
        next.push(name);
      }
    }
    remaining = next;
  }
  if (byModel.size) console.log(`  by table: ${[...byModel].sort((a, b) => b[1] - a[1]).map(([m, n]) => `${m} ${n}`).join(", ")}`);
  console.log(`swept away ${removed} rows the run wrote to the fixture schools${remaining.length ? ` (could not: ${remaining.join(", ")})` : ""}; rows it replaced went with them — run zz:fixtures.`);
}

/** `--clean-since=<ISO>` (and `--clean-until=<ISO>`, default now): no sweep, only the clean-up of that window (W-13). */
const CLEAN_SINCE = process.argv.find((a) => a.startsWith("--clean-since="))?.slice(14) ?? null;
const CLEAN_UNTIL = process.argv.find((a) => a.startsWith("--clean-until="))?.slice(14) ?? null;

/**
 * THE CLEAN-UP OF A RUN THAT NEVER REACHED ITS OWN (W-13, 4 Oct 2026). A sweep
 * stopped by hand, or by the server going away, leaves what it wrote; this
 * takes away exactly what `sweepAway` would have — rows of the ZZ fixture
 * schools created in the window — and the sweep's own sessions minted in it
 * that have since expired (a live run's are left alone). Nothing is called.
 */
async function cleanWindow(sinceText: string, untilText: string | null): Promise<void> {
  const since = new Date(sinceText);
  const until = untilText ? new Date(untilText) : new Date();
  if (Number.isNaN(since.getTime()) || Number.isNaN(until.getTime()) || since >= until) throw new Error(`--clean-since=${sinceText}${untilText ? ` --clean-until=${untilText}` : ""}: not a window (ISO dates, since before until)`);
  console.log(`· cleaning the ZZ fixture schools of rows created from ${since.toISOString()} to ${until.toISOString()}`);
  await sweepAway(since, until);
  const sessions = await db.session.deleteMany({ where: { userAgent: { in: ["api-sweep", "api-sweep (to sign out)"] }, createdAt: { gte: since, lt: until }, expiresAt: { lt: new Date() } } });
  console.log(`deleted ${sessions.count} expired api-sweep sessions minted in the window.`);
}

/** `--features=on` / `--plans=on`: what this run switched on, put back in main's `finally` and on a signal (sweep-features.ts). */
const switches = runSwitches(db, BASE, gateFlags(process.argv));

async function main() {
  if (CLEAN_SINCE) return cleanWindow(CLEAN_SINCE, CLEAN_UNTIL);
  // The run's own sessions: renewed while it lives, deleted if it is stopped by a signal (A3-S-15) — after the
  // switches this run turned on are turned off again.
  keepSessionsAlive(() => db.session.updateMany({ where: { id: { in: minted } }, data: { expiresAt: sweepSessionExpiry() } }));
  purgeSessionsOnSignal(async () => {
    await switches.restore().catch((e) => console.error(`✗ could not switch back: ${(e as Error).message}`));
    await db.session.deleteMany({ where: { id: { in: minted } } });
  });
  const switched = await switches.on();
  if (switched.features.length || switched.plans.length) console.log(`· switched on for this run, as the ZZ operator: ${[...switched.features, ...switched.plans.map((p) => `plan ${p}`)].join(", ")}`);
  // The cross probes write too (an application, a guardian's PEN decision): their window is swept like the main run's (STREAMS-8).
  if (CROSS_MODE) return inOwnWindow(() => crossProbe(CROSS_MODE), sweepAway);
  const startedAt = new Date();
  const tokens = await actors();
  if (!VARIANTS_OFF) {
    // owner-batch-item13: the role variants, and how many calls they add to this run (sweep-sessions.ts variantCalls).
    await mintVariants();
    const planned = ENDPOINTS.filter((e, i) => inChunk(i) && (!ONLY || ONLY.some((t) => e.path.includes(t)))).reduce((n, e) => n + variantCallCount(variantCalls(e, (id) => variantActors.has(id))), 0);
    console.log(`· role variants: ${variantActors.size} minted, at most ${planned} calls added (doors with a reach or a duty, or naming SUPPORT; --variants=off to leave them out)`);
  }
  gate = await readGateState(db, [...Object.values(userOf), ...[...variantActors.values()].map((a) => a.userId)]);
  console.log(`· ${describeGateState(gate)}`);
  // The rows whose doors remove them, put back first, so this run proves the removal and not the last run's 404.
  const northgate = await db.school.findUniqueOrThrow({ where: { slug: "zz-northgate-school" }, select: { id: true } });
  await restoreSweepThrowaways(db, northgate.id);
  const fx = await fixture();
  await readCheckInClosure();
  if (CHUNK && !(CHUNK.n >= 1 && CHUNK.i >= 1 && CHUNK.i <= CHUNK.n)) throw new Error(`--chunk=${CHUNK.i}/${CHUNK.n}: not a slice (1 ≤ i ≤ n)`);
  for (const [index, e] of ENDPOINTS.entries()) {
    if (!inChunk(index)) continue;
    if (ONLY && !ONLY.some((text) => e.path.includes(text))) continue;
    const path = typeof e.sample === "function" ? e.sample(fx) : (e.sample ?? e.path);
    if (path === null || /\{\w+\}/.test(path)) {
      skipped.push(`${e.method} ${e.path}`);
      continue;
    }
    // The generation run in hand is never the sweep's to touch (1 Nov 2026, scripts/sweep-live-run.ts): read afresh at each such door.
    if (e.path.includes("/quiz-jobs")) {
      const why = liveRunSkip(e, path, await liveRunIds());
      if (why) {
        skipped.push(`${e.method} ${e.path} (${why})`);
        continue;
      }
    }
    const goodBody = e.sampleBody ? e.sampleBody(fx) : null;
    // Sign-in endpoints mint sessions and burn rate limits; the sweep checks
    // their shape signed out only, with an empty body.
    const roles: (Role | null)[] = e.access === "anyone" ? [null] : [null, ...(ROLES as readonly Role[]).filter((r) => tokens[r])];
    for (const role of roles) {
      if (e.path === "/api/v1/auth/logout" && role) continue; // would revoke the sweep's own session
      // A feature the operator has off, or a plan the actor lacks, is the gate's answer before any other (16 Oct 2026).
      const byFeature = featureAnswer(e, role);
      if (byFeature) {
        const got = await hit(e, role ? tokens[role] : null, path);
        const ok = got.status === byFeature.status && got.code === byFeature.code;
        if (ok) gated[byFeature.code]++;
        results.push({ endpoint: `${e.method} ${e.path}`, role: role ?? "anonymous", expected: `${byFeature.status} ${byFeature.code}`, got: got.status, ok });
        // A valid body meets the same gate: the refusal holds for a request the handler would take.
        if (goodBody && role && e.method !== "GET" && (e.access === "signed-in" || Array.isArray(e.access)) && actorPermits(e, role)) {
          const answer = await hit(e, tokens[role], path, JSON.stringify(goodBody));
          const bodyOk = answer.status === byFeature.status && answer.code === byFeature.code;
          if (bodyOk) gated[byFeature.code]++;
          results.push({ endpoint: `${e.method} ${e.path} (valid body)`, role, expected: `${byFeature.status} ${byFeature.code}`, got: answer.status, ok: bodyOk });
        }
        continue;
      }
      // A door for other kinds of institution is not here at this actor's school (owner-batch-item5): 404, whatever the role or body.
      if (role && kindGone(e, role)) {
        const got = await hit(e, tokens[role], path);
        if (got.status === 404) kindGated++;
        results.push({ endpoint: `${e.method} ${e.path}`, role, expected: "404 (a door for another kind of institution)", got: got.status, ok: got.status === 404 });
        if (goodBody && e.method !== "GET") {
          const answer = await hit(e, tokens[role], path, JSON.stringify(goodBody));
          if (answer.status === 404) kindGated++;
          results.push({ endpoint: `${e.method} ${e.path} (valid body)`, role, expected: "404 (a door for another kind of institution)", got: answer.status, ok: answer.status === 404 });
        }
        continue;
      }
      const want = expected(e, role);
      // A permitted role at a school with the door's module off is answered by the gate (SWEEPS-4).
      const off = role && actorPermits(e, role) && e.access !== "operator" && e.access !== "app-admin" ? moduleOff(e, role) : "no";
      // A door whose handler decides its feature (`featureInHandler`) may answer a permitted role 404 while the feature
      // is off — the payee door does for a teacher the company does not owe (catalog gigs.ts): that 404 is allowed too.
      const byHandler = role !== null && actorPermits(e, role) && !!e.featureInHandler && featuresOf(e).every((f) => !gate.on.has(f));
      const handlerOk = (a: Answer) => byHandler && a.status === 404;
      const got = await hit(e, role ? tokens[role] : null, path);
      if (role) baseAnswers.set(baseKey(e, role, "empty"), got.status); // owner-batch-item13
      results.push({ endpoint: `${e.method} ${e.path}`, role: role ?? "anonymous", expected: byHandler ? `${JSON.stringify(wanted(want, off))} or 404 (its handler, feature off)` : wanted(want, off), got: got.status, ok: judge(want, off, got) || handlerOk(got) });
      // With a valid body, a permitted role must get through (200), which is
      // the half of the contract an empty body cannot prove.
      if (goodBody && role && e.method !== "GET" && (e.access === "signed-in" || Array.isArray(e.access)) && actorPermits(e, role)) {
        const answer = await hit(e, tokens[role], path, JSON.stringify(goodBody));
        baseAnswers.set(baseKey(e, role, "body"), answer.status); // owner-batch-item13
        // A status the catalog declares for this role (statusByRole: a Northgate sample is another tenant's row to a college
        // actor, an HOD may not write a college-wide visit) is the valid-body answer too; otherwise a permitted role gets through.
        const declared = e.statusByRole?.[role];
        const want = refusedOnClosedDay(e) ? [403] : declared !== undefined ? declared : [200, 201];
        results.push({ endpoint: `${e.method} ${e.path} (valid body)`, role, expected: byHandler ? `${JSON.stringify(wanted(want, off))} or 404 (its handler, feature off)` : wanted(want, off), got: answer.status, ok: judge(want, off, answer) || handlerOk(answer) });
      }
    }
    // The role variants at this door, held to what its reach says and to what the role's own actors just answered (owner-batch-item13).
    await walkVariants(e, path, goodBody);
  }
  const failed = results.filter((r) => !r.ok);
  for (const r of failed) console.log(`✗ ${r.endpoint} as ${r.role}: expected ${JSON.stringify(r.expected)}, got ${r.got}`);
  for (const s of skipped) console.log(s.includes("generation run") ? `· skipped: ${s}` : `· skipped (no sample): ${s}`);
  console.log(`· judged by the platform's switches and plans (${describeGateState(gate)}): ${gated.FEATURE_OFF} calls 404 FEATURE_OFF, ${gated.PLAN_REQUIRED} calls 402 PLAN_REQUIRED, as expected`);
  console.log(`· judged by the institution's kind: ${kindGated} calls 404 at a school for a college's door, as expected`);
  console.log(`· ${retriedCalls.length} calls retried once (dropped or past their timer while /api/health answered)${retriedCalls.length ? `: ${[...new Set(retriedCalls)].slice(0, 20).join(", ")}` : ""}`);
  console.log(`${results.length - failed.length}/${results.length} as expected, ${failed.length} unexpected, ${skipped.length} skipped.`);
  printVariants(); // owner-batch-item13
  printSlowest();
  if (failed.length || variantResults.some((r) => !r.ok)) process.exitCode = 1;
  await sweepAway(startedAt);
}

main()
  .catch((e) => {
    if (e instanceof ServerGone) {
      const path = e.at.replace(/^\w+ /, "");
      console.error(`✗ ${e.message}: nothing after it was tried. Restart the server (check ${BASE}/api/health) and rerun; to pick up from that door: npm run api:sweep -- --only=${path.replace(/^\/api\/v1/, "")}`);
      process.exitCode = 2;
      return;
    }
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Never leave a feature or a plan on that this run switched on (--features=on, --plans=on).
    await switches.restore().catch((e) => {
      console.error(`✗ could not switch back what this run switched on: ${(e as Error).message} — switch it off at /root/features`);
      process.exitCode = 1;
    });
    if (minted.length) await db.session.deleteMany({ where: { id: { in: minted } } });
    await db.$disconnect();
  });
