import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSettingsSchema, officeLogoSchema, okSchema, schoolWeekSavedSchema, schoolWeekSchema, selfReadAgeSchema, type AdminSettings as AdminSettingsData } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Icon, Loading, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { pickAndUpload } from "@/lib/pick-file";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, weekdayName } from "../family/shared";
import { Chips, Notice } from "./shared";

/** The web's swatches — names, not colours, so a screen reader says "Teal" and the chips stay in the theme's colours. */
const COLOURS: { value: string; nameKey: TranslationKey }[] = [
  { value: "", nameKey: "settings.roleColours" },
  { value: "#2563eb", nameKey: "settings.blue" },
  { value: "#0f766e", nameKey: "settings.teal" },
  { value: "#15803d", nameKey: "settings.green" },
  { value: "#b45309", nameKey: "settings.amber" },
  { value: "#b91c1c", nameKey: "settings.red" },
  { value: "#7e22ce", nameKey: "settings.purple" },
  { value: "#be185d", nameKey: "settings.pink" },
  { value: "#334155", nameKey: "settings.slate" },
];

export type SchoolDetailsBody = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  addressLine: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  gradeLow: string;
  gradeHigh: string;
  timezone: string;
  brandPrimary: string;
  about: string;
};

function draftFrom(d: AdminSettingsData): SchoolDetailsBody {
  const s = d.school;
  return {
    name: s.name,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone ?? "",
    website: s.website ?? "",
    addressLine: s.addressLine ?? "",
    city: s.city ?? "",
    region: s.region ?? "",
    postalCode: s.postalCode ?? "",
    country: s.country ?? "",
    gradeLow: s.gradeLow ?? "",
    gradeHigh: s.gradeHigh ?? "",
    timezone: s.timezone,
    brandPrimary: s.brandPrimary ?? "",
    about: d.directory.about,
  };
}

export type HousekeepingBody = { autoReadDays: number | null; expireDays: number | null };

/**
 * School settings — the web's /admin/settings: the details every invitation
 * and directory entry carries; the logo, chosen from the phone's files and
 * uploaded; the door to the public directory profile; and how long the
 * school's notices live.
 */
export function AdminSettings() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => adminSettingsSchema.parse(unwrap(await api().get("/api/v1/admin/settings"))),
  });
  const d = query.data;
  return (
    <Screen title={t("settings.title")} description={d ? `${t("settings.codePrefix")} ${d.school.code} ${t("settings.codeSuffix")}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <DetailsForm key={d.school.code} d={d} />
          <LogoCard logoPath={d.school.logoPath} />
          <Card title={t("explore.directoryTitle")} action={<Pill label={d.directory.published ? t("explore.publishedBadge") : t("explore.unpublishedBadge")} tone={d.directory.published ? "ok" : "muted"} />}>
            <Text variant="xs" tone="subtle">
              {t("explore.directoryBody")}
            </Text>
            <Text variant="sm" tone="muted">
              {`${t("explore.contactLabel")}: ${d.directory.contactName ?? t("explore.noContact")}`}
            </Text>
            {d.directory.admissionsContactMembershipId && !d.directory.contactStillValid ? (
              <Text variant="sm" tone="warn">
                {t("explore.contactGoneWarning")}
              </Text>
            ) : null}
            <Button label={t("explore.editProfile")} variant="secondary" onPress={() => router.push("/(app)/directory-profile" as never)} />
          </Card>
          <Housekeeping key={`${d.school.notifAutoReadDays}:${d.school.notifExpireDays}`} d={d} />
          <TeachingWeek />
          <SelfReadAge />
        </>
      ) : null}
    </Screen>
  );
}

/** The logo: an image chosen from the phone's files, uploaded, and made the school's; taking it off asks first. */
function LogoCard({ logoPath }: { logoPath: string | null }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
  };
  const choose = useMutation({
    mutationFn: async () => {
      const picked = await pickAndUpload("image", t("settings.couldNotSaveLogo"));
      return picked ? officeLogoSchema.parse(unwrap(await api().post("/api/v1/office/logo", { fileId: picked.fileId }))) : null;
    },
    onSuccess: (r) => {
      if (!r) return;
      toast.show(t("settings.logoSaved"));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const remove = useMutation({
    mutationFn: async () => officeLogoSchema.parse(unwrap(await api().post("/api/v1/office/logo", { fileId: null }))),
    onSuccess: () => {
      setConfirming(false);
      toast.show(t("settings.logoRemoved"));
      refresh();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  return (
    <Card title={t("settings.logo")}>
      <Text variant="xs" tone="subtle">
        {t("settings.logoBody")}
      </Text>
      <Text variant="sm" tone="muted">
        {logoPath ? t("settings.currentLogo") : t("settings.noLogoYet")}
      </Text>
      <Button label={logoPath ? t("settings.chooseAnother") : t("settings.chooseImage")} variant="secondary" icon={<Icon name="image" size={20} color={th.fg} />} busy={choose.isPending} onPress={() => choose.mutate()} />
      {logoPath ? (
        confirming ? (
          <View style={{ flexDirection: "row", gap: th.space[2] }}>
            <Button label={t("common.remove")} variant="danger" busy={remove.isPending} onPress={() => remove.mutate()} accessibilityLabel={`${t("common.confirm")}: ${t("common.remove")} ${t("settings.logo")}`} style={{ flexGrow: 1 }} />
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
          </View>
        ) : (
          <Button label={t("common.remove")} variant="ghost" onPress={() => setConfirming(true)} accessibilityLabel={`${t("common.remove")} ${t("settings.logo")}`} />
        )
      ) : null}
    </Card>
  );
}

/** How long the school's notices live: whole days, or blank for the platform's defaults. The server names the range it allows. */
function Housekeeping({ d }: { d: AdminSettingsData }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const [read, setRead] = useState(d.school.notifAutoReadDays === null ? "" : String(d.school.notifAutoReadDays));
  const [expire, setExpire] = useState(d.school.notifExpireDays === null ? "" : String(d.school.notifExpireDays));
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async (body: HousekeepingBody) => okSchema.parse(unwrap(await api().post("/api/v1/office/notifications/housekeeping", body))),
    onSuccess: () => {
      toast.show(t("notif.tidySaved"));
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const days = (text: string): number | null | undefined => (text.trim() === "" ? null : /^\d+$/.test(text.trim()) ? Number(text.trim()) : undefined);
  function submit() {
    const autoReadDays = days(read);
    const expireDays = days(expire);
    if (autoReadDays === undefined || expireDays === undefined) {
      setError(t("notif.thresholdNotWhole"));
      return;
    }
    setError(null);
    save.mutate({ autoReadDays, expireDays });
  }
  return (
    <Card title={t("notif.tidyTitle")}>
      <Text variant="sm" tone="muted">
        {t("notif.housekeeping", { read: d.school.notifAutoReadDays ?? d.notifDefaults.autoReadDays, expire: d.school.notifExpireDays ?? d.notifDefaults.expireDays })}
      </Text>
      <Text variant="xs" tone="subtle">
        {t("notif.tidyBody")}
      </Text>
      <Field label={t("notif.autoReadField")} value={read} onChangeText={setRead} placeholder={String(d.notifDefaults.autoReadDays)} keyboardType="number-pad" maxLength={4} error={error} />
      <Field label={t("notif.expireField")} value={expire} onChangeText={setExpire} placeholder={String(d.notifDefaults.expireDays)} keyboardType="number-pad" maxLength={4} />
      <Button label={t("common.save")} busy={save.isPending} onPress={submit} accessibilityLabel={`${t("common.save")}: ${t("notif.tidyTitle")}`} />
    </Card>
  );
}

/** The weekday numbers as the timetable counts them, Monday first and Sunday last — the order a school reads its week in. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEK_PATH = "/api/v1/office/school-week";

/**
 * The teaching week — the days the school teaches on, which decide which
 * days have a register, a staff register, a substitution board and a
 * timetable column. One GET, seven switches, one POST; the server counts the
 * timetable lessons a dropped day leaves stranded and the toast says so.
 */
function TeachingWeek() {
  const t = useT();
  const query = useQuery({
    queryKey: ["admin", "school-week"],
    queryFn: async () => schoolWeekSchema.parse(unwrap(await api().get(WEEK_PATH))),
  });
  return (
    <Card title={t("substitutions.weekTitle")}>
      <Text variant="xs" tone="subtle">
        {t("substitutions.weekIntro")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <TeachingWeekForm key={query.data.days.join(",")} days={query.data.days} /> : null}
    </Card>
  );
}

function TeachingWeekForm({ days }: { days: number[] }) {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [picked, setPicked] = useState<number[]>(days);
  const [error, setError] = useState<string | null>(null);
  const dirty = WEEK_ORDER.some((day) => picked.includes(day) !== days.includes(day));
  const save = useMutation({
    mutationFn: async (body: { days: number[] }) => schoolWeekSavedSchema.parse(unwrap(await api().post(WEEK_PATH, body))),
    onSuccess: (r) => {
      toast.show(r.orphanedSlots > 0 ? `${t("substitutions.weekSaved")} ${t("substitutions.weekOrphaned", { count: r.orphanedSlots })}` : t("substitutions.weekSaved"), r.orphanedSlots > 0 ? "info" : "ok");
      void qc.invalidateQueries({ queryKey: ["admin", "school-week"] });
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const toggle = (day: number, on: boolean) => {
    setError(null);
    setPicked((prev) => (on ? [...prev.filter((x) => x !== day), day] : prev.filter((x) => x !== day)));
  };
  function submit() {
    const chosen = WEEK_ORDER.filter((day) => picked.includes(day));
    if (chosen.length === 0) {
      setError(t("substitutions.weekAtLeastOne"));
      return;
    }
    setError(null);
    save.mutate({ days: chosen });
  }
  return (
    <>
      {WEEK_ORDER.map((day) => (
        <SwitchRow key={day} label={weekdayName(day, locale)} value={picked.includes(day)} onChange={(on) => toggle(day, on)} disabled={save.isPending} />
      ))}
      {error ? (
        <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Button label={t("substitutions.weekSave")} busy={save.isPending} disabled={!dirty} onPress={submit} />
    </>
  );
}

/** The office's dial for the pupil's own eyes. */
export const SELF_READ_PATH = "/api/v1/office/self-read-age";

/**
 * From what age a pupil reads their own health card and incident log —
 * the web's "Pupils' own eyes" card: one number, blank for never. The
 * server holds the range (its sentence names it) and the audit row.
 */
function SelfReadAge() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "self-read-age"],
    queryFn: async () => selfReadAgeSchema.parse(unwrap(await api().get(SELF_READ_PATH))),
  });
  const [age, setAge] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shown = age ?? (query.data?.selfReadAge === null || query.data?.selfReadAge === undefined ? "" : String(query.data.selfReadAge));
  const save = useMutation({
    mutationFn: async (body: { selfReadAge: number | null }) => selfReadAgeSchema.parse(unwrap(await api().post(SELF_READ_PATH, body))),
    onSuccess: (r) => {
      toast.show(r.selfReadAge === null ? t("familyCare.selfReadSavedOff") : t("familyCare.selfReadSaved", { age: r.selfReadAge }));
      setAge(null);
      void qc.invalidateQueries({ queryKey: ["admin", "self-read-age"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  function submit() {
    const raw = shown.trim();
    if (raw !== "" && !/^\d+$/.test(raw)) {
      setError(t("familyCare.selfReadNotWhole"));
      return;
    }
    setError(null);
    save.mutate({ selfReadAge: raw === "" ? null : Number(raw) });
  }
  return (
    <Card title={t("familyCare.selfReadTitle")} testID="self-read-age">
      <Text variant="xs" tone="subtle">
        {t("familyCare.selfReadBody")}
      </Text>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <Field label={t("familyCare.selfReadLabel")} hint={t("familyCare.selfReadHint")} value={shown} onChangeText={(next) => { setAge(next); setError(null); }} keyboardType="number-pad" maxLength={2} error={error} />
          <Button label={t("common.save")} busy={save.isPending} onPress={submit} accessibilityLabel={`${t("common.save")}: ${t("familyCare.selfReadTitle")}`} />
        </>
      ) : null}
    </Card>
  );
}

function DetailsForm({ d }: { d: AdminSettingsData }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [saved, setSaved] = useState<SchoolDetailsBody>(() => draftFrom(d));
  const [draft, setDraft] = useState<SchoolDetailsBody>(saved);
  const [errors, setErrors] = useState<Partial<Record<keyof SchoolDetailsBody, string>>>({});
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  const dirty = (Object.keys(draft) as (keyof SchoolDetailsBody)[]).some((k) => draft[k] !== saved[k]);
  const save = useMutation({
    mutationFn: async (body: SchoolDetailsBody) => okSchema.parse(unwrap(await api().post("/api/v1/admin/settings", body))),
    onSuccess: (_r, body) => {
      setSaved(body);
      setDraft(body);
      setNotice({ tone: "ok", text: t("settings.saved") });
      void qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
    },
    onError: (e) => setNotice({ tone: "danger", text: `${t("settings.notSaved")}: ${e.message}` }),
  });
  const set = (key: keyof SchoolDetailsBody) => (value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };
  function submit() {
    const next: Partial<Record<keyof SchoolDetailsBody, string>> = {};
    if (draft.name.trim().length < 2) next.name = t("settings.needName");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contactEmail.trim())) next.contactEmail = t("settings.needEmail");
    if (draft.website.trim() && !/^https?:\/\/\S+\.\S+/.test(draft.website.trim())) next.website = t("settings.websiteHint");
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setNotice({ tone: "danger", text: `${t("settings.notSaved")}: ${t("settings.checkFields")}` });
      return;
    }
    setNotice(null);
    const trimmed = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()])) as SchoolDetailsBody;
    save.mutate({ ...trimmed, contactEmail: trimmed.contactEmail.toLowerCase(), timezone: trimmed.timezone || "UTC" });
  }
  return (
    <Card title={t("settings.details")}>
      <Text variant="xs" tone="subtle">
        {t("settings.detailsBody")}
      </Text>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      <Field label={t("settings.schoolName")} value={draft.name} onChangeText={set("name")} error={errors.name} maxLength={120} />
      <Field label={t("settings.contactEmail")} value={draft.contactEmail} onChangeText={set("contactEmail")} error={errors.contactEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} maxLength={200} />
      <Field label={t("settings.phone")} value={draft.contactPhone} onChangeText={set("contactPhone")} placeholder={t("settings.optional")} keyboardType="phone-pad" maxLength={40} />
      <Field label={t("settings.website")} value={draft.website} onChangeText={set("website")} error={errors.website} hint={t("settings.websiteHint")} placeholder={t("settings.websitePlaceholder")} keyboardType="url" autoCapitalize="none" autoCorrect={false} maxLength={300} />
      <Field label={t("settings.address")} value={draft.addressLine} onChangeText={set("addressLine")} placeholder={t("settings.optional")} maxLength={200} />
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("settings.city")} value={draft.city} onChangeText={set("city")} maxLength={100} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("settings.region")} value={draft.region} onChangeText={set("region")} maxLength={100} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("settings.postcode")} value={draft.postalCode} onChangeText={set("postalCode")} maxLength={24} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("settings.country")} value={draft.country} onChangeText={set("country")} maxLength={100} />
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: th.space[3] }}>
        <View style={{ flex: 1 }}>
          <Field label={t("settings.lowestGrade")} value={draft.gradeLow} onChangeText={set("gradeLow")} maxLength={12} />
        </View>
        <View style={{ flex: 1 }}>
          <Field label={t("settings.highestGrade")} value={draft.gradeHigh} onChangeText={set("gradeHigh")} maxLength={12} />
        </View>
      </View>
      <Field label={t("settings.timezone")} value={draft.timezone} onChangeText={set("timezone")} hint={t("settings.timezoneHint")} autoCapitalize="none" autoCorrect={false} maxLength={64} />
      <Chips label={t("settings.accentColour")} value={draft.brandPrimary} options={COLOURS.map((c) => ({ value: c.value, label: t(c.nameKey) }))} onChange={set("brandPrimary")} />
      <Text variant="xs" tone="subtle">
        {`${t("settings.accentPrefix")} ${t("settings.roleColours")} ${t("settings.accentSuffix")}`}
      </Text>
      {dirty && !save.isPending ? (
        <Text variant="xs" tone="warn" bold>
          {t("settings.unsaved")}
        </Text>
      ) : null}
      <Button label={t("common.save")} busy={save.isPending} disabled={!dirty} onPress={submit} />
    </Card>
  );
}
