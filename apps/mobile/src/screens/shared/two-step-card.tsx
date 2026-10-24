import { useState } from "react";
import { Linking, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { totpConfirmedSchema, totpStartedSchema, totpStatusSchema, type TotpStarted } from "@edulink/contracts";
import { Button, Card, Field, Row, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { copyText } from "@/lib/copy";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note } from "../family/shared";

/**
 * Two-step sign-in on the account page, for the office, the head and the
 * operator — the status says who, and the card draws nothing for anybody
 * else. Off: one press starts it; the phone cannot scan its own screen, so
 * the key and the otpauth link are shown with "open in the app", "share"
 * and "copy" instead of a QR; one code from the app confirms it and the
 * eight recovery codes are shown this once. On: how many recovery codes
 * are left, and a code box that turns it off.
 */
export function TwoStepCard() {
  const t = useT();
  const status = useQuery({
    queryKey: ["account", "totp"],
    queryFn: async () => totpStatusSchema.parse(unwrap(await api().get("/api/v1/account/totp"))),
  });
  const d = status.data;
  if (!d || !d.eligible) return null;
  return (
    <Card title={t("totp.title")}>
      <Text variant="xs" tone="muted">
        {t("totp.description")}
      </Text>
      {d.enabled ? <On recoveryLeft={d.recoveryLeft} /> : <Off available={d.available} hasPassword={d.hasPassword} />}
    </Card>
  );
}

function Off({ available, hasPassword }: { available: boolean; hasPassword: boolean }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [started, setStarted] = useState<TotpStarted | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Turning it on asks for the password first (QA-23, 24 Oct 2026); an account with none was asked to have signed in just now.
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const start = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/totp/start", hasPassword ? { password } : {});
      if (!result.ok) {
        if (result.issues?.password) throw Object.assign(new Error(result.issues.password), { field: "password" });
        throw new Error(errorText(result, t("account.didNotWork")));
      }
      return totpStartedSchema.parse(result.data);
    },
    onSuccess: (data) => {
      setError(null);
      setPasswordError(null);
      setPassword("");
      setStarted(data);
    },
    onError: (e) => {
      if ((e as { field?: string }).field === "password") setPasswordError(e.message);
      else setError(e.message);
    },
  });
  const confirm = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/totp/confirm", { code: code.trim() });
      if (!result.ok) throw new Error(result.issues?.code ?? errorText(result, t("account.didNotWork")));
      return totpConfirmedSchema.parse(result.data);
    },
    onSuccess: async (data) => {
      toast.show(t("totp.turnedOn"));
      setRecoveryCodes(data.recoveryCodes);
      setStarted(null);
      setCode("");
      setError(null);
    },
    onError: (e) => setError(e.message),
  });

  async function share(text: string) {
    const done = await copyText(text, t("totp.title"));
    toast.show(done ? t("totp.copied") : t("totp.copyFailed"), done ? undefined : "danger");
  }

  if (recoveryCodes) {
    return (
      <View style={{ gap: th.space[3] }}>
        <Note tone="ok">
          <Text variant="sm" bold>
            {t("totp.recoveryTitle")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("totp.recoveryBody")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }} accessibilityLabel={t("totp.recoveryTitle")}>
            {recoveryCodes.map((c) => (
              <Text key={c} variant="sm" bold selectable style={{ fontVariant: ["tabular-nums"], minWidth: "45%" }}>
                {c}
              </Text>
            ))}
          </View>
        </Note>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("totp.copy")} variant="secondary" onPress={() => void share(recoveryCodes.join("\n"))} />
          <Button
            label={t("totp.recoveryDone")}
            onPress={async () => {
              setRecoveryCodes(null);
              await qc.invalidateQueries({ queryKey: ["account", "totp"] });
            }}
          />
        </View>
      </View>
    );
  }

  if (started) {
    return (
      <View style={{ gap: th.space[3] }}>
        <Note tone="accent">
          <Text variant="sm" bold>
            {t("totp.scanTitle")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("totp.phoneCannotScan")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("totp.secretLabel")}
          </Text>
          <Text variant="sm" bold selectable accessibilityLabel={`${t("totp.secretLabel")}: ${started.secret}`}>
            {started.secret.match(/.{1,4}/g)?.join(" ")}
          </Text>
          <Text variant="xs" tone="muted">
            {t("totp.accountShown", { account: started.account })}
          </Text>
        </Note>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("totp.openInApp")} variant="secondary" onPress={() => void Linking.openURL(started.uri).catch(() => toast.show(t("totp.copyFailed"), "danger"))} />
          <Button label={t("totp.copy")} variant="secondary" onPress={() => void share(started.secret)} />
          <Button label={t("totp.shareKey")} variant="ghost" onPress={() => void share(started.uri)} />
        </View>
        <Field
          label={t("totp.codeLabel")}
          value={code}
          onChangeText={(next) => {
            setCode(next);
            setError(null);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          placeholder="000000"
          maxLength={12}
          error={error}
        />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
          <Button label={t("totp.confirm")} busy={confirm.isPending} disabled={code.trim().length < 6} onPress={() => confirm.mutate()} />
          <Button
            label={t("common.cancel")}
            variant="secondary"
            disabled={confirm.isPending}
            onPress={() => {
              setStarted(null);
              setCode("");
              setError(null);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: th.space[3] }}>
      <Row title={available ? t("totp.off") : t("totp.unavailable")} />
      {available && hasPassword ? (
        <Field
          label={t("accountGuard.totpPasswordLabel")}
          value={password}
          onChangeText={(next) => {
            setPassword(next);
            setPasswordError(null);
          }}
          secureTextEntry
          textContentType="password"
          autoComplete="current-password"
          hint={t("accountGuard.totpPasswordHint")}
          error={passwordError}
        />
      ) : null}
      {available && !hasPassword ? (
        <Text variant="xs" tone="muted">
          {t("accountGuard.totpFreshSignInHint")}
        </Text>
      ) : null}
      {error ? (
        <Text variant="sm" tone="danger">
          {error}
        </Text>
      ) : null}
      <Button label={t("totp.turnOn")} busy={start.isPending} disabled={!available || (hasPassword && password.length === 0)} onPress={() => start.mutate()} />
    </View>
  );
}

function On({ recoveryLeft }: { recoveryLeft: number }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [turningOff, setTurningOff] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const disable = useMutation({
    mutationFn: async () => {
      const result = await api().post("/api/v1/account/totp/disable", { code: code.trim() });
      if (!result.ok) throw new Error(result.issues?.code ?? errorText(result, t("account.didNotWork")));
    },
    onSuccess: async () => {
      toast.show(t("totp.turnedOff"));
      setTurningOff(false);
      setCode("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["account", "totp"] });
    },
    onError: (e) => setError(e.message),
  });
  return (
    <View style={{ gap: th.space[3] }}>
      <Row title={t("totp.on")} caption={t("totp.recoveryLeft", { count: recoveryLeft })} />
      {turningOff ? (
        <>
          <Field
            label={t("totp.codeLabel")}
            value={code}
            onChangeText={(next) => {
              setCode(next);
              setError(null);
            }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            placeholder="000000"
            maxLength={12}
            hint={t("totp.turnOffBody")}
            error={error}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t("totp.turnOff")} variant="danger" busy={disable.isPending} disabled={code.trim().length < 6} onPress={() => disable.mutate()} />
            <Button
              label={t("common.cancel")}
              variant="secondary"
              disabled={disable.isPending}
              onPress={() => {
                setTurningOff(false);
                setCode("");
                setError(null);
              }}
            />
          </View>
        </>
      ) : (
        <Button label={t("totp.turnOff")} variant="secondary" onPress={() => setTurningOff(true)} />
      )}
    </View>
  );
}
