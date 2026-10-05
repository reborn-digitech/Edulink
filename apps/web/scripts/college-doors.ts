/**
 * The college's doors: every endpoint filed in one of the college modules'
 * catalog files. At a school such a door may answer 403 MODULE_OFF, the one
 * answer a college-only door gives a school (W-17), whether or not it names a
 * `module:` (the student's ledger and the accounts desk name none; the
 * e-resources door names LIBRARY, which a school may have on, and is still a
 * college's). The API sweep judges by this set, and `api:docs` publishes it as
 * `x-college` so the phone's contract matrix judges the same way (LOAD-6,
 * 4 Oct 2026). One list, so the two cannot drift.
 */
import type { Endpoint } from "../src/lib/api-catalog";
import { ACADEMICS } from "../src/lib/api-catalog/academics";
import { EXAMS } from "../src/lib/api-catalog/exams";
import { IQAC } from "../src/lib/api-catalog/iqac";
import { PLACEMENT } from "../src/lib/api-catalog/placement";
import { COLLEGE_ADMISSIONS } from "../src/lib/api-catalog/college-admissions";
import { SCHOLARSHIPS } from "../src/lib/api-catalog/scholarships";
import { ACCOUNTS_DESK } from "../src/lib/api-catalog/accounts";
import { COLLEGE_CAMPUS } from "../src/lib/api-catalog/college-campus";
import { DUTY_DOORS } from "../src/lib/api-catalog/duties";
import { STREAM_RECORDS } from "../src/lib/api-catalog/stream-records";

export const COLLEGE_DOORS: ReadonlySet<Endpoint> = new Set<Endpoint>([...ACADEMICS, ...EXAMS, ...IQAC, ...PLACEMENT, ...COLLEGE_ADMISSIONS, ...SCHOLARSHIPS, ...ACCOUNTS_DESK, ...COLLEGE_CAMPUS, ...DUTY_DOORS, ...STREAM_RECORDS]);
