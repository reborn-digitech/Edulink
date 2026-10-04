import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { condonationSchema, condonationsSchema, hodHomeSchema } from "@edulink/contracts";
import { Button, Card, Failed, Loading, Row, Screen, Stat, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { CollegeRoleHome } from "@/screens/college/role-home";
import { DutyCard } from "@/screens/college/duties";
import { Notice } from "../staff/shared";
import { GROUND_KEY } from "./words";

/**
 * The HOD's department on the phone (the college's academics, 4 Oct 2026) —
 * the web's /hod: the department's courses with their course files' coverage
 * and marks' state, defaulters, the exam cell's published results (pass rate,
 * by course, toppers, open backlogs) and the students' projects, and the
 * condonation asks to approve, forward or refuse. Allotment, the substitution board and the defaulter list are
 * the web's. Off, the role home says so.
 */
export function HodHomeScreen() {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const session = useSession();
  const on = session.status === "signed-in" && (session.me.modules ?? []).includes("ACADEMICS");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const home = useQuery({ queryKey: ["academics", "hod-home"], enabled: on, queryFn: async () => hodHomeSchema.parse(unwrap(await api().get("/api/v1/academics/hod-home"))) });
  const asks = useQuery({ queryKey: ["academics", "condonations"], enabled: on, queryFn: async () => condonationsSchema.parse(unwrap(await api().get("/api/v1/academics/condonations?status=OPEN"))) });
  const decide = useMutation({
    mutationFn: async (input: { id: string; decision: "APPROVE" | "FORWARD" | "REFUSE" }) => condonationSchema.parse(unwrap(await api().post(`/api/v1/academics/condonations/${input.id}/decide`, { decision: input.decision, note: "" }))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("academics.decided") });
      void qc.invalidateQueries({ queryKey: ["academics"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (!on) return <CollegeRoleHome role="HOD" />;
  const h = home.data;
  return (
    <Screen title={h?.department ? t("academics.hodHomeTitle", { department: h.department.name }) : t("role.hod")} description={h?.term?.name} refreshing={home.isRefetching} onRefresh={() => void home.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {home.isPending ? <Loading /> : null}
      {home.isError ? <Failed message={home.error.message} onRetry={() => void home.refetch()} /> : null}
      {h && !h.department ? <Text tone="muted">{t("academics.noDepartmentBody")}</Text> : null}
      {/* My duties (5 Oct 2026). */}
      <DutyCard />
      {h?.department ? (
        <>
          <Card>
            <Stat label={t("academics.statOfferings")} value={String(h.offerings.length)} />
            <Stat label={t("academics.statDefaulters")} value={String(h.defaulters)} />
            <Stat label={t("academics.statCondonations")} value={String(h.condonationsWaiting)} />
          </Card>
          <Card title={t("academics.deptOfferingsTitle")}>
            {h.offerings.map((o) => (
              <Row
                key={o.offeringId}
                title={`${o.courseCode} · ${o.courseName}`}
                caption={[o.facultyName ?? t("academics.unstaffed"), t("academics.weeksTaught", { taught: o.taught, planned: o.planned }), o.behind ? t("academics.behind") : null, o.locked ? t("academics.lockedBadge") : null].filter(Boolean).join(" · ")}
                onPress={() => router.push(`/(app)/offering?id=${o.offeringId}` as never)}
              />
            ))}
          </Card>
          {/* The department's results for the latest term the exam cell published, and the students' projects (the web's /hod, 4 Oct 2026). */}
          <Card title={t("academics.resultsTitle")}>
            {h.results ? (
              <>
                <Text variant="sm">{t("collegeHub.hodResultsTerm", { term: h.results.termName, passed: h.results.passed, appeared: h.results.appeared, rate: h.results.passRatePercent })}</Text>
                {h.results.byCourse.map((c) => (
                  <Row key={c.key} title={c.label} caption={t("collegeHub.passRateLine", { passed: c.passed, appeared: c.appeared, rate: c.passRatePercent })} />
                ))}
                {h.results.toppers.length > 0 ? <Text variant="sm" tone="muted">{t("collegeHub.toppersLine", { names: h.results.toppers.map((x) => t("collegeHub.topperOne", { name: x.name, sgpa: x.sgpa.toFixed(2) })).join(", ") })}</Text> : null}
                <Text variant="sm" tone={h.results.openBacklogs > 0 ? "warn" : "muted"}>{t("collegeHub.openBacklogs", { count: h.results.openBacklogs })}</Text>
              </>
            ) : (
              <Text variant="sm" tone="muted">{t("collegeHub.hodResultsNone")}</Text>
            )}
            <Text variant="sm" tone="muted">{t("academics.mentoringSummary", { groups: h.mentoringGroups, mentees: h.mentees })}</Text>
          </Card>
          <Card title={t("academics.projectsTitle")}>
            <Text variant="xs" tone="muted">{t("collegeHub.projectsBody")}</Text>
            {h.projects.length === 0 ? <Text tone="muted">{t("academics.projectsNone")}</Text> : null}
            {h.projects.map((p, i) => (
              <Row key={`${p.title}-${i}`} title={p.title} caption={p.studentName} />
            ))}
          </Card>
        </>
      ) : null}
      {asks.data ? (
        <Card title={t("academics.condonationsTitle")}>
          {asks.data.items.length === 0 ? <Text tone="muted">{t("academics.condonationsNone")}</Text> : null}
          {asks.data.items.map((c) => (
            <Card key={c.id} title={c.studentName}>
              <Text variant="sm" tone="muted">{[c.termName, c.courseCode ?? t("academics.allCourses"), t(GROUND_KEY[c.ground]!)].join(" · ")}</Text>
              <Text variant="sm">{t("academics.condonationFacts", { percent: c.percent === null ? "—" : `${c.percent}%`, floor: c.floor })}</Text>
              <Text>{c.note}</Text>
              <Button label={t("academics.approve")} disabled={decide.isPending} onPress={() => decide.mutate({ id: c.id, decision: "APPROVE" })} />
              <Button label={t("academics.forward")} variant="secondary" disabled={decide.isPending} onPress={() => decide.mutate({ id: c.id, decision: "FORWARD" })} />
              <Button label={t("academics.refuse")} variant="ghost" disabled={decide.isPending} onPress={() => decide.mutate({ id: c.id, decision: "REFUSE" })} />
            </Card>
          ))}
        </Card>
      ) : null}
      <Button label={t("academics.myTeaching")} variant="secondary" onPress={() => router.push("/(app)/teaching" as never)} />
      <Button label={t("academics.mentoringTitle")} variant="secondary" onPress={() => router.push("/(app)/academics-mentoring" as never)} />
    </Screen>
  );
}
