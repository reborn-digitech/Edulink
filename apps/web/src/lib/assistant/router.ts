import "server-only";
import type { AssistantLanguage, FeatureCode } from "@edulink/contracts";
import { isModuleOn } from "../modules";
import { mayUseAny } from "../platform-features";
import { featuresOf } from "../api-catalog/types";
import { consume } from "../rate-limit";
import { HEAVY_READ_BUDGET } from "../api-v1";
import type { Role } from "../constants";
import type { HelpHit, HelpQuery } from "../assistant-retrieval";
import { DATA_MAX_CHARS, DOOR_THRESHOLD, FOLLOW_UP_TTL_MS, MAX_DOORS_PER_QUESTION, TOOL_ANSWER_MAX_CHARS } from "./config";
import { FOLLOW, FOLLOW_MAX, LEDGER_FOR, callsFor, readableDoor, type DataContext, type DoorCall, type DoorPath, type QuestionHints } from "./doors";
import { DOOR_LOADERS, type DoorHandler } from "./door-loaders";
import { carriesDays, summariseDoor, numberedRowsIn, rowWords, type RowLink } from "./summary";
import { windowWords } from "./when";
import { stripIdentifiers, type NameEntry } from "./strip";
import { withoutInjectedLines } from "./refusals";
import { COMPOSE_PATH, mayOfferCompose } from "./links";

/**
 * THE DATA QUESTIONS' ROUTER AND RUNNER (the owner's decisions of 10 October 2026, built 11 October; it
 * replaces the hand-written intent table of tools.ts). For the asker's role:
 *
 *   1. the candidates are the catalog's GET doors the role may pass (`permits` with the person's duties), that
 *      answer JSON and change nothing on a read, and whose parameters the context fills (doors.ts);
 *   2. they are RANKED BY EMBEDDING SIMILARITY between the question and the door's summary — the help index's
 *      door entries (scripts/help-index.ts), searched with `searchHelp` narrowed to kind "door" — and the top
 *      three above DOOR_THRESHOLD are read;
 *   3. each is read AS THE PERSON: the door's own handler, called inside the request that asked, so the
 *      session, the tenant fence and the handler's own checks stay exactly as they are; the school's module
 *      must be on and every call is counted against the person's heavy-read budget;
 *   4. its JSON is summed up by code (summary.ts), stripped of identifiers (strip.ts) and of instruction-shaped
 *      lines (refusals.ts), and handed to the model as <data>; posts, circulars and the person's threads are
 *      numbered rows the answer may cite (links.ts turns them into LINK citations).
 *
 * A follow-up ("and how many of those are paid") reads the conversation's last doors again from a small cache
 * keyed by the conversation, without a new call (FOLLOW_UP_TTL_MS).
 */

export type DoorSearch = (q: HelpQuery) => Promise<HelpHit[]>;

/** `features` (15 Oct 2026): the door's platform features (the catalog's `feature`); read only while one is on for the person. */
export type ChosenDoor = { door: DoorPath; similarity: number; calls: DoorCall[]; module: string | null; fromCache: boolean; features?: readonly FeatureCode[] };

/** A short question that points back at the last answer's rows. Pure. */
export function isFollowUp(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (q.split(/\s+/).length > 14) return false;
  return /^(?:and|but|also|what about|how about)\b|\b(?:of (?:those|these|them)|those|these|them|that one|which ones?|the same)\b|(?:उनमें|उनमे|इनमें|इनमे|उनका|उनकी|त्यापैकी|त्यांच्यापैकी|यापैकी|त्यातील|त्यांपैकी|आणि किती|और कितने|और कितनी)/.test(q);
}

/* -------------------------------------------------------------------------- */
/* The follow-up cache                                                          */
/* -------------------------------------------------------------------------- */

type Cached = { at: number; doors: DoorPath[]; raw: Map<string, unknown> };
const CACHE = new Map<string, Cached>();
const CACHE_MAX = 500;

function cacheFor(conversationId: string | null, now: number): Cached | null {
  if (!conversationId) return null;
  const c = CACHE.get(conversationId);
  if (c && now - c.at <= FOLLOW_UP_TTL_MS) return c;
  if (c) CACHE.delete(conversationId);
  return null;
}

function remember(conversationId: string | null, now: number, doors: DoorPath[], raw: Map<string, unknown>): void {
  if (!conversationId || !doors.length) return;
  if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
  CACHE.set(conversationId, { at: now, doors, raw });
}

/** For the tests: the cache as it stands, and a way to empty it. */
export const followUpCache = { get: (id: string) => CACHE.get(id) ?? null, clear: () => CACHE.clear() };

/* -------------------------------------------------------------------------- */
/* Choosing                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Beyond the three read, this many more candidates are kept in rank: a door below the first that answers nothing
 * (a school's family door at a college, an empty list) gives its place to the next (runDoors).
 */
export const SPARE_DOORS = 3;

/** Does a door's answer hold nothing to count: no list with a row, no count or amount above zero? Pure. */
export function isEmptyAnswer(raw: unknown): boolean {
  const COUNTY = /count|total|pending|unread|due|outstanding|overdue|paise|rupees|percent|present|absent|late|students|pupils|teachers|classes|open|waiting|applicants|offers|placed|boarders|beds|occupied|cgpa|sgpa|score|marks|hours|loans|fines/i;
  const walk = (v: unknown, key: string): boolean => {
    if (Array.isArray(v)) return v.length === 0;
    if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).every(([k, x]) => walk(x, k));
    if (typeof v === "number") return v === 0 || !COUNTY.test(key);
    return true;
  };
  return walk(raw, "");
}

/**
 * The doors for a question, best first: the role's own, fillable, above the threshold, three to read and up to
 * SPARE_DOORS more in rank; a follow-up puts the conversation's last doors first. `hits` are the door entries of the help index, as
 * `searchHelp` returns them for the role. Pure given its inputs.
 */
export function chooseDoors(input: { hits: Pick<HelpHit, "door" | "similarity">[]; language: AssistantLanguage; ctx: DataContext; hints: QuestionHints; previous?: DoorPath[] }): ChosenDoor[] {
  const out: ChosenDoor[] = [];
  const named = input.hints.grade !== null || input.hints.yearStart !== null || input.hints.term !== null;
  const add = (door: string, similarity: number, fromCache: boolean) => {
    if (out.length >= MAX_DOORS_PER_QUESTION + SPARE_DOORS || out.some((c) => c.door === door)) return;
    // A listing read row by row only for a question naming a class, a year or a term (the rows' door is no candidate otherwise).
    if (FOLLOW[door] && !named && !fromCache) return;
    const e = readableDoor(door, input.ctx.role, input.ctx.duties);
    if (!e) return;
    if (e.module && input.ctx.modules && !input.ctx.modules.has(e.module)) return;
    const calls = callsFor(e, input.ctx, input.hints);
    if (!calls?.length) return;
    out.push({ door: e.path as DoorPath, similarity, calls, module: e.module ?? null, fromCache, features: e.featureInHandler ? [] : featuresOf(e) });
  };
  for (const door of input.previous ?? []) add(door, 1, true);
  const ranked = input.hits
    .filter((h) => h.door?.startsWith("GET ") && (h.similarity ?? 0) >= DOOR_THRESHOLD[input.language])
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
  // A question naming a window about the fee schedule (LEDGER_FOR): the ledger first, whatever its rank among the doors.
  if (input.hints.term !== null || input.hints.window) for (const h of ranked) if (LEDGER_FOR[h.door!.slice(4)]) add(LEDGER_FOR[h.door!.slice(4)]!, h.similarity ?? 0, false);
  // A question naming a class, a year or a term about a listing the person can open row by row (their report
  // cards): the rows themselves are read (FOLLOW), first, since the listing carries no marks by subject.
  if (named) for (const [door, f] of Object.entries(FOLLOW)) if (ranked.some((h) => h.door === `GET ${f.from}` || h.door === `GET ${door}`)) add(door, 1, false);
  for (const h of ranked) add(h.door!.slice(4), h.similarity ?? 0, false);
  return out;
}

/** The help index's door entries closest to the question, for the role (the same search as the help passages, narrowed to doors). */
export async function searchDoors(search: DoorSearch, input: { query: string; language: AssistantLanguage; role: Role }): Promise<HelpHit[]> {
  // Forty, not twelve: the search returns its hits in the fused order of the vector and the keyword halves, and the
  // door closest by meaning can rank below a dozen keyword matches; the router sorts by similarity itself.
  return search({ query: input.query, language: input.language, role: input.role, limit: 40, kinds: ["door"] });
}

/* -------------------------------------------------------------------------- */
/* Reading                                                                      */
/* -------------------------------------------------------------------------- */

export type DataRun = {
  door: DoorPath;
  url: string;
  ok: boolean;
  status: number | null;
  /** The summary as the model reads it (stripped); null when the door gave nothing. */
  data: string | null;
  /** The door's own JSON, for code that reads a door by shape (the exam-scope reader); never the model's. */
  raw?: unknown;
  /** Which of a guardian's children this run read, by its place and class (never a name). */
  child: DoorCall["child"];
  /** The numbered rows still in `data`, for the LINK citations. */
  links: RowLink[];
  fromCache: boolean;
  /**
   * Vidura pass 2: for a question naming days ("next week"), whether this door was read for them (a parameter took
   * them, or its rows carry days to pick from) or cannot be narrowed to them (it keeps nothing by date); absent when
   * the question names no days, and for "today", which every door's answer is about.
   */
  window?: "SERVED" | "UNSERVED";
};

/** Calls one door's handler as the person, inside the request that asked. Throws only on a programming error. */
async function callDoor(call: DoorCall): Promise<{ status: number; raw: unknown }> {
  const loader = DOOR_LOADERS[call.door];
  if (!loader) return { status: 404, raw: null };
  const mod = await loader();
  const handler = mod.GET as DoorHandler | undefined;
  if (typeof handler !== "function") return { status: 405, raw: null };
  const res = await handler(new Request(new URL(call.url, "http://assistant.internal")), { params: Promise.resolve(call.params) });
  if (res.status !== 200) return { status: res.status, raw: null };
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("json")) return { status: 415, raw: null };
  return { status: 200, raw: await res.json() };
}

export type RunInput = {
  chosen: ChosenDoor[];
  ctx: DataContext;
  schoolId: string;
  userId: string;
  question: string;
  hints: QuestionHints;
  lexicon: NameEntry[];
  /** The first row number free after the help passages. */
  firstNumber: number;
  conversationId: string | null;
  now: Date;
  /** For the tests: a door's handler call in place of the real one. */
  call?: (call: DoorCall) => Promise<{ status: number; raw: unknown }>;
  /** For the tests: the module switch in place of the school's. */
  moduleOn?: (schoolId: string, module: string) => Promise<boolean>;
  /** For the tests: the platform's feature switches (any of the list) in place of `mayUseAny`. */
  featureOn?: (features: readonly FeatureCode[]) => Promise<boolean>;
};

/** Reads the chosen doors as the person, summed up and stripped; remembers them for a follow-up. */
export async function runDoors(input: RunInput): Promise<DataRun[]> {
  const call = input.call ?? callDoor;
  const moduleOn = input.moduleOn ?? ((s: string, m: string) => isModuleOn(s, m as never));
  // A door of a platform feature the operator has off (15 Oct 2026) is not read: the handlers are called in-process, past the
  // session's gate, so the gate's 404 FEATURE_OFF is answered here — and (16 Oct 2026) a door behind a plan the
  // asker does not hold (src/lib/person-plans.ts) is not read either, by the asker's role.
  const featureOn = input.featureOn ?? ((features: readonly FeatureCode[]) => mayUseAny(features, { userId: input.userId, schoolId: input.schoolId, role: input.ctx.role }));
  const nowMs = input.now.getTime();
  const cached = cacheFor(input.conversationId, nowMs);
  const raws = new Map<string, unknown>(cached?.raw ?? []);
  const runs: DataRun[] = [];
  let next = input.firstNumber;
  // Each door's share of the question's data: a guardian's three children or three report cards share it too.
  const blocks = input.chosen.slice(0, MAX_DOORS_PER_QUESTION).reduce((n, c) => n + (FOLLOW[c.door] ? FOLLOW_MAX : c.calls.length), 0);
  const share = Math.max(900, Math.min(TOOL_ANSWER_MAX_CHARS, Math.floor(DATA_MAX_CHARS / Math.max(1, blocks))));

  const read = async (c: DoorCall, module: string | null, features: readonly FeatureCode[] = []): Promise<{ status: number | null; raw: unknown; fromCache: boolean }> => {
    if (features.length && !(await featureOn(features))) return { status: 404, raw: null, fromCache: false };
    if (raws.has(c.url)) return { status: 200, raw: raws.get(c.url), fromCache: true };
    if (module && !(await moduleOn(input.schoolId, module))) return { status: 403, raw: null, fromCache: false };
    const gate = await consume(`assistant-tool:${input.userId}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (!gate.allowed) return { status: 429, raw: null, fromCache: false };
    try {
      const got = await call(c);
      if (got.status === 200) raws.set(c.url, got.raw);
      return { status: got.status, raw: got.raw, fromCache: false };
    } catch {
      return { status: null, raw: null, fromCache: false };
    }
  };

  const summarise = (c: DoorCall, raw: unknown, fromCache: boolean, status: number | null): DataRun => {
    const s = summariseDoor(raw, { door: c.door, hints: input.hints, question: input.question, firstNumber: next, maxChars: share });
    // The person's own school is "your school" in their own records: a [SCHOOL] placeholder there was written back by
    // the model and the answer discarded (the college guardian's fees, 11 Oct 2026).
    const text = withoutInjectedLines(stripIdentifiers(s.text, input.lexicon).text).replace(/\[SCHOOL\]/g, "your school");
    const kept = numberedRowsIn(text);
    const links = s.links.filter((l) => kept.has(l.n));
    next += s.links.length;
    // The days asked about, named above the door's lines for the model (Vidura pass 2): read for them, or not kept by date.
    const w = input.hints.window;
    const window = w && w.label !== "TODAY" ? (c.windowed || carriesDays(raw) ? "SERVED" : "UNSERVED") : undefined;
    const asked = w && window ? `asked about: ${windowWords(w)}${window === "UNSERVED" ? "; this record is not kept by date and cannot be narrowed to those days" : ""}\n` : "";
    return { door: c.door, url: c.url, ok: true, status, data: `${asked}${text}`, raw, child: c.child, links, fromCache, ...(window ? { window } : {}) };
  };

  // In rank: the first door is always read into the answer (an empty list is the answer to "how many wait"); a door
  // below it that answers nothing gives its place to the next, until three hold something (SPARE_DOORS more at most).
  type Pending = { call: DoorCall; status: number | null; raw: unknown; fromCache: boolean };
  const used: DoorPath[] = [];
  for (const [rank, chosen] of input.chosen.entries()) {
    if (used.length >= MAX_DOORS_PER_QUESTION) break;
    const pending: Pending[] = [];
    for (const c of chosen.calls) {
      const follow = FOLLOW[chosen.door];
      if (follow) {
        // The listing first (the person's own cards), then the rows the question picks out, at most FOLLOW_MAX.
        const listing = await read({ door: follow.from, url: follow.from, params: {}, child: c.child }, null);
        if (listing.status !== 200) {
          pending.push({ call: c, status: listing.status, raw: null, fromCache: false });
          continue;
        }
        const words = rowWords(input.question);
        const rows = follow.rows(listing.raw).map((r, i) => ({ r, i, score: words.filter((w) => r.title.toLowerCase().includes(w)).length + (input.hints.yearStart !== null && r.title.includes(String(input.hints.yearStart)) ? 2 : 0) }));
        rows.sort((a, b) => b.score - a.score || a.i - b.i);
        for (const { r } of rows.slice(0, FOLLOW_MAX)) {
          const one: DoorCall = { door: chosen.door, url: chosen.door.replace(`{${follow.param}}`, encodeURIComponent(r.id)), params: { ...c.params, [follow.param]: r.id }, child: c.child };
          const got = await read(one, chosen.module, chosen.features);
          pending.push({ call: one, ...got });
        }
        continue;
      }
      const got = await read(c, chosen.module, chosen.features);
      pending.push({ call: c, ...got, fromCache: got.fromCache || chosen.fromCache });
    }
    const holds = pending.some((p) => p.status === 200 && !isEmptyAnswer(p.raw));
    if (rank > 0 && !chosen.fromCache && !holds) continue;
    used.push(chosen.door);
    for (const p of pending) runs.push(p.status === 200 ? summarise(p.call, p.raw, p.fromCache, p.status) : { door: p.call.door, url: p.call.url, ok: false, status: p.status, data: null, child: p.call.child, links: [], fromCache: false });
  }

  // The page to write to a member of staff, once, beside the person's own messages: only where the messaging rule lets them.
  const inbox = runs.find((r) => r.ok && r.door === "/api/v1/shared/inbox");
  if (inbox && mayOfferCompose(input.ctx.role)) {
    inbox.data = `${inbox.data ?? ""}\n  - [${next}] the page to write a new message to a member of staff`;
    inbox.links.push({ n: next, kind: "COMPOSE", id: null, pagePath: COMPOSE_PATH, at: null, who: "STAFF" });
    next += 1;
  }

  remember(input.conversationId, nowMs, used, raws);
  return runs;
}
