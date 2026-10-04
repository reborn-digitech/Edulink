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
import { GIGS } from "./api-catalog/gigs";
import { TRANSPORT } from "./api-catalog/transport";
import { ALUMNI } from "./api-catalog/alumni";
import { COLLEGE } from "./api-catalog/college";
import { PLACEMENT } from "./api-catalog/placement";
import { INVENTORY } from "./api-catalog/inventory";
import { PAYROLL } from "./api-catalog/payroll";
import { LIBRARY } from "./api-catalog/library";
import { HOSTEL } from "./api-catalog/hostel";
import { ACADEMICS } from "./api-catalog/academics";
import { EXAMS } from "./api-catalog/exams";
import { IQAC } from "./api-catalog/iqac";
import { COLLEGE_ADMISSIONS } from "./api-catalog/college-admissions";
import { SCHOLARSHIPS } from "./api-catalog/scholarships";
import { ACCOUNTS_DESK } from "./api-catalog/accounts";
import { COLLEGE_CAMPUS } from "./api-catalog/college-campus";
import { OPERATOR_COLLEGE } from "./api-catalog/operator-college";
import type { Endpoint } from "./api-catalog/types";

export const ENDPOINTS: Endpoint[] = [...CORE, ...ADMIN, ...STAFF, ...FAMILY, ...SHARED, ...OPERATOR, ...PRACTICE, ...COMMUNITY, ...TEACHING, ...OFFICE, ...ACCOUNT, ...CONTEST, ...JOIN, ...FEES, ...MESSAGING, ...HEALTH, ...INCIDENTS, ...CIRCULARS, ...STAFF_ATTENDANCE, ...SYLLABUS, ...SUBSTITUTIONS, ...REPORT_CARDS, ...CERTIFICATES, ...ADMISSIONS, ...FILINGS, ...GIGS, ...TRANSPORT, ...ALUMNI, ...INVENTORY, ...PAYROLL, ...LIBRARY, ...HOSTEL, ...COLLEGE, ...ACADEMICS, ...PLACEMENT, ...EXAMS, ...IQAC, ...COLLEGE_ADMISSIONS, ...SCHOLARSHIPS, ...ACCOUNTS_DESK, ...COLLEGE_CAMPUS, ...OPERATOR_COLLEGE];
