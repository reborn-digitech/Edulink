import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { STUDIO_FIXTURE as F } from "./studio-fixture";

/**
 * the studio desk (R-56, the studio half; 10 October 2026): the studio
 * coordinator's desk under module ACADEMICS, the faculty's own doors (the
 * studios they teach, coordinate or sit on a jury for, and the jury's sheet
 * they mark, sign or post) and the student's own (their studios, stages,
 * submissions and signed results). The desk's doors carry `duties:` so the
 * gate lets a FACULTY or HOD through only holding STUDIO_COORDINATOR; the
 * faculty's own doors carry none (a juror need not hold the duty; the
 * library reads the panel), and the student's are the student's. Every
 * handler checks the role before it reads a body; samples name the fixed ids
 * of scripts/zz-studio.ts at ZZ Vidya College. No sampleBody on a write: the
 * valid body is the act. The sign door's sample is the signed jury, which the
 * chair (the sweep's FACULTY, zz.faculty01) is answered as it stands and
 * every other teacher is refused (statusByRole).
 */
const A = { module: "ACADEMICS" as const };
const DESK: c.RoleCode[] = ["ADMIN", "PRINCIPAL", "FACULTY", "HOD"];
const TEACH: c.RoleCode[] = ["FACULTY", "HOD"];

export const STUDIO_DOORS: Endpoint[] = [
  { ...A, method: "GET", path: "/api/v1/duties/studio", summary: "The studio coordinator's desk: every studio with its stages and what each waits for, the students' submission states and signed results, the juries ahead and past with their panels, the sheets waiting for the chair's signature, and the offerings and teachers the forms choose from (`offered` false without ARCHITECTURE)", access: DESK, duties: ["STUDIO_COORDINATOR"], response: c.studioDeskSchema, sample: "/api/v1/duties/studio" },
  { ...A, method: "POST", path: "/api/v1/duties/studio/studios", summary: "A studio and its four stage days, new or corrected by its id: a holder of the duty (the coordinator themself unless another holder is named) or the office, which names one (409 without ARCHITECTURE; 422 for stages out of order; audited studio.save)", access: ["ADMIN", "FACULTY", "HOD"], duties: ["STUDIO_COORDINATOR"], request: c.studioSaveSchema, response: c.studioIdSchema, emptyBodyStatus: 422 },
  { ...A, method: "POST", path: "/api/v1/duties/studio/studios/{studioId}/juries", summary: "A jury on a day with its panel — the college's own FACULTY and HOD members, one the chair, and up to two external jurors by a coded role and an institution — new or corrected by its id while unsigned; the panel is told (a holder of the duty; audited studio.jury)", access: TEACH, duties: ["STUDIO_COORDINATOR"], request: c.studioJurySaveSchema, response: c.studioIdSchema, emptyBodyStatus: 422, sample: `/api/v1/duties/studio/studios/${F.studio(1)}/juries` },
  { ...A, method: "GET", path: "/api/v1/faculty/studios", summary: "The studios I teach, coordinate or sit on a jury for (an HOD: the department's too), and those juries as sheets with what I may do to each: mark, sign, post into internal marks", access: TEACH, response: c.facultyStudiosSchema, sample: "/api/v1/faculty/studios" },
  { ...A, method: "POST", path: "/api/v1/faculty/studios/juries/{juryId}/marks", summary: "A juror on the panel writes marks out of the studio's maximum (null is absent) and a remark for the studio's registered students; 403 off the panel, 409 once signed (the one writer; audited studio.marks)", access: TEACH, request: c.studioJuryMarksSchema, response: c.studioJuryMarksSavedSchema, emptyBodyStatus: 422, sample: `/api/v1/faculty/studios/juries/${F.jury(1)}/marks` },
  { ...A, method: "POST", path: "/api/v1/faculty/studios/juries/{juryId}/sign", summary: "The chair signs the sheet once every registered student has an entry (409 short of that); the students are told; a signed sheet answers as it stands (audited studio.sign)", access: TEACH, response: c.studioJurySignedSchema, emptyBodyStatus: 200, statusByRole: { HOD: 403 }, sample: `/api/v1/faculty/studios/juries/${F.jury(1)}/sign` },
  { ...A, method: "POST", path: "/api/v1/faculty/studios/juries/{juryId}/internal", summary: "A signed sheet's marks into one of the offering's internal components, scaled to its maximum, through the internal marks' one writer (409 unsigned, released or locked; audited studio.postInternal)", access: TEACH, request: c.studioJuryInternalPostSchema, response: c.studioJuryInternalPostedSchema, emptyBodyStatus: 422, sample: `/api/v1/faculty/studios/juries/${F.jury(1)}/internal` },
  { ...A, method: "GET", path: "/api/v1/family/studios", summary: "A student's studios: the brief, the stages with their days, their own submissions and the results of the signed juries", access: ["STUDENT"], response: c.studentStudiosSchema, sample: "/api/v1/family/studios" },
  { ...A, method: "POST", path: "/api/v1/family/studios/{studioId}/submissions", summary: "A student's work for the pin-up or the final: a note and a file by upload ticket, sent (SUBMITTED by the day, LATE after it) or kept as a draft; 409 once a jury on or after the stage is signed (audited studio.submit)", access: ["STUDENT"], request: c.studioSubmissionSaveSchema, response: c.studioSubmissionSavedSchema, emptyBodyStatus: 422, sample: `/api/v1/family/studios/${F.studio(1)}/submissions` },
];
