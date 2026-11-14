import { useState } from "react";
import { View } from "react-native";
import type { SessionResponse } from "@edulink/contracts";
import { Button, Field, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/**
 * The second step of a sign-in: the six-digit code from the authenticator
 * app, or a recovery code, against the challenge the first step answered.
 * A right code is the session the first step would have been; a wrong one
 * is the server's sentence with the tries left; a dead challenge (five
 * minutes, five wrong codes) sends the person back to the start.
 */
export function TwoFactorStep({ challenge, onBack }: { challenge: string; onBack: () => void }) {
  const t = useT();
  const th = useTheme();
  const session = useSession();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api().post<SessionResponse>("/api/v1/auth/totp", { challenge, code: code.trim(), device: "Shalaghar app" });
    setBusy(false);
    if (!res.ok) {
      setError(res.status === 429 && res.retryAfterSeconds ? `${res.error} (${res.retryAfterSeconds}s)` : errorText(res, t("totp.wrongCode")));
      return;
    }
    await session.accept(res.data);
  }

  return (
    <View style={{ gap: th.space[3] }}>
      <Text variant="lg" bold accessibilityRole="header">
        {t("totp.stepTitle")}
      </Text>
      <Text variant="sm" tone="muted">
        {t("totp.stepBody")}
      </Text>
      <Field
        label={t("totp.codeLabel")}
        value={code}
        onChangeText={(next) => {
          setCode(next);
          setError(null);
        }}
        // Letters too (TA-357): the box takes a recovery code, two groups of four letters and digits, as well as the app's six digits.
        keyboardType="default"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="000000"
        maxLength={12}
        hint={t("totp.stepHint")}
        error={error}
        onSubmitEditing={submit}
        returnKeyType="go"
      />
      <Button label={t("totp.stepSubmit")} onPress={submit} busy={busy} disabled={code.trim().length < 6} />
      <Button label={t("totp.backToLogin")} variant="ghost" onPress={onBack} />
    </View>
  );
}
