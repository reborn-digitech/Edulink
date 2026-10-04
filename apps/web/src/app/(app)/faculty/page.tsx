import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenTextIcon, CalendarCheckIcon, ChatsCircleIcon, ReceiptIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { ModuleFlash } from "@/components/module-flash";
import { LECTURE_KIND_KEY, LOAD_KEY, clock } from "@/components/academics/parts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { facultyHome } from "@/lib/academics-homes";
import { loadState } from "@/lib/academics-rules";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import { componentsStateText, mentoringLinkText, weeksTaughtText } from "@/lib/count-copy";
import { TableScroll } from "@/components/ui/table-scroll";
import { DutyCards } from "@/components/college/duty-cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("role.faculty") };
}

/**
 * The FACULTY home (the college's academics, 4 October 2026): today's
 * lectures to mark, the offerings I teach with the course file's coverage
 * and the internal marks' state, my load, what colleagues have asked me to
 * countersign, my mentoring group, and my payslips. An HOD teaches too and
 * reads this page as their own teaching.
 */
export default async function FacultyHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  const locale = await getLocale();
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "ACADEMICS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={isCollegeKind(kind)} />;
  const params = await searchParams;
  const home = await facultyHome(ctx);
  const state = loadState(home.hours, home.settings.loadMinHours, home.settings.loadMaxHours);
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.facultyHomeTitle", { name: home.name })} description={[home.departmentName, home.term?.name].filter(Boolean).join(" · ") || t("academics.facultyHomeIntro")} />
      <ModuleFlash t={t} params={params} />
      {/* My duties (5 Oct 2026): the HOD's own card is on /hod. */}
      {ctx.role === "FACULTY" && <DutyCards ctx={ctx} t={t} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("academics.statToday")} value={home.today.lectures.length} />
        <StatTile label={t("academics.statOfferings")} value={home.offerings.length} />
        <StatTile label={t("academics.statLoad")} value={t("academics.hoursWeek", { n: home.hours })} hint={t(LOAD_KEY[state]!)} tone={state === "WITHIN" ? "ok" : "warn"} />
        <StatTile label={t("academics.statToModerate")} value={home.toModerate.length} tone={home.toModerate.length ? "warn" : "neutral"} />
      </div>
      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("academics.todayTitle", { date: formatDateKey(home.today.dateKey, { weekday: "long", day: "numeric", month: "long" }, locale) })} description={t("academics.todayBody")} />
        <CardBody>
          {home.today.closed ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.closedToday")} description={t("academics.closedTodayBody")} />
          ) : home.today.lectures.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noLecturesToday")} description={t("academics.noLecturesTodayBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {home.today.lectures.map((l) => (
                <li key={l.lectureId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="tabular-nums text-fg-muted">{clock(l.startMinute, l.endMinute)}</span> <span className="font-medium text-fg">{l.courseCode}</span>{" "}
                    <span className="text-fg-muted">{[t(LECTURE_KIND_KEY[l.kind]!), l.divisionName, l.roomName].filter(Boolean).join(" · ")}</span>
                    {l.substitute ? <> <Badge tone="info">{t("academics.standingIn")}</Badge></> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    {l.marked > 0 ? <Badge tone="ok">{t("academics.markedOf", { marked: l.marked, registered: l.registered })}</Badge> : null}
                    <Button asChild size="sm" variant={l.marked ? "secondary" : "primary"}>
                      <Link href={`/faculty/lectures/${l.lectureId}`}>{t(l.marked ? "academics.reviewMarks" : "academics.markLecture")}</Link>
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<BookOpenTextIcon weight="duotone" className="size-5" />} title={t("academics.myOfferingsTitle")} description={t("academics.myOfferingsBody")} />
        <CardBody>
          {home.offerings.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.myOfferingsNone")} description={t("academics.myOfferingsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.colCourse")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colRegistered")}</th>
                    <th scope="col" className={TH}>{t("academics.colCoverage")}</th>
                    <th scope="col" className={TH}>{t("academics.colMarks")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colDefaulters")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {home.offerings.map((o) => (
                    <tr key={o.offeringId}>
                      <td className={TD}>
                        <Link className={LINK} href={`/faculty/offerings/${o.offeringId}`}>{o.courseCode}</Link> <span className="text-fg-muted">{[o.courseName, o.divisionName].filter(Boolean).join(" · ")}</span>
                      </td>
                      <td className={NUM}>{o.registered}</td>
                      <td className={TD}>
                        {weeksTaughtText(t, o.taught, o.planned)} {o.behind ? <Badge tone="danger">{t("academics.behind")}</Badge> : null}
                      </td>
                      <td className={TD}>{o.locked ? <Badge tone="ok">{t("academics.lockedBadge")}</Badge> : componentsStateText(t, o)}</td>
                      <td className={NUM}>{o.defaulters}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
      {home.toModerate.length ? (
        <Card>
          <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("academics.toModerateTitle")} description={t("academics.toModerateBody")} />
          <CardBody>
            <ul className="divide-y divide-border text-sm">
              {home.toModerate.map((m) => (
                <li key={m.componentId} className="py-2">
                  <Link className={LINK} href={`/faculty/offerings/${m.offeringId}?tab=marks`}>{`${m.courseCode} · ${m.name}`}</Link> <span className="text-fg-muted">{m.facultyName ?? ""}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/faculty/mentoring">
              <ChatsCircleIcon weight="duotone" className="size-5" aria-hidden />
              {mentoringLinkText(t, home.mentoringGroups)}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/account/payslips">
              <ReceiptIcon weight="duotone" className="size-5" aria-hidden />
              {t("payroll.myTitle")}
            </Link>
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
