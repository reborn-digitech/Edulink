import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { incidentSchema, type IncidentView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Confirm } from "../family/shared";
import { IncidentBadges, IncidentNotes, IncidentRecord } from "../shared/incidents";
import { must, Notice, Refusal } from "./shared";

/**
 * One incident for the school — the web's /staff/incidents/[id]: the
 * record as written, never edited; the follow-up notes under it with a
 * note form for anyone who may see it (canNote) while it is open; and the
 * close button for the office and the head (canClose), behind a confirm,
 * because closing ends the notes. Reached from the log's rows and from the
 * record form once it has posted.
 */
export function StaffIncident() {
  const { incidentId } = useLocalSearchParams<{ incidentId?: string }>();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [closing, setClosing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const base = `/api/v1/staff/incidents/${incidentId}`;
  const key = ["staff", "incident", incidentId];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => incidentSchema.parse(unwrap(await api().get(base))),
    enabled: Boolean(incidentId),
  });
  const settle = (next: IncidentView, text: string) => {
    qc.setQueryData(key, next);
    void qc.invalidateQueries({ queryKey: ["staff", "incident-log"] });
    setRefusal(null);
    setSaved(text);
  };
  const addNote = useMutation({
    mutationFn: async (body: string) => incidentSchema.parse(must(await api().post(`${base}/notes`, { body }), t("common.somethingWrong"))),
    onSuccess: (next) => {
      setNote("");
      setTried(false);
      settle(next, t("incidents.noteSaved"));
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  const close = useMutation({
    mutationFn: async () => incidentSchema.parse(must(await api().post(`${base}/close`, {}), t("common.somethingWrong"))),
    onSuccess: (next) => {
      setClosing(false);
      settle(next, t("incidents.closed"));
    },
    onError: (e) => {
      setClosing(false);
      setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {}));
    },
  });
  if (!incidentId) {
    return (
      <Screen title={t("incidents.title")}>
        <Empty icon="firstAid" title={t("incidents.notFound")} action={<Button label={t("incidents.viewLog")} variant="secondary" onPress={() => router.push("/(app)/incidents" as never)} />} />
      </Screen>
    );
  }
  const d = query.data;
  const open = d?.status === "OPEN";
  const noteMissing = !note.trim();
  return (
    <Screen title={d?.title ?? t("incidents.title")} description={d ? [d.studentName, d.className].filter(Boolean).join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <IncidentBadges kind={d.kind} severity={d.severity} status={d.status} />
          {saved ? <Notice text={saved} /> : null}
          {refusal ? <Failed message={refusal.message} /> : null}
          <Card title={t("incidents.onFile", { name: d.studentName })}>
            <IncidentRecord incident={d} />
          </Card>
          <IncidentNotes
            notes={d.notes}
            footer={
              d.canNote && open ? (
                <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                  <Field label={t("incidents.notes")} placeholder={t("incidents.notePlaceholder")} value={note} onChangeText={setNote} multiline maxLength={2000} error={tried && noteMissing ? t("refusal.required") : refusal?.issues.body} />
                  <Button
                    label={t("incidents.addNote")}
                    variant="secondary"
                    busy={addNote.isPending}
                    onPress={() => {
                      setTried(true);
                      if (!noteMissing) addNote.mutate(note.trim());
                    }}
                  />
                </View>
              ) : !open ? (
                <Text variant="xs" tone="subtle">
                  {t("incidents.refuseClosed")}
                </Text>
              ) : undefined
            }
          />
          {d.canClose && open ? (
            closing ? (
              <Confirm question={t("incidents.closeHint")} confirmLabel={t("incidents.close")} busy={close.isPending} onConfirm={() => close.mutate()} onCancel={() => setClosing(false)} />
            ) : (
              <Button label={t("incidents.close")} variant="danger" onPress={() => setClosing(true)} />
            )
          ) : null}
          <Button label={t("incidents.viewLog")} variant="ghost" onPress={() => router.push({ pathname: "/(app)/incidents", params: { studentMembershipId: d.studentMembershipId, name: d.studentName } } as never)} />
        </>
      ) : null}
    </Screen>
  );
}
