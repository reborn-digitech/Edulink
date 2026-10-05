import type { Metadata } from "next";
import Link from "next/link";
import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { talkDetail } from "@/lib/placement-talks";
import { momentFormatter } from "@/lib/school-zone";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableScroll } from "@/components/ui/table-scroll";
import { ActionForm } from "@/components/ui/action-form";
import { CellFrame, LINK, TABLE, TD, TH, cellContext } from "@/components/placement/parts";
import { talkBadge } from "@/components/placement/events";
import { cancelTalkAction, markTalkAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("talks.title"), robots: { index: false, follow: false } };
}

/**
 * One talk (R-2, 5 Oct 2026): when and where, the drive, the counts, and the
 * roster — those going first. Once it has started the TPO ticks who came
 * (a student who answered and is not ticked is marked absent); before it is
 * held the TPO may cancel it, which tells those going.
 */
export default async function TalkPage({ params }: { params: Promise<{ talkId: string }> }) {
  const { ctx, t, on, college } = await cellContext();
  const { talkId } = await params;
  const back = { href: "/placement/talks", label: t("talks.title") };
  if (!on) return <CellFrame t={t} on={false} college={college} current="talks" title={t("talks.title")} back={back}>{null}</CellFrame>;
  const [talk, moment] = await Promise.all([talkDetail(ctx, talkId), momentFormatter(ctx.schoolId)]);
  const answerLabel = (a: string | null) => (a === "GOING" ? t("talks.answerGoing") : a === "NOT_GOING" ? t("talks.answerNotGoing") : t("talks.answerNone"));
  return (
    <CellFrame t={t} on college={college} current="talks" title={talk.title} description={[talk.companyName, moment(talk.startsAt), talk.venue].filter(Boolean).join(" · ")} back={back}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {talkBadge(talk, t)}
        {talk.driveId ? (
          <Link className={LINK} href={`/placement/drives/${talk.driveId}`}>
            {t("talks.forDrive", { title: talk.driveTitle ?? "" })}
          </Link>
        ) : null}
        <span className="text-fg-muted">{t("talks.minutes", { count: talk.durationMinutes })}</span>
      </div>
      {talk.note ? <p className="text-sm text-fg">{talk.note}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("talks.colGoing")} value={talk.capacity === null ? talk.counts.going : `${talk.counts.going} / ${talk.capacity}`} />
        <StatTile label={t("talks.tileNotGoing")} value={talk.counts.notGoing} />
        <StatTile label={t("talks.colPresent")} value={talk.counts.present} tone="ok" />
        <StatTile label={t("talks.tileAbsent")} value={talk.counts.absent} />
      </div>
      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("talks.rosterTitle")} description={talk.canMark ? t("talks.rosterMarkIntro") : talk.started ? t("talks.rosterReadIntro") : t("talks.rosterAheadIntro")} />
        <CardBody>
          {talk.truncated ? <p className="mb-3 text-sm text-warn">{t("talks.truncated")}</p> : null}
          <ActionForm action={markTalkAction} className="space-y-4">
            <input type="hidden" name="talkId" value={talk.id} />
            <TableScroll label={t("talks.rosterTitle")}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>{t("talks.colStudent")}</th>
                    <th className={TH}>{t("talks.colPrn")}</th>
                    <th className={TH}>{t("talks.colAnswer")}</th>
                    <th className={TH}>{t("talks.colPresent")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {talk.roster.map((r) => (
                    <tr key={r.studentMembershipId}>
                      <td className={TD}>{r.name}</td>
                      <td className={TD}>{r.prn ?? "—"}</td>
                      <td className={TD}>{r.answer ? <Badge tone={r.answer === "GOING" ? "accent" : "neutral"}>{answerLabel(r.answer)}</Badge> : <span className="text-fg-subtle">{answerLabel(null)}</span>}</td>
                      <td className={TD}>
                        {talk.canMark ? (
                          <label className="flex min-h-11 items-center gap-2">
                            {r.answer || r.attendance ? <input type="hidden" name="known" value={r.studentMembershipId} /> : null}
                            <input type="checkbox" name="present" value={r.studentMembershipId} defaultChecked={r.attendance === "PRESENT"} className="size-4 accent-[var(--accent)]" aria-label={t("talks.presentFor", { name: r.name })} />
                          </label>
                        ) : r.attendance ? (
                          <Badge tone={r.attendance === "PRESENT" ? "ok" : "neutral"}>{r.attendance === "PRESENT" ? t("talks.present") : t("talks.absent")}</Badge>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            {talk.canMark ? <Button type="submit">{t("talks.saveAttendance")}</Button> : null}
          </ActionForm>
        </CardBody>
      </Card>
      {talk.canEdit ? (
        <Card>
          <CardHeader title={talk.status === "CANCELLED" ? t("talks.restoreTitle") : t("talks.cancelTitle")} description={talk.status === "CANCELLED" ? t("talks.restoreIntro") : t("talks.cancelIntro")} />
          <CardBody>
            <ActionForm action={cancelTalkAction}>
              <input type="hidden" name="talkId" value={talk.id} />
              <input type="hidden" name="status" value={talk.status === "CANCELLED" ? "SCHEDULED" : "CANCELLED"} />
              <Button type="submit" variant="secondary">{talk.status === "CANCELLED" ? t("talks.restore") : t("talks.cancel")}</Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </CellFrame>
  );
}
