import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LEAVING_CONDUCTS, LEAVING_REASON_CODES, leavingResultSchema, type LeavingBody } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Row, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { useLocale, useT } from "@/lib/i18n";
import { Chips, formatDateKey } from "./shared";

type Reason = (typeof LEAVING_REASON_CODES)[number];
type Conduct = (typeof LEAVING_CONDUCTS)[number];
const REASON_KEY: Record<Reason, TranslationKey> = { TRANSFERRED: "people.transferred", GRADUATED: "people.graduated", LEFT: "people.leftOther" };
const CONDUCT_KEY: Record<Conduct, TranslationKey> = { EXCELLENT: "tc.conductExcellent", GOOD: "tc.conductGood", SATISFACTORY: "tc.conductSatisfactory" };
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** What the form sends: a blank line is left out, a blank day means today. */
export function leavingBodyFrom(form: { reason: Reason; conduct: Conduct | ""; destination: string; note: string; leftOn: string }): LeavingBody {
  return {
    reason: form.reason,
    conduct: form.conduct || null,
    ...(form.destination.trim() ? { destination: form.destination.trim() } : {}),
    ...(form.note.trim() ? { note: form.note.trim() } : {}),
    leftOn: form.leftOn.trim() || null,
  };
}

/**
 * One person from the directory — the web's row menu as a screen. For a
 * member of staff, their record. For a pupil, their health card and school
 * record, and the leaving: recorded (which issues the leaving certificate),
 * kept for a later last day, given up before that day, or undone after it.
 *
 * THE FORM SAYS WHAT THE FAMILY WILL GET before the button is pressed:
 * everything typed here is printed on a paper they hand to the next school.
 */
export function Person() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ membershipId?: string; name?: string; role?: string; left?: string; leavingOn?: string }>();
  const membershipId = params.membershipId ?? "";
  const name = params.name ?? "";
  const isPupil = params.role === "STUDENT";
  const [left, setLeft] = useState(params.left === "1");
  const [leavingOn, setLeavingOn] = useState<string | null>(params.leavingOn || null);
  const [reason, setReason] = useState<Reason>("TRANSFERRED");
  const [conduct, setConduct] = useState<Conduct | "">("GOOD");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [dateIssue, setDateIssue] = useState<string | null>(null);

  const refreshed = () => void qc.invalidateQueries({ queryKey: ["admin", "people"] });
  const record = useMutation({
    mutationFn: async (body: LeavingBody) => {
      const result = await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/leaving`, body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return leavingResultSchema.parse(result.data);
    },
    onSuccess: (done) => {
      if (done.scheduledFor) {
        setLeavingOn(done.scheduledFor);
        toast.show(t("people.leavingScheduled", { name, date: formatDateKey(done.scheduledFor, locale, { day: "numeric", month: "short", year: "numeric" }) }));
      } else {
        setLeft(true);
        toast.show(t("people.recordedAsLeft", { name }));
      }
      refreshed();
    },
  });
  const cancel = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/leaving/cancel`, {});
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
    },
    onSuccess: () => {
      setLeavingOn(null);
      toast.show(t("people.leavingCancelled"));
      refreshed();
    },
  });
  const undo = useMutation({
    mutationFn: async () => {
      const result = await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/leaving/undo`, {});
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
    },
    onSuccess: () => {
      setLeft(false);
      toast.show(t("people.backOnRoll", { name }));
      refreshed();
    },
  });
  const submit = () => {
    if (leftOn.trim() && !DATE.test(leftOn.trim())) {
      setDateIssue(t("staff.badDate"));
      return;
    }
    setDateIssue(null);
    record.mutate(leavingBodyFrom({ reason, conduct, destination, note, leftOn }));
  };
  const failure = record.error ?? cancel.error ?? undo.error;

  return (
    <Screen title={name} description={isPupil ? t("role.student") : undefined}>
      {isPupil ? (
        <Card>
          <Row icon="heart" title={t("nav.health")} onPress={() => router.push({ pathname: "/(app)/pupil-health", params: { membershipId } } as never)} />
          <Row icon="clipboard" title={t("nav.pupilRecords")} onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId } } as never)} />
        </Card>
      ) : (
        <Card>
          <Row icon="clipboard" title={t("people.staffRecordAction")} onPress={() => router.push({ pathname: "/(app)/staff-record", params: { membershipId } } as never)} />
        </Card>
      )}
      {failure ? <Failed message={failure.message} /> : null}
      {isPupil && left ? (
        <Card title={t("people.undoLeaving")}>
          <Text variant="sm" tone="muted">
            {t("people.leftNote")}
          </Text>
          <Button label={t("people.undoLeaving")} variant="secondary" busy={undo.isPending} onPress={() => undo.mutate()} />
        </Card>
      ) : null}
      {isPupil && !left && leavingOn ? (
        <Card title={t("people.leavingOn", { date: formatDateKey(leavingOn, locale, { day: "numeric", month: "short", year: "numeric" }) })} accessibilityLiveRegion="polite">
          <Text variant="sm" tone="muted">
            {t("people.futureDayHint")}
          </Text>
          <Button label={t("people.cancelLeaving")} variant="secondary" busy={cancel.isPending} onPress={() => cancel.mutate()} />
        </Card>
      ) : null}
      {isPupil && !left && !leavingOn ? (
        <Card title={t("people.leavingTitle", { name })}>
          <Text variant="sm" tone="muted">
            {t("people.leavingBody")}
          </Text>
          <Chips label={t("people.leavingWhy")} value={reason} options={LEAVING_REASON_CODES.map((code) => ({ value: code, label: t(REASON_KEY[code]) }))} onChange={setReason} />
          <Chips label={t("tc.conductLabel")} value={conduct} options={[{ value: "" as Conduct | "", label: t("tc.conductNone") }, ...LEAVING_CONDUCTS.map((code) => ({ value: code as Conduct | "", label: t(CONDUCT_KEY[code]) }))]} onChange={setConduct} />
          <Field label={t("people.whereTheyWent")} hint={t("people.optional")} placeholder={t("people.destinationPlaceholder")} value={destination} onChangeText={setDestination} maxLength={160} />
          <Field label={t("people.lineForNextSchool")} hint={t("people.optionalFamilyReads")} value={note} onChangeText={setNote} maxLength={500} multiline />
          <Field label={t("people.lastDay")} hint={`${t("people.futureDayHint")} · YYYY-MM-DD`} value={leftOn} onChangeText={setLeftOn} maxLength={10} keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} error={dateIssue} />
          <Button label={t("people.recordIt")} variant="danger" busy={record.isPending} onPress={submit} />
        </Card>
      ) : null}
    </Screen>
  );
}
