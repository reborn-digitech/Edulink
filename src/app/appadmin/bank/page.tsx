import Link from "next/link";
import { BooksIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { listBankTopics } from "@/lib/app-admin";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.questionBank") };
}

/**
 * The shared question bank, chapter by chapter. Every school reads the same
 * bank; a question added here is served to every child at their level.
 */
export default async function BankPage() {
  const t = await getT();
  const session = await requireAppAdmin();
  const topics = await listBankTopics(session);

  // Grouped as the syllabus reads: subject, then class.
  const bySubject = new Map<string, typeof topics>();
  for (const topic of topics) {
    const list = bySubject.get(topic.subject) ?? [];
    list.push(topic);
    bySubject.set(topic.subject, list);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("appadmin.questionBank")}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">{t("appadmin.bankIntro")}</p>
      </div>

      {topics.length === 0 ? (
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
