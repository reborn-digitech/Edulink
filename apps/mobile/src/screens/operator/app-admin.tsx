import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { appAdminCompetitionsSchema, type AppAdminCompetitions } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, openWeb } from "../staff/shared";
import { formatInstant, Pill, relativeTime } from "../family/shared";

type Status = "" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
type Competition = AppAdminCompetitions["items"][number];

/**
 * The web's /appadmin on a phone, read-only: the platform competitions,
 * narrowed by status as the web narrows them, and the door to the question
 * bank. Posting, publishing and withdrawing are the web's forms; a row opens
 * the list there.
 */
export function AppAdminHome() {
  const t = useT();
  const th = useTheme();
  const session = useSession();
  const [status, setStatus] = useState<Status>("");
  const query = useQuery({
    queryKey: ["appadmin", "competitions"],
    queryFn: async () => appAdminCompetitionsSchema.parse(unwrap(await api().get("/api/v1/appadmin/competitions"))),
  });
  const d = query.data;
  const shown = d ? d.items.filter((c) => !status || c.status === status) : [];
  const name = session.me ? (session.me.user.preferredName ?? session.me.user.name) : "";
  return (
    <Screen title={t("appadmin.areaTitle")} description={t("appadmin.switchHint")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
        <Text variant="lg" bold style={{ flexShrink: 1 }}>
          {name}
        </Text>
        <Pill label={t("appadmin.badge")} tone="accent" />
      </View>
      <Card title={t("appadmin.competitions")} action={<Button label={t("appadmin.postCompetition")} variant="ghost" onPress={() => openWeb("/appadmin/new")} />}>
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
      {d ? (
        shown.length === 0 ? (
          status ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("common.clearAll")} variant="secondary" onPress={() => setStatus("")} />} />
          ) : (
            <Empty title={t("appadmin.noCompetitionsYet")} body={t("appadmin.noCompetitionsBody")} action={<Button label={t("appadmin.postCompetition")} onPress={() => openWeb("/appadmin/new")} />} />
          )
        ) : (
          <Card>
            {shown.map((c) => (
              <CompetitionRow key={c.id} c={c} />
            ))}
          </Card>
        )
      ) : null}
      <Card title={t("appadmin.questionBank")} action={<Button label={t("appadmin.questionBank")} variant="ghost" onPress={() => openWeb("/appadmin/bank")} />}>
        <Text variant="sm" tone="muted">
          {t("appadmin.bankIntro")}
        </Text>
      </Card>
      <Button label={t("shell.signOut")} variant="ghost" onPress={() => void session.signOut()} />
    </Screen>
  );
}

function CompetitionRow({ c }: { c: Competition }) {
  const t = useT();
  const { locale } = useLocale();
  const pill =
    c.status === "PUBLISHED" ? (
      <Pill label={t("appadmin.statusLive")} tone="ok" />
    ) : c.status === "ARCHIVED" ? (
      <Pill label={t("appadmin.statusWithdrawn")} tone="danger" />
    ) : (
      <Pill label={t("appadmin.statusDraft")} tone="muted" />
    );
  return (
    <Row
      title={c.title}
      caption={[c.summary, c.organizerName, c.registrationClosesAt ? formatInstant(c.registrationClosesAt, locale, { day: "numeric", month: "short", year: "numeric" }) : null, t("appadmin.postedAgo", { when: relativeTime(c.createdAt, locale) })].filter(Boolean).join(" · ")}
      right={pill}
      onPress={() => openWeb("/appadmin")}
    />
  );
}
