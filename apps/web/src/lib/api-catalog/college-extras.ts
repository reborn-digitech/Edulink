import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { COLLEGE_EXTRAS_FIXTURE as F } from "./college-extras-fixture";
import { ZZ_PAYROLL_MONTH } from "./payroll";

/**
 * THE RISKS BATCH'S COLLEGE BUILDS (package 5B, R-2, 5 October 2026): the
 * pre-placement talks and soft-skills training (module PLACEMENT; the TPO
 * writes, the office and the principal read, a student answers and enrols),
 * the attendance devices (the office registers devices and badges; a device
 * posts signed punches with no session), the Tally export (ADMIN and
 * ACCOUNTS; payroll needs PAYROLL on) and the peer-team visit file (module
 * IQAC; the IQAC and an HOD for their department's NBA visit write, the
 * principal and the office read). Every role is checked before the body.
 * Samples name the ZZ Vidya rows of college-extras-fixture.ts (the punch door
 * the sweep's school, which it answers 401: the sweep holds no device key).
 * A door whose valid body is the act (a talk, a training, a mark, a device,
 * a badge, a visit line) carries no sampleBody; the two doors that only
 * remove (a badge, a visit line) name an id no school holds and are answered
 * 404, so the sweep never empties the fixture.
 */
const P = { module: "PLACEMENT" } as const;
const I = { module: "IQAC" } as const;
const CELL_READ: c.RoleCode[] = ["TPO", "ADMIN", "PRINCIPAL"];
const VISIT_READ: c.RoleCode[] = ["IQAC", "HOD", "PRINCIPAL", "ADMIN"];

export const COLLEGE_EXTRAS: Endpoint[] = [
  // ---- pre-placement talks
  { ...P, method: "GET", path: "/api/v1/placement/talks", summary: "The cell's pre-placement talks with their answers and attendance counts (computed on read)", access: CELL_READ, response: c.talkListSchema },
  { ...P, method: "POST", path: "/api/v1/placement/talks", summary: "The TPO sets a talk ahead of now, with the drive it belongs to (one talk a drive, not a closed one); audited", access: ["TPO"], request: c.talkSaveSchema, response: c.talkDetailSchema, emptyBodyStatus: 422 },
  { ...P, method: "GET", path: "/api/v1/placement/talks/{talkId}", summary: "One talk with its roster: every student on the roll, those who answered first, each with their answer and mark", access: CELL_READ, response: c.talkDetailSchema, sample: `/api/v1/placement/talks/${F.talk}` },
  { ...P, method: "POST", path: "/api/v1/placement/talks/{talkId}", summary: "The TPO edits, moves or cancels a talk not yet held (cancelling tells those going); a held talk is refused 409; audited", access: ["TPO"], request: c.talkUpdateSchema, response: c.talkDetailSchema, emptyBodyStatus: 409, sample: `/api/v1/placement/talks/${F.heldTalk}`, sampleBody: () => ({}) },
  { ...P, method: "POST", path: "/api/v1/placement/talks/{talkId}/attendance", summary: "The TPO marks PRESENT or ABSENT for students on the roll (walk-ins too), once the talk has started; a re-mark replaces; audited", access: ["TPO"], request: c.talkAttendanceSaveSchema, response: c.talkAttendanceResultSchema, emptyBodyStatus: 422, sample: `/api/v1/placement/talks/${F.heldTalk}/attendance` },
  { ...P, method: "GET", path: "/api/v1/student/placement/talks", summary: "The student's talks: those ahead (with their answer and whether they may still answer), then the last ones held with their mark", access: ["STUDENT"], response: c.talkListSchema },
  { ...P, method: "POST", path: "/api/v1/student/placement/talks/{talkId}/rsvp", summary: "Going or not going, while the talk is scheduled and ahead; GOING stops at the seats; the same answer again changes nothing", access: ["STUDENT"], request: c.talkRsvpSchema, response: c.talkViewSchema, emptyBodyStatus: 422, sample: `/api/v1/student/placement/talks/${F.talk}/rsvp` },
  // ---- soft-skills training
  { ...P, method: "GET", path: "/api/v1/placement/trainings", summary: "The cell's soft-skills trainings (sessions, enrolled, completed) and how many students completed at least one", access: CELL_READ, response: c.trainingListSchema },
  { ...P, method: "POST", path: "/api/v1/placement/trainings", summary: "The TPO makes a training in a coded skill with its seats and the attendance share that completes it; audited", access: ["TPO"], request: c.trainingSaveSchema, response: c.trainingDetailSchema, emptyBodyStatus: 422 },
  { ...P, method: "GET", path: "/api/v1/placement/trainings/{trainingId}", summary: "One training: its sessions and its roll with each student's marks, attendance and completion", access: CELL_READ, response: c.trainingDetailSchema, sample: `/api/v1/placement/trainings/${F.training}` },
  { ...P, method: "POST", path: "/api/v1/placement/trainings/{trainingId}", summary: "The TPO edits a training or closes its enrolment; seats never below those enrolled; audited", access: ["TPO"], request: c.trainingUpdateSchema, response: c.trainingDetailSchema, emptyBodyStatus: 200, sample: `/api/v1/placement/trainings/${F.training}`, sampleBody: () => ({}) },
  { ...P, method: "POST", path: "/api/v1/placement/trainings/{trainingId}/sessions", summary: "The TPO adds a session; audited", access: ["TPO"], request: c.trainingSessionSaveSchema, response: c.trainingDetailSchema, emptyBodyStatus: 422, sample: `/api/v1/placement/trainings/${F.training}/sessions` },
  { ...P, method: "POST", path: "/api/v1/placement/trainings/{trainingId}/sessions/{sessionId}", summary: "The TPO cancels a session with no marks, or brings it back; a marked session is refused 409; audited", access: ["TPO"], request: c.trainingSessionUpdateSchema, response: c.trainingDetailSchema, emptyBodyStatus: 422, sample: `/api/v1/placement/trainings/${F.training}/sessions/${F.heldSession}` },
  { ...P, method: "POST", path: "/api/v1/placement/trainings/{trainingId}/sessions/{sessionId}/attendance", summary: "The TPO marks a session for students on the roll, once it has started; a re-mark replaces; audited", access: ["TPO"], request: c.trainingAttendanceSaveSchema, response: c.trainingAttendanceResultSchema, emptyBodyStatus: 422, sample: `/api/v1/placement/trainings/${F.training}/sessions/${F.heldSession}/attendance` },
  { ...P, method: "POST", path: "/api/v1/placement/trainings/{trainingId}/enrolments", summary: "The TPO puts students on the roll (within the seats) or takes them off; idempotent; audited", access: ["TPO"], request: c.trainingEnrolmentSaveSchema, response: c.trainingDetailSchema, emptyBodyStatus: 422, sample: `/api/v1/placement/trainings/${F.training}/enrolments` },
  { ...P, method: "GET", path: "/api/v1/student/placement/trainings", summary: "The student's trainings (open ones and their own) with their attendance, and the ones completed", access: ["STUDENT"], response: c.studentTrainingsSchema },
  { ...P, method: "POST", path: "/api/v1/student/placement/trainings/{trainingId}/enrol", summary: "The student enrols (OPEN, a seat left) or withdraws; idempotent", access: ["STUDENT"], request: c.trainingEnrolSelfSchema, response: c.trainingSummarySchema, emptyBodyStatus: 422, sample: `/api/v1/student/placement/trainings/${F.training}/enrol` },
  // ---- attendance devices
  { method: "GET", path: "/api/v1/admin/attendance-devices", summary: "The school's attendance devices (key's last four, last punch, today's count), the badges, the last hundred punches with their outcome", access: ["ADMIN", "PRINCIPAL"], response: c.devicesViewSchema },
  { method: "POST", path: "/api/v1/admin/attendance-devices", summary: "The office registers a biometric or RFID device; its key is in this answer and no other (sealed at rest; 409 while FEES_SECRET_KEY is not set); audited", access: ["ADMIN"], request: c.deviceSaveSchema, response: c.deviceKeyIssuedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/attendance-devices/{deviceId}", summary: "The office renames, moves, rescopes, disables or re-enables a device; audited", access: ["ADMIN"], request: c.deviceUpdateSchema, response: c.deviceViewSchema, emptyBodyStatus: 200, sample: `/api/v1/admin/attendance-devices/${F.device}`, sampleBody: () => ({}) },
  { method: "POST", path: "/api/v1/admin/attendance-devices/{deviceId}/rotate", summary: "A new key for a device (the body says confirm: true), shown once; the old stops at once; audited, never the key", access: ["ADMIN"], request: c.deviceRotateSchema, response: c.deviceKeyIssuedSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/attendance-devices/${F.device}/rotate` },
  { method: "POST", path: "/api/v1/admin/attendance-devices/badges", summary: "The office maps a card's or a reader's enrolment number to a member of staff or a pupil (never a template, never Aadhaar); a code another holds is refused 409; audited", access: ["ADMIN"], request: c.badgeSaveSchema, response: c.badgeSavedSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/admin/attendance-devices/badges/{badgeId}", summary: "The office takes a badge away; audited", access: ["ADMIN"], response: c.okSchema, emptyBodyStatus: 404, sample: "/api/v1/admin/attendance-devices/badges/zz-sweep-no-such-badge" },
  { method: "POST", path: "/api/v1/punch/{schoolId}", summary: "An attendance device's signed punches (HMAC-SHA256 with its own key over timestamp.body; no session): each lands in the staff check-in or the day's class register through their own writers, kept once per device and punch id; 401 for anything not the key holder's", access: "anyone", request: c.punchBatchSchema, response: c.punchResultSchema, emptyBodyStatus: 401, sample: (f) => `/api/v1/punch/${f.schoolId}` },
  // ---- the Tally export
  { method: "GET", path: "/api/v1/tally/receipts", summary: "The span's fee receipts (Receipt vouchers) and refunds paid back (Payment vouchers) in Tally's XML import shape or as a CSV day book; reversed receipts left out; at most 366 days; audited", access: ["ADMIN", "ACCOUNTS"], request: c.tallyReceiptsQuerySchema, response: c.okSchema, sample: "/api/v1/tally/receipts?from=2026-04-01&to=2026-10-05&format=XML" },
  { module: "PAYROLL", method: "GET", path: "/api/v1/tally/payroll", summary: "A LOCKED payroll month as one Tally Journal voucher (gross, employer share, each liability, net payable), XML or a CSV day book; a draft month 409; audited", access: ["ADMIN", "ACCOUNTS"], request: c.tallyPayrollQuerySchema, response: c.okSchema, sample: `/api/v1/tally/payroll?month=${ZZ_PAYROLL_MONTH}&format=CSV` },
  // ---- the peer-team visit file
  { ...I, method: "GET", path: "/api/v1/iqac/visits", summary: "The peer-team visits the reader may see (an HOD: their department's NBA visits), the cycles and the departments a visit may name", access: VISIT_READ, response: c.visitListSchema },
  { ...I, method: "POST", path: "/api/v1/iqac/visits", summary: "A visit: NAAC by the IQAC naming its cycle; NBA by the IQAC or the department's HOD for an engineering department; at most seven days; audited", access: ["IQAC", "HOD"], request: c.visitSaveSchema, response: c.visitDetailSchema, emptyBodyStatus: 422 },
  { ...I, method: "GET", path: "/api/v1/iqac/visits/{visitId}", summary: "The visit's file: the schedule, the evidence index each line resolved (MISSING when its target is gone), the SAR pack read from the filings, coverage by criterion", access: VISIT_READ, response: c.visitDetailSchema, sample: `/api/v1/iqac/visits/${F.visit}`, statusByRole: { HOD: 404 } },
  { ...I, method: "POST", path: "/api/v1/iqac/visits/{visitId}", summary: "The title, the dates (no schedule slot left outside them), the team, the status; audited", access: ["IQAC", "HOD"], request: c.visitUpdateSchema, response: c.visitDetailSchema, emptyBodyStatus: 200, sample: `/api/v1/iqac/visits/${F.visit}`, sampleBody: () => ({}), statusByRole: { HOD: 404 } },
  { ...I, method: "POST", path: "/api/v1/iqac/visits/{visitId}/items", summary: "A schedule slot inside the visit's days, or an evidence line pointing at a filing, an IQAC file, a metric, the NBA worksheet, an https link or a note; audited", access: ["IQAC", "HOD"], request: c.visitItemSaveSchema, response: c.visitDetailSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/visits/${F.visit}/items` },
  { ...I, method: "DELETE", path: "/api/v1/iqac/visits/{visitId}/items/{itemId}", summary: "A line taken off the file; audited", access: ["IQAC", "HOD"], response: c.visitDetailSchema, emptyBodyStatus: 404, sample: `/api/v1/iqac/visits/${F.visit}/items/zz-sweep-no-such-item` },
  { ...I, method: "GET", path: "/api/v1/iqac/visits/{visitId}/export", summary: "The schedule, the evidence index and the SAR pack as CSV (text/csv) for the team's table; audited", access: VISIT_READ, response: c.okSchema, sample: `/api/v1/iqac/visits/${F.visit}/export`, statusByRole: { HOD: 404 } },
];
