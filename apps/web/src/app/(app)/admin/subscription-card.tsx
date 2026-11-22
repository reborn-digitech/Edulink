import { BuildingsIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import type { OfficeSubscription } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { formatDateKey } from "@/lib/dates";
import { officeSubscription } from "@/lib/school-terms";
import type { ActiveContext } from "@/lib/session";

/**
 * YOUR SHALAGHAR SUBSCRIPTION, the school's own read-only card (decision 0010 parts 1 to 3; the brief's §2.6 and phase 7;
 * the coordinating session's C2b, C3, C3a and C4a points 1 and 9 of 21 November 2026). It reads the office's door's answer
 * (officeSubscription) in the office's own words, none of the operator's: "not recorded yet" first while the school's terms
 * are not set; else the subscription a student a year, free by agreement, or no tier chosen yet; the premium add-on not on,
 * on and billed at its price (the door answers one only then), on with no charge for it yet, or free by agreement; free until
 * or renews on; and that Shalaghar sends an invoice and nothing is paid in the app. It stands in the school's settings for
 * the office and in its safety centre for the head, who cannot open settings, and a notice that the terms moved links each
 * person to it there (#subscription). A paused school's sentences come with part 4.
 */
export function subscriptionCardLines(card: OfficeSubscription, t: Translate, money: (paise: number) => string, day: (key: string) => string): string[] {
  const lines: string[] = [];
  const premiumOn = card.premium.students || card.premium.teachers;
  if (!card.termsSet) {
    lines.push(t("settings.subscriptionNotRecorded"));
    lines.push(premiumOn ? t("settings.premiumOnNotRecorded") : t("settings.premiumOff"));
  } else {
    const sub = card.subscriptionFigure;
    lines.push(!sub ? t("settings.subscriptionNoTier") : sub.paysPaise === 0 ? t("settings.subscriptionFree") : t("settings.subscriptionPrice", { amount: money(sub.paysPaise) }));
    const prem = card.premium.figure;
    if (!premiumOn) lines.push(t("settings.premiumOff"));
    else if (!card.premium.billed || !prem) lines.push(t("settings.premiumOnNoCharge"));
    else if (prem.paysPaise === 0) lines.push(t("settings.premiumFree"));
    else {
      const key = card.premium.students && card.premium.teachers ? "settings.premiumBilledBoth" : card.premium.students ? "settings.premiumBilledStudents" : "settings.premiumBilledTeachers";
      lines.push(t(key, { amount: money(prem.paysPaise) }));
    }
    lines.push(...dateLine(card, t, day));
  }
  lines.push(t("settings.subscriptionInvoiceNote"));
  return lines;
}

/**
 * The card's date line, by the standing the door sends, judged on the school's own day (the coordinating session's review,
 * C1): free until a day not come, or that the free period ended; renews on a day not come, or that the renewal date was; no
 * date for a suspended or ended school, since what a school is told of those standings is part 4's to decide; none without
 * a renewal on record.
 */
function dateLine(card: OfficeSubscription, t: Translate, day: (key: string) => string): string[] {
  if (!card.renewsOn) return [];
  const date = day(card.renewsOn);
  switch (card.state) {
    case "FREE":
      return [t("settings.subscriptionFreeUntil", { date })];
    case "FREE_ENDED":
      return [t("settings.subscriptionFreeEnded", { date })];
    case "PAID":
    case "INVOICED_UNPAID":
      return [t("settings.subscriptionRenewsOn", { date })];
    case "RENEWAL_PASSED":
    case "DUE_SINCE":
      return [t("settings.subscriptionRenewalWas", { date })];
    default:
      return [];
  }
}

/** The card, for a page of the school's office or head: read inside the school's fence through the office's door's library. */
export async function SubscriptionCard({ ctx }: { ctx: ActiveContext }) {
  const t = await getT();
  const locale = await getLocale();
  const card = await officeSubscription(ctx);
  const lines = subscriptionCardLines(
    card,
    t,
    (paise) => formatPaise(paise, locale),
    (key) => formatDateKey(key, { day: "numeric", month: "long", year: "numeric" }, locale),
  );
  return (
    <Card id="subscription">
      <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("settings.subscriptionTitle")} description={t("settings.subscriptionBody")} />
      <CardBody className="space-y-1.5">
        {lines.map((line) => (
          <p key={line} className="text-sm text-fg">
            {line}
          </p>
        ))}
      </CardBody>
    </Card>
  );
}
