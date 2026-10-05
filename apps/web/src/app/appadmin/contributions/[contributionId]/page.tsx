import { notFound } from "next/navigation";
import { formatPaise } from "@edulink/i18n";
import { requireAppAdmin, AccessError } from "@/lib/tenancy";
import { getContributionForReview } from "@/lib/gig-questions";
import { SUBJECT_KEY, type QuizSubject } from "@/lib/quiz";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { QuestionRead } from "@/components/gigs/question-read";
import { DecideForm } from "./decide-form";

export async function generateMetadata() {
  return { title: (await getT())("gigs.reviewTitle") };
}

const TONE = { SUBMITTED: "info", RETURNED: "warn", ACCEPTED: "ok", REJECTED: "danger", WITHDRAWN: "neutral" } as const;

/**
 * One teacher's question, read in its three languages, with what adding it
 * today would earn its author said before the button is pressed.
 */
export default async function ReviewContributionPage({ params }: { params: Promise<{ contributionId: string }> }) {
  const session = await requireAppAdmin();
  const { contributionId } = await params;
  const t = await getT();
  const locale = await getLocale();
  const money = (paise: number) => formatPaise(paise, locale);
  const c = await getContributionForReview(session, contributionId).catch((error) => {
    if (error instanceof AccessError) notFound();
    throw error;
  });
  const subject = SUBJECT_KEY[c.topic.subject as QuizSubject] ? t(SUBJECT_KEY[c.topic.subject as QuizSubject]) : c.topic.subject;
  const outcome = "refuse" in c.outcome ? t(c.outcome.refuse) : c.outcome.basis === "FREE_BLOCK" ? t("gigs.outcomeFree", { count: c.freeCount }) : t("gigs.outcomePaid", { amount: money(c.outcome.amountPaise) });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("gigs.reviewTitle")}
        description={[subject, t("appadmin.classN", { n: c.topic.classLevel }), c.topic.name, t("appadmin.levelN", { n: c.difficulty })].join(" · ")}
        back={{ href: "/appadmin/contributions", label: t("gigs.queueTitle") }}
        meta={<Badge tone={TONE[c.status]}>{t(`gigs.status${c.status}`)}</Badge>}
      />
      <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="gig-author">
        <p className="font-medium">{t("gigs.from", { name: c.authorName, school: c.authorSchoolName })}</p>
        <p className="text-fg-muted">{t("gigs.authorStanding", { accepted: c.authorAccepted, paid: c.authorPaidThisMonth })}</p>
        {c.status === "SUBMITTED" && (
          <p className="mt-1" data-testid="gig-outcome">
            {outcome} {t("gigs.budgetLine", { spent: money(c.spentThisMonthPaise), budget: money(c.budgetPaise) })}
          </p>
        )}
      </div>
      <QuestionRead en={c.en} hi={c.hi} mr={c.mr} answerIndex={c.answerIndex} labels={{ en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi"), correct: t("gigs.correctOption"), solution: t("appadmin.solutionLabel") }} />
      {c.reviewNote && (
        <div className="rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
          <p className="text-xs font-medium text-fg-muted">{t("gigs.noteLabel")}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-fg">{c.reviewNote}</p>
        </div>
      )}
      {c.status === "SUBMITTED" && <DecideForm contributionId={c.id} topicId={c.topic.id} initial={{ difficulty: c.difficulty, answerIndex: c.answerIndex, en: c.en, hi: c.hi, mr: c.mr }} canAdd={!("refuse" in c.outcome)} />}
    </div>
  );
}
