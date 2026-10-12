import "server-only";
import { cleanTopicStreams, competitionAudienceEditSchema, competitionFitsTenant, type CompetitionAudienceEdit, type PracticeTenant } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { assertAppAdmin } from "./app-admin";
import { practiceTenantOf } from "./practice-audience";
import { DeskRefusal } from "./competition-crawl-desk";
import type { ActiveContext } from "./session";

/**
 * COMPETITIONS BY AUDIENCE (college-content, the owner's decisions of 12 October 2026).
 *
 * A platform competition carries an audience: SCHOOL (its class range is gradeLow/gradeHigh, as before) or
 * COLLEGE with streams (none: every college). A null audience is the state every competition was in before
 * this day, and lists for schools and colleges alike until the content team or the operator sets one.
 * A tenant's competitions page (web and the phone, through GET /api/v1/shared/competitions) lists only the
 * platform competitions that fit it (`competitionFitsTenant` in the contracts); a guardian sees what fits any
 * of their children's schools. A school's own competitions are its own and are not filtered.
 *
 * Refusals are the desk's (DeskRefusal: 422 for a body the contract refuses, 404 for no such platform competition).
 * `setCompetitionAudience` is the one writer of the two columns for a hand-edited competition (the crawler's
 * land.ts writes them on a crawled draft from the page and the source); audited `appadmin.competition.audience`.
 */

/** The tenants a reader's competitions list is drawn for: their own school, or a guardian's children's schools; [] for a reader with neither (the platform's people), who see everything. */
export async function readerTenants(schoolIds: readonly string[]): Promise<PracticeTenant[]> {
  return Promise.all(schoolIds.map((id) => practiceTenantOf(id)));
}

/** Whether a platform competition lists for these tenants (any of them); with none, it does. */
export function fitsAnyTenant(competition: { audience?: string | null; streams?: readonly string[] | null }, tenants: readonly PracticeTenant[]): boolean {
  return tenants.length === 0 || tenants.some((t) => competitionFitsTenant(competition, t));
}

export type AudienceResult = { ok: true; audience: "SCHOOL" | "COLLEGE" | null; streams: string[]; changed: boolean };

/**
 * The content team or the operator sets a platform competition's audience and streams, in any status (a
 * published one included: who it is for is not one of the page's facts the crawler's review rule guards).
 * A school's own competition is not found here, as every app-admin write treats it.
 */
export async function setCompetitionAudience(session: ActiveContext, competitionId: string, raw: unknown): Promise<AudienceResult> {
  assertAppAdmin(session);
  const parsed = competitionAudienceEditSchema.safeParse(raw);
  if (!parsed.success) throw new DeskRefusal("competitionAudience.invalid", 422);
  const edit: CompetitionAudienceEdit = parsed.data;
  const row = await db.competition.findFirst({ where: { id: competitionId, organizerSchoolId: null }, select: { id: true, audience: true, streams: true } });
  if (!row) throw new DeskRefusal("competitionAudience.notFound", 404);
  const streams = edit.audience === "COLLEGE" ? cleanTopicStreams(edit.streams) : [];
  const same = row.audience === edit.audience && row.streams.length === streams.length && row.streams.every((s, i) => s === streams[i]);
  if (same) return { ok: true, audience: edit.audience, streams: row.streams, changed: false };
  await db.competition.update({ where: { id: row.id }, data: { audience: edit.audience, streams } });
  await audit({
    schoolId: null,
    actorUserId: session.user.id,
    action: "appadmin.competition.audience",
    targetType: "Competition",
    targetId: row.id,
    meta: { role: session.user.isSuperuser ? "OPERATOR" : "APP_ADMIN", from: { audience: row.audience, streams: row.streams }, to: { audience: edit.audience, streams } },
  });
  return { ok: true, audience: edit.audience, streams, changed: true };
}
