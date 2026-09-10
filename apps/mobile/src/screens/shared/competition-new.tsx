import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contestCreatedSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, must, Refusal } from "../staff/shared";

type Scope = "school" | "platform";
type Form = {
  title: string;
  summary: string;
  body: string;
  organizerName: string;
  subject: string;
  gradeLow: string;
  gradeHigh: string;
  registrationClosesAt: string;
  startsAt: string;
  endsAt: string;
  eligibility: string;
  rules: string;
  prizes: string;
  externalUrl: string;
  requiresParentConsent: boolean;
  leaderboardEnabled: boolean;
};
type TextKey = Exclude<keyof Form, "requiresParentConsent" | "leaderboardEnabled">;

const BLANK: Form = {
  title: "",
  summary: "",
  body: "",
  organizerName: "",
  subject: "",
  gradeLow: "",
  gradeHigh: "",
  registrationClosesAt: "",
  startsAt: "",
  endsAt: "",
  eligibility: "",
  rules: "",
  prizes: "",
  externalUrl: "",
  requiresParentConsent: true,
  leaderboardEnabled: false,
};
const DATES: TextKey[] = ["registrationClosesAt", "startsAt", "endsAt"];
/** What the web's date input sends; the server parses it again and says so if it is not a real day. */
const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Posting a competition, the web's /competitions/new for a school's admin and
 * /appadmin/new for the content team (no school role; the flag on the
 * account). Saved as a DRAFT either way — publishing is its own press on the
 * competition (or on the console), because it puts the thing in front of
 * every child on the server. A person who is both picks which it is.
 */
export function CompetitionNew() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me : null;
  const canSchool = me?.active.role === "ADMIN";
  const canPlatform = Boolean(me?.user.isAppAdmin);
  const [picked, setPicked] = useState<Scope | null>(null);
  const scope: Scope | null = picked ?? (canSchool ? "school" : canPlatform ? "platform" : null);
  const [form, setForm] = useState<Form>(BLANK);
  /** The phone's own check (a date that is not year-month-day), before anything is sent. */
  const [checked, setChecked] = useState<Record<string, string>>({});
  const set = (key: TextKey) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: async (target: Scope) => {
      const body = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        body: form.body.trim(),
        subject: form.subject.trim(),
        gradeLow: form.gradeLow.trim(),
        gradeHigh: form.gradeHigh.trim(),
        eligibility: form.eligibility.trim(),
        rules: form.rules.trim(),
        prizes: form.prizes.trim(),
        externalUrl: form.externalUrl.trim(),
        registrationClosesAt: form.registrationClosesAt.trim(),
        startsAt: form.startsAt.trim(),
        endsAt: form.endsAt.trim(),
        requiresParentConsent: form.requiresParentConsent,
        leaderboardEnabled: form.leaderboardEnabled,
      };
      if (target === "platform") return contestCreatedSchema.parse(must(await api().post("/api/v1/appadmin/competitions/drafts", { ...body, organizerName: form.organizerName.trim() }), t("competitions.notSaved")));
      return contestCreatedSchema.parse(must(await api().post("/api/v1/contest/competitions", body), t("competitions.notSaved")));
    },
    onSuccess: (created, target) => {
      toast.show(t("competitions.savedDraft"));
      void qc.invalidateQueries({ queryKey: ["shared", "competitions"] });
      void qc.invalidateQueries({ queryKey: ["appadmin", "competitions"] });
      // A school's draft opens on its own page, where the Publish button is; the content team's goes back to the console's list, where theirs is.
      if (target === "school") router.replace({ pathname: "/(app)/competitions/detail", params: { competitionId: created.competitionId } } as never);
      else if (router.canGoBack()) router.back();
      else router.replace("/(app)/appadmin" as never);
    },
  });

  const submit = () => {
    if (!scope) return;
    const wrong: Record<string, string> = {};
    for (const key of DATES) if (form[key].trim() && !DAY.test(form[key].trim())) wrong[key] = t("competitions.notADate");
    setChecked(wrong);
    if (Object.keys(wrong).length > 0) return;
    save.mutate(scope);
  };

  if (session.status === "loading") {
    return (
      <Screen title={t("competitions.postACompetition")}>
        <Loading />
      </Screen>
    );
  }
  if (!scope) {
    return (
      <Screen title={t("competitions.postACompetition")}>
        <Empty icon="trophy" title={t("competitions.postACompetition")} body={t("competitions.onlyAdminsPost")} action={<Button label={t("competitions.title")} variant="secondary" onPress={() => router.push("/(app)/competitions" as never)} />} />
      </Screen>
    );
  }

  const platform = scope === "platform";
  const refusal = save.error instanceof Refusal ? save.error : null;
  const errors: Record<string, string> = { ...(refusal?.issues ?? {}), ...checked };
  const retry = refusal && (refusal.status === 0 || refusal.status >= 500) ? submit : undefined;
  const schoolName = me?.contexts.find((c) => c.schoolId === me.active.schoolId)?.schoolName ?? "";
  const ready = form.title.trim().length > 0 && form.summary.trim().length > 0;
  const long = { minHeight: 120, textAlignVertical: "top" as const, paddingTop: th.space[3] };

  return (
    <Screen title={platform ? t("appadmin.postCompetition") : t("competitions.postACompetition")} description={platform ? t("appadmin.postIntro") : t("competitions.postIntro")}>
      {canSchool && canPlatform ? (
        <Chips
          label={t("competitions.postingFor")}
          value={scope}
          options={[
            { value: "school", label: t("competitions.fromYourSchool") },
            { value: "platform", label: t("competitions.forEverySchool") },
          ]}
          onChange={setPicked}
        />
      ) : null}
      <Card>
        <Field label={t("competitions.formTitle")} value={form.title} onChangeText={set("title")} placeholder={t("competitions.formTitlePlaceholder")} maxLength={140} error={errors.title} />
        <Field label={t("competitions.oneLine")} value={form.summary} onChangeText={set("summary")} placeholder={t("competitions.oneLinePlaceholder")} hint={t("competitions.oneLineHint")} maxLength={200} error={errors.summary} />
        <Field label={t("competitions.details")} value={form.body} onChangeText={set("body")} hint={t("competitions.detailsHint")} multiline maxLength={5000} error={errors.body} style={long} />
        {platform ? <Field label={t("appadmin.organiserName")} value={form.organizerName} onChangeText={set("organizerName")} hint={t("appadmin.organiserHint")} maxLength={120} error={errors.organizerName} /> : null}
      </Card>
      <Card>
        <Field label={t("competitions.subject")} value={form.subject} onChangeText={set("subject")} placeholder={t("competitions.subjectPlaceholder")} maxLength={40} error={errors.subject} />
        <View style={{ flexDirection: "row", gap: th.space[3] }}>
          <View style={{ flex: 1 }}>
            <Field label={t("competitions.lowestYear")} value={form.gradeLow} onChangeText={set("gradeLow")} maxLength={10} error={errors.gradeLow} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label={t("competitions.highestYear")} value={form.gradeHigh} onChangeText={set("gradeHigh")} maxLength={10} error={errors.gradeHigh} />
          </View>
        </View>
      </Card>
      <Card title={t("competitions.dates")}>
        <Text variant="xs" tone="muted">
          {t("competitions.dateHint")}
        </Text>
        <Field label={t("competitions.entriesClose")} value={form.registrationClosesAt} onChangeText={set("registrationClosesAt")} keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} error={errors.registrationClosesAt} />
        <Field label={t("competitions.starts")} value={form.startsAt} onChangeText={set("startsAt")} keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} error={errors.startsAt} />
        <Field label={t("competitions.ends")} value={form.endsAt} onChangeText={set("endsAt")} keyboardType="numbers-and-punctuation" autoCorrect={false} maxLength={10} error={errors.endsAt} />
      </Card>
      <Card>
        <Field label={t("competitions.whoCanEnter")} value={form.eligibility} onChangeText={set("eligibility")} placeholder={t("competitions.eligibilityPlaceholder")} multiline maxLength={1000} error={errors.eligibility} style={long} />
        <Field label={t("competitions.rules")} value={form.rules} onChangeText={set("rules")} multiline maxLength={2000} error={errors.rules} style={long} />
        <Field label={t("competitions.prizes")} value={form.prizes} onChangeText={set("prizes")} multiline maxLength={1000} error={errors.prizes} style={long} />
        <Field label={t("competitions.organiserPage")} value={form.externalUrl} onChangeText={set("externalUrl")} hint={t("competitions.externalUrlHint")} placeholder={t("competitions.exampleUrlPlaceholder")} keyboardType="url" autoCapitalize="none" autoCorrect={false} maxLength={500} error={errors.externalUrl} />
      </Card>
      <Card>
        <Toggle label={t("competitions.askParentFirst")} hint={t("competitions.askParentHint")} value={form.requiresParentConsent} onChange={(v) => setForm((f) => ({ ...f, requiresParentConsent: v }))} />
        <Toggle label={t("competitions.showBoard")} hint={t("competitions.showBoardHint")} value={form.leaderboardEnabled} onChange={(v) => setForm((f) => ({ ...f, leaderboardEnabled: v }))} />
      </Card>
      {refusal ? <Failed message={refusal.message} onRetry={retry} /> : null}
      <Button label={t("competitions.saveDraft")} icon={<Icon name="trophy" size={20} color={th.accentFg} weight="bold" />} busy={save.isPending} disabled={!ready} onPress={submit} />
      <Text variant="sm" tone="muted">
        {platform ? t("appadmin.everySchoolSees") : t("competitions.postedAs", { school: schoolName })}
      </Text>
    </Screen>
  );
}

/** A yes/no with its sentence: the web's checkbox field, as a switch a thumb can reach. */
function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (next: boolean) => void }) {
  return <SwitchRow label={label} hint={hint} value={value} onChange={onChange} />;
}
