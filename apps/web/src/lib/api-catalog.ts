/**
 * Every /api/v1 endpoint, as data — see ./api-catalog/types.ts for what an
 * entry says and why the list exists (the OpenAPI document, the API sweep and
 * the catalog test all read it). One file per area so several hands can add
 * endpoints without editing the same lines.
 */
export type { Endpoint, Access, SweepFixture } from "./api-catalog/types";
import { CORE } from "./api-catalog/core";
import { ADMIN } from "./api-catalog/admin";
import { STAFF } from "./api-catalog/staff";
import { FAMILY } from "./api-catalog/family";
import { SHARED } from "./api-catalog/shared";
import { OPERATOR } from "./api-catalog/operator";
import { PRACTICE } from "./api-catalog/practice";
import { COMMUNITY } from "./api-catalog/community";
import { TEACHING } from "./api-catalog/teaching";
import { OFFICE } from "./api-catalog/office";
import { ACCOUNT } from "./api-catalog/account";
import { CONTEST } from "./api-catalog/contest";
import { JOIN } from "./api-catalog/join";
import { FEES } from "./api-catalog/fees";
import { MESSAGING } from "./api-catalog/messaging";
import { HEALTH } from "./api-catalog/health";
import { INCIDENTS } from "./api-catalog/incidents";
import { CIRCULARS } from "./api-catalog/circulars";
import { STAFF_ATTENDANCE } from "./api-catalog/staff-attendance";
import { SYLLABUS } from "./api-catalog/syllabus";
import { SUBSTITUTIONS } from "./api-catalog/substitutions";
import { REPORT_CARDS } from "./api-catalog/report-cards";
import { CERTIFICATES } from "./api-catalog/certificates";
import { ADMISSIONS } from "./api-catalog/admissions";
import { FILINGS } from "./api-catalog/filings";
import type { Endpoint } from "./api-catalog/types";

export const ENDPOINTS: Endpoint[] = [...CORE, ...ADMIN, ...STAFF, ...FAMILY, ...SHARED, ...OPERATOR, ...PRACTICE, ...COMMUNITY, ...TEACHING, ...OFFICE, ...ACCOUNT, ...CONTEST, ...JOIN, ...FEES, ...MESSAGING, ...HEALTH, ...INCIDENTS, ...CIRCULARS, ...STAFF_ATTENDANCE, ...SYLLABUS, ...SUBSTITUTIONS, ...REPORT_CARDS, ...CERTIFICATES, ...ADMISSIONS, ...FILINGS];
