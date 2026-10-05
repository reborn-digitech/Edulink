import "server-only";
import { cache } from "react";
import {
  isCollegeKind,
  isProfessionalStream,
  parseDuties,
  parseStreams,
  presetUnion,
  STREAMS,
  type StreamCode,
  type StreamPreset,
} from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError, NotACollegeError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import type { TranslationKey } from "./i18n/dictionary";
import type { ActiveContext } from "./session";

/**
 * A COLLEGE'S STREAMS (the owner's decision of 5 October 2026). The operator
 * chooses them at onboarding beside the kind, self-registration asks the
 * same, and the registrar changes them on the college profile. Stored on
 * School.streamsJson; the presets are packages/contracts v1/streams.ts.
 *
 * WHAT A BUILDER CALLS:
 *   - `streamsOf(schoolId)` — the college's streams, STREAMS order (cached per
 *     request, as enabledModules is); [] for a school or no school;
 *   - `hasStream(schoolId, stream)`;
 *   - `streamPreset(streams)` — the union of the streams' presets (modules,
 *     regulators, filings, duties, home tiles, words, not-built records);
 *     `presetOf(schoolId)` reads the streams and takes the union;
 *   - `professional(streams)` — whether any of them answers to a council
 *     other than the UGC (the professional streams, which start with
 *     PLACEMENT);
 *   - `checkStreams(kind, streams)` — the refusal key for a tenant being
 *     made, or null;
 *   - `setStreams(ctx, streams)` — the registrar's change, audited
 *     `college.streams.set`.
 *
 * Changing a college's streams later does NOT switch modules on or off: the
 * preset's `modulesOn` is what a NEW college starts with, and every module
 * stays the college's own switch afterwards.
 */

/** A college's streams, STREAMS order; [] for a school or no school. Read once per request. */
export const streamsOf = cache(async (schoolId: string | null | undefined): Promise<StreamCode[]> => {
  if (!schoolId) return [];
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { streamsJson: true, kind: true } });
  if (!school || !isCollegeKind(school.kind)) return [];
  return parseStreams(school.streamsJson);
});

export async function hasStream(schoolId: string | null | undefined, stream: StreamCode): Promise<boolean> {
  return (await streamsOf(schoolId)).includes(stream);
}

/** The union of these streams' presets (presetUnion in the contracts): the one reading every page and library shares. */
export function streamPreset(streams: readonly StreamCode[]): StreamPreset {
  return presetUnion(streams);
}

/** The preset of a college's own streams. */
export async function presetOf(schoolId: string | null | undefined): Promise<StreamPreset> {
  return streamPreset(await streamsOf(schoolId));
}

/** Whether any of these streams is professional (a council other than the UGC). */
export function professional(streams: readonly StreamCode[]): boolean {
  return streams.some((s) => isProfessionalStream(s));
}

/** Known codes only, each once, STREAMS order: what is stored. */
export function cleanStreams(streams: readonly string[] | null | undefined): StreamCode[] {
  const set = new Set(streams ?? []);
  return STREAMS.filter((s) => set.has(s));
}

/**
 * The refusal for a tenant being made, or null: a college needs at least one
 * stream and every one must be known; a school or a junior college is given
 * none (its list is ignored, not refused — the operator's form hides it).
 */
export function checkStreams(kind: string | null | undefined, streams: readonly string[] | null | undefined): TranslationKey | null {
  if (!isCollegeKind(kind)) return null;
  const list = streams ?? [];
  if (list.some((s) => !(STREAMS as readonly string[]).includes(s))) return "streams.refuseUnknown";
  if (cleanStreams(list).length === 0) return "streams.refuseNone";
  return null;
}

/** What a new tenant stores: the clean list for a college, [] for anything else. */
export function streamsToStore(kind: string | null | undefined, streams: readonly string[] | null | undefined): string {
  return JSON.stringify(isCollegeKind(kind) ? cleanStreams(streams) : []);
}

/**
 * The registrar changes the college's streams: the whole list, at least one.
 * The office's alone (the head reads them on the profile); a college's alone.
 * Idempotent: the same list changes nothing and writes no audit row.
 */
export async function setStreams(ctx: ActiveContext, streams: readonly string[]): Promise<{ streams: StreamCode[]; changed: boolean }> {
  if (!ctx.schoolId) throw new AccessError("access.noActiveSchoolSelected");
  if (ctx.role !== "ADMIN") throw new AccessError("access.wrongRoleForThisAction");
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { kind: true, streamsJson: true } });
  if (!isCollegeKind(school.kind)) throw new NotACollegeError("college.refuseNotACollege");
  const refusal = checkStreams(school.kind, streams);
  // What was sent cannot be (422, on the field), as a body the parser let through.
  if (refusal) throw new RuleRefusal(refusal, 422, undefined, "streams");
  const next = cleanStreams(streams);
  const before = parseStreams(school.streamsJson);
  if (before.length === next.length && before.every((s, i) => s === next[i])) {
    // Run on the same list too, so a college whose duties outlived an earlier change is put right by saving it again.
    await pruneDuties(ctx.schoolId, ctx.user.id, next);
    return { streams: next, changed: false };
  }
  await db.school.update({ where: { id: ctx.schoolId }, data: { streamsJson: JSON.stringify(next) } });
  await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "college.streams.set", targetType: "School", targetId: ctx.schoolId, meta: { from: before, to: next } });
  await pruneDuties(ctx.schoolId, ctx.user.id, next);
  return { streams: next, changed: true };
}

/**
 * A DUTY DOES NOT OUTLIVE THE STREAM THAT OFFERED IT (A3-S-2, 5 Oct 2026).
 * The gate and the desks read a teacher's held duties as they are stored, so
 * a college that dropped Science kept its lab in-charges live, and the
 * registrar's panel — which draws only offered duties and re-sent the stale
 * one — could not take it away (422 on every save). When the streams change,
 * every teacher's duties the new streams no longer offer are taken off, each
 * audited as the registrar's own `people.duties.set` with the reason. Reads
 * the new list, not presetOf: streamsOf is cached for the request and still
 * holds the old one.
 */
async function pruneDuties(schoolId: string, actorUserId: string, streams: readonly StreamCode[]): Promise<void> {
  const offered = new Set<string>(streamPreset(streams).duties);
  const holders = await db.membership.findMany({ where: { schoolId, role: { in: ["FACULTY", "HOD"] }, NOT: { dutiesJson: "[]" } }, select: { id: true, dutiesJson: true } });
  for (const m of holders) {
    const held = parseDuties(m.dutiesJson);
    const kept = held.filter((d) => offered.has(d));
    if (kept.length === held.length) continue;
    await db.membership.update({ where: { id: m.id }, data: { dutiesJson: JSON.stringify(kept) } });
    await audit({ schoolId, actorUserId, action: "people.duties.set", targetType: "Membership", targetId: m.id, meta: { from: held, to: kept, reason: "college.streams.set" } });
  }
}
