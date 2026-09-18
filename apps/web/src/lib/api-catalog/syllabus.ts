import * as c from "@edulink/contracts";
import type { Endpoint, SweepFixture } from "./types";

/** syllabus: the office's chapter lists, a class's progress and lessons, the head's coverage. */
const forClass = (rest: string) => (f: SweepFixture) => (f.classId ? `/api/v1/staff/syllabus${rest}?classId=${f.classId}` : null);

export const SYLLABUS: Endpoint[] = [
  { method: "GET", path: "/api/v1/office/syllabus", summary: "The chapter lists per grade and subject, and one list in full (?gradeLevel=&subject=)", access: ["ADMIN", "PRINCIPAL"], request: c.officeSyllabusQuerySchema, response: c.officeSyllabusSchema },
  { method: "POST", path: "/api/v1/office/syllabus", summary: "Replace one grade and subject's list in order; a unit sent with its id keeps its progress", access: ["ADMIN", "PRINCIPAL"], request: c.officeSyllabusSaveSchema, response: c.officeSyllabusSavedSchema, emptyBodyStatus: 422, sampleBody: () => ({ gradeLevel: "ZZ sweep", subject: "ZZ Sweep Subject", units: [{ title: "ZZ Chapter 1" }] }) },
  { method: "GET", path: "/api/v1/office/syllabus/coverage", summary: "Coverage per class and subject against the year, and how many classes are behind", access: ["ADMIN", "PRINCIPAL"], response: c.syllabusCoverageSchema },
  { method: "GET", path: "/api/v1/staff/syllabus", summary: "One class's units with progress and its lessons (?classId=&subject=)", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.staffSyllabusQuerySchema, response: c.staffSyllabusSchema, sample: forClass("") },
  { method: "POST", path: "/api/v1/staff/syllabus/progress", summary: "Move a unit to not started, in progress or done for a class", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.syllabusProgressSaveSchema, response: c.okSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.classId && f.syllabusUnitId ? { classId: f.classId, unitId: f.syllabusUnitId, status: "IN_PROGRESS" } : null) },
  { method: "POST", path: "/api/v1/staff/lessons", summary: "Plan or log a lesson for a class; taught with a unit moves the unit along", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.lessonPlanSaveSchema, response: c.lessonPlanSavedSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.classId ? { classId: f.classId, subject: "ZZ Sweep Subject", dateKey: f.todayKey, topic: "ZZ Sweep lesson", status: "PLANNED" } : null) },
  { method: "POST", path: "/api/v1/staff/lessons/{lessonId}/status", summary: "Mark a lesson planned, taught or skipped", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.lessonStatusSaveSchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.lessonPlanId ? `/api/v1/staff/lessons/${f.lessonPlanId}/status` : null), sampleBody: () => ({ status: "TAUGHT" }) },
];
