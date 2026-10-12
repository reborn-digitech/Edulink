import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * competitions-crawler: competitions suggested from the organisers' own sites (the owner, 12 October
 * 2026; docs/plans/competitions-crawler.md). The crawl is a job on the model's machine started and stopped
 * from the competitions desk (/appadmin "Suggested from the web", /root/competitions), with the sources it
 * reads; the desk's tab publishes (the existing status door), edits, dismisses, and marks a changed
 * published one reviewed. Access "app-admin", which the operator passes too: every role token the sweep
 * holds expects 403, signed out 401. The writes are sampled on ids nothing holds, so even a fence that
 * failed would change nothing (404). Every write is audited (appadmin.competitionCrawl.*,
 * appadmin.competitionSource.*, appadmin.competition.edit|dismiss|reviewed). tests/competitions-crawl.test.ts.
 */
const NO_JOB = "/api/v1/appadmin/competition-crawl/zz-sweep-no-such-crawl";
const NO_SOURCE = "/api/v1/appadmin/competition-crawl/sources/zz-sweep-no-such-source";
const NO_COMPETITION = "/api/v1/appadmin/competitions/zz-sweep-no-such-competition";

export const COMPETITION_CRAWL: Endpoint[] = [
  // ---- the crawl and its sources: seven doors ----
  { method: "GET", path: "/api/v1/appadmin/competition-crawl", summary: "The competitions crawl in hand, or the last one, with its live line (sources visited, pages read, cached hits, candidates extracted, drafts written, updated, dismissed and unchanged, published ones changed, rejects by reason, refused sites); the latest five crawls; the two model servers' state", access: "app-admin", response: c.competitionCrawlStateSchema },
  { method: "POST", path: "/api/v1/appadmin/competition-crawl", summary: "Start a crawl of the enabled sources (or those named) on this machine; brings up the model servers that are down; 201 with the crawl, 409 while another crawl is active (a quiz generation run may go on beside it)", access: "app-admin", request: c.competitionCrawlRequestSchema, response: c.competitionCrawlJobReadSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/appadmin/competition-crawl/sources", summary: "The organisers' own sites the crawler reads, with each one's last crawl (pages, cached hits, candidates, drafts, rejects, or why it was refused) and how many of its suggestions wait", access: "app-admin", response: c.competitionSourcesSchema },
  { method: "POST", path: "/api/v1/appadmin/competition-crawl/sources", summary: "Add an organiser's own site (http or https root, the organiser, the kind, whether it is the organiser's own); 201, 409 when already listed", access: "app-admin", request: c.competitionSourceAddSchema, response: c.competitionSourceReadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/appadmin/competition-crawl/sources/{sourceId}", summary: "Switch a source off or on, or remove it (a stamp: what it suggested stays on the desk, and the fixture never brings it back); answers the sources as they now stand", access: "app-admin", request: c.competitionSourceActionSchema, response: c.competitionSourcesSchema, emptyBodyStatus: 422, sample: NO_SOURCE },
  { method: "GET", path: "/api/v1/appadmin/competition-crawl/{jobId}", summary: "One crawl: its state, its live line, who started it and which model servers it brought up", access: "app-admin", response: c.competitionCrawlJobReadSchema, sample: NO_JOB },
  { method: "POST", path: "/api/v1/appadmin/competition-crawl/{jobId}/stop", summary: "Stop a crawl: the runner finishes the page in hand and halts, and the model servers this crawl brought up go down with it (or to a quiz run still going); an ended crawl is left as it is", access: "app-admin", response: c.competitionCrawlJobReadSchema, sample: `${NO_JOB}/stop` },
  // ---- the "Suggested from the web" tab ----
  { method: "GET", path: "/api/v1/appadmin/competitions/suggested", summary: "Competitions suggested from the web: the drafts waiting (SUGGESTED), the published ones whose page changed since review with the diff (CHANGED), or the dismissed (DISMISSED); each with its source, page, confidence and when it was last checked", access: "app-admin", response: c.competitionSuggestionsSchema },
  { method: "POST", path: "/api/v1/appadmin/competitions/{competitionId}/edit", summary: "Edit a platform competition's draft in place (title, summary, organiser, subject, classes, eligibility, rules, prizes, link, dates); 409 for one already published", access: "app-admin", request: c.competitionDraftEditSchema, response: c.competitionDraftEditedSchema, emptyBodyStatus: 422, sample: `${NO_COMPETITION}/edit` },
  { method: "POST", path: "/api/v1/appadmin/competitions/{competitionId}/dismiss", summary: "Dismiss a suggestion with a coded reason; it is not suggested again unless the page it came from changes", access: "app-admin", request: c.competitionDismissSchema, response: c.competitionSuggestionReadSchema, emptyBodyStatus: 422, sample: `${NO_COMPETITION}/dismiss` },
  // college-content (12 Oct 2026): who a platform competition is for, set from either desk.
  { method: "POST", path: "/api/v1/appadmin/competitions/{competitionId}/audience", summary: "Set who a platform competition is for, in any status: SCHOOL (its classes as posted), COLLEGE with zero or more streams (none: every college), or null (not set: schools and colleges alike); a tenant's competitions list shows only what fits it; audited", access: "app-admin", request: c.competitionAudienceEditSchema, response: c.competitionAudienceSetSchema, emptyBodyStatus: 422, sample: `${NO_COMPETITION}/audience` },
  { method: "POST", path: "/api/v1/appadmin/competitions/{competitionId}/reviewed", summary: "A published competition whose page changed has been looked at: the changed-since-review flag comes off and its diff is kept in the audit line", access: "app-admin", response: c.competitionSuggestionReadSchema, sample: `${NO_COMPETITION}/reviewed` },
];
