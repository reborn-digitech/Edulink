import { z } from "zod";
import type { StreamCode } from "./streams";

/**
 * DUTIES ON EXISTING ROLES (the owner's decision of 5 October 2026). A
 * college gives some of its teachers a second job beside their teaching — the
 * lab in-charge, the NSS programme officer, a member of the anti-ragging
 * squad — and a duty is that job: not a role of its own (the person signs in
 * as FACULTY or HOD and keeps every door of it) but a mark on the membership
 * (Membership.dutiesJson) the registrar sets at /admin/people, which opens the
 * duty's own doors and pages.
 *
 * THE GATE. A catalog entry may carry `duties` (src/lib/api-catalog/types.ts):
 * a FACULTY or HOD passes that door only with one of the duties named; every
 * other role is decided by `access` as before. A nav entry or a phone tab with
 * `duty` is hidden without it. A library function calls `requireDuty(ctx, …)`.
 *
 * WHICH COLLEGE OFFERS WHICH DUTY is its streams' (STREAM_PRESETS[…].duties,
 * built from DUTY_STREAMS below): a duty no stream of the college offers
 * cannot be given there. The anti-ragging squad (UGC Regulations on Curbing
 * the Menace of Ragging, 2009), the research dean and the exam flying squad
 * are every college's; the rest belong to the streams whose councils ask for
 * them.
 *
 * A coded list; what each says to a person is `duties.<CODE>.name` / `.what`.
 */
export const DUTIES = [
  "LAB_INCHARGE",
  "CLINICAL_COORDINATOR",
  "PRACTICE_TEACHING_COORDINATOR",
  "STUDIO_COORDINATOR",
  "NSS_OFFICER",
  "NCC_OFFICER",
  "ANTI_RAGGING_SQUAD",
  "RESEARCH_DEAN",
  "EXAM_SQUAD",
] as const;
export const dutySchema = z.enum(DUTIES);
export type DutyCode = z.infer<typeof dutySchema>;

/** The roles a duty can be given to: a college's teachers. */
export const DUTY_ROLES = ["FACULTY", "HOD"] as const;
export type DutyRoleCode = (typeof DUTY_ROLES)[number];
export function isDutyRole(role: string | null | undefined): role is DutyRoleCode {
  return role === "FACULTY" || role === "HOD";
}

/**
 * The streams that offer each duty; "ALL" is every stream. NSS and NCC units
 * are raised by arts, science, commerce and the professional colleges alike;
 * a health-sciences college runs its community postings instead, so it is not
 * offered them here (the registrar of such a college who wants one says so and
 * the list grows).
 */
export const DUTY_STREAMS: Record<DutyCode, readonly StreamCode[] | "ALL"> = {
  LAB_INCHARGE: ["SCIENCE", "ENGINEERING", "PHARMACY", "HEALTH_SCIENCES", "AGRICULTURE", "VOCATIONAL"],
  CLINICAL_COORDINATOR: ["HEALTH_SCIENCES", "PHARMACY"],
  PRACTICE_TEACHING_COORDINATOR: ["EDUCATION"],
  STUDIO_COORDINATOR: ["ARCHITECTURE"],
  NSS_OFFICER: ["ARTS", "SCIENCE", "COMMERCE", "MANAGEMENT", "ENGINEERING", "PHARMACY", "LAW", "EDUCATION", "ARCHITECTURE", "AGRICULTURE", "VOCATIONAL"],
  NCC_OFFICER: ["ARTS", "SCIENCE", "COMMERCE", "MANAGEMENT", "ENGINEERING", "PHARMACY", "LAW", "EDUCATION", "ARCHITECTURE", "AGRICULTURE", "VOCATIONAL"],
  ANTI_RAGGING_SQUAD: "ALL",
  RESEARCH_DEAN: "ALL",
  EXAM_SQUAD: "ALL",
};

/**
 * Whether a duty's desk is built: its doors, page and phone screen exist
 * (A3-inventory-12, audit of 5 Oct 2026). An unbuilt duty is offered by no
 * stream until it is, so the registrar cannot give a teacher a duty that opens
 * a page saying nothing is there; one already held is dropped by the next save
 * (setDuties) or stream change (setStreams). DUTY_STREAMS keeps whose it will be.
 */
export const DUTY_BUILT: Record<DutyCode, boolean> = {
  LAB_INCHARGE: true,
  // Built 10 Oct 2026 (R-56, the clinical half): lib/clinical.ts, /duties/clinical, the phone's clinical-desk.
  CLINICAL_COORDINATOR: true,
  PRACTICE_TEACHING_COORDINATOR: true,
  // Built 10 Oct 2026 (R-56, the studio half): studios, submissions, juries and signed marks (v1/studio.ts).
  STUDIO_COORDINATOR: true,
  NSS_OFFICER: true,
  NCC_OFFICER: true,
  ANTI_RAGGING_SQUAD: true,
  RESEARCH_DEAN: true,
  EXAM_SQUAD: true,
};

/** Whether `stream` offers `duty`: the duty is built and its council's stream is one of the duty's. */
export function streamOffersDuty(stream: StreamCode, duty: DutyCode): boolean {
  if (!DUTY_BUILT[duty]) return false;
  const by = DUTY_STREAMS[duty];
  return by === "ALL" || by.includes(stream);
}

/** A JSON array of duty codes, as Membership.dutiesJson holds it: unknown words are dropped, the order is DUTIES'. */
export function parseDuties(raw: string | null | undefined): DutyCode[] {
  let list: unknown = [];
  try {
    list = JSON.parse(raw ?? "[]");
  } catch {
    list = [];
  }
  const set = new Set(Array.isArray(list) ? list : []);
  return DUTIES.filter((d) => set.has(d));
}

/** POST /api/v1/admin/people/{membershipId}/duties — the registrar sets a teacher's duties (the whole list; [] clears). */
export const dutiesSetSchema = z.object({ duties: z.array(dutySchema).max(DUTIES.length) });
export type DutiesSet = z.infer<typeof dutiesSetSchema>;
/** …and what it answers: the duties the person holds now, and the ones this college offers. */
export const memberDutiesSchema = z.object({
  membershipId: z.string(),
  role: z.enum(DUTY_ROLES),
  duties: z.array(dutySchema),
  offered: z.array(dutySchema),
});
export type MemberDuties = z.infer<typeof memberDutiesSchema>;

/**
 * GET /api/v1/duties/anti-ragging — THE ANTI-RAGGING REGISTER as a member of
 * the squad reads it (5 Oct 2026): the hostel squad's rounds (while the
 * college keeps a hostel in the app), the grievances that went to the
 * anti-ragging committee — that they exist, when they were filed, their state
 * and their due day, never their words or who filed them — and the committee
 * itself. The office and the head read the words on the IQAC's grievance desk.
 */
export const antiRaggingRegisterSchema = z.object({
  today: z.string(),
  hostelOn: z.boolean(),
  committee: z.object({ name: z.string(), members: z.array(z.string()) }).nullable(),
  rounds: z.array(
    z.object({
      id: z.string(),
      hostelName: z.string(),
      at: z.string().datetime(),
      members: z.string(),
      flagged: z.boolean(),
    }),
  ),
  complaints: z.array(
    z.object({
      id: z.string(),
      filedOn: z.string(),
      status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED", "ESCALATED"]),
      dueOn: z.string(),
      overdue: z.boolean(),
    }),
  ),
  summary: z.object({ rounds30: z.number().int().min(0), flagged30: z.number().int().min(0), open: z.number().int().min(0), overdue: z.number().int().min(0) }),
});
export type AntiRaggingRegister = z.infer<typeof antiRaggingRegisterSchema>;

// owner-batch-item9 (27 Oct 2026) ─────────────────────────────────────────────────────────────────────────────────
/**
 * THE HEAD'S PAGES ON AN OFFICE MEMBERSHIP (the owner's ask of 27 October 2026, item 9). Leave approval, the
 * trends, the review rounds and the safety centre are the head's work; an ADMIN reaches them only while the
 * PRINCIPAL has given that admin this duty, from the head's staff page (/principal/staff). The PRINCIPAL always
 * holds them. While the school has no active PRINCIPAL (the post vacant), every admin holds them, so a request for
 * leave never waits on nobody.
 *
 * Kept apart from DUTIES on purpose: those are a college teacher's, offered by the college's streams, and set by
 * the registrar; this one is any school's or college's, and set by the head. It is stored where they are
 * (Membership.dutiesJson, on the ADMIN's membership) and read by the same `duty` field on a NAV entry, a phone tab
 * or menu entry and a catalog door (`duties`), each of which lets an ADMIN through only holding it.
 */
export const ADMIN_DUTIES = ["HEAD_PAGES"] as const;
export const adminDutySchema = z.enum(ADMIN_DUTIES);
export type AdminDutyCode = z.infer<typeof adminDutySchema>;
/** A duty a NAV entry, a phone tab or a catalog door may name: a college teacher's or the office's. */
export type AnyDutyCode = DutyCode | AdminDutyCode;
/** The roles each kind of duty is given to: a college teacher's to FACULTY and HOD, the office's to ADMIN. */
export function dutyHolderRoles(duty: string): readonly string[] {
  return (ADMIN_DUTIES as readonly string[]).includes(duty) ? ["ADMIN"] : (DUTIES as readonly string[]).includes(duty) ? DUTY_ROLES : [];
}
export function isAdminDuty(duty: string): duty is AdminDutyCode {
  return (ADMIN_DUTIES as readonly string[]).includes(duty);
}

/** The office's duties a stored Membership.dutiesJson holds: unknown words dropped, ADMIN_DUTIES order. */
export function parseAdminDuties(raw: string | null | undefined): AdminDutyCode[] {
  let list: unknown = [];
  try {
    list = JSON.parse(raw ?? "[]");
  } catch {
    list = [];
  }
  const set = new Set(Array.isArray(list) ? list : []);
  return ADMIN_DUTIES.filter((d) => set.has(d));
}

/**
 * The office's duties an ADMIN holds: those stored on the membership, and every one while the school has no active
 * PRINCIPAL (`principalPresent` false). Pure, so the session, the sweeps and the e2e harness agree.
 */
export function adminDutiesHeld(raw: string | null | undefined, principalPresent: boolean): AdminDutyCode[] {
  return principalPresent ? parseAdminDuties(raw) : [...ADMIN_DUTIES];
}

/** Every duty a membership holds by its role: a FACULTY's or HOD's college duties, an ADMIN's office duties, else none. */
export function dutiesForRole(role: string | null | undefined, raw: string | null | undefined, principalPresent = true): AnyDutyCode[] {
  if (isDutyRole(role)) return parseDuties(raw);
  if (role === "ADMIN") return adminDutiesHeld(raw, principalPresent);
  return [];
}

/** The head gives an admin the head's pages, or takes them back (the head's staff page). */
export const headDutySetSchema = z.object({ held: z.boolean() });
export type HeadDutySet = z.infer<typeof headDutySetSchema>;
export const headDutySchema = z.object({ membershipId: z.string(), held: z.boolean() });
export type HeadDuty = z.infer<typeof headDutySchema>;
// end owner-batch-item9
