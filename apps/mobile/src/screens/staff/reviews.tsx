import { useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminReviewsSchema, reviewRoundOpenedSchema, type AdminReviews } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { Chips, formatDateKey, MultiChips, Notice } from "./shared";

type RoundStatus = "open" | "closed" | "all";
type Audience = "STUDENTS" | "PARENTS" | "BOTH";
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function reviewsPath(status: RoundStatus): string {
  return `/api/v1/admin/reviews?status=${status}`;
}

/**
 * The review desk: the ratings dashboard (averages only, never who said
 * what), the rounds by status, and opening a new one — teachers, audience
 * and the day it closes.
 */
export function ReviewDesk() {
  const t = useT();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [status, setStatus] = useState<RoundStatus>("open");
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "danger" } | null>(null);
  const query = useQuery({
    queryKey: ["admin", "reviews", status],
    placeholderData: keepPreviousData,
    queryFn: async () => adminReviewsSchema.parse(unwrap(await api().get(reviewsPath(status)))),
  });
  const open = useMutation({
    mutationFn: async (body: { teacherMembershipIds: string[]; audience: Audience; closesDateKey: string }) => reviewRoundOpenedSchema.parse(unwrap(await api().post("/api/v1/admin/reviews", body))),
    onSuccess: () => {
      setNotice({ tone: "ok", text: t("reviews.roundOpened") });
      void qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      void qc.invalidateQueries({ queryKey: ["principal", "overview"] });
    },
    onError: (e) => setNotice({ tone: "danger", text: e.message }),
  });
  const d = query.data;
  const audienceLabel = (a: string) => (a === "STUDENTS" ? t("reviews.audienceStudents") : a === "PARENTS" ? t("reviews.audienceParents") : t("reviews.audienceBoth"));
  return (
    <Screen title={t("reviews.title")} description={t("reviews.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {d.dashboard.length > 0 ? (
            <Card title={t("reviews.ratings")}>
              {d.dashboard.map((r) => (
                <Row
                  key={r.membershipId}
                  title={r.name}
                  caption={[r.allTime.responseCount === 1 ? t("reviews.answersOne") : t("reviews.answersN", { count: r.allTime.responseCount }), trend(t, r)].filter(Boolean).join(" · ")}
                  right={<Text variant="lg" bold tone="accent">{r.allTime.overall === null ? "—" : r.allTime.overall.toFixed(1)}</Text>}
                />
              ))}
            </Card>
          ) : null}
          <Card title={t("reviews.roundsHeading")}>
            <Chips
              label={t("invites.filter")}
              value={status}
              options={[
                { value: "open", label: t("invites.tabCount", { label: t("reviews.statusOpen"), count: d.counts.open }) },
                { value: "closed", label: t("invites.tabCount", { label: t("reviews.statusClosed"), count: d.counts.closed }) },
                { value: "all", label: t("vacancies.filterAll") },
              ]}
              onChange={setStatus}
            />
            {d.rounds.length === 0 ? (
              <Empty title={status === "open" ? t("reviews.noOpenRoundsTitle") : t("reviews.noRoundsTitle")} body={t("reviews.noRoundsBody")} />
            ) : (
              d.rounds.map((r) => (
                <Row
                  key={r.id}
                  title={audienceLabel(r.audience)}
                  caption={[t("reviews.openUntil", { date: formatDateKey(r.closesDateKey, locale) }), t("reviews.teachersN", { count: r.teacherCount }), r.responseCount === 1 ? t("reviews.answersOne") : t("reviews.answersN", { count: r.responseCount })].join(" · ")}
                  right={<Text variant="xs" bold tone={r.status.toLowerCase() === "open" ? "ok" : "muted"}>{r.status.toLowerCase() === "open" ? t("reviews.statusOpen") : t("reviews.statusClosed")}</Text>}
                />
              ))
            )}
          </Card>
          <OpenRound teachers={d.teacherOptions} defaultClose={d.defaultCloseDateKey} busy={open.isPending} onOpen={(body) => open.mutate(body)} />
        </>
      ) : null}
    </Screen>
  );
}

function trend(t: ReturnType<typeof useT>, r: AdminReviews["dashboard"][number]): string | null {
  if (!r.latest) return null;
  if (!r.previous || r.delta === null || r.delta === 0) return t("reviews.trendFlat", { latest: r.latest.overall.toFixed(1) });
  const vars = { delta: Math.abs(r.delta).toFixed(1), previous: r.previous.overall.toFixed(1), latest: r.latest.overall.toFixed(1) };
  return r.delta > 0 ? t("reviews.trendUp", vars) : t("reviews.trendDown", vars);
}

function OpenRound({ teachers, defaultClose, busy, onOpen }: { teachers: AdminReviews["teacherOptions"]; defaultClose: string; busy: boolean; onOpen: (body: { teacherMembershipIds: string[]; audience: Audience; closesDateKey: string }) => void }) {
  const t = useT();
  const [chosen, setChosen] = useState<string[]>([]);
  const [audience, setAudience] = useState<Audience>("BOTH");
  const [closes, setCloses] = useState(defaultClose);
  const all = chosen.length === teachers.length && teachers.length > 0;
  const validDate = DATE_KEY.test(closes);
  return (
    <Card title={t("reviews.openRoundHeading")}>
      <MultiChips label={t("reviews.chooseTeachers")} values={all ? ["*", ...chosen] : chosen} options={[{ value: "*", label: t("reviews.allTeachers") }, ...teachers.map((x) => ({ value: x.membershipId, label: x.name }))]} onToggle={(v) => (v === "*" ? setChosen(all ? [] : teachers.map((x) => x.membershipId)) : setChosen((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])))} />
      <Chips
        label={t("reviews.audience")}
        value={audience}
        options={[
          { value: "STUDENTS", label: t("reviews.audienceStudents") },
          { value: "PARENTS", label: t("reviews.audienceParents") },
          { value: "BOTH", label: t("reviews.audienceBoth") },
        ]}
        onChange={setAudience}
      />
      <Field label={t("reviews.closesOn")} value={closes} onChangeText={setCloses} hint="YYYY-MM-DD" error={validDate ? null : t("leaveKind.giveBothDates")} autoCapitalize="none" keyboardType="numbers-and-punctuation" />
      <Button label={t("reviews.openRound")} disabled={chosen.length === 0 || !validDate} busy={busy} onPress={() => onOpen({ teacherMembershipIds: chosen, audience, closesDateKey: closes })} />
    </Card>
  );
}
