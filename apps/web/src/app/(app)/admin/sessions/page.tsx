import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { schoolSessions, type BookingStatus } from "@/lib/gig-sessions";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CancelWithReason } from "@/components/gigs/provider-forms";
import { GuidanceSwitch } from "./office-forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.officeTitle"), robots: { index: false, follow: false } };
}

const TONE: Record<BookingStatus, "info" | "ok" | "neutral" | "warn" | "danger"> = { PENDING_CONSENT: "info", PENDING_PAYMENT: "warn", CONFIRMED: "ok", CANCELLED: "neutral", DELIVERED: "ok", MISSED: "warn", UNHELD: "danger" };

/**
 * The office's view of sessions: every one its pupils have asked for or
 * booked, with experts and with its own teachers, without the meeting link;
 * the switch that lets its teachers offer guidance; and the power to cancel a
 * seat with a reason the family is told.
 */
export default async function AdminSessionsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const view = await schoolSessions(ctx);
  const when = (iso: string) => formatInZone(new Date(iso), view.timeZone, { dateStyle: "medium", timeStyle: "short" }, locale);

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.officeTitle")} description={t("gigs.officeIntro")} />
      {/* The teachers' guidance switch, while the platform has teacher sessions on (15 Oct 2026). */}
      {view.teacherSessionsOn && <GuidanceSwitch on={view.guidanceOn} canSwitch={view.canSwitch} />}
      <Card>
        <CardBody>
          {view.bookings.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("gigs.officeNone")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="office-sessions">
              {view.bookings.map((b) => (
                <li key={b.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium text-fg">
                        {b.pupilName} · {b.title}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {t(`gigs.kind${b.kind}`)} · {when(b.startsAt)} · {t("gigs.withProvider", { name: b.providerName })} ({t(`gigs.provider${b.providerKind}`)})
                        {b.paid ? ` · ${t("gigs.paidSeat")}` : ""}
                      </p>
                      <p className="break-words text-xs text-fg-muted">{b.purpose}</p>
                    </div>
                    <Badge tone={TONE[b.status]}>{t(`gigs.bookingStatus${b.status}`)}</Badge>
                  </div>
                  {b.canCancel && <CancelWithReason id={b.id} what="seat" title={[b.pupilName, b.title].join(", ")} />}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
