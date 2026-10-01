import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appAdminCompetitionsSchema, contestStatusSetSchema, type AppAdminCompetitions } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Icon, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, must } from "../staff/shared";
import { formatInstant, Pill, relativeTime } from "../family/shared";

type Status = "" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Next = "PUBLISHED" | "ARCHIVED";
type Competition = AppAdminCompetitions["items"][number];

/**
 * The web's /appadmin on a phone: the platform competitions, narrowed by
 * status as the web narrows them, each published or withdrawn here after a
 * second tap (publishing puts it in front of every child on the server);
 * posting one and the question bank are the app's own screens.
 */
export function AppAdminHome() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const session = useSession();
  const [status, setStatus] = useState<Status>("");
  const query = useQuery({
    queryKey: ["appadmin", "competitions"],
    queryFn: async () => appAdminCompetitionsSchema.parse(unwrap(await api().get("/api/v1/appadmin/competitions"))),
  });
  const change = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: Next }) => contestStatusSetSchema.parse(must(await api().post(`/api/v1/appadmin/competitions/${id}/status`, { status: next }), t("root.didNotWork"))),
    onSuccess: (res) => {
      toast.show(res.status === "PUBLISHED" ? t("appadmin.published") : t("appadmin.withdrawn"));
      void qc.invalidateQueries({ queryKey: ["appadmin", "competitions"] });
      void qc.invalidateQueries({ queryKey: ["shared", "competitions"] });
    },
  });
  const d = query.data;
  const shown = d ? d.items.filter((c) => !status || c.status === status) : [];
  const name = session.me ? (session.me.user.preferredName ?? session.me.user.name) : "";
  const post = () => router.push("/(app)/competition-new" as never);
  const again = change.variables;
  return (
    <Screen title={t("appadmin.areaTitle")} description={t("appadmin.switchHint")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
        <Text variant="lg" bold style={{ flexShrink: 1 }}>
          {name}
        </Text>
        <Pill label={t("appadmin.badge")} tone="accent" />
      </View>
      <Card title={t("appadmin.competitions")} action={<Button label={t("appadmin.postCompetition")} variant="ghost" icon={<Icon name="plus" size={18} color={th.accentStrong} weight="bold" />} onPress={post} />}>
        <Text variant="sm" tone="muted">
          {t("appadmin.competitionsIntro")}
        </Text>
        <Chips
          label={t("enquiries.statusFilter")}
          value={status}
          options={[
            { value: "", label: t("vacancies.filterAll") },
            { value: "PUBLISHED", label: t("appadmin.statusLive") },
            { value: "DRAFT", label: t("appadmin.statusDraft") },
            { value: "ARCHIVED", label: t("appadmin.statusWithdrawn") },
          ]}
          onChange={setStatus}
        />
      </Card>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {change.isError ? <Failed message={change.error.message} onRetry={again ? () => change.mutate(again) : undefined} /> : null}
      {d ? (
        shown.length === 0 ? (
          status ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={() => setStatus("")} />} />
          ) : (
            <Empty icon="trophy" title={t("appadmin.noCompetitionsYet")} body={t("appadmin.noCompetitionsBody")} action={<Button label={t("appadmin.postCompetition")} onPress={post} />} />
          )
        ) : (
          <Card>
            {shown.map((c) => (
              // Keyed by status too, so a change that lands closes the row's confirm.
              <CompetitionRow key={`${c.id}:${c.status}`} c={c} busy={change.isPending && change.variables?.id === c.id} onChange={(next) => change.mutate({ id: c.id, next })} />
            ))}
          </Card>
        )
      ) : null}
      <Card title={t("appadmin.questionBank")}>
        <Text variant="sm" tone="muted">
          {t("appadmin.bankIntro")}
        </Text>
        <Row icon="books" title={t("appadmin.questionBank")} onPress={() => router.push("/(app)/question-bank" as never)} />
        {/* Teachers' questions for the bank: the review queue, the web's /appadmin/contributions. */}
        <Row icon="clipboard" title={t("gigs.queueTitle")} onPress={() => router.push("/(app)/contribution-queue" as never)} />
      </Card>
      {/* The global feed from above every school: the web's /appadmin/moderation. */}
      <Card title={t("moderation.nav")}>
        <Text variant="sm" tone="muted">
          {t("moderation.intro")}
        </Text>
        <Row icon="shield" title={t("moderation.title")} onPress={() => router.push("/(app)/moderation" as never)} />
      </Card>
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}

/** One platform competition: what it is and where it stands, and the one press that moves it on — asked twice. */
function CompetitionRow({ c, busy, onChange }: { c: Competition; busy: boolean; onChange: (next: Next) => void }) {
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const [confirming, setConfirming] = useState(false);
  const next: Next = c.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
  const verb = next === "PUBLISHED" ? t("appadmin.publish") : t("appadmin.withdraw");
  const pill =
    c.status === "PUBLISHED" ? (
      <Pill label={t("appadmin.statusLive")} tone="ok" />
    ) : c.status === "ARCHIVED" ? (
      <Pill label={t("appadmin.statusWithdrawn")} tone="danger" />
    ) : (
      <Pill label={t("appadmin.statusDraft")} tone="muted" />
    );
  return (
    <View style={{ gap: th.space[2] }}>
      <Row
        title={c.title}
        caption={[c.summary, c.organizerName, c.registrationClosesAt ? formatInstant(c.registrationClosesAt, locale, { day: "numeric", month: "short", year: "numeric" }) : null, t("appadmin.postedAgo", { when: relativeTime(c.createdAt, locale) })].filter(Boolean).join(" · ")}
        right={pill}
      />
      {confirming ? (
        <View style={{ gap: th.space[2] }}>
          {next === "PUBLISHED" ? <Text variant="sm">{t("appadmin.everySchoolSees")}</Text> : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={verb} accessibilityLabel={`${verb}: ${c.title}`} variant={next === "ARCHIVED" ? "danger" : "primary"} busy={busy} onPress={() => onChange(next)} style={{ flexGrow: 1 }} />
            <Button label={t("common.cancel")} variant="ghost" onPress={() => setConfirming(false)} />
          </View>
        </View>
      ) : (
        <Button label={verb} accessibilityLabel={`${verb} ${c.title}`} variant={next === "PUBLISHED" ? "secondary" : "ghost"} onPress={() => setConfirming(true)} style={{ alignSelf: "flex-start" }} />
      )}
    </View>
  );
}
