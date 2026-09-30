import type { Metadata } from "next";
import Link from "next/link";
import { ChatsCircleIcon, DeviceMobileIcon, FileTextIcon, MegaphoneIcon, PaperPlaneTiltIcon, PlusIcon, SlidersHorizontalIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { messagingOverview } from "@/lib/messaging";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { audienceLabel, broadcastHref, BROADCAST_STATUS_KEY, CHANNEL_KEY, PURPOSE_KEY, SKIP_KEY, STATUS_KEY, STATUS_TONE, TRANSPORT_KEY, word } from "./labels";
import { SettingsForm } from "./settings-form";
import { TemplatesList } from "./templates-list";
import { TestButton } from "./test-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.messaging") };
}

/**
 * Texts to families: this month's counts against the cap, the channel
 * switches, what the server can send with, the fixed templates, the notices
 * sent and the automatic texts. The office writes; the principal reads the
 * same page without the forms (see messaging.ts officeOrHead).
 */
export default async function MessagingPage() {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const [o, school, classes] = await Promise.all([
    messagingOverview(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { name: true, timezone: true } }),
    db.class.findMany({ where: { schoolId: ctx.schoolId }, select: { id: true, name: true } }),
  ]);
  const when = (d: Date) => formatInZone(d, school.timezone, { dateStyle: "medium", timeStyle: "short" }, locale);
  const transportTone = (state: string) => (state === "twilio" ? "ok" : state === "devbox" ? "info" : "warn");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("messaging.title")}
        description={t("messaging.intro")}
        actions={
          office ? (
            <Button asChild icon={<PlusIcon weight="bold" />}>
              <Link href="/admin/messaging/new">{t("messaging.broadcastNew")}</Link>
            </Button>
          ) : undefined
        }
      />

      {/* ---------------- the numbers ---------------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label={t("messaging.cardSentMonth")} value={o.month.sent} />
        <StatTile label={t("messaging.cardDelivered")} value={o.month.delivered} tone="ok" />
        <StatTile label={t("messaging.cardFailed")} value={o.month.failed} tone={o.month.failed > 0 ? "danger" : "neutral"} />
        <StatTile label={t("messaging.cardSkipped")} value={o.month.skipped} tone={o.month.skipped > 0 ? "warn" : "neutral"} />
        <StatTile label={t("messaging.cardSegments")} value={o.month.segments} hint={t("messaging.cardCap", { cap: o.month.cap })} tone={o.month.segments >= o.month.cap ? "danger" : "neutral"} />
        <StatTile label={t("messaging.cardParents")} value={o.parentsWithPhone} hint={t("messaging.cardParentsOf", { total: o.parentsTotal })} tone={o.parentsWithPhone < o.parentsTotal ? "warn" : "ok"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------- channels ---------------- */}
        {office && (
          <Card>
            <CardHeader icon={<SlidersHorizontalIcon weight="duotone" className="size-5" />} title={t("messaging.settingsTitle")} description={t("messaging.settingsIntro")} />
            <CardBody>
              <SettingsForm initial={o.settings} />
            </CardBody>
          </Card>
        )}

        {/* ---------------- on this server ---------------- */}
        <Card>
          <CardHeader icon={<DeviceMobileIcon weight="duotone" className="size-5" />} title={t("messaging.transportTitle")} />
          <CardBody className="space-y-3">
            <ul className="divide-y divide-border text-sm">
              {(["sms", "whatsapp"] as const).map((channel) => (
                <li key={channel} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-medium text-fg">{t(channel === "sms" ? "messaging.transportSms" : "messaging.transportWhatsapp")}</span>
                  <Badge tone={transportTone(o.transports[channel])} size="sm">
                    {word(t, TRANSPORT_KEY, o.transports[channel])}
                  </Badge>
                </li>
              ))}
            </ul>
            {o.transports.problems.length > 0 && (
              <div className="rounded-[--radius-md] bg-warn-soft px-3 py-2 text-xs text-warn">
                <p className="font-medium">{t("messaging.transportProblems")}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {o.transports.problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        {/* ---------------- send yourself a test ---------------- */}
        {office && (
          <Card>
            <CardHeader icon={<PaperPlaneTiltIcon weight="duotone" className="size-5" />} title={t("messaging.testTitle")} description={t("messaging.testIntro")} />
            <CardBody>
              <TestButton />
            </CardBody>
          </Card>
        )}
      </div>

      {/* ---------------- templates ---------------- */}
      <Card>
        <CardHeader icon={<FileTextIcon weight="duotone" className="size-5" />} title={t("messaging.templatesTitle")} description={t("messaging.templatesIntro")} />
        <CardBody className="space-y-3">
          <TemplatesList templates={o.templates} school={school.name} />
          <p className="text-xs text-fg-muted">{t("messaging.templatesCommand")}</p>
        </CardBody>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------------- notices sent ---------------- */}
        <Card>
          <CardHeader icon={<MegaphoneIcon weight="duotone" className="size-5" />} title={t("messaging.broadcastsTitle")} description={t("messaging.broadcastsIntro")} />
          <CardBody>
            {o.recent.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-muted">{t("messaging.broadcastsEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {o.recent.map((b) => (
                  <li key={b.id} className="py-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <span className="min-w-0 flex-1">
                        <Link href={broadcastHref(b.id)} className="block truncate font-medium text-fg hover:underline">
                          {b.title}
                        </Link>
                        <span className="block text-xs text-fg-muted">
                          {audienceLabel(t, b.audience, classes)} · {when(b.createdAt)} · {b.author}
                        </span>
                      </span>
                      <Badge tone={b.status === "DONE" ? "neutral" : "info"} size="sm">
                        {word(t, BROADCAST_STATUS_KEY, b.status)}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 tabular-nums">
                      <Badge tone="ok" size="sm">{t("messaging.colSent")} {b.sent}</Badge>
                      <Badge tone="ok" size="sm">{t("messaging.colDelivered")} {b.delivered}</Badge>
                      <Badge tone={b.failed > 0 ? "danger" : "neutral"} size="sm">{t("messaging.colFailed")} {b.failed}</Badge>
                      <Badge tone={b.skipped > 0 ? "warn" : "neutral"} size="sm">{t("messaging.colSkipped")} {b.skipped}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ---------------- recent automatic texts ---------------- */}
        <Card>
          <CardHeader icon={<ChatsCircleIcon weight="duotone" className="size-5" />} title={t("messaging.recentTitle")} />
          <CardBody>
            {o.recentMessages.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-muted">{t("messaging.recentEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {o.recentMessages.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-fg">{m.name ?? m.to}</span>
                      <span className="block text-xs text-fg-muted">
                        {word(t, PURPOSE_KEY, m.purpose)} · {word(t, CHANNEL_KEY, m.channel)} · {when(m.createdAt)}
                        {m.skipReason && <> · {word(t, SKIP_KEY, m.skipReason)}</>}
                        {m.error && <> · {m.error}</>}
                      </span>
                    </span>
                    <Badge tone={STATUS_TONE[m.status] ?? "neutral"} size="sm">
                      {word(t, STATUS_KEY, m.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
