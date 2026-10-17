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
import { DUTY_DOORS } from "./api-catalog/duties";
// The studio desk (R-56, the studio half, 10 Oct 2026).
import { STUDIO_DOORS } from "./api-catalog/studio";
import { STREAM_RECORDS } from "./api-catalog/stream-records";
import { UNVERSIONED } from "./api-catalog/unversioned";
import { OFFICE_YEAR } from "./api-catalog/office-year";
import { OFFICE_WRITES } from "./api-catalog/office-writes";
import { COLLEGE_HOMEWORK } from "./api-catalog/college-homework";
import { PLAN_ITEMS } from "./api-catalog/plan-items";
import { COLLEGE_EXTRAS } from "./api-catalog/college-extras";
import { ASSISTANT } from "./api-catalog/assistant";
// The owner's decisions of 10 Oct 2026 (decisions builder): settle on leaving, the previous schools, the record copy.
import { OWNER_DECISIONS } from "./api-catalog/owner-decisions";
// The generated bank's review queue (review-queue builder, 10 Oct 2026).
import { QUIZ_REVIEW } from "./api-catalog/quiz-review";
import { QUIZ_JOBS } from "./api-catalog/quiz-jobs"; // quiz-publish-jobs (11 Oct 2026)
import { COMPETITION_CRAWL } from "./api-catalog/competition-crawl"; // competitions-crawler (12 Oct 2026)
// website-builder A (15 Oct 2026): a school's public website, the draft, publish and the public read.
import { WEBSITE } from "./api-catalog/website";
// end website-builder A
// website-builder B (15 Oct 2026): a school's own domain for its public website.
import { WEBSITE_DOMAINS } from "./api-catalog/website-domains";
// end website-builder B
// meta-posting (16 Oct 2026): a school's Facebook Page and Instagram account, and the copies of its posts sent there.
import { SOCIAL } from "./api-catalog/social";
// end meta-posting
import type { Endpoint } from "./api-catalog/types";

export const ENDPOINTS: Endpoint[] = [...CORE, ...ADMIN, ...STAFF, ...FAMILY, ...SHARED, ...OPERATOR, ...PRACTICE, ...COMMUNITY, ...TEACHING, ...OFFICE, ...ACCOUNT, ...CONTEST, ...JOIN, ...FEES, ...MESSAGING, ...HEALTH, ...INCIDENTS, ...CIRCULARS, ...STAFF_ATTENDANCE, ...SYLLABUS, ...SUBSTITUTIONS, ...REPORT_CARDS, ...CERTIFICATES, ...ADMISSIONS, ...FILINGS, ...GIGS, ...TRANSPORT, ...ALUMNI, ...INVENTORY, ...PAYROLL, ...LIBRARY, ...HOSTEL, ...COLLEGE, ...ACADEMICS, ...PLACEMENT, ...EXAMS, ...IQAC, ...COLLEGE_ADMISSIONS, ...SCHOLARSHIPS, ...ACCOUNTS_DESK, ...COLLEGE_CAMPUS, ...OPERATOR_COLLEGE, ...DUTY_DOORS, ...STUDIO_DOORS, ...STREAM_RECORDS, ...OFFICE_YEAR, ...OFFICE_WRITES, ...COLLEGE_EXTRAS, ...UNVERSIONED, ...COLLEGE_HOMEWORK, ...PLAN_ITEMS, ...ASSISTANT, ...OWNER_DECISIONS, ...QUIZ_REVIEW, ...QUIZ_JOBS, ...COMPETITION_CRAWL];
// website-builder A
ENDPOINTS.push(...WEBSITE);
// end website-builder A
// website-builder B
ENDPOINTS.push(...WEBSITE_DOMAINS);
// end website-builder B
// meta-posting
ENDPOINTS.push(...SOCIAL);
// end meta-posting
// plans-pay (17 Oct 2026): passes bought through the company's gateway, the person's doors (the operator's are in operator.ts).
import { PASSES } from "./api-catalog/passes";
ENDPOINTS.push(...PASSES);
// end plans-pay
