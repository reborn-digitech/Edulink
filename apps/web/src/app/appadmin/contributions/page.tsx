import Link from "next/link";
import { TrayIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { CONTRIBUTION_STATUSES, listContributionQueue, type ContributionStatus } from "@/lib/gig-questions";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  return { title: (await getT())("gigs.queueTitle") };
}

/**
 * Teachers' questions for the bank: those waiting to be read, the oldest
 * first, and those already decided. Adding one to the bank is the only thing
 * that earns its author, and only the content team or the operator adds one.
 */
export default async function ContributionsQueuePage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireAppAdmin();
  const t = await getT();
  const raw = (await searchParams).status as ContributionStatus | undefined;
  const status: ContributionStatus = raw && CONTRIBUTION_STATUSES.includes(raw) ? raw : "SUBMITTED";
  const queue = await listContributionQueue(session, status);

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.queueTitle")} description={t("gigs.queueIntro")} />
      <nav aria-label={t("gigs.queueTitle")} className="flex flex-wrap gap-2">
        {CONTRIBUTION_STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "SUBMITTED" ? "/appadmin/contributions" : `/appadmin/contributions?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={`tap inline-flex items-center gap-2 rounded-full border px-3.5 text-sm font-medium ${s === status ? "border-accent bg-accent-soft text-accent-strong" : "border-border bg-surface text-fg-muted hover:text-fg"}`}
            data-testid={`gig-tab-${s}`}
          >
            {t(`gigs.status${s}`)}
            <span className="tabular-nums">{queue.counts[s]}</span>
          </Link>
        ))}
      </nav>
      {queue.rows.length === 0 ? (
        <EmptyState icon={<TrayIcon />} title={t("gigs.queueEmpty")} />
      ) : (
        <Card>
          <ul className="divide-y divide-border" data-testid="gig-queue">
            {queue.rows.map((row) => (
              <li key={row.id} className="px-4 py-3">
                <Link href={`/appadmin/contributions/${row.id}`} className="tap inline-block break-words text-sm font-medium text-fg underline decoration-border-strong underline-offset-4 hover:decoration-fg">
                  {row.stem}
                </Link>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {SUBJECT_KEY[row.subject as QuizSubject] ? t(SUBJECT_KEY[row.subject as QuizSubject]) : row.subject} · {t("appadmin.classN", { n: row.classLevel })} · {row.topicName} · {t("gigs.from", { name: row.authorName, school: row.authorSchoolName })}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
