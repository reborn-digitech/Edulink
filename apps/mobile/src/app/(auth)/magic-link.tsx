import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { SessionResponse } from "@edulink/contracts";
import { Button, Field, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { isTwoFactor } from "@/lib/two-factor";

/** Email me a link; then paste (or deep-link) the token. */
export default function MagicLink() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function request() {
    setBusy(true);
    setError(null);
    const res = await api().post("/api/v1/auth/magic-link", { email: email.trim() });
    setBusy(false);
    if (!res.ok) return setError(errorText(res, t("common.tryAgain")));
    setSent(true);
  }
  async function consume() {
    setBusy(true);
    setError(null);
    const res = await api().post<SessionResponse>("/api/v1/auth/magic-link/consume", { token: token.trim(), device: "Relay app" });
    setBusy(false);
    if (!res.ok) return setError(errorText(res, t("login.noMatch")));
    // Two-step sign-in: the link was the first step; the code screen is the second.
    if (isTwoFactor(res.data)) return router.push({ pathname: "/(auth)/two-factor", params: { challenge: res.data.challenge } } as never);
    await session.accept(res.data);
  }

  return (
    <Screen title={t("login.emailMeALink")} description={t("login.useMagicLink")}>
      <View style={{ gap: th.space[3] }}>
        <Field label={t("login.emailLabel")} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" error={sent ? null : error} />
        <Button label={sent ? t("login.checkEmail") : t("login.emailMeALink")} onPress={request} busy={busy} disabled={!email.trim() || sent} />
        {sent ? (
          <>
            <Text variant="sm" tone="muted">
              {t("login.magicSent", { email: email.trim() })}
            </Text>
            <Field label={t("login.pasteToken")} value={token} onChangeText={setToken} autoCapitalize="none" autoCorrect={false} error={error} />
            <Button label={t("login.submit")} onPress={consume} busy={busy} disabled={!token.trim()} />
          </>
        ) : null}
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
