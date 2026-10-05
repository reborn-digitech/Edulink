import Link from "next/link";
import { CheckSquareIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { Translate } from "@/lib/i18n/dictionary";
import { isoToDisplayDate } from "@/lib/dates";
import type { FamilySlip } from "@/lib/permission-slips-family";

/**
 * The permission slips waiting for this family's yes or no (R-1, risks batch):
 * each names the children still unanswered and the day it closes, and opens
 * the notice, where the answer is given and shows who gave it.
 */
export function FamilySlipsCard({ slips, t }: { slips: FamilySlip[]; t: Translate }) {
  if (slips.length === 0) return null;
  return (
    <Card className="border-warn/40" data-testid="family-slips">
      <CardHeader icon={<CheckSquareIcon weight="duotone" className="size-5" />} title={t("risksWeb.slipsTitle")} description={t("risksWeb.slipsIntro")} />
      <CardBody className="pt-0">
        <ul className="divide-y divide-border">
          {slips.map((s) => (
            <li key={s.postId}>
              <Link href={`/bulletin/${s.postId}#slip`} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="min-w-0">
                  <span className="block font-medium text-fg">{s.question}</span>
                  <span className="block text-xs text-fg-muted">
                    {s.title} · {t("risksWeb.slipFor", { names: s.unanswered.join(", ") })}
                    {s.consentBy ? ` · ${t("risksWeb.slipBy", { date: isoToDisplayDate(s.consentBy) })}` : ""}
                  </span>
                </span>
                <span className="text-sm font-semibold text-accent-strong">{t("risksWeb.slipAnswer")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
