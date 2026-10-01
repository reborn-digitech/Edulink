import Link from "next/link";
import { BooksIcon, CaretRightIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { listBankTopics } from "@/lib/app-admin";
import { EmptyState } from "@/components/ui/states";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { BankTools } from "./bank-tools";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.questionBank") };
}

/**
 * The shared question bank, chapter by chapter. Every school reads the same
 * bank; a question added here is served to every child at their level.
 */
export default async function BankPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string }>;
}) {
  const { q, subject: rawSubject } = await searchParams;
  const t = await getT();
  const session = await requireAppAdmin();
  const allTopics = await listBankTopics(session);
  const subjects = [...new Set(allTopics.map((topic) => topic.subject))];
  const subject = rawSubject && subjects.includes(rawSubject) ? rawSubject : null;
  const needle = (q ?? "").trim().toLowerCase();
  const topics = allTopics.filter(
    (topic) =>
      (!subject || topic.subject === subject) &&
      (!needle || [topic.name, topic.chapter, String(topic.classLevel)].join(" ").toLowerCase().includes(needle)),
  );
  const narrowed = Boolean(subject || needle);

  // Grouped as the syllabus reads: subject, then class.
  const bySubject = new Map<string, typeof topics>();
  for (const topic of topics) {
    const list = bySubject.get(topic.subject) ?? [];
    list.push(topic);
    bySubject.set(topic.subject, list);
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("appadmin.questionBank")} description={t("appadmin.bankIntro")} />

      {/* The sheet in and out, and the duplicates report (2026-10-01). */}
      <BankTools subject={subject} />

      {(allTopics.length > 3 || narrowed) && (
        <DataToolbar
          search={{ value: q ?? "", placeholder: t("appadmin.bankSearchPlaceholder"), label: t("common.searchLabel") }}
          facets={[
            {
              key: "subject",
              label: t("staff.subjectFilter"),
              value: subject ?? "",
              options: [
                { value: "", label: t("staff.allSubjects"), count: allTopics.length },
                ...subjects.map((sub) => ({ value: sub, label: SUBJECT_KEY[sub as QuizSubject] ? t(SUBJECT_KEY[sub as QuizSubject]) : sub, count: allTopics.filter((topic) => topic.subject === sub).length })),
              ],
            },
          ]}
          labels={{ clearAll: t("common.clearAll"), clearSearch: t("common.clearSearch"), activeFilters: t("common.activeFilters") }}
        />
      )}

      {topics.length === 0 && narrowed ? (
        <EmptyState title={t("common.noResultsTitle")} description={t("common.noResultsBody")} />
      ) : topics.length === 0 ? (
        <EmptyState
          icon={<BooksIcon weight="duotone" className="size-8" />}
          title={t("appadmin.bankEmpty")}
          description={t("appadmin.bankEmptyBody")}
        />
      ) : (
        // One subject open at a time: the whole bank on one page was 32,000 px
        // on a phone (the walk of 2026-10-01). A subject is a disclosure with its
        // count; the first is open, every one is when the list has been narrowed;
        // inside, a chapter is a row, not a card.
        [...bySubject.entries()].map(([subject, subjectTopics], index) => (
          <details key={subject} open={narrowed || index === 0} className="group rounded-[--radius-lg] border border-border bg-surface shadow-sm">
            <summary className="tap flex cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <CaretRightIcon weight="bold" className="size-4 text-fg-subtle transition-transform group-open:rotate-90" aria-hidden="true" />
                {SUBJECT_KEY[subject as QuizSubject] ? t(SUBJECT_KEY[subject as QuizSubject]) : subject}
              </span>
              <span className="text-xs font-medium tabular-nums text-fg-muted">
                {subjectTopics.length === 1 ? t("appadmin.chapterCountOne") : t("appadmin.chapterCountMany", { count: subjectTopics.length })}
              </span>
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {subjectTopics.map((topic) => (
                <li key={topic.id}>
                  <Link href={`/appadmin/bank/${topic.id}`} className="flex min-h-11 items-center justify-between gap-3 px-4 py-2 hover:bg-surface-muted/60">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{topic.name}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {t("appadmin.classN", { n: topic.classLevel })} · {topic.chapter}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                      {topic.questionCount === 1
                        ? t("appadmin.questionCountOne")
                        : t("appadmin.questionCountMany", { count: topic.questionCount })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </div>
  );
}
