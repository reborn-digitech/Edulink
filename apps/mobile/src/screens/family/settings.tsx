import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familySettingsSchema, familyUnlinkedSchema, okSchema, type FamilyChild } from "@edulink/contracts";
import type { z } from "zod";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, SwitchRow, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { bytesApi, shareBytes } from "@/lib/download";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Note, Pill } from "./shared";
import { must, Refusal } from "../staff/shared";
import { FamilyAssistantCard } from "../shared/assistant";

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
          <Empty title={t("parent.linkToYourChild")} body={t("parent.linkNeedCode")} action={<Button label={t("parent.linkToMyChild")} onPress={() => router.push("/(app)/link-child" as never)} />} />
        ) : (
          <>
            <NotificationsForm key={`${d.channels.push}:${d.channels.email}:${d.channels.sms ?? true}:${d.channels.whatsapp ?? true}:${d.quietHours?.start ?? ""}:${d.quietHours?.end ?? ""}`} initial={d} />
            <Card title={t("parent.whoYouHearAbout")} action={<Button label={t("parent.linkAnotherShort")} variant="secondary" onPress={() => router.push("/(app)/link-child" as never)} />}>
              <Text variant="xs" tone="muted">
                {d.children.length === 1 ? t("parent.oneChildLinked") : t("parent.childrenLinked", { count: d.children.length })}
              </Text>
              {d.children.map((child) => (
                <ChildRow key={child.guardianshipId} child={child} />
              ))}
              <Text variant="xs" tone="muted">
                {t("parent.settingsApplyAll")}
              </Text>
            </Card>
            {/* The assistant, per child (Phase C, 10 Oct 2026): the web's card on /parent/settings. */}
            <FamilyAssistantCard />
            <MyDataCard body={t("exports.childDataBody")} items={d.children.map((child) => ({ id: child.studentMembershipId, label: t("exports.downloadFor", { name: child.name }), path: `/api/v1/family/export?student=${encodeURIComponent(child.studentMembershipId)}`, fileName: `relay-export-${child.name}.json` }))} />
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

/** The web's AppearanceForm, notifications section: four channels (push, email, and the texts — SMS and WhatsApp — the school may send, on unless the guardian says otherwise), quiet hours, one save. Remounted (by key) when the server's copy changes. */
function NotificationsForm({ initial }: { initial: Settings }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [push, setPush] = useState(initial.channels.push);
  const [email, setEmail] = useState(initial.channels.email);
  const [sms, setSms] = useState(initial.channels.sms ?? true);
  const [whatsapp, setWhatsapp] = useState(initial.channels.whatsapp ?? true);
  const [quiet, setQuiet] = useState(initial.quietHours !== null);
  const [start, setStart] = useState(initial.quietHours?.start ?? "21:00");
  const [end, setEnd] = useState(initial.quietHours?.end ?? "07:00");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startBad = quiet && !HHMM.test(start.trim());
  const endBad = quiet && !HHMM.test(end.trim());
  const save = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/family/settings", { channels: { push, email, sms, whatsapp }, quietHours: quiet ? { start: start.trim(), end: end.trim() } : null });
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
  const toggle = (label: string, hint: string, value: boolean, onChange: (next: boolean) => void) => <SwitchRow label={label} hint={hint} value={value} onChange={onChange} />;
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
      {toggle(t("prefs.sms"), t("prefs.smsHint"), sms, (next) => { setSms(next); setSaved(false); })}
      {toggle(t("prefs.whatsapp"), t("prefs.whatsappHint"), whatsapp, (next) => { setWhatsapp(next); setSaved(false); })}
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

/**
 * The family's own data (DPDP s.11): one JSON document per person, fetched
 * as bytes and handed to the share sheet, the way a report card is. A
 * guardian has a button per child, because the file is one person's.
 */
export function MyDataCard({ body, items }: { body: string; items: { id: string; label: string; path: string; fileName: string }[] }) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const download = async (one: { id: string; path: string; fileName: string }) => {
    setBusy(one.id);
    const fallback = t("exports.notReady");
    const got = await bytesApi.get(one.path, fallback);
    const error = got.ok ? await shareBytes({ bytes: got.bytes, mime: "application/json" }, one.fileName, fallback) : got.error;
    setBusy(null);
    if (error) toast.show(error, "danger");
  };
  return (
    <Card title={t("exports.myDataTitle")}>
      <Text variant="xs" tone="muted">
        {body}
      </Text>
      {items.map((one) => (
        <Button key={one.id} label={one.label} variant="secondary" busy={busy === one.id} onPress={() => void download(one)} />
      ))}
      <Text variant="xs" tone="muted">
        {t("exports.fewPerHour")}
      </Text>
    </Card>
  );
}

/**
 * One linked child, with "Remove" on a family link (the school's stand-in
 * link is the school's to end). The confirmation is the child's name typed
 * back, as on the web: a guardianship is not a setting to flip by accident.
 * With no child left the link page is where the guardian goes.
 */
function ChildRow({ child }: { child: FamilyChild }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const matches = typed.trim().localeCompare(child.name.trim(), undefined, { sensitivity: "base" }) === 0;
  const unlink = useMutation({
    mutationFn: async () => familyUnlinkedSchema.parse(must(await api().request("DELETE", `/api/v1/family/children/${child.studentMembershipId}/link`, { confirm: true }), t("common.somethingWrong"))),
    onSuccess: (r) => {
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["family"] });
      if (r.remaining === 0) router.replace("/(app)/link-child" as never);
    },
    onError: (e) => setError(e instanceof Refusal ? e.message : t("common.somethingWrong")),
  });
  return (
    <View style={{ gap: th.space[2] }}>
      <Row
        title={child.name}
        caption={child.schoolName}
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
            <Pill tone="accent" label={t("parent.linked")} />
            {child.relation !== "SCHOOL" && !open ? <Button label={t("common.remove")} variant="ghost" onPress={() => setOpen(true)} accessibilityLabel={`${t("common.remove")}: ${child.name}`} /> : null}
          </View>
        }
      />
      {open ? (
        <Note tone="danger">
          <Text variant="sm" bold>
            {t("familyCare.unlinkTitle")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("familyCare.unlinkBody", { name: child.name })}
          </Text>
          <Field label={t("familyCare.unlinkTypeNameShort", { name: child.name })} value={typed} onChangeText={(next) => { setTyped(next); setError(null); }} error={error} autoCapitalize="none" />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("familyCare.unlinkButton", { name: child.name })} variant="danger" busy={unlink.isPending} disabled={!matches} onPress={() => unlink.mutate()} />
            <Button label={t("common.cancel")} variant="secondary" disabled={unlink.isPending} onPress={() => { setOpen(false); setTyped(""); setError(null); }} />
          </View>
        </Note>
      ) : null}
    </View>
  );
}
