/**
 * THE CROSS-SCHOOL SAMPLER (R-30, risks batch of 5 October 2026): how
 * `api:sweep --cross=school` decides, door by door, what to send with another
 * school's ids — one pure function, so the probe and a dry count read the
 * catalog the same way (tests/cross-sampler.test.ts).
 *
 * The probe used to try a door only where the PATH changed between ZZ
 * Northgate's fixture and the other school's (a sample that is a function of
 * the fixture), or where a fixed sample carried the fixture's own ids for the
 * swapper. A door whose path names no id but whose valid body does — the
 * cover assigned to a slot, a pupil put on a roll by id, a class named in the
 * body — was skipped as "no id in the path to swap", although the other
 * school's ids were in hand. Such a door is now tried with the other school's
 * body at its own path: the body built from the other school's fixture, sent
 * only when it differs from Northgate's in the fixture's ids and in nothing
 * else (a body that also differs in a name, a time or a rule set would send
 * the other school's data to the caller's own school, a write and not a
 * probe). A door with no id in its path or body is still skipped and counted.
 */
import type { Endpoint, SweepFixture } from "../src/lib/api-catalog";

/** Surfaces outside a school's fence: skipped unless the door names a `probe` (catalog types.ts). */
export const PLATFORM_WIDE = [/^\/api\/v1\/shared\//, /^\/api\/v1\/competitions/, /^\/api\/v1\/contest/, /^\/api\/v1\/vacancies/, /^\/api\/v1\/expert/, /^\/api\/v1\/operator/, /^\/api\/v1\/appadmin/, /^\/api\/v1\/auth\//, /^\/api\/v1\/me\b/, /^\/api\/v1\/account/];

/** A fixture id: `c`, the `zz…` prefix that names its kind, digits (src/lib/api-catalog/*-fixture.ts). */
export const FIXTURE_ID = /\bc(zz[a-z]+)\d+\b/g;

type Body = Record<string, unknown>;

/** The fixture's ids by value: each field named `…Id` that holds one, with every field that holds that value. */
function idFields(fx: SweepFixture): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const [field, value] of Object.entries(fx)) {
    if (!field.endsWith("Id") || typeof value !== "string" || value === "") continue;
    out.set(value, [...(out.get(value) ?? []), field]);
  }
  return out;
}

/**
 * How many of the home fixture's ids `other` carries in place of the other
 * school's, where it is otherwise `home` leaf for leaf; null where the two
 * differ in anything but an id (or in shape), 0 where they are the same.
 */
export function idsSwapped(home: unknown, other: unknown, homeFx: SweepFixture, otherFx: SweepFixture): number | null {
  const ids = idFields(homeFx);
  const walk = (h: unknown, o: unknown): number | null => {
    if (h === o) return 0;
    if (typeof h === "string" && typeof o === "string") return (ids.get(h) ?? []).some((field) => (otherFx as Record<string, unknown>)[field] === o) ? 1 : null;
    if (Array.isArray(h) && Array.isArray(o)) {
      if (h.length !== o.length) return null;
      let n = 0;
      for (let i = 0; i < h.length; i++) {
        const m = walk(h[i], o[i]);
        if (m === null) return null;
        n += m;
      }
      return n;
    }
    if (h && o && typeof h === "object" && typeof o === "object" && !Array.isArray(h) && !Array.isArray(o)) {
      const keys = new Set([...Object.keys(h), ...Object.keys(o)]);
      let n = 0;
      for (const k of keys) {
        const m = walk((h as Body)[k], (o as Body)[k]);
        if (m === null) return null;
        n += m;
      }
      return n;
    }
    return null;
  };
  return walk(home, other);
}

export type CrossPlan =
  | { kind: "public" }
  | { kind: "platform-wide" }
  /** A parameter in the path and no sample at all. */
  | { kind: "no-sample" }
  /** The other school's fixture lacks the row the sample (or its body) needs. */
  | { kind: "no-row" }
  /** No id of the fixture in the path or the body: nothing to swap. */
  | { kind: "none" }
  /** The body differs from Northgate's in more than the fixture's ids: sending it would write the other school's data here. */
  | { kind: "body-not-ids" }
  /** The other school's ids in the path (the probe's own path, or the sample as a function of the fixture), with its body. */
  | { kind: "path"; path: string; body: Body | null }
  /** NEW (R-30): the same path, the other school's ids in the body. */
  | { kind: "body"; path: string; body: Body; swapped: number }
  /** NEW (R-30): a read with no id in its path whose query names one (`?classId=`, the family's `?childId=`): the other school's on the query string. A list may rightly answer 200 with nothing in it, so a 2xx is a breach only if it carries one of `needles`. */
  | { kind: "query"; path: string; needles: string[] }
  /** The read's query names an id but will not parse with the other school's id alone (it needs more, a month say). */
  | { kind: "query-incomplete" }
  /** A fixed sample naming fixture ids: the swapper finds their tables and the other tenant's rows. */
  | { kind: "fixed"; fixed: string; body: Body | null };

/** A query key that names a fixture field under another name: the family's `childId` is a pupil's membership. */
const QUERY_FIELD: Record<string, string> = { childId: "studentMembershipId" };

/** The keys of a query schema, through the wrappers zod puts round an object (refine, optional, default, pipe). */
function queryKeys(schema: unknown): string[] {
  let s = schema as { shape?: Record<string, unknown> | (() => Record<string, unknown>); _def?: { schema?: unknown; innerType?: unknown; in?: unknown } } | undefined;
  for (let depth = 0; depth < 6 && s; depth++) {
    if (s.shape) return Object.keys(typeof s.shape === "function" ? s.shape() : s.shape);
    s = (s._def?.schema ?? s._def?.innerType ?? s._def?.in) as typeof s;
  }
  return [];
}

const call = <T>(f: ((fx: SweepFixture) => T) | undefined, fx: SweepFixture): T | null => (f ? f(fx) : null);

/** What the cross-school probe sends to this door, read from the catalog and the two fixtures alone. */
export function crossPlan(e: Endpoint, homeFx: SweepFixture, otherFx: SweepFixture): CrossPlan {
  if (e.access === "anyone") return { kind: "public" };
  // A door that names a probe is a school's, wherever it is filed: the queue of people waiting is under /shared.
  if (!e.probe && PLATFORM_WIDE.some((re) => re.test(e.path))) return { kind: "platform-wide" };
  // The valid body: the probe's own (a door whose valid body is the act), else the sweep's.
  const bodyOf = e.probe?.body ?? e.sampleBody;
  const pathOf = e.probe?.path ?? (typeof e.sample === "function" ? e.sample : null);
  let path: string;
  if (pathOf) {
    const p = pathOf(otherFx);
    if (p === null || /\{\w+\}/.test(p)) return { kind: "no-row" };
    if (p !== pathOf(homeFx)) return { kind: "path", path: p, body: call(bodyOf, otherFx) };
    path = p;
  } else {
    if (typeof e.sample !== "string" && /\{/.test(e.path)) return { kind: "no-sample" };
    path = typeof e.sample === "string" ? e.sample : e.path;
    const sweepBody = e.sampleBody ? e.sampleBody(homeFx) : null;
    if (new RegExp(FIXTURE_ID.source).test(`${path} ${sweepBody ? JSON.stringify(sweepBody) : ""}`)) return { kind: "fixed", fixed: path, body: sweepBody };
  }
  // A read: its query is where another school's ids can go.
  if (e.method === "GET") return queryPlan(e, path, homeFx, otherFx);
  // The same path at both schools: the body is where another school's ids can go.
  if (!bodyOf) return { kind: "none" };
  const homeBody = bodyOf(homeFx);
  const otherBody = bodyOf(otherFx);
  if (homeBody === null) return { kind: "none" };
  if (otherBody === null) return { kind: "no-row" };
  const swapped = idsSwapped(homeBody, otherBody, homeFx, otherFx);
  if (swapped === null) return { kind: "body-not-ids" };
  if (swapped === 0) return { kind: "none" };
  return { kind: "body", path, body: otherBody, swapped };
}

/** The query branch of crossPlan: each key of the read's query schema that names a fixture id, filled with the other school's. */
function queryPlan(e: Endpoint, path: string, homeFx: SweepFixture, otherFx: SweepFixture): CrossPlan {
  if (!e.request) return { kind: "none" };
  const [route, search = ""] = path.split("?");
  const query = new URLSearchParams(search);
  const fields = Object.keys(homeFx);
  const named = queryKeys(e.request)
    .filter((k) => !query.has(k))
    .map((k) => [k, QUERY_FIELD[k] ?? (k.endsWith("Id") && fields.includes(k) ? k : null)] as const)
    .filter((pair): pair is readonly [string, string] => pair[1] !== null);
  if (named.length === 0) return { kind: "none" };
  const needles: string[] = [];
  for (const [key, field] of named) {
    const value = (otherFx as Record<string, unknown>)[field];
    if (typeof value !== "string" || value === "") return { kind: "no-row" };
    if (value === (homeFx as Record<string, unknown>)[field]) return { kind: "none" };
    query.set(key, value);
    needles.push(value);
  }
  if (!e.request.safeParse(Object.fromEntries(query)).success) return { kind: "query-incomplete" };
  return { kind: "query", path: `${route}?${query.toString()}`, needles };
}
