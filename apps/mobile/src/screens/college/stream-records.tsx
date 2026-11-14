import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { streamRecordsSummarySchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";

/**
 * The stream records on the phone (the parity batch, 10 Oct 2026, R-4),
 * the web's /admin/stream-records for the office and the head, read only:
 * the year's practical record, law internships and moots, teaching practice,
 * and the NSS and NCC units — each drawn only where the college's streams
 * make it its own (GET /stream-records/summary). The desks that write them
 * are the duty holders' screens.
 */
export function StreamRecordsScreen() {
  const t = useT();
  const th = useTheme();
  const on = useModuleOn("ACADEMICS");
  const query = useQuery({ queryKey: ["stream-records", "summary"], enabled: on, queryFn: async () => streamRecordsSummarySchema.parse(unwrap(await api().get("/api/v1/stream-records/summary"))) });
  if (!on) return <ModuleOffScreen title={t("streamRecords.title")} module="ACADEMICS" />;
  const d = query.data;
  const row = { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: th.space[2] };
  const none = d && !d.labs && !d.law && !d.education && d.corps.nss.enrolled === 0 && d.corps.ncc.enrolled === 0;
  return (
    <Screen title={t("streamRecords.title")} description={d ? t("streamRecords.intro", { year: d.year }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {none ? <Empty icon="clipboard" title={t("streamRecords.title")} body={t("streamRecords.noneForStreams")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d?.labs ? (
        <Card title={t("streamRecords.labsTitle")}>
          <View style={row}>
            <Stat label={t("streamRecords.statBatches")} value={d.practical.batches} />
            <Stat label={t("streamRecords.statRecords")} value={d.practical.records} />
            <Stat label={t("streamRecords.statSigned")} value={d.practical.signed} tone="ok" />
            <Stat label={t("streamRecords.statUnsigned")} value={d.practical.unsigned} tone={d.practical.unsigned > 0 ? "warn" : "fg"} />
          </View>
          {d.practical.byCourse.slice(0, 12).map((c) => (
            <Row key={c.courseCode} title={`${c.courseCode} · ${c.courseName}`} caption={`${t("streamRecords.statRecords")} ${c.records} · ${t("streamRecords.statSigned")} ${c.signed} · ${t("streamRecords.colStudent")} ${c.students}`} />
          ))}
        </Card>
      ) : null}
      {d?.law ? (
        <Card title={t("streamRecords.lawTitle")}>
          <View style={row}>
            <Stat label={t("streamRecords.statInternships")} value={d.lawInternships.internships} />
            <Stat label={t("streamRecords.statLawStudents")} value={d.lawInternships.students} />
            <Stat label={t("streamRecords.statMeetingBci")} value={`${d.lawInternships.meetingMinimum} / ${d.lawInternships.students}`} tone={d.lawInternships.meetingMinimum < d.lawInternships.students ? "warn" : "ok"} />
            <Stat label={t("streamRecords.statMoots")} value={d.lawInternships.mootCourts.total} />
          </View>
          <Text variant="xs" tone="muted">
            {t("streamRecords.lawBody")}
          </Text>
        </Card>
      ) : null}
      {d?.education ? (
        <Card title={t("streamRecords.practiceTitle")}>
          <View style={row}>
            <Stat label={t("streamRecords.statPracticeSchools")} value={d.teachingPractice.practiceSchools} />
            <Stat label={t("streamRecords.statPostings")} value={d.teachingPractice.postings} />
            <Stat label={t("streamRecords.statObserved")} value={`${d.teachingPractice.lessonsObserved}/${d.teachingPractice.lessonsPlanned}`} />
            <Stat label={t("streamRecords.statMeetingNcte")} value={`${d.teachingPractice.meetingMinimum} / ${d.teachingPractice.students}`} tone={d.teachingPractice.meetingMinimum < d.teachingPractice.students ? "warn" : "ok"} />
          </View>
          <Text variant="xs" tone="muted">
            {t("streamRecords.practiceBody", { weeks: d.teachingPractice.minimumWeeks })}
          </Text>
        </Card>
      ) : null}
      {d && (d.corps.nss.enrolled > 0 || d.corps.ncc.enrolled > 0) ? (
        <Card title={t("streamRecords.corpsTitle")}>
          <View style={row}>
            <Stat label={t("streamRecords.statNssEnrolled")} value={d.corps.nss.enrolled} />
            <Stat label={t("streamRecords.statNssHours")} value={Math.round(d.corps.nss.hours)} />
            <Stat label={t("streamRecords.statNccEnrolled")} value={d.corps.ncc.enrolled} />
            <Stat label={t("streamRecords.statCamps")} value={d.corps.nss.camps + d.corps.ncc.camps} />
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}
