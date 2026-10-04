import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { IQAC_FIXTURE as F } from "./iqac-fixture";

/**
 * iqac: the IQAC module (module IQAC, role IQAC; 4 October 2026). The desk —
 * the IQAC coordinator, the office, the principal reading — keeps the NAAC
 * cycle and its predictor, the registers, committees, surveys, grievances,
 * faculty records, the filings and the public disclosure; a teacher keeps
 * their own research and reads their offering's course feedback; the HOD
 * the department's; a student, an alumnus and a teacher answer the surveys
 * open to them, and a student raises grievances. Every door answers
 * MODULE_OFF while the college has IQAC off; every handler checks the role
 * before it reads a body. Samples name the fixed ids of scripts/zz-iqac.ts at
 * ZZ Vidya College. No sampleBody on a door whose valid body is the act (a
 * score, an answer, a grievance, a sign-off).
 */
const M = { module: "IQAC" as const };
const DESK: c.RoleCode[] = ["IQAC", "ADMIN", "PRINCIPAL"];
const DESK_WRITE: c.RoleCode[] = ["IQAC", "ADMIN"];
// PARENT answers the parent survey of a child's college (G-5, 4 Oct 2026).
const VOICE: c.RoleCode[] = ["STUDENT", "ALUMNUS", "FACULTY", "HOD", "PARENT"];
/**
 * A fixture id's twin that no row has (SWEEPS-1, 4 Oct 2026): closing the cycle and removing a research item
 * are acts with no way back, so their samples name nothing, and the desk is answered 404 with nothing changed.
 */
const NONE = (id: string) => `${id.slice(0, -2)}99`;

export const IQAC: Endpoint[] = [
  { ...M, method: "GET", path: "/api/v1/iqac/overview", summary: "The IQAC home: the open cycle's CGPA and band, the ten cheapest metrics, the registers' counts, the regulators' calendar, the NIRF estimate", access: DESK, response: c.iqacOverviewSchema },
  { ...M, method: "GET", path: "/api/v1/iqac/cycles", summary: "The college's NAAC cycles", access: DESK, response: c.iqacCyclesSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/cycles", summary: "Open a NAAC cycle over up to five years (one open at a time: 409 while one is); its quantitative metrics are computed at once", access: DESK_WRITE, request: c.iqacCycleCreateSchema, response: c.iqacCyclesSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/iqac/cycles/{cycleId}", summary: "The predictor: criteria, key indicators and metrics with value, score, why and evidence; the band, the distance to the next, the ten cheapest metrics, the trend by term", access: DESK, response: c.iqacPredictorSchema, sample: `/api/v1/iqac/cycles/${F.cycle}` },
  { ...M, method: "POST", path: "/api/v1/iqac/cycles/{cycleId}/compute", summary: "Recompute every quantitative metric from the records: a new score row each, and the CGPA's one writer", access: DESK_WRITE, response: c.iqacPredictorSchema, sample: `/api/v1/iqac/cycles/${F.cycle}/compute` },
  { ...M, method: "POST", path: "/api/v1/iqac/cycles/{cycleId}/close", summary: "Close a cycle: it reads as it stands from then on", access: DESK_WRITE, response: c.iqacCyclesSchema, sample: `/api/v1/iqac/cycles/${NONE(F.cycle)}/close` },
  { ...M, method: "POST", path: "/api/v1/iqac/cycles/{cycleId}/metrics/{metricCode}", summary: "Score a qualitative metric 0–4 with evidence: at least one registered file or one cited record (422 without)", access: ["IQAC"], request: c.iqacScoreSchema, response: c.iqacPredictorSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/cycles/${F.cycle}/metrics/${F.qualitativeMetric}` },
  { ...M, method: "POST", path: "/api/v1/iqac/cycles/{cycleId}/inputs", summary: "The figures the platform does not hold (sanctioned posts, bandwidth, expenditure…), each with the document behind it; the cycle is recomputed", access: ["IQAC"], request: c.iqacInputsSaveSchema, response: c.iqacPredictorSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/cycles/${F.cycle}/inputs` },
  { ...M, method: "GET", path: "/api/v1/iqac/evidence", summary: "The documents the IQAC cites", access: DESK, response: c.iqacFilesSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/evidence", summary: "Register an uploaded file (its upload ticket, spent) as evidence", access: DESK_WRITE, request: c.iqacEvidenceUploadSchema, response: c.iqacFilesSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/iqac/research", summary: "The research register: a teacher's own items, an HOD's department's, the desk's whole college, with the per-teacher ratios", access: [...DESK, "FACULTY", "HOD"], response: c.researchRegisterSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/research", summary: "Add a research item: a teacher's is always their own; the desk names the teacher", access: [...DESK_WRITE, "FACULTY", "HOD"], request: c.researchItemSaveSchema, response: c.researchRegisterSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/iqac/research/{itemId}/remove", summary: "Remove a research item: a teacher their own, the desk any (404 for another's)", access: [...DESK_WRITE, "FACULTY", "HOD"], response: c.researchRegisterSchema, sample: `/api/v1/iqac/research/${NONE(F.research(1))}/remove` },
  { ...M, method: "GET", path: "/api/v1/iqac/activities", summary: "The activity register (an HOD's: the department's)", access: [...DESK, "HOD"], response: c.activitiesSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/activities", summary: "Record an activity with its head count and the staff who took part", access: [...DESK_WRITE, "HOD"], request: c.activitySaveSchema, response: c.activitiesSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/iqac/committees", summary: "The committees with their members and meetings", access: DESK, response: c.committeesSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/committees", summary: "The office adds a committee with its members", access: ["ADMIN"], request: c.committeeSaveSchema, response: c.committeesSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/iqac/committees/{committeeId}/meetings", summary: "Record a meeting with its minutes: the office for any committee, the IQAC for its own cell's", access: ["ADMIN", "IQAC"], request: c.committeeMeetingSaveSchema, response: c.committeesSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/committees/${F.committee(3)}/meetings` },
  { ...M, method: "GET", path: "/api/v1/iqac/surveys", summary: "The college's surveys", access: DESK, response: c.surveysSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/surveys", summary: "Open a survey: the SSS, course feedback on an offering, exit, alumni, employer, parent or teachers'", access: DESK_WRITE, request: c.surveySaveSchema, response: c.surveysSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/iqac/surveys/{surveyId}", summary: "A survey's aggregates, never a respondent, hidden below five answers; a teacher reads their own offering's course feedback, an HOD the department's", access: [...DESK, "FACULTY", "HOD"], response: c.surveyResultsSchema, sample: `/api/v1/iqac/surveys/${F.closedSurvey}` },
  // The closed course feedback: closing it again is the same.
  { ...M, method: "POST", path: "/api/v1/iqac/surveys/{surveyId}/close", summary: "Close a survey now; its salt is wiped, so no answer can be matched to a person afterwards", access: DESK_WRITE, response: c.surveysSchema, sample: `/api/v1/iqac/surveys/${F.closedSurvey}/close` },
  { ...M, method: "POST", path: "/api/v1/iqac/surveys/{surveyId}/atr", summary: "The action-taken report on a survey, published to everyone it asked when `publish` is set", access: DESK_WRITE, request: c.actionTakenSaveSchema, response: c.surveyResultsSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/surveys/${F.closedSurvey}/atr` },
  { ...M, method: "POST", path: "/api/v1/iqac/surveys/{surveyId}/links", summary: "One signed link for one respondent of an employer's or a parent's survey: answered once, signed out, dead once the survey closes (G-5)", access: DESK_WRITE, response: c.surveyLinkSchema, sample: () => null },
  { method: "GET", path: "/api/v1/public/surveys/{token}", summary: "An employer's or a parent's survey through its signed link: title, questions, whether this link has answered; a forged, closed or wrong link is 404; rate-limited per address", access: "anyone", response: c.publicSurveySchema, sample: "/api/v1/public/surveys/x.y.z.w", emptyBodyStatus: 404 },
  { method: "POST", path: "/api/v1/public/surveys/{token}", summary: "Answer through the signed link, once (409 the second time); anonymous", access: "anyone", request: c.surveyAnswerSchema, response: c.publicSurveySchema, sample: "/api/v1/public/surveys/x.y.z.w", emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/iqac/surveys/{surveyId}/transcribe", summary: "Type in an employer's or a parent's paper form", access: DESK_WRITE, request: c.surveyTranscribeSchema, response: c.surveyResultsSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/surveys/${F.closedSurvey}/transcribe` },
  { ...M, method: "GET", path: "/api/v1/iqac/grievances", summary: "Student grievances with the UGC 2023 time limit and the month's summary; ragging and harassment are read by the office and the head alone", access: DESK, response: c.grievanceDeskSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/grievances/{grievanceId}", summary: "Acknowledge, resolve or send to the Ombudsperson; the student is told", access: ["ADMIN", "PRINCIPAL"], request: c.grievanceActionSchema, response: c.grievanceDeskSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/grievances/${F.resolvedGrievance}` },
  { ...M, method: "GET", path: "/api/v1/iqac/faculty-records", summary: "Every teacher's record: designation, appointment, qualification, experience, API score, PAN by its last four", access: DESK, response: c.facultyRecordsSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/faculty-records", summary: "The office writes a teacher's record; a PAN is sealed and never logged", access: ["ADMIN"], request: c.facultyRecordSaveSchema, response: c.facultyRecordsSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/iqac/faculty-records/mine", summary: "A teacher's own record, publications and FDPs (null until the office writes it)", access: ["FACULTY", "HOD"], response: c.myFacultyProfileSchema },
  { ...M, method: "GET", path: "/api/v1/iqac/filings", summary: "The filings generated, each with its fingerprint, status and figures", access: DESK, response: c.collegeFilingsSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/filings", summary: "Generate a filing from the live records: SSR, AQAR, IIQA, NIRF, AISHE, the AICTE disclosure or the affiliation return", access: DESK_WRITE, request: c.collegeFilingGenerateSchema, response: c.collegeFilingsSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/iqac/filings/{filingId}/file", summary: "The filing itself: its CSV as generated (text/csv), or its PDF drawn from the frozen record (application/pdf); audited", access: DESK, response: c.okSchema, sample: `/api/v1/iqac/filings/${F.aqar}/file` },
  // The fixture's AQAR is signed off and filed: sending it again changes nothing.
  { ...M, method: "POST", path: "/api/v1/iqac/filings/{filingId}/submit", summary: "Send a NAAC document to the principal for sign-off (the principal is told)", access: DESK_WRITE, response: c.collegeFilingsSchema, sample: `/api/v1/iqac/filings/${F.aqar}/submit` },
  { ...M, method: "POST", path: "/api/v1/iqac/filings/{filingId}/signoff", summary: "The principal signs off a NAAC document or returns it with a note (409 unless it waits)", access: ["PRINCIPAL"], request: c.collegeFilingSignoffSchema, response: c.collegeFilingsSchema, emptyBodyStatus: 422, sample: `/api/v1/iqac/filings/${F.aqar}/signoff` },
  { ...M, method: "POST", path: "/api/v1/iqac/filings/{filingId}/filed", summary: "Mark a filing as filed on the portal, with the portal's acknowledgement if there is one", access: DESK_WRITE, request: c.filingFiledSchema, response: c.collegeFilingsSchema, emptyBodyStatus: 200, sample: `/api/v1/iqac/filings/${F.aqar}/filed`, sampleBody: () => ({ fileId: null }) },
  { ...M, method: "GET", path: "/api/v1/iqac/disclosure", summary: "Whether the AICTE mandatory disclosure is published, and where", access: DESK, response: c.disclosureSchema },
  { ...M, method: "POST", path: "/api/v1/iqac/disclosure", summary: "Publish a fresh snapshot of the AICTE disclosure at /public/disclosure/{slug}, or take it down (audited)", access: DESK_WRITE, request: c.disclosureSetSchema, response: c.disclosureSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/voice", summary: "The surveys open to me (the SSS, my offerings' course feedback and the exit survey for a student; the alumni survey for an alumnus; the teachers' survey for faculty) and a student's own grievances", access: VOICE, response: c.voiceSchema },
  { ...M, method: "POST", path: "/api/v1/voice/surveys/{surveyId}", summary: "Answer a survey once (409 the second time); an anonymous survey keeps no name", access: VOICE, request: c.surveyAnswerSchema, response: c.voiceSchema, emptyBodyStatus: 422, sample: `/api/v1/voice/surveys/${F.openSurvey}` },
  { ...M, method: "POST", path: "/api/v1/voice/grievances", summary: "A student raises a grievance with the committee: due in fifteen working days (UGC 2023); ragging goes to the anti-ragging committee with the UGC portal named as the legal route", access: ["STUDENT"], request: c.grievanceFileSchema, response: c.voiceSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/voice/grievances/{grievanceId}/escalate", summary: "Take my grievance to the Ombudsperson once the committee is past its limit or has decided (409 before)", access: ["STUDENT"], request: c.grievanceEscalateSchema, response: c.voiceSchema, emptyBodyStatus: 422, sample: `/api/v1/voice/grievances/${F.openGrievance}/escalate` },
];
