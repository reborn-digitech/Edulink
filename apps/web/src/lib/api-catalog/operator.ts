import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * operator: the server operator's pages (/root) and the content team's
 * (/appadmin), read-only, for the phone. Neither person has a school role —
 * the access values "operator" and "app-admin" are the flags on User, read
 * by requireApiOperator / requireApiAppAdmin — so the sweep's role tokens all
 * expect 403 here, and the suite (tests/api-v1-operator.test.ts) proves the
 * 200 with a ZZ operator of its own. Every write stays on the web.
 */
export const OPERATOR: Endpoint[] = [
  // ---- /root -----------------------------------------------------------------
  { method: "GET", path: "/api/v1/operator/overview", summary: "The server: its schools (narrowed by q and state), the counts, and the scheduled jobs' health", access: "operator", request: c.operatorOverviewQuerySchema, response: c.operatorOverviewSchema },
  { method: "GET", path: "/api/v1/operator/audit", summary: "The server log: everything done from outside any school, newest first", access: "operator", request: c.operatorAuditQuerySchema, response: c.operatorAuditSchema },
  { method: "GET", path: "/api/v1/operator/experts", summary: "The expert curation queue, unpublished first", access: "operator", response: c.operatorExpertsSchema },
  // ---- /appadmin -------------------------------------------------------------
  { method: "GET", path: "/api/v1/appadmin/competitions", summary: "The platform competitions, posted for every school at once", access: "app-admin", response: c.appAdminCompetitionsSchema },
];
