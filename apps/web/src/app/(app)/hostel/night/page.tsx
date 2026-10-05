import type { Metadata } from "next";
import Link from "next/link";
import { MoonStarsIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { nightRegister } from "@/lib/hostel-night";
import { addDaysToKey, formatDateKey, isDateKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { LEAVE_KIND_KEY, WardenFrame, wardenContext, when } from "@/components/hostel/parts";
import { gateInAction, gateOutAction } from "../actions";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeDesks.nightTitle"), robots: { index: false, follow: false } };
}

const STATE: Record<string, { key: TranslationKey; tone: "ok" | "warn" | "danger" | "neutral" }> = {
  OVERDUE: { key: "collegeDesks.nightStateOVERDUE", tone: "danger" },
  OUT: { key: "collegeDesks.nightStateOUT", tone: "neutral" },
  NOT_OUT: { key: "collegeDesks.nightStateNOT_OUT", tone: "neutral" },
  BACK_LATE: { key: "collegeDesks.nightStateBACK_LATE", tone: "warn" },
  BACK: { key: "collegeDesks.nightStateBACK", tone: "ok" },
};

const hhmm = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/**
 * TONIGHT AT THE GATE (5 Oct 2026; the warden's campaign recommendation): the
 * night-out register and the curfew. Every approved leave that covers the
 * night — a trip home, a night out, an outing — with when each is due back
 * (its end, or for an outing at a college the hostel's curfew that evening),
 * out and in through the gate here, back late, or not back yet. The curfew
 * and whether night-outs are allowed are the office's (the college's hostel
 * rules); a return after either is flagged late as it always was.
 */
export default async function HostelNightPage({ searchParams }: { searchParams: Promise<{ date?: string; ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite, timeZone } = await wardenContext();
  const { date, ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="night" title={t("collegeDesks.nightTitle")}>{null}</WardenFrame>;
  const night = await nightRegister(ctx, date && isDateKey(date) ? date : undefined);
  const back = date && isDateKey(date) ? `/hostel/night?date=${date}` : "/hostel/night";
  const dayLabel = formatDateKey(night.dateKey, { weekday: "long", day: "numeric", month: "long" }, locale);
  return (
    <WardenFrame t={t} on current="night" title={t("collegeDesks.nightTitle")} description={t("collegeDesks.nightIntro")} ok={ok} error={error}>
      <nav aria-label={t("collegeDesks.nightTitle")} className="flex flex-wrap items-center gap-3 text-sm">
        <Link className="inline-flex min-h-11 items-center text-accent-strong underline" href={`/hostel/night?date=${addDaysToKey(night.dateKey, -1)}`}>{t("collegeDesks.nightPrev")}</Link>
        <span className="font-semibold text-fg">{dayLabel}</span>
        <Link className="inline-flex min-h-11 items-center text-accent-strong underline" href={`/hostel/night?date=${addDaysToKey(night.dateKey, 1)}`}>{t("collegeDesks.nightNext")}</Link>
        {date ? <Link className="inline-flex min-h-11 items-center text-fg-muted underline" href="/hostel/night">{t("collegeDesks.nightToday")}</Link> : null}
      </nav>
      <Card>
        <CardHeader icon={<MoonStarsIcon weight="duotone" className="size-5" />} title={t("collegeDesks.nightRulesTitle")} description={night.college ? undefined : t("collegeDesks.nightNoCurfew")} />
        <CardBody className="pt-0">
          <ul className="divide-y divide-border text-sm">
            {night.hostels.map((h) => (
              <li key={h.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span className="font-medium text-fg">{h.name}</span>
                <span className="text-fg-muted">
                  {[night.college ? t("collegeDesks.nightCurfew", { time: hhmm(h.curfewMinute) }) : null, t(h.nightOutAllowed ? "collegeDesks.nightOutsAllowed" : "collegeDesks.nightOutsNotAllowed")].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardBody className="p-0">
          {night.leaves.length === 0 ? (
            <EmptyState
              title={t("collegeDesks.nightNone")}
              description={t("collegeDesks.nightNoneBody", { date: dayLabel })}
              action={
                <Button asChild size="sm" variant="secondary">
                  <Link href="/hostel/leave">{t("collegeDesks.nightOpenLeave")}</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {night.leaves.map((l) => (
                <li key={l.leaveId} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-fg">
                      {l.name} · {l.hostelName} {l.roomNumber} · {t(LEAVE_KIND_KEY[l.kind])}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {t(l.curfew ? "collegeDesks.nightBackByCurfew" : "collegeDesks.nightBackBy", { time: when(l.backBy, timeZone, locale) })}
                      {l.outAt ? ` · ${t("hostel.outAt", { at: when(l.outAt, timeZone, locale) })}` : ""}
                      {l.inAt ? ` · ${t("hostel.inAt", { at: when(l.inAt, timeZone, locale) })}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATE[l.state]!.tone}>{t(STATE[l.state]!.key)}</Badge>
                    {canWrite && l.state === "NOT_OUT" ? (
                      <form action={gateOutAction}>
                        <input type="hidden" name="leaveId" value={l.leaveId} />
                        <input type="hidden" name="back" value={back} />
                        <Button type="submit" size="sm" variant="secondary">{t("hostel.signOut")}</Button>
                      </form>
                    ) : null}
                    {canWrite && (l.state === "OUT" || l.state === "OVERDUE") ? (
                      <form action={gateInAction}>
                        <input type="hidden" name="leaveId" value={l.leaveId} />
                        <input type="hidden" name="back" value={back} />
                        <Button type="submit" size="sm" variant="secondary">{t("hostel.signIn")}</Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </WardenFrame>
  );
}
