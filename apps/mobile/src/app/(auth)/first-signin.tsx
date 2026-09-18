import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { SessionResponse } from "@edulink/contracts";
import { Button, Field, Screen } from "@/components";
import { api, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/** A pupil's first sign-in: the handle and one-time code the school issued, and a new password. */
export default function FirstSignIn() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const [handle, setHandle] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api().post<SessionResponse>("/api/v1/auth/first-signin", { handle: handle.trim(), code: code.trim(), password, device: "Relay app" });
    setBusy(false);
    if (!res.ok) return setError(errorText(res, t("login.noMatch")));
    await session.accept(res.data);
  }

  return (
    <Screen title={t("firstSignin.title")} description={t("firstSignin.subtitle")}>
      <View style={{ gap: th.space[3] }}>
        <Field label={t("firstSignin.handleField")} value={handle} onChangeText={setHandle} autoCapitalize="none" autoCorrect={false} />
        <Field label={t("firstSignin.codeField")} value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} />
        <Field label={t("firstSignin.passwordField")} value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" error={error} />
        <Button label={t("firstSignin.submit")} onPress={submit} busy={busy} disabled={!handle.trim() || !code.trim() || password.length < 8} />
        <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
