import type { Metadata } from "next";
import Link from "next/link";
import { ArrowsClockwiseIcon, BriefcaseIcon, ChalkboardTeacherIcon, ChartLineUpIcon, ScalesIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { LINK, ModuleFlash, NUM, TD, TH } from "@/components/module-flash";
import { LOAD_KEY } from "@/components/academics/parts";
import { OfferingForm } from "@/components/academics/offering-form";
import { SubstitutionBoard } from "@/components/academics/substitution-board";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { hodHome } from "@/lib/academics-homes";
import { academicsStructure, lectureSubstitutions } from "@/lib/academics";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import { componentsStateText, mentoringSummaryText, weeksTaughtText } from "@/lib/count-copy";
import { TableScroll } from "@/components/ui/table-scroll";
import { DutyCards } from "@/components/college/duty-cards";
import { NbaCard } from "@/components/iqac/nba-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("role.hod") };
}

/**
 * The HOD home (the college's academics, 4 October 2026): the department's
 * faculty and their load against the band, students per faculty member, the
 * offerings with their course files' coverage and the internal marks' state,
 * defaulters and condonations waiting, today's lectures of faculty who are
 * away, mentoring, the exam cell's published results for the department and
 * the students' projects (wired by the integration builder, 4 Oct 2026).
 */
export default async function HodHomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("HOD");
  const t = await getT();
  const locale = await getLocale();
  const [on, kind] = await Promise.all([isModuleOn(ctx.schoolId, "ACADEMICS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={isCollegeKind(kind)} />;
  const params = await searchParams;
  const home = await hodHome(ctx);
  if (!home.department) return <EmptyState title={t("academics.noDepartmentTitle")} description={t("academics.noDepartmentBody")} />;
  const [s, board] = await Promise.all([academicsStructure(ctx), lectureSubstitutions(ctx)]);
  return (
    <div className="space-y-6">
      <PageHeader title={t("academics.hodHomeTitle", { department: home.department.name })} description={home.term?.name ?? t("academics.noTermBody")} />
      <ModuleFlash t={t} params={params} />
      {/* My duties (5 Oct 2026). */}
      <DutyCards ctx={ctx} t={t} />
      {/* The department's NBA report, at an engineering college (5 Oct 2026). */}
      <NbaCard ctx={ctx} t={t} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("academics.statOfferings")} value={home.offerings.length} />
        <StatTile label={t("academics.statBehind")} value={home.offerings.filter((o) => o.behind).length} tone={home.offerings.some((o) => o.behind) ? "warn" : "ok"} />
        {/* The whole tile is the link: a bare number was a 15×28 px target (the walk of 4 October). */}
        <Link href="/hod/defaulters" className="block rounded-[--radius-lg] hover:shadow-md">
          <StatTile className="h-full" label={t("academics.statDefaulters")} value={home.defaulters} tone={home.defaulters ? "warn" : "ok"} />
        </Link>
        <Link href="/hod/condonations" className="block rounded-[--radius-lg] hover:shadow-md">
          <StatTile className="h-full" label={t("academics.statCondonations")} value={home.condonationsWaiting} tone={home.condonationsWaiting ? "warn" : "neutral"} />
        </Link>
      </div>
      <Card>
        <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("academics.deptOfferingsTitle")} description={t("academics.deptOfferingsBody")} />
        <CardBody className="space-y-4">
          {home.offerings.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.offeringsNone")} description={t("academics.offeringsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.colCourse")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldFaculty")}</th>
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
                      <td className={TD}>{o.facultyName ?? <Badge tone="warn">{t("academics.unstaffed")}</Badge>}</td>
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
          {home.term ? <OfferingForm t={t} s={s} termId={home.term.id} back="/hod" departmentId={home.department.id} /> : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ScalesIcon weight="duotone" className="size-5" />} title={t("academics.loadTitle")} description={t("academics.loadBody", { min: s.settings.loadMinHours, max: s.settings.loadMaxHours })} />
        <CardBody className="space-y-3">
          <ul className="divide-y divide-border text-sm">
            {home.load.map((l) => (
              <li key={l.membershipId} className="flex items-center justify-between gap-2 py-2">
                <span className="text-fg">{l.name}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-fg-muted">{t("academics.hoursWeek", { n: l.hours })}</span>
                  <Badge tone={l.state === "WITHIN" ? "ok" : l.state === "OVER" ? "danger" : "warn"}>{t(LOAD_KEY[l.state]!)}</Badge>
                </span>
              </li>
            ))}
          </ul>
          {home.ratio.map((r) => (
            <p key={r.departmentId} className="text-sm text-fg-muted">
              {t("academics.ratioLine", { students: r.students, faculty: r.faculty, per: r.perFaculty ?? "—" })} <Badge tone={r.withinNorm ? "ok" : "warn"}>{t(r.withinNorm ? "academics.ratioWithin" : "academics.ratioOver", { norm: r.norm })}</Badge>
            </p>
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ArrowsClockwiseIcon weight="duotone" className="size-5" />} title={t("academics.boardTitle", { date: formatDateKey(board.dateKey, { weekday: "long", day: "numeric", month: "long" }, locale) })} description={t("academics.boardBody")} />
        <CardBody>
          <SubstitutionBoard t={t} board={board} canAssign back="/hod" />
        </CardBody>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader icon={<ChartLineUpIcon weight="duotone" className="size-5" />} title={t("academics.resultsTitle")} description={home.results ? t("collegeHub.hodResultsTerm", { term: home.results.termName, passed: home.results.passed, appeared: home.results.appeared, rate: home.results.passRatePercent }) : t("collegeHub.hodResultsNone")} />
          <CardBody className="space-y-2 text-sm">
            {home.results ? (
              <>
                <ul className="space-y-1">
                  {home.results.byCourse.map((c) => (
                    <li key={c.key} className="flex justify-between gap-3">
                      <span>{c.label}</span>
                      <span className="tabular-nums text-fg-muted">{t("collegeHub.passRateLine", { passed: c.passed, appeared: c.appeared, rate: c.passRatePercent })}</span>
                    </li>
                  ))}
                </ul>
                {home.results.toppers.length ? <p className="text-fg-muted">{t("collegeHub.toppersLine", { names: home.results.toppers.map((x) => t("collegeHub.topperOne", { name: x.name, sgpa: x.sgpa.toFixed(2) })).join(", ") })}</p> : null}
                <p className="text-fg-muted">{t("collegeHub.openBacklogs", { count: home.results.openBacklogs })}</p>
              </>
            ) : null}
            <p className="text-fg-muted">{mentoringSummaryText(t, home.mentoringGroups, home.mentees)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader icon={<BriefcaseIcon weight="duotone" className="size-5" />} title={t("academics.projectsTitle")} description={t("collegeHub.projectsBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/hod/projects">{t("collegeHub.projectsOpen")}</Link></Button>} />
          <CardBody>
            {home.projects.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("academics.projectsNone")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {home.projects.map((p, i) => (
                  <li key={`${p.title}-${i}`}>
                    <span className="font-medium">{p.title}</span> <span className="text-fg-muted">· {p.studentName}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/faculty">{t("academics.myTeaching")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/faculty/mentoring">{t("academics.mentoringTitle")}</Link>
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
