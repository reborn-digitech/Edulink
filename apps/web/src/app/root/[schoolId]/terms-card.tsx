import { BuildingsIcon, StarIcon } from "@phosphor-icons/react/ssr";
import { collegeTierOf, isCollegeKind, paysPaise, subscriptionTerms, tierMonthPaise, type OperatorSchoolModules } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getT } from "@/lib/i18n/server";
import { lastTermsChange, readOffer, readSchoolTerms, schoolDay } from "@/lib/school-terms";
import { premiumSwitchLines } from "@/lib/terms-lines";
import type { ActiveContext } from "@/lib/session";
import { datesSentence, partHow, premiumCell, stateLabel, stateTone } from "@/lib/terms-sentences";
import { consoleFmt } from "../subscriptions/fmt";
import { TermsControls } from "./terms-controls";

/**
 * SUBSCRIPTION AND PREMIUM, the operator's card on a school's page (decision 0010; the brief's §2.3, phase 5): the Shalaghar
 * subscription a student a year and how it is priced, the premium add-on (its switches, its price, or why it is not billed:
 * C2, C3), free until or renews on, the year at today's prices, last count (rule 8), the last change, Record payment, and,
 * collapsed, the status and dates for correcting a record entered wrongly (the children). C2's lines stand beside the
 * premium switches: a plan not asked for, a plan's feature switched off for everyone, Vidura not switched on for the school
 * (with its switch one press away). Terms not set: what it pays from before, Set terms, no estimate. Every line is the
 * server's (src/lib/terms-sentences.ts); the recording line and the standing acts come with phases 12 and 13.
 */
export async function TermsCard({
  session,
  schoolId,
  oldPlan,
  modules,
  sheet,
  children,
}: {
  session: ActiveContext;
  schoolId: string;
  oldPlan: { code: string; priceMonthlyPaise: number | null } | null;
  modules: OperatorSchoolModules | null;
  sheet: "subscription" | "premium" | "payment" | null;
  children: React.ReactNode;
}) {
  const t = await getT();
  const f = await consoleFmt();
  const view = await readSchoolTerms(session, schoolId);
  if ("ok" in view) return null;
  const [offer, last, today] = await Promise.all([readOffer(), lastTermsChange(session, schoolId), schoolDay(session, schoolId)]);
  const college = isCollegeKind(view.kind);
  const premiumOn = view.premiumStudents || view.premiumTeachers;

  // C2's lines beside the premium switches: one compact line for the plans not asked for, the plans' features switched off for
  // everyone only while this school has premium on (C5 point 6), and Vidura not switched on; the terms door answers the same
  // lines to the phone (src/lib/terms-lines.ts; C7 point 7d). A removed school's page reads no modules, and has no Vidura line.
  const { info: premiumLines, viduraOff } = await premiumSwitchLines(session, view, f, modules);

  // Terms not set: what it pays from before (a tier's twelfth of the roll, else the plan's old monthly price), and no estimate.
  const oldMonthPaise = view.termsSet ? null : collegeTierOf(oldPlan?.code) ? tierMonthPaise(oldPlan?.code, view.pupils ?? 0) || null : (oldPlan?.priceMonthlyPaise ?? null);
  const sub = view.subscriptionFigure;
  const subscriptionLine = !view.termsSet
    ? oldMonthPaise
      ? t("subs.sNotSetOld", { school: view.name, amount: f.money(oldMonthPaise) })
      : t("subs.sNotSet", { school: view.name })
    : !sub
      ? t("operatorCollege.noTierChosen")
      : sub.paysPaise === 0
        ? t("root.freeByAgreement")
        : t("subs.cardSubscription", { price: f.money(sub.paysPaise), how: partHow(f, sub) });
  // Billed only where there is a bill: a college with no tier has none, and premiumCell says so (the review of bace327b, T1).
  const premiumLine = premiumOn && view.premiumBilled && view.subscriptionFigure !== null && view.premiumFigure.paysPaise > 0 ? t("subs.cardPremium", { price: f.money(view.premiumFigure.paysPaise), how: partHow(f, view.premiumFigure) }) : premiumCell(f, view);
  const estimate = !view.termsSet
    ? null
    : view.bill
      ? view.bill.pupils === 1
        ? t("subs.estimateOne", { amount: f.money(view.bill.totalPaise) })
        : t("subs.estimateMany", { amount: f.money(view.bill.totalPaise), count: view.bill.pupils })
      : !sub
        ? t("subs.noEstimateTier")
        : view.pupils === null
          ? t("subs.noEstimateCount")
          : !view.renewsOn
            ? t("subs.noEstimateRenewal")
            : null;
  const lastLine = last
    ? t("subs.lastChange", {
        what: t(`subs.last${last.what}` as Parameters<typeof t>[0]),
        who: last.byUserId === session.user.id ? t("subs.byYou") : (last.byName ?? t("subs.byAnother")),
        date: f.day(last.day),
      })
    : null;

  // Our figures for the sheets' chips and warnings: our subscription (a college's tier), our premium, both after our discount.
  const ourSub = subscriptionTerms({ kind: view.kind, planCode: view.planCode, own: null }, { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps });

  return (
    <Card id="subscription" data-testid="terms-card">
      <CardHeader
        icon={<BuildingsIcon weight="duotone" className="size-5" />}
        title={t("subs.cardTitle")}
        description={t("subs.cardIntro")}
        action={
          <span className="flex flex-wrap gap-1.5">
            {!view.termsSet && (
              <Badge tone="warn" size="sm">
                {t("subs.badgeTermsNotSet")}
              </Badge>
            )}
            <Badge tone={stateTone(view.state)} size="sm">
              {stateLabel(f, view)}
            </Badge>
          </span>
        }
      />
      <CardBody className="space-y-3">
        <div className="space-y-1.5 text-sm">
          <p className="flex items-start gap-2 text-fg">
            <BuildingsIcon weight="duotone" className="mt-0.5 size-4 shrink-0 text-fg-muted" />
            <span>
              <span className="font-semibold">{t("subs.partSubscription")}</span> · {subscriptionLine}
            </span>
          </p>
          <p className="flex items-start gap-2 text-fg">
            <StarIcon weight="duotone" className="mt-0.5 size-4 shrink-0 text-fg-muted" />
            <span>
              <span className="font-semibold">{t("subs.partPremium")}</span> · {premiumLine}
            </span>
          </p>
          <p className="text-fg">{datesSentence(f, view)}</p>
          {estimate && <p className="text-fg-muted">{estimate}</p>}
          {lastLine && <p className="text-xs text-fg-muted">{lastLine}</p>}
          {premiumLines.map((line) => (
            <p key={line} className="text-xs text-fg-muted">
              {line}
            </p>
          ))}
        </div>
        <TermsControls
          schoolId={schoolId}
          school={view.name}
          college={college}
          expect={{ termsSetAt: view.termsSetAt, premiumStudents: view.premiumStudents, premiumTeachers: view.premiumTeachers, subscription: view.subscription, premium: view.premium, note: view.note }}
          ours={{ subscriptionPaise: ourSub?.paysPaise ?? null, subscriptionDiscountBps: offer.subscriptionDiscountBps, premiumPaise: paysPaise(offer.premiumPricePaise, offer.premiumDiscountBps), premiumDiscountBps: offer.premiumDiscountBps }}
          premiumLines={premiumLines}
          payment={{ fromStatus: view.status, fromDueAt: view.renewsOn, today: today ?? new Date().toISOString().slice(0, 10), billPaise: view.bill?.totalPaise ?? null }}
          viduraOff={viduraOff}
          initialSheet={sheet}
        />
        <details className="rounded-[var(--radius-md)] border border-border px-4 py-3">
          <summary className="tap inline-flex cursor-pointer items-center text-sm font-semibold text-fg">{t("subs.correctionsTitle")}</summary>
          <p className="mt-2 text-xs text-fg-muted">{t("subs.correctionsIntro")}</p>
          <div className="mt-3">{children}</div>
        </details>
      </CardBody>
    </Card>
  );
}
