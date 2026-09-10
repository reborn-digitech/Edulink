import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { archivePageSchema } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips } from "../staff/shared";
import { formatInstant, Pill } from "../family/shared";

type ArchivePage = z.infer<typeof archivePageSchema>;

/** `?year=&child=` — nothing at all when the server should pick the newest year and the first child, as the web page does. */
export function archiveQuery(yearId: string | null, childId: string | null): string {
  const parts: string[] = [];
  if (yearId) parts.push(`year=${encodeURIComponent(yearId)}`);
  if (childId) parts.push(`child=${encodeURIComponent(childId)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

function percent(present: number, marked: number): string {
  return marked === 0 ? "—" : `${Math.round((present / marked) * 100)}%`;
}

/**
 * Past years — the web's /archive: the closed academic years as a shelf,
 * one picked, and what it left behind as this role may see it — a pupil's
 * own year (or a guardian's child's), a teacher's classes, the school's
 * numbers. Nothing here changes again, so the page is a reader: a report
 * card opens in the app's own report-card view (Exams, given its id).
 */
export function Archive() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [yearId, setYearId] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["shared", "archive", yearId, childId],
    placeholderData: keepPreviousData,
    queryFn: async () => archivePageSchema.parse(unwrap(await api().get(`/api/v1/shared/archive${archiveQuery(yearId, childId)}`))),
  });
  const d = query.data;
  const when = (iso: string) => formatInstant(iso, locale, { day: "numeric", month: "short", year: "numeric" }, d?.timezone);
  const emptyBody = role === "ADMIN" ? t("archive.noYearsAdminBody") : role === "STUDENT" || role === "PARENT" ? t("archive.noYearsPupilBody") : t("archive.noYearsBody");
  const door =
    role === "ADMIN" || role === "PRINCIPAL" ? (
      <Button label={t("archive.closeYearCta")} variant="secondary" onPress={() => router.push("/(app)/calendar" as never)} />
    ) : role === "TEACHER" ? (
      <Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />
    ) : (
      <Button label={t("nav.exams")} variant="secondary" onPress={() => router.push("/(app)/exams" as never)} />
    );
  return (
    <Screen title={t("archive.title")} description={d ? (d.years.length === 1 ? t("archive.yearsCountOne") : t("archive.yearsCount", { count: d.years.length })) : t("archive.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {d && d.children.length > 1 ? (
        <Chips label={t("archive.childLabel")} value={childId ?? d.child ?? ""} options={d.children.map((c) => ({ value: c.studentMembershipId, label: c.name }))} onChange={(next) => { setChildId(next); setYearId(null); }} />
      ) : null}
      {d && d.years.length > 1 ? <Chips label={t("archive.yearLabel")} value={yearId ?? d.selected?.year.id ?? ""} options={d.years.map((y) => ({ value: y.id, label: y.name }))} onChange={setYearId} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.selected === null ? (
          <Empty title={t("archive.noYearsTitle")} body={emptyBody} action={door} />
        ) : (
          <>
            <Card title={d.selected.year.name}>
              <Text variant="xs" tone="muted">
                {t("archive.intro")}
              </Text>
              <Text variant="sm" tone="muted">
                {`${t("archive.yearRan", { from: when(d.selected.year.startDate), to: when(d.selected.year.endDate) })} · ${t("archive.closedOn", { date: when(d.selected.year.closedAt) })}`}
              </Text>
            </Card>
            {d.selected.pupil ? <PupilYear data={d.selected.pupil} when={when} /> : null}
            {d.selected.teacher ? <TeacherYear data={d.selected.teacher} /> : null}
            {d.selected.school ? <SchoolYear data={d.selected.school} /> : null}
          </>
        )
      ) : null}
    </Screen>
  );
}

function Figures({ children }: { children: ReactNode }) {
  const th = useTheme();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>{children}</View>;
}

function PupilYear({ data, when }: { data: NonNullable<NonNullable<ArchivePage["selected"]>["pupil"]>; when: (iso: string) => string }) {
  const t = useT();
  const router = useRouter();
  return (
    <>
      <Figures>
        <Stat label={t("archive.reportCards")} value={data.reportCards.length} />
        <Stat label={t("archive.attendance")} value={percent(data.attendance.present, data.attendance.marked)} />
        <Stat label={t("archive.badges")} value={data.badges.length} />
        <Stat label={t("archive.marks")} value={data.marks.graded} />
      </Figures>
      <Card title={t("archive.reportCards")}>
        {data.reportCards.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("archive.noReportCards")}
          </Text>
        ) : (
          data.reportCards.map((card) => <Row key={card.id} title={card.title} caption={[card.className, card.publishedAt ? when(card.publishedAt) : null].filter(Boolean).join(" · ")} onPress={() => router.push({ pathname: "/(app)/exams", params: { cardId: card.id } } as never)} />)
        )}
      </Card>
      <Card title={t("archive.attendance")}>
        <Text variant="sm" tone="muted">
          {data.attendance.marked === 0 ? t("archive.attendanceNone") : t("archive.presentOfMarked", { present: data.attendance.present, marked: data.attendance.marked })}
        </Text>
      </Card>
      <Card title={t("archive.marks")}>
        <Text variant="sm" tone="muted">
          {data.marks.graded === 0 ? t("archive.marksNone") : [t("archive.gradedCount", { count: data.marks.graded }), data.marks.averagePercent !== null ? t("archive.averagePercent", { percent: Math.round(data.marks.averagePercent) }) : null].filter(Boolean).join(", ")}
        </Text>
      </Card>
      <Card title={t("archive.badges")}>
        {data.badges.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("archive.badgesNone")}
          </Text>
        ) : (
          data.badges.map((badge) => <Row key={badge.badgeId} title={badge.label} caption={badge.description} />)
        )}
      </Card>
    </>
  );
}

function TeacherYear({ data }: { data: NonNullable<NonNullable<ArchivePage["selected"]>["teacher"]> }) {
  const t = useT();
  const totals = data.classes.reduce((acc, k) => ({ registers: acc.registers + k.registersTaken, assignments: acc.assignments + k.assignmentsSet, cards: acc.cards + k.reportCardsPublished }), { registers: 0, assignments: 0, cards: 0 });
  return (
    <>
      <Figures>
        <Stat label={t("archive.classes")} value={data.classes.length} />
        <Stat label={t("archive.attendance")} value={totals.registers} />
        <Stat label={t("archive.assignmentsLabel")} value={totals.assignments} />
        <Stat label={t("archive.reportCards")} value={totals.cards} />
      </Figures>
      <Card title={t("archive.classes")}>
        {data.classes.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("archive.classesNone")}
          </Text>
        ) : (
          data.classes.map((k) => (
            <Row key={k.classId} title={k.className} caption={[t("archive.registersTaken", { count: k.registersTaken }), t("archive.assignmentsSet", { count: k.assignmentsSet }), t("archive.cardsPublished", { count: k.reportCardsPublished })].join(" · ")} />
          ))
        )}
      </Card>
    </>
  );
}

function SchoolYear({ data }: { data: NonNullable<NonNullable<ArchivePage["selected"]>["school"]> }) {
  const t = useT();
  return (
    <>
      <Text variant="sm" tone="muted">
        {t("archive.schoolYearIntro")}
      </Text>
      <Figures>
        <Stat label={t("archive.pupilsOnRoll")} value={data.pupilsOnRoll} />
        <Stat label={t("archive.attendance")} value={percent(data.attendance.present, data.attendance.marked)} />
        <Stat label={t("archive.reportCardsPublished")} value={data.reportCardsPublished} />
        <Stat label={t("archive.leavers")} value={data.leavers} />
        <Stat label={t("archive.badgesArchived")} value={data.badgesArchived} />
        <Stat label={t("archive.examSeriesTitle")} value={data.examSeries.length} />
      </Figures>
      {data.attendance.marked > 0 ? (
        <Text variant="xs" tone="muted">
          {t("archive.presentOfMarked", { present: data.attendance.present, marked: data.attendance.marked })}
        </Text>
      ) : null}
      <Card title={t("archive.examSeriesTitle")}>
        {data.examSeries.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("archive.examSeriesNone")}
          </Text>
        ) : (
          data.examSeries.map((series) => <Row key={series.id} title={series.name} right={<Pill label={series.gradeLevel} />} />)
        )}
      </Card>
    </>
  );
}
