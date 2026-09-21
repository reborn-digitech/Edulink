import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * filings: the returns a school files with UDISE+ and its board — the
 * school's filing identity, who is ready, and the five sheets as CSV text.
 */
export const FILINGS: Endpoint[] = [
  { method: "GET", path: "/api/v1/office/filings", summary: "The school's filing identity (UDISE code, board, affiliation, district, block, medium, management), what is still blank on it and on the pupils' and teachers' records, and the grades a board sheet can be cut for", access: ["ADMIN", "PRINCIPAL"], response: c.filingsViewSchema },
  { method: "POST", path: "/api/v1/office/filings/identity", summary: "Set what the portals know the school as; a blank clears the field", access: ["ADMIN"], request: c.filingIdentitySaveSchema, response: c.filingsViewSchema, emptyBodyStatus: 200, sampleBody: () => ({ board: "MSBSHSE", medium: "Marathi" }) },
  { method: "GET", path: "/api/v1/office/filings/export/udise-students", summary: "The UDISE+ student module's bulk sheet: its fifty-four columns in order with its codes, one row per pupil, Aadhaar blank, dates DD-MM-YYYY. Audited", access: ["ADMIN"], response: c.officeCsvExportSchema },
  { method: "GET", path: "/api/v1/office/filings/export/udise-enrolment", summary: "The enrolment tables the portal derives: class by gender by social category, minority, age and impairment, no child named. Audited", access: ["ADMIN"], response: c.officeCsvExportSchema },
  { method: "GET", path: "/api/v1/office/filings/export/udise-teachers", summary: "The UDISE+ teacher profile (DCF §3.2) one row per teacher and the head, in the form's order and codes. Audited", access: ["ADMIN"], response: c.officeCsvExportSchema },
  { method: "GET", path: "/api/v1/office/filings/export/cbse-candidates", summary: "A grade's candidates in the CBSE registration order with Annexure H/K subject codes, for checking the List of Candidates (?grade=). Audited", access: ["ADMIN"], request: c.filingExportQuerySchema, response: c.officeCsvExportSchema, sample: "/api/v1/office/filings/export/cbse-candidates?grade=10" },
  { method: "GET", path: "/api/v1/office/filings/export/msbshse-candidates", summary: "A grade's candidates in the Maharashtra board's pre-list order, names in English and the school's script, SSC subject codes (?grade=). Audited", access: ["ADMIN"], request: c.filingExportQuerySchema, response: c.officeCsvExportSchema, sample: "/api/v1/office/filings/export/msbshse-candidates?grade=10" },
];
