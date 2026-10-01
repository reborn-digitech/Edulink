import { useState, type ReactNode } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyStudentProfileSchema, okSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { Avatar } from "@/components/avatar";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatDateKey, formatInstant, Note, Pill } from "./shared";

type Profile = z.infer<typeof familyStudentProfileSchema>;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
/** The web's AVATAR_PRESETS[0] — what the form saves for a pupil who has never chosen a look. */
const FIRST_AVATAR = "preset:fox-sunset";

/**
 * My profile — the web's /student/profile: how the pupil looks to the class
 * (preferred name, a line about them, their date of birth while they may
 * still set it), the names only the school can change, and what they have
 * done: the schools before this one, their practice, their competitions and
 * their badges. Choosing an avatar is the app's own picker ("/(app)/avatar").
 */
export function StudentProfile() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["family", "student", "profile"],
    enabled: role === "STUDENT",
    queryFn: async () => familyStudentProfileSchema.parse(unwrap(await api().get("/api/v1/family/student/profile"))),
  });
  const d = query.data;
  if (role !== null && role !== "STUDENT") {
    return (
      <Screen title={t("student.myProfile")}>
        <Empty title={t("student.myProfile")} body={t("student.onlyStudentEdits")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
      </Screen>
    );
  }
  return (
    <Screen title={t("student.myProfile")} description={d ? [d.schoolName, d.className].filter(Boolean).join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <ProfileForm key={`${d.preferredName ?? ""}:${d.bio ?? ""}:${d.birthdate ?? ""}`} profile={d} />
          {d.previousSchools.length > 0 ? <PreviousSchools profile={d} /> : null}
          {d.practice.topicsPractised > 0 ? (
            <Card title={t("student.practiceCardTitle")} action={<Button label={t("student.keepPractising")} variant="ghost" onPress={() => router.push("/(app)/practice" as never)} />}>
              <Text variant="xs" tone="muted">
                {t("student.practiceCardBody")}
              </Text>
              <Figures>
                <Stat label={t("student.topicsPractised")} value={d.practice.topicsPractised} />
                <Stat label={t("student.topicsCompleted")} value={d.practice.topicsCompleted} />
              </Figures>
            </Card>
          ) : null}
          {d.competitions.length > 0 ? (
            <Card title={t("student.competitionsCardTitle")}>
              <Text variant="xs" tone="muted">
                {t("student.competitionsCardBody")}
              </Text>
              {d.competitions.map((entry) => (
                <Row key={entry.id} title={entry.title} caption={entry.rank !== null ? t("student.placedRank", { rank: entry.rank }) : entry.status === "SUBMITTED" ? t("student.entrySubmitted") : entry.status === "RESULTS" ? t("student.entryResults") : t("student.entryRegistered")} />
              ))}
            </Card>
          ) : null}
          <Badges profile={d} />
        </>
      ) : null}
    </Screen>
  );
}

function Figures({ children }: { children: ReactNode }) {
  const th = useTheme();
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>{children}</View>;
}

/** The web's ProfileForm: what the pupil may change, and beside it the names only the school can. Remounted (by key) when the server's copy changes. */
function ProfileForm({ profile }: { profile: Profile }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const { locale } = useLocale();
  const [preferredName, setPreferredName] = useState(profile.preferredName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [birthdate, setBirthdate] = useState(profile.birthdate ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = preferredName !== (profile.preferredName ?? "") || bio !== (profile.bio ?? "") || (profile.birthdateEditable && birthdate !== (profile.birthdate ?? ""));
  const birthdateBad = profile.birthdateEditable && birthdate.trim() !== "" && !DATE_KEY.test(birthdate.trim());
  const save = useMutation({
    mutationFn: async () => {
      const body: { preferredName: string; bio: string; avatarKey: string; birthdate?: string } = { preferredName: preferredName.trim(), bio: bio.trim(), avatarKey: profile.avatarKey ?? FIRST_AVATAR };
      // Saved only when it changed and the pupil may still set it, as the web form does.
      if (profile.birthdateEditable && birthdate.trim() && birthdate.trim() !== (profile.birthdate ?? "")) body.birthdate = birthdate.trim();
      const result = await api().post("/api/v1/family/student/profile", body);
      if (!result.ok) throw new Error(errorText(result, t("student.notSaved")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ["family", "student", "profile"] });
    },
    onError: (e) => {
      setSaved(false);
      setError(e.message);
    },
  });
  return (
    <Card title={t("student.howYouLook")}>
      <Text variant="xs" tone="muted">
        {t("student.classmatesSee")}
      </Text>
      {error ? <Failed message={error} /> : null}
      {saved ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok">
            {t("student.saved")}
          </Text>
        </Note>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
        <Avatar avatarKey={profile.avatarKey} name={profile.name} size={64} />
        <View style={{ flex: 1, gap: th.space[1] }}>
          <Text variant="lg" bold>
            {preferredName.trim() || profile.name}
          </Text>
          <Button label={t("student.changeMyLook")} variant="secondary" onPress={() => router.push("/(app)/avatar" as never)} />
        </View>
      </View>
      <Field label={t("student.callYou")} hint={t("student.nameYoullSee")} placeholder={profile.name.split(" ")[0]} value={preferredName} maxLength={60} onChangeText={(next) => { setPreferredName(next); setSaved(false); }} />
      <Field label={t("student.aboutYou")} hint={t("student.bioHint")} placeholder={t("student.aboutPlaceholder")} value={bio} maxLength={600} multiline onChangeText={(next) => { setBio(next); setSaved(false); }} style={{ minHeight: th.space[12] * 2 }} />
      {profile.birthdateEditable ? (
        <Field label={t("student.birthdate")} hint={t("student.birthdateHint")} placeholder="YYYY-MM-DD" value={birthdate} error={birthdateBad ? t("refusal.useRealDateForm") : null} onChangeText={(next) => { setBirthdate(next); setSaved(false); }} keyboardType="numbers-and-punctuation" autoCapitalize="none" />
      ) : (
        <Row title={t("student.birthdate")} caption={profile.birthdate ? `${formatDateKey(profile.birthdate, locale)} · ${t("student.birthdateLocked")}` : t("student.birthdateNone")} />
      )}
      <Row title={t("student.fullName")} caption={t("student.nameHint")} right={<Text variant="sm">{profile.name}</Text>} />
      {profile.handle ? <Row title={t("student.loginName")} right={<Text variant="sm">{profile.handle}</Text>} /> : null}
      {profile.studentCode ? <Row title={t("student.studentCode")} caption={t("student.codeHint")} right={<Text variant="sm">{profile.studentCode}</Text>} /> : null}
      {dirty && !saved ? (
        <Text variant="xs" tone="warn">
          {t("student.unsaved")}
        </Text>
      ) : null}
      <Button label={t("student.save")} busy={save.isPending} disabled={!dirty || birthdateBad} onPress={() => save.mutate()} />
    </Card>
  );
}

function PreviousSchools({ profile }: { profile: Profile }) {
  const t = useT();
  const { locale } = useLocale();
  const when = (iso: string) => formatInstant(iso, locale, { month: "short", year: "numeric" });
  return (
    <Card title={t("student.schoolsBeenTo")}>
      <Text variant="xs" tone="muted">
        {t("student.recordNote")}
      </Text>
      {profile.previousSchools.map((record) => (
        <Row key={record.id} title={record.schoolName} caption={[record.gradeLevel ? t("parent.gradeLevel", { level: record.gradeLevel }) : null, `${when(record.joinedAt)} – ${when(record.leftAt)}`, record.reason].filter(Boolean).join(" · ")} />
      ))}
    </Card>
  );
}

function Badges({ profile }: { profile: Profile }) {
  const t = useT();
  const earned = profile.badges.filter((b) => b.earned);
  return (
    <Card title={t("student.yourBadges")}>
      <Text variant="xs" tone="muted">
        {earned.length === 0 ? t("student.badgesNothingYet") : t("student.badgesSoFar")}
      </Text>
      {profile.badges.map((badge) => (
        <Row
          key={badge.id}
          title={t(badge.labelKey as TranslationKey)}
          caption={t(badge.descriptionKey as TranslationKey)}
          right={badge.earned ? <Pill tone="ok" label={t("student.badgeEarned")} /> : badge.progress ? <Text variant="xs" tone="subtle">{`${badge.progress.current} / ${badge.progress.target}`}</Text> : <Text variant="xs" tone="subtle">{t("student.notYet")}</Text>}
        />
      ))}
    </Card>
  );
}
