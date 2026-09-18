import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { broadcastCreatedSchema, broadcastPreviewSchema, messagingOverviewSchema, type MessagingAudience } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips, must, Notice, Refusal } from "./shared";

type Kind = "ALL_PARENTS" | "CLASS" | "GRADE" | "OVERDUE_FEES";
const BODY_MAX = 300;

/**
 * One notice to many families — the web's /admin/messaging/new: a label
 * for the office's records, the words (up to 300 characters, the
 * "circular" template's one slot), who it goes to, and how — by text
 * (WhatsApp where the family allows it, SMS otherwise), by app
 * notification, or both. "Check reach" asks the server who it would reach
 * and on which channel without writing anything; "Send now" queues it and
 * opens the report. The office only: the API admits nobody else here.
 */
export function MessagingNew() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const office = role === "ADMIN";
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Kind>("ALL_PARENTS");
  const [classId, setClassId] = useState<string | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string | null>(null);
  const [text, setText] = useState(true);
  const [push, setPush] = useState(false);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [problem, setProblem] = useState<string | null>(null);
  const overview = useQuery({
    queryKey: ["messaging", "overview"],
    queryFn: async () => messagingOverviewSchema.parse(unwrap(await api().get("/api/v1/messaging/overview"))),
    enabled: office,
  });
  const classes = overview.data?.classes ?? [];
  const grades = overview.data?.grades ?? [];
  const audience = audienceFor(kind, classId, gradeLevel);
  const channels = [text ? "TEXT" : null, push ? "PUSH" : null].filter((c): c is "TEXT" | "PUSH" => c !== null);
  const cleanTitle = title.trim();
  const cleanBody = body.trim();

  /** What the phone can refuse before asking the server; the server's own sentences replace these when it answers. */
  const check = (forSend: boolean): boolean => {
    const next: Record<string, string> = {};
    if (forSend && (cleanTitle.length < 2 || cleanTitle.length > 80)) next.title = t("messaging.refuseTitle");
    if (cleanBody.length < (forSend ? 5 : 1) || cleanBody.length > BODY_MAX) next.body = t("messaging.refuseBody");
    if (forSend && channels.length === 0) next.channels = t("messaging.refuseChannels");
    if (!audience) next.audience = kind === "CLASS" ? t("messaging.composeChooseClass") : t("messaging.composeChooseGrade");
    setIssues(next);
    setProblem(null);
    return Object.keys(next).length === 0;
  };
  /** The server's sentence under the field it named; above the buttons when it named none. */
  const refused = (e: Error) => {
    if (e instanceof Refusal && Object.keys(e.issues).length > 0) {
      setIssues(e.issues);
      setProblem(null);
    } else setProblem(e.message);
  };
  const preview = useMutation({
    mutationFn: async () => broadcastPreviewSchema.parse(must(await api().post("/api/v1/messaging/broadcasts/preview", { audience, body: cleanBody }), t("common.somethingWrong"))),
    onError: refused,
  });
  const send = useMutation({
    mutationFn: async () => broadcastCreatedSchema.parse(must(await api().post("/api/v1/messaging/broadcasts", { title: cleanTitle, body: cleanBody, audience, channels }), t("common.somethingWrong"))),
    onSuccess: (r) => {
      toast.show(t("messaging.composeSent", { queued: r.queued, skipped: r.skipped }));
      void qc.invalidateQueries({ queryKey: ["messaging"] });
      router.replace({ pathname: "/(app)/messaging-broadcast", params: { broadcastId: r.broadcastId } } as never);
    },
    onError: refused,
  });
  const back = <Button label={t("messaging.title")} variant="secondary" onPress={() => router.push("/(app)/messaging" as never)} />;
  const kinds: { value: Kind; label: string }[] = [
    { value: "ALL_PARENTS", label: t("messaging.audienceAll") },
    { value: "CLASS", label: t("messaging.audienceClass") },
    { value: "GRADE", label: t("messaging.audienceGrade") },
    { value: "OVERDUE_FEES", label: t("messaging.audienceOverdue") },
  ];
  const p = preview.data;
  return (
    <Screen title={t("messaging.composeTitle")} description={t("messaging.composeIntro")}>
      {role === null ? <Loading /> : null}
      {role !== null && !office ? <Empty title={t("messaging.refuseOffice")} action={back} /> : null}
      {office && overview.isError ? <Failed message={overview.error.message} onRetry={() => void overview.refetch()} /> : null}
      {office ? (
        <>
          {problem ? <Notice text={problem} tone="danger" /> : null}
          <Card>
            <Field label={t("messaging.composeLabel")} value={title} onChangeText={(next) => { setTitle(next); setIssues((i) => ({ ...i, title: "" })); }} maxLength={80} error={issues.title || null} />
            <Field
              label={t("messaging.composeBody")}
              value={body}
              onChangeText={(next) => { setBody(next); setIssues((i) => ({ ...i, body: "" })); preview.reset(); }}
              multiline
              numberOfLines={4}
              maxLength={BODY_MAX}
              hint={`${body.length}/${BODY_MAX}`}
              error={issues.body || null}
              style={{ minHeight: th.tap * 2, textAlignVertical: "top", paddingVertical: th.space[3] }}
            />
          </Card>
          <Card>
            <Chips label={t("messaging.composeAudience")} value={kind} options={kinds} onChange={(next) => { setKind(next); setIssues((i) => ({ ...i, audience: "" })); preview.reset(); }} />
            {kind === "CLASS" ? (
              overview.isPending ? (
                <Loading />
              ) : (
                <Chips label={t("messaging.composeChooseClass")} value={classId ?? ""} options={classes.map((c) => ({ value: c.id, label: c.gradeLevel ? `${c.name} · ${c.gradeLevel}` : c.name }))} onChange={(next) => { setClassId(next); setIssues((i) => ({ ...i, audience: "" })); preview.reset(); }} />
              )
            ) : null}
            {kind === "GRADE" ? (
              overview.isPending ? (
                <Loading />
              ) : (
                <Chips label={t("messaging.composeChooseGrade")} value={gradeLevel ?? ""} options={grades.map((g) => ({ value: g, label: g }))} onChange={(next) => { setGradeLevel(next); setIssues((i) => ({ ...i, audience: "" })); preview.reset(); }} />
              )
            ) : null}
            {issues.audience ? (
              <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                {issues.audience}
              </Text>
            ) : null}
          </Card>
          <Card title={t("messaging.composeChannels")}>
            <SwitchRow label={t("messaging.channelText")} value={text} onChange={(next) => { setText(next); setIssues((i) => ({ ...i, channels: "" })); }} />
            <SwitchRow label={t("messaging.channelPush")} value={push} onChange={(next) => { setPush(next); setIssues((i) => ({ ...i, channels: "" })); }} />
            {issues.channels ? (
              <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                {issues.channels}
              </Text>
            ) : null}
          </Card>
          {p ? (
            <Card title={t("messaging.previewTitle")}>
              <Text variant="base" bold>
                {t("messaging.previewRecipients", { count: p.recipients })}
              </Text>
              <Text variant="sm">{t("messaging.previewWhatsapp", { count: p.whatsapp })}</Text>
              <Text variant="sm">{t("messaging.previewSms", { count: p.sms, segments: p.estimatedSegments })}</Text>
              <Text variant="sm" tone={p.unreachable > 0 ? "warn" : "muted"}>
                {t("messaging.previewUnreachable", { count: p.unreachable })}
              </Text>
            </Card>
          ) : null}
          <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
            <Button label={t("messaging.composePreview")} variant="secondary" busy={preview.isPending} disabled={send.isPending} onPress={() => (check(false) ? preview.mutate() : undefined)} style={{ flexGrow: 1 }} />
            <Button label={t("messaging.composeSend")} busy={send.isPending} disabled={preview.isPending} onPress={() => (check(true) ? send.mutate() : undefined)} style={{ flexGrow: 1 }} />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

/** The audience the server documents, or null while a class or grade is still to be chosen. */
export function audienceFor(kind: Kind, classId: string | null, gradeLevel: string | null): MessagingAudience | null {
  switch (kind) {
    case "ALL_PARENTS":
      return { kind };
    case "OVERDUE_FEES":
      return { kind };
    case "CLASS":
      return classId ? { kind, classId } : null;
    case "GRADE":
      return gradeLevel ? { kind, gradeLevel } : null;
  }
}
