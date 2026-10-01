import { useState } from "react";
import { Pressable, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ABSENCE_REASONS, absenceNotesSchema, type AbsenceNoteCreate, type AbsenceReason } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import type { TranslationKey } from "@edulink/i18n";
import { useTheme } from "@/lib/theme";
import { must, Refusal } from "../staff/shared";
import { formatDateKey, Note } from "./shared";

/** One key per coded reason, so the audit sees a key and not a template. */
export const REASON_KEY: Record<AbsenceReason, TranslationKey> = {
  ILLNESS: "familyCare.reasonILLNESS",
  FAMILY: "familyCare.reasonFAMILY",
  RELIGIOUS: "familyCare.reasonRELIGIOUS",
  TRAVEL: "familyCare.reasonTRAVEL",
  OTHER: "familyCare.reasonOTHER",
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The family tells the school ahead of a day away — the web's absence
 * notes card on the guardian's attendance page: the days still to come,
 * each one its author can take back until the register has marked the
 * day, and the form for another (a day, a coded reason, a line). For a
 * guardian's child or the pupil themselves; the server decides who may file
 * for whom. The GET is this component's own, keyed by the pupil, so the
 * attendance screen around it is not re-read when a note changes.
 */
export function AbsenceNotes({ studentMembershipId, self }: { studentMembershipId: string; self?: boolean }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const qc = useQueryClient();
  const key = ["family", "absence-notes", studentMembershipId];
  const path = `/api/v1/family/students/${studentMembershipId}/absence-notes`;
  const query = useQuery({ queryKey: key, queryFn: async () => absenceNotesSchema.parse(unwrap(await api().get(path))) });
  const [dateKey, setDateKey] = useState("");
  const [reason, setReason] = useState<AbsenceReason>("ILLNESS");
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const dateBad = !DATE.test(dateKey.trim());
  const file = useMutation({
    mutationFn: async (body: AbsenceNoteCreate) => absenceNotesSchema.parse(must(await api().post(path, body), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      setDateKey("");
      setText("");
      setTried(false);
      setNotice({ tone: "ok", text: t("familyCare.absenceFiled") });
    },
    onError: (e) => setNotice({ tone: "danger", text: e instanceof Refusal ? e.message : t("common.somethingWrong") }),
  });
  const withdraw = useMutation({
    mutationFn: async (noteId: string) => absenceNotesSchema.parse(must(await api().request("DELETE", `/api/v1/family/students/${studentMembershipId}/absence-notes/${noteId}`), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      setNotice({ tone: "ok", text: t("familyCare.absenceWithdrawn") });
    },
    onError: (e) => setNotice({ tone: "danger", text: e instanceof Refusal ? e.message : t("common.somethingWrong") }),
  });
  const d = query.data;
  function submit() {
    setTried(true);
    if (dateBad) return;
    setNotice(null);
    file.mutate({ dateKey: dateKey.trim(), reason, text: text.trim() });
  }
  return (
    <Card title={t("familyCare.absenceTitle")} testID="absence-notes">
      {d ? (
        <Text variant="xs" tone="muted">
          {self ? t("familyCare.absenceIntroSelf") : t("familyCare.absenceIntro", { name: d.childName })}
        </Text>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {notice ? (
        <Note tone={notice.tone}>
          <Text variant="sm" bold tone={notice.tone} accessibilityLiveRegion="polite">
            {notice.text}
          </Text>
        </Note>
      ) : null}
      {d ? (
        <>
          {d.notes.length === 0 ? (
            <Empty icon="calendar" title={t("familyCare.absenceNone")} body={t("familyCare.absenceNoneBody")} action={<Button label={t("familyCare.absenceSend")} variant="secondary" onPress={submit} />} />
          ) : (
            d.notes.map((note) => (
              <Row
                key={note.id}
                title={formatDateKey(note.dateKey, locale, { weekday: "long", day: "numeric", month: "long" })}
                caption={`${t(REASON_KEY[note.reason])}${note.text ? ` · “${note.text}”` : ""} · ${t("familyCare.absenceBy", { name: note.authorName })}`}
                right={note.canDelete ? <Button label={t("familyCare.absenceWithdraw")} variant="ghost" busy={withdraw.isPending} onPress={() => withdraw.mutate(note.id)} accessibilityLabel={`${t("familyCare.absenceWithdraw")}: ${formatDateKey(note.dateKey, locale)}`} /> : undefined}
              />
            ))
          )}
          <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
            <Field label={t("familyCare.absenceDate")} hint="YYYY-MM-DD" placeholder={d.today} value={dateKey} onChangeText={setDateKey} error={tried && dateBad ? t("refusal.useRealDateForm") : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" maxLength={10} />
            <Text variant="sm" bold>
              {t("familyCare.absenceReason")}
            </Text>
            <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              {ABSENCE_REASONS.map((code) => (
                <ReasonChip key={code} label={t(REASON_KEY[code])} selected={reason === code} onPress={() => setReason(code)} />
              ))}
            </View>
            <Field label={t("familyCare.absenceText")} placeholder={t("familyCare.absenceTextPlaceholder")} value={text} onChangeText={setText} maxLength={300} />
            <Button label={t("familyCare.absenceSend")} busy={file.isPending} onPress={submit} />
          </View>
        </>
      ) : null}
    </Card>
  );
}

function ReasonChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={selected}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: th.tap, paddingHorizontal: th.space[3], alignItems: "center", justifyContent: "center", borderRadius: th.radius.md, borderWidth: 2, borderColor: selected ? th.accent : th.border, backgroundColor: selected ? th.accentSoft : th.surface, opacity: pressed ? 0.8 : 1 })}
    >
      <Text variant="sm" bold tone={selected ? "accent" : "muted"}>
        {label}
      </Text>
    </Pressable>
  );
}
