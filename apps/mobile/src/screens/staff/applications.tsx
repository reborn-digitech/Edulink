import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { applicationsListSchema, cyclesViewSchema, type AdmissionStatus } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { param } from "../family/shared";
import { STAGE, StagePill, STATUSES } from "../shared/application";
import { Chips } from "./shared";
import { CYCLES_KEY } from "./admissions";

type StatusFilter = AdmissionStatus | "";

/** `?cycleId=&status=&grade=` — the server filters, as the web's page does from its URL. */
export function pipelineQuery(cycleId: string, status: string, grade: string): string {
  const parts: string[] = [];
  if (cycleId) parts.push(`cycleId=${encodeURIComponent(cycleId)}`);
  if (status) parts.push(`status=${encodeURIComponent(status)}`);
  if (grade) parts.push(`grade=${encodeURIComponent(grade)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * The pipeline — the web's /admin/admissions/applications: every application
 * to the school, newest first, narrowed by cycle, stage and grade; each row
 * the child, the serial, the grade and the applicant with the stage as a
 * pill, opening the application. A walk-in family is entered from here.
 */
export function StaffApplications() {
  const params = useLocalSearchParams<{ cycleId?: string; status?: string }>();
  const t = useT();
  const router = useRouter();
  const [cycleId, setCycleId] = useState(param(params.cycleId) ?? "");
  const [status, setStatus] = useState<StatusFilter>((STATUSES as string[]).includes(param(params.status) ?? "") ? (param(params.status) as AdmissionStatus) : "");
  const [grade, setGrade] = useState("");
  const cycles = useQuery({ queryKey: CYCLES_KEY, queryFn: async () => cyclesViewSchema.parse(unwrap(await api().get("/api/v1/office/admissions/cycles"))) });
  const query = useQuery({
    queryKey: ["office", "admissions", "applications", cycleId, status, grade],
    placeholderData: keepPreviousData,
    queryFn: async () => applicationsListSchema.parse(unwrap(await api().get(`/api/v1/office/admissions/applications${pipelineQuery(cycleId, status, grade)}`))),
  });
  const items = query.data?.items ?? [];
  const chosen = cycles.data?.cycles.find((c) => c.id === cycleId);
  const grades = chosen ? chosen.grades.map((g) => g.grade) : [...new Set((cycles.data?.cycles ?? []).flatMap((c) => c.grades.map((g) => g.grade)))];
  const walkIn = <Button label={t("admissions.walkIn")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/application-new", params: cycleId ? { cycleId } : {} } as never)} />;
  return (
    <Screen title={t("admissions.pipelineTitle")} description={t("admissions.pipelineIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {cycles.data && cycles.data.cycles.length > 1 ? (
        <Chips
          label={t("admissions.cyclesTitle")}
          value={cycleId}
          options={[{ value: "", label: t("admissions.allCycles") }, ...cycles.data.cycles.map((c) => ({ value: c.id, label: c.name }))]}
          onChange={(next) => {
            setCycleId(next);
            setGrade("");
          }}
        />
      ) : null}
      <Chips<StatusFilter> label={t("admissions.stage")} value={status} options={[{ value: "", label: t("admissions.allStatuses") }, ...STATUSES.map((s) => ({ value: s, label: t(STAGE[s].key) }))]} onChange={setStatus} />
      {grades.length > 1 ? <Chips label={t("admissions.grade")} value={grade} options={[{ value: "", label: t("admissions.allGrades") }, ...grades.map((g) => ({ value: g, label: g }))]} onChange={setGrade} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        items.length === 0 ? (
          <Empty icon="users" title={t("admissions.noApplications")} body={t("admissions.noApplicationsBody")} action={walkIn} />
        ) : (
          <>
            {walkIn}
            <Card>
              {items.map((a) => (
                <Row
                  key={a.id}
                  title={a.childName}
                  caption={[a.serial, `${t("admissions.grade")} ${a.gradeApplied}`, a.applicantName, a.documentsMissing > 0 ? t("admissions.missingCount", { count: a.documentsMissing }) : null].filter(Boolean).join(" · ")}
                  right={<StagePill status={a.status} />}
                  onPress={() => router.push({ pathname: "/(app)/application", params: { id: a.id } } as never)}
                />
              ))}
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}
