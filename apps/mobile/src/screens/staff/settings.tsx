import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminSettingsSchema, okSchema, type AdminSettings as AdminSettingsData } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill } from "../family/shared";
import { Chips, Notice, openWeb } from "./shared";

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

/**
 * School settings — the web's /admin/settings: the details every invitation
 * and directory entry carries, saved from the phone; the logo, the directory
 * profile and the notification housekeeping open on the web, where the
 * cropper and the publish switch live.
 */
export function AdminSettings() {
  const t = useT();
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
          <Card title={t("settings.logo")}>
            <Text variant="xs" tone="subtle">
              {t("settings.logoBody")}
            </Text>
            <Text variant="sm" tone="muted">
              {d.school.logoPath ? t("settings.currentLogo") : t("settings.noLogoYet")}
            </Text>
            <Button label={t("settings.chooseImage")} variant="secondary" onPress={() => openWeb("/admin/settings")} />
          </Card>
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
            <Button label={d.directory.published ? t("explore.unpublishCta") : t("explore.publishCta")} variant="secondary" onPress={() => openWeb("/admin/settings#directory")} />
          </Card>
          <Card title={t("notif.tidyTitle")}>
            <Text variant="sm" tone="muted">
              {t("notif.housekeeping", { read: d.school.notifAutoReadDays ?? d.notifDefaults.autoReadDays, expire: d.school.notifExpireDays ?? d.notifDefaults.expireDays })}
            </Text>
            <Button label={t("common.edit")} variant="secondary" onPress={() => openWeb("/admin/settings")} />
          </Card>
        </>
      ) : null}
    </Screen>
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
