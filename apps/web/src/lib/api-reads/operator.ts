import "server-only";
import type { ActiveContext } from "@/lib/session";
import type { OperatorOverviewQuery } from "@edulink/contracts";
import { listAppAdmins, listExpertsForCuration, listSchools } from "@/lib/superuser";
import { jobStatuses } from "@/lib/jobs";
import { listPlatformCompetitions } from "@/lib/app-admin";

/**
 * The operator's and the content team's reads, as functions.
 *
 * Each reproduces one page under /root or /appadmin — the same lib call the
 * page makes, with the same flag asserted inside it (assertSuperuser,
 * assertAppAdmin) — and returns the plain shape the contract describes. The
 * caller has already passed requireApiOperator / requireApiAppAdmin; the lib
 * asserts again because that is where the boundary lives. Nothing here takes
 * a school id: the operator reads the server whole, the content team reads
 * tables no school owns.
 */

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/* -------------------------------------------------------------------------- */
/* /root                                                                       */
/* -------------------------------------------------------------------------- */

export async function operatorOverview(ctx: ActiveContext, query: OperatorOverviewQuery) {
  const [shown, all, appAdmins, experts, jobs] = await Promise.all([
    listSchools(ctx, { q: query.q, state: query.state }),
    listSchools(ctx, { state: "all" }),
    listAppAdmins(ctx),
    listExpertsForCuration(ctx),
    jobStatuses(),
  ]);
  const live = all.filter((s) => !s.removedAt);
  // listSchools already orders newest first; a removed school sinks below the live ones.
  const ordered = [...shown].sort((a, b) => Number(Boolean(a.removedAt)) - Number(Boolean(b.removedAt))).slice(0, 200);
  return {
    counts: {
      live: live.length,
      removed: all.length - live.length,
      noAdmin: live.filter((s) => s.pendingAdminInvites > 0).length,
      appAdmins: appAdmins.length,
      expertsWaiting: experts.filter((e) => e.publishedAt === null).length,
    },
    schools: ordered.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      country: s.country,
      code: s.code,
      gradeLow: s.gradeLow,
      gradeHigh: s.gradeHigh,
      createdAt: iso(s.createdAt),
      removedAt: isoOrNull(s.removedAt),
      pendingAdminInvites: s.pendingAdminInvites,
    })),
    jobs: jobs.map((j) => ({
      name: j.name,
      schedule: j.schedule,
      describeKey: j.describeKey,
      lastRun: j.lastRun
        ? { startedAt: iso(j.lastRun.startedAt), finishedAt: isoOrNull(j.lastRun.finishedAt), ok: j.lastRun.ok, summary: j.lastRun.summary, error: j.lastRun.error }
        : null,
      lastSuccessAt: isoOrNull(j.lastSuccessAt),
      overdue: j.overdue,
      lastFailed: j.lastFailed,
      running: j.running,
    })),
  };
}

export async function operatorExperts(ctx: ActiveContext) {
  const entries = await listExpertsForCuration(ctx);
  return {
    items: entries.map((e) => ({
      profileId: e.profileId,
      name: e.name,
      email: e.email,
      headline: e.headline,
      organisation: e.organisation,
      specialisms: e.specialisms,
      offering: e.offering,
      mentorCapacity: e.mentorCapacity,
      activeMentorships: e.activeMentorships,
      publishedAt: isoOrNull(e.publishedAt),
      verifiedAt: isoOrNull(e.verifiedAt),
      createdAt: iso(e.createdAt),
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* /appadmin                                                                   */
/* -------------------------------------------------------------------------- */

export async function appAdminCompetitions(ctx: ActiveContext) {
  const rows = await listPlatformCompetitions(ctx);
  return {
    items: rows.map((c) => ({
      id: c.id,
      title: c.title,
      summary: c.summary,
      status: c.status,
      organizerName: c.organizerName,
      registrationClosesAt: isoOrNull(c.registrationClosesAt),
      createdAt: iso(c.createdAt),
    })),
  };
}
