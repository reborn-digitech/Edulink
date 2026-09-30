import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { familySessions, type BookingStatus } from "@/lib/gig-sessions";
import { gigSettings } from "@/lib/gig-questions";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { BookSeat, SeatActions } from "./family-forms";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.sessionsTitle"), robots: { index: false, follow: false } };
}

const TONE: Record<BookingStatus, "info" | "ok" | "neutral" | "warn" | "danger"> = { PENDING_CONSENT: "info", CONFIRMED: "ok", CANCELLED: "neutral", DELIVERED: "ok", MISSED: "warn", UNHELD: "danger" };

/**
 * Sessions and workshops, for a pupil and for a guardian: the free allowance
 * of the school year, the seats they hold (with the meeting link only while
 * one is confirmed), and the times open to book. A pupil's own ask waits for
 * a guardian, who answers it here.
 */
export default async function SessionsPage() {
  const ctx = await requireUser();
  if (ctx.role !== "STUDENT" && ctx.role !== "PARENT") redirect("/");
  const t = await getT();
  const locale = await getLocale();
  const [{ children }, settings] = await Promise.all([familySessions(ctx), gigSettings()]);
  const byGuardian = ctx.role === "PARENT";

  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.sessionsTitle")} description={t("gigs.sessionsIntro")} />
      {children.map((c) => {
        const when = (iso: string) => formatInZone(new Date(iso), c.timeZone, { dateStyle: "medium", timeStyle: "short" }, locale);
        return (
          <section key={c.id} className="space-y-4" data-testid="session-child">
            {byGuardian && (
              <h2 className="text-base font-semibold text-fg">
                {c.name} · {c.schoolName}
              </h2>
            )}
            <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg" data-testid="session-allowance">
              {t("gigs.allowanceLine", { oneLeft: c.allowance.ONE_TO_ONE.left, oneAllowed: c.allowance.ONE_TO_ONE.allowed, workLeft: c.allowance.WORKSHOP.left, workAllowed: c.allowance.WORKSHOP.allowed })}
            </p>
            <Card>
              <CardHeader title={t("gigs.yourSeats")} />
              <CardBody>
                {c.bookings.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t("gigs.noSeats")}</p>
                ) : (
                  <ul className="divide-y divide-border" data-testid="session-seats">
                    {c.bookings.map((b) => (
                      <li key={b.id} className="space-y-2 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-fg">{b.title}</p>
                            <p className="text-xs text-fg-muted">
                              {t(`gigs.kind${b.kind}`)} · {when(b.startsAt)} · {t("gigs.withProvider", { name: b.providerName })}
                              {b.lateCancel ? ` · ${t("gigs.lateCancelNote")}` : ""}
                            </p>
                          </div>
                          <Badge tone={TONE[b.status]}>{t(`gigs.bookingStatus${b.status}`)}</Badge>
                        </div>
                        {b.meetingUrl && (
                          <p className="text-sm">
                            <a href={b.meetingUrl} target="_blank" rel="noreferrer noopener" className="tap inline-flex items-center font-medium text-accent-strong underline underline-offset-4" data-testid="session-link">
                              {t("gigs.joinLink")}
                            </a>
                            <span className="ml-2 text-xs text-fg-muted">{t("gigs.linkHint")}</span>
                          </p>
                        )}
                        <SeatActions bookingId={b.id} title={b.title} canConsent={b.canConsent} canCancel={b.canCancel} canRate={b.canRate} canReportUnheld={b.canReportUnheld} confirmed={b.status === "CONFIRMED"} lateHours={settings.freeCancelHours} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("gigs.openTitle")} />
              <CardBody>
                {c.open.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t("gigs.noneOpen")}</p>
                ) : (
                  <ul className="divide-y divide-border" data-testid="session-open">
                    {c.open.map((s) => (
                      <li key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-fg">{s.title}</p>
                          <p className="text-xs text-fg-muted">
                            {t(`gigs.kind${s.kind}`)} · {when(s.startsAt)} · {t("gigs.withProvider", { name: s.providerName })} ({t(`gigs.provider${s.providerKind}`)})
                            {s.kind === "WORKSHOP" ? ` · ${t("gigs.seatsLeft", { count: s.seatsLeft })}` : ""}
                          </p>
                          {s.providerHeadline && <p className="text-xs text-fg-muted">{s.providerHeadline}</p>}
                        </div>
                        <BookSeat slotId={s.id} childId={c.id} byGuardian={byGuardian} title={s.title} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </section>
        );
      })}
    </div>
  );
}
