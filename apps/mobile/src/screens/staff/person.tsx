import { useState } from "react";
import { View } from "react-native";
import { usePrivateScreen } from "@/lib/private-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LEAVING_CONDUCTS, LEAVING_REASON_CODES, leavingResultSchema, type LeavingBody } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Row, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips, formatDateKey, must, Refusal } from "./shared";

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
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const params = useLocalSearchParams<{ membershipId?: string; name?: string; role?: string; left?: string; leavingOn?: string; status?: string; birthdate?: string; subjects?: string }>();
  const membershipId = params.membershipId ?? "";
  const name = params.name ?? "";
  const isPupil = params.role === "STUDENT";
  const teaches = params.role === "TEACHER" || params.role === "PRINCIPAL";
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
      {!left ? (
        <>
          <LegalName membershipId={membershipId} name={name} onDone={refreshed} />
          <Birthdate membershipId={membershipId} name={name} initial={params.birthdate ?? ""} onDone={refreshed} />
          {teaches ? <Subjects membershipId={membershipId} name={name} initial={params.subjects ?? ""} onDone={refreshed} /> : null}
          <Pause membershipId={membershipId} name={name} paused={params.status === "SUSPENDED"} onDone={refreshed} />
        </>
      ) : null}
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
      {isPupil && !left ? <Remove membershipId={membershipId} name={name} onDone={() => { refreshed(); router.back(); }} /> : null}
    </Screen>
  );
}

/*
 * The rest of the web's row menu (admin/people/row-actions.tsx and its
 * panels), each a card: a legal name corrected for a coded reason, a date of
 * birth set or cleared, a teacher's subjects, access paused and restored,
 * and a pupil who was never here removed. Each posts to the door the phone
 * has for it under /api/v1/admin/people/{membershipId}/…; the rules are the
 * server's, and its refusal is shown as it came.
 */
type LegalReason = "SPELLING" | "ADMISSION_RECORD" | "LEGAL_CHANGE";
const LEGAL_REASON_KEY: Record<LegalReason, TranslationKey> = { SPELLING: "people.legalNameReasonSpelling", ADMISSION_RECORD: "people.legalNameReasonAdmission", LEGAL_CHANGE: "people.legalNameReasonLegalChange" };

function LegalName({ membershipId, name, onDone }: { membershipId: string; name: string; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const [value, setValue] = useState(name);
  const [reason, setReason] = useState<LegalReason | "">("");
  const [issue, setIssue] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (body: { name: string; reason: LegalReason }) => must(await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/legal-name`, body), t("common.somethingWrong")),
    onSuccess: () => {
      toast.show(t("people.legalNameSaved"), "ok");
      setIssue(null);
      onDone();
    },
    onError: (e) => setIssue(e.message),
  });
  return (
    <Card title={t("people.legalNameTitle", { name })}>
      <Text variant="sm" tone="muted">
        {t("people.legalNameBody")}
      </Text>
      <Field label={t("people.legalNameField")} value={value} onChangeText={setValue} maxLength={120} error={issue} />
      <Chips label={t("people.legalNameReason")} value={reason} options={(["SPELLING", "ADMISSION_RECORD", "LEGAL_CHANGE"] as LegalReason[]).map((code) => ({ value: code as LegalReason | "", label: t(LEGAL_REASON_KEY[code]) }))} onChange={setReason} />
      <Button
        label={t("common.save")}
        variant="secondary"
        busy={save.isPending}
        disabled={value.trim() === name}
        onPress={() => {
          if (!reason) {
            setIssue(t("people.legalNameChoose"));
            return;
          }
          save.mutate({ name: value.trim(), reason });
        }}
      />
    </Card>
  );
}

function Birthdate({ membershipId, name, initial, onDone }: { membershipId: string; name: string; initial: string; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const [value, setValue] = useState(initial);
  const [issue, setIssue] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (dateKey: string | null) => must(await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/birthdate`, { dateKey }), t("common.somethingWrong")),
    onSuccess: (_, dateKey) => {
      toast.show(t("people.birthdateSaved"), "ok");
      setIssue(null);
      setValue(dateKey ?? "");
      onDone();
    },
    onError: (e) => setIssue(e.message),
  });
  const submit = () => {
    const key = value.trim();
    if (key && !DATE.test(key)) {
      setIssue(t("staff.badDate"));
      return;
    }
    save.mutate(key || null);
  };
  return (
    <Card title={t("people.birthdateTitle", { name })}>
      <Text variant="sm" tone="muted">
        {t("people.birthdateBody", { name })}
      </Text>
      <Field label={t("people.birthdateField")} hint="YYYY-MM-DD" value={value} onChangeText={setValue} maxLength={10} keyboardType="numbers-and-punctuation" autoCapitalize="none" autoCorrect={false} error={issue} />
      <Button label={t("common.save")} variant="secondary" busy={save.isPending} onPress={submit} />
      {initial ? <Button label={t("people.birthdateClear")} variant="ghost" busy={save.isPending} onPress={() => { setValue(""); save.mutate(null); }} /> : null}
    </Card>
  );
}

/** The subjects as the row carries them: joined by a comma, which a subject's name never holds. */
export function splitSubjects(joined: string): string[] {
  return joined.split(",").map((s) => s.trim()).filter(Boolean);
}

function Subjects({ membershipId, name, initial, onDone }: { membershipId: string; name: string; initial: string; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [subjects, setSubjects] = useState<string[]>(() => splitSubjects(initial));
  const [issue, setIssue] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (list: string[]) => must(await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/subjects`, { subjects: list }), t("common.somethingWrong")),
    onSuccess: () => {
      toast.show(t("reviews.subjectsSaved"), "ok");
      setIssue(null);
      onDone();
    },
    onError: (e) => setIssue(e.message),
  });
  return (
    <Card title={t("reviews.subjectsFor", { name })}>
      {subjects.map((subject, i) => (
        <View key={i} style={{ flexDirection: "row", gap: th.space[2], alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <Field label={`${t("reviews.subjectsTitle")} ${i + 1}`} value={subject} onChangeText={(v) => setSubjects((prev) => prev.map((x, k) => (k === i ? v : x)))} maxLength={60} />
          </View>
          <Button label={`${t("common.remove")} ${subject.trim() || i + 1}`} variant="ghost" onPress={() => setSubjects((prev) => prev.filter((_, k) => k !== i))} />
        </View>
      ))}
      <Button label={t("reviews.addSubject")} variant="secondary" disabled={subjects.length >= 20} onPress={() => setSubjects((prev) => [...prev, ""])} />
      {issue ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {issue}
        </Text>
      ) : null}
      <Button label={t("common.save")} busy={save.isPending} onPress={() => save.mutate(subjects.map((s) => s.trim()).filter(Boolean))} />
    </Card>
  );
}

function Pause({ membershipId, name, paused: initiallyPaused, onDone }: { membershipId: string; name: string; paused: boolean; onDone: () => void }) {
  const t = useT();
  const toast = useToast();
  const [paused, setPaused] = useState(initiallyPaused);
  const [reason, setReason] = useState("");
  const [issue, setIssue] = useState<string | null>(null);
  const pause = useMutation({
    mutationFn: async (why: string) => must(await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/pause`, { reason: why }), t("common.somethingWrong")),
    onSuccess: () => {
      toast.show(t("people.paused", { name }), "ok");
      setPaused(true);
      setReason("");
      setIssue(null);
      onDone();
    },
    onError: (e) => setIssue(e.message),
  });
  const restore = useMutation({
    mutationFn: async () => must(await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/restore`, {}), t("common.somethingWrong")),
    onSuccess: () => {
      toast.show(t("people.canSignInAgain", { name }), "ok");
      setPaused(false);
      setIssue(null);
      onDone();
    },
    onError: (e) => setIssue(e.message),
  });
  if (paused) {
    return (
      <Card title={t("people.restore")}>
        <Text variant="sm" tone="muted">
          {t("people.suspendedNote")}
        </Text>
        {issue ? <Failed message={issue} /> : null}
        <Button label={t("people.restore")} variant="secondary" busy={restore.isPending} onPress={() => restore.mutate()} />
      </Card>
    );
  }
  return (
    <Card title={t("people.pauseTitle", { name })}>
      <Text variant="sm" tone="muted">
        {t("people.pauseBody")}
      </Text>
      <Field label={t("people.pauseWhy")} value={reason} onChangeText={setReason} maxLength={500} error={issue} />
      <Button label={t("people.pauseAction")} variant="danger" busy={pause.isPending} onPress={() => pause.mutate(reason)} />
    </Card>
  );
}

function Remove({ membershipId, name, onDone }: { membershipId: string; name: string; onDone: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const remove = useMutation({
    mutationFn: async () => must(await api().post(`/api/v1/admin/people/${encodeURIComponent(membershipId)}/remove`, {}), t("common.somethingWrong")),
    onSuccess: () => {
      toast.show(t("people.removed", { name }), "ok");
      onDone();
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  return (
    <Card title={t("people.removeTitle", { name })}>
      <Text variant="sm" tone="muted">
        {t("people.removeBodyPrefix")} {t("people.removeBodyDeleted")}
        {t("people.removeBodySuffix")}
      </Text>
      <Text variant="sm" tone="muted">
        {t("people.changedSchoolInstead")} {t("people.changedSchoolUse")} {t("people.left")}. {t("people.changedSchoolBody")}
      </Text>
      <Text variant="xs" tone="muted">
        {t("people.accountUntouched")}
      </Text>
      {refusal ? (
        <View style={{ gap: th.space[1] }}>
          <Text variant="sm" bold tone="danger" accessibilityRole="alert">
            {refusal.message}
          </Text>
          {Object.values(refusal.issues).map((line) => (
            <Text key={line} variant="xs" tone="muted">
              {line}
            </Text>
          ))}
        </View>
      ) : null}
      {confirming ? (
        <>
          <Button label={t("people.removeThem")} variant="danger" busy={remove.isPending} onPress={() => remove.mutate()} />
          <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
        </>
      ) : (
        <Button label={t("people.removeThem")} variant="danger" onPress={() => setConfirming(true)} />
      )}
    </Card>
  );
}
