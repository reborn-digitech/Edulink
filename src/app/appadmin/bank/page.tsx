import Link from "next/link";
import { BooksIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { listBankTopics } from "@/lib/app-admin";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";

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
        [...bySubject.entries()].map(([subject, subjectTopics]) => (
          <section key={subject} className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-subtle">
              {SUBJECT_KEY[subject as QuizSubject] ? t(SUBJECT_KEY[subject as QuizSubject]) : subject}
            </h2>
            <ul className="space-y-2">
              {subjectTopics.map((topic) => (
                <li key={topic.id}>
                  <Card interactive>
                    <Link href={`/appadmin/bank/${topic.id}`} className="block p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-fg">{topic.name}</p>
                          <p className="truncate text-xs text-fg-muted">
                            {t("appadmin.classN", { n: topic.classLevel })} · {topic.chapter}
                          </p>
                        </div>
                        <span className="text-sm tabular-nums text-fg-muted">
                          {topic.questionCount === 1
                            ? t("appadmin.questionCountOne")
                            : t("appadmin.questionCountMany", { count: topic.questionCount })}
                        </span>
                      </div>
                    </Link>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
