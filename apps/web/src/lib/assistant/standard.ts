import "server-only";
import type { AssistantLanguage, ViduraAnswer, ViduraAnswerAct, ViduraAnswers, ViduraAnswerTry } from "@edulink/contracts";
import { ASSISTANT_CHIPS, assistantVerdictSchema } from "@edulink/contracts";
import { db } from "../db";
import { audit } from "../audit";
import { AccessError } from "../tenancy";
import { assertSuperuser } from "../superuser";
import type { ActiveContext } from "../session";
import type { Role } from "../constants";
import { helpKind } from "./prompt";
import { previewAnswer, realDeps, type AssistantDeps } from "./service";
import { detectLanguage } from "./language";
import { citationsOf, questionKey } from "./standard-store";

export { questionKey, findStandardAnswer, countStandardHit } from "./standard-store";

/**
 * STANDARD ANSWERS FOR THE COMMON HOW-TO QUESTIONS (docs/plans/vidura.md, pass 3; the coordinator's recommendation
 * "cached answers, served from a checked answer, counted on the office's card"). 18 October 2026.
 *
 *   ASK      the operator asks Vidura a question as a role on /root/vidura-answers. It goes through `previewAnswer`, the
 *            one path every answer takes (the tables, the retrieval, the classifier, the prompt, the model, the answer
 *            gate), and what comes back is kept as a DRAFT. Never from a person's conversation: nobody's words are read.
 *   CHECK    "Mark as the standard answer": only an ANSWERED draft wearing "Using Shalaghar" (it read nobody's records),
 *            to a how-to or where-is question, may be checked; an earlier standard answer to the same key is revoked.
 *   SERVE    a person of that role whose question, in that language, normalises to the key is served the checked answer
 *            by the service (service.ts, step 5a) — after the tables, the retrieval thresholds and the classifier have
 *            passed the question as PLATFORM, never for a question pointing at a page, a follow-up, "go on", "Explain
 *            this" or a pick of My records or Learning — with no answering model. Each serving counts a hit here and one
 *            on the school's usage row (the office's card).
 *   REVOKE   never served again; kept, with its hits, for the record.
 *
 * Every act is audited (vidura.answer.try | check | revoke | discard), naming the role and language, never the words.
 * The rows are the platform's, outside every school's fence (CachedAnswer in scripts/gen-rls.ts).
 */

/** Drafts older than this are cleared when the desk is read: a trial nobody checked is not kept. */
export const DRAFT_DAYS = 7;
const staleBefore = (now: Date) => new Date(now.getTime() - DRAFT_DAYS * 86_400_000);
/** How many of each the desk lists. */
const LIST_MAX = 100;

type Row = {
  id: string;
  role: string;
  language: string;
  questionKey: string;
  question: string;
  text: string;
  citationsJson: string;
  verdict: string;
  chip: string | null;
  hitCount: number;
  lastHitAt: Date | null;
  createdAt: Date;
  checkedAt: Date | null;
  checkedByUserId: string | null;
  revokedAt: Date | null;
  revokedByUserId: string | null;
};

/** May this trial be checked: answered, "Using Shalaghar", no row of anybody's records cited, a how-to or where-is question. Pure. */
export function markable(r: Pick<Row, "verdict" | "chip" | "citationsJson" | "question">): boolean {
  return r.verdict === "ANSWERED" && r.chip === "USING" && !citationsOf(r.citationsJson).some((c) => c.kind === "LINK") && helpKind(r.question) !== "OTHER";
}

function view(r: Row, names: Map<string, string>): ViduraAnswer {
  const verdict = assistantVerdictSchema.safeParse(r.verdict);
  return {
    id: r.id,
    role: r.role as ViduraAnswer["role"],
    language: (["en", "hi", "mr"].includes(r.language) ? r.language : "en") as AssistantLanguage,
    question: r.question,
    questionKey: r.questionKey,
    text: r.text,
    citations: citationsOf(r.citationsJson),
    verdict: verdict.success ? verdict.data : "ANSWER_DISCARDED",
    chip: (ASSISTANT_CHIPS as readonly string[]).includes(r.chip ?? "") ? (r.chip as ViduraAnswer["chip"]) : null,
    state: r.revokedAt ? "REVOKED" : r.checkedAt ? "STANDARD" : "DRAFT",
    markable: !r.checkedAt && !r.revokedAt && markable(r),
    hits: r.hitCount,
    lastHitAt: r.lastHitAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    checkedAt: r.checkedAt?.toISOString() ?? null,
    checkedBy: r.checkedByUserId ? (names.get(r.checkedByUserId) ?? null) : null,
    revokedAt: r.revokedAt?.toISOString() ?? null,
    revokedBy: r.revokedByUserId ? (names.get(r.revokedByUserId) ?? null) : null,
  };
}

async function namesOf(rows: Row[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.flatMap((r) => [r.checkedByUserId, r.revokedByUserId]).filter((x): x is string => !!x))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/** GET /api/v1/operator/vidura/answers: the drafts (none older than DRAFT_DAYS), the standard answers with their hits, the revoked. Writes nothing. */
export async function listStandardAnswers(ctx: ActiveContext, now = new Date()): Promise<ViduraAnswers> {
  assertSuperuser(ctx);
  const [drafts, standard, revoked, total] = await Promise.all([
    db.cachedAnswer.findMany({ where: { checkedAt: null, revokedAt: null, createdAt: { gte: staleBefore(now) } }, orderBy: { createdAt: "desc" }, take: LIST_MAX }),
    db.cachedAnswer.findMany({ where: { checkedAt: { not: null }, revokedAt: null }, orderBy: [{ hitCount: "desc" }, { checkedAt: "desc" }], take: LIST_MAX }),
    db.cachedAnswer.findMany({ where: { revokedAt: { not: null } }, orderBy: { revokedAt: "desc" }, take: LIST_MAX }),
    db.cachedAnswer.aggregate({ _sum: { hitCount: true } }),
  ]);
  const all = [...drafts, ...standard, ...revoked];
  const names = await namesOf(all);
  return { drafts: drafts.map((r) => view(r, names)), standard: standard.map((r) => view(r, names)), revoked: revoked.map((r) => view(r, names)), servedTotal: total._sum.hitCount ?? 0 };
}

/**
 * POST /api/v1/operator/vidura/answers: the operator asks as a role. The question goes through `previewAnswer`, with no
 * standard answer served (the model writes it afresh), and the outcome is kept as a DRAFT whatever it is, so the operator
 * sees a refusal too; only a markable one can be checked.
 */
export async function tryStandardAnswer(ctx: ActiveContext, input: ViduraAnswerTry, deps: AssistantDeps = realDeps(), now = new Date()): Promise<ViduraAnswer> {
  assertSuperuser(ctx);
  // A trial nobody checked within DRAFT_DAYS is cleared here, the one place a draft is written.
  await db.cachedAnswer.deleteMany({ where: { checkedAt: null, revokedAt: null, createdAt: { lt: staleBefore(now) } } });
  const question = input.question.trim();
  const language = input.language ?? detectLanguage(question) ?? "en";
  const out = await previewAnswer({ role: input.role as Role, question, language }, { ...deps, standardAnswer: undefined });
  const row = await db.cachedAnswer.create({
    data: {
      role: input.role,
      language: out.language,
      questionKey: questionKey(question, out.language),
      question,
      text: out.text,
      citationsJson: JSON.stringify(out.citations),
      verdict: out.verdict,
      chip: out.chip,
      createdByUserId: ctx.user.id,
      createdAt: now,
    },
  });
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.answer.try", targetType: "CachedAnswer", targetId: row.id, meta: { role: input.role, language: out.language, verdict: out.verdict } });
  return view(row, new Map());
}

/**
 * POST /api/v1/operator/vidura/answers/{answerId}: CHECK a markable draft (any earlier standard answer to the same role,
 * language and key is revoked with it), REVOKE a standard answer, DISCARD a draft. The same act again changes nothing.
 */
export async function actOnStandardAnswer(ctx: ActiveContext, answerId: string, input: ViduraAnswerAct, now = new Date()): Promise<ViduraAnswer | null> {
  assertSuperuser(ctx);
  const row = await db.cachedAnswer.findUnique({ where: { id: answerId } });
  if (!row) throw new AccessError("viduraOps.errNotFound", "NOT_FOUND");
  const meta = { role: row.role, language: row.language };
  if (input.action === "DISCARD") {
    if (row.checkedAt || row.revokedAt) throw new AccessError("viduraOps.errNotADraft");
    await db.cachedAnswer.delete({ where: { id: row.id } });
    await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.answer.discard", targetType: "CachedAnswer", targetId: row.id, meta });
    return null;
  }
  if (input.action === "CHECK") {
    if (row.checkedAt && !row.revokedAt) return view(row, await namesOf([row]));
    if (row.revokedAt) throw new AccessError("viduraOps.errRevokedStays");
    if (!markable(row)) throw new AccessError("viduraOps.errNotMarkable");
    await db.cachedAnswer.updateMany({ where: { role: row.role, language: row.language, questionKey: row.questionKey, checkedAt: { not: null }, revokedAt: null, id: { not: row.id } }, data: { revokedAt: now, revokedByUserId: ctx.user.id } });
    const saved = await db.cachedAnswer.update({ where: { id: row.id }, data: { checkedAt: now, checkedByUserId: ctx.user.id } });
    await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.answer.check", targetType: "CachedAnswer", targetId: row.id, meta });
    return view(saved, await namesOf([saved]));
  }
  // REVOKE
  if (row.revokedAt) return view(row, await namesOf([row]));
  if (!row.checkedAt) throw new AccessError("viduraOps.errNotStandard");
  const saved = await db.cachedAnswer.update({ where: { id: row.id }, data: { revokedAt: now, revokedByUserId: ctx.user.id } });
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "vidura.answer.revoke", targetType: "CachedAnswer", targetId: row.id, meta });
  return view(saved, await namesOf([saved]));
}
