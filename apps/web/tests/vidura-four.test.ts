/**
 * VIDURA PASS 4 (docs/plans/vidura.md; 18 October 2026): college knowledge and references. Pure rules first, then the
 * service with a FAKE MODEL and fake searches that record every call, then the database on a ZZ college and ZZ people
 * of this suite's own (and its own reference source and audit rows, removed afterwards; the seeded sources untouched).
 * Proved here, each failing without its rule:
 *
 *   1. the corpus pipeline: a plain-text article cut by its sections with the reference sections dropped; the Wikipedia
 *      fetch's pure pieces (the API's answer read, the permanent address, the licence and the attribution, the manifest
 *      entry marked for colleges and its streams); the sources the plan named that are refused, with their own terms;
 *   2. retrieval: a search leaves the college-only sources out unless it asks for them (every search before pass 4 is
 *      what it was), takes them alone, or with the books, of the streams named; the attribution read back;
 *   3. the college tutor: the books and the college sources searched side by side, the books first unless a new source
 *      is clearly closer, the cited article carrying its attribution; a school's search never asks for them;
 *   4. references: Medium refused, https on the source's own host, the topic from the passage's heading never the
 *      question, a pupil never, a college student only as a recorded adult, a law source only beside a law passage;
 *   5. the operator's desk: add, edit, switch off and on, each audited; the page says why a pupil sees none.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, booksFirst, openConversation, previewAnswer, type AssistantDeps } from "@/lib/assistant/service";
import { attributionOf, curriculumFilter, type CurriculumHit, type CurriculumQuery, type HelpHit } from "@/lib/assistant-retrieval";
import { BOOKS_FIRST_MARGIN, CURRICULUM_PASSAGES } from "@/lib/assistant/config";
import { actOnReferenceSource, addReferenceSource, hostRefused, listReferenceSources, mayShowReferences, normaliseHost, referenceLinks, templateProblem, topicOf, type ReferenceSourceRow } from "@/lib/assistant/references";
import { chunkPlainText, elementsOfPlainText } from "../scripts/corpus-chunk";
import { REFUSED_SOURCES, WIKIPEDIA_ARTICLES, WIKIPEDIA_STREAMS, permalinkOf, trimArticle, wikipediaAttribution, wikipediaEntry, wikipediaLicence, wikipediaPageOf } from "../scripts/corpus-college";
import { attributionHolds, sourceAccepted } from "../scripts/assistant-eval-score";
import type { ChatMessage, ChatResult } from "@/lib/assistant-model";
import { translator } from "@/lib/i18n/dictionary";
import RootViduraReferencesPage from "@/app/root/vidura-references/page";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";
import { MessageBubble } from "@/components/assistant/chat";
import { citationHref, citationLabel } from "@/components/assistant/model";
import type { AssistantMessage } from "@edulink/contracts";

(globalThis as { React?: typeof React }).React = React;
// The desk is a client component: drawn on the server here, with a router that refreshes nothing.
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {}, push() {} }) }));

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { college: "", school: "", adult: "", minor: "", unknown: "", pupil: "", operator: "", teacher: "", source: "" };

async function as(userId: string, role: string | null, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, role ? { schoolId, role: role as never } : {});
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

const ARTICLE = `Tort is a civil wrong that causes a claimant to suffer loss or harm, resulting in legal liability.

== Overview ==
The person who commits a tort is called a tortfeasor. ${"A tort gives a remedy in damages. ".repeat(40)}

=== Negligence ===
Negligence is a failure to take reasonable care. ${"The duty of care is owed to a neighbour. ".repeat(40)}

== See also ==
Delict
== References ==
Some book, 1990.
=== Notes ===
A note.
== External links ==
https://example.org`;

/* -------------------------------------------------------------------------- */
/* 1. The corpus pipeline                                                      */
/* -------------------------------------------------------------------------- */

describe("1. the corpus pipeline: the Wikipedia subset and the refused sources", () => {
  it("cuts a plain-text article by its sections, the title its chapter, and drops the reference sections with all under them", () => {
    const els = elementsOfPlainText(ARTICLE);
    expect(els.filter((e) => e.type === "heading").map((e) => e.text)).toEqual(["Overview", "Negligence"]);
    expect(els.some((e) => e.type === "para" && /example\.org|Some book|A note|Delict/.test(e.text))).toBe(false);
    const s = chunkPlainText(ARTICLE, { title: "Tort" });
    expect(s.chunks.length).toBeGreaterThan(1);
    expect(s.chunks.every((c) => c.chapter === "Tort" && c.pageStart === 1 && c.text.length <= 2600)).toBe(true);
    expect(s.chunks.some((c) => c.section === "Negligence" && c.headingPath.join(" › ") === "Tort › Overview › Negligence")).toBe(true);
    expect(s.figures).toEqual([]);
  });

  it("reads the API's answer, the revision's permanent address, the licence and the attribution every passage carries", () => {
    expect(wikipediaPageOf({ query: { pages: [{ missing: true, title: "Nope" }] } })).toBeNull();
    expect(wikipediaPageOf({ query: { pages: [{ title: "Tort", pageid: 1, extract: "x", revisions: [] }] } })).toBeNull();
    const page = wikipediaPageOf({ query: { pages: [{ title: "Res judicata", pageid: 7, extract: "text", fullurl: "https://en.wikipedia.org/wiki/Res_judicata", revisions: [{ revid: 99, timestamp: "2026-10-01T00:00:00Z" }] }] } })!;
    expect(page).toMatchObject({ title: "Res judicata", revid: 99 });
    expect(permalinkOf(page)).toBe("https://en.wikipedia.org/w/index.php?title=Res_judicata&oldid=99");
    const licence = wikipediaLicence({ url: "https://creativecommons.org/licenses/by-sa/4.0/deed.en", text: "Creative Commons Attribution-Share Alike 4.0" });
    expect(licence.name).toBe("CC BY-SA 4.0");
    expect(wikipediaAttribution(page, licence)).toEqual({ kind: "WIKIPEDIA", title: "Res judicata", revision: 99, revisedAt: "2026-10-01T00:00:00Z", url: permalinkOf(page), licence: "CC BY-SA 4.0", licenceUrl: licence.url });
    const entry = wikipediaEntry(page, "LAW", licence, "res-judicata.txt");
    expect(entry).toMatchObject({ source: "wikipedia", kind: "encyclopedia", audience: "COLLEGE", streams: ["LAW"], board: "Wikipedia", gradeOrProgramme: "LAW", subject: "Law", sourceUrl: permalinkOf(page) });
    expect(trimArticle(`intro\n${"x".repeat(100)}\n== Later ==\n${"y".repeat(100)}`, 150)).toBe(`intro\n${"x".repeat(100)}`);
  });

  it("lists the articles for each of the nine streams, none twice in a stream", () => {
    for (const s of WIKIPEDIA_STREAMS) {
      expect(WIKIPEDIA_ARTICLES[s].length, s).toBeGreaterThanOrEqual(35);
      expect(new Set(WIKIPEDIA_ARTICLES[s]).size, s).toBe(WIKIPEDIA_ARTICLES[s].length);
    }
  });

  it("writes down India Code, NPTEL and SWAYAM as refused, each with its own published terms", () => {
    const by = (s: string) => REFUSED_SOURCES.filter((r) => r.source === s);
    expect(by("indiacode")[0]!.licence.text).toMatch(/prior written permission/);
    expect(by("indiacode")[0]!.licence.url).toBe("https://indiacode.gov.in/info/copyright-policy");
    expect(by("nptel")[0]!.licence.name).toBe("CC BY-NC-SA");
    expect(by("swayam")[0]!.licence.text).toMatch(/personal use/);
    expect(REFUSED_SOURCES.every((r) => /^not fetched|^rendered by script/.test(r.error))).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* 2. Retrieval                                                                */
/* -------------------------------------------------------------------------- */

describe("2. retrieval: the college-only sources only when asked for", () => {
  const sql = (q: Partial<CurriculumQuery>) => {
    const s = curriculumFilter({ query: "q", language: "en", ...q });
    return { text: s.sql, values: s.values };
  };
  it("leaves them out by default (every search before pass 4 unchanged), takes them alone or beside the books, of the streams named", () => {
    expect(sql({}).text).toContain(`COALESCE(d."audience", '') <> 'COLLEGE'`);
    expect(sql({ board: "NCERT", grade: 9 }).text).toContain(`COALESCE(d."audience", '') <> 'COLLEGE'`);
    expect(sql({ collegeSources: "EXCLUDE", streams: ["LAW"] }).text).not.toContain(`"streams" &&`);
    expect(sql({ collegeSources: "ONLY" }).text).toContain(`d."audience" = 'COLLEGE'`);
    expect(sql({ collegeSources: "INCLUDE" }).text).not.toContain(`<> 'COLLEGE'`);
    const only = sql({ collegeSources: "ONLY", streams: ["LAW"] });
    expect(only.text).toContain(`d."streams" &&`);
    expect(only.values).toContainEqual(["LAW"]);
    // The style corpus stays out of every search, as before.
    expect(sql({ collegeSources: "ONLY" }).text).toContain(`d."styleOnly" = false`);
  });
  it("reads an attribution back only when it is one", () => {
    const a = { kind: "WIKIPEDIA", title: "Tort", revision: 1, revisedAt: "2026-10-17T00:00:00Z", url: "https://en.wikipedia.org/w/index.php?title=Tort&oldid=1", licence: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };
    expect(attributionOf(a)).toEqual(a);
    expect(attributionOf(null)).toBeNull();
    expect(attributionOf({ ...a, kind: "OTHER" })).toBeNull();
    expect(attributionOf({ ...a, revision: "1" })).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* 3. The college tutor                                                        */
/* -------------------------------------------------------------------------- */

const WIKI = { kind: "WIKIPEDIA" as const, title: "Tort", revision: 1380709161, revisedAt: "2026-10-17T10:55:42Z", url: "https://en.wikipedia.org/w/index.php?title=Tort&oldid=1380709161", licence: "CC BY-SA 4.0", licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };
function hit(o: Partial<CurriculumHit> & { chunkId: string; similarity: number }): CurriculumHit {
  const attribution = o.attribution ?? null;
  return {
    documentId: `doc-${o.chunkId}`, board: "NIOS", grade: "12", subject: "Law", book: "Introduction to Law", edition: null, chapter: "Lesson 10", section: "Civil wrongs", headingPath: ["Lesson 10"],
    pageStart: 4, pageEnd: 4, text: "A tort is a civil wrong for which damages are the remedy.", language: "en", figureKeys: [], sourceUrl: "https://nios.ac.in/law.pdf", source: "nios", vectorRank: 1, keywordRank: 1, score: 1,
    ...o,
    attribution,
    citation: { board: o.board ?? "NIOS", book: o.book ?? "Introduction to Law", chapter: o.chapter ?? "Lesson 10", section: o.section ?? null, page: 4, documentId: `doc-${o.chunkId}`, chunkId: o.chunkId, attribution },
  };
}
const article = (sim: number) => hit({ chunkId: "wiki-1", similarity: sim, board: "Wikipedia", grade: "LAW", subject: "Law", book: "Tort", chapter: "Tort", section: "Negligence", source: "wikipedia", sourceUrl: WIKI.url, attribution: WIKI });

describe("3. the college tutor: the books and the college's sources side by side, the books first", () => {
  it("keeps a book's passage ahead unless a new source's is closer by more than the margin; no passage twice; capped", () => {
    const book = hit({ chunkId: "b1", similarity: 0.7 });
    expect(booksFirst([book], [article(0.7 + BOOKS_FIRST_MARGIN - 0.01)])[0]!.chunkId).toBe("b1");
    expect(booksFirst([book], [article(0.7 + BOOKS_FIRST_MARGIN + 0.02)])[0]!.chunkId).toBe("wiki-1");
    expect(booksFirst([book, book], [])).toHaveLength(1);
    // A syllabus lists the topic; it takes no margin over an article that explains it.
    const syllabus = hit({ chunkId: "s1", similarity: 0.7, source: "syllabi", board: "SPPU", book: "B.Com syllabus" });
    expect(booksFirst([syllabus], [article(0.71)])[0]!.chunkId).toBe("wiki-1");
    const many = Array.from({ length: 9 }, (_, i) => hit({ chunkId: `x${i}`, similarity: 0.6 }));
    expect(booksFirst(many, [])).toHaveLength(CURRICULUM_PASSAGES);
  });

  function fake(opts: { books: number; extra: number; answer?: string; sources?: ReferenceSourceRow[] }) {
    const searches: CurriculumQuery[] = [];
    const deps: AssistantDeps = {
      embed: async (texts) => texts.map(() => [0, 0, 1]),
      chat: async (messages: ChatMessage[]): Promise<ChatResult> => {
        const classifying = messages[0]!.content.startsWith("You classify");
        const base = { usage: { promptTokens: 10, completionTokens: 5 }, tokensPerSecond: null, promptTokensPerSecond: null };
        if (classifying) return { ...base, content: "CURRICULUM", firstTokenLogprob: 0 };
        return { ...base, content: opts.answer ?? "A tort is a civil wrong; damages are the remedy [1].", firstTokenLogprob: null, finishReason: "stop" };
      },
      searchHelp: async (): Promise<HelpHit[]> => [],
      searchCurriculum: async (q) => {
        searches.push(q);
        return q.collegeSources === "ONLY" ? [article(opts.extra)] : [hit({ chunkId: "b1", similarity: opts.books })];
      },
      runDoors: async () => [],
      publish: () => {},
      now: () => new Date("2026-10-18T06:00:00Z"),
      referenceSources: async () => opts.sources ?? SOURCES,
    };
    return { deps, searches };
  }

  it("a law student's question finds the article when the books fall short, and the citation carries its attribution", async () => {
    const f = fake({ books: 0.58, extra: 0.74 });
    const out = await previewAnswer({ role: "STUDENT", college: true, streams: ["LAW"], question: "what is negligence in tort law", language: "en" }, f.deps);
    expect(out.verdict).toBe("ANSWERED");
    expect(f.searches.some((q) => q.collegeSources === "ONLY" && q.streams?.includes("LAW"))).toBe(true);
    expect(f.searches.some((q) => !q.collegeSources && !q.board && q.grade === undefined)).toBe(true);
    const cited = out.citations.find((c) => c.kind === "CURRICULUM");
    expect(cited).toMatchObject({ kind: "CURRICULUM", chunkId: "wiki-1", attribution: WIKI });
  });

  it("the books keep the first place when they are close; a school pupil's search never asks for the college sources", async () => {
    const f = fake({ books: 0.72, extra: 0.73 });
    const out = await previewAnswer({ role: "STUDENT", college: true, streams: ["LAW"], question: "what is a tort", language: "en" }, f.deps);
    expect(out.citations.find((c) => c.kind === "CURRICULUM")).toMatchObject({ chunkId: "b1", attribution: null });
    const school = fake({ books: 0.72, extra: 0.9 });
    await previewAnswer({ role: "STUDENT", grade: 9, board: "CBSE", question: "what is force", language: "en" }, school.deps);
    expect(school.searches.length).toBeGreaterThan(0);
    expect(school.searches.every((q) => !q.collegeSources)).toBe(true);
  });

  it("links beside a Learning answer only for an adult college student and staff, never a pupil; a law source beside a law passage", async () => {
    const adult = await previewAnswer({ role: "STUDENT", college: true, streams: ["LAW"], adult: true, question: "what is negligence in tort law", language: "en" }, fake({ books: 0.58, extra: 0.74 }).deps);
    expect(adult.references?.map((r) => r.source)).toEqual(["ZZ India Code", "ZZ Courses", "ZZ Videos"]);
    expect(adult.references?.[0]!.url).toBe("https://indiacode.example.in/search?query=Tort");
    const minor = await previewAnswer({ role: "STUDENT", college: true, streams: ["LAW"], adult: false, question: "what is negligence in tort law", language: "en" }, fake({ books: 0.58, extra: 0.74 }).deps);
    expect(minor.references).toEqual([]);
    const pupil = await previewAnswer({ role: "STUDENT", grade: 9, board: "CBSE", adult: true, question: "what is a tort", language: "en" }, fake({ books: 0.72, extra: 0.9 }).deps);
    expect(pupil.references).toEqual([]);
    const teacher = await previewAnswer({ role: "TEACHER", board: "CBSE", question: "what is force", language: "en" }, fake({ books: 0.72, extra: 0.9 }).deps);
    // A school teacher's book passage here is the NIOS law lesson: the law source is offered beside it, videos first at a school.
    expect(teacher.references?.map((r) => r.source)).toEqual(["ZZ Videos", "ZZ Courses", "ZZ India Code"]);
  });
});

/* -------------------------------------------------------------------------- */
/* 4. References, the pure rules                                               */
/* -------------------------------------------------------------------------- */

const SOURCES: ReferenceSourceRow[] = [
  { id: "a", name: "ZZ Courses", host: "courses.example.in", kind: "COURSE", linkTemplate: "https://courses.example.in/find?q={topic}", shownTo: ["TEACHER", "FACULTY", "HOD", "STUDENT"], enabled: true },
  { id: "b", name: "ZZ India Code", host: "indiacode.example.in", kind: "LAW", linkTemplate: "https://indiacode.example.in/search?query={topic}", shownTo: ["TEACHER", "FACULTY", "HOD", "STUDENT"], enabled: true },
  { id: "c", name: "ZZ Videos", host: "videos.example.in", kind: "VIDEO", linkTemplate: "https://videos.example.in/s?query={topic}", shownTo: ["TEACHER", "FACULTY", "HOD", "STUDENT"], enabled: true },
  { id: "d", name: "ZZ Off", host: "off.example.in", kind: "COURSE", linkTemplate: "https://off.example.in/?q={topic}", shownTo: ["TEACHER", "STUDENT"], enabled: false },
  { id: "e", name: "ZZ Elsewhere", host: "good.example.in", kind: "COURSE", linkTemplate: "https://evil.example.in/?q={topic}", shownTo: ["TEACHER"], enabled: true },
  { id: "f", name: "ZZ Blog", host: "x.medium.com", kind: "REFERENCE", linkTemplate: "https://x.medium.com/?q={topic}", shownTo: ["TEACHER"], enabled: true },
];

describe("4. references: who sees a link, and what it is", () => {
  it("refuses Medium and a template that is not https on the source's own host with {topic} once", () => {
    expect(hostRefused("medium.com")).toBe(true);
    expect(hostRefused("writer.medium.com")).toBe(true);
    expect(hostRefused("notmedium.com")).toBe(false);
    expect(normaliseHost(" https://NPTEL.ac.in/courses ")).toBe("nptel.ac.in");
    expect(normaliseHost("not a host")).toBeNull();
    expect(templateProblem("https://nptel.ac.in/courses?searchText={topic}", "nptel.ac.in")).toBeNull();
    expect(templateProblem("http://nptel.ac.in/?q={topic}", "nptel.ac.in")).toBe("TEMPLATE");
    expect(templateProblem("https://other.in/?q={topic}", "nptel.ac.in")).toBe("TEMPLATE");
    expect(templateProblem("https://nptel.ac.in/?q=fixed", "nptel.ac.in")).toBe("TEMPLATE");
    expect(templateProblem("https://nptel.ac.in/?q={topic}&r={topic}", "nptel.ac.in")).toBe("TEMPLATE");
    expect(templateProblem("https://user:pw@nptel.ac.in/?q={topic}", "nptel.ac.in")).toBe("TEMPLATE");
  });
  it("takes the topic from the passage's own heading, without its number, never the question", () => {
    expect(topicOf({ chapter: "Chapter 3: Fundamental Rights", section: "3.2 Right to Equality" })).toBe("Fundamental Rights");
    expect(topicOf({ chapter: null, section: "4.2 A Force — A Push or a Pull" })).toBe("A Force — A Push or a Pull");
    expect(topicOf({ chapter: "Tort", section: "Negligence", attributionTitle: "Tort" })).toBe("Tort");
    expect(topicOf({ chapter: "12.6", section: null })).toBeNull();
  });
  it("shows a pupil nothing, a college student only as an adult, staff by the roles a source names", () => {
    expect(mayShowReferences({ role: "STUDENT", college: false, adult: true, shownTo: ["STUDENT"] })).toBe(false);
    expect(mayShowReferences({ role: "STUDENT", college: true, adult: false, shownTo: ["STUDENT"] })).toBe(false);
    expect(mayShowReferences({ role: "STUDENT", college: true, adult: true, shownTo: ["STUDENT"] })).toBe(true);
    expect(mayShowReferences({ role: "TEACHER", college: false, adult: false, shownTo: ["TEACHER"] })).toBe(true);
    expect(mayShowReferences({ role: "HOD", college: true, adult: true, shownTo: ["TEACHER"] })).toBe(false);
  });
  it("builds at most three links, from enabled sources on their own hosts, a law source only beside a law passage", () => {
    const links = referenceLinks({ role: "TEACHER", college: false, adult: false, topic: "Force & motion", law: false, sources: SOURCES });
    expect(links.map((l) => l.source)).toEqual(["ZZ Videos", "ZZ Courses"]);
    expect(links[0]!.url).toBe("https://videos.example.in/s?query=Force%20%26%20motion");
    expect(referenceLinks({ role: "FACULTY", college: true, adult: false, topic: "Tort", law: true, sources: SOURCES }).map((l) => l.source)).toEqual(["ZZ India Code", "ZZ Courses", "ZZ Videos"]);
    expect(referenceLinks({ role: "TEACHER", college: false, adult: false, topic: null, law: false, sources: SOURCES })).toEqual([]);
  });
  it("the scorer of the college set: an accepted source, and the attribution on every Wikipedia passage", () => {
    const wiki = { chunkId: "w", source: "wikipedia", title: "Tort", attributionTitle: "Tort", attributionLicence: "CC BY-SA 4.0" };
    expect(sourceAccepted([wiki], ["wikipedia:Tort|Negligence"])).toBe(true);
    expect(sourceAccepted([wiki], ["wikipedia:^Contract$", "nios:Law"])).toBe(false);
    expect(sourceAccepted([{ source: "nios", title: "Introduction to Law (338)" }], ["nios:Law"])).toBe(true);
    expect(attributionHolds([wiki])).toBe(true);
    expect(attributionHolds([{ ...wiki, attributionTitle: null }])).toBe(false);
    expect(attributionHolds([{ chunkId: "b", source: "nios", title: "Law", attributionTitle: null, attributionLicence: null }])).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */
/* 4b. The drawer draws the attribution and the links                          */
/* -------------------------------------------------------------------------- */

describe("4b. the drawer: an article's attribution for every reader, the links where the server sent them", () => {
  const t = translator("en");
  const wrap = (node: React.ReactElement) =>
    renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, node)))
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
  const CITE = { kind: "CURRICULUM" as const, n: 1, board: "Wikipedia", book: "Tort", grade: "LAW", chapter: "Tort", section: "Negligence", page: 1, sourceUrl: WIKI.url, chunkId: "wiki-1", attribution: WIKI };
  const msg = (over: Partial<AssistantMessage>): AssistantMessage => ({ id: "zz-m", role: "ASSISTANT", text: "ZZ a tort is a civil wrong [1]", createdAt: "2026-10-18T04:00:00.000Z", citations: [CITE], verdict: "ANSWERED", mode: "TUTOR", hint: false, helpful: null, chip: "LEARNING", cut: false, askPerson: null, standard: false, references: [], ...over });

  it("labels the article by its title and section, opens it at its revision (no page) for staff, and prints the attribution for everyone", () => {
    expect(citationLabel(CITE, t)).toBe(t("viduraUi.citationArticle", { title: "Tort", section: "Negligence" }));
    expect(citationHref(CITE, "FACULTY")).toEqual({ href: WIKI.url, external: true });
    expect(citationHref(CITE, "STUDENT")).toBeNull();
    for (const role of ["FACULTY", "STUDENT"]) {
      const html = wrap(React.createElement(MessageBubble, { message: msg({}), conversationId: "zz-c", role, t }));
      expect(html).toContain('data-testid="vidura-attribution"');
      expect(html).toContain(t("viduraUi.attributionWikipedia", { title: "Tort", revision: WIKI.revision, date: "2026-10-17", licence: "CC BY-SA 4.0" }));
      expect(html).toContain(WIKI.licenceUrl);
      expect(html).not.toContain('data-testid="vidura-references"');
    }
  });

  it("draws the links the server sent, https only, opening in a new tab", () => {
    const html = wrap(React.createElement(MessageBubble, { message: msg({ references: [{ source: "NPTEL", kind: "COURSE", topic: "Tort", url: "https://nptel.ac.in/courses?searchText=Tort" }, { source: "ZZ Bad", kind: "COURSE", topic: "Tort", url: "javascript:alert(1)" }] }), conversationId: "zz-c", role: "FACULTY", t }));
    expect(html).toContain('data-testid="vidura-references"');
    expect(html).toContain(t("viduraUi.referencesTitle"));
    expect(html).toContain('href="https://nptel.ac.in/courses?searchText=Tort" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain(t("viduraUi.referenceLink", { source: "NPTEL", topic: "Tort" }));
    expect(html).not.toContain("javascript:");
  });
});

/* -------------------------------------------------------------------------- */
/* 5. Through the database: a ZZ college, the desk                             */
/* -------------------------------------------------------------------------- */

beforeAll(async () => {
  const mkSchool = (tag: string, kind: string, streams: string) =>
    db.school.create({ data: { name: `ZZ Vidura Four ${tag} ${STAMP}`, slug: `zz-vidura4-${tag}-${STAMP}`, code: `ZV4${tag[0]}${String(STAMP).slice(-6)}`, contactEmail: `zz-vidura4-${tag}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE", kind, streamsJson: streams }, select: { id: true } });
  ids.college = (await mkSchool("college", "COLLEGE", '["LAW"]')).id;
  ids.school = (await mkSchool("school", "SCHOOL", "[]")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.college, module: "ASSISTANT" }, { schoolId: ids.school, module: "ASSISTANT" }] });
  const mk = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Four ${who}`, email: `zz-vidura4-${who}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [adult, minor, unknown, pupil, operator, teacher] = await Promise.all([
    mk("adult", { birthdate: new Date("2004-01-15T00:00:00Z") }),
    mk("minor", { birthdate: new Date("2010-01-15T00:00:00Z"), isMinor: true }),
    mk("unknown"),
    mk("pupil", { birthdate: new Date("2004-01-15T00:00:00Z") }),
    mk("operator", { isSuperuser: true }),
    mk("teacher"),
  ]);
  Object.assign(ids, { adult: adult.id, minor: minor.id, unknown: unknown.id, pupil: pupil.id, operator: operator.id, teacher: teacher.id });
  for (const u of [adult.id, minor.id, unknown.id]) await db.membership.create({ data: { userId: u, schoolId: ids.college, role: "STUDENT", status: "ACTIVE", studentCode: `ZV4${u.slice(-6)}` } });
  await db.membership.create({ data: { userId: pupil.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", gradeLevel: "9", studentCode: `ZV4P${STAMP}` } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  if (ids.source) await db.referenceSource.deleteMany({ where: { id: ids.source } });
  await db.auditLog.deleteMany({ where: { actorUserId: ids.operator } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  for (const s of [ids.college, ids.school]) {
    await db.auditLog.deleteMany({ where: { schoolId: s } });
    await db.school.deleteMany({ where: { id: s } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("5. through the database", () => {
  const deps = (): AssistantDeps => ({
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages: ChatMessage[]): Promise<ChatResult> => {
      const classifying = messages[0]!.content.startsWith("You classify");
      const base = { usage: { promptTokens: 10, completionTokens: 5 }, tokensPerSecond: null, promptTokensPerSecond: null };
      return classifying ? { ...base, content: "CURRICULUM", firstTokenLogprob: 0 } : { ...base, content: "A tort is a civil wrong [1].", firstTokenLogprob: null, finishReason: "stop" };
    },
    searchHelp: async () => [],
    searchCurriculum: async (q) => (q.collegeSources === "ONLY" ? [article(0.8)] : [hit({ chunkId: "b1", similarity: 0.5 })]),
    runDoors: async () => [],
    publish: () => {},
    now: () => new Date(),
    referenceSources: async () => SOURCES,
  });

  it("an adult college student's answer keeps its links and attribution; a student of unknown age and a minor get none", async () => {
    for (const [who, expected] of [["adult", 3], ["unknown", 0], ["minor", 0]] as const) {
      const ctx = await as(ids[who], "STUDENT", ids.college);
      const conv = await openConversation(ctx, { language: "en" });
      const out = await ask(ctx, conv.id, { text: "what is a tort", language: "en" }, deps());
      expect(out.answer.verdict, who).toBe("ANSWERED");
      expect(out.answer.references.length, who).toBe(expected);
      expect(out.answer.citations.find((c) => c.kind === "CURRICULUM")).toMatchObject({ attribution: WIKI });
      const stored = await db.assistantMessage.findUnique({ where: { id: out.answer.id }, select: { citationsJson: true } });
      expect(JSON.parse(stored!.citationsJson).references?.length ?? 0, who).toBe(expected);
    }
  });

  it("a school pupil, an adult by age, is shown no link and searches no college source", async () => {
    const ctx = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(ctx, { language: "en" });
    const seen: CurriculumQuery[] = [];
    const d = deps();
    const inner = d.searchCurriculum;
    d.searchCurriculum = async (q) => (seen.push(q), inner(q));
    const out = await ask(ctx, conv.id, { text: "what is a tort", language: "en" }, d);
    expect(out.answer.references).toEqual([]);
    expect(seen.every((q) => !q.collegeSources)).toBe(true);
  });

  it("the operator adds, edits, switches off and on a source, each audited; Medium and a foreign template refused; nobody else may", async () => {
    const operator = await as(ids.operator, null, null);
    const base = { name: `ZZ Vidura Four ${STAMP}`, host: "zz-four.example.in", kind: "COURSE" as const, licence: "ZZ terms", licenceUrl: null, linkTemplate: "https://zz-four.example.in/find?q={topic}", shownTo: ["TEACHER" as const] };
    await expect(addReferenceSource(operator, { ...base, host: "medium.com", linkTemplate: "https://medium.com/?q={topic}" })).rejects.toMatchObject({ key: "viduraOps.refRefuseMedium" });
    await expect(addReferenceSource(operator, { ...base, linkTemplate: "https://elsewhere.example.in/?q={topic}" })).rejects.toMatchObject({ key: "viduraOps.refRefuseTemplate" });
    const added = await addReferenceSource(operator, base);
    ids.source = added.id;
    expect(added).toMatchObject({ enabled: true, host: "zz-four.example.in", shownTo: ["TEACHER"] });
    await expect(addReferenceSource(operator, base)).rejects.toMatchObject({ key: "viduraOps.refRefuseName", status: 409 });
    expect(await actOnReferenceSource(operator, added.id, { action: "EDIT", shownTo: ["TEACHER", "FACULTY"] })).toMatchObject({ shownTo: ["TEACHER", "FACULTY"] });
    expect(await actOnReferenceSource(operator, added.id, { action: "DISABLE" })).toMatchObject({ enabled: false });
    expect(await actOnReferenceSource(operator, added.id, { action: "DISABLE" })).toMatchObject({ enabled: false });
    expect(await actOnReferenceSource(operator, added.id, { action: "ENABLE" })).toMatchObject({ enabled: true });
    const audits = await db.auditLog.findMany({ where: { actorUserId: ids.operator, targetId: added.id }, select: { action: true }, orderBy: { createdAt: "asc" } });
    expect(audits.map((a) => a.action)).toEqual(["vidura.reference.add", "vidura.reference.edit", "vidura.reference.disable", "vidura.reference.enable"]);
    const list = await listReferenceSources(operator);
    expect(list.sources.map((s) => s.name)).toEqual(expect.arrayContaining(["NPTEL", "SWAYAM", "India Code", "Khan Academy India", "NCERT OFFICIAL (YouTube)", base.name]));
    const teacher = await as(ids.teacher, null, null);
    await expect(listReferenceSources(teacher)).rejects.toMatchObject({ key: "access.thisAreaBelongsToWhoeverRunsThe" });
  });

  it("the page names the decision 0002 rule for pupils, in the reader's words", async () => {
    await as(ids.operator, null, null);
    const t = translator("en");
    const page = renderToStaticMarkup(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, await RootViduraReferencesPage()))).replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    expect(page).toContain(t("viduraOps.refTitle"));
    expect(page).toContain(t("viduraOps.refWhoPupils"));
    expect(page).toContain(t("viduraOps.refNoMedium"));
    expect(page).toContain("NPTEL");
  });
});
