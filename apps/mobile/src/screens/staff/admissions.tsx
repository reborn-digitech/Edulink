import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useRole } from "@/lib/session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cyclePurgedSchema, cycleSchema, cyclesViewSchema, type CycleView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Confirm, Pill } from "../family/shared";
import { must, openWeb } from "./shared";

export const CYCLES_KEY = ["office", "admissions", "cycles"];
const CYCLES_PATH = "/api/v1/office/admissions/cycles";

/**
 * The office's admission cycles — the web's /admin/admissions: each cycle
 * with its seats per grade and how many applications stand at each stage,
 * opened or closed from here, its sittings a row away, and the pipeline a
 * button away. A closed cycle can have the forms it did not admit deleted,
 * after a question — by the admin; the head opens and closes the door and
 * decides on the families, and never deletes a form. Designing a cycle
 * (grades, documents, the test, the notice) stays on the web, so the empty
 * state's door is there.
 */
export function StaffAdmissions() {
  const t = useT();
  const canPurge = useRole() === "ADMIN";
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [purging, setPurging] = useState<string | null>(null);
  const query = useQuery({ queryKey: CYCLES_KEY, queryFn: async () => cyclesViewSchema.parse(unwrap(await api().get(CYCLES_PATH))) });
  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "OPEN" | "CLOSED" }) => cycleSchema.parse(must(await api().post(`${CYCLES_PATH}/${id}/status`, { status }), t("common.somethingWrong"))),
    onSuccess: (cycle) => {
      toast.show(cycle.status === "OPEN" ? t("admissions.opened") : t("admissions.closed"), "ok");
      void qc.invalidateQueries({ queryKey: CYCLES_KEY });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const purge = useMutation({
    mutationFn: async (id: string) => cyclePurgedSchema.parse(must(await api().post(`${CYCLES_PATH}/${id}/purge`, {}), t("common.somethingWrong"))),
    onSuccess: (result) => {
      setPurging(null);
      toast.show(t("admissions.purged", { count: result.removed }), "ok");
      void qc.invalidateQueries({ queryKey: CYCLES_KEY });
      void qc.invalidateQueries({ queryKey: ["office", "admissions", "applications"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const cycles = query.data?.cycles ?? [];
  return (
    <Screen title={t("admissions.title")} description={t("admissions.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        cycles.length === 0 ? (
          <Empty icon="users" title={t("admissions.noCycles")} body={t("admissions.noCyclesBody")} action={<Button label={t("admissions.newCycle")} variant="secondary" onPress={() => openWeb("/admin/admissions")} />} />
        ) : (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Button label={t("admissions.pipelineTitle")} variant="secondary" onPress={() => router.push("/(app)/applications" as never)} />
              <Button label={t("admissions.newCycle")} variant="ghost" onPress={() => openWeb("/admin/admissions")} />
            </View>
            {cycles.map((c) => (
              <Card key={c.id} title={c.name} action={<CyclePill status={c.status} />}>
                <Text variant="sm" tone="muted">
                  {[c.academicYearName, c.feeStructureName].filter(Boolean).join(" · ")}
                </Text>
                {c.seats.map((s) => (
                  <Row
                    key={s.grade}
                    title={`${t("admissions.grade")} ${s.grade} · ${s.seats} ${t("admissions.seats").toLowerCase()}`}
                    caption={[
                      `${t("admissions.applied")} ${s.applied}`,
                      `${t("admissions.offeredCount")} ${s.offered}`,
                      `${t("admissions.acceptedCount")} ${s.accepted}`,
                      `${t("admissions.admittedCount")} ${s.admitted}`,
                      `${t("admissions.waitlistedCount")} ${s.waitlisted}`,
                    ].join(" · ")}
                  />
                ))}
                <Row title={t("admissions.slotsTitle")} caption={c.testRequired ? t("admissions.testRequiredHint") : undefined} onPress={() => router.push({ pathname: "/(app)/admission-slots", params: { id: c.id } } as never)} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  {c.status === "OPEN" ? (
                    <Button label={t("admissions.closeCycle")} variant="secondary" busy={setStatus.isPending && setStatus.variables?.id === c.id} onPress={() => setStatus.mutate({ id: c.id, status: "CLOSED" })} />
                  ) : (
                    <Button label={t("admissions.openCycle")} busy={setStatus.isPending && setStatus.variables?.id === c.id} onPress={() => setStatus.mutate({ id: c.id, status: "OPEN" })} />
                  )}
                  <Button label={t("admissions.pipelineTitle")} variant="ghost" onPress={() => router.push({ pathname: "/(app)/applications", params: { cycleId: c.id } } as never)} />
                </View>
                {c.status === "CLOSED" && canPurge ? (
                  purging === c.id ? (
                    <Confirm question={t("admissions.purgeConfirm")} confirmLabel={t("admissions.purge")} busy={purge.isPending} onConfirm={() => purge.mutate(c.id)} onCancel={() => setPurging(null)} />
                  ) : (
                    <Button label={t("admissions.purge")} variant="danger" onPress={() => setPurging(c.id)} />
                  )
                ) : null}
              </Card>
            ))}
          </>
        )
      ) : null}
    </Screen>
  );
}

export function CyclePill({ status }: { status: CycleView["status"] }) {
  const t = useT();
  if (status === "OPEN") return <Pill label={t("admissions.statusOpen")} tone="ok" />;
  if (status === "CLOSED") return <Pill label={t("admissions.statusClosed")} tone="muted" />;
  return <Pill label={t("admissions.statusDraft")} tone="warn" />;
}

/**
 * The card on the office's home while a cycle is open: its name and how
 * many applications wait, are offered and are accepted, opening the
 * pipeline on that cycle. Nothing while it loads, fails, or no cycle is open.
 */
export function OfficeAdmissionsCard() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({ queryKey: CYCLES_KEY, queryFn: async () => cyclesViewSchema.parse(unwrap(await api().get(CYCLES_PATH))) });
  const open = query.data?.cycles.find((c) => c.status === "OPEN");
  if (!open) return null;
  const n = (status: "SUBMITTED" | "OFFERED" | "ACCEPTED") => open.counts[status] ?? 0;
  return (
    <Card title={t("admissions.title")}>
      <Row
        title={open.name}
        caption={[`${n("SUBMITTED")} ${t("admissions.statusSubmitted").toLowerCase()}`, `${n("OFFERED")} ${t("admissions.statusOffered").toLowerCase()}`, `${n("ACCEPTED")} ${t("admissions.statusAccepted").toLowerCase()}`].join(" · ")}
        onPress={() => router.push({ pathname: "/(app)/applications", params: { cycleId: open.id } } as never)}
      />
    </Card>
  );
}
