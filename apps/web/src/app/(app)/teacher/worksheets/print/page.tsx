import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { buildWorksheet } from "@/lib/worksheets";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import { PrintButton } from "./print-button";
import { ReshuffleButton } from "../fresh-seed";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("worksheets.title"), robots: { index: false, follow: false } };
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * The worksheet itself, print-first: questions on the front pages, the
 * answer-and-solution key forced onto its own sheet so the paper can go to the
 * class and the key can stay on the desk.
 */
export default async function WorksheetPrintPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; level?: string; count?: string; seed?: string }>;
}) {
  const ctx = await requireRole("TEACHER");
  const t = await getT();
  const subjectName = (code: string) => {
    const key = SUBJECT_KEY[code as QuizSubject];
    return key ? t(key) : code;
  };
  const params = await searchParams;

  let sheet;
  try {
    sheet = await buildWorksheet(ctx, {
      slug: params.slug ?? "",
      level: Number(params.level ?? 3),
      count: Number(params.count ?? 10),
      seed: params.seed ?? "1",
    });
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }

  const heading = `${sheet.topicName} · L${sheet.level} ${sheet.tierName}`;

  return (
    <article className="mx-auto max-w-2xl print:max-w-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href="/teacher/worksheets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
        >
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("worksheets.title")}
        </Link>
        <div className="flex items-center gap-2">
          <ReshuffleButton
            slug={params.slug ?? ""}
            level={sheet.level}
            count={sheet.questions.length}
          />
          <PrintButton />
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black sm:p-8">
        <header className="border-b border-border pb-4 print:border-black/20">
          <h1 className="text-xl font-bold tracking-tight text-fg print:text-black">{heading}</h1>
          <p className="mt-1 text-sm text-fg-muted print:text-black/70">
            {t("practice.classN", { n: sheet.classLevel })} ·{" "}
            {subjectName(sheet.subject)} ·{" "}
            {t("worksheets.paperMeta", { count: sheet.questions.length, seed: sheet.seed })}
          </p>
          <p className="mt-3 text-sm text-fg-muted print:text-black/70">
            {t("worksheets.nameLine")} ______________________________{" "}
            {t("worksheets.dateLine")} ______________
          </p>
        </header>

        <ol className="mt-5 space-y-5">
          {sheet.questions.map((q) => (
            <li key={q.number} className="break-inside-avoid">
              <p className="font-medium text-fg print:text-black">
                {q.number}. {q.stem}
              </p>
              <ol className="mt-1.5 grid gap-1 pl-5 sm:grid-cols-2">
                {q.choices.map((choice, i) => (
                  <li key={i} className="text-sm text-fg print:text-black">
                    ({LETTERS[i]}) {choice}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>

        {/* ------- the key, on its own sheet ------- */}
        <section className="mt-8 border-t border-border pt-5 print:break-before-page print:border-0 print:pt-0">
          <h2 className="text-lg font-bold text-fg print:text-black">
            {t("worksheets.keyTitle")} — {heading}
          </h2>
          <ol className="mt-4 space-y-3">
            {sheet.questions.map((q) => (
              <li key={q.number} className="break-inside-avoid text-sm">
                <p className="font-semibold text-fg print:text-black">
                  {q.number}. ({LETTERS[q.answerIndex]}) {q.choices[q.answerIndex]}
                </p>
                {q.solution && (
                  <p className="mt-0.5 text-fg-muted print:text-black/70">{q.solution}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </article>
  );
}
