import "server-only";
import type { AssistantLanguage, AssistantVerdict, ViduraUnanswered } from "@edulink/contracts";
import { ASSISTANT_VERDICTS, VIDURA_SCOPES } from "@edulink/contracts";
import { db } from "../db";
import { audit } from "../audit";
import { assertSuperuser } from "../superuser";
import { addDaysToKey, todayKey } from "../dates";
import { toCsv } from "../csv";
import type { ActiveContext } from "../session";
import { detectLanguage } from "./language";

/**
 * THE UNANSWERED-QUESTIONS REPORT (docs/plans/vidura.md, pass 3; the coordinator's recommendation "where the guide and
 * the corpus have holes"). 18 October 2026.
 *
 *   COUNT   the nightly vidura:gaps job (src/lib/jobs.ts), run as the owner like every job, reads the last thirty days of
 *           the conversations' answer rows — each one's verdict, the mode the gate reached (AssistantMessage.scope) and
 *           its reason codes (gateReasons), never its words — and writes per school, school day, role, mode, verdict and
 *           reason one count (AssistantGapCount, the school's row, readable by the operator like UsageSample). The
 *           counsellor routes (SELF_HARM, ABUSE_DISCLOSURE) are never counted here: the school's own card counts them.
 *   STEMS   for the questions that found no page or passage (NOTHING_FOUND), the first STEM_WORDS words of the question
 *           as the model read it (stripped of names, ids, codes and contacts, strip.ts), in one normal form; a stem is
 *           kept (AssistantGapStem, outside the fence, naming no school) only when MIN_STEM_PEOPLE people or more asked
 *           it. Never a whole question, never one person's words alone.
 *   READ    the operator reads the sums on /root/vidura-unanswered and downloads them as CSV (audited).
 */
export const GAP_DAYS = 30;
export const STEM_WORDS = 6;
export const MIN_STEM_PEOPLE = 2;
/** Routed to a caring adult, not refused: counted on the school's own card and never here. */
const NOT_COUNTED: readonly string[] = ["SELF_HARM", "ABUSE_DISCLOSURE"];
const ANSWERS: readonly string[] = ["ANSWERED", "HINT"];

/** Which of the report's columns a verdict adds to. Pure. */
export function verdictColumn(verdict: string): "answered" | "refused" | "discarded" | "unavailable" {
  if (ANSWERS.includes(verdict)) return "answered";
  if (verdict === "ANSWER_DISCARDED") return "discarded";
  if (verdict === "MODEL_UNAVAILABLE") return "unavailable";
  return "refused";
}

/**
 * A question's stem: one normal form (lower case, the marks of a sentence gone, a placeholder for a name or an id gone,
 * one space), its first STEM_WORDS words. Empty when nothing is left. Pure.
 */
export function stemOf(stripped: string): string {
  return stripped
    .normalize("NFC")
    .toLowerCase()
    .replace(/\[(?:person|school|email|phone|link|id|code)(?:_\d+)?\]/g, " ")
    .replace(/[?？!¡.,;:।॥"'“”‘’`()[\]{}<>*#|]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, STEM_WORDS)
    .join(" ");
}

/**
 * The stems kept from the questions that found nothing: grouped by language, role and stem, counted, and kept only when
 * MIN_STEM_PEOPLE people or more asked one; a question with no stripped text (never stored) gives none. Pure.
 */
export function groupStems(items: { stripped: string | null; role: string; userId: string; conversationLanguage: string }[]): { language: AssistantLanguage; role: string; stem: string; questions: number; people: number }[] {
  const groups = new Map<string, { language: AssistantLanguage; role: string; stem: string; questions: number; people: Set<string> }>();
  for (const it of items) {
    if (!it.stripped) continue;
    const stem = stemOf(it.stripped);
    if (!stem) continue;
    const language: AssistantLanguage = detectLanguage(it.stripped) ?? ((["en", "hi", "mr"].includes(it.conversationLanguage) ? it.conversationLanguage : "en") as AssistantLanguage);
    const k = `${language}|${it.role}|${stem}`;
    const g = groups.get(k) ?? { language, role: it.role, stem, questions: 0, people: new Set<string>() };
    g.questions++;
    g.people.add(it.userId);
    groups.set(k, g);
  }
  return [...groups.values()].filter((g) => g.people.size >= MIN_STEM_PEOPLE).map((g) => ({ language: g.language, role: g.role, stem: g.stem, questions: g.questions, people: g.people.size }));
}

type CountKey = { schoolId: string; dayKey: string; role: string; scope: string; verdict: string; reason: string };

/**
 * THE JOB (vidura:gaps). Recomputes the window's counts for every school (or the scope's), and the stems across every
 * school (a scoped run, a test's, leaves the stems alone: they are counted across schools or not at all).
 */
export async function countGaps(now: Date, scope: { schoolIds?: string[] } = {}): Promise<{ summary: { counted: number; rows: number; stems: number }; perSchool: Record<string, Record<string, number>> }> {
  const since = new Date(now.getTime() - (GAP_DAYS + 1) * 86_400_000);
  const schools = await db.school.findMany({ where: scope.schoolIds ? { id: { in: scope.schoolIds } } : {}, select: { id: true, timezone: true } });
  const zone = new Map(schools.map((s) => [s.id, s.timezone]));
  const answers = await db.assistantMessage.findMany({
    where: { role: "ASSISTANT", createdAt: { gte: since }, ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}), verdict: { notIn: [...NOT_COUNTED] } },
    select: { conversationId: true, schoolId: true, verdict: true, scope: true, gateReasons: true, createdAt: true, conversation: { select: { role: true, userId: true, language: true } } },
  });
  const counts = new Map<string, CountKey & { count: number }>();
  const nothingFound: { conversationId: string; at: Date; role: string; userId: string; language: string }[] = [];
  for (const m of answers) {
    const tz = zone.get(m.schoolId);
    if (!tz || !m.verdict) continue;
    const dayKey = todayKey(tz, m.createdAt);
    if (dayKey < addDaysToKey(todayKey(tz, now), -(GAP_DAYS - 1))) continue;
    const reasons = (m.gateReasons ?? "").split(",").filter(Boolean);
    const key: CountKey = { schoolId: m.schoolId, dayKey, role: m.conversation.role, scope: (VIDURA_SCOPES as readonly string[]).includes(m.scope ?? "") ? m.scope! : "NONE", verdict: m.verdict, reason: reasons[0] ?? "" };
    const k = JSON.stringify(key);
    const got = counts.get(k) ?? { ...key, count: 0 };
    got.count++;
    counts.set(k, got);
    if (reasons.includes("NOTHING_FOUND")) nothingFound.push({ conversationId: m.conversationId, at: m.createdAt, role: m.conversation.role, userId: m.conversation.userId, language: m.conversation.language });
  }
  // The window's rows, rewritten: the days before it are kept as they were counted.
  const schoolIds = [...zone.keys()];
  const fromKey = (id: string) => addDaysToKey(todayKey(zone.get(id)!, now), -(GAP_DAYS - 1));
  for (const id of schoolIds) await db.assistantGapCount.deleteMany({ where: { schoolId: id, dayKey: { gte: fromKey(id) } } });
  const rows = [...counts.values()].map((c) => ({ ...c, computedAt: now }));
  for (let i = 0; i < rows.length; i += 500) await db.assistantGapCount.createMany({ data: rows.slice(i, i + 500) });
  const perSchool: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    const col = verdictColumn(r.verdict);
    const p = (perSchool[r.schoolId] ??= { questions: 0, refused: 0, discarded: 0 });
    p.questions = (p.questions ?? 0) + r.count;
    if (col === "refused") p.refused = (p.refused ?? 0) + r.count;
    if (col === "discarded") p.discarded = (p.discarded ?? 0) + r.count;
  }

  let stems = 0;
  if (!scope.schoolIds) {
    // The question each answer that found nothing answered: the person's message just before it, as the model read it.
    const conversations = [...new Set(nothingFound.map((n) => n.conversationId))];
    const questions = conversations.length
      ? await db.assistantMessage.findMany({ where: { conversationId: { in: conversations }, role: "USER", createdAt: { gte: since } }, select: { conversationId: true, createdAt: true, textForModel: true }, orderBy: { createdAt: "asc" } })
      : [];
    const byConversation = new Map<string, typeof questions>();
    for (const q of questions) byConversation.set(q.conversationId, [...(byConversation.get(q.conversationId) ?? []), q]);
    const kept = groupStems(
      nothingFound.map((n) => {
        const asked = (byConversation.get(n.conversationId) ?? []).filter((q) => q.createdAt <= n.at).at(-1);
        return { stripped: asked?.textForModel ?? null, role: n.role, userId: n.userId, conversationLanguage: n.language };
      }),
    );
    const fromDay = addDaysToKey(todayKey("Asia/Kolkata", now), -(GAP_DAYS - 1));
    const toDay = todayKey("Asia/Kolkata", now);
    await db.assistantGapStem.deleteMany({});
    if (kept.length) await db.assistantGapStem.createMany({ data: kept.map((g) => ({ ...g, fromDay, toDay, computedAt: now })) });
    stems = kept.length;
  }
  return { summary: { counted: answers.length, rows: rows.length, stems }, perSchool };
}

type Tally = { questions: number; refused: number; discarded: number };
const tally = (): Tally => ({ questions: 0, refused: 0, discarded: 0 });

/** GET /api/v1/operator/vidura/unanswered: the window's sums from the job's rows, by mode, role, school, verdict and reason, and the stems. */
export async function unansweredReport(ctx: ActiveContext, now = new Date()): Promise<ViduraUnanswered> {
  assertSuperuser(ctx);
  const to = todayKey("Asia/Kolkata", now);
  const from = addDaysToKey(to, -(GAP_DAYS - 1));
  const [rows, stems, schools] = await Promise.all([
    db.assistantGapCount.findMany({ where: { dayKey: { gte: addDaysToKey(from, -1) } }, select: { schoolId: true, dayKey: true, role: true, scope: true, verdict: true, reason: true, count: true, computedAt: true } }),
    db.assistantGapStem.findMany({ orderBy: [{ questions: "desc" }, { people: "desc" }, { stem: "asc" }], take: 50 }),
    db.school.findMany({ select: { id: true, name: true } }),
  ]);
  const names = new Map(schools.map((s) => [s.id, s.name]));
  const totals = tally();
  const byScope = new Map<string, Tally>();
  const byRole = new Map<string, Tally>();
  const bySchool = new Map<string, Tally>();
  const byVerdict = new Map<string, number>();
  const byReason = new Map<string, number>();
  let computedAt: Date | null = null;
  for (const r of rows) {
    if (r.dayKey < from) continue;
    if (!computedAt || r.computedAt > computedAt) computedAt = r.computedAt;
    const col = verdictColumn(r.verdict);
    for (const t of [totals, (byScope.get(r.scope) ?? byScope.set(r.scope, tally()).get(r.scope))!, (byRole.get(r.role) ?? byRole.set(r.role, tally()).get(r.role))!, (bySchool.get(r.schoolId) ?? bySchool.set(r.schoolId, tally()).get(r.schoolId))!]) {
      t.questions += r.count;
      if (col === "refused") t.refused += r.count;
      if (col === "discarded") t.discarded += r.count;
    }
    if (col === "refused" || col === "discarded") {
      byVerdict.set(r.verdict, (byVerdict.get(r.verdict) ?? 0) + r.count);
      if (r.reason) byReason.set(r.reason, (byReason.get(r.reason) ?? 0) + r.count);
    }
  }
  const order = (a: Tally, b: Tally) => b.refused + b.discarded - (a.refused + a.discarded) || b.questions - a.questions;
  return {
    from,
    to,
    computedAt: computedAt?.toISOString() ?? (stems[0]?.computedAt.toISOString() ?? null),
    totals,
    byScope: VIDURA_SCOPES.map((scope) => ({ scope, ...(byScope.get(scope) ?? tally()) })),
    byRole: [...byRole].map(([role, t]) => ({ role, ...t })).sort(order),
    bySchool: [...bySchool].map(([schoolId, t]) => ({ schoolId, schoolName: names.get(schoolId) ?? schoolId, ...t })).sort(order),
    byVerdict: [...byVerdict]
      .filter(([v]) => (ASSISTANT_VERDICTS as readonly string[]).includes(v))
      .map(([verdict, count]) => ({ verdict: verdict as AssistantVerdict, count }))
      .sort((a, b) => b.count - a.count),
    byReason: [...byReason].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
    stems: stems.map((s) => ({ stem: s.stem, language: (["en", "hi", "mr"].includes(s.language) ? s.language : "en") as AssistantLanguage, role: s.role as ViduraUnanswered["stems"][number]["role"], questions: s.questions, people: s.people })),
    minPeople: MIN_STEM_PEOPLE,
  };
}

/**
 * GET /api/v1/operator/vidura/unanswered/export: the same sums as one CSV, a section per table (the counts and the
 * stems, never more than the page shows), audited as vidura.unanswered.export.
 */
export async function unansweredCsv(ctx: ActiveContext, now = new Date()): Promise<{ filename: string; csv: string }> {
  const r = await unansweredReport(ctx, now);
  const lines: Record<string, unknown>[] = [
    { table: "totals", key: "all", questions: r.totals.questions, refused: r.totals.refused, discarded: r.totals.discarded },
    ...r.byScope.map((x) => ({ table: "mode", key: x.scope, questions: x.questions, refused: x.refused, discarded: x.discarded })),
    ...r.byRole.map((x) => ({ table: "role", key: x.role, questions: x.questions, refused: x.refused, discarded: x.discarded })),
    ...r.bySchool.map((x) => ({ table: "school", key: x.schoolName, questions: x.questions, refused: x.refused, discarded: x.discarded })),
    ...r.byVerdict.map((x) => ({ table: "verdict", key: x.verdict, count: x.count })),
    ...r.byReason.map((x) => ({ table: "reason", key: x.reason, count: x.count })),
    ...r.stems.map((x) => ({ table: "stem", key: x.stem, language: x.language, role: x.role, questions: x.questions, people: x.people })),
  ];
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.unanswered.export", targetType: "AssistantGapCount", targetId: `${r.from}..${r.to}`, meta: { rows: lines.length } });
  return { filename: `vidura-unanswered-${r.from}-to-${r.to}.csv`, csv: toCsv(lines, ["table", "key", "language", "role", "questions", "refused", "discarded", "count", "people"]) };
}
