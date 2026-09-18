import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { broadcastDetail } from "@/lib/messaging";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { audienceLabel, BROADCAST_STATUS_KEY, CHANNEL_KEY, SKIP_KEY, STATUS_KEY, STATUS_TONE, word } from "../labels";
import { ResendButton } from "./resend-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.messagingBroadcast") };
}

/** One notice's delivery report, person by person. The office may queue the failed ones again; the principal reads. */
export default async function BroadcastPage({ params }: { params: Promise<{ broadcastId: string }> }) {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const office = ctx.role === "ADMIN";
  const { broadcastId } = await params;

  let detail;
  try {
    detail = await broadcastDetail(ctx, broadcastId);
  } catch (error) {
    if (error instanceof AccessError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  const { broadcast: b, messages } = detail;
  const [school, classes] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
    b.audience.kind === "CLASS" ? db.class.findMany({ where: { id: b.audience.classId, schoolId: ctx.schoolId }, select: { id: true, name: true } }) : Promise.resolve([]),
  ]);
  const when = (d: Date) => formatInZone(d, school.timezone, { dateStyle: "medium", timeStyle: "short" }, locale);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("messaging.detailTitle", { title: b.title })}
        description={`${audienceLabel(t, b.audience, classes)} · ${b.channels.map((c) => word(t, CHANNEL_KEY, c)).join(", ")} · ${when(b.createdAt)} · ${b.author}`}
        back={{ href: "/admin/messaging", label: t("messaging.title") }}
        meta={<Badge tone={b.status === "DONE" ? "neutral" : "info"}>{word(t, BROADCAST_STATUS_KEY, b.status)}</Badge>}
        actions={office ? <ResendButton broadcastId={b.id} disabled={b.failed === 0} /> : undefined}
      />

      <Card>
        <CardBody className="space-y-3 pt-5">
          <p className="text-sm leading-relaxed text-fg">{b.body}</p>
          <div className="flex flex-wrap gap-1.5 tabular-nums">
            <Badge tone="outline">{t("messaging.detailRecipients")} {b.recipients}</Badge>
            <Badge tone="ok">{t("messaging.colSent")} {b.sent}</Badge>
            <Badge tone="ok">{t("messaging.colDelivered")} {b.delivered}</Badge>
            <Badge tone={b.failed > 0 ? "danger" : "neutral"}>{t("messaging.colFailed")} {b.failed}</Badge>
            <Badge tone={b.skipped > 0 ? "warn" : "neutral"}>{t("messaging.colSkipped")} {b.skipped}</Badge>
            {b.queued > 0 && <Badge tone="info">{t("messaging.statusQueued")} {b.queued}</Badge>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("messaging.detailRecipients")} />
        <CardBody>
          {messages.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("messaging.detailEmpty")}</p>
          ) : (
            <div className="overflow-x-auto" tabIndex={0}>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th className="py-2 pr-3 font-medium">{t("messaging.detailPerson")}</th>
                    <th className="py-2 pr-3 font-medium">{t("messaging.detailNumber")}</th>
                    <th className="py-2 pr-3 font-medium">{t("messaging.detailChannel")}</th>
                    <th className="py-2 pr-3 font-medium">{t("messaging.detailStatus")}</th>
                    <th className="py-2 font-medium">{t("messaging.detailReason")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {messages.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-3 font-medium text-fg">{m.name ?? "—"}</td>
                      <td className="py-2 pr-3 font-mono text-xs text-fg-muted">{m.to || "—"}</td>
                      <td className="py-2 pr-3 text-fg-muted">{m.status === "SKIPPED" ? "—" : word(t, CHANNEL_KEY, m.channel)}</td>
                      <td className="py-2 pr-3">
                        <Badge tone={STATUS_TONE[m.status] ?? "neutral"} size="sm">
                          {word(t, STATUS_KEY, m.status)}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-fg-muted">{m.skipReason ? word(t, SKIP_KEY, m.skipReason) : (m.error ?? "—")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
