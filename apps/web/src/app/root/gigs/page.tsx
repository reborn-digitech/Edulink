import type { Metadata } from "next";
import { formatPaise } from "@edulink/i18n";
import { requireSuperuser } from "@/lib/tenancy";
import { gigOverview } from "@/lib/gig-questions";
import { sessionCounts } from "@/lib/gig-sessions";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentForm, SettingsForm } from "./forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.operatorTitle") };
}

/**
 * Gigs, for whoever runs the server: the dials teachers are paid by, what
 * this month has committed, who is owed for the months that have ended, and
 * the transfers already recorded.
 *
 * THE PAGE SENDS NOTHING. The operator pays each person from the company's
 * bank by UPI and types the transfer's reference here; the amount recorded
 * is the server's sum of what that person is owed, never a typed one.
 */
export default async function RootGigsPage() {
  const session = await requireSuperuser();
  const t = await getT();
  const locale = await getLocale();
  const money = (paise: number) => formatPaise(paise, locale);
  const [o, sessions] = await Promise.all([gigOverview(session), sessionCounts(session)]);
  const s = o.settings;

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.operatorTitle")} description={t("gigs.operatorIntro")} />
      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="gig-month">
        {t("gigs.monthLine", { month: o.month, spent: money(o.spentThisMonthPaise), budget: money(s.questionMonthlyBudgetPaise), added: o.addedThisMonth, waiting: o.waiting })}
      </p>

      <Card>
        <CardHeader title={t("gigs.dueTitle")} description={t("gigs.dueIntro")} />
        <CardBody className="space-y-4">
          {o.due.length === 0 ? (
            <p className="text-sm text-fg-muted" data-testid="gig-due-none">
              {t("gigs.dueNone")}
            </p>
          ) : (
            <ul className="divide-y divide-border" data-testid="gig-due">
              {o.due.map((d) => (
                <li key={d.userId} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-medium text-fg">
                      {d.name} · {money(d.amountPaise)}
                    </p>
                    <p className="break-words text-xs text-fg-muted">
                      {d.schoolName} · {t("gigs.questionsCount", { count: d.questions })} · {d.throughMonth}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-fg">{d.upiId ? `${d.upiId} (${d.payeeName})` : t("gigs.noUpi")}</p>
                  </div>
                  <PaymentForm userId={d.userId} name={d.name} disabled={!d.upiId} />
                </li>
              ))}
            </ul>
          )}
          {o.accruingPaise > 0 && <p className="text-sm text-fg-muted">{t("gigs.accruing", { amount: money(o.accruingPaise) })}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.dialsTitle")} />
        <CardBody>
          <SettingsForm
            testId="gig-settings"
            dials={[
              { key: "questionRatePaise", label: t("gigs.setRate"), value: s.questionRatePaise, rupees: true },
              { key: "questionFreeCount", label: t("gigs.setFree"), value: s.questionFreeCount },
              { key: "questionMonthlyCap", label: t("gigs.setCap"), value: s.questionMonthlyCap },
              { key: "questionMonthlyBudgetPaise", label: t("gigs.setBudget"), value: s.questionMonthlyBudgetPaise, rupees: true },
              { key: "questionDailyLimit", label: t("gigs.setDaily"), value: s.questionDailyLimit },
              { key: "questionPendingLimit", label: t("gigs.setPending"), value: s.questionPendingLimit },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.sessionsDials")} description={t("gigs.sessionsLine", { slots: sessions.upcomingSlots, taken: sessions.seatsTaken, seats: sessions.upcomingSeats })} />
        <CardBody>
          <SettingsForm
            testId="gig-session-settings"
            dials={[
              { key: "pupilFreeOneToOnes", label: t("gigs.setPupilOne"), value: s.pupilFreeOneToOnes },
              { key: "pupilFreeWorkshops", label: t("gigs.setPupilWork"), value: s.pupilFreeWorkshops },
              { key: "expertStartOneToOnes", label: t("gigs.setExpertStartOne"), value: s.expertStartOneToOnes },
              { key: "expertStartWorkshops", label: t("gigs.setExpertStartWork"), value: s.expertStartWorkshops },
              { key: "expertMonthlyOneToOnes", label: t("gigs.setExpertMonthly"), value: s.expertMonthlyOneToOnes },
              { key: "expertQuarterlyWorkshops", label: t("gigs.setExpertQuarterly"), value: s.expertQuarterlyWorkshops },
              { key: "teacherMonthlyGuidance", label: t("gigs.setTeacherMonthly"), value: s.teacherMonthlyGuidance },
              { key: "freeCancelHours", label: t("gigs.setCancelHours"), value: s.freeCancelHours },
              { key: "workshopMaxSeats", label: t("gigs.setMaxSeats"), value: s.workshopMaxSeats },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("gigs.paymentsTitle")} />
        <CardBody>
          {o.payments.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("gigs.paymentsNone")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="gig-payments">
              {o.payments.map((p) => (
                <li key={p.id} className="py-3">
                  <p className="break-words text-sm font-medium text-fg">
                    {p.name} · {money(p.amountPaise)}
                  </p>
                  <p className="break-all text-xs text-fg-muted">
                    {formatInZone(new Date(p.paidAt), "Asia/Kolkata", { dateStyle: "medium" })} · {t("gigs.questionsCount", { count: p.questions })} · <span className="font-mono">{p.utr}</span> · <span className="font-mono">{p.upiId}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
