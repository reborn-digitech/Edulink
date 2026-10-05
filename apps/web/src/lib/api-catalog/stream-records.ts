import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { ACADEMICS_FIXTURE } from "./academics-fixture";
import { STREAM_RECORDS_FIXTURE as F } from "./stream-records-fixture";

/**
 * stream records (5 October 2026): the records a college keeps because of
 * what it teaches — lab batches and the practical record (module ACADEMICS),
 * moot courts (ACADEMICS) and a law college's internship weeks (PLACEMENT),
 * and the year's summaries the filings and the homes read. The duties' own
 * desks are in duties.ts (DUTY_DOORS). Every handler checks the role before
 * it reads a body; samples name the fixed ids of scripts/zz-stream-records.ts
 * and zz-academics.ts at ZZ Vidya College. No sampleBody on a door whose valid
 * body is the act (a split, a move, a record, a signature, a moot).
 */
const A = { module: "ACADEMICS" as const };
const READ: c.RoleCode[] = ["ADMIN", "PRINCIPAL", "HOD", "FACULTY"];

export const STREAM_RECORDS: Endpoint[] = [
  { ...A, method: "GET", path: "/api/v1/stream-records/lab-batches", summary: "Every division (or one) with its lab batches and the students in none, and whether the college's streams keep labs", access: READ, request: c.labBatchesQuerySchema, response: c.labBatchesSchema, sample: "/api/v1/stream-records/lab-batches" },
  { ...A, method: "POST", path: "/api/v1/stream-records/lab-batches/split", summary: "The office splits a division evenly into lab batches of at most a size (default 20) by roll number, named A, B, C… (409 at a college whose streams keep no labs; audited)", access: ["ADMIN"], request: c.labBatchSplitSchema, response: c.labBatchesSchema, emptyBodyStatus: 422 },
  { ...A, method: "POST", path: "/api/v1/stream-records/lab-batches/{batchId}/members", summary: "The office moves students of the batch's division into it, out of their other batch (audited)", access: ["ADMIN"], request: c.labBatchMoveSchema, response: c.labBatchesSchema, emptyBodyStatus: 422, sample: `/api/v1/stream-records/lab-batches/${F.vidyaBatch(1)}/members` },
  { ...A, method: "GET", path: "/api/v1/stream-records/practicals", summary: "The practical record: the offerings with practicals the caller may keep or read (a lab in-charge reads every one), and one offering's students with their batch and the experiments recorded", access: READ, request: c.practicalsQuerySchema, response: c.practicalSheetSchema, sample: `/api/v1/stream-records/practicals?offeringId=${ACADEMICS_FIXTURE.offering(1)}` },
  { ...A, method: "POST", path: "/api/v1/stream-records/practicals", summary: "One experiment for some of an offering's students — by its teacher or its department's HOD; a signed row is a 409, a day in the future or a student not registered a 422 (audited)", access: ["FACULTY", "HOD"], request: c.practicalSaveSchema, response: c.streamRecordsCountSchema, emptyBodyStatus: 422 },
  { ...A, method: "POST", path: "/api/v1/stream-records/practicals/sign", summary: "Sign practical-record rows: the offering's teacher, its HOD, or a member holding LAB_INCHARGE (403 for anyone else's offering; audited)", access: ["FACULTY", "HOD"], request: c.practicalSignSchema, response: c.streamRecordsCountSchema, emptyBodyStatus: 422 },
  { ...A, method: "GET", path: "/api/v1/stream-records/moot-courts", summary: "A law college's moot courts with their teams, outcomes, result and the judges' notes (`offered` false without LAW)", access: READ, response: c.mootCourtsSchema, sample: "/api/v1/stream-records/moot-courts" },
  { ...A, method: "POST", path: "/api/v1/stream-records/moot-courts", summary: "A moot recorded, or corrected by its id; every team member a student of the college (409 without LAW; audited)", access: ["ADMIN", "HOD", "FACULTY"], request: c.mootCourtSaveSchema, response: c.streamRecordsIdSchema, emptyBodyStatus: 422 },
  { module: "PLACEMENT", method: "GET", path: "/api/v1/stream-records/law-internships", summary: "The BCI's internship weeks per law student against the course's minimum (20 weeks over five years, 12 over three), the year's court, firm and legal-aid internships and its moots", access: ["ADMIN", "PRINCIPAL", "HOD", "TPO"], request: c.lawInternshipsQuerySchema, response: c.lawInternshipSummarySchema, sample: "/api/v1/stream-records/law-internships" },
  { ...A, method: "GET", path: "/api/v1/stream-records/summary", summary: "The year's stream records for the office and the head: the practical record, law internships and moots, teaching practice, NSS and NCC, and which the college's streams make its own", access: ["ADMIN", "PRINCIPAL"], request: c.streamRecordsSummaryQuerySchema, response: c.streamRecordsSummarySchema, sample: "/api/v1/stream-records/summary" },
];
