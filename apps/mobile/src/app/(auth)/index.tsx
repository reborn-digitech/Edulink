import { useState } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import type { SessionResponse } from "@edulink/contracts";
import { Button, Field, Screen, Text } from "@/components";
import { api, API_BASE, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LanguageRow } from "@/components/language-row";
import { beginHandoff, handoffUrl } from "@/lib/sso-handoff";

/**
 * Sign in: password first, the same identifier the web accepts (email, phone
 * or handle); a link to the email link, to SSO in the system browser (which
 * comes back by deep link), and to a pupil's first sign-in. Refusals are the
 * server's own sentence in the person's language; a rate limit shows its
 * countdown rather than a paragraph.
 */
export default function SignIn() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api().post<SessionResponse>("/api/v1/auth/login", { identifier: identifier.trim(), password, device: "Relay app" });
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 429 && res.retryAfterSeconds ? `${res.error} (${res.retryAfterSeconds}s)` : errorText(res, t("login.noMatch")));
      return;
    }
    await session.accept(res.data);
  }

  /** The verifier is made and kept before the browser opens; only its challenge goes with the link. */
  async function continueWith(provider: "google") {
    setError(null);
    try {
      await Linking.openURL(handoffUrl(API_BASE, provider, await beginHandoff()));
    } catch {
      setError(t("common.somethingWrong"));
    }
  }

  return (
    <Screen title={t("login.title")} description={t("login.welcome")}>
      <View style={{ gap: th.space[3] }}>
        <Field label={t("login.emailOrLoginName")} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="username" />
        <Field label={t("login.password")} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="current-password" error={error} onSubmitEditing={submit} returnKeyType="go" />
        <Button label={t("login.submit")} onPress={submit} busy={busy} disabled={!identifier.trim() || !password} />
      </View>
      <View style={{ gap: th.space[2], marginTop: th.space[3] }}>
        <Button label={t("login.emailMeALink")} variant="secondary" onPress={() => router.push("/(auth)/magic-link")} />
        <Button label={t("login.ssoContinue", { provider: "Google" })} variant="secondary" onPress={() => void continueWith("google")} />
        <Button label={t("firstSignin.title")} variant="ghost" onPress={() => router.push("/(auth)/first-signin")} />
      </View>
      <LanguageRow />
      <Text variant="xs" tone="subtle" style={{ textAlign: "center", marginTop: th.space[4] }}>
        {API_BASE}
      </Text>
    </Screen>
  );
}
