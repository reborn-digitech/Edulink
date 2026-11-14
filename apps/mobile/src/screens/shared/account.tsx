import { useEffect, useRef, useState } from "react";
import { SwitchRow } from "@/components/switch-row";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import type { z } from "zod";
import { accountEmailCodeSentSchema, accountMobileCodeSentSchema, accountOverviewSchema, accountSignedOutSchema, sessionsListSchema, type AccountOverview } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { Avatar } from "@/components/avatar";
import { LanguageRow } from "@/components/language-row";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { isThemeChoice, useTheme, useThemeChoice, type ThemeChoice } from "@/lib/theme";
import { Confirm, Note, Pill, relativeTime, Tabs } from "../family/shared";
import { TwoStepCard } from "./two-step-card";
import { PlanCard } from "./plan-card"; // plans-pay (17 Oct 2026)

type Tab = "profile" | "prefs" | "devices";
type Sessions = z.infer<typeof sessionsListSchema>;
/** A time on the 24-hour clock, 0:00 to 23:59, as the contract's clockHHMM (TA-329): 24:00 and 25:99 are refused here. */
const HHMM = /^([01]?\d|2[0-3]):[0-5]\d$/;

/**
 * "Chrome on Android" from a browser's user agent — the web's describeDevice,
 * coarse on purpose. A phone signs in naming itself ("Asha's phone"), and that
 * name is already the answer to "is that device mine?", so it is shown as is.
 */
export function describeDevice(device: string | null): string | null {
  if (!device) return null;
  const ua = device.toLowerCase();
  if (!ua.includes("mozilla/") && !ua.includes("applewebkit")) return device;
  const os = ua.includes("android") ? "Android" : ua.includes("iphone") ? "iPhone" : ua.includes("ipad") ? "iPad" : ua.includes("mac os") ? "Mac" : ua.includes("windows") ? "Windows" : ua.includes("linux") ? "Linux" : "Unknown";
  const browser = ua.includes("edg/") ? "Edge" : ua.includes("firefox") ? "Firefox" : ua.includes("chrome") || ua.includes("crios") ? "Chrome" : ua.includes("safari") ? "Safari" : "Browser";
  return `${browser} on ${os}`;
}

/**
 * Your account — the web's /account, for every role: who you are and how you
 * sign in (email and mobile, each confirmed by a code sent to it before
 * anything changes), your notification preferences and language, and the
 * devices signed in as you, any of which you can sign out. No password here:
 * changing one is the web's reset flow, which proves the person first.
 */
export function Account() {
  const t = useT();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");
  const overview = useQuery({
    queryKey: ["account"],
    queryFn: async () => accountOverviewSchema.parse(unwrap(await api().get("/api/v1/account"))),
  });
  const sessions = useQuery({
    queryKey: ["account", "sessions"],
    queryFn: async () => sessionsListSchema.parse(unwrap(await api().get("/api/v1/me/sessions"))),
  });
  const d = overview.data;
  const refresh = () => {
    void overview.refetch();
    void sessions.refetch();
  };
  return (
    <Screen title={t("account.title")} refreshing={overview.isRefetching || sessions.isRefetching} onRefresh={refresh}>
      {overview.isPending ? <Loading /> : null}
      {overview.isError ? <Failed message={overview.error.message} onRetry={() => void overview.refetch()} /> : null}
      {d ? (
        <>
          <Header overview={d} onChangeLook={() => router.push("/(app)/avatar" as never)} />
          <Tabs
            label={t("nav.account")}
            current={tab}
            onChange={setTab}
            tabs={[
              { key: "profile", label: t("account.tabProfile") },
              { key: "prefs", label: t("account.tabPrefs") },
              { key: "devices", label: t("account.tabDevices"), count: sessions.data?.sessions.length },
            ]}
          />
          {tab === "profile" ? <ProfileTab overview={d} /> : null}
          {/* Keyed on the server's copy, so a save (or a pull) starts the form again from what is stored. */}
          {tab === "prefs" ? <PrefsTab key={JSON.stringify(d.prefs)} overview={d} /> : null}
          {tab === "devices" ? <DevicesTab query={sessions} /> : null}
        </>
      ) : null}
    </Screen>
  );
}

function Header({ overview, onChangeLook }: { overview: AccountOverview; onChangeLook: () => void }) {
  const t = useT();
  const th = useTheme();
  // A self-joined pupil's handle is a login name, never shown as an email.
  const line = overview.loginName ? `${t("account.loginName")} ${overview.loginName}` : (overview.email ?? t("account.noEmail"));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[3] }}>
      <Avatar avatarKey={overview.avatarKey} name={overview.name} size={64} />
      <View style={{ flex: 1, gap: th.space[1] }}>
        <Text variant="xl" bold>
          {overview.preferredName ?? overview.name}
        </Text>
        <Text variant="sm" tone="muted">
          {line}
        </Text>
        <Button label={t("student.changeMyLook")} variant="secondary" onPress={onChangeLook} />
      </View>
    </View>
  );
}

function ProfileTab({ overview }: { overview: AccountOverview }) {
  const t = useT();
  const th = useTheme();
  return (
    <>
      <Card title={t("nav.profile")}>
        <Row title={t("student.fullName")} caption={t("student.nameHint")} right={<Text variant="sm" bold>{overview.name}</Text>} />
        {overview.preferredName ? <Row title={t("student.callYou")} right={<Text variant="sm" bold>{overview.preferredName}</Text>} /> : null}
      </Card>
      <Card title={t("account.signInTitle")}>
        <Text variant="xs" tone="muted">
          {t("account.signInDescription")}
        </Text>
        <EmailSection overview={overview} />
        <View style={{ height: 1, backgroundColor: th.border }} />
        <MobileSection overview={overview} />
      </Card>
      {/* plans-pay (17 Oct 2026): the plans held, and the web's Plans page to buy one. */}
      <PlanCard />
      {/* Two-step sign-in: the card draws itself for the office, the head and the operator alone. */}
      <TwoStepCard />
    </>
  );
}

/** A confirmed / not-confirmed flag beside an address or a number. */
function Flag({ confirmed }: { confirmed: boolean }) {
  const t = useT();
  return <Pill tone={confirmed ? "ok" : "warn"} label={confirmed ? t("account.confirmedFlag") : t("account.notConfirmedFlag")} />;
}

/**
 * The email address, in the web's two steps: the address is a claim, the code
 * that comes back to it is the proof, and nothing changes in between. There
 * is no "remove": the address is the login key, so it is replaced, never cleared.
 */
function EmailSection({ overview }: { overview: AccountOverview }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const session = useSession();
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  // The current password, once per change: a session is not proof of the
  // person, and the address is where reset codes go.
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/email/code", { email: value.trim(), password });
      if (!result.ok) throw new Error(result.issues?.password ?? result.issues?.email ?? errorText(result, t("account.didNotSend")));
      return accountEmailCodeSentSchema.parse(result.data);
    },
    onSuccess: (data) => {
      setError(null);
      setSentTo(data.sentTo);
      setStep("code");
    },
    onError: (e) => setError(e.message),
  });
  const confirm = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/email/confirm", { code: code.trim() });
      if (!result.ok) throw new Error(result.issues?.code ?? errorText(result, t("account.didNotWork")));
    },
    onSuccess: async () => {
      toast.show(t("account.emailConfirmedTitle"));
      setStep("idle");
      setValue("");
      setCode("");
      setPassword("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["account"] });
      // The address is on the person, and the shell shows it.
      await session.refresh();
    },
    onError: (e) => setError(e.message),
  });

  if (step === "code") {
    return (
      <View style={{ gap: th.space[3] }}>
        <Note tone="accent">
          <Text variant="sm">{t("account.emailCodeSent", { email: sentTo })}</Text>
          <Text variant="xs" tone="muted">
            {t("account.unchangedUntilCode")}
          </Text>
        </Note>
        <Field label={t("account.theCode")} value={code} onChangeText={(next) => { setCode(next); setError(null); }} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" placeholder="000000" maxLength={12} error={error} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("common.confirm")} busy={confirm.isPending} disabled={code.trim().length < 4} onPress={() => confirm.mutate()} />
          <Button label={t("common.cancel")} variant="secondary" disabled={confirm.isPending} onPress={() => { setStep("idle"); setCode(""); setError(null); }} />
        </View>
      </View>
    );
  }
  return (
    <View style={{ gap: th.space[3] }}>
      {overview.loginName && !overview.email ? (
        <Note tone="accent">
          <Text variant="sm" bold>
            {t("account.signInWithLoginName", { name: overview.loginName })}
          </Text>
          <Text variant="xs" tone="muted">
            {t("account.addEmailExplainer")}
          </Text>
        </Note>
      ) : overview.email ? (
        <Row title={overview.email} right={<Flag confirmed={overview.emailConfirmed} />} />
      ) : null}
      <Field
        label={t("account.emailAddress")}
        value={value}
        onChangeText={(next) => { setValue(next); setError(null); }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={320}
        hint={value.trim() ? t("account.emailHintNamed", { email: value.trim().toLowerCase() }) : t("account.emailHintEmpty")}
        error={error}
      />
      <Field
        label={t("account.currentPassword")}
        value={password}
        onChangeText={(next) => { setPassword(next); setError(null); }}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        hint={t("account.currentPasswordHint")}
      />
      <Button label={t("account.emailMeCode")} busy={send.isPending} disabled={!value.trim() || !password} onPress={() => send.mutate()} />
      <Text variant="xs" tone="subtle">
        {t("account.nothingChangesUntilCode")}
      </Text>
    </View>
  );
}

/** The mobile number, in the same two steps; taking it off needs no code, only meaning it. */
function MobileSection({ overview }: { overview: AccountOverview }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [hint, setHint] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const send = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/mobile/code", { phone: value.trim(), password });
      if (!result.ok) throw new Error(result.issues?.password ?? result.issues?.phone ?? errorText(result, t("account.didNotSend")));
      return accountMobileCodeSentSchema.parse(result.data);
    },
    onSuccess: (data) => {
      setError(null);
      setHint(data.hint ?? "");
      setStep("code");
    },
    onError: (e) => setError(e.message),
  });
  const confirm = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/mobile/confirm", { code: code.trim() });
      if (!result.ok) throw new Error(result.issues?.code ?? errorText(result, t("account.didNotWork")));
    },
    onSuccess: async () => {
      toast.show(t("account.mobileConfirmedTitle"));
      setStep("idle");
      setValue("");
      setCode("");
      setPassword("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e) => setError(e.message),
  });
  const remove = useMutation({
    mutationFn: async () => {
      const result = await api().request("DELETE", "/api/v1/account/mobile", { confirm: true });
      if (!result.ok) throw new Error(errorText(result, t("account.didNotWork")));
    },
    onSuccess: async () => {
      setRemoving(false);
      toast.show(t("account.mobileRemoved"));
      await qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e) => {
      setRemoving(false);
      toast.show(e.message, "danger");
    },
  });

  if (step === "code") {
    return (
      <View style={{ gap: th.space[3] }}>
        <Note tone="accent">
          <Text variant="sm">{t("account.mobileCodeSent", { digits: hint })}</Text>
          <Text variant="xs" tone="muted">
            {t("account.unchangedUntilCode")}
          </Text>
        </Note>
        <Field label={t("account.theCode")} value={code} onChangeText={(next) => { setCode(next); setError(null); }} keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" placeholder="000000" maxLength={12} error={error} />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("common.confirm")} busy={confirm.isPending} disabled={code.trim().length < 4} onPress={() => confirm.mutate()} />
          <Button label={t("common.cancel")} variant="secondary" disabled={confirm.isPending} onPress={() => { setStep("idle"); setCode(""); setError(null); }} />
        </View>
      </View>
    );
  }
  return (
    <View style={{ gap: th.space[3] }}>
      {overview.phone ? (
        <>
          <Row
            title={overview.phone}
            caption={overview.phoneConfirmed ? t("account.confirmedFlag") : t("account.notConfirmedFlag")}
            right={removing ? null : <Button label={t("common.remove")} variant="ghost" accessibilityLabel={`${t("common.remove")}: ${overview.phone}`} onPress={() => setRemoving(true)} />}
          />
          {removing ? <Confirm question={t("account.removeMobileConfirm")} confirmLabel={t("common.remove")} busy={remove.isPending} onConfirm={() => remove.mutate()} onCancel={() => setRemoving(false)} /> : null}
        </>
      ) : null}
      <Field
        label={t("account.mobileNumber")}
        value={value}
        onChangeText={(next) => { setValue(next); setError(null); }}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        placeholder="98765 43210"
        maxLength={40}
        hint={value.trim() ? t("account.mobileHintNamed", { phone: value.trim() }) : t("account.mobileHintEmpty")}
        error={error}
      />
      <Field
        label={t("account.currentPassword")}
        value={password}
        onChangeText={(next) => { setPassword(next); setError(null); }}
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        hint={t("account.currentPasswordHint")}
      />
      <Button label={t("account.textMeCode")} busy={send.isPending} disabled={!value.trim() || !password} onPress={() => send.mutate()} />
      <Text variant="xs" tone="subtle">
        {t("account.nothingSavedUntilCode")}
      </Text>
    </View>
  );
}

/** A labelled on/off switch with a line under the label. */
/** The shared on/off row (components/switch-row.tsx); exported here as before for this screen's callers. */
export { SwitchRow };

/** Notifications (push, email, the school's texts by SMS and WhatsApp, quiet hours) and the language — the web's preferences tab without appearance, which the phone takes from the phone. */
function PrefsTab({ overview }: { overview: AccountOverview }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const server = overview.prefs;
  const [push, setPush] = useState(server.channels.push);
  const [email, setEmail] = useState(server.channels.email);
  const [sms, setSms] = useState(server.channels.sms ?? true);
  const [whatsapp, setWhatsapp] = useState(server.channels.whatsapp ?? true);
  const [quiet, setQuiet] = useState(server.quietHours !== null);
  const [start, setStart] = useState(server.quietHours?.start ?? "21:00");
  const [end, setEnd] = useState(server.quietHours?.end ?? "07:00");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = push !== server.channels.push || email !== server.channels.email || sms !== (server.channels.sms ?? true) || whatsapp !== (server.channels.whatsapp ?? true) || quiet !== (server.quietHours !== null) || (quiet && (start !== server.quietHours?.start || end !== server.quietHours?.end));
  const save = useMutation({
    mutationFn: async (body: { channels: { push: boolean; email: boolean; sms: boolean; whatsapp: boolean }; quietHours: { start: string; end: string } | null }) => api().post("/api/v1/account/prefs", body),
    onSuccess: (result) => {
      if (!result.ok) {
        const issues = result.issues ?? {};
        const next: Record<string, string> = {};
        if (issues["quietHours.start"]) next.start = issues["quietHours.start"];
        if (issues["quietHours.end"]) next.end = issues["quietHours.end"];
        setErrors(next);
        if (Object.keys(next).length === 0) toast.show(errorText(result, t("prefs.notSaved")), "danger");
        return;
      }
      setErrors({});
      toast.show(t("prefs.saved"));
      void qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const submit = () => {
    const next: Record<string, string> = {};
    if (quiet && !HHMM.test(start.trim())) next.start = t("refusal.useHHMM");
    if (quiet && !HHMM.test(end.trim())) next.end = t("refusal.useHHMM");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    save.mutate({ channels: { push, email, sms, whatsapp }, quietHours: quiet ? { start: start.trim(), end: end.trim() } : null });
  };
  return (
    <>
      <Card title={t("account.notificationsTitle")}>
        <Text variant="xs" tone="muted">
          {t("account.notificationsDescription")}
        </Text>
        <SwitchRow label={t("prefs.push")} hint={t("prefs.pushHint")} value={push} onChange={setPush} />
        <SwitchRow label={t("prefs.email")} hint={t("prefs.emailHint")} value={email} onChange={setEmail} />
        <SwitchRow label={t("prefs.sms")} hint={t("prefs.smsHint")} value={sms} onChange={setSms} />
        <SwitchRow label={t("prefs.whatsapp")} hint={t("prefs.whatsappHint")} value={whatsapp} onChange={setWhatsapp} />
        <View style={{ height: 1, backgroundColor: th.border }} />
        <Text variant="base" bold>
          {t("prefs.quietHours")}
        </Text>
        <Text variant="xs" tone="muted">
          {t("prefs.quietHoursHint")}
        </Text>
        <SwitchRow label={t("prefs.useQuietHours")} value={quiet} onChange={setQuiet} />
        {quiet ? (
          <>
            <View style={{ flexDirection: "row", gap: th.space[3] }}>
              <View style={{ flex: 1 }}>
                <Field label={t("prefs.from")} value={start} onChangeText={setStart} placeholder="21:00" keyboardType="numbers-and-punctuation" maxLength={5} error={errors.start} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t("prefs.until")} value={end} onChangeText={setEnd} placeholder="07:00" keyboardType="numbers-and-punctuation" maxLength={5} error={errors.end} />
              </View>
            </View>
            <Text variant="xs" tone="subtle">
              {t("prefs.quietHoursMidnight")}
            </Text>
          </>
        ) : null}
        <Button label={t("prefs.saveNotifications")} busy={save.isPending} disabled={!dirty} onPress={submit} />
      </Card>
      <AppearanceCard overview={overview} />
      <LanguageCard />
    </>
  );
}

/**
 * Light, dark or the phone's own: the web's colour scheme, on the phone
 * since 2026-10-01. The choice is the device's at once, and sent to the
 * account (prefs.theme, beside the channels the prefs door needs) so the
 * web follows; the account's own choice, read here, is taken once.
 */
const THEMES: ThemeChoice[] = ["system", "light", "dark"];

function AppearanceCard({ overview }: { overview: AccountOverview }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { choice, setChoice } = useThemeChoice();
  const adopted = useRef(false);
  useEffect(() => {
    if (adopted.current) return;
    adopted.current = true;
    if (isThemeChoice(overview.prefs.theme) && overview.prefs.theme !== choice) setChoice(overview.prefs.theme);
    // The account's choice is read once, when the card first draws.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { mutate: persist, isPending } = useMutation({
    mutationFn: async (theme: ThemeChoice) => {
      const result = await api().post("/api/v1/account/prefs", { channels: overview.prefs.channels, quietHours: overview.prefs.quietHours, theme });
      if (!result.ok) throw new Error(errorText(result, t("prefs.notSaved")));
    },
    onSuccess: () => {
      toast.show(t("prefs.saved"));
      void qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const label = { system: t("prefs.system"), light: t("prefs.light"), dark: t("prefs.dark") };
  return (
    <Card title={t("prefs.colourScheme")}>
      <Text variant="xs" tone="muted">
        {t("prefs.colourSchemeHint")}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={t("prefs.colourScheme")} style={{ flexDirection: "row", gap: th.space[1], backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[1] }}>
        {THEMES.map((option) => {
          const on = option === choice;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: isPending }}
              aria-checked={on}
              accessibilityLabel={label[option]}
              disabled={isPending}
              onPress={() => {
                if (on) return;
                setChoice(option);
                persist(option);
              }}
              style={{ flex: 1, minHeight: th.tap, alignItems: "center", justifyContent: "center", borderRadius: th.radius.sm, backgroundColor: on ? th.surface : undefined }}
            >
              <Text variant="sm" bold={on} tone={on ? "fg" : "muted"}>
                {label[option]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

/**
 * The language, saved to the account as well as the phone: `prefs.locale` is
 * the one the web and Practice read, so a child who switches the app to मराठी
 * gets Marathi questions too. Only a change made here is sent.
 */
function LanguageCard() {
  const t = useT();
  const qc = useQueryClient();
  const toast = useToast();
  const { locale } = useLocale();
  const shown = useRef(locale);
  const { mutate: persist } = useMutation({
    mutationFn: async (next: string) => {
      const result = await api().post("/api/v1/account/locale", { locale: next });
      if (!result.ok) throw new Error(errorText(result, t("prefs.notSaved")));
    },
    onSuccess: () => {
      toast.show(t("prefs.saved"));
      void qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  useEffect(() => {
    if (locale === shown.current) return;
    shown.current = locale;
    persist(locale);
  }, [locale, persist]);
  return (
    <Card title={t("language.title")}>
      <Text variant="xs" tone="muted">
        {t("language.description")}
      </Text>
      <LanguageRow />
    </Card>
  );
}

/** Every device signed in as this person; each other one can be signed out, or all of them at once. */
function DevicesTab({ query }: { query: UseQueryResult<Sessions> }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const session = useSession();
  const { locale } = useLocale();
  // The row being asked about: a session id, or "others" for everywhere else.
  const [asking, setAsking] = useState<string | null>(null);
  const done = () => {
    setAsking(null);
    void qc.invalidateQueries({ queryKey: ["account", "sessions"] });
  };
  const signOutOne = useMutation({
    mutationFn: async (sessionId: string) => {
      const result = await api().post("/api/v1/account/devices/sign-out", { sessionId });
      if (!result.ok) throw new Error(errorText(result, t("account.couldNotSignOut")));
    },
    onSuccess: () => {
      toast.show(t("account.deviceSignedOut"));
      done();
    },
    onError: (e) => {
      toast.show(e.message, "danger");
      done();
    },
  });
  const signOutOthers = useMutation({
    mutationFn: async () => accountSignedOutSchema.parse(unwrap(await api().post("/api/v1/account/devices/sign-out-others", { confirm: true }))),
    onSuccess: (data) => {
      toast.show(data.count === 1 ? t("account.devicesOutOne") : t("account.devicesOutMany", { count: data.count }));
      done();
    },
    onError: (e) => {
      toast.show(e.message, "danger");
      setAsking(null);
    },
  });
  const rows = query.data?.sessions ?? [];
  const others = rows.filter((s) => !s.current);
  return (
    <>
      <Card title={t("account.devicesTitle")}>
        {query.isPending ? <Loading /> : null}
        {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
        {query.data ? (
          <Text variant="xs" tone="muted">
            {t("account.devicesCount", { count: rows.length })}
          </Text>
        ) : null}
        {rows.map((s) => {
          const label = describeDevice(s.device) ?? t("account.unknownDevice");
          const meta = t("account.deviceMeta", { lastSeen: relativeTime(s.lastSeenAt, locale), since: relativeTime(s.createdAt, locale) });
          return (
            <View key={s.id} style={{ gap: th.space[2] }}>
              <Row
                title={label}
                caption={meta}
                right={s.current ? <Pill tone="ok" label={t("account.thisDevice")} /> : asking === s.id ? null : <Button label={t("shell.signOut")} variant="ghost" accessibilityLabel={`${t("shell.signOut")}: ${label}`} onPress={() => setAsking(s.id)} />}
              />
              {asking === s.id ? <Confirm question={t("account.signOutDeviceConfirm", { device: label })} confirmLabel={t("common.confirm")} busy={signOutOne.isPending} onConfirm={() => signOutOne.mutate(s.id)} onCancel={() => setAsking(null)} /> : null}
            </View>
          );
        })}
        {others.length > 0 ? (
          asking === "others" ? (
            <Confirm question={t("account.signOutOthersConfirm")} confirmLabel={t("account.signOutEverywhereElse")} busy={signOutOthers.isPending} onConfirm={() => signOutOthers.mutate()} onCancel={() => setAsking(null)} />
          ) : (
            <Button label={t("account.signOutEverywhereElse")} variant="secondary" onPress={() => setAsking("others")} />
          )
        ) : null}
      </Card>
      <Button label={t("shell.signOut")} variant="danger" onPress={() => void session.signOut()} />
    </>
  );
}
