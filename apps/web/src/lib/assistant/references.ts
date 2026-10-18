import "server-only";
import type { AssistantReference, ViduraReferenceAct, ViduraReferenceAdd, ViduraReferenceSource, ViduraReferenceSources } from "@edulink/contracts";
import { ASSISTANT_REFERENCE_KINDS, VIDURA_REFERENCE_ROLES } from "@edulink/contracts";
import { db } from "../db";
import { audit } from "../audit";
import { AccessError } from "../tenancy";
import { RuleRefusal } from "../rule-refusal";
import { assertSuperuser } from "../superuser";
import { isMinorOn } from "../adulthood";
import type { ActiveContext } from "../session";

/**
 * VIDURA'S REFERENCE LINKS (docs/plans/vidura.md, the owner's decision 8; pass 4, 18 October 2026).
 *
 * "The book first for learning, then an operator-managed allow-list of public education sources … shown to staff and
 * adult students; to a pupil only if decision 0002 is relaxed for the allow-list. No Medium."
 *
 *   THE LIST     ReferenceSource rows, kept by the operator on /root/vidura-references (add, edit, switch off and on;
 *                every act audited vidura.reference.*). Seeded with NCERT's channel, NPTEL, SWAYAM, Khan Academy India
 *                and India Code (migration vidura_references). Links only: nothing of theirs is in the corpus.
 *   THE LINK     built by code, never written by the model: the source's https template on its own host with the cited
 *                passage's heading in place of {topic} (the book's chapter, a Wikipedia article's title) — public words,
 *                never the person's question — beside a Learning answer only.
 *   WHO SEES IT  the roles a source names; a STUDENT only when at a college AND an adult by a recorded date of birth;
 *                never a pupil at a school, nor a student whose age is not known, while decision 0002 stands (it is not
 *                relaxed: the operator's page says so). A law source only beside a law passage.
 *   NO MEDIUM    a host on medium.com is refused when a source is added or edited.
 */

/** The hosts never allowed on the list (the owner's decision 8: "No Medium"). */
export const REFUSED_HOSTS = ["medium.com"];
/** At most this many links beside one answer. */
export const REFERENCE_LINKS_MAX = 3;

export type ReferenceSourceRow = { id: string; name: string; host: string; kind: string; linkTemplate: string; shownTo: string[]; enabled: boolean };

/** A host as the list keeps it: lower case, letters, digits, dots and hyphens, at least one dot. Pure. */
export function normaliseHost(raw: string): string | null {
  const host = raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? host : null;
}

/** Medium, or a subdomain of it. Pure. */
export function hostRefused(host: string): boolean {
  return REFUSED_HOSTS.some((r) => host === r || host.endsWith(`.${r}`));
}

/** What is wrong with a link template for this host, or null: https, on the host itself, "{topic}" exactly once. Pure. */
export function templateProblem(template: string, host: string): "TEMPLATE" | null {
  if ((template.match(/\{topic\}/g) ?? []).length !== 1) return "TEMPLATE";
  let url: URL;
  try {
    url = new URL(template.replace("{topic}", "x"));
  } catch {
    return "TEMPLATE";
  }
  return url.protocol === "https:" && url.hostname === host && !url.username && !url.password && !url.port ? null : "TEMPLATE";
}

/**
 * The topic a link searches for: the cited passage's own heading — a Wikipedia article's title, else the book's
 * chapter, else its section — without its number ("Chapter 3:", "4.2", "Lesson 11."), at most eight words. Null when
 * nothing readable is left. Pure.
 */
export function topicOf(c: { chapter: string | null; section: string | null; attributionTitle?: string | null }): string | null {
  for (const raw of [c.attributionTitle ?? null, c.chapter, c.section]) {
    if (!raw) continue;
    const cleaned = raw
      .replace(/^\s*(chapter|lesson|unit|module|part)\s*[\dIVXLC]+\s*[:.\-–—]?\s*/i, "")
      .replace(/^\s*\d{1,2}(\.\d{1,2}){0,3}\.?\s+/, "")
      .replace(/\s+/g, " ")
      .replace(/[\s.:;,–—-]+$/, "")
      .trim();
    const words = cleaned.split(" ").filter(Boolean);
    if ((cleaned.match(/\p{L}/gu) ?? []).length < 3) continue;
    return words.slice(0, 8).join(" ");
  }
  return null;
}

/** Whether a source's links may be shown to this person. Pure: the decision 0002 rule in one place. */
export function mayShowReferences(input: { role: string; college: boolean; adult: boolean; shownTo: readonly string[] }): boolean {
  if (!input.shownTo.includes(input.role)) return false;
  // A pupil (a STUDENT at a school) never; a college student only as an adult (decision 0002, not relaxed).
  if (input.role === "STUDENT") return input.college && input.adult;
  return true;
}

/** Kinds first by where the person is: a college reads courses and the law first, a school's teacher videos and practice. */
const KIND_ORDER = { college: ["LAW", "COURSE", "REFERENCE", "VIDEO", "PRACTICE"], school: ["VIDEO", "PRACTICE", "COURSE", "REFERENCE", "LAW"] } as const;

/**
 * The links beside one Learning answer. Enabled sources only, the person allowed by `mayShowReferences`, a LAW source
 * only beside a law passage, each link rebuilt and checked to be https on the source's own host, REFERENCE_LINKS_MAX at
 * most. Pure.
 */
export function referenceLinks(input: { role: string; college: boolean; adult: boolean; topic: string | null; law: boolean; sources: ReferenceSourceRow[] }): AssistantReference[] {
  if (!input.topic) return [];
  const order = input.college ? KIND_ORDER.college : KIND_ORDER.school;
  const out: AssistantReference[] = [];
  const eligible = input.sources
    .filter((s) => s.enabled && (ASSISTANT_REFERENCE_KINDS as readonly string[]).includes(s.kind))
    .filter((s) => mayShowReferences({ role: input.role, college: input.college, adult: input.adult, shownTo: s.shownTo }))
    .filter((s) => s.kind !== "LAW" || input.law)
    .filter((s) => !hostRefused(s.host) && templateProblem(s.linkTemplate, s.host) === null)
    .sort((a, b) => order.indexOf(a.kind as never) - order.indexOf(b.kind as never) || a.name.localeCompare(b.name));
  for (const s of eligible) {
    const url = s.linkTemplate.replace("{topic}", encodeURIComponent(input.topic));
    try {
      if (new URL(url).hostname !== s.host) continue;
    } catch {
      continue;
    }
    out.push({ source: s.name, kind: s.kind as AssistantReference["kind"], topic: input.topic, url });
    if (out.length >= REFERENCE_LINKS_MAX) break;
  }
  return out;
}

/** An adult by a recorded date of birth (and not marked a minor): the only students a link is shown to. */
export async function isRecordedAdult(userId: string, now = new Date()): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { birthdate: true, isMinor: true } });
  return !!user?.birthdate && !user.isMinor && !isMinorOn(user.birthdate, now);
}

/* -------------------------------------------------------------------------- */
/* The list, read by the service                                               */
/* -------------------------------------------------------------------------- */

const CACHE_MS = 60_000;
let cache: { at: number; rows: ReferenceSourceRow[] } | null = null;

/** The enabled sources, read at most once a minute (a desk write in this process empties the cache at once). */
export async function enabledReferenceSources(now = Date.now()): Promise<ReferenceSourceRow[]> {
  if (cache && now - cache.at < CACHE_MS) return cache.rows;
  const rows = await db.referenceSource.findMany({ where: { enabled: true }, orderBy: { name: "asc" }, select: { id: true, name: true, host: true, kind: true, linkTemplate: true, shownTo: true, enabled: true } });
  cache = { at: now, rows };
  return rows;
}

/* -------------------------------------------------------------------------- */
/* The operator's desk                                                         */
/* -------------------------------------------------------------------------- */

type Row = { id: string; name: string; host: string; kind: string; licence: string; licenceUrl: string | null; linkTemplate: string; shownTo: string[]; enabled: boolean; createdAt: Date; updatedAt: Date; updatedByUserId: string | null; createdByUserId: string | null };

function view(r: Row, names: Map<string, string>): ViduraReferenceSource {
  const who = r.updatedByUserId ?? r.createdByUserId;
  return {
    id: r.id,
    name: r.name,
    host: r.host,
    kind: (ASSISTANT_REFERENCE_KINDS as readonly string[]).includes(r.kind) ? (r.kind as ViduraReferenceSource["kind"]) : "REFERENCE",
    licence: r.licence,
    licenceUrl: r.licenceUrl,
    linkTemplate: r.linkTemplate,
    shownTo: r.shownTo.filter((x): x is ViduraReferenceSource["shownTo"][number] => (VIDURA_REFERENCE_ROLES as readonly string[]).includes(x)),
    enabled: r.enabled,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    updatedBy: who ? (names.get(who) ?? null) : null,
  };
}

async function namesOf(rows: Row[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.flatMap((r) => [r.updatedByUserId, r.createdByUserId]).filter((x): x is string => !!x))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/** GET /api/v1/operator/vidura/references: every source, on and off. Writes nothing. */
export async function listReferenceSources(ctx: ActiveContext): Promise<ViduraReferenceSources> {
  assertSuperuser(ctx);
  const rows = await db.referenceSource.findMany({ orderBy: [{ enabled: "desc" }, { name: "asc" }] });
  const names = await namesOf(rows);
  return { sources: rows.map((r) => view(r, names)) };
}

/** The host and template checked together; the refusal names the field. */
function checked(input: { host: string; linkTemplate: string; licenceUrl?: string | null }): { host: string; linkTemplate: string; licenceUrl: string | null } {
  const host = normaliseHost(input.host);
  if (!host) throw new RuleRefusal("viduraOps.refRefuseHost", 422, undefined, "host");
  if (hostRefused(host)) throw new RuleRefusal("viduraOps.refRefuseMedium", 422, undefined, "host");
  if (templateProblem(input.linkTemplate.trim(), host)) throw new RuleRefusal("viduraOps.refRefuseTemplate", 422, { host, marker: "{topic}" }, "linkTemplate");
  const licenceUrl = input.licenceUrl?.trim() || null;
  if (licenceUrl) {
    try {
      if (new URL(licenceUrl).protocol !== "https:") throw new Error("not https");
    } catch {
      throw new RuleRefusal("viduraOps.refRefuseLicenceUrl", 422, undefined, "licenceUrl");
    }
  }
  return { host, linkTemplate: input.linkTemplate.trim(), licenceUrl };
}

/** POST /api/v1/operator/vidura/references: a new source, on at once. Audited. */
export async function addReferenceSource(ctx: ActiveContext, input: ViduraReferenceAdd, now = new Date()): Promise<ViduraReferenceSource> {
  assertSuperuser(ctx);
  const { host, linkTemplate, licenceUrl } = checked(input);
  const name = input.name.trim();
  if (await db.referenceSource.findUnique({ where: { name }, select: { id: true } })) throw new RuleRefusal("viduraOps.refRefuseName", 409, { name }, "name");
  const row = await db.referenceSource.create({
    data: { name, host, kind: input.kind, licence: input.licence.trim(), licenceUrl, linkTemplate, shownTo: [...new Set(input.shownTo)], enabled: true, createdByUserId: ctx.user.id, createdAt: now, updatedAt: now },
  });
  cache = null;
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.reference.add", targetType: "ReferenceSource", targetId: row.id, meta: { name, host } });
  return view(row, await namesOf([row]));
}

/** POST /api/v1/operator/vidura/references/{sourceId}: ENABLE, DISABLE or EDIT. Audited; the same act again changes nothing. */
export async function actOnReferenceSource(ctx: ActiveContext, sourceId: string, input: ViduraReferenceAct, now = new Date()): Promise<ViduraReferenceSource> {
  assertSuperuser(ctx);
  const row = await db.referenceSource.findUnique({ where: { id: sourceId } });
  if (!row) throw new AccessError("viduraOps.refErrNotFound", "NOT_FOUND");
  if (input.action === "ENABLE" || input.action === "DISABLE") {
    const enabled = input.action === "ENABLE";
    if (row.enabled === enabled) return view(row, await namesOf([row]));
    // A source switched on again is checked as if new: a template that no longer passes stays off.
    if (enabled) checked(row);
    const saved = await db.referenceSource.update({ where: { id: row.id }, data: { enabled, updatedByUserId: ctx.user.id, updatedAt: now } });
    cache = null;
    await audit({ schoolId: null, actorUserId: ctx.user.id, action: enabled ? "vidura.reference.enable" : "vidura.reference.disable", targetType: "ReferenceSource", targetId: row.id, meta: { name: row.name, host: row.host } });
    return view(saved, await namesOf([saved]));
  }
  // EDIT: the fields given, the whole row checked again.
  const next = {
    name: input.name?.trim() ?? row.name,
    host: input.host ?? row.host,
    kind: input.kind ?? row.kind,
    licence: input.licence?.trim() ?? row.licence,
    licenceUrl: input.licenceUrl === undefined ? row.licenceUrl : input.licenceUrl,
    linkTemplate: input.linkTemplate ?? row.linkTemplate,
    shownTo: input.shownTo ? [...new Set(input.shownTo)] : row.shownTo,
  };
  const { host, linkTemplate, licenceUrl } = checked(next);
  if (next.name !== row.name && (await db.referenceSource.findUnique({ where: { name: next.name }, select: { id: true } }))) throw new RuleRefusal("viduraOps.refRefuseName", 409, { name: next.name }, "name");
  const changed = next.name !== row.name || host !== row.host || next.kind !== row.kind || next.licence !== row.licence || licenceUrl !== row.licenceUrl || linkTemplate !== row.linkTemplate || next.shownTo.join() !== row.shownTo.join();
  if (!changed) return view(row, await namesOf([row]));
  const saved = await db.referenceSource.update({ where: { id: row.id }, data: { name: next.name, host, kind: next.kind, licence: next.licence, licenceUrl, linkTemplate, shownTo: next.shownTo, updatedByUserId: ctx.user.id, updatedAt: now } });
  cache = null;
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.reference.edit", targetType: "ReferenceSource", targetId: row.id, meta: { name: next.name, host } });
  return view(saved, await namesOf([saved]));
}
