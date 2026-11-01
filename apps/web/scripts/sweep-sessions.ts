/**
 * THE API SWEEP'S SESSIONS (A3-S-15, 5 Oct 2026, risks batch). They were minted
 * for 24 hours (W-13) so a two-to-four-hour run never outlived them, and they
 * were deleted only by the run's own `finally` — so a run stopped with Ctrl-C,
 * or killed with its terminal, left some twenty live bearer tokens for a day,
 * and `--clean-since` deleted only the expired ones. Now a session lives two
 * hours and the run renews its own every twenty minutes while it is alive, so
 * a long run keeps them and a dead run's lapse within two hours; and a signal
 * deletes them before the process goes.
 */
import { dutyHolderRoles, type RoleCode } from "@edulink/contracts"; // owner-batch-item13
import { permits, REACHES, reachFor, type Endpoint, type Reach } from "../src/lib/api-catalog/types"; // owner-batch-item13

export const SWEEP_SESSION_MS = 2 * 3_600_000;
export const SWEEP_RENEW_EVERY_MS = 20 * 60_000;

/** When a session minted (or renewed) now lapses. */
export const sweepSessionExpiry = (now: number = Date.now()): Date => new Date(now + SWEEP_SESSION_MS);

/** Renews the run's sessions on a timer that never keeps the process alive; returns the stop. */
export function keepSessionsAlive(renew: () => Promise<unknown>, every: number = SWEEP_RENEW_EVERY_MS): () => void {
  const timer = setInterval(() => void renew().catch(() => undefined), every);
  timer.unref?.();
  return () => clearInterval(timer);
}

type SignalTarget = { once(signal: "SIGINT" | "SIGTERM" | "SIGHUP", listener: () => void): unknown; exit(code?: number): never | void };

/** On Ctrl-C, a kill or a closed terminal: delete the run's sessions, once, then exit 130. */
export function purgeSessionsOnSignal(purge: () => Promise<unknown>, proc: SignalTarget = process): void {
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    void purge()
      .catch(() => undefined)
      .finally(() => proc.exit(130));
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) proc.once(signal, go);
}

// owner-batch-item13 (1 Nov 2026) ----------------------------------------------------------------------------------
/*
 * THE ROLE VARIANTS (owner-batch-item13, after the subject-teacher bug of 10e5f2d2). The sweep walks each door as ONE
 * person per role, so a variant of a role that the data model allows — a teacher who takes the class only on the
 * timetable, a co-teacher, the guardian of another child — was never asked anything. The table below is one actor per
 * variant at the sample school (ZZ Northgate; a college's at ZZ Vidya, the other school's office at ZZ Southbank),
 * each a fixture person (scripts/zz-fixtures.ts; the three the fixtures lacked are fenced `owner-batch-item13`
 * there). REACH_PAIRS says, for every value of the catalog's `reach` (src/lib/api-catalog/types.ts REACHES), which
 * actors it lets through and which it refuses, relative to the sweep's samples: the grade-3 class, pupil 01 and their
 * guardian, the class's work, the sweep's own rows. `variantCalls` turns a door into the calls the variant walk makes;
 * it is pure, so the unit test (tests/sweep-variants.test.ts) holds the table to the catalog and counts the calls.
 */

export const VARIANT_IDS = ["subjectTeacher", "coTeacher", "otherClassTeacher", "adminWithoutHeadPages", "otherGuardian", "classmate", "otherClassPupil", "supportWorker", "otherExpert", "expertUnderReview", "otherSchoolOffice", "otherFaculty"] as const;
export type VariantId = (typeof VARIANT_IDS)[number];

export type SweepVariant = {
  id: VariantId;
  role: RoleCode;
  /** Who it is, relative to the sweep's samples, in a sentence for the report. */
  who: string;
  /** The person: a fixture address, or (a support worker has none) the name on their SUPPORT membership. */
  person: { email: string } | { supportName: string };
  /** Where the session is minted: a school's slug, or null for a role that holds no school (a guardian, an expert). */
  school: "zz-northgate-school" | "zz-southbank-school" | "zz-vidya-college" | null;
  /** Which fixture makes the person. */
  fixture: string;
};

export const SWEEP_VARIANTS: readonly SweepVariant[] = [
  { id: "subjectTeacher", role: "TEACHER", who: "a timetable-only teacher of the sample class (English lessons in Grade 3 · A, no ClassTeacher row anywhere)", person: { email: "zz.subject1@zz.test" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts buildNorthgate (subject teachers)" },
  { id: "coTeacher", role: "TEACHER", who: "a co-teacher of the sample class (a CO ClassTeacher row on Grade 3 · A, no timetable lesson)", person: { email: "zz.coteach3@zz.test" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts owner-batch-item13" },
  { id: "otherClassTeacher", role: "TEACHER", who: "a teacher of another class of the same school (a CO row on Grade 5 · A, nothing in Grade 3 · A)", person: { email: "zz.coteach5@zz.test" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts owner-batch-item13" },
  { id: "adminWithoutHeadPages", role: "ADMIN", who: "a second office admin at the sample school, not given the head's pages (HEAD_PAGES)", person: { email: "zz.admin2@zz.test" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts owner-batch-item13" },
  { id: "otherGuardian", role: "PARENT", who: "the guardian of another pupil (zz.pupil02, the sample pupil's classmate) and of nobody the samples name", person: { email: "zz.parent02@zz.test" }, school: null, fixture: "zz-fixtures.ts buildNorthgate (claimed seats)" },
  { id: "classmate", role: "STUDENT", who: "a pupil of the sample class who is not the sample pupil (zz.pupil02, Grade 3 · A)", person: { email: "zz.pupil02@zz.test" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts buildNorthgate" },
  { id: "otherClassPupil", role: "STUDENT", who: "a pupil of another class (zz.pupil07, Grade 4 · A)", person: { email: "zz.pupil07@zz.test" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts buildNorthgate" },
  { id: "supportWorker", role: "SUPPORT", who: "a support worker without a login (ZZ Sunita Kamble), signed in by a minted session as zz:token does", person: { supportName: "ZZ Sunita Kamble" }, school: "zz-northgate-school", fixture: "zz-fixtures.ts owner-batch-item2a buildSupportStaff" },
  { id: "otherExpert", role: "EXPERT", who: "another approved expert (published and verified), whose rows the samples are not", person: { email: "zz.expert2@zz.test" }, school: null, fixture: "zz-fixtures.ts EXPERTS" },
  { id: "expertUnderReview", role: "EXPERT", who: "an expert under review (profile not yet published by the operator)", person: { email: "zz.expert4@zz.test" }, school: null, fixture: "zz-fixtures.ts EXPERTS" },
  { id: "otherSchoolOffice", role: "ADMIN", who: "the office of another school (ZZ Southbank's admin), the cross-school probe's person", person: { email: "zz.admin.b@zz.test" }, school: "zz-southbank-school", fixture: "zz-fixtures.ts buildSouthbank" },
  { id: "otherFaculty", role: "FACULTY", who: "another college teacher (ZZ Vidya's zz.faculty02: CHE101, no duty), not the teacher of the samples' PHY101", person: { email: "zz.faculty02@zz.test" }, school: "zz-vidya-college", fixture: "zz-college.ts / zz-academics.ts" },
];

/** An actor in a pair: the role's own sweep actor (`base`, "any" for every role's), or a variant. */
export type ReachActor = { base: RoleCode | "any" } | { variant: VariantId };
export type ReachPair = { allowed: readonly ReachActor[]; refused: readonly ReachActor[] };

const v = (variant: VariantId): ReachActor => ({ variant });
const b = (base: RoleCode | "any"): ReachActor => ({ base });

/** Per reach value: the actors it lets through and those it refuses, at the sweep's samples. */
export const REACH_PAIRS: Record<Reach, ReachPair> = {
  ownSchool: { allowed: [b("ADMIN"), b("PRINCIPAL"), v("adminWithoutHeadPages")], refused: [v("otherSchoolOffice")] },
  teachesClass: { allowed: [b("TEACHER"), v("subjectTeacher"), v("coTeacher")], refused: [v("otherClassTeacher")] },
  formTeacher: { allowed: [b("TEACHER"), v("coTeacher")], refused: [v("subjectTeacher"), v("otherClassTeacher")] },
  // The sweep's TEACHER is the grade-3 class's LEAD; its co-teacher holds a CO row.
  leadTeacher: { allowed: [b("TEACHER")], refused: [v("coTeacher"), v("subjectTeacher"), v("otherClassTeacher")] },
  // The samples' subject is the grade-3 class's Mathematics, which zz.subject1 (English) does not take there.
  teachesSubject: { allowed: [b("TEACHER"), v("coTeacher")], refused: [v("subjectTeacher"), v("otherClassTeacher")] },
  // The sample work is the grade-3 class's, set by the office: its form teachers and its pupils reach it; a teacher who
  // takes the class only on the timetable did not set it, and another class's teacher and pupil have nothing there.
  ownWork: { allowed: [b("TEACHER"), v("coTeacher"), b("STUDENT"), v("classmate")], refused: [v("subjectTeacher"), v("otherClassTeacher"), v("otherClassPupil")] },
  ownChild: { allowed: [b("STUDENT"), b("PARENT")], refused: [v("classmate"), v("otherGuardian")] },
  self: { allowed: [b("any")], refused: [v("classmate"), v("otherGuardian"), v("otherClassTeacher"), v("adminWithoutHeadPages"), v("otherExpert"), v("otherFaculty")] },
  approvedExpert: { allowed: [b("EXPERT"), v("otherExpert")], refused: [v("expertUnderReview")] },
  ownDesk: { allowed: [b("FACULTY"), b("HOD"), b("DRIVER")], refused: [v("otherFaculty")] },
};

/** The variant that stands for a role without the door's duty: the office's second admin, the college's other teacher. */
export const NO_DUTY_VARIANT: Partial<Record<RoleCode, VariantId>> = { ADMIN: "adminWithoutHeadPages", FACULTY: "otherFaculty" };

/**
 * What a variant is expected to meet at a door, before any gate of the platform (feature, kind, module), which the
 * sweep judges first exactly as for the role's own actor:
 *   allowed  — the reach lets it through: the same answer as the role's own sweep actor got for the same call
 *   refused  — the reach keeps it out: 403 or 404 (the door's `reachRefusal: "filters"` a narrowed 2xx)
 *   duty     — the door names a duty this role must hold and the variant holds none: the gate's 403
 *   role     — the door does not name this role at all (the support worker's walk): the gate's 403
 */
export type VariantVerdict = "allowed" | "refused" | "duty" | "role";
export type VariantCall = { variant: VariantId; verdict: VariantVerdict; reach: Reach | null; withBody: boolean; namedByPath: boolean };

/** An id a sample names: a cuid, or a fixture's own `zz-…` id, quoted in a body or after `=` in a query. */
const NAMED_ID = /(^|[="/])(c[a-z0-9]{20,}|zz-[\w-]+)("|&|$)/;

const inPair = (actors: readonly ReachActor[], id: VariantId) => actors.some((a) => "variant" in a && a.variant === id);

/**
 * The calls the variant walk makes at one door: for each variant whose role the door lets in, its verdict under the
 * door's reach for that role (none where the reach's pair does not name it); the no-duty variant at a door whose duty
 * binds its role; the support worker at every door with a reach or naming SUPPORT. `withBody` adds the valid-body
 * call where the catalog gives one (a write): the refusal or the pass is then proved on a request the handler takes.
 * Walked only where the door declares a reach or a duty (or names SUPPORT), which is what keeps the run within reason.
 */
export function variantCalls(e: Pick<Endpoint, "method" | "path" | "access" | "limitedRoles" | "duties" | "reach" | "sample" | "sampleBody">, exists: (id: VariantId) => boolean = () => true, samplePath?: string, bodyText?: string | null): VariantCall[] {
  const out: VariantCall[] = [];
  const withBody = e.method !== "GET" && typeof e.sampleBody === "function";
  // A refusal is asked only where the sample names a row: a parameter in the path, an id in the query, or an id in the
  // valid body (with no fixture to hand, a body is taken to name one). A door that names none answers every caller their
  // own (a guardian's first child, a pupil's own page, the caller's own signature), which is no refusal.
  const query = (samplePath ?? (typeof e.sample === "string" ? e.sample : "")).split("?")[1] ?? "";
  const namedByPath = /\{\w+\}/.test(e.path) || query.split("&").some((pair) => NAMED_ID.test(pair));
  const namedByBody = withBody && (bodyText === undefined ? true : bodyText !== null && NAMED_ID.test(bodyText));
  const named = namedByPath || namedByBody;
  const namesSupport = Array.isArray(e.access) && e.access.includes("SUPPORT");
  if (!e.reach && !e.duties?.length && !namesSupport) return out;
  for (const variant of SWEEP_VARIANTS) {
    if (!exists(variant.id)) continue;
    const role = variant.role;
    if (variant.id === "supportWorker") {
      if (!e.reach && !namesSupport) continue;
      if (!permits(e, role, [])) out.push({ variant: variant.id, verdict: "role", reach: null, withBody: false, namedByPath });
      else out.push({ variant: variant.id, verdict: "allowed", reach: reachFor(e, role), withBody, namedByPath });
      continue;
    }
    if (!permits(e, role)) {
      // The role passes the gate only holding a duty this variant lacks.
      const binds = (e.duties ?? []).some((d) => dutyHolderRoles(d).includes(role));
      if (binds && NO_DUTY_VARIANT[role] === variant.id && permits({ ...e, duties: undefined }, role)) out.push({ variant: variant.id, verdict: "duty", reach: null, withBody, namedByPath });
      continue;
    }
    const reach = reachFor(e, role);
    if (!reach) continue;
    const pair = REACH_PAIRS[reach];
    if (inPair(pair.allowed, variant.id)) out.push({ variant: variant.id, verdict: "allowed", reach, withBody, namedByPath });
    // An expert under review is refused whatever the row (the published-profile check comes first), so no row need be named.
    else if ((named || reach === "approvedExpert") && inPair(pair.refused, variant.id)) out.push({ variant: variant.id, verdict: "refused", reach, withBody, namedByPath });
  }
  return out;
}

/** How many HTTP calls a door's variant walk makes (one with the empty body, one more with a valid body where there is one). */
export const variantCallCount = (calls: readonly VariantCall[]): number => calls.reduce((n, c) => n + 1 + (c.withBody ? 1 : 0), 0);

/** Every value of the catalog's list has a pair (a compile-time list, checked at load). */
for (const r of REACHES) if (!REACH_PAIRS[r]) throw new Error(`sweep-sessions: no variant pair for reach ${r}`);
// end owner-batch-item13 -------------------------------------------------------------------------------------------
