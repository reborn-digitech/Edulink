import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { ACADEMICS_FIXTURE } from "./academics-fixture";
import { COLLEGE_HOMEWORK_FIXTURE as F } from "./college-homework-fixture";

/**
 * homework at a college (R-48 / A3-inventory-6, the risks batch of 5 October
 * 2026): the teacher's side of a piece of work set to a course offering. The
 * student's side is the school's own doors — the work list
 * (/api/v1/family/student/assignments) and the hand-in with photographs
 * (/api/v1/family/student/submissions) — which read an offering's work for its
 * registered students. Module ACADEMICS; FACULTY and HOD, the role checked
 * before the body; the library refuses anyone who neither teaches the
 * offering nor heads its department. Samples at ZZ Vidya College
 * (scripts/zz-college-homework.ts). No sampleBody on the marks or the posting:
 * the valid body is the act.
 */
const A = { module: "ACADEMICS" as const };
const TEACH: c.RoleCode[] = ["FACULTY", "HOD"];

export const COLLEGE_HOMEWORK: Endpoint[] = [
  { ...A, method: "GET", path: "/api/v1/academics/work", summary: "The offerings the caller teaches (an HOD: the department's too), each with its homework count and the hand-ins waiting for a mark", access: TEACH, response: c.collegeWorkHomeSchema, sample: "/api/v1/academics/work" },
  { ...A, method: "GET", path: "/api/v1/academics/offerings/{offeringId}/work", summary: "One offering's homework, newest first, with hand-ins and marks against the registered students, and the internal components its marks may go into (403 to a teacher who neither teaches it nor heads its department)", access: TEACH, response: c.collegeOfferingWorkSchema, sample: `/api/v1/academics/offerings/${ACADEMICS_FIXTURE.offering(1)}/work` },
  { ...A, method: "POST", path: "/api/v1/academics/offerings/{offeringId}/work", summary: "Set a piece of work on the offering, as a draft or published to its REGISTERED students, with handouts uploaded through /api/v1/uploads; a due date already past is a 422 on dueAt unless confirmPastDue (audited)", access: TEACH, request: c.collegeWorkSaveSchema, response: c.collegeWorkCreatedSchema, emptyBodyStatus: 422, sample: `/api/v1/academics/offerings/${ACADEMICS_FIXTURE.offering(1)}/work` },
  { ...A, method: "GET", path: "/api/v1/academics/work/{assignmentId}", summary: "One piece of an offering's homework: its registered students, what each handed in (words and photographs), their marks, and the internal components still open", access: TEACH, response: c.collegeWorkGradebookSchema, sample: `/api/v1/academics/work/${F.work(1)}` },
  { ...A, method: "POST", path: "/api/v1/academics/work/{assignmentId}/publish", summary: "Publish a draft; the registered students (and the guardians an adult student lets see results) are told; already published answers as it stands", access: TEACH, response: c.collegeWorkPublishedSchema, emptyBodyStatus: 200, sample: `/api/v1/academics/work/${F.work(1)}/publish` },
  { ...A, method: "POST", path: "/api/v1/academics/work/{assignmentId}/grades", summary: "Marks and comments for an offering's work, as a batch (replay-safe; a student's first mark tells them); a student not registered on the offering is returned as rejected", access: TEACH, request: c.collegeWorkGradesSchema, response: c.collegeWorkGradesSavedSchema, emptyBodyStatus: 422, sample: `/api/v1/academics/work/${F.work(1)}/grades` },
  { ...A, method: "POST", path: "/api/v1/academics/work/{assignmentId}/internal", summary: "Post the work's marks into one of the offering's internal components, scaled to its maximum, through the internal marks' one writer: 409 once the component is released or the offering locked, a change takes the countersign away (audited)", access: TEACH, request: c.collegeWorkPostSchema, response: c.collegeWorkPostedSchema, emptyBodyStatus: 422, sample: `/api/v1/academics/work/${F.work(1)}/internal` },
];
