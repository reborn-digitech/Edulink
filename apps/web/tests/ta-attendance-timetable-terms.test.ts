/**
 * TA-234 (testing analysis of 13 November 2026, attendance-timetable batch): a term was deleted by one press on an
 * X, with no confirm, and its exam rounds and draft report cards lost their term for good (SetNull; adding the term
 * again makes a new one nothing points to).
 *
 * Two halves. The REAL panel (src/app/(app)/admin/calendar/terms-panel.tsx) drawn in a real DOM, as
 * tests/ta-compliance-papers-health-form.test.ts draws its form: jsdom borrowed from the phone app's jest, this
 * app's own react-dom, the server actions, the router and the toast stood in for. And termAttachments, which the
 * calendar page hands the panel, counted against a ZZ school of this suite's own (made here, removed after).
 */
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { translator } from "@/lib/i18n/dictionary";

// Under a machine shared with other runs the default five and ten seconds are not enough.
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });

const removeTerm = vi.fn<(termId: string) => Promise<{ ok: boolean }>>();
vi.mock("@/app/(app)/admin/calendar/actions", () => ({
  addTerm: vi.fn(),
  markTermFinished: vi.fn(),
  removeTerm: (termId: string) => removeTerm(termId),
}));
vi.mock("@/lib/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("@/lib/i18n", () => ({ useT: () => translator("en") }));

type DomWindow = Window & typeof globalThis;
type Jsdom = { JSDOM: new (html: string, options?: { url?: string; pretendToBeVisual?: boolean }) => { window: DomWindow } };

function loadJsdom(): Jsdom {
  const here = dirname(fileURLToPath(import.meta.url));
  const mobile = createRequire(resolve(here, "../../mobile/package.json"));
  const jestExpo = createRequire(mobile.resolve("jest-expo/package.json"));
  const environment = createRequire(jestExpo.resolve("jest-environment-jsdom/package.json"));
  return environment("jsdom") as Jsdom;
}

type ReactModule = typeof import("react");
type Root = { render(node: unknown): void; unmount(): void };

const db = new PrismaClient();
const STAMP = Date.now();
const ids: Record<string, string> = {};
let dom: { window: DomWindow };
let React: ReactModule;
let createRoot: (container: Element) => Root;
let TermsPanel: (typeof import("@/app/(app)/admin/calendar/terms-panel"))["TermsPanel"];
let termAttachments: (typeof import("@/lib/terms"))["termAttachments"];

beforeAll(async () => {
  dom = new (loadJsdom().JSDOM)("<!doctype html><html><body></body></html>", { url: "http://localhost:3000/admin/calendar", pretendToBeVisual: true });
  const win = dom.window;
  for (const name of ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement", "HTMLIFrameElement", "Element", "Node", "Event", "FormData", "MutationObserver", "getComputedStyle", "requestAnimationFrame", "cancelAnimationFrame"] as const) {
    vi.stubGlobal(name, name === "window" ? win : (win as unknown as Record<string, unknown>)[name]);
  }
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  React = await import("react");
  vi.stubGlobal("React", React);
  createRoot = (await import("react-dom/client")).createRoot as unknown as (container: Element) => Root;
  TermsPanel = (await import("@/app/(app)/admin/calendar/terms-panel")).TermsPanel;
  termAttachments = (await import("@/lib/terms")).termAttachments;

  // The school, its year, two terms; Term 1 holds two exam rounds and a draft and a published card.
  const S = (await db.school.create({ data: { name: `ZZ TAATT Terms School ${STAMP}`, slug: `zz-taatt-terms-${STAMP}`, code: `ZTM${String(STAMP).slice(-6)}`, contactEmail: `zz-taatt-terms-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.school = S;
  const year = await db.academicYear.create({ data: { schoolId: S, name: "ZZ 2026-27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z") }, select: { id: true } });
  ids.t1 = (await db.term.create({ data: { schoolId: S, academicYearId: year.id, name: "ZZ Term 1", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2026-10-31T00:00:00Z"), position: 1 }, select: { id: true } })).id;
  ids.t2 = (await db.term.create({ data: { schoolId: S, academicYearId: year.id, name: "ZZ Term 2", startDate: new Date("2026-11-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), position: 2 }, select: { id: true } })).id;
  for (const name of ["ZZ Unit test 1", "ZZ Half-yearly"]) await db.examSeries.create({ data: { schoolId: S, name, gradeLevel: "5", termId: ids.t1 } });
  const user = await db.user.create({ data: { name: "ZZ TAATT Terms Pupil", email: `zz-taatt-terms-pupil-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } });
  ids.user = user.id;
  const pupil = await db.membership.create({ data: { userId: user.id, schoolId: S, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId: S, name: "ZZ TAATT Terms 5A", gradeLevel: "5", joinCode: `ZTM${String(STAMP).slice(-6)}` }, select: { id: true } });
  const card = { schoolId: S, classId: klass.id, studentMembershipId: pupil.id, termId: ids.t1, fromDateKey: "2026-06-01", toDateKey: "2026-10-31" };
  await db.reportCard.create({ data: { ...card, title: "ZZ Term 1 draft", status: "DRAFT" } });
  await db.reportCard.create({ data: { ...card, title: "ZZ Term 1 published", status: "PUBLISHED" } });
});

afterAll(async () => {
  dom?.window.close();
  vi.unstubAllGlobals();
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  if (ids.user) await db.user.deleteMany({ where: { id: ids.user } });
  await db.$disconnect();
});

describe("TA-234: removing a term", () => {
  it("TA-234: termAttachments counts each term's exam rounds and its draft report cards, not the published ones", async () => {
    const counts = await termAttachments(ids.school!, [ids.t1!, ids.t2!]);
    expect(counts.get(ids.t1!)).toEqual({ rounds: 2, cards: 1 });
    expect(counts.get(ids.t2!)).toEqual({ rounds: 0, cards: 0 });
  });

  it("TA-234: the X asks first, naming what is attached, and a No removes nothing; a Yes removes the term", async () => {
    const asked: string[] = [];
    let answer = false;
    dom.window.confirm = (message?: string) => {
      asked.push(String(message));
      return answer;
    };
    removeTerm.mockResolvedValue({ ok: true });
    const host = dom.window.document.createElement("div");
    dom.window.document.body.appendChild(host);
    const root = createRoot(host);
    const term = { id: "zz-term-1", name: "ZZ Term 1", startDateKey: "2026-06-01", endDateKey: "2026-10-31", current: false, finished: false, rounds: 2, cards: 3 };
    // Spread through a declared type: the panel's Term takes the two counts since TA-234.
    const props: Record<string, unknown> = { academicYearId: "zz-year", yearStartKey: "2026-06-01", yearEndKey: "2027-04-30", terms: [term] };
    await React.act(async () => root.render(React.createElement(TermsPanel as unknown as (p: Record<string, unknown>) => React.ReactElement, props)));
    const x = host.querySelector<HTMLButtonElement>('button[aria-label="Remove"]')!;

    await React.act(async () => x.click());
    expect(asked).toHaveLength(1);
    expect(asked[0]).toContain("ZZ Term 1");
    expect(asked[0]).toContain("2 exam round");
    expect(asked[0]).toContain("3 draft report card");
    expect(removeTerm).not.toHaveBeenCalled();

    answer = true;
    await React.act(async () => x.click());
    expect(removeTerm).toHaveBeenCalledWith("zz-term-1");
    await React.act(async () => root.unmount());
    host.remove();
  });
});
