import { SignOutIcon } from "@phosphor-icons/react/ssr";
import type { FamilyLeaving } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";

/** The family's read of the settlement on leaving (R-61 Q2, 10 Oct 2026): what the departure cancelled, what the office cancelled, what stays owed. */
export async function LeavingOutcomeCard({ outcome }: { outcome: FamilyLeaving }) {
  const t = await getT();
  const locale = await getLocale();
  const money = (paise: number) => formatPaise(paise, locale);
  const day = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
  return (
    <Card data-testid="family-leaving-outcome">
      <CardHeader icon={<SignOutIcon weight="duotone" className="size-5" />} title={t("ownerDecisions.familyOutcomeTitle")} description={t("ownerDecisions.familyOutcomeBody", { name: outcome.studentName })} />
      <CardBody className="space-y-3">
        {outcome.leftOnKey && <p className="text-sm text-fg-muted">{t("ownerDecisions.leftOn", { date: day(outcome.leftOnKey) })}</p>}
        {outcome.cancelledByDeparture.length > 0 && (
          <ul className="divide-y divide-border">
            {outcome.cancelledByDeparture.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                <span className="text-fg">{c.label} <span className="text-fg-muted">{day(c.dueDateKey)}</span></span>
                <span className="flex items-center gap-2"><Badge tone="ok" size="sm">{t("ownerDecisions.familyCancelledLine")}</Badge><span className="tabular-nums text-fg-muted line-through">{money(c.netPaise)}</span></span>
              </li>
            ))}
          </ul>
        )}
        {outcome.settlement ? (
          <>
            <ul className="divide-y divide-border">
              {outcome.settlement.lines.map((l, i) => (
                <li key={`${l.label}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                  <span className="text-fg">{l.label} <span className="text-fg-muted">{day(l.dueDateKey)}</span></span>
                  <span className="flex items-center gap-2">
                    <Badge tone={l.choice === "CANCEL" ? "ok" : "warn"} size="sm">{t(l.choice === "CANCEL" ? "ownerDecisions.familyCancelledLine" : "ownerDecisions.familyKeptLine")}</Badge>
                    <span className={l.choice === "CANCEL" ? "tabular-nums text-fg-muted line-through" : "tabular-nums text-fg"}>{money(l.balancePaise)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-fg-muted">{t("ownerDecisions.settledSummary", { cancelled: money(outcome.settlement.cancelledPaise), kept: money(outcome.settlement.keptPaise) })}</p>
          </>
        ) : (
          <p className="text-sm text-fg-muted">{t("ownerDecisions.familyNotSettled")}</p>
        )}
      </CardBody>
    </Card>
  );
}
