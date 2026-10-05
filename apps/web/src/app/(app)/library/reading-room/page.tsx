import type { Metadata } from "next";
import { ArmchairIcon, SignInIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TextField, DateField } from "@/components/ui/field";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModuleFlash, NUM, TD, TH } from "@/components/module-flash";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { readingRoomDay } from "@/lib/reading-room";
import { RuleRefusal } from "@/lib/rule-refusal";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { readingRoomScanAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("readingRoom.title"), robots: { index: false, follow: false } };
}

/**
 * The reading-room register (risks batch 5A, 5 Oct 2026): the desk signs a
 * reader in and out by card or student code, and the day report below lists
 * every visit of the day, who is still inside, readers by kind, the average
 * stay and the busiest hour. Another day is read with ?day=.
 */
export default async function ReadingRoomPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, timeZone } = await deskContext();
  if (!on) return <DeskFrame t={t} on={false} current="readingRoom" title={t("readingRoom.title")}>{null}</DeskFrame>;
  const sp = await searchParams;
  const asked = typeof sp.day === "string" && sp.day ? sp.day : undefined;
  let r;
  try {
    r = await readingRoomDay(ctx, asked);
  } catch (error) {
    // A day in the future or not a day: today's report, with the sentence.
    if (!(error instanceof RuleRefusal)) throw error;
    r = await readingRoomDay(ctx);
  }
  const time = (iso: string) => formatInZone(new Date(iso), timeZone, { timeStyle: "short" }, locale);
  return (
    <DeskFrame t={t} on current="readingRoom" title={t("readingRoom.title")} description={t("readingRoom.intro")}>
      <ModuleFlash t={t} params={sp} />
      {r.canRecord && r.today ? (
        <Card>
          <CardHeader icon={<SignInIcon weight="duotone" className="size-5" />} title={t("readingRoom.scanTitle")} description={t("readingRoom.scanBody")} />
          <CardBody>
            <form action={readingRoomScanAction} className="flex flex-wrap items-end gap-3">
              <TextField label={t("readingRoom.fieldCode")} name="code" required maxLength={40} autoComplete="off" className="min-w-56 flex-1" />
              <Button type="submit" name="action" value="IN">{t("readingRoom.signIn")}</Button>
              <Button type="submit" name="action" value="OUT" variant="secondary">{t("readingRoom.signOut")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      <form method="get" className="flex flex-wrap items-end gap-3">
        <DateField label={t("readingRoom.fieldDay")} name="day" defaultValue={r.dayKey} />
        <Button type="submit" variant="secondary">{t("readingRoom.showDay")}</Button>
      </form>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("readingRoom.statReaders")} value={r.readers} />
        <StatTile label={t("readingRoom.statStudents")} value={r.students} />
        <StatTile label={t("readingRoom.statStaff")} value={r.staff} />
        <StatTile label={r.today ? t("readingRoom.statInside") : t("readingRoom.statNotOut")} value={r.inside} tone={!r.today && r.inside ? "warn" : "neutral"} />
        <StatTile label={t("readingRoom.statAverage")} value={r.averageMinutes === null ? "—" : t("readingRoom.minutes", { count: r.averageMinutes })} />
        <StatTile label={t("readingRoom.statBusiest")} value={r.busiestHour === null ? "—" : `${String(r.busiestHour).padStart(2, "0")}:00`} />
      </div>
      <Card>
        <CardHeader icon={<ArmchairIcon weight="duotone" className="size-5" />} title={t("readingRoom.dayTitle", { day: formatDateKey(r.dayKey, { weekday: "short", day: "numeric", month: "short", year: "numeric" }, locale) })} />
        <CardBody>
          {r.visits.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("readingRoom.none")} description={r.today ? t("readingRoom.noneToday") : t("readingRoom.noneDay")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("readingRoom.colReader")}</th>
                    <th scope="col" className={TH}>{t("readingRoom.colIn")}</th>
                    <th scope="col" className={TH}>{t("readingRoom.colOut")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("readingRoom.colMinutes")}</th>
                    <th scope="col" className={TH}><span className="sr-only">{t("readingRoom.colAction")}</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.visits.map((v) => (
                    <tr key={v.id}>
                      <td className={TD}>
                        <span className="block font-medium text-fg">{v.name}</span>
                        <span className="block text-xs text-fg-muted">{v.kind === "STUDENT" ? (v.className ?? t("readingRoom.kindStudent")) : t("readingRoom.kindStaff")}</span>
                      </td>
                      <td className={TD}>{time(v.inAt)}</td>
                      <td className={TD}>{v.outAt ? time(v.outAt) : <Badge tone={r.today ? "ok" : "warn"} size="sm">{r.today ? t("readingRoom.inside") : t("readingRoom.notSignedOut")}</Badge>}</td>
                      <td className={NUM}>{v.minutes}</td>
                      <td className={TD}>
                        {!v.outAt && r.canRecord ? (
                          <form action={readingRoomScanAction}>
                            <input type="hidden" name="membershipId" value={v.membershipId} />
                            <Button type="submit" name="action" value="OUT" size="sm" variant="secondary" aria-label={t("readingRoom.signOutName", { name: v.name })}>{t("readingRoom.signOut")}</Button>
                          </form>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
    </DeskFrame>
  );
}
