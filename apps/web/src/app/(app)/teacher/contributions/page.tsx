import Link from "next/link";
import type { Metadata } from "next";
import { PlusIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { requireRole } from "@/lib/tenancy";
import { myContributions, type ContributionView } from "@/lib/gig-questions";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PayeeForm } from "./payee-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.title"), robots: { index: false, follow: false } };
}

const TONE = { SUBMITTED: "info", RETURNED: "warn", ACCEPTED: "ok", REJECTED: "danger", WITHDRAWN: "neutral" } as const;

/**
 * A teacher's questions for the shared practice bank: the rule they are paid
 * by, where they stand against it, where the company pays them, and every
 * question they have sent with what the content team said to it.
 */
export default async function TeacherContributionsPage() {
  const ctx = await requireRole("TEACHER");
  const t = await getT();
  const locale = await getLocale();
  const money = (paise: number) => formatPaise(paise, locale);
  const { settings, standing, payee, contributions } = await myContributions(ctx);
  const earned = (c: ContributionView) => (!c.earning ? null : c.earning.basis === "FREE_BLOCK" ? t("gigs.earnedFree", { free: settings.questionFreeCount }) : t(c.earning.paid ? "gigs.earnedPaid" : "gigs.earnedDue", { amount: money(c.earning.amountPaise) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("gigs.title")}
        description={t("gigs.intro")}
        actions={
          <Button asChild>
            <Link href="/teacher/contributions/new" data-testid="gig-new">
              <PlusIcon weight="bold" className="size-4" aria-hidden="true" />
              {t("gigs.newQuestion")}
            </Link>
          </Button>
        }
      />
      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="gig-rule">
        {t("gigs.ruleLine", { free: settings.questionFreeCount, rate: money(settings.questionRatePaise), cap: settings.questionMonthlyCap })}
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5" data-testid="gig-standing">
        <StatTile label={t("gigs.standingAdded")} value={standing.accepted} tone="ok" />
        <StatTile label={t("gigs.standingFreeLeft")} value={standing.freeLeft} />
        <StatTile label={t("gigs.standingPaidMonth")} value={`${standing.paidThisMonth} / ${settings.questionMonthlyCap}`} />
        <StatTile label={t("gigs.standingDue")} value={money(standing.duePaise)} tone="accent" />
        <StatTile label={t("gigs.standingPaid")} value={money(standing.paidPaise)} />
      </div>
      <p className="text-sm text-fg-muted">{t("gigs.limitsLine", { sent: standing.sentToday, daily: settings.questionDailyLimit, waiting: standing.waiting, pending: settings.questionPendingLimit })}</p>

      <Card>
        <CardHeader title={t("gigs.yours")} />
        <CardBody>
          {contributions.length === 0 ? (
            <EmptyState title={t("gigs.noneYet")} />
          ) : (
            <ul className="divide-y divide-border" data-testid="gig-list">
              {contributions.map((c) => (
                <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/teacher/contributions/${c.id}`} className="tap inline-block break-words text-sm font-medium text-fg underline decoration-border-strong underline-offset-4 hover:decoration-fg">
                      {c.en.stem}
                    </Link>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {t("appadmin.classN", { n: c.topic.classLevel })} · {c.topic.name}
                      {earned(c) ? ` · ${earned(c)}` : ""}
                    </p>
                  </div>
                  <Badge tone={TONE[c.status]}>{t(`gigs.status${c.status}`)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.payeeTitle")} description={t("gigs.payeeIntro")} />
        <CardBody>
          <PayeeForm payee={payee} />
        </CardBody>
      </Card>
    </div>
  );
}
