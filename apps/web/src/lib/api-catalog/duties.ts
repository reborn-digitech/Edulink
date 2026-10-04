import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * duties (5 October 2026): the doors of the duties framework — the registrar
 * setting a college teacher's duties, and each duty's own doors, every one
 * carrying `duties:` so the session's gate lets a FACULTY or HOD through only
 * holding one (role-gate.ts). ANTI_RAGGING_SQUAD is the model the other
 * duties copy: its register under module IQAC, read by the squad member and
 * by the office and the head.
 *
 * College doors (scripts/college-doors.ts): at a school the setter answers
 * 403 MODULE_OFF by its ACADEMICS (no school has it), the register by IQAC.
 * No sampleBody on the setter: its valid body is an act, and the sweep's
 * Northgate admin is refused it by the module anyway.
 */
export const DUTY_DOORS: Endpoint[] = [
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/duties", summary: "The registrar sets a FACULTY's or HOD's duties, the whole list ([] clears); each must be one the college's streams offer (idempotent; audited people.duties.set)", access: ["ADMIN"], module: "ACADEMICS", request: c.dutiesSetSchema, response: c.memberDutiesSchema, emptyBodyStatus: 422, sample: (f) => (f.teacherMembershipId ? `/api/v1/admin/people/${f.teacherMembershipId}/duties` : null), probe: { body: () => ({ duties: [] }) } },
  { method: "GET", path: "/api/v1/duties/anti-ragging", summary: "The anti-ragging register: the hostel squad's rounds, the complaints to the anti-ragging committee (that they exist, their state and due day, never their words or who filed them) and the committee; a FACULTY or HOD on the squad, the office and the head", access: ["ADMIN", "PRINCIPAL", "FACULTY", "HOD"], duties: ["ANTI_RAGGING_SQUAD"], module: "IQAC", response: c.antiRaggingRegisterSchema, sample: "/api/v1/duties/anti-ragging" },
];
