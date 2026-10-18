import "server-only";
import type { AssistantChip, AssistantLanguage } from "@edulink/contracts";
import { db } from "../db";
import { translator } from "../i18n/dictionary";
import { NAV } from "../nav";
import { ROLE_HOME, type Role } from "../constants";
import { pageIsRoles } from "./pages";

/**
 * SUGGESTED QUESTIONS (docs/plans/vidura.md, the coordinator's recommendation; pass 1, 17 Oct 2026): three chips on
 * an empty drawer, per role and page, from the help index (scripts/help-index.ts).
 *
 *   1. On a page other than the role's home, "How do I use this page?": page awareness reads it against the page's
 *      own card (service.ts), so it is answerable wherever the drawer is opened.
 *   2. In English, the role's guide's own questions (docs/guide/*.md: every section heading is one, "How do I hand in
 *      my work?"), those whose section is about this page first, then the guide's order.
 *   3. In Hindi and Marathi (pass 2, 17 Oct 2026), the guide's own questions as the local model rendered them
 *      (guide-render.ts; a rendering the reviewer rejected is never suggested), in the same order; where fewer than
 *      three are rendered, the page cards' own labels in that language ("“फ़ीस” पेज पर क्या कर सकते हैं?"): this
 *      page's, then the role's menu in its order.
 *
 * Never the assistant's own section, never another role's page. Cached per role, language and page for ten minutes
 * (the index changes only when it is rebuilt).
 */

export type Suggestion = { text: string; mode: AssistantChip | null };

const TTL_MS = 10 * 60_000;
const CACHE = new Map<string, { at: number; list: Suggestion[] }>();

/** The question a guide's section heading asks, or null: the last part of "The pupil's guide › How do I …?". */
export function guideQuestion(title: string): string | null {
  const last = title.split("›").pop()?.trim() ?? "";
  if (!/[?？]$/.test(last) || last.length > 90) return null;
  if (/assistant|vidura|विदुर|सहायक/i.test(last)) return null;
  return last;
}

export async function suggestionsFor(input: { role: Role; language: AssistantLanguage; page: string | null }, now = Date.now()): Promise<Suggestion[]> {
  const home = ROLE_HOME[input.role];
  const page = input.page && pageIsRoles(input.page, input.role) ? input.page : null;
  const key = `${input.role}|${input.language}|${page ?? ""}`;
  const cached = CACHE.get(key);
  if (cached && now - cached.at < TTL_MS) return cached.list;

  const t = translator(input.language);
  const out: Suggestion[] = [];
  const seen = new Set<string>();
  const add = (text: string, mode: AssistantChip | null = null) => {
    const k = text.toLowerCase();
    if (out.length >= 3 || seen.has(k)) return;
    seen.add(k);
    out.push({ text, mode });
  };
  const away = page && page !== home ? page : null;
  if (away) add(t("viduraUi.suggestThisPage"), "USING");

  // The guide's own questions, in the person's language (Hindi and Marathi from the renderings, pass 2).
  const rows = await db.helpEntry.findMany({
    where: { kind: "doc", language: input.language, sourceFile: { startsWith: "docs/guide/" }, roles: { has: input.role } },
    select: { title: true, pagePath: true, renderingId: true },
    orderBy: { id: "asc" },
    take: 400,
  });
  const ids = rows.map((r) => r.renderingId).filter((x): x is string => !!x);
  const rejected = ids.length ? new Set((await db.helpRendering.findMany({ where: { id: { in: ids }, status: "REJECTED" }, select: { id: true } })).map((r) => r.id)) : new Set<string>();
  const questions = rows
    .filter((r) => !r.renderingId || !rejected.has(r.renderingId))
    .map((r) => ({ q: guideQuestion(r.title), page: r.pagePath }))
    .filter((r): r is { q: string; page: string | null } => r.q !== null && (!r.page || pageIsRoles(r.page, input.role)));
  const here = page ?? home;
  for (const r of questions.filter((x) => x.page === here)) add(r.q);
  for (const r of questions) add(r.q);
  if (input.language !== "en" && out.length < 3) {
    const cards = await db.helpEntry.findMany({
      where: { kind: "nav", language: input.language, roles: { has: input.role }, pagePath: { not: null } },
      select: { title: true, pagePath: true },
      orderBy: { id: "asc" },
      take: 200,
    });
    const label = new Map<string, string>();
    for (const c of cards) if (c.pagePath && !label.has(c.pagePath)) label.set(c.pagePath, c.title);
    // The page itself is asked about by the first chip; the rest of the role's menu, in its order.
    const order = NAV[input.role].map((i) => i.href).filter((h) => h !== home && h !== away);
    for (const href of order) {
      const name = label.get(href);
      if (name && pageIsRoles(href, input.role)) add(t("viduraUi.suggestPage", { page: name }));
    }
  }
  if (CACHE.size > 500) CACHE.clear();
  CACHE.set(key, { at: now, list: out });
  return out;
}
