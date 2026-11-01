import * as c from "@edulink/contracts";
import type { Endpoint, SweepFixture } from "./types";

/**
 * health: the pupil's health and emergency card. A guardian reads and writes
 * their own child's under /family; the office, the head and the child's
 * teachers read under /staff, the office and the head write and record
 * check-ups.
 */
const pupil = (rest: string) => (f: SweepFixture) => (f.studentMembershipId ? `/api/v1/staff/pupils/${f.studentMembershipId}/health${rest}` : null);

export const HEALTH: Endpoint[] = [
  // The pupil's own card from the age the school sets (School.selfReadAge, below): the sweep's pupil answers 200 only where the ZZ school has the age set and the pupil a date of birth, 403 otherwise.
  { method: "GET", path: "/api/v1/family/health", summary: "A child's health and emergency card as the guardian sees it (?childId=; the first child when omitted) — or the pupil's own, read-only, from the age the school sets", access: ["STUDENT", "PARENT"], request: c.familyHealthQuerySchema, reach: "ownChild", response: c.healthCardSchema },
  { method: "POST", path: "/api/v1/family/health", summary: "Write a child's health card (the whole card; a cleared field stays cleared)", access: ["PARENT"], request: c.familyHealthSaveSchema, reach: "ownChild", response: c.healthCardSchema, emptyBodyStatus: 200, sampleBody: () => ({ allergies: "Peanuts", contacts: [{ name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" }] }) },
  { method: "GET", path: "/api/v1/staff/pupils/{membershipId}/health", summary: "One pupil's health and emergency card, for the office, the head and the pupil's teachers", access: ["TEACHER", "ADMIN", "PRINCIPAL"], reach: "formTeacher", response: c.healthCardSchema, sample: pupil("") },
  { method: "POST", path: "/api/v1/staff/pupils/{membershipId}/health", summary: "Write one pupil's health card (the office and the head)", access: ["ADMIN", "PRINCIPAL"], request: c.healthCardSaveSchema, reach: "ownSchool", response: c.healthCardSchema, emptyBodyStatus: 200, sample: pupil(""), sampleBody: () => ({ bloodGroup: "B+", allergies: "Peanuts", notes: "Carries an inhaler." }) },
  { method: "POST", path: "/api/v1/staff/pupils/{membershipId}/health/checks", summary: "Record a check-up: height, weight, sight (the office and the head)", access: ["ADMIN", "PRINCIPAL"], request: c.healthCheckSaveSchema, reach: "ownSchool", response: c.healthCardSchema, emptyBodyStatus: 422, sample: pupil("/checks"), sampleBody: (f) => ({ dateKey: f.todayKey, heightCm: 132, weightGrams: 29_500 }) },
  { method: "GET", path: "/api/v1/office/self-read-age", summary: "From what age a pupil may read their own health card and incidents (null: never)", access: ["ADMIN", "PRINCIPAL"], response: c.selfReadAgeSchema },
  // The sample sends back the age zz:fixtures sets (8), a no-op: any other age turns the sweep's eight-year-old pupil away from /family/health and /family/incidents for the rest of the run.
  { method: "POST", path: "/api/v1/office/self-read-age", summary: "Set the age from which pupils read their own health card and incidents; null switches it off (the office)", access: ["ADMIN"], request: c.selfReadAgeSchema, response: c.selfReadAgeSchema, emptyBodyStatus: 422, sampleBody: () => ({ selfReadAge: 8 }) },
];
