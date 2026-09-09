import { useState } from "react";
import { Switch, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familySettingsSchema, okSchema } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Note, openWeb, Pill } from "./shared";

type Settings = z.infer<typeof familySettingsSchema>;
const HHMM = /^\d{1,2}:\d{2}$/;

/**
 * A guardian's settings — the web's /parent/settings: the channels they are
 * reached on and the hours they are left alone, then the children they hear
 * about. Appearance, devices and signing out stay on More, as on the web
 * they stay on /account: two pages writing the same preferences drift.
 */
export function ParentSettings() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const query = useQuery({
    queryKey: ["family", "settings"],
    enabled: role === "PARENT",
    queryFn: async () => familySettingsSchema.parse(unwrap(await api().get("/api/v1/family/settings"))),
  });
  const d = query.data;
  if (role !== null && role !== "PARENT") {
    return (
      <Screen title={t("parent.settings")}>
        <Empty title={t("parent.settings")} body={t("parent.accountBody")} action={<Button label={t("nav.more")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />} />
      </Screen>
    );
  }
  return (
    <Screen title={t("parent.settings")} description={t("parent.settingsBody")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.children.length === 0 ? (
          <Empty title={t("parent.linkToYourChild")} body={t("parent.linkNeedCode")} action={<Button label={t("parent.linkToMyChild")} onPress={() => openWeb("/parent/link")} />} />
        ) : (
          <>
            <NotificationsForm key={`${d.channels.push}:${d.channels.email}:${d.quietHours?.start ?? ""}:${d.quietHours?.end ?? ""}`} initial={d} />
            <Card title={t("parent.whoYouHearAbout")} action={<Button label={t("parent.linkAnotherShort")} variant="secondary" onPress={() => openWeb("/parent/link")} />}>
              <Text variant="xs" tone="muted">
                {d.children.length === 1 ? t("parent.oneChildLinked") : t("parent.childrenLinked", { count: d.children.length })}
              </Text>
              {d.children.map((child) => (
                <Row key={child.guardianshipId} title={child.name} caption={child.schoolName} right={<Pill tone="accent" label={t("parent.linked")} />} />
              ))}
              <Text variant="xs" tone="muted">
                {t("parent.settingsApplyAll")}
              </Text>
            </Card>
            <Card title={t("parent.yourAccount")} action={<Button label={t("parent.open")} variant="secondary" onPress={() => router.push("/(app)/more" as never)} />}>
              <Text variant="xs" tone="muted">
                {t("parent.accountBody")}
              </Text>
            </Card>
          </>
        )
      ) : null}
    </Screen>
  );
}

/** The web's AppearanceForm, notifications section: two channels, quiet hours, one save. Remounted (by key) when the server's copy changes. */
function NotificationsForm({ initial }: { initial: Settings }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [push, setPush] = useState(initial.channels.push);
  const [email, setEmail] = useState(initial.channels.email);
  const [quiet, setQuiet] = useState(initial.quietHours !== null);
  const [start, setStart] = useState(initial.quietHours?.start ?? "21:00");
  const [end, setEnd] = useState(initial.quietHours?.end ?? "07:00");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startBad = quiet && !HHMM.test(start.trim());
  const endBad = quiet && !HHMM.test(end.trim());
  const save = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/family/settings", { channels: { push, email }, quietHours: quiet ? { start: start.trim(), end: end.trim() } : null });
      if (!result.ok) throw new Error(errorText(result, t("prefs.notSaved")));
      return okSchema.parse(result.data);
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void qc.invalidateQueries({ queryKey: ["family", "settings"] });
    },
    onError: (e) => {
      setSaved(false);
      setError(e.message);
    },
  });
  const toggle = (label: string, hint: string, value: boolean, onChange: (next: boolean) => void) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3], minHeight: th.tap }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="base" bold>
          {label}
        </Text>
        <Text variant="xs" tone="muted">
          {hint}
        </Text>
      </View>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: th.accent, false: th.border }} thumbColor={th.surface} />
    </View>
  );
  return (
    <Card title={t("parent.notifications")}>
      <Text variant="xs" tone="muted">
        {t("parent.whatYouAreTold")}
      </Text>
      {error ? <Failed message={error} /> : null}
      {saved ? (
        <Note tone="ok">
          <Text variant="sm" bold tone="ok">
            {t("prefs.saved")}
          </Text>
        </Note>
      ) : null}
      {toggle(t("prefs.push"), t("prefs.pushHint"), push, (next) => { setPush(next); setSaved(false); })}
      {toggle(t("prefs.email"), t("prefs.emailHint"), email, (next) => { setEmail(next); setSaved(false); })}
      <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
        <Text variant="base" bold>
          {t("prefs.quietHours")}
        </Text>
        <Text variant="xs" tone="muted">
          {t("prefs.quietHoursHint")}
        </Text>
        {toggle(t("prefs.useQuietHours"), t("prefs.quietHoursMidnight"), quiet, (next) => { setQuiet(next); setSaved(false); })}
        {quiet ? (
          <View style={{ flexDirection: "row", gap: th.space[3] }}>
            <View style={{ flex: 1 }}>
              <Field label={t("prefs.from")} value={start} onChangeText={(next) => { setStart(next); setSaved(false); }} error={startBad ? t("refusal.useHHMM") : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label={t("prefs.until")} value={end} onChangeText={(next) => { setEnd(next); setSaved(false); }} error={endBad ? t("refusal.useHHMM") : null} keyboardType="numbers-and-punctuation" autoCapitalize="none" />
            </View>
          </View>
        ) : null}
      </View>
      <Button label={t("prefs.saveNotifications")} busy={save.isPending} disabled={startBad || endBad} onPress={() => save.mutate()} />
    </Card>
  );
}
