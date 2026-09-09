import { useState } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { z } from "zod";
import { competitionsPageSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { Chips, openWeb } from "../staff/shared";
import { formatInstant, Pill } from "../family/shared";

type Show = "" | "all";
type Page = z.infer<typeof competitionsPageSchema>;
type Competition = Page["school"][number];

const DATE: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

/**
 * The marketplace, the web's /competitions, for every role: the school's
 * own and the platform's, open ones unless asked for the closed too, and
 * next to each what the reader's family has done about it. Posting one is
 * the web's form.
 */
export function Competitions() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const [show, setShow] = useState<Show>("");
  const [subject, setSubject] = useState("");
  const query = useQuery({
    queryKey: ["shared", "competitions", show],
    placeholderData: keepPreviousData,
    queryFn: async () => competitionsPageSchema.parse(unwrap(await api().get(`/api/v1/shared/competitions${show ? `?show=${show}` : ""}`))),
  });
  const data = query.data;
  const all = data ? [...data.school, ...data.platform] : [];
  const subjects = [...new Set(all.map((c) => c.subject).filter((x): x is string => Boolean(x)))].sort();
  const keep = (c: Competition) => !subject || c.subject === subject;
  const school = data?.school.filter(keep) ?? [];
  const platform = data?.platform.filter(keep) ?? [];
  const nothing = school.length === 0 && platform.length === 0;
  const open = (competitionId: string) => router.push({ pathname: "/(app)/competitions/detail", params: { competitionId } } as never);

  return (
    <Screen title={t("competitions.title")} description={t("competitions.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {role === "ADMIN" ? <Button label={t("competitions.postOne")} variant="secondary" onPress={() => openWeb("/competitions/new")} /> : null}
      <Chips
        label={t("competitions.showFilter")}
        value={show}
        options={[
          { value: "", label: t("competitions.onlyOpen") },
          { value: "all", label: t("competitions.showClosed") },
        ]}
        onChange={setShow}
      />
      {subjects.length > 1 ? <Chips label={t("staff.subjectFilter")} value={subject} options={[{ value: "", label: t("staff.allSubjects") }, ...subjects.map((x) => ({ value: x, label: x }))]} onChange={setSubject} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {data ? (
        <>
          {data.waiting.length > 0 ? (
            <Card title={t("competitions.waitingForYou")}>
              {data.waiting.map((item) => (
                <Row key={item.entryId} title={t("competitions.wouldLikeToEnter", { child: item.childName, title: item.title, organiser: item.organizerName })} caption={t("competitions.cannotUntilYes")} onPress={() => open(item.competitionId)} />
              ))}
            </Card>
          ) : null}
          {nothing && subject ? (
            <Empty title={t("common.noResultsTitle")} body={t("common.noResultsBody")} action={<Button label={t("staff.allSubjects")} variant="secondary" onPress={() => setSubject("")} />} />
          ) : nothing ? (
            <Empty
              title={show ? t("competitions.emptyTitle") : t("competitions.emptyOpenTitle")}
              body={show ? t("competitions.emptyBody") : t("competitions.emptyOpenBody")}
              action={
                !show ? (
                  <Button label={t("competitions.showClosed")} variant="secondary" onPress={() => setShow("all")} />
                ) : role === "ADMIN" ? (
                  <Button label={t("competitions.postOne")} variant="secondary" onPress={() => openWeb("/competitions/new")} />
                ) : (
                  <Button label={t("nav.bulletin")} variant="secondary" onPress={() => router.push("/(app)/bulletin" as never)} />
                )
              }
            />
          ) : (
            <>
              {school.length > 0 ? (
                <Card title={t("competitions.fromYourSchool")}>
                  <Text variant="xs" tone="muted">
                    {t("competitions.fromYourSchoolHint")}
                  </Text>
                  {school.map((c) => (
                    <CompetitionRow key={c.id} competition={c} onPress={() => open(c.id)} />
                  ))}
                </Card>
              ) : null}
              {platform.length > 0 ? (
                <Card title={t("competitions.forEverySchool")}>
                  <Text variant="xs" tone="muted">
                    {t("competitions.forEverySchoolHint")}
                  </Text>
                  {platform.map((c) => (
                    <CompetitionRow key={c.id} competition={c} onPress={() => open(c.id)} />
                  ))}
                </Card>
              ) : null}
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

/** The web's card: title and the checked mark, the one line, who runs it and when it closes, and what my family has done. */
function CompetitionRow({ competition, onPress }: { competition: Competition; onPress: () => void }) {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const { locale } = useLocale();
  const grades = competition.gradeLow ? `${competition.gradeLow}${competition.gradeHigh && competition.gradeHigh !== competition.gradeLow ? `–${competition.gradeHigh}` : ""}` : null;
  const meta = [competition.organizerName, competition.subject, grades, competition.registrationClosesAt ? t("competitions.closesShort", { date: formatInstant(competition.registrationClosesAt, locale, DATE) }) : null].filter(Boolean).join(" · ");
  const entry = competition.entry;
  const entryLabel = entry
    ? entry.awaitingConsent
      ? role === "PARENT"
        ? t("competitions.childWaitingOnYou", { child: entry.studentName })
        : t("competitions.waitingForGrownUp")
      : role === "PARENT"
        ? t("competitions.childEntered", { child: entry.studentName })
        : t("competitions.youAreEntered")
    : null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${competition.title}, ${competition.summary}`} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, minHeight: th.tap, paddingVertical: th.space[2], gap: 2 })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2], flexWrap: "wrap" }}>
        <Text variant="base" bold>
          {competition.title}
        </Text>
        {competition.verified ? (
          <Text variant="xs" bold tone="accent">
            {t("competitions.verified")}
          </Text>
        ) : null}
      </View>
      <Text variant="sm" tone="muted">
        {competition.summary}
      </Text>
      <Text variant="xs" tone="muted">
        {meta}
      </Text>
      {entryLabel ? <Pill tone={entry?.awaitingConsent ? "warn" : "ok"} label={entryLabel} /> : null}
    </Pressable>
  );
}
