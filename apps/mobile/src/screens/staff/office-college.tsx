import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { academicsStructureSchema, admissionRoundsSchema, alumniAdminSchema, hostelOverviewSchema, transportOverviewSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { formatDateRange } from "@/lib/dates";
import { useTheme } from "@/lib/theme";
import { formatInstant, Pill } from "../family/shared";
import { ModuleOffScreen, useModuleOn } from "@/screens/shared/desk";

/**
 * The office's and the head's remaining link-outs as native reads (the
 * parity batch, 10 Oct 2026, R-4, step 8): transport, alumni, the hostel,
 * a college's academic structure and its admission rounds — each the one
 * GET the web page itself reads first, at a glance, with the forms left on
 * the web. Five screens in one file because each is a list and nothing more.
 */
export function OfficeTransportScreen() {
  const t = useT();
  const on = useModuleOn("TRANSPORT");
  const query = useQuery({ queryKey: ["admin", "transport"], enabled: on, queryFn: async () => transportOverviewSchema.parse(unwrap(await api().get("/api/v1/admin/transport"))) });
  if (!on) return <ModuleOffScreen title={t("transport.title")} module="TRANSPORT" />;
  const d = query.data;
  const direction: Record<string, TranslationKey> = { MORNING: "transport.directionMorning", EVENING: "transport.directionEvening", BOTH: "transport.directionBoth" };
  return (
    <Screen title={t("transport.title")} description={t("deskParity.officeReadIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("transport.routesTitle")}>
            {d.routes.length === 0 ? <Empty icon="bus" title={t("transport.noRoutes")} body={t("transport.noRoutesBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
            {d.routes.map((r) => (
              <Row key={r.id} title={r.name} caption={[t(direction[r.direction] ?? "transport.directionBoth"), t("transport.ridersCount", { count: r.riders }), `${t("transport.stopsTitle")} ${r.stops.length}`].join(" · ")} right={r.active ? undefined : <Pill label={t("deskParity.inactive")} tone="muted" />} />
            ))}
          </Card>
          <Card title={t("transport.busesTitle")}>
            {d.buses.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("transport.noBuses")}
              </Text>
            ) : null}
            {d.buses.map((b) => {
              const a = d.assignments.find((x) => x.busId === b.id);
              return <Row key={b.id} title={b.registration} caption={[t("transport.seatsCount", { count: b.capacity }), a ? `${a.routeName} · ${t("transport.driverLine", { name: a.driverName })}` : null].filter(Boolean).join(" · ")} />;
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

export function OfficeAlumniScreen() {
  const t = useT();
  const on = useModuleOn("ALUMNI");
  const query = useQuery({ queryKey: ["admin", "alumni"], enabled: on, queryFn: async () => alumniAdminSchema.parse(unwrap(await api().get("/api/v1/admin/alumni"))) });
  if (!on) return <ModuleOffScreen title={t("modules.alumniName")} module="ALUMNI" />;
  const d = query.data;
  return (
    <Screen title={t("modules.alumniName")} description={t("alumni.adminIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.batches.length === 0 ? <Empty icon="graduationCap" title={t("alumni.adminNoAlumni")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d && d.batches.length > 0 ? (
        <Card title={t("alumni.adminBatches")}>
          {d.batches.map((b) => (
            <Row key={b.year} title={t("alumni.batchOf", { year: b.year })} caption={t("alumni.adminBatchRow", { count: b.count, listed: b.listed })} />
          ))}
          <Text variant="xs" tone="muted">
            {t("deskParity.alumniMentors", { count: d.alumni.filter((a) => a.mentor).length, muted: d.alumni.filter((a) => a.muted).length })}
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}

export function OfficeHostelScreen() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const on = useModuleOn("HOSTEL");
  const query = useQuery({ queryKey: ["hostel", "overview"], enabled: on, queryFn: async () => hostelOverviewSchema.parse(unwrap(await api().get("/api/v1/hostel/overview"))) });
  if (!on) return <ModuleOffScreen title={t("modules.hostelName")} module="HOSTEL" />;
  const d = query.data;
  return (
    <Screen title={t("modules.hostelName")} description={t("deskParity.officeReadIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("hostel.occupancyTitle")}>
            {d.hostels.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("hostel.noHostelsOffice")}
              </Text>
            ) : null}
            {d.hostels.map((h) => (
              <Row key={h.id} title={h.name} caption={t("hostel.occupancy", { occupied: h.occupied, beds: h.beds })} />
            ))}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Stat label={t("deskParity.hostelOutNow")} value={d.outNow} />
              <Stat label={t("deskParity.hostelPendingLeave")} value={d.pendingLeave} tone={d.pendingLeave > 0 ? "warn" : "fg"} />
              <Stat label={t("hostel.visitorsTodayTitle")} value={d.visitorsToday} />
            </View>
          </Card>
          <Card title={t("hostel.absenteesTitle")}>
            {d.absentees.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("hostel.noAbsentees")}
              </Text>
            ) : null}
            {d.absentees.map((a, i) => (
              <Row key={`${a.name}-${i}`} title={a.name} caption={`${a.hostelName} · ${t("hostel.roomShort", { room: a.roomNumber })} · ${a.dateKey}`} />
            ))}
          </Card>
          <Card title={t("hostel.leaveTodayTitle")}>
            {d.leaveToday.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("hostel.noLeaveToday")}
              </Text>
            ) : null}
            {d.leaveToday.map((l) => (
              <Row key={l.id} title={l.name} caption={`${l.hostelName} · ${formatInstant(l.fromAt, locale)} – ${formatInstant(l.toAt, locale)} · ${l.destination}`} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

export function OfficeAcademicsScreen() {
  const t = useT();
  const on = useModuleOn("ACADEMICS");
  const query = useQuery({ queryKey: ["academics", "structure"], enabled: on, queryFn: async () => academicsStructureSchema.parse(unwrap(await api().get("/api/v1/academics/structure"))) });
  if (!on) return <ModuleOffScreen title={t("academics.title")} module="ACADEMICS" />;
  const d = query.data;
  return (
    <Screen title={t("academics.title")} description={t("deskParity.officeReadIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("academics.departmentsTitle")}>
            {d.departments.length === 0 ? <Empty icon="users" title={t("academics.departmentsNone")} body={t("academics.departmentsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
            {d.departments.map((x) => (
              <Row key={x.id} title={`${x.code} · ${x.name}`} caption={[x.hodName ?? t("deskParity.noHod"), t("deskParity.deptLine", { faculty: x.faculty, students: x.students })].join(" · ")} />
            ))}
          </Card>
          <Card title={t("academics.programmesTitle")}>
            {d.programmes.map((p) => (
              <Row key={p.id} title={`${p.code} · ${p.name}`} caption={[t(`academics.level${p.level}` as TranslationKey), t("deskParity.programmeLine", { years: p.durationYears, intake: p.intake })].join(" · ")} />
            ))}
          </Card>
          <Card title={t("academics.termsTitle")}>
            {d.terms.map((x) => (
              <Row key={x.id} title={x.name} caption={`${x.academicYear} · ${x.startsOn} – ${x.endsOn}`} right={x.registrationOpen ? <Pill label={t("deskParity.registrationOpen")} tone="ok" /> : undefined} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/**
 * A round's opening and closing days as the office typed them (TA-572): the server stores them at 00:00 and 23:59:59
 * UTC of those days, so the days are the instants' UTC dates. Read as instants in the phone's zone they showed an hour,
 * and in India the closing day read as 5:29 am the next day.
 */
const roundDays = (opensAt: string, closesAt: string) => formatDateRange(opensAt.slice(0, 10), closesAt.slice(0, 10));

export function OfficeAdmissionsScreen() {
  const t = useT();
  const on = useModuleOn("ADMISSIONS");
  const query = useQuery({ queryKey: ["college", "admissions", "rounds"], enabled: on, queryFn: async () => admissionRoundsSchema.parse(unwrap(await api().get("/api/v1/college/admissions/rounds"))) });
  if (!on) return <ModuleOffScreen title={t("collegeOffice.admissionsTitle")} module="ADMISSIONS" />;
  const d = query.data;
  return (
    <Screen title={t("collegeOffice.admissionsTitle")} description={t("deskParity.officeReadIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.rounds.length === 0 ? <Empty icon="userPlus" title={t("collegeOffice.roundsEmpty")} body={t("collegeOffice.roundsEmptyBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d && d.rounds.length > 0 ? (
        <Card title={t("collegeOffice.roundsTitle")}>
          {d.rounds.map((r) => (
            <Row
              key={r.id}
              title={r.name}
              caption={[t(`collegeOffice.round${r.kind}` as TranslationKey), `${t("collegeOffice.colIntake")} ${r.intakeYear}`, roundDays(r.opensAt, r.closesAt), `${t("collegeOffice.colApplications")} ${r.applications}`, `${t("collegeOffice.colAllotments")} ${r.allotments}`, `${t("collegeOffice.colAdmitted")} ${r.admitted}`].join(" · ")}
              right={<Pill label={t(r.status === "OPEN" ? "deskParity.roundOpen" : "deskParity.roundClosed")} tone={r.status === "OPEN" ? "ok" : "muted"} />}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}
