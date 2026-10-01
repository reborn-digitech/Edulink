import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APPRAISAL_KINDS, appraisalSavedSchema, appraisalsSchema, myAppraisalsSchema, substitutionAssignedSchema, type AppraisalEntry, type AppraisalKind, type AppraisalSave } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { usePrivateScreen } from "@/lib/private-screen";
import { Button, Card, Empty, Failed, Field, Loading, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { Chips, formatDateKey } from "./shared";
import { todayKey } from "../teacher/support";

/**
 * The head's notes on a member of staff — the web's
 * /principal/staff/[membershipId]/appraisal: observations, targets and the
 * year's appraisal, newest first, each editable in place and shown to the
 * member of staff only when the head says so. The office reads the same
 * list with nothing to press.
 */
export const APPRAISALS_KEY = ["principal", "appraisals"] as const;
export const appraisalsPath = (membershipId: string) => `/api/v1/principal/staff/${membershipId}/appraisals`;

export const APPRAISAL_KIND_KEY: Record<AppraisalKind, TranslationKey> = { OBSERVATION: "appraisal.kindObservation", TARGET: "appraisal.kindTarget", APPRAISAL: "appraisal.kindAppraisal" };
const KIND_TONE: Record<AppraisalKind, "accent" | "warn" | "ok"> = { OBSERVATION: "accent", TARGET: "warn", APPRAISAL: "ok" };
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
type Rating = "" | "1" | "2" | "3" | "4" | "5";

type Draft = { kind: AppraisalKind; dateKey: string; summary: string; strengths: string; targets: string; rating: Rating; visibleToStaff: boolean };
const blank = (): Draft => ({ kind: "OBSERVATION", dateKey: todayKey(), summary: "", strengths: "", targets: "", rating: "", visibleToStaff: false });
const fromEntry = (e: AppraisalEntry): Draft => ({ kind: e.kind, dateKey: e.dateKey, summary: e.summary, strengths: e.strengths ?? "", targets: e.targets ?? "", rating: e.rating === null ? "" : (String(e.rating) as Rating), visibleToStaff: e.visibleToStaff });
export const toBody = (d: Draft): AppraisalSave => ({ kind: d.kind, dateKey: d.dateKey.trim(), summary: d.summary.trim(), strengths: d.strengths.trim() || null, targets: d.targets.trim() || null, rating: d.rating === "" ? null : Number(d.rating), visibleToStaff: d.visibleToStaff });

export function StaffAppraisal() {
  usePrivateScreen();
  const t = useT();
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const id = membershipId ?? "";
  const [adding, setAdding] = useState(false);
  const query = useQuery({
    queryKey: [...APPRAISALS_KEY, id],
    enabled: Boolean(membershipId),
    queryFn: async () => appraisalsSchema.parse(unwrap(await api().get(appraisalsPath(id)))),
  });
  const d = query.data;
  return (
    <Screen title={d ? t("appraisal.title", { name: d.name }) : t("appraisal.metaTitle")} description={d ? (d.canEdit ? t("appraisal.introHead") : t("appraisal.introOffice")) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Text variant="xs" tone="muted">
            {d.year ? t("appraisal.filedUnder", { year: d.year }) : t("appraisal.noYear")}
          </Text>
          {d.canEdit && !adding ? <Button label={t("appraisal.add")} onPress={() => setAdding(true)} /> : null}
          {d.canEdit && adding ? (
            <Card title={t("appraisal.add")}>
              <EntryForm membershipId={id} initial={blank()} onClose={() => setAdding(false)} />
            </Card>
          ) : null}
          <Card title={t("appraisal.timeline")}>
            {d.items.length === 0 ? (
              <Empty icon="clipboard" title={d.canEdit ? t("appraisal.emptyHead") : t("appraisal.emptyOffice")} action={d.canEdit ? <Button label={t("appraisal.add")} variant="secondary" onPress={() => setAdding(true)} /> : <Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} />
            ) : (
              d.items.map((e) => <EntryRow key={e.id} membershipId={id} entry={e} canEdit={d.canEdit} />)
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** One entry as read, with edit, show/hide and remove for the head. */
export function EntryRow({ membershipId, entry, canEdit }: { membershipId: string; entry: AppraisalEntry; canEdit: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const done = () => {
    void qc.invalidateQueries({ queryKey: APPRAISALS_KEY });
    void qc.invalidateQueries({ queryKey: MY_APPRAISALS_KEY });
  };
  const toggle = useMutation({
    mutationFn: async () => appraisalSavedSchema.parse(unwrap(await api().request("PUT", `/api/v1/principal/appraisals/${entry.id}`, { ...toBody(fromEntry(entry)), visibleToStaff: !entry.visibleToStaff }))),
    onSuccess: () => {
      toast.show(entry.visibleToStaff ? t("appraisal.hidden") : t("appraisal.shown"), "ok");
      done();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const remove = useMutation({
    mutationFn: async () => substitutionAssignedSchema.parse(unwrap(await api().request("DELETE", `/api/v1/principal/appraisals/${entry.id}`))),
    onSuccess: () => {
      toast.show(t("appraisal.removed"), "ok");
      done();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  if (editing) return <EntryForm membershipId={membershipId} appraisalId={entry.id} initial={fromEntry(entry)} onClose={() => setEditing(false)} />;
  const busy = toggle.isPending || remove.isPending;
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: th.space[2] }}>
        <Pill label={t(APPRAISAL_KIND_KEY[entry.kind])} tone={KIND_TONE[entry.kind]} />
        <Text variant="sm" bold>
          {formatDateKey(entry.dateKey, locale, { day: "numeric", month: "short", year: "numeric" })}
        </Text>
        {entry.rating !== null ? (
          <Text variant="xs" bold accessibilityLabel={t("appraisal.ratingOf", { rating: entry.rating })}>
            {t("appraisal.ratingShort", { rating: entry.rating })}
          </Text>
        ) : null}
        <Pill label={entry.visibleToStaff ? t("appraisal.visible") : t("appraisal.private")} tone={entry.visibleToStaff ? "ok" : "muted"} />
      </View>
      <Text variant="xs" tone="muted">
        {[entry.year, t("appraisal.byHead", { name: entry.appraiserName })].join(" · ")}
      </Text>
      <Text variant="sm">{entry.summary}</Text>
      {entry.strengths ? (
        <Text variant="sm" tone="muted">
          {`${t("appraisal.strengths")}: ${entry.strengths}`}
        </Text>
      ) : null}
      {entry.targets ? (
        <Text variant="sm" tone="muted">
          {`${t("appraisal.targets")}: ${entry.targets}`}
        </Text>
      ) : null}
      {canEdit ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("common.edit")} accessibilityLabel={`${t("common.edit")}: ${entry.summary}`} variant="ghost" disabled={busy} onPress={() => setEditing(true)} />
          <Button label={entry.visibleToStaff ? t("appraisal.hide") : t("appraisal.show")} accessibilityLabel={`${entry.visibleToStaff ? t("appraisal.hide") : t("appraisal.show")}: ${entry.summary}`} variant="ghost" busy={toggle.isPending} disabled={busy} onPress={() => toggle.mutate()} />
          {confirming ? (
            <>
              <Button label={t("appraisal.removeConfirm")} variant="danger" busy={remove.isPending} disabled={busy} onPress={() => remove.mutate()} />
              <Button label={t("common.cancel")} variant="ghost" disabled={busy} onPress={() => setConfirming(false)} />
            </>
          ) : (
            <Button label={t("common.remove")} accessibilityLabel={`${t("common.remove")}: ${entry.summary}`} variant="ghost" disabled={busy} onPress={() => setConfirming(true)} />
          )}
        </View>
      ) : null}
    </View>
  );
}

function EntryForm({ membershipId, appraisalId, initial, onClose }: { membershipId: string; appraisalId?: string; initial: Draft; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(initial);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const dateError = DATE_KEY.test(draft.dateKey.trim()) ? null : t("refusal.useRealDateForm");
  const summaryMissing = draft.summary.trim().length === 0;
  const save = useMutation({
    mutationFn: async () => {
      const body = toBody(draft);
      const result = appraisalId ? await api().request("PUT", `/api/v1/principal/appraisals/${appraisalId}`, body) : await api().post(appraisalsPath(membershipId), body);
      return appraisalSavedSchema.parse(unwrap(result));
    },
    onSuccess: () => {
      toast.show(t("appraisal.saved"), "ok");
      void qc.invalidateQueries({ queryKey: APPRAISALS_KEY });
      onClose();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const submit = () => {
    setTried(true);
    if (dateError || summaryMissing) return;
    save.mutate();
  };
  return (
    <View style={{ gap: th.space[3], paddingBottom: th.space[3], borderBottomWidth: 1, borderBottomColor: th.border }}>
      <Chips<AppraisalKind> label={t("appraisal.kind")} value={draft.kind} options={APPRAISAL_KINDS.map((k) => ({ value: k, label: t(APPRAISAL_KIND_KEY[k]) }))} onChange={(k) => set("kind", k)} />
      <Field label={t("appraisal.date")} value={draft.dateKey} onChangeText={(v) => set("dateKey", v)} error={tried ? dateError : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" placeholder="YYYY-MM-DD" />
      <Field label={t("appraisal.summary")} value={draft.summary} onChangeText={(v) => set("summary", v)} multiline maxLength={4000} error={tried && summaryMissing ? t("appraisal.summaryRequired") : null} />
      <Field label={t("appraisal.strengths")} value={draft.strengths} onChangeText={(v) => set("strengths", v)} multiline maxLength={4000} />
      <Field label={t("appraisal.targets")} value={draft.targets} onChangeText={(v) => set("targets", v)} multiline maxLength={4000} />
      <Chips<Rating> label={t("appraisal.rating")} value={draft.rating} options={[{ value: "", label: t("appraisal.noRating") }, ...(["1", "2", "3", "4", "5"] as const).map((n) => ({ value: n, label: t("appraisal.ratingShort", { rating: n }) }))]} onChange={(r) => set("rating", r)} />
      <SwitchRow label={t("appraisal.visibleLabel")} hint={t("appraisal.visibleHint")} value={draft.visibleToStaff} onChange={(v) => set("visibleToStaff", v)} />
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button label={appraisalId ? t("common.save") : t("appraisal.add")} busy={save.isPending} onPress={submit} />
        <Button label={t("common.cancel")} variant="secondary" disabled={save.isPending} onPress={onClose} />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* What the head has shown me                                                   */
/* -------------------------------------------------------------------------- */

export const MY_APPRAISALS_KEY = ["staff", "my-appraisals"] as const;
export const MY_APPRAISALS_PATH = "/api/v1/staff/me/appraisals";

/** My own entries marked visible by the head, newest first; read-only — the web's /teacher/appraisals. */
export function MyAppraisals() {
  usePrivateScreen();
  const t = useT();
  const query = useQuery({ queryKey: MY_APPRAISALS_KEY, queryFn: async () => myAppraisalsSchema.parse(unwrap(await api().get(MY_APPRAISALS_PATH))).items });
  const d = query.data;
  return (
    <Screen title={t("appraisal.myTitle")} description={t("appraisal.myIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.length === 0 ? (
          <Empty icon="clipboard" title={t("appraisal.myEmpty")} body={t("appraisal.myEmptyBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} />
        ) : (
          <Card title={t("appraisal.timeline")}>
            {d.map((e) => (
              <EntryRow key={e.id} membershipId={e.staffMembershipId} entry={e} canEdit={false} />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
