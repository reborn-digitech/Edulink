import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { facultyHomeSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { CollegeRoleHome } from "@/screens/college/role-home";
import { LECTURE_KIND_KEY, clock } from "./words";

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
  const home = useQuery({ queryKey: ["academics", "faculty-home"], enabled: on, queryFn: async () => facultyHomeSchema.parse(unwrap(await api().get("/api/v1/academics/faculty-home"))) });
  if (!on) return <CollegeRoleHome role={asTeaching ? "HOD" : "FACULTY"} />;
  const h = home.data;
  return (
    <Screen title={h ? t("academics.facultyHomeTitle", { name: h.name }) : t("role.faculty")} description={h ? [h.departmentName, h.term?.name].filter(Boolean).join(" · ") : undefined} refreshing={home.isRefetching} onRefresh={() => void home.refetch()}>
      {home.isPending ? <Loading /> : null}
      {home.isError ? <Failed message={home.error.message} onRetry={() => void home.refetch()} /> : null}
      {h ? (
        <>
          <Card title={t("academics.todayTitle", { date: h.today.dateKey })}>
            {h.today.closed ? <Text tone="muted">{t("academics.closedToday")}</Text> : null}
            {!h.today.closed && h.today.lectures.length === 0 ? <Text tone="muted">{t("academics.noLecturesToday")}</Text> : null}
            {h.today.lectures.map((l) => (
              <Row
                key={l.lectureId}
                title={`${clock(l.startMinute, l.endMinute)} · ${l.courseCode}`}
                caption={[t(LECTURE_KIND_KEY[l.kind]!), l.divisionName, l.roomName, l.marked ? t("academics.markedOf", { marked: l.marked, registered: l.registered }) : null, l.substitute ? t("academics.standingIn") : null].filter(Boolean).join(" · ")}
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
          <Button label={t("academics.mentoringLink", { n: h.mentoringGroups })} variant="secondary" onPress={() => router.push("/(app)/academics-mentoring" as never)} />
          {payroll ? <Button label={t("payroll.myTitle")} variant="secondary" onPress={() => router.push("/(app)/payslips" as never)} /> : null}
        </>
      ) : null}
    </Screen>
  );
}
