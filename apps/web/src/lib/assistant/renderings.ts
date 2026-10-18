import "server-only";
import type { ViduraRendering, ViduraRenderingReview, ViduraRenderings, ViduraRenderingsQuery } from "@edulink/contracts";
import { viduraRenderingsQuerySchema } from "@edulink/contracts";
import { db } from "../db";
import { audit } from "../audit";
import { AccessError } from "../tenancy";
import { assertAppAdmin } from "../app-admin";
import { assertSuperuser } from "../superuser";
import type { ActiveContext } from "../session";
import { checkGuideRendering } from "./guide-render";

/**
 * THE SPEAKER'S REVIEW OF THE GUIDE'S HINDI AND MARATHI (docs/plans/vidura.md, the coordinator's recommendation;
 * pass 2, 17 Oct 2026). The local model renders the guide once (`npm run help:index -- --render=hi,mr`), each
 * rendering is used at once for retrieval and the drawer's suggestions, and a speaker reads it here:
 *
 *   - the operator APPROVES it, EDITS it (the words in use change, the model's kept beside them) or REJECTS it (it
 *     leaves retrieval and the suggestions at once: assistant-retrieval.ts and suggestions.ts read its status);
 *     each act is audited (vidura.rendering.approve | edit | reject), a repeat of the same act is a no-op;
 *   - the content team reads the same queue and changes nothing (the bank's own Hindi and Marathi have their desk,
 *     /appadmin/translations, linked from the page rather than repeated here).
 *
 * The rows are the platform's, outside every school's fence (HelpRendering in scripts/gen-rls.ts).
 */

export const RENDERINGS_PAGE = 20;

type Row = {
  id: string;
  kind: string;
  language: string;
  sourceText: string;
  sourceFile: string;
  text: string;
  modelText: string;
  status: string;
  edited: boolean;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  updatedAt: Date;
};

function view(r: Row, names: Map<string, string>): ViduraRendering {
  return {
    id: r.id,
    kind: r.kind === "HEADING" ? "HEADING" : "PARAGRAPH",
    language: r.language === "mr" ? "mr" : "hi",
    sourceText: r.sourceText,
    sourceFile: r.sourceFile,
    text: r.text,
    modelText: r.modelText,
    status: r.status === "APPROVED" || r.status === "REJECTED" ? r.status : "UNREVIEWED",
    edited: r.edited,
    reviewedAt: r.reviewedAt?.toISOString() ?? null,
    reviewedBy: r.reviewedByUserId ? (names.get(r.reviewedByUserId) ?? null) : null,
    updatedAt: r.updatedAt.toISOString(),
  };
}

async function reviewerNames(rows: Row[]): Promise<Map<string, string>> {
  const ids = [...new Set(rows.map((r) => r.reviewedByUserId).filter((x): x is string => !!x))];
  if (!ids.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, u.preferredName ?? u.name]));
}

/** How many renderings wait for a speaker, are approved or are rejected, per language: the panel's counts. */
export async function renderingCounts(): Promise<ViduraRenderings["counts"]> {
  const grouped = await db.helpRendering.groupBy({ by: ["language", "status"], _count: { _all: true } });
  const counts = { hi: { unreviewed: 0, approved: 0, rejected: 0 }, mr: { unreviewed: 0, approved: 0, rejected: 0 } };
  for (const g of grouped) {
    const lang = g.language === "mr" ? "mr" : g.language === "hi" ? "hi" : null;
    if (!lang) continue;
    const key = g.status === "APPROVED" ? "approved" : g.status === "REJECTED" ? "rejected" : "unreviewed";
    counts[lang][key] += g._count._all;
  }
  return counts;
}

/** The queue, a page at a time: the operator and the content team read it; only the operator may act on it. */
export async function listRenderings(session: ActiveContext, raw: ViduraRenderingsQuery = {}): Promise<ViduraRenderings> {
  assertAppAdmin(session);
  const q = viduraRenderingsQuerySchema.parse(raw);
  const where = { language: q.language, status: q.status, ...(q.kind ? { kind: q.kind } : {}) };
  const [total, counts] = await Promise.all([db.helpRendering.count({ where }), renderingCounts()]);
  const pages = Math.max(1, Math.ceil(total / RENDERINGS_PAGE));
  const page = Math.min(q.page, pages);
  const rows = await db.helpRendering.findMany({ where, orderBy: [{ sourceFile: "asc" }, { kind: "asc" }, { createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * RENDERINGS_PAGE, take: RENDERINGS_PAGE });
  const names = await reviewerNames(rows);
  return { items: rows.map((r) => view(r, names)), counts, page, pages, pageSize: RENDERINGS_PAGE, mayReview: session.user.isSuperuser };
}

/**
 * The operator's word on one rendering. APPROVE stamps it; EDIT puts the speaker's words in use (checked like the
 * model's: Devanagari, every page path of the English kept) and stamps it approved; REJECT takes it out of retrieval
 * and the suggestions. Audited with the act and the language, never the words; the same act again changes nothing.
 */
export async function reviewRendering(session: ActiveContext, renderingId: string, input: ViduraRenderingReview, now = new Date()): Promise<ViduraRendering> {
  assertSuperuser(session);
  const row = await db.helpRendering.findUnique({ where: { id: renderingId } });
  if (!row) throw new AccessError("viduraReview.notFound", "NOT_FOUND");
  let data: { status: string; text?: string; edited?: boolean } | null = null;
  if (input.action === "EDIT") {
    const text = input.text?.trim() ?? "";
    const checked = text ? checkGuideRendering({ kind: row.kind === "HEADING" ? "HEADING" : "PARAGRAPH", text: row.sourceText }, text) : null;
    if (!checked) throw new AccessError("viduraReview.editRefused");
    if (checked !== row.text || row.status !== "APPROVED") data = { status: "APPROVED", text: checked, edited: checked !== row.modelText };
  } else {
    const status = input.action === "APPROVE" ? "APPROVED" : "REJECTED";
    if (row.status !== status) data = { status };
  }
  if (data) {
    await db.helpRendering.update({ where: { id: row.id }, data: { ...data, reviewedByUserId: session.user.id, reviewedAt: now } });
    await audit({ schoolId: null, actorUserId: session.user.id, action: `vidura.rendering.${input.action.toLowerCase()}`, targetType: "HelpRendering", targetId: row.id, meta: { language: row.language, kind: row.kind } });
  }
  const fresh = (await db.helpRendering.findUnique({ where: { id: row.id } }))!;
  return view(fresh, await reviewerNames([fresh]));
}
