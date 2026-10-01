import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagingOkSchema, messagingOverviewSchema, messagingTestResultSchema, type MessagingOverview } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatInstant, Pill } from "../family/shared";
import { audienceLabel, channelLabel, messageCaption, purposeLabel, skipLabel, STATUS_TONE, statusLabel, transportLabel } from "../shared/messaging";
import { must, openWeb } from "./shared";

type SettingsSave = { smsEnabled?: boolean; whatsappEnabled?: boolean; monthlyCap?: number; events?: Partial<MessagingOverview["settings"]["events"]>; textOfficePhones?: boolean };
const EVENTS = ["absence", "feeReminders", "feeReceipts", "circulars", "incidents"] as const;
const EVENT_KEY = { absence: "messaging.eventAbsence", feeReminders: "messaging.eventFeeReminders", feeReceipts: "messaging.eventFeeReceipts", circulars: "messaging.eventCirculars", incidents: "messaging.eventIncidents" } as const;

/**
 * Texts & WhatsApp — the web's /admin/messaging: what the school sent its
 * families this month and how far it got, the two channels and the four
 * automatic texts as switches (the office's; the head reads them), what
 * the server has a sender for, a test to the office's own number, the
 * notices sent with a door to each one's report and to a new one, the
 * recent automatic texts with the reason each stopped where it did, and
 * whether each template has its registered ids. The texts themselves and
 * the registration forms stay on the web.
 */
export function StaffMessaging() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const office = role === "ADMIN";
  const query = useQuery({
    queryKey: ["messaging", "overview"],
    queryFn: async () => messagingOverviewSchema.parse(unwrap(await api().get("/api/v1/messaging/overview"))),
  });
  const save = useMutation({
    mutationFn: async (body: SettingsSave) => messagingOkSchema.parse(must(await api().post("/api/v1/messaging/settings", body), t("common.somethingWrong"))),
    onSuccess: () => {
      toast.show(t("messaging.settingsSaved"));
      void qc.invalidateQueries({ queryKey: ["messaging"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const test = useMutation({
    mutationFn: async () => messagingTestResultSchema.parse(must(await api().post("/api/v1/messaging/test", {}), t("common.somethingWrong"))),
    onSuccess: (r) => {
      if (r.skipReason || r.status === "SKIPPED") toast.show(t("messaging.testSkipped", { reason: r.skipReason ? skipLabel(t, r.skipReason) : statusLabel(t, r.status) }), "info");
      else toast.show(t("messaging.testSent", { channel: r.channel ? channelLabel(t, r.channel) : "—" }));
      void qc.invalidateQueries({ queryKey: ["messaging"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const d = query.data;
  const problems = d?.transports.problems ?? [];
  /** The doors an empty list offers: the office writes a notice; the automatic texts' history, and everything for the head, is the same page on the web. */
  const newNotice = <Button label={t("messaging.broadcastNew")} variant="secondary" onPress={() => router.push("/(app)/messaging-new" as never)} />;
  const web = <Button label={`${t("messaging.title")} · ${t("messaging.phoneOpensWeb")}`} variant="secondary" onPress={() => openWeb("/admin/messaging")} />;
  return (
    <Screen title={t("messaging.title")} description={t("messaging.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("messaging.cardSentMonth")} value={d.month.sent} />
            <Stat label={t("messaging.cardDelivered")} value={d.month.delivered} tone="ok" />
            <Stat label={t("messaging.cardFailed")} value={d.month.failed} tone={d.month.failed > 0 ? "danger" : "fg"} />
            <Stat label={t("messaging.cardSkipped")} value={d.month.skipped} tone={d.month.skipped > 0 ? "warn" : "fg"} />
          </View>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={`${t("messaging.cardSegments")} · ${t("messaging.cardCap", { cap: d.month.cap })}`} value={d.month.segments} tone={d.month.cap > 0 && d.month.segments >= d.month.cap ? "danger" : "fg"} />
            <Stat label={`${t("messaging.cardParents")} · ${t("messaging.cardParentsOf", { total: d.parentsTotal })}`} value={d.parentsWithPhone} tone={d.parentsWithPhone < d.parentsTotal ? "warn" : "ok"} />
          </View>

          <Card title={t("messaging.settingsTitle")}>
            <Text variant="xs" tone="muted">
              {t("messaging.settingsIntro")}
            </Text>
            <SwitchRow label={t("messaging.smsToggle")} value={d.settings.smsEnabled} disabled={!office || save.isPending} onChange={(next) => save.mutate({ smsEnabled: next })} />
            <SwitchRow label={t("messaging.whatsappToggle")} value={d.settings.whatsappEnabled} disabled={!office || save.isPending} onChange={(next) => save.mutate({ whatsappEnabled: next })} />
            {office ? <CapField cap={d.settings.monthlyCap} busy={save.isPending} onSave={(cap) => save.mutate({ monthlyCap: cap })} /> : null}
            <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
              <Text variant="base" bold>
                {t("messaging.eventsTitle")}
              </Text>
              {EVENTS.map((event) => (
                <SwitchRow key={event} label={t(EVENT_KEY[event])} value={d.settings.events[event]} disabled={!office || save.isPending} onChange={(next) => save.mutate({ events: { [event]: next } })} />
              ))}
            </View>
            {/* The number the office typed: a wrong one on a record texts a stranger about the child, so the risk sits on the switch. */}
            <View style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
              <SwitchRow label={t("officeBulk.textOfficePhonesToggle")} hint={t("officeBulk.textOfficePhonesHint")} value={d.settings.textOfficePhones} disabled={!office || save.isPending} onChange={(next) => save.mutate({ textOfficePhones: next })} />
            </View>
          </Card>

          <Card title={t("messaging.transportTitle")}>
            <Row title={t("messaging.transportSms")} caption={transportLabel(t, d.transports.sms)} right={<TransportDot state={d.transports.sms} />} />
            <Row title={t("messaging.transportWhatsapp")} caption={transportLabel(t, d.transports.whatsapp)} right={<TransportDot state={d.transports.whatsapp} />} />
            {problems.length > 0 ? (
              <View style={{ gap: 2 }}>
                <Text variant="xs" tone="danger" bold>
                  {t("messaging.transportProblems")}
                </Text>
                {problems.map((p) => (
                  <Text key={p} variant="xs" tone="danger">
                    {p}
                  </Text>
                ))}
              </View>
            ) : null}
            {office ? (
              <>
                <Text variant="xs" tone="muted">
                  {t("messaging.testIntro")}
                </Text>
                <Button label={t("messaging.testGo")} variant="secondary" busy={test.isPending} onPress={() => test.mutate()} />
              </>
            ) : null}
          </Card>

          <Card title={t("messaging.broadcastsTitle")} action={office && d.recent.length > 0 ? newNotice : undefined}>
            <Text variant="xs" tone="muted">
              {t("messaging.broadcastsIntro")}
            </Text>
            {d.recent.length === 0 ? (
              <Empty title={t("messaging.broadcastsEmpty")} action={office ? newNotice : web} />
            ) : (
              d.recent.map((b) => (
                <Row
                  key={b.id}
                  icon="chats"
                  title={b.title}
                  caption={[audienceLabel(t, b.audience, d.classes), `${t("messaging.colSent")} ${b.sent}`, `${t("messaging.colDelivered")} ${b.delivered}`, b.failed > 0 ? `${t("messaging.colFailed")} ${b.failed}` : null, b.skipped > 0 ? `${t("messaging.colSkipped")} ${b.skipped}` : null, formatInstant(b.createdAt, locale)].filter(Boolean).join(" · ")}
                  right={<Pill label={statusLabel(t, b.status)} tone={STATUS_TONE[b.status.toUpperCase()] ?? "muted"} />}
                  onPress={() => router.push({ pathname: "/(app)/messaging-broadcast", params: { broadcastId: b.id } } as never)}
                />
              ))
            )}
          </Card>

          <Card title={t("messaging.recentTitle")}>
            {d.recentMessages.length === 0 ? (
              <Empty title={t("messaging.recentEmpty")} action={web} />
            ) : (
              d.recentMessages.map((m) => (
                <Row key={m.id} title={`${m.name ?? m.to} · ${purposeLabel(t, m.purpose)}`} caption={`${messageCaption(t, m)} · ${formatInstant(m.createdAt, locale)}`} right={<Pill label={statusLabel(t, m.status)} tone={STATUS_TONE[m.status.toUpperCase()] ?? "muted"} />} />
              ))
            )}
          </Card>

          <Card title={t("messaging.templatesTitle")}>
            {d.templates.map((tpl) => (
              <Row
                key={tpl.key}
                title={tpl.label}
                caption={[tpl.event ? t(EVENT_KEY[tpl.event]) : null, `${t("messaging.templateSmsIds")}: ${ids(tpl.smsIds) || t("messaging.templateNone")}`, `${t("messaging.templateWhatsappIds")}: ${ids(tpl.whatsappIds) || t("messaging.templateNone")}`].filter(Boolean).join(" · ")}
                right={Object.keys(tpl.smsIds).length === 0 && Object.keys(tpl.whatsappIds).length === 0 ? <Pill label={t("messaging.templateNone")} tone="warn" /> : undefined}
              />
            ))}
            <Text variant="xs" tone="subtle">
              {t("messaging.templatesCommand")}
            </Text>
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** A coloured dot beside the transport's state: green live, amber test mode, red none — the caption carries the words. */
function TransportDot({ state }: { state: string }) {
  const th = useTheme();
  const color = state === "twilio" ? th.ok : state === "devbox" ? th.warn : th.danger;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 12, height: 12, borderRadius: th.radius.xl, backgroundColor: color }} />;
}

/** "en, hi" — the languages a template has a registered id for. */
function ids(map: Record<string, string>): string {
  return Object.keys(map).sort().join(", ");
}

/** The monthly cap: a whole number, saved on its own button so a slip of the thumb on a digit is not a saved cap. */
function CapField({ cap, busy, onSave }: { cap: number; busy: boolean; onSave: (cap: number) => void }) {
  const t = useT();
  const th = useTheme();
  const [value, setValue] = useState(String(cap));
  const n = /^\d{1,7}$/.test(value.trim()) ? Number(value.trim()) : null;
  const bad = n === null || n > 1_000_000;
  return (
    <View style={{ flexDirection: "row", gap: th.space[3], alignItems: "flex-start" }}>
      <View style={{ flex: 1 }}>
        <Field label={t("messaging.monthlyCap")} value={value} onChangeText={setValue} hint={t("messaging.monthlyCapHint")} error={bad ? t("messaging.refuseCap") : null} keyboardType="number-pad" maxLength={7} />
      </View>
      <View style={{ paddingTop: th.space[5] }}>
        <Button label={t("common.save")} variant="secondary" busy={busy} disabled={bad || n === cap} onPress={() => (n === null ? undefined : onSave(n))} />
      </View>
    </View>
  );
}
