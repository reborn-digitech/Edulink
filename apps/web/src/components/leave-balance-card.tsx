import { CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import type { LeaveBalance } from "@/lib/staff-records";
import type { Translate } from "@/lib/i18n/dictionary";

/** One card that says how much leave is left this year — the teacher's page and their profile share it. */
export function LeaveBalanceCard({ balance, t }: { balance: LeaveBalance; t: Translate }) {
  return (
    <Card data-testid="leave-balance-card">
      <CardHeader
        icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
        title={t("staff.balanceTitle")}
        description={balance.yearName ? t("staff.balanceYear", { year: balance.yearName }) : undefined}
      />
      <CardBody>
        <p className="text-lg font-semibold text-fg">
          {balance.entitlement === null
            ? t("staff.noEntitlement", { used: balance.used })
            : t("staff.balance", { used: balance.used, entitlement: balance.entitlement, remaining: balance.remaining ?? 0 })}
        </p>
        {balance.pending > 0 && <p className="mt-1 text-sm text-fg-muted">{t("staff.balancePending", { pending: balance.pending })}</p>}
      </CardBody>
    </Card>
  );
}
