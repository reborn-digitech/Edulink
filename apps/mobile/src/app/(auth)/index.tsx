import { useEffect, useState } from "react";
import { Linking, View } from "react-native";
import { useRouter } from "expo-router";
import type { SessionResponse } from "@edulink/contracts";
import { Button, Field, Screen, Text, Wordmark } from "@/components";
import { api, API_BASE, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LanguageRow } from "@/components/language-row";
import { beginHandoff, handoffUrl } from "@/lib/sso-handoff";
import { isTwoFactor } from "@/lib/two-factor";
import { TwoFactorStep } from "@/screens/auth/two-factor-step";
import { ssoProviders } from "@/lib/version";

/**
 * Sign in: password first, the same identifier the web accepts (email, phone
 * or handle); a link to the email link, to SSO in the system browser (which
 * comes back by deep link) when the server has it configured, and to a
 * pupil's first sign-in. Refusals are the
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
  // The password was right and a code from the authenticator app is asked for next.
  const [challenge, setChallenge] = useState<string | null>(null);
  // "Continue with Google" only when the server can finish it: a store
  // reviewer pressing a button that ends in an error page fails the review.
  const [google, setGoogle] = useState(false);
  useEffect(() => {
    let alive = true;
    ssoProviders()
      .then((providers) => {
        if (alive) setGoogle(providers.includes("google"));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api().post<SessionResponse>("/api/v1/auth/login", { identifier: identifier.trim(), password, device: "Shalaghar app" });
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 429 && res.retryAfterSeconds ? `${res.error} (${res.retryAfterSeconds}s)` : errorText(res, t("login.noMatch")));
      return;
    }
    if (isTwoFactor(res.data)) {
      setChallenge(res.data.challenge);
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

  if (challenge) {
    return (
      <Screen title={t("login.title")}>
        <TwoFactorStep
          challenge={challenge}
          onBack={() => {
            setChallenge(null);
            setPassword("");
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen title={t("login.title")} description={t("login.welcome")}>
      <View style={{ alignItems: "center", paddingVertical: th.space[2] }}>
        <Wordmark height={44} testID="wordmark" />
      </View>
      <View style={{ gap: th.space[3] }}>
        <Field label={t("login.emailOrLoginName")} value={identifier} onChangeText={setIdentifier} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="username" autoComplete="username" />
        <Field label={t("login.password")} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="current-password" error={error} onSubmitEditing={submit} returnKeyType="go" />
        <Button label={t("login.submit")} onPress={submit} busy={busy} disabled={!identifier.trim() || !password} />
      </View>
      <View style={{ gap: th.space[2], marginTop: th.space[3] }}>
        <Button label={t("login.emailMeALink")} variant="secondary" onPress={() => router.push("/(auth)/magic-link")} />
        {google ? <Button label={t("login.ssoContinue", { provider: "Google" })} variant="secondary" onPress={() => void continueWith("google")} /> : null}
        <Button label={t("firstSignin.title")} variant="ghost" onPress={() => router.push("/(auth)/first-signin")} />
      </View>
      <LanguageRow />
      <Text variant="xs" tone="subtle" style={{ textAlign: "center", marginTop: th.space[4] }}>
        {API_BASE}
      </Text>
    </Screen>
  );
}
