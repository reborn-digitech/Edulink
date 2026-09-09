import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applyLeaveSchema, leaveAppliedSchema, staffLeaveSchema, type ApplyLeaveBody } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { dayLabel } from "./support";

/**
 * Leave, the web's /teacher/leave: this year's balance, the requests made,
 * and the form that sends a new one to the principal.
 */
type Kind = ApplyLeaveBody["kind"];
const KINDS: Kind[] = ["CASUAL", "SICK", "UNPAID", "OTHER"];
const KIND_KEY = { CASUAL: "leaveKind.casual", SICK: "leaveKind.sick", UNPAID: "leaveKind.unpaid", OTHER: "leaveKind.other" } as const;

export function TeacherLeave() {
  const t = useT();
  const { locale } = useLocale();
  const th = useTheme();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["staff", "leave"],
    queryFn: async () => staffLeaveSchema.parse(unwrap(await api().get("/api/v1/staff/leave"))),
  });
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kind, setKind] = useState<Kind>("CASUAL");
  const [reason, setReason] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const firstDay = useRef<TextInput>(null);
  const apply = useMutation({
    mutationFn: async (body: ApplyLeaveBody) => leaveAppliedSchema.parse(unwrap(await api().post("/api/v1/staff/leave", body))),
    onSuccess: () => {
      setFrom("");
      setTo("");
      setReason("");
      setCover(null);
      setSent(true);
      void qc.invalidateQueries({ queryKey: ["staff", "leave"] });
    },
  });

  const submit = () => {
    setSent(false);
    const parsed = applyLeaveSchema.safeParse({ fromDateKey: from.trim(), toDateKey: to.trim(), kind, reason, nominatedCoverMembershipId: cover });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "");
        next[field] = field === "reason" ? t("leaveKind.sayBriefly") : t("leaveKind.giveBothDates");
      }
      setErrors(next);
      return;
    }
    if (parsed.data.toDateKey < parsed.data.fromDateKey) {
      setErrors({ toDateKey: t("leaveKind.lastBeforeFirst") });
      return;
    }
    setErrors({});
    apply.mutate(parsed.data);
  };

  const data = query.data;
  const statusKey = (status: string) => `leaveStatus.${status.toLowerCase()}` as never;
  const kindLabel = (k: string) => t((KIND_KEY[k as Kind] ?? "leaveKind.other") as never);

  return (
    <Screen title={t("teacher.leave")} description={t("teacher.leaveExplainer")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          <Card title={t("staff.balanceTitle")}>
            <Text variant="base">
              {data.balance.entitlement === null
                ? t("staff.noEntitlement", { used: data.balance.used })
                : t("staff.balance", { used: data.balance.used, entitlement: data.balance.entitlement, remaining: data.balance.remaining ?? 0 })}
            </Text>
            {data.balance.pending > 0 ? (
              <Text variant="sm" tone="muted">
                {t("staff.balancePending", { pending: data.balance.pending })}
              </Text>
            ) : null}
            {data.balance.yearName ? (
              <Text variant="xs" tone="subtle">
                {t("staff.balanceYear", { year: data.balance.yearName })}
              </Text>
            ) : null}
          </Card>

          <Card title={t("teacher.applyForLeave")}>
            <Field ref={firstDay} label={t("teacher.firstDay")} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.fromDateKey} />
            <Field label={t("teacher.lastDay")} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" autoCapitalize="none" error={errors.toDateKey} />
            <Text variant="sm" bold>
              {t("teacher.kindOfLeave")}
            </Text>
            <View accessibilityRole="radiogroup" accessibilityLabel={t("teacher.kindOfLeave")} style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              {KINDS.map((k) => (
                <Chip key={k} label={t(KIND_KEY[k])} on={kind === k} onPress={() => setKind(k)} />
              ))}
            </View>
            <Field label={t("teacher.whyLabel")} hint={t("teacher.whyHint")} value={reason} onChangeText={setReason} multiline error={errors.reason} style={{ minHeight: 96, textAlignVertical: "top", paddingTop: th.space[3] }} />
            {data.staff.length > 0 ? (
              <>
                <Text variant="sm" bold>
                  {t("teacher.whoCouldCover")}
                </Text>
                <Text variant="xs" tone="subtle">
                  {t("teacher.coverHint")}
                </Text>
                <View accessibilityRole="radiogroup" accessibilityLabel={t("teacher.whoCouldCover")} style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  <Chip label={t("teacher.noSuggestion")} on={cover === null} onPress={() => setCover(null)} />
                  {data.staff.map((s) => (
                    <Chip key={s.membershipId} label={s.name} on={cover === s.membershipId} onPress={() => setCover(s.membershipId)} />
                  ))}
                </View>
              </>
            ) : null}
            {apply.isError ? <Failed message={apply.error.message} onRetry={submit} /> : null}
            {sent ? (
              <Text variant="sm" tone="ok" accessibilityLiveRegion="polite">
                {t("teacher.sentToPrincipal")}
              </Text>
            ) : null}
            <Button label={t("teacher.sendToPrincipal")} onPress={submit} busy={apply.isPending} />
          </Card>

          <Card title={t("nav.leave")}>
            {data.requests.length === 0 ? (
              <Empty title={t("teacher.nothingWaiting")} action={<Button label={t("teacher.applyForLeave")} variant="secondary" onPress={() => firstDay.current?.focus()} />} />
            ) : (
              data.requests.map((r) => (
                <Row
                  key={r.id}
                  title={`${kindLabel(r.kind)} · ${t("calendar.rangeTo", { from: dayLabel(r.fromDateKey, locale), to: dayLabel(r.toDateKey, locale) })}`}
                  caption={[r.reason, r.nominatedName ? t("teacher.suggestedCover", { name: r.nominatedName }) : null, r.decisionNote].filter(Boolean).join(" · ")}
                  right={
                    <Text variant="sm" bold tone={r.status === "APPROVED" ? "ok" : r.status === "DECLINED" ? "danger" : r.status === "PENDING" ? "warn" : "muted"}>
                      {t(statusKey(r.status))}
                    </Text>
                  }
                />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const th = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      aria-checked={on}
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={{ minHeight: th.tap, justifyContent: "center", paddingHorizontal: th.space[3], borderRadius: th.radius.md, borderWidth: 1, borderColor: on ? th.accent : th.border, backgroundColor: on ? th.accentSoft : th.surface }}
    >
      <Text variant="sm" bold={on} tone={on ? "accent" : "fg"}>
        {label}
      </Text>
    </Pressable>
  );
}
