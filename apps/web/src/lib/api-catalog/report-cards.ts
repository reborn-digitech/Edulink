import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * report-cards (configurable): the office's rules — scale, co-scholastic
 * areas, exam-kind weights, term weights, layout — the class teacher's
 * co-scholastic grades, and the PDF of one card or a whole set.
 */
export const REPORT_CARDS: Endpoint[] = [
  { method: "GET", path: "/api/v1/office/report-card-config", summary: "The report card rules: grading scale, co-scholastic areas and scale, exam-kind weights, layout; with the presets and the year's terms and their weights", access: ["ADMIN", "PRINCIPAL"], response: c.reportCardConfigViewSchema },
  { method: "POST", path: "/api/v1/office/report-card-config", summary: "Replace the report card rules; cards already built keep the rules they were built with", access: ["ADMIN", "PRINCIPAL"], request: c.reportCardConfigSchema, response: c.reportCardConfigSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.reportCardConfig ? f.reportCardConfig : null) },
  { method: "POST", path: "/api/v1/office/terms/{termId}/weight", summary: "A term's share of the annual card, in percent; null clears it", access: ["ADMIN", "PRINCIPAL"], request: c.termWeightSchema, response: c.termWeightSchema, emptyBodyStatus: 422, sample: (f) => (f.termId ? `/api/v1/office/terms/${f.termId}/weight` : null), sampleBody: () => ({ weightPercent: 40 }) },
  { method: "POST", path: "/api/v1/teaching/classes/{classId}/report-cards/co-scholastic", summary: "The class teacher's co-scholastic grades on one draft card, replaced as a set; the head may only when named the class's lead", access: ["TEACHER", "ADMIN"], request: c.coScholasticSaveSchema, response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/teaching/classes/${f.classId}/report-cards/co-scholastic` : null), sampleBody: (f) => (f.draftReportCardId ? { cardId: f.draftReportCardId, grades: [{ area: "Discipline", grade: "A", note: "ZZ sweep" }] } : null) },
  { method: "GET", path: "/api/v1/shared/report-cards/{cardId}/pdf", summary: "One card as a PDF (application/pdf), for anyone who may read the card: its pupil, a guardian, its class teacher, the office", access: ["STUDENT", "PARENT", "TEACHER", "ADMIN", "PRINCIPAL"], response: c.okSchema, sample: (f) => (f.reportCardId ? `/api/v1/shared/report-cards/${f.reportCardId}/pdf` : null) },
  { method: "GET", path: "/api/v1/teaching/classes/{classId}/report-cards/pdf", summary: "Every card of the class under one title as one PDF (application/pdf), a page per pupil (?title=)", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.teachingCardsBundleQuerySchema, response: c.okSchema, sample: (f) => (f.classId && f.reportCardTitle ? `/api/v1/teaching/classes/${f.classId}/report-cards/pdf?title=${encodeURIComponent(f.reportCardTitle)}` : null) },
];
