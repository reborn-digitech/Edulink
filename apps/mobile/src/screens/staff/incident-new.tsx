import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INCIDENT_KINDS, INCIDENT_SEVERITIES, INCIDENT_STAFF_ONLY_KINDS, incidentSchema, type IncidentCreate, type IncidentKind, type IncidentSeverity } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { kindLabel, severityLabel } from "../shared/incidents";
import { Chips, must, Refusal } from "./shared";

const PATH = "/api/v1/staff/incidents";

/**
 * Recording an incident or a sick-room visit — the web's record form, for
 * the pupil named in the route (from a class roster's row or the pupil's
 * health card). Kind and severity as chips, where, the one line a parent
 * reads first, what happened, what was done, and whether to tell the family
 * now, on by default. No "when" field: the record is made on the spot, and
 * the server stamps now when `occurredAt` is left out. One POST; on 201 the
 * record opens, replacing this form so Back returns to the roster.
 */
export function StaffIncidentNew() {
  const params = useLocalSearchParams<{ membershipId?: string; name?: string }>();
  const membershipId = typeof params.membershipId === "string" && params.membershipId ? params.membershipId : undefined;
  const name = typeof params.name === "string" && params.name ? params.name : undefined;
  // An empty form for each pupil and after each record (TA-162): the route stays mounted as a tab, and the last
  // child's title, what happened and the action taken were in the boxes of the next record, told to the family if unseen.
  const [recorded, setRecorded] = useState(0);
  return <IncidentForm key={`${membershipId ?? ""}:${recorded}`} membershipId={membershipId} name={name} onRecorded={() => setRecorded((n) => n + 1)} />;
}

function IncidentForm({ membershipId, name, onRecorded }: { membershipId: string | undefined; name: string | undefined; onRecorded: () => void }) {
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [kind, setKind] = useState<IncidentKind>("INJURY");
  const [severity, setSeverity] = useState<IncidentSeverity>("MINOR");
  const [place, setPlace] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [notify, setNotify] = useState(true);
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  // A safeguarding concern: no "Tell the family" switch, and the form says who reads it (TA-108).
  const staffOnly = INCIDENT_STAFF_ONLY_KINDS.includes(kind);
  const titleMissing = !title.trim();
  const bodyMissing = !body.trim();
  const save = useMutation({
    mutationFn: async (payload: IncidentCreate) => incidentSchema.parse(must(await api().post(PATH, payload), t("common.somethingWrong"))),
    onSuccess: async (created) => {
      setRefusal(null);
      qc.setQueryData(["staff", "incident", created.id], created);
      await qc.invalidateQueries({ queryKey: ["staff", "incident-log"] });
      toast.show(INCIDENT_STAFF_ONLY_KINDS.includes(created.kind) ? t("incidents.recordedSafeguarding") : created.guardiansNotifiedAt ? t("incidents.recorded") : t("incidents.recordedQuiet"));
      onRecorded();
      router.replace({ pathname: "/(app)/incident", params: { incidentId: created.id } } as never);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (!membershipId) {
    return (
      <Screen title={t("incidents.record")}>
        <Empty icon="firstAid" title={t("incidents.record")} body={t("incidents.noneBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
      </Screen>
    );
  }
  const issue = (key: string) => refusal?.issues[key];
  const submit = () => {
    setTried(true);
    if (titleMissing || bodyMissing) return;
    save.mutate({
      studentMembershipId: membershipId,
      kind,
      severity,
      place: place.trim(),
      title: title.trim(),
      body: body.trim(),
      actionTaken: actionTaken.trim(),
      notifyGuardians: notify && !staffOnly,
    });
  };
  return (
    <Screen title={name ? t("incidents.recordFor", { name }) : t("incidents.record")}>
      <Text variant="sm" tone="muted">
        {t("incidents.intro")}
      </Text>
      <Card title={t("incidents.record")}>
        {name ? (
          <Text variant="xs" tone="muted">
            {t("incidents.pupil")}: {name}
          </Text>
        ) : null}
        {refusal ? <Failed message={refusal.message} /> : null}
        <Chips<IncidentKind> label={t("incidents.kind")} value={kind} options={INCIDENT_KINDS.map((k) => ({ value: k, label: kindLabel(t, k) }))} onChange={setKind} disabled={save.isPending} />
        <Chips<IncidentSeverity> label={t("incidents.severity")} value={severity} options={INCIDENT_SEVERITIES.map((s) => ({ value: s, label: severityLabel(t, s) }))} onChange={setSeverity} disabled={save.isPending} />
        <Field label={t("incidents.place")} hint={t("incidents.placeHint")} value={place} onChangeText={setPlace} maxLength={80} error={issue("place")} />
        <Field label={t("incidents.titleField")} hint={t("incidents.titleHint")} value={title} onChangeText={setTitle} maxLength={120} error={tried && titleMissing ? t("refusal.required") : issue("title")} />
        <Field label={t("incidents.body")} hint={t("incidents.bodyHint")} value={body} onChangeText={setBody} multiline maxLength={4000} error={tried && bodyMissing ? t("refusal.required") : issue("body")} />
        <Field label={t("incidents.actionTaken")} hint={t("incidents.actionTakenHint")} value={actionTaken} onChangeText={setActionTaken} multiline maxLength={2000} error={issue("actionTaken")} />
        {staffOnly ? (
          <Text variant="sm" tone="muted" testID="incident-staff-only">
            {t("incidents.safeguardingReaders")}
          </Text>
        ) : (
          <SwitchRow label={t("incidents.notifyGuardians")} hint={t("incidents.notifyGuardiansHint")} value={notify} onChange={setNotify} disabled={save.isPending} />
        )}
        <Button label={t("incidents.save")} busy={save.isPending} onPress={submit} />
      </Card>
    </Screen>
  );
}
