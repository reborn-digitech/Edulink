import Link from "next/link";
import type { CourseAttendance, Condonation, TimetableCell } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ModuleFlash, NUM, TD, TH } from "@/components/module-flash";
import { formatTimeRange, weekdayName, weekdayShortName } from "@/lib/school-day";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The pieces the college's academics pages share (4 October 2026): the
 * office's tabs, a student's attendance table with the projection, a weekly
 * grid, a condonation's status, and the coded words.
 */

export const KIND_KEY: Record<string, TranslationKey> = { CORE: "academics.kindCORE", ELECTIVE: "academics.kindELECTIVE", MINOR: "academics.kindMINOR", HONOURS: "academics.kindHONOURS", OPEN: "academics.kindOPEN" };
export const LECTURE_KIND_KEY: Record<string, TranslationKey> = { LECTURE: "academics.lectureLECTURE", LAB: "academics.lectureLAB", TUTORIAL: "academics.lectureTUTORIAL" };
export const MARK_KEY: Record<string, TranslationKey> = { PRESENT: "academics.markPRESENT", ABSENT: "academics.markABSENT", LATE: "academics.markLATE" };
export const GROUND_KEY: Record<string, TranslationKey> = { MEDICAL: "academics.groundMEDICAL", SPORTS: "academics.groundSPORTS", NCC_NSS: "academics.groundNCC_NSS", CULTURAL: "academics.groundCULTURAL", BEREAVEMENT: "academics.groundBEREAVEMENT", OTHER: "academics.groundOTHER" };
export const CONDONATION_KEY: Record<string, TranslationKey> = { ASKED: "academics.condASKED", HOD_APPROVED: "academics.condHOD_APPROVED", FORWARDED: "academics.condFORWARDED", PRINCIPAL_APPROVED: "academics.condPRINCIPAL_APPROVED", REFUSED: "academics.condREFUSED" };
export const INTERNAL_KIND_KEY: Record<string, TranslationKey> = { UNIT_TEST: "academics.internalUNIT_TEST", ASSIGNMENT: "academics.internalASSIGNMENT", PRACTICAL: "academics.internalPRACTICAL", VIVA: "academics.internalVIVA", PROJECT: "academics.internalPROJECT" };
export const FLAG_KEY: Record<string, TranslationKey> = { NONE: "academics.flagNONE", SLOW: "academics.flagSLOW", ADVANCED: "academics.flagADVANCED", COUNSELLING: "academics.flagCOUNSELLING" };
export const ITEM_KEY: Record<string, TranslationKey> = { RESOURCE: "academics.itemRESOURCE", NOTES: "academics.itemNOTES", QUESTION_PAPER: "academics.itemQUESTION_PAPER", MODEL_ANSWER: "academics.itemMODEL_ANSWER", LINK: "academics.itemLINK" };
export const LEVEL_KEY: Record<string, TranslationKey> = { UG: "academics.levelUG", PG: "academics.levelPG", DIPLOMA: "academics.levelDIPLOMA" };
export const ROOM_KEY: Record<string, TranslationKey> = { CLASSROOM: "academics.roomCLASSROOM", LAB: "academics.roomLAB", SEMINAR: "academics.roomSEMINAR", OTHER: "academics.roomOTHER" };
export const AWARD_KEY: Record<string, TranslationKey> = { CERTIFICATE: "academics.awardCERTIFICATE", DIPLOMA: "academics.awardDIPLOMA", DEGREE: "academics.awardDEGREE", HONOURS_DEGREE: "academics.awardHONOURS_DEGREE" };
export const LOAD_KEY: Record<string, TranslationKey> = { UNDER: "academics.loadUNDER", WITHIN: "academics.loadWITHIN", OVER: "academics.loadOVER" };

const OFFICE_TABS: { key: string; href: string; labelKey: TranslationKey }[] = [
  { key: "setup", href: "/admin/academics", labelKey: "academics.tabSetup" },
  { key: "programmes", href: "/admin/academics/programmes", labelKey: "academics.tabProgrammes" },
  { key: "terms", href: "/admin/academics/terms", labelKey: "academics.tabTerms" },
  { key: "students", href: "/admin/academics/students", labelKey: "academics.tabStudents" },
  { key: "offerings", href: "/admin/academics/offerings", labelKey: "academics.tabOfferings" },
  { key: "timetable", href: "/admin/academics/timetable", labelKey: "academics.tabTimetable" },
  { key: "registration", href: "/admin/academics/registration", labelKey: "academics.tabRegistration" },
  { key: "attendance", href: "/admin/academics/attendance", labelKey: "academics.tabAttendance" },
  { key: "condonations", href: "/admin/academics/condonations", labelKey: "academics.tabCondonations" },
  { key: "substitutions", href: "/admin/academics/substitutions", labelKey: "academics.tabSubstitutions" },
];

export function OfficeTop({ t, current, params, description }: { t: Translate; current: string; params: Record<string, string | string[] | undefined>; description?: string }) {
  return (
    <>
      <PageHeader title={t("academics.title")} description={description ?? t("academics.officeIntro")} />
      <TabBar ariaLabel={t("academics.title")} current={current} tabs={OFFICE_TABS.map((tab) => ({ key: tab.key, href: tab.href, label: t(tab.labelKey) }))} />
      <ModuleFlash t={t} params={params} />
    </>
  );
}

export const clock = (start: number, end: number) => formatTimeRange(start, end);

/** "may miss 3 more", "on the line", or "4 short even attending all". */
export function projectionText(t: Translate, a: Pick<CourseAttendance, "canMiss" | "remaining" | "held">): string {
  if (a.held === 0 && a.remaining === 0) return t("academics.projectionNone");
  if (a.canMiss > 0) return t("academics.projectionMiss", { n: a.canMiss, remaining: a.remaining });
  if (a.canMiss === 0) return t("academics.projectionNoMore", { remaining: a.remaining });
  return t("academics.projectionShort", { n: -a.canMiss });
}

export function AttendanceTable({ t, rows, withProjection = true }: { t: Translate; rows: CourseAttendance[]; withProjection?: boolean }) {
  if (rows.length === 0) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.attendanceNone")} description={t("academics.attendanceNoneBody")} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className={TH}>{t("academics.colCourse")}</th>
            <th scope="col" className={`${TH} text-right`}>{t("academics.colAttended")}</th>
            <th scope="col" className={`${TH} text-right`}>{t("academics.colPercent")}</th>
            {withProjection ? <th scope="col" className={TH}>{t("academics.colProjection")}</th> : null}
            <th scope="col" className={TH}>{t("academics.colStanding")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((a) => (
            <tr key={a.offeringId}>
              <td className={TD}>
                <span className="font-medium text-fg">{a.courseCode}</span> <span className="text-fg-muted">{a.courseName}</span>
              </td>
              <td className={NUM}>{t("academics.attendedOf", { attended: a.attended, held: a.held })}</td>
              <td className={NUM}>{a.percent === null ? "—" : `${a.percent}%`}</td>
              {withProjection ? <td className={TD}>{projectionText(t, a)}</td> : null}
              <td className={TD}>
                <StandingBadge t={t} a={a} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StandingBadge({ t, a }: { t: Translate; a: Pick<CourseAttendance, "eligible" | "condoned" | "threshold" | "percent"> }) {
  if (a.condoned) return <Badge tone="info">{t("academics.condoned")}</Badge>;
  if (a.percent === null) return <Badge tone="neutral">{t("academics.notYet")}</Badge>;
  return a.eligible ? <Badge tone="ok">{t("academics.aboveLine", { threshold: a.threshold })}</Badge> : <Badge tone="danger">{t("academics.belowLine", { threshold: a.threshold })}</Badge>;
}

export function CondonationBadge({ t, c }: { t: Translate; c: Pick<Condonation, "status"> }) {
  const tone = c.status === "REFUSED" ? "danger" : c.status === "HOD_APPROVED" || c.status === "PRINCIPAL_APPROVED" ? "ok" : "warn";
  return <Badge tone={tone}>{t(CONDONATION_KEY[c.status]!)}</Badge>;
}

/** The week as a list per day (a grid is too wide for a phone; the web's narrow screens read this too). */
export function WeekList({ t, locale, weekdays, cells, linkFor }: { t: Translate; locale: string; weekdays: number[]; cells: TimetableCell[]; linkFor?: (c: TimetableCell) => string }) {
  if (cells.length === 0) return <EmptyState className="border-0 bg-transparent py-4" title={t("academics.timetableNone")} description={t("academics.timetableNoneBody")} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {weekdays.map((d) => {
        const day = cells.filter((c) => c.weekday === d);
        return (
          <section key={d} className="rounded-[--radius-md] border border-border p-3">
            <h3 className="mb-2 text-sm font-semibold text-fg">
              <abbr title={weekdayName(d, locale)} className="no-underline">{weekdayShortName(d, locale)}</abbr>
            </h3>
            {day.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("academics.noLectures")}</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {day.map((c) => (
                  <li key={c.slotId}>
                    <span className="tabular-nums text-fg-muted">{clock(c.startMinute, c.endMinute)}</span>{" "}
                    {linkFor ? <Link className="font-medium text-accent-strong underline underline-offset-2" href={linkFor(c)}>{c.courseCode}</Link> : <span className="font-medium text-fg">{c.courseCode}</span>}{" "}
                    <span className="text-fg-muted">
                      {[t(LECTURE_KIND_KEY[c.kind]!), c.divisionName, c.roomName, c.facultyName].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
