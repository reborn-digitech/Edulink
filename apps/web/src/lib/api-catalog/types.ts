/**
 * Every /api/v1 endpoint, as data.
 *
 * ONE LIST, THREE READERS. The OpenAPI document is generated from it
 * (scripts/gen-openapi.ts), the API sweep walks it as every role
 * (scripts/api-sweep.ts), and a test refuses a route file that is not in it
 * or an entry with no route file. A handler that exists but is not listed is
 * a handler nobody documents and nobody sweeps, which is how the web app's
 * two "routes that did not exist" happened.
 *
 * `access` is who may call it: which roles answer 2xx/422 rather than 403.
 * `"anyone"` means signed-out too; `"signed-in"` means any session;
 * `"operator"` is the server operator alone (User.isSuperuser) and
 * `"app-admin"` the content team (User.isAppAdmin, the operator too) — neither
 * is a school role, so every role token the sweep holds expects 403 there. The
 * sweep sends every listed role and asserts the status alone. `sample` gives a
 * concrete path for endpoints with a parameter, filled from the ZZ fixture
 * by the sweep; without one the sweep skips the endpoint and says so.
 */
import type { ZodTypeAny } from "zod";
import type { RoleCode } from "@edulink/contracts";

export type Access = "anyone" | "signed-in" | "operator" | "app-admin" | RoleCode[];

export type Endpoint = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: `/api/v1/${string}`;
  summary: string;
  access: Access;
  request?: ZodTypeAny;
  response: ZodTypeAny;
  /** For the sweep: the status a permitted role gets with an empty body. */
  emptyBodyStatus?: number;
  /**
   * For the sweep: the path with its parameters filled from the ZZ fixture.
   * A string for a fixed path; a function for one that needs an id. Returning
   * null (the fixture lacks that thing) makes the sweep skip and say so.
   */
  sample?: string | ((fixture: SweepFixture) => string | null);
  /** For a body-taking endpoint: a valid body from the fixture, so the sweep can assert 200 as well as 422. */
  sampleBody?: (fixture: SweepFixture) => Record<string, unknown> | null;
};

/**
 * What the sweep resolves once from ZZ Northgate before walking the catalog.
 * Every field may be null when the fixture lacks the thing; add a field here
 * (and to scripts/api-sweep.ts's resolver) rather than hard-coding an id.
 */
export type SweepFixture = {
  schoolId: string;
  classId: string | null;
  studentMembershipId: string | null;
  teacherMembershipId: string | null;
  adminMembershipId: string | null;
  examSeriesId: string | null;
  examSlotId: string | null;
  assignmentId: string | null;
  postId: string | null;
  conversationId: string | null;
  remarkThreadId: string | null;
  competitionId: string | null;
  vacancyId: string | null;
  enquiryId: string | null;
  meetingSlotId: string | null;
  inviteId: string | null;
  leaveRequestId: string | null;
  reviewRoundId: string | null;
  academicYearId: string | null;
  termId: string | null;
  notificationId: string | null;
  fileId: string | null;
  todayKey: string;
};

