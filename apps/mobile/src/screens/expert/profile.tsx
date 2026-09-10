import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { expertProfileSchema, expertSaveProfileSchema, okSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Icon, Loading, Screen, Stat, Text } from "@/components";
import { Avatar } from "@/components/avatar";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { Chips } from "../staff/shared";

/**
 * The expert's own profile — the web's /expert/profile: their standing
 * (listed, verified — shown, never edited: whoever runs the platform sets
 * those), what their time has added up to, the lines a school weighs
 * before booking, and the words themselves. Specialisms are tags rather
 * than a comma-separated box, because the marketplace filters on exact
 * values. Saved as soon as the button is pressed; there is no draft.
 */
type Profile = z.infer<typeof expertProfileSchema>;
type SaveBody = z.infer<typeof expertSaveProfileSchema>;
type Offering = SaveBody["offering"];
const OFFERINGS: Offering[] = ["SESSIONS", "MENTORING", "BOTH"];
const OFFERING_KEY: Record<Offering, { label: TranslationKey; hint: TranslationKey }> = {
  SESSIONS: { label: "expert.offeringSessions", hint: "expert.offeringSessionsHint" },
  MENTORING: { label: "expert.offeringMentoring", hint: "expert.offeringMentoringHint" },
  BOTH: { label: "expert.offeringBoth", hint: "expert.offeringBothHint" },
};
const MAX_SPECIALISMS = 12;

export function ExpertProfile() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const me = session.status === "signed-in" ? session.me.user : null;
  const query = useQuery({
    queryKey: ["expert", "profile"],
    queryFn: async () => expertProfileSchema.parse(unwrap(await api().get("/api/v1/shared/expert/profile"))),
  });
  const d = query.data;
  const p = d?.profile;
  const impact = d?.impact;
  const hasImpact = impact ? impact.sessionsDone > 0 || impact.sessionsBooked > 0 || impact.activeMentorships > 0 : false;
  const steps: [boolean, TranslationKey][] = p && impact ? [[Boolean(p.bio.trim()), "expert.stepBio"], [p.specialisms.length > 0, "expert.stepSpecialisms"], [impact.upcomingSlots > 0, "expert.stepSlots"], [p.published, "expert.stepPublished"]] : [];

  return (
    <Screen title={t("expert.yourProfile")} description={t("expert.yourProfileBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && p && impact ? (
        <>
          {me ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
              <Avatar avatarKey={me.avatarKey} name={me.name} size={56} />
              <View style={{ flex: 1, gap: th.space[1] }}>
                <Text variant="lg" bold>
                  {me.preferredName ?? me.name}
                </Text>
                <Button label={t("student.changeMyLook")} variant="secondary" onPress={() => router.push("/(app)/avatar" as never)} />
              </View>
            </View>
          ) : null}
          <View style={{ gap: th.space[2] }}>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Pill label={p.published ? t("expert.listed") : t("expert.notListedYet")} tone={p.published ? "ok" : "warn"} />
              {p.verified ? <Pill label={t("expert.verified")} tone="accent" /> : null}
            </View>
            <Text variant="xs" tone="muted">
              {p.published ? t("expert.listedBody") : t("expert.notListedBody")}
            </Text>
          </View>

          {hasImpact ? (
            <Card title={t("expert.impactTitle")}>
              <Text variant="xs" tone="subtle">
                {t("expert.impactBody")}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                <Stat label={t("expert.statSessionsDone")} value={impact.sessionsDone} />
                <Stat label={t("expert.statSessionsBooked")} value={impact.sessionsBooked} tone="accent" />
                <Stat label={t("expert.statSchools")} value={impact.schoolsServed} />
                <Stat label={t("expert.statMentees")} value={impact.mentorCapacity !== null ? `${impact.activeMentorships}/${impact.mentorCapacity}` : impact.activeMentorships} />
              </View>
            </Card>
          ) : null}

          <Card title={t("expert.getBookedTitle")}>
            <Text variant="xs" tone="subtle">
              {t("expert.getBookedBody")}
            </Text>
            {steps.map(([done, key]) => (
              <View key={key} accessible accessibilityState={{ checked: done }} style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                <View style={{ width: th.space[5], height: th.space[5], borderRadius: th.radius.xl, alignItems: "center", justifyContent: "center", backgroundColor: done ? th.ok : undefined, borderWidth: done ? 0 : 1, borderColor: th.border }}>
                  {done ? <Icon name="check" size={12} weight="bold" color={th.fgInverse} /> : null}
                </View>
                <Text variant="sm" tone={done ? "muted" : "fg"} style={{ flex: 1, textDecorationLine: done ? "line-through" : "none" }}>
                  {t(key)}
                </Text>
              </View>
            ))}
          </Card>

          {/* The form owns its words from the first answer on: a pull-to-refresh must not wipe what is being typed. */}
          <ProfileForm profile={p} />
        </>
      ) : null}
    </Screen>
  );
}

function ProfileForm({ profile }: { profile: Profile["profile"] }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [headline, setHeadline] = useState(profile.headline);
  const [bio, setBio] = useState(profile.bio);
  const [organisation, setOrganisation] = useState(profile.organisation ?? "");
  const [tags, setTags] = useState<string[]>(profile.specialisms);
  const [draft, setDraft] = useState("");
  const [offering, setOffering] = useState<Offering>(profile.offering);
  const [capacity, setCapacity] = useState(profile.mentorCapacity === null ? "" : String(profile.mentorCapacity));
  const [timezone, setTimezone] = useState(profile.timezone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const save = useMutation({
    mutationFn: async (body: SaveBody) => {
      const result = await api().post("/api/v1/shared/expert/profile", body);
      if (!result.ok) throw new Error(errorText(result, t("expert.didNotSave")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ["expert", "profile"] });
    },
  });

  const mentors = offering !== "SESSIONS";
  const addTag = () => {
    const value = draft.trim();
    if (!value || tags.length >= MAX_SPECIALISMS) return;
    if (!tags.some((tag) => tag.toLowerCase() === value.toLowerCase())) setTags([...tags, value]);
    setDraft("");
  };
  const submit = () => {
    setSaved(false);
    const parsed = expertSaveProfileSchema.safeParse({
      headline: headline.trim(),
      bio,
      organisation: organisation.trim() || null,
      specialisms: tags,
      timezone: timezone.trim(),
      offering,
      // Only sent when it means something: a sessions-only expert makes no promise about mentees.
      mentorCapacity: mentors && capacity.trim() !== "" ? Number(capacity) : null,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? "")] = t("common.checkTheForm");
      setErrors(next);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <Card title={t("expert.aboutYou")}>
      <Text variant="xs" tone="subtle">
        {t("expert.profileCardBody")}
      </Text>
      <Field label={t("expert.headline")} hint={t("expert.headlineHint")} value={headline} onChangeText={setHeadline} placeholder={t("expert.headlinePlaceholder")} maxLength={120} error={errors.headline} />
      <Field label={t("expert.aboutYou")} hint={t("expert.bioHint")} value={bio} onChangeText={setBio} multiline maxLength={4000} error={errors.bio} style={{ minHeight: 96, textAlignVertical: "top", paddingTop: th.space[3] }} />
      <Field label={t("expert.organisation")} hint={t("expert.organisationHint")} value={organisation} onChangeText={setOrganisation} maxLength={200} error={errors.organisation} />

      <Text variant="sm" bold>
        {t("expert.specialisms")}
      </Text>
      <Text variant="xs" tone="subtle">
        {t("expert.specialismsHint", { max: MAX_SPECIALISMS })}
      </Text>
      {tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              accessibilityRole="button"
              accessibilityLabel={t("expert.removeSpecialism", { tag })}
              onPress={() => setTags(tags.filter((x) => x !== tag))}
              style={{ minHeight: th.tap, flexDirection: "row", alignItems: "center", gap: th.space[1], paddingHorizontal: th.space[3], borderRadius: th.radius.xl, backgroundColor: th.accentSoft }}
            >
              <Text variant="sm" bold tone="accent">
                {tag}
              </Text>
              <Icon name="x" size={14} weight="bold" color={th.accentStrong} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: th.space[2] }}>
        <View style={{ flex: 1 }}>
          <Field
            label={t("expert.addSpecialism")}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addTag}
            editable={tags.length < MAX_SPECIALISMS}
            maxLength={60}
            placeholder={tags.length >= MAX_SPECIALISMS ? t("expert.specialismLimit") : t("expert.specialismPlaceholder")}
            error={errors.specialisms}
          />
        </View>
        <Button label={t("common.add")} variant="secondary" disabled={!draft.trim() || tags.length >= MAX_SPECIALISMS} onPress={addTag} />
      </View>

      <Chips label={t("expert.offeringQuestion")} value={offering} options={OFFERINGS.map((o) => ({ value: o, label: t(OFFERING_KEY[o].label) }))} onChange={setOffering} />
      <Text variant="xs" tone="muted">
        {t(OFFERING_KEY[offering].hint)}
      </Text>
      {/* Hidden rather than disabled when it means nothing: a greyed-out number still reads as a promise. */}
      {mentors ? <Field label={t("expert.mentorCapacity")} hint={t("expert.mentorCapacityHint")} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" placeholder="3" error={errors.mentorCapacity} /> : null}
      <Field label={t("expert.timezone")} hint={t("expert.timezoneHint")} value={timezone} onChangeText={setTimezone} placeholder={t("expert.timezonePlaceholder")} autoCapitalize="none" maxLength={80} error={errors.timezone} />

      {save.isError ? <Failed message={save.error.message} onRetry={submit} /> : null}
      {saved ? (
        <Text variant="sm" tone="ok" bold accessibilityLiveRegion="polite">
          {t("expert.profileSaved")}
        </Text>
      ) : null}
      <Button label={t("expert.saveProfile")} onPress={submit} busy={save.isPending} disabled={headline.trim().length < 3} />
    </Card>
  );
}
