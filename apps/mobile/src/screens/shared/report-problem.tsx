import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { appReportBodySchema, appReportResultSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Screen, Text } from "@/components";
import { api, errorText } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { deviceInfo } from "@/lib/version";

/**
 * Report a problem, from More. One field, and a line saying exactly what
 * travels with it — the phone, its OS, the app's version and the screen
 * the person came from (?from=) — so nothing is attached that they have
 * not read. Sent straight to POST /api/v1/app/report, never through the
 * outbox: a report about the app misbehaving must not be replayed later
 * without the person knowing, so offline it says so and keeps the words.
 */
type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent"; reference: string } | { kind: "failed"; message: string } | { kind: "offline" };

export function ReportProblem() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const from = typeof params.from === "string" && params.from ? params.from : undefined;
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ kind: "idle" });
  const device = deviceInfo();

  const send = async () => {
    const parsed = appReportBodySchema.safeParse({ kind: "PROBLEM", message, screen: from, device });
    if (!parsed.success) {
      setError(t("report.sayWhat"));
      return;
    }
    setError(null);
    setState({ kind: "sending" });
    const res = await api().post("/api/v1/app/report", parsed.data);
    if (res.ok) {
      const result = appReportResultSchema.safeParse(res.data);
      setMessage("");
      setState({ kind: "sent", reference: result.success ? result.data.reference : "" });
      return;
    }
    if (res.status === 0) {
      setState({ kind: "offline" });
      return;
    }
    setState({ kind: "failed", message: errorText(res, t("report.failed")) });
  };

  if (state.kind === "sent") {
    return (
      <Screen title={t("report.title")}>
        <Empty title={t("report.sentTitle")} body={t("report.sentBody", { reference: state.reference })} action={<Button label={t("report.backToMore")} variant="secondary" onPress={() => router.replace("/(app)/more")} />} />
      </Screen>
    );
  }

  const attach = t("report.attachLine", {
    device: device.model ?? device.platform,
    os: device.os ?? device.platform,
    app: `${t("brand.name")} ${device.appVersion}${device.build ? ` (${device.build})` : ""}`,
    screen: from ?? t("report.screenUnknown"),
  });

  return (
    <Screen title={t("report.title")} description={t("report.explainer")}>
      <Card>
        <Field label={t("report.messageLabel")} hint={t("report.messageHint")} value={message} onChangeText={setMessage} multiline error={error} style={{ minHeight: th.space[8] * 3, textAlignVertical: "top", paddingTop: th.space[3] }} />
        <View style={{ gap: th.space[1] }}>
          <Text variant="sm" bold>
            {t("report.attachTitle")}
          </Text>
          <Text variant="sm" tone="muted">
            {attach}
          </Text>
        </View>
        {state.kind === "offline" ? <Failed message={t("report.offline")} onRetry={() => void send()} /> : null}
        {state.kind === "failed" ? <Failed message={state.message} onRetry={() => void send()} /> : null}
        <Button label={t("report.send")} onPress={() => void send()} busy={state.kind === "sending"} />
      </Card>
    </Screen>
  );
}
