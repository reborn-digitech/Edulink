import Link from "next/link";
import { BuildingsIcon, CalendarDotsIcon, ChalkboardTeacherIcon, HeartbeatIcon, MegaphoneIcon, RocketLaunchIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import type { OperatorCollegeRow } from "@edulink/contracts";
import { requireSuperuser } from "@/lib/tenancy";
import { listColleges } from "@/lib/operator-college";
import { institutionKindLabel } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { statusLabel } from "../subscription-words";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("operatorCollege.title"), robots: { index: false, follow: false } };
}

/**
 * The colleges beside the schools (4 October 2026): each college's
 * regulators, programmes and intake, roll, subscription at the college
 * tiers, and its health this week — every number read from the college's
 * own rows through the operator's one door, so each college's log says the
 * platform looked. The ZZ fixtures appear with ?test=1, as the dashboard's
 * "test" chip shows them.
 */
export default async function CollegesPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const { test } = await searchParams;
  const fixtures = test === "1";
  const t = await getT();
  const locale = await getLocale();
  const session = await requireSuperuser();
  const { items } = await listColleges(session, { fixtures });
  const money = (paise: number) => formatPaise(paise, locale);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("operatorCollege.title")}
        description={t("operatorCollege.intro")}
        actions={
          <Button asChild icon={<RocketLaunchIcon weight="bold" />}>
            <Link href="/root/onboard">{t("root.onboardCta")}</Link>
          </Button>
        }
      />

      <nav aria-label={t("operatorCollege.title")} className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="secondary" icon={<CalendarDotsIcon weight="bold" />}>
          <Link href={fixtures ? "/root/colleges/calendar?test=1" : "/root/colleges/calendar"}>{t("operatorCollege.calendarTitle")}</Link>
        </Button>
        <Button asChild size="sm" variant="secondary" icon={<UsersThreeIcon weight="bold" />}>
          <Link href="/root/colleges/recruiters">{t("operatorCollege.recruitersTitle")}</Link>
        </Button>
        <Button asChild size="sm" variant="secondary" icon={<ChalkboardTeacherIcon weight="bold" />}>
          <Link href="/root/experts">{t("root.experts")}</Link>
        </Button>
        {/* The global feed's take-down, the operator's desk above every institution. */}
        <Button asChild size="sm" variant="secondary" icon={<MegaphoneIcon weight="bold" />}>
          <Link href="/appadmin/moderation">{t("root.globalFeedModeration")}</Link>
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href={fixtures ? "/root/colleges" : "/root/colleges?test=1"}>{fixtures ? t("operatorCollege.hideFixtures") : t("operatorCollege.showFixtures")}</Link>
        </Button>
      </nav>

      {items.length === 0 ? (
        <EmptyState icon={<BuildingsIcon weight="duotone" className="size-8" />} title={t("operatorCollege.noneTitle")} description={t("operatorCollege.noneBody")} />
      ) : (
        <ul className="space-y-4">
          {items.map((college) => (
            <li key={college.id}>
              <CollegeCard college={college} t={t} money={money} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-fg">{children}</dd>
    </div>
  );
}

function CollegeCard({ college, t, money }: { college: OperatorCollegeRow; t: Translate; money: (paise: number) => string }) {
  const h = college.health;
  const none = t("college.none");
  const regulators = [
    college.regulators.aicte ? `${t("college.fieldAicte")}: ${college.regulators.aicte}` : null,
    college.regulators.ugc ? `${t("college.fieldUgc")}: ${college.regulators.ugc}` : null,
    college.regulators.naacGrade ? `${t("college.fieldNaac")}: ${college.regulators.naacGrade}${college.regulators.naacValidUntil ? ` (${t("operatorCollege.validUntil", { date: college.regulators.naacValidUntil })})` : ""}` : null,
  ].filter((x): x is string => Boolean(x));
  const health: { label: string; value: string; tone?: "warn" | "danger" }[] = [
    { label: t("operatorCollege.healthLectures"), value: t("operatorCollege.ofCount", { done: h.lecturesMarked, total: h.lecturesScheduled }), tone: h.lecturesScheduled > h.lecturesMarked ? "warn" : undefined },
    { label: t("operatorCollege.healthExamForms"), value: String(h.examFormsOpen) },
    { label: t("operatorCollege.healthResults"), value: h.resultsPublishedThisTerm === null ? t("operatorCollege.noTerm") : String(h.resultsPublishedThisTerm) },
    { label: t("operatorCollege.healthNaac"), value: h.naac ? (h.naac.cgpa === null ? t("operatorCollege.noCgpaYet") : `${h.naac.cgpa.toFixed(2)} · ${h.naac.grade ?? ""}`) : t("operatorCollege.noCycle") },
    {
      label: t("operatorCollege.healthPlacement"),
      value: h.placement.on ? t("operatorCollege.placementLine", { placed: h.placement.placed, finalYear: h.placement.finalYear, open: h.placement.drivesOpen }) : t("operatorCollege.placementOff"),
    },
    { label: t("operatorCollege.healthScholarships"), value: String(h.scholarshipsPending), tone: h.scholarshipsPending > 0 ? "warn" : undefined },
    { label: t("operatorCollege.healthGrievances"), value: String(h.grievancesPastDue), tone: h.grievancesPastDue > 0 ? "danger" : undefined },
  ];

  return (
    <Card>
      <CardHeader
        icon={<BuildingsIcon weight="duotone" className="size-5" />}
        title={
          <Link href={`/root/${college.id}`} className="hover:underline">
            {college.name}
          </Link>
        }
        description={[institutionKindLabel(college.kind, t), college.city || t("root.noAddress")].join(" · ")}
        action={
          <Button asChild size="sm" variant="secondary">
            <Link href={`/root/${college.id}`}>{t("root.openSchool")}</Link>
          </Button>
        }
      />
      <CardBody className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <Fact label={t("college.fieldUniversity")}>{college.affiliatingUniversity ?? none}</Fact>
          <Fact label={t("college.fieldAishe")}>{college.aisheCode ?? none}</Fact>
          <Fact label={t("operatorCollege.regulators")}>{regulators.length ? regulators.join(" · ") : none}</Fact>
          <Fact label={t("operatorCollege.roll")}>
            {college.students === 1 ? t("operatorCollege.studentsEnrolledOne") : t("operatorCollege.studentsEnrolled", { count: college.students })} · {t("operatorCollege.intakeTotal", { count: college.intake })}
          </Fact>
          <Fact label={t("operatorCollege.programmes")}>
            {college.programmes.length === 0 ? (
              t("operatorCollege.noProgrammes")
            ) : (
              <ul>
                {college.programmes.map((p) => (
                  <li key={p.code}>{t("operatorCollege.programmeLine", { code: p.code, name: p.name, intake: p.intake })}</li>
                ))}
              </ul>
            )}
          </Fact>
          <Fact label={t("root.subscriptionTitle")}>
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge size="sm" tone={college.subscription.status === "ACTIVE" ? "ok" : college.subscription.status === "DUE" ? "danger" : "outline"}>
                {statusLabel(t, college.subscription.status)}
              </Badge>
              {college.subscription.dueAt && <span className="text-xs text-fg-muted">{college.subscription.dueAt}</span>}
            </span>
            <span className="mt-1 block text-xs text-fg-muted">
              {college.plan ? college.plan.name : t("root.planNone")}
              {college.tierYearPaise !== null && <> · {t("operatorCollege.tierYear", { amount: money(college.tierYearPaise) })}</>}
            </span>
          </Fact>
          <Fact label={t("operatorCollege.modules")}>{t("operatorCollege.modulesOn", { count: college.modulesOn.length })}</Fact>
          {college.isTestFixture && (
            <Fact label={t("root.stateTest")}>
              <Badge size="sm" tone="neutral">
                {t("root.stateTest")}
              </Badge>
            </Fact>
          )}
        </dl>

        <section aria-label={t("operatorCollege.healthTitle")} className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <HeartbeatIcon weight="duotone" className="size-4" />
            {t("operatorCollege.healthTitle")}
          </h3>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {health.map((tile) => (
              <li key={tile.label} className="rounded-[--radius-md] border border-border bg-surface px-3 py-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-fg-muted">{tile.label}</p>
                <p className={`mt-0.5 text-sm font-bold tabular-nums ${tile.tone === "danger" ? "text-danger" : tile.tone === "warn" ? "text-warn" : "text-fg"}`}>{tile.value}</p>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-subtle">{t("operatorCollege.healthNote")}</p>
        </section>
      </CardBody>
    </Card>
  );
}
