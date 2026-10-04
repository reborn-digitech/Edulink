import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { familyAcademicsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { Chips } from "../staff/shared";
import { AttendanceRows } from "./student";

/**
 * A college child's lecture attendance for their guardian (4 Oct 2026) —
 * the web's /parent/academics: a minor's always; an adult's only while they
 * let their guardians see attendance, otherwise the screen says so.
 */
export function FamilyAcademicsScreen() {
  const t = useT();
  const [childId, setChildId] = useState<string | null>(null);
  const view = useQuery({ queryKey: ["academics", "family", childId], queryFn: async () => familyAcademicsSchema.parse(unwrap(await api().get(`/api/v1/academics/family${childId ? `?childId=${childId}` : ""}`))) });
  const v = view.data;
  const retry = <Button label={t("common.retry")} variant="secondary" onPress={() => void view.refetch()} />;
  return (
    <Screen title={t("academics.familyTitle")} description={t("academics.familyIntro")} refreshing={view.isRefetching} onRefresh={() => void view.refetch()}>
      {view.isPending ? <Loading /> : null}
      {view.isError ? <Failed message={view.error.message} onRetry={() => void view.refetch()} /> : null}
      {v && v.children.length > 1 ? <Chips label={t("academics.whichChild")} value={v.childId ?? ""} onChange={setChildId} options={v.children.map((c) => ({ value: c.studentMembershipId, label: c.name }))} /> : null}
      {v && v.childId === null ? <Empty icon="graduationCap" title={t("academics.familyNone")} body={t("academics.familyNoneBody")} action={retry} /> : null}
      {v && v.childId !== null && !v.allowed ? <Empty icon="eye" title={t("academics.familyNotGranted")} body={t("academics.familyNotGrantedBody")} action={retry} /> : null}
      {v && v.allowed ? (
        <Card title={t("academics.childAttendance", { name: v.children.find((c) => c.studentMembershipId === v.childId)?.name ?? "" })}>
          <AttendanceRows rows={v.attendance} />
        </Card>
      ) : null}
    </Screen>
  );
}
