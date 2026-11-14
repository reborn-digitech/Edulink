import { useState } from "react";
import { View } from "react-native";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { facultyHomeSchema, lecturesSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { useTheme } from "@/lib/theme";
import { addDaysToKey } from "../staff/shared";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { CollegeRoleHome } from "@/screens/college/role-home";
import { DutyCard } from "@/screens/college/duties";
import { clock, lectureKindLabel } from "./words";
import { formatDate } from "@/lib/dates";

/**
 * A faculty member's day on the phone (the college's academics, 4 Oct 2026)
 * — the web's /faculty: today's lectures to mark, the courses I teach with
 * the course file's coverage and the internal marks' state, a colleague's
 * marks waiting for my countersign, my mentoring group and my payslips. The
 * FACULTY home, and an HOD's "My teaching". Off, the role home says so.
 */
export function FacultyHomeScreen({ asTeaching = false }: { asTeaching?: boolean }) {
  const t = useT();
  const router = useRouter();
  const session = useSession();
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("ACADEMICS");
  // My payslips (G-1, campaign 2026-10-04): the door names the college's staff now; shown while payroll is on.
  const payroll = session.status === "signed-in" && (session.me.modules ?? []).includes("PAYROLL");
  // The college's own word for a lecture or a lab (TA-472): /api/v1/me's streams.
  const streams = session.status === "signed-in" ? (session.me.streams ?? []) : [];
  const th = useTheme();
  const home = useQuery({ queryKey: ["academics", "faculty-home"], enabled: on, queryFn: async () => facultyHomeSchema.parse(unwrap(await api().get("/api/v1/academics/faculty-home"))) });
  // An earlier day's lectures (TA-059): a register not marked on its own day is reached a day at a time, never past today.
  const [day, setDay] = useState<string | null>(null);
  const earlier = useQuery({ queryKey: ["academics", "lectures", day], enabled: on && day !== null, placeholderData: keepPreviousData, queryFn: async () => lecturesSchema.parse(unwrap(await api().get(`/api/v1/academics/lectures?date=${day}`))) });
  if (!on) return <CollegeRoleHome role={asTeaching ? "HOD" : "FACULTY"} />;
  const h = home.data;
  const shown = day !== null ? earlier.data : h?.today;
  const later = (from: string) => {
    const next = addDaysToKey(from, 1);
    setDay(h && next < h.today.dateKey ? next : null);
  };
  return (
    <Screen title={h ? t("academics.facultyHomeTitle", { name: h.name }) : t("role.faculty")} description={h ? [h.departmentName, h.term?.name].filter(Boolean).join(" · ") : undefined} refreshing={home.isRefetching} onRefresh={() => void home.refetch()}>
      {home.isPending ? <Loading /> : null}
      {home.isError ? <Failed message={home.error.message} onRetry={() => void home.refetch()} /> : null}
      {h ? (
        <>
          <Card title={t("academics.todayTitle", { date: formatDate((shown ?? h.today).dateKey) })}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
              <Button label={t("substitutions.previousDay")} variant="secondary" onPress={() => setDay(addDaysToKey((shown ?? h.today).dateKey, -1))} />
              {day !== null ? <Button label={t("substitutions.nextDay")} variant="secondary" onPress={() => later(day)} /> : null}
              {day !== null ? <Button label={t("substitutions.today")} variant="ghost" onPress={() => setDay(null)} /> : null}
            </View>
            {day !== null && earlier.isPending ? <Loading /> : null}
            {day !== null && earlier.isError ? <Failed message={earlier.error.message} onRetry={() => void earlier.refetch()} /> : null}
            {shown?.closed ? <Text tone="muted">{t(day === null ? "academics.closedToday" : "academics.closedOnDay")}</Text> : null}
            {shown && !shown.closed && shown.lectures.length === 0 ? <Text tone="muted">{t(day === null ? "academics.noLecturesToday" : "academics.noLecturesOnDay")}</Text> : null}
            {(shown?.lectures ?? []).map((l) => (
              <Row
                key={l.lectureId}
                title={`${clock(l.startMinute, l.endMinute)} · ${l.courseCode}`}
                caption={[lectureKindLabel(l.kind, t, streams), l.divisionName, l.roomName, l.marked ? t("academics.markedOf", { marked: l.marked, registered: l.registered }) : null, l.substitute ? t("academics.standingIn") : null].filter(Boolean).join(" · ")}
                right={<Button label={t(l.marked ? "academics.reviewMarks" : "academics.markLecture")} variant={l.marked ? "secondary" : "primary"} onPress={() => router.push(`/(app)/lecture?id=${l.lectureId}` as never)} />}
              />
            ))}
          </Card>
          <Card title={t("academics.myOfferingsTitle")}>
            {h.offerings.length === 0 ? (
              <Empty icon="books" title={t("academics.myOfferingsNone")} body={t("academics.myOfferingsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void home.refetch()} />} />
            ) : null}
            {h.offerings.map((o) => (
              <Row
                key={o.offeringId}
                title={`${o.courseCode} · ${o.courseName}`}
                caption={[o.divisionName, t("academics.weeksTaught", { taught: o.taught, planned: o.planned }), o.behind ? t("academics.behind") : null, o.locked ? t("academics.lockedBadge") : t("academics.componentsState", { components: o.components, moderated: o.moderated, released: o.released })].filter(Boolean).join(" · ")}
                onPress={() => router.push(`/(app)/offering?id=${o.offeringId}` as never)}
              />
            ))}
            <Text variant="sm" tone="muted">{`${t("academics.statLoad")}: ${t("academics.hoursWeek", { n: h.hours })}`}</Text>
          </Card>
          {h.toModerate.length ? (
            <Card title={t("academics.toModerateTitle")}>
              {h.toModerate.map((m) => (
                <Row key={m.componentId} title={`${m.courseCode} · ${m.name}`} caption={m.facultyName ?? undefined} onPress={() => router.push(`/(app)/offering?id=${m.offeringId}&tab=marks` as never)} />
              ))}
            </Card>
          ) : null}
          {/* My duties (5 Oct 2026): a FACULTY's here; an HOD's on the department home. */}
          {asTeaching ? null : <DutyCard />}
          <Button label={h.mentoringGroups === 1 ? t("academics.mentoringLinkOne") : t("academics.mentoringLink", { n: h.mentoringGroups })} variant="secondary" onPress={() => router.push("/(app)/academics-mentoring" as never)} />
          {payroll ? <Button label={t("payroll.myTitle")} variant="secondary" onPress={() => router.push("/(app)/payslips" as never)} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
