import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { QuizGenJob, QuizJobsState } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";

/**
 * The bank desk's generation card shows the chapters a run set aside and the ones that landed nothing new, beside the
 * failures (owner-batch-item6, 30 October 2026), in each language; a run row written before the fields existed reads
 * with neither. Rendered to markup with the router, the toast and the desk's actions stubbed; no model server is asked.
 */

let locale: "en" | "hi" | "mr" = "en";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: () => undefined, push: () => undefined }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: () => undefined }) }));
vi.mock("@/lib/i18n", () => ({ useT: () => translator(locale) }));
vi.mock("@/app/appadmin/quiz-review/actions", () => ({ jobsStateAction: vi.fn(), serverAction: vi.fn(), startJobAction: vi.fn(), stopJobAction: vi.fn() }));

// The component is compiled with the classic JSX runtime under vitest, which reads React from the global scope.
(globalThis as { React?: typeof React }).React = React;
const { GenerationCard } = await import("@/components/quiz-review/generation-card");
const { quizGenProgressSchema } = await import("@edulink/contracts");

function job(progress: unknown): QuizGenJob {
  return {
    id: "zz-job",
    state: "RUNNING",
    request: { scope: "EVERYTHING", target: 100 },
    progress: quizGenProgressSchema.parse(progress),
    startedBy: "ZZ App Admin",
    startedByRole: "APP_ADMIN",
    startedServers: [],
    error: null,
    createdAt: "2026-10-30T08:00:00.000Z",
    startedAt: "2026-10-30T08:00:00.000Z",
    finishedAt: null,
  } as unknown as QuizGenJob;
}

const base = { pass: 3, phase: "GENERATING", chapter: null, chaptersDone: 4, chaptersSkipped: 0, chaptersFailed: [], drafted: 120, kept: 20, loaded: 20, keepRate: 0.17, secondsPerKept: 90, last: null };
const render = (progress: unknown) => renderToStaticMarkup(React.createElement(GenerationCard, { initial: { current: job(progress), recent: [], servers: [] } as QuizJobsState, subjectLabels: {} }));

describe("the generation card's set-aside and nothing-new lines", () => {
  it("lists each set-aside chapter with its kind, tries and pass, and each nothing-new landing with its counts", () => {
    locale = "en";
    const html = render({
      ...base,
      chaptersSaturated: [{ label: "NCERT class 12 Mathematics, chapter 7 (Probability)", pass: 2, drafted: 18, dropped: 18 }],
      chaptersSetAside: [
        { label: "NCERT class 12 Mathematics, chapter 7 (Probability)", kind: "SATURATED", pass: 3, tries: 2, reason: "nothing new" },
        { label: "NCERT class 4 Environmental Studies, chapter 21", kind: "FAILING", pass: 2, tries: 2, reason: "no chapter title in the corpus" },
      ],
    });
    expect(html).toContain("Set aside for the rest of the run: NCERT class 12 Mathematics, chapter 7 (Probability): saturated, nothing new on 2 passes in a row (pass 3)");
    expect(html).toContain("NCERT class 4 Environmental Studies, chapter 21: failing, 2 tries in a row (pass 2): no chapter title in the corpus");
    expect(html).toContain("NCERT class 12 Mathematics, chapter 7 (Probability), pass 2: 18 drafted, 18 dropped");
  });
  it("says it in Hindi and Marathi", () => {
    const progress = { ...base, chaptersSaturated: [{ label: "X", pass: 2, drafted: 5, dropped: 5 }], chaptersSetAside: [{ label: "X", kind: "SATURATED", pass: 3, tries: 2, reason: "r" }] };
    locale = "hi";
    expect(render(progress)).toContain("बाकी चक्रों से अलग रखे गए: X: भर चुका, लगातार 2 चक्रों में कुछ नया नहीं (चक्र 3)");
    locale = "mr";
    expect(render(progress)).toContain("पुढच्या फेऱ्यांतून बाजूला ठेवलेले: X: भरलेला, सलग 2 फेऱ्यांत काही नवे नाही (फेरी 3)");
  });
  it("reads a run written before the fields existed with neither line", () => {
    locale = "en";
    const html = render(base);
    expect(html).not.toContain("Set aside for the rest of the run");
    expect(html).not.toContain("Nothing new (");
  });
});
