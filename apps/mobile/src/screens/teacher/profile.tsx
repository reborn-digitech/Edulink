import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { saveProfileSchema, staffProfileSchema, type SaveProfileBody } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Stat, Text } from "@/components";
import { Avatar } from "@/components/avatar";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Notice, formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";

/**
 * The teacher's own profile, the web's /teacher/profile: the name they go
 * by, a line about themselves, their date of birth while they may edit it,
 * and then what only a teacher has — the staff record the office keeps, this
 * year's leave, the subjects they teach and the ratings their review rounds
 * gathered, aggregates only. The avatar is chosen on the app's own picker.
 */
const QUESTIONS = [
  ["CLARITY", "reviews.qClarity"],
  ["SUPPORT", "reviews.qSupport"],
  ["FAIRNESS", "reviews.qFairness"],
  ["ENGAGEMENT", "reviews.qEngagement"],
  ["RESPECT", "reviews.qRespect"],
] as const;

/** The web's first avatar preset, for a profile that never chose one — the save body requires a key. */
const DEFAULT_AVATAR = "preset:fox-sunset";

type Draft = { preferredName: string; bio: string; birthdate: string };

export function TeacherProfile() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["staff", "profile"],
    queryFn: async () => staffProfileSchema.parse(unwrap(await api().get("/api/v1/staff/profile"))),
  });
  const d = query.data;
  // The fields show the server's values until the person types; a draft is
  // kept only for what they changed, and dropped once a save has landed.
  const onFile: Draft = { preferredName: d?.user.preferredName ?? "", bio: d?.user.bio ?? "", birthdate: d?.user.birthdate ?? "" };
  const [draft, setDraft] = useState<Draft | null>(null);
  const form = draft ?? onFile;
  const { preferredName, bio, birthdate } = form;
  const edit = (patch: Partial<Draft>) => setDraft({ ...form, ...patch });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: async (body: SaveProfileBody) => unwrap(await api().post("/api/v1/staff/profile", body)),
    onSuccess: async () => {
      // The draft stays on screen until the refetched profile carries it, so the old name never flashes back.
      void qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["staff", "profile"] });
      setDraft(null);
      setSaved(true);
    },
  });
  const dirty = draft !== null && (draft.preferredName !== onFile.preferredName || draft.bio !== onFile.bio || draft.birthdate !== onFile.birthdate);
  const submit = () => {
    if (!d) return;
    setSaved(false);
    const parsed = saveProfileSchema.safeParse({ preferredName, bio, avatarKey: d.user.avatarKey ?? DEFAULT_AVATAR, birthdate: d.user.birthdateEditable && birthdate.trim() ? birthdate.trim() : undefined });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? "")] = t("common.checkTheForm");
      setErrors(next);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  const recordRows = d?.record
    ? ([
        [t("staff.staffNumber"), d.record.staffNumber],
        [t("staff.designation"), d.record.designation],
        [t("staff.qualification"), d.record.qualification],
        [t("staff.joinedOn"), d.record.joinedOnKey ? formatDateKey(d.record.joinedOnKey, locale, { day: "numeric", month: "short", year: "numeric" }) : null],
        // The DCF's own two dates, beside the day they joined this school.
        [t("staff.birthdate"), d.record.birthdateKey ? formatDateKey(d.record.birthdateKey, locale, { day: "numeric", month: "short", year: "numeric" }) : null],
        [t("staff.serviceJoinedOn"), d.record.serviceJoinedOnKey ? formatDateKey(d.record.serviceJoinedOnKey, locale, { day: "numeric", month: "short", year: "numeric" }) : null],
        [t("staff.leaveDays"), d.record.leaveDaysPerYear === null ? null : String(d.record.leaveDaysPerYear)],
      ].filter((r): r is [string, string] => Boolean(r[1])))
    : [];

  return (
    <Screen
      title={t("meta.teacherProfile")}
      description={d ? [d.schoolName, d.title, d.classes.length > 0 ? d.classes.map((c) => c.name).join(", ") : null].filter(Boolean).join(" · ") : undefined}
      refreshing={query.isRefetching}
      onRefresh={() => void query.refetch()}
    >
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("reviews.statClasses")} value={d.classes.length} />
            <Stat label={t("reviews.statPupils")} value={d.pupilsTaught} />
            <Stat label={t("reviews.statSince")} value={d.sinceYear} />
          </View>

          <Card title={preferredName.trim() || d.user.name}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
              <Avatar avatarKey={d.user.avatarKey} name={d.user.name} size={56} />
              <View style={{ flex: 1 }}>
                <Button label={t("student.changeMyLook")} variant="secondary" onPress={() => router.push("/(app)/avatar" as never)} />
              </View>
            </View>
            <Field label={t("student.callYou")} hint={t("student.nameYoullSee")} value={preferredName} onChangeText={(v) => edit({ preferredName: v })} placeholder={d.user.name.split(" ")[0]} maxLength={60} error={errors.preferredName} />
            <Field label={t("student.aboutYou")} hint={t("reviews.bioHintTeacher")} value={bio} onChangeText={(v) => edit({ bio: v })} placeholder={t("student.aboutPlaceholder")} multiline maxLength={600} error={errors.bio} style={{ minHeight: th.space[12] * 2, textAlignVertical: "top", paddingTop: th.space[3] }} />
            <Row title={t("student.fullName")} caption={t("student.nameHint")} right={<Text variant="sm" bold>{d.user.name}</Text>} />
            {d.user.birthdateEditable ? (
              <Field label={t("student.birthdate")} value={birthdate} onChangeText={(v) => edit({ birthdate: v })} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.birthdate} />
            ) : (
              <Row title={t("student.birthdate")} caption={d.user.birthdate ? t("student.birthdateLocked") : t("student.birthdateNone")} right={<Text variant="sm" bold>{d.user.birthdate ? formatDateKey(d.user.birthdate, locale, { day: "numeric", month: "short", year: "numeric" }) : "—"}</Text>} />
            )}
            {save.isError ? <Failed message={save.error.message} onRetry={submit} /> : null}
            {saved && !dirty ? <Notice text={t("student.saved")} /> : null}
            {dirty ? (
              <Text variant="sm" bold tone="accent">
                {t("student.unsaved")}
              </Text>
            ) : null}
            <Button label={t("student.save")} onPress={submit} busy={save.isPending} disabled={!dirty} />
          </Card>

          <Card title={t("staff.yourRecord")}>
            {recordRows.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("staff.nothingOnFile")}
              </Text>
            ) : (
              recordRows.map(([label, value]) => <Row key={label} title={label} right={<Text variant="sm" bold>{value}</Text>} />)
            )}
          </Card>

          <Card title={t("staff.balanceTitle")}>
            <Text variant="base">
              {d.balance.entitlement === null ? t("staff.noEntitlement", { used: d.balance.used }) : t("staff.balance", { used: d.balance.used, entitlement: d.balance.entitlement, remaining: d.balance.remaining ?? 0 })}
            </Text>
            {d.balance.pending > 0 ? (
              <Text variant="sm" tone="muted">
                {t("staff.balancePending", { pending: d.balance.pending })}
              </Text>
            ) : null}
            {d.balance.yearName ? (
              <Text variant="xs" tone="subtle">
                {t("staff.balanceYear", { year: d.balance.yearName })}
              </Text>
            ) : null}
          </Card>

          <Card title={t("reviews.subjectsTitle")}>
            {d.subjects.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("reviews.noSubjects")}
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                {d.subjects.map((s) => (
                  <Pill key={s} label={s} tone="accent" />
                ))}
              </View>
            )}
            <Text variant="xs" tone="subtle">
              {t("reviews.subjectsSelf")}
            </Text>
          </Card>

          <Card title={t("reviews.ratings")}>
            {d.reviews.responseCount === 0 ? (
              <Text variant="sm" tone="muted">
                {t("reviews.noRatingsYet")}
              </Text>
            ) : (
              <>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: th.space[2] }}>
                  {d.reviews.overall !== null ? (
                    <Text variant="2xl" bold>
                      {String(d.reviews.overall)}
                    </Text>
                  ) : null}
                  <Text variant="sm" tone="muted">
                    {d.reviews.responseCount === 1 ? t("reviews.answersSoFarOne") : t("reviews.answersSoFar", { count: d.reviews.responseCount })}
                  </Text>
                </View>
                {QUESTIONS.map(([q, key]) => (
                  <Row key={q} title={t(key)} right={<Text variant="sm" bold>{d.reviews.byQuestion[q] === undefined ? "—" : String(d.reviews.byQuestion[q])}</Text>} />
                ))}
              </>
            )}
            <Text variant="xs" tone="subtle">
              {t("reviews.ratingsSelf")}
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
