import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { requireFeatureSwitchPage } from "@/lib/feature-page";
import { normaliseLanguage } from "@/lib/quiz";
import { openOnce } from "@/lib/practice-once";
import { LanguageSwitch } from "@/components/language-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { OncePlayer } from "./player";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("practiceOnce.title"), robots: { index: false, follow: false } };
}

/**
 * ONE-TIME PRACTICE (decision 0008): a set a teacher assigned, opened once by a pupil without the Student plan.
 * Outside the practice layout on purpose, so the plan card never covers it; the platform switch alone gates it
 * (requireFeatureSwitchPage), never the plan. Opening the page fixes the draw; a finished set shows its result.
 */
export default async function PracticeOncePage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const ctx = await requireRole("STUDENT");
  await requireFeatureSwitchPage("QUESTION_BANK");
  const t = await getT();
  const { assignmentId } = await params;
  let view;
  try {
    view = await openOnce(ctx, assignmentId, normaliseLanguage(ctx.user.prefs.locale));
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/student/practice" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("practice.allPractice")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={view.set.topicName} description={t("practiceOnce.pageIntro", { tier: view.set.targetTierName, level: view.set.targetLevel })} />
        <LanguageSwitch showLabel />
      </div>
      <OncePlayer key={ctx.user.prefs.locale} initial={view} />
    </div>
  );
}
