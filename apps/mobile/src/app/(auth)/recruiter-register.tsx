import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import type { SessionResponse } from "@edulink/contracts";
import { Button, Field, Screen } from "@/components";
import { api, errorText } from "@/lib/api";
import { useSession } from "@/lib/session";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/**
 * A recruiter's own account (4 Oct 2026), the web's /register/recruiter:
 * never invited, a member of no college. The account and the company are made
 * in one call, which answers with a session, so the recruiter is signed in to
 * their home at once. A refusal names its field; a rate limit says when.
 */
export default function RecruiterRegister() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const session = useSession();
  const [form, setForm] = useState({ name: "", companyName: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await api().post<SessionResponse>("/api/v1/auth/recruiter/register", { ...form, email: form.email.trim(), device: "Shalaghar app" });
    setBusy(false);
    if (!res.ok) {
      const field = res.issues ? Object.keys(res.issues)[0] : undefined;
      setError({ text: res.status === 429 && res.retryAfterSeconds ? `${res.error} (${res.retryAfterSeconds}s)` : errorText(res, t("common.tryAgain")), field });
      return;
    }
    await session.accept(res.data);
  }

  const fieldError = (field: string) => (error && (error.field === field || (!error.field && field === "password")) ? error.text : null);
  const ready = form.name.trim().length >= 2 && form.companyName.trim().length >= 2 && form.email.includes("@") && form.password.length >= 8;
  return (
    <Screen title={t("recruiter.registerTitle")} description={t("recruiter.registerIntro")}>
      <View style={{ gap: th.space[3] }}>
        <Field label={t("recruiter.fieldName")} value={form.name} onChangeText={set("name")} autoComplete="name" textContentType="name" error={fieldError("name")} />
        <Field label={t("recruiter.fieldCompany")} value={form.companyName} onChangeText={set("companyName")} autoComplete="organization" textContentType="organizationName" error={fieldError("companyName")} />
        <Field label={t("recruiter.fieldEmail")} value={form.email} onChangeText={set("email")} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" error={fieldError("email")} />
        <Field label={t("recruiter.fieldPassword")} value={form.password} onChangeText={set("password")} secureTextEntry textContentType="newPassword" autoComplete="new-password" error={fieldError("password")} onSubmitEditing={submit} returnKeyType="go" />
        <Button label={t("recruiter.registerButton")} onPress={submit} busy={busy} disabled={!ready} />
        <Button label={t("login.title")} variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
