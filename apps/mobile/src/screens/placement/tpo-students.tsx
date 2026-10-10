import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { placementChangedSchema, placementStudentsSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { Notice } from "../staff/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";
import { lpa } from "./words";

type Student = z.infer<typeof placementStudentsSchema>["students"][number];

/**
 * The placement roll on the phone (the parity batch, 10 Oct 2026, R-4), the
 * web's /placement/students: every student of the season's batch with the
 * record the cell reads (CGPA, live backlogs, attendance, programme), their
 * season choices (opted out, higher studies, a venture), consent, offers and
 * the dream flag — which the TPO grants or withdraws here, through the same
 * idempotent door as the web (POST .../students/{id}/dream). Nothing else is
 * written. A name search narrows a long roll.
 */
export function TpoStudentsScreen() {
  // No screenshots while it is up (A3-S-12): a roll with each student's record.
  usePrivateScreen();
  const t = useT();
  const qc = useQueryClient();
  const on = useModuleOn("PLACEMENT");
  const [q, setQ] = useState("");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["placement", "students"], enabled: on, queryFn: async () => placementStudentsSchema.parse(unwrap(await api().get("/api/v1/placement/students"))) });
  const dream = useMutation({
    mutationFn: async (s: Student) => ({ on: !s.dreamFlag, result: placementChangedSchema.parse(unwrap(await api().post(`/api/v1/placement/students/${s.studentMembershipId}/dream`, { on: !s.dreamFlag }))) }),
    onSuccess: ({ on: granted }) => {
      setNotice({ tone: "ok", text: t(granted ? "placement.dreamGranted" : "placement.dreamWithdrawn") });
      void qc.invalidateQueries({ queryKey: ["placement"] });
    },
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message }),
  });
  if (!on) return <ModuleOffScreen title={t("placement.tabStudents")} module="PLACEMENT" />;
  const d = query.data;
  const needle = q.trim().toLowerCase();
  const shown = (d?.students ?? []).filter((s) => !needle || s.name.toLowerCase().includes(needle) || (s.record.programmeName ?? "").toLowerCase().includes(needle));
  const caption = (s: Student) =>
    [
      s.record.programmeName,
      s.record.batchYear ? `${t("placement.colBatch")} ${s.record.batchYear}` : null,
      `${t("placement.colCgpa")} ${s.record.cgpa === null ? "—" : s.record.cgpa.toFixed(2)}`,
      `${t("placement.colBacklogs")} ${s.record.liveBacklogs ?? "—"}`,
      s.record.attendancePct === null ? null : `${t("placement.colAttendance")} ${Math.round(s.record.attendancePct)}%`,
      s.consentAt ? null : t("deskParity.studentNoConsent"),
      s.optedOut ? t("placement.optedOut") : null,
      s.higherStudies ? t("placement.higherStudies") : null,
      s.entrepreneur ? t("placement.entrepreneur") : null,
      s.offers > 0 ? `${t("placement.colOffers")} ${s.offers}` : null,
      s.acceptedRupees !== null ? t("deskParity.studentAccepted", { package: lpa(s.acceptedRupees, t) }) : null,
      s.dreamFlag ? t("placement.dreamOn") : null,
    ]
      .filter(Boolean)
      .join(" · ");
  return (
    <Screen title={t("placement.tabStudents")} description={t("deskParity.studentsIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Field label={t("common.searchLabel")} value={q} onChangeText={setQ} autoCorrect={false} returnKeyType="search" maxLength={60} />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.students.length === 0 ? <Empty icon="users" title={t("deskParity.studentsNone")} body={t("deskParity.studentsNoneBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d && d.students.length > 0 && shown.length === 0 ? <Empty icon="users" title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearSearch")} variant="secondary" onPress={() => setQ("")} />} /> : null}
      {shown.length > 0 ? (
        <Card title={t("deskParity.studentsCount", { shown: shown.length, total: d?.students.length ?? 0 })}>
          <ShowMore items={shown}>
            {(page) =>
              page.map((s) => (
                <Row
                  key={s.studentMembershipId}
                  title={s.name}
                  caption={caption(s)}
                  right={d?.canEdit ? <Button label={t(s.dreamFlag ? "deskParity.dreamWithdraw" : "deskParity.dreamGrant")} accessibilityLabel={`${t(s.dreamFlag ? "deskParity.dreamWithdraw" : "deskParity.dreamGrant")}: ${s.name}`} variant="ghost" disabled={dream.isPending} onPress={() => dream.mutate(s)} /> : undefined}
                />
              ))
            }
          </ShowMore>
          {d?.canEdit ? (
            <Text variant="xs" tone="muted">
              {t("placement.fieldDreamRatioHint")}
            </Text>
          ) : null}
          <OfflineDecisionNote />
        </Card>
      ) : null}
    </Screen>
  );
}
