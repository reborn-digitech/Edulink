import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { healthCardSchema, type HealthCardSave, type HealthCardView as HealthCard } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cmToInt, HealthCardForm, HealthCardView, HealthChecks, kgToGrams, SavedNote, todayKey } from "../shared/health";
import { must, Refusal } from "./shared";

/**
 * One pupil's health and emergency card for the school — the web's
 * /staff/pupils/[id]/health: the child's teacher reads it (canEdit false,
 * no form), the office and the head edit it with the same form the family
 * has, and record a check-up: the date (today unless changed), height in
 * cm, weight in kg to one decimal sent as grams, each eye, a note — at
 * least one of them, as the server insists. Reached from a class's roster
 * and from the directory, with the membership id in the route.
 */
export function PupilHealth() {
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const t = useT();
  const router = useRouter();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const base = `/api/v1/staff/pupils/${membershipId}/health`;
  const key = ["staff", "pupils", membershipId, "health"];
  const query = useQuery({
    queryKey: key,
    queryFn: async () => healthCardSchema.parse(unwrap(await api().get(base))),
    enabled: Boolean(membershipId),
  });
  const save = useMutation({
    mutationFn: async (body: HealthCardSave) => healthCardSchema.parse(must(await api().post(base, body), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      setEditing(false);
      setRefusal(null);
      setSaved(t("health.saved"));
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (!membershipId) {
    return (
      <Screen title={t("health.title")}>
        <Empty icon="heart" title={t("health.noCardYet")} body={t("health.noCardStaffBody")} action={<Button label={t("nav.classes")} variant="secondary" onPress={() => router.push("/(app)/classes" as never)} />} />
      </Screen>
    );
  }
  const d = query.data;
  return (
    <Screen title={d ? t("health.forChild", { name: d.studentName }) : t("health.title")} description={d?.className ?? undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text variant="sm" tone="muted">
        {t("health.intro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {saved && !editing ? <SavedNote text={saved} /> : null}
          {editing ? (
            <HealthCardForm
              key={d.card?.updatedAt ?? "new"}
              initial={d.card}
              busy={save.isPending}
              refusal={refusal}
              onSave={(body) => save.mutate(body)}
              onCancel={() => {
                setEditing(false);
                setRefusal(null);
              }}
            />
          ) : (
            <HealthCardView
              view={d}
              onEdit={
                d.canEdit
                  ? () => {
                      setSaved(null);
                      setEditing(true);
                    }
                  : undefined
              }
            />
          )}
          {d.canRecordCheck ? (
            <RecordCheck
              view={d}
              path={`${base}/checks`}
              onRecorded={(next) => {
                qc.setQueryData(key, next);
                setSaved(t("health.checkSaved"));
              }}
            />
          ) : null}
          <HealthChecks checks={d.checks} />
        </>
      ) : null}
    </Screen>
  );
}

/** The office's check-up form, folded until "Record a check-up" is pressed; the numbers are checked on the phone before the post. */
function RecordCheck({ view, path, onRecorded }: { view: HealthCard; path: string; onRecorded: (next: HealthCard) => void }) {
  const t = useT();
  const th = useTheme();
  const [open, setOpen] = useState(false);
  const [dateKey, setDateKey] = useState(todayKey);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const cm = cmToInt(height);
  const grams = kgToGrams(weight);
  const dateBad = !/^\d{4}-\d{2}-\d{2}$/.test(dateKey.trim());
  const nothing = cm === null && grams === null && !left.trim() && !right.trim() && !notes.trim();
  const blocked = dateBad || cm === "bad" || grams === "bad" || nothing;
  const record = useMutation({
    mutationFn: async () =>
      healthCardSchema.parse(
        must(
          await api().post(path, {
            dateKey: dateKey.trim(),
            heightCm: cm === "bad" ? null : cm,
            weightGrams: grams === "bad" ? null : grams,
            visionLeft: left.trim(),
            visionRight: right.trim(),
            notes: notes.trim(),
          }),
          t("common.somethingWrong"),
        ),
      ),
    onSuccess: (next) => {
      setHeight("");
      setWeight("");
      setLeft("");
      setRight("");
      setNotes("");
      setTried(false);
      setRefusal(null);
      setOpen(false);
      onRecorded(next);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (!open) return <Button label={t("health.recordCheck")} variant="secondary" onPress={() => setOpen(true)} />;
  return (
    <Card title={t("health.recordCheck")}>
      <Text variant="xs" tone="muted">
        {t("health.cardOf", { name: view.studentName })}
      </Text>
      {refusal ? <Failed message={refusal.message} /> : null}
      <Field label={t("health.checkDate")} value={dateKey} onChangeText={setDateKey} hint="YYYY-MM-DD" autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} error={tried && dateBad ? t("refusal.useRealDateForm") : refusal?.issues.dateKey} />
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("health.heightCm")} value={height} onChangeText={setHeight} keyboardType="number-pad" maxLength={3} error={tried && cm === "bad" ? t("refusal.notValid") : refusal?.issues.heightCm} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("health.weightKg")} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" maxLength={5} error={tried && grams === "bad" ? t("refusal.notValid") : refusal?.issues.weightGrams} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("health.visionLeft")} value={left} onChangeText={setLeft} maxLength={20} autoCapitalize="none" error={refusal?.issues.visionLeft} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("health.visionRight")} value={right} onChangeText={setRight} maxLength={20} autoCapitalize="none" error={refusal?.issues.visionRight} />
        </View>
      </View>
      <Field label={t("health.checkNotes")} value={notes} onChangeText={setNotes} multiline maxLength={500} error={tried && nothing ? t("health.checkNeedsSomething") : refusal?.issues.notes} />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
        <Button
          label={t("health.recordCheck")}
          busy={record.isPending}
          onPress={() => {
            setTried(true);
            if (!blocked) record.mutate();
          }}
        />
        <Button label={t("health.cancel")} variant="secondary" disabled={record.isPending} onPress={() => setOpen(false)} />
      </View>
    </Card>
  );
}
