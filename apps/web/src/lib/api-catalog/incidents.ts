import * as c from "@edulink/contracts";
import type { Endpoint, SweepFixture } from "./types";

/**
 * incidents: the sick-room and incident log. Staff record and follow up
 * under /staff; a guardian reads their child's under /family.
 */
const one = (rest: string) => (f: SweepFixture) => (f.incidentId ? `/api/v1/staff/incidents/${f.incidentId}${rest}` : null);

export const INCIDENTS: Endpoint[] = [
  { method: "GET", path: "/api/v1/staff/incidents", summary: "The school's incidents for the office and the head, a teacher's own pupils' for a teacher (?status=OPEN|CLOSED|ALL&studentMembershipId=&page=)", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.incidentsQuerySchema, reach: "formTeacher", reachRefusal: "filters", response: c.incidentsListSchema },
  { method: "POST", path: "/api/v1/staff/incidents", summary: "Record an incident or a sick-room visit for a pupil; the family is told at once unless notifyGuardians is false", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.incidentCreateSchema, reach: "teachesClass", response: c.incidentSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.studentMembershipId ? { studentMembershipId: f.studentMembershipId, kind: "ILLNESS", title: "ZZ Sweep: felt unwell after lunch", body: "Rested in the sick room for twenty minutes.", actionTaken: "Water and rest.", notifyGuardians: false } : null) },
  { method: "GET", path: "/api/v1/staff/incidents/{incidentId}", summary: "One incident with its follow-up notes", access: ["TEACHER", "ADMIN", "PRINCIPAL"], reach: "teachesClass", response: c.incidentSchema, sample: one("") },
  { method: "POST", path: "/api/v1/staff/incidents/{incidentId}/notes", summary: "Add a follow-up note while the incident is open", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.incidentNoteCreateSchema, reach: "teachesClass", response: c.incidentSchema, emptyBodyStatus: 422, sample: one("/notes"), sampleBody: () => ({ body: "ZZ Sweep: guardian called back, all well." }) },
  { method: "POST", path: "/api/v1/staff/incidents/{incidentId}/close", summary: "Close an incident once follow-up is done (the office and the head)", access: ["ADMIN", "PRINCIPAL"], response: c.incidentSchema, sample: one("/close") },
  // The pupil's own log from the age the school sets (health.ts has the note on the sweep's pupil).
  { method: "GET", path: "/api/v1/family/incidents", summary: "A child's incidents and sick-room visits, with the school's follow-up (?childId=; the first child when omitted) — or the pupil's own, read-only, from the age the school sets", access: ["STUDENT", "PARENT"], request: c.familyIncidentsQuerySchema, reach: "ownChild", reachRefusal: { STUDENT: "filters" }, response: c.familyIncidentsSchema },
];
