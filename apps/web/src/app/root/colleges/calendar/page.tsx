import Link from "next/link";
import { ArrowLeftIcon, CalendarDotsIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { regulatorCalendar, REGULATOR_CALENDAR_DAYS, REGULATOR_REMIND_AHEAD_DAYS } from "@/lib/operator-college";
import { getT } from "@/lib/i18n/server";
import { ROLE_META } from "@/lib/constants";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("operatorCollege.calendarTitle"), robots: { index: false, follow: false } };
}

/**
 * The regulators' calendar across every college for the next 120 days
 * (REGULATOR_DEADLINES in the contracts, which reads the IQAC desk's own
 * five rows): each window with the colleges it applies to. Read from the
 * School and SchoolModule rows only, so opening it is no visit to a college.
 * Each college's IQAC and office are reminded by accounts:tidy.
 */
export default async function CollegeCalendarPage({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const { test } = await searchParams;
  const t = await getT();
  const session = await requireSuperuser();
  const calendar = await regulatorCalendar(session, { fixtures: test === "1" });

  return (
    <div className="space-y-5">
      <Link href={test === "1" ? "/root/colleges?test=1" : "/root/colleges"} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("operatorCollege.title")}
      </Link>
      <PageHeader title={t("operatorCollege.calendarTitle")} description={t("operatorCollege.calendarIntro", { days: REGULATOR_CALENDAR_DAYS, ahead: REGULATOR_REMIND_AHEAD_DAYS })} />

      {calendar.items.length === 0 ? (
        <EmptyState icon={<CalendarDotsIcon weight="duotone" className="size-8" />} title={t("operatorCollege.calendarEmptyTitle")} description={t("operatorCollege.calendarEmpty")} />
      ) : (
        <ul className="space-y-3">
          {calendar.items.map((item) => (
            <li key={`${item.code}:${item.from}`}>
              <Card>
                <CardHeader
                  icon={<CalendarDotsIcon weight="duotone" className="size-5" />}
                  title={t(`operatorCollege.deadline.${item.code}`)}
                  description={t("operatorCollege.window", { from: item.from, to: item.to })}
                  action={
                    item.openNow ? (
                      <Badge tone="ok" size="sm">
                        {t("operatorCollege.openNow")}
                      </Badge>
                    ) : (
                      <Badge tone="info" size="sm">
                        {t("operatorCollege.opensIn", { count: item.daysToOpen })}
                      </Badge>
                    )
                  }
                />
                <CardBody className="space-y-2 text-sm">
                  <p className="text-fg-muted">{t("operatorCollege.remindsLine", { roles: item.remind.map((r) => t(ROLE_META[r].labelKey)).join(", ") })}</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {item.colleges.map((c) => (
                      <li key={c.schoolId}>
                        <Link href={`/root/${c.schoolId}`} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-fg hover:underline">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-fg-subtle">
                    {t("operatorCollege.checkNotice")}{" "}
                    <a href={item.source} target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
                      {t("operatorCollege.sourceLink")}
                    </a>
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
