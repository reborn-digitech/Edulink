import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { listLeave } from "@/lib/hostel";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaveSummary, WardenFrame, wardenContext } from "@/components/hostel/parts";
import { decideLeaveAction, gateInAction, gateOutAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.tabLeave"), robots: { index: false, follow: false } };
}

/**
 * Leave and the gate: asks waiting for a guardian (shown, not yet the
 * warden's), asks ready to decide, and approved leave to sign out and back in
 * — a return after the leave's end is flagged late to the office and family.
 */
export default async function HostelLeavePage({ searchParams }: { searchParams: Promise<{ show?: string; ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite, timeZone } = await wardenContext();
  const { show, ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="leave" title={t("hostel.tabLeave")}>{null}</WardenFrame>;
  const status = show === "TODAY" ? "TODAY" : show === "ALL" ? "ALL" : "OPEN";
  const list = await listLeave(ctx, status);
  const back = `/hostel/leave${status === "OPEN" ? "" : `?show=${status}`}`;
  return (
    <WardenFrame t={t} on current="leave" title={t("hostel.tabLeave")} description={t("hostel.leaveIntro")} ok={ok} error={error}>
      <p className="flex flex-wrap gap-3 text-sm">
        {(["OPEN", "TODAY", "ALL"] as const).map((s) => (
          <Link key={s} href={s === "OPEN" ? "/hostel/leave" : `/hostel/leave?show=${s}`} aria-current={s === status ? "page" : undefined} className={s === status ? "font-semibold text-accent-strong" : "text-fg-muted hover:text-fg"}>
            {t(s === "OPEN" ? "hostel.showOpen" : s === "TODAY" ? "hostel.showToday" : "hostel.showAll")}
          </Link>
        ))}
      </p>
      <Card>
        <CardBody className="p-0">
          {list.items.length === 0 ? (
            <p className="px-5 py-5 text-sm text-fg-muted">{t("hostel.noLeave")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {list.items.map((l) => (
                <li key={l.id} className="space-y-2 px-5 py-3">
                  <LeaveSummary l={l} t={t} timeZone={timeZone} locale={locale} showName />
                  {canWrite ? (
                    <div className="flex flex-wrap gap-2">
                      {l.status === "PENDING" ? (
                        <form action={decideLeaveAction} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="leaveId" value={l.id} />
                          <input type="hidden" name="back" value={back} />
                          <label className="text-xs text-fg-muted">
                            {t("hostel.decisionNote")}
                            <input name="note" maxLength={300} className="mt-1 block min-h-11 w-56 max-w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg" />
                          </label>
                          <Button type="submit" size="sm" name="decision" value="APPROVE">
                            {t("hostel.approve")}
                          </Button>
                          <Button type="submit" size="sm" variant="ghost" name="decision" value="DECLINE">
                            {t("hostel.decline")}
                          </Button>
                        </form>
                      ) : null}
                      {l.status === "AWAITING_CONSENT" ? <span className="text-xs font-medium text-warn">{t("hostel.waitingForGuardian")}</span> : null}
                      {l.status === "APPROVED" && !l.outAt ? (
                        <form action={gateOutAction}>
                          <input type="hidden" name="leaveId" value={l.id} />
                          <input type="hidden" name="back" value={back} />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("hostel.signOut")}
                          </Button>
                        </form>
                      ) : null}
                      {l.outAt && !l.inAt ? (
                        <form action={gateInAction}>
                          <input type="hidden" name="leaveId" value={l.id} />
                          <input type="hidden" name="back" value={back} />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("hostel.signIn")}
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </WardenFrame>
  );
}
