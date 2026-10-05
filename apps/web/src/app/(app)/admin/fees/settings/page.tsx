import type { Metadata } from "next";
import { CreditCardIcon, QrCodeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { feeSettings } from "@/lib/fees";
import { currentAcademicYear } from "@/lib/academic-year";
import { formatDate } from "@/lib/dates";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForms } from "./settings-forms";
import { GatewayForm } from "./gateway-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.feeSettings") };
}

/**
 * How families pay: the school's UPI id, the school's own gateway keys, the
 * receipt series and the bank note. Money goes to the school and only the
 * school — see docs/decisions/0003; this page holds the pointers, never the
 * money.
 */
export default async function FeeSettingsPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const [s, year, school] = await Promise.all([feeSettings(ctx.schoolId), currentAcademicYear(ctx.schoolId), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const webhookUrl = `${base}/api/webhooks/razorpay/${ctx.schoolId}`;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("fees.settingsTitle")} description={t("fees.settingsIntro")} back={{ href: "/admin/fees", label: t("fees.title") }} />

      <Card>
        <CardHeader icon={<QrCodeIcon weight="duotone" className="size-5" />} title={t("fees.upiTitle")} action={s.upiId ? <Badge tone="ok">{s.upiId}</Badge> : undefined} />
        <CardBody>
          <SettingsForms initial={{ upiId: s.upiId ?? "", upiPayee: s.upiPayee ?? "", receiptPrefix: s.receiptPrefix, bankNote: s.bankNote ?? "", pupilFeeViewAge: s.pupilFeeViewAge === null ? "" : String(s.pupilFeeViewAge) }} yearName={year?.name ?? "—"} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<CreditCardIcon weight="duotone" className="size-5" />}
          title={t("fees.gatewayTitle")}
          description={t("fees.gatewayIntro")}
          action={s.gateway ? <Badge tone="ok">{s.gateway.mode === "LIVE" ? t("fees.gatewayLive") : t("fees.gatewayTest")}</Badge> : undefined}
        />
        <CardBody className="space-y-4">
          <p className="text-sm text-fg">{s.gateway ? t("fees.gatewayOn", { keyId: s.gateway.keyId, mode: s.gateway.mode === "LIVE" ? t("fees.gatewayLive") : t("fees.gatewayTest"), when: formatDate(s.gateway.updatedAt, school.timezone) }) : t("fees.gatewayOff")}</p>
          {s.transport === "devbox" && <p className="rounded-[var(--radius-md)] bg-info-soft px-3 py-2 text-xs text-info">{t("fees.gatewayDevbox")}</p>}
          {s.transport === "off" && <p className="rounded-[var(--radius-md)] bg-warn-soft px-3 py-2 text-xs text-warn">{t("fees.gatewayServerOff")}</p>}
          {!s.sealingAvailable ? (
            <p className="rounded-[var(--radius-md)] border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">{t("fees.gatewayNoKey")}</p>
          ) : (
            <GatewayForm hasGateway={Boolean(s.gateway)} />
          )}
          <div className="space-y-1.5">
            <p className="text-xs text-fg-muted">{t("fees.gatewayWebhookUrl")}</p>
            <code className="block select-all break-all rounded-[var(--radius-sm)] bg-surface-muted px-3 py-2 text-xs text-fg">{webhookUrl}</code>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
