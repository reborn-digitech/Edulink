import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole, AccessError } from "@/lib/tenancy";
import { getMyContribution } from "@/lib/gig-questions";
import { translationConfigured } from "@/lib/translate";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { QuestionRead } from "@/components/gigs/question-read";
import { ContributionForm } from "../contribution-form";
import { topicOptions } from "../topics";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.title"), robots: { index: false, follow: false } };
}

const TONE = { SUBMITTED: "info", RETURNED: "warn", ACCEPTED: "ok", REJECTED: "danger", WITHDRAWN: "neutral" } as const;

/** One of the teacher's questions: to change and send again while it is open, to read once it is settled. */
export default async function ContributionPage({ params }: { params: Promise<{ contributionId: string }> }) {
  const ctx = await requireRole("TEACHER");
  const { contributionId } = await params;
  const t = await getT();
  const c = await getMyContribution(ctx, contributionId).catch((error) => {
    if (error instanceof AccessError) notFound();
    throw error;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("appadmin.classN", { n: c.topic.classLevel }) + " · " + c.topic.name}
        back={{ href: "/teacher/contributions", label: t("gigs.title") }}
        meta={<Badge tone={TONE[c.status]}>{t(`gigs.status${c.status}`)}</Badge>}
      />
      {c.reviewNote && (
        <div className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3" data-testid="gig-note">
          <p className="text-xs font-medium text-fg-muted">{t("gigs.reviewerSaid")}</p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-fg">{c.reviewNote}</p>
        </div>
      )}
      {c.open ? (
        <ContributionForm topics={await topicOptions(ctx)} draftOn={translationConfigured()} contributionId={c.id} initial={{ topicId: c.topic.id, difficulty: c.difficulty, answerIndex: c.answerIndex, en: c.en, hi: c.hi, mr: c.mr }} />
      ) : (
        <>
          <p className="text-sm text-fg-muted">{t("gigs.settledNote")}</p>
          <QuestionRead en={c.en} hi={c.hi} mr={c.mr} answerIndex={c.answerIndex} labels={{ en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi"), correct: t("gigs.correctOption"), solution: t("appadmin.solutionLabel") }} />
        </>
      )}
    </div>
  );
}
