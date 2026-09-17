import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { feeDuesSchema, feeRemindResultSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Confirm } from "../family/shared";
import { money } from "../shared/fees";
import { Chips, formatDateKey, must, Notice } from "./shared";

type DuesStatus = "all" | "open" | "overdue" | "paid";

/** The query for one page of dues, in the order the server documents it; nothing when everything is the default. */
export function duesPath(status: DuesStatus, q: string, page: number): string {
  const parts: string[] = [];
  if (status !== "all") parts.push(`status=${status}`);
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  if (page > 1) parts.push(`page=${page}`);
  return `/api/v1/fees/dues${parts.length ? `?${parts.join("&")}` : ""}`;
}

/**
 * The dues — the web's /admin/fees/dues: every pupil on a plan with what is
 * due, paid and overdue, filtered by state and by name or code, a page at a
 * time. A row opens the pupil's ledger, where the office takes a payment.
 * The office can also remind every overdue family at once; the head reads.
 */
export function FeesDues() {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const role = useRole();
  const router = useRouter();
  const qc = useQueryClient();
  const office = role === "ADMIN";
  const [status, setStatus] = useState<DuesStatus>("all");
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  const query = useQuery({
    queryKey: ["fees", "dues", status, q, page],
    placeholderData: keepPreviousData,
    queryFn: async () => feeDuesSchema.parse(unwrap(await api().get(duesPath(status, q, page)))),
  });
  const remind = useMutation({
    mutationFn: async () => feeRemindResultSchema.parse(must(await api().post("/api/v1/fees/remind", {}), t("common.somethingWrong"))),
    onSuccess: (r) => {
      setAsking(false);
      setNotice({ tone: "ok", text: t("fees.duesRemindSent", { count: r.families }) });
      void qc.invalidateQueries({ queryKey: ["fees"] });
    },
    onError: (e) => {
      setAsking(false);
      setNotice({ tone: "danger", text: e.message });
    },
  });
  const d = query.data;
  const filtered = Boolean(q || status !== "all");
  const clear = () => {
    setTyped("");
    setQ("");
    setStatus("all");
    setPage(1);
  };
  const from = d ? (d.page - 1) * d.pageSize + 1 : 0;
  const to = d ? (d.page - 1) * d.pageSize + d.rows.length : 0;
  const more = Boolean(d && to < d.total);
  return (
    <Screen title={t("fees.duesTitle")} description={d?.year ? `${d.year.name} · ${t("fees.duesIntro")}` : t("fees.duesIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {office ? (
        asking ? (
          <Confirm question={t("fees.duesRemind")} confirmLabel={t("fees.duesRemind")} busy={remind.isPending} onConfirm={() => remind.mutate()} onCancel={() => setAsking(false)} />
        ) : (
          <Button label={t("fees.duesRemind")} variant="secondary" onPress={() => setAsking(true)} />
        )
      ) : null}
      <Field label={t("fees.duesSearch")} value={typed} onChangeText={setTyped} onSubmitEditing={() => { setQ(typed.trim()); setPage(1); }} returnKeyType="search" autoCapitalize="none" />
      <Chips
        label={t("invites.filter")}
        value={status}
        options={[
          { value: "all", label: t("fees.duesFilterAll") },
          { value: "open", label: t("fees.duesFilterOpen") },
          { value: "overdue", label: t("fees.duesFilterOverdue") },
          { value: "paid", label: t("fees.duesFilterPaid") },
        ]}
        onChange={(next) => { setStatus(next); setPage(1); }}
      />
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.rows.length === 0 ? (
          filtered ? (
            <Empty title={t("fees.duesEmpty")} action={<Button label={t("people.clearFilters")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty title={t("fees.duesEmpty")} body={t("fees.noStructures")} action={<Button label={t("fees.title")} variant="secondary" onPress={() => router.push("/(app)/fees" as never)} />} />
          )
        ) : (
          <Card title={t("people.showingRange", { from, to, total: d.total })}>
            {d.rows.map((r) => {
              const caption = [
                r.className,
                r.studentCode,
                !r.hasPlan ? t("fees.pupilNoPlan") : r.overduePaise > 0 ? `${t("fees.duesColOverdue")} ${money(r.overduePaise, locale)}` : r.nextDueKey ? t("fees.parentDue", { date: formatDateKey(r.nextDueKey, locale) }) : null,
                `${t("fees.duesColPaid")} ${money(r.paidPaise, locale)}`,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <Row
                  key={r.studentMembershipId}
                  title={r.name}
                  caption={caption}
                  right={
                    <Text variant="base" bold tone={r.overduePaise > 0 ? "danger" : r.outstandingPaise > 0 ? "warn" : "ok"} style={{ fontVariant: ["tabular-nums"] }}>
                      {money(r.outstandingPaise, locale)}
                    </Text>
                  }
                  onPress={() => router.push({ pathname: "/(app)/fee-pupil", params: { studentMembershipId: r.studentMembershipId } } as never)}
                />
              );
            })}
            {d.page > 1 || more ? (
              <View style={{ flexDirection: "row", gap: th.space[2], flexWrap: "wrap" }}>
                {d.page > 1 ? <Button label={t("common.back")} variant="ghost" onPress={() => setPage(d.page - 1)} /> : null}
                {more ? <Button label={t("fees.duesMore")} variant="secondary" busy={query.isFetching} onPress={() => setPage(d.page + 1)} /> : null}
              </View>
            ) : null}
          </Card>
        )
      ) : null}
    </Screen>
  );
}
