import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officeRecordsSchema, penLookupSchema, recordRequestedSchema, type PenLookup } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, Tabs } from "../family/shared";
import { fieldList, useOfficeRecordChanges } from "../shared/pupil-record";
import { formatDateKey } from "./shared";
import { useCollege } from "@/lib/institution";

const PATH = "/api/v1/office/pupil-records";
type Filter = "all" | "missing";
const PEN_RE = /^\d{11}$/;

/**
 * Pupil records for the office — the web's /admin/pupil-records: how many
 * pupils' records can carry a certificate and how many cannot, the list
 * either way, and for each what is still blank, when the family was last
 * asked and when they answered. "Ask the families" asks every family with
 * something blank; a row's "Ask this family" asks one. Editing opens the
 * same form the family has, with the office as the writer. Above the list,
 * "Find by PEN" asks who holds a UDISE+ PEN: a pupil here with a door to
 * the record, a pupil elsewhere on Shalaghar by state alone, or nobody. Above
 * that again, while families' asks wait, each one by the pupil's name and
 * the fields asked about, leading to that pupil's record where it is decided.
 */
export function PupilRecords() {
  const t = useT();
  // A college admits students (QA-69).
  const college = useCollege();
  const th = useTheme();
  const toast = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [filter, setFilter] = useState<Filter>("missing");
  const query = useQuery({
    queryKey: ["office", "pupil-records", filter],
    placeholderData: keepPreviousData,
    queryFn: async () => officeRecordsSchema.parse(unwrap(await api().get(`${PATH}${filter === "missing" ? "?missing=1" : ""}`))),
  });
  const ask = useMutation({
    mutationFn: async (membershipIds?: string[]) => recordRequestedSchema.parse(unwrap(await api().post(`${PATH}/request`, membershipIds ? { membershipIds } : {}))),
    onSuccess: (r) => {
      toast.show(t("pupilRecord.asked", { families: r.families, asked: r.asked }), "ok");
      void qc.invalidateQueries({ queryKey: ["office", "pupil-records"] });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const [pen, setPen] = useState("");
  const [penError, setPenError] = useState<string | null>(null);
  const lookup = useMutation({
    mutationFn: async (digits: string) => penLookupSchema.parse(unwrap(await api().get(`/api/v1/office/pupils/by-pen/${digits}`))),
    onError: (e) => setPenError(e.message),
  });
  const find = () => {
    const digits = pen.replace(/[\s-]/g, "");
    lookup.reset();
    if (!PEN_RE.test(digits)) {
      setPenError(t("pupilRecord.penFormat"));
      return;
    }
    setPenError(null);
    lookup.mutate(digits);
  };
  const found: PenLookup | undefined = lookup.data;
  const sentence = found
    ? found.found === "HERE"
      ? found.pupil?.className
        ? t("pupilRecord.penFoundHere", { name: found.pupil.name, className: found.pupil.className })
        : t("pupilRecord.penFoundHereNoClass", { name: found.pupil?.name ?? "" })
      : found.found === "ELSEWHERE_ACTIVE"
        ? t("pupilRecord.penElsewhereActive")
        : found.found === "ELSEWHERE_LEFT"
          ? t("pupilRecord.penElsewhereLeft")
          : t("pupilRecord.penNone")
    : null;
  const d = query.data;
  const waiting = useOfficeRecordChanges().data?.items.filter((c) => c.status === "PENDING") ?? [];
  return (
    <Screen title={t("pupilRecord.officeTitle")} description={t("pupilRecord.officeIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {waiting.length > 0 ? (
            <Card title={t("recordChanges.officeTitle")} action={<Pill label={t("recordChanges.waitingCount", { count: waiting.length })} tone="warn" />} testID="record-changes-waiting">
              <Text variant="sm" tone="muted">
                {t("recordChanges.officeIntro")}
              </Text>
              {waiting.map((c) => (
                <Row key={c.id} title={c.studentName} caption={[c.className, fieldList(t, c.changes.map((x) => x.field))].filter(Boolean).join(" · ")} onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId: c.studentMembershipId } } as never)} />
              ))}
            </Card>
          ) : null}
          <Card title={t("pupilRecord.findByPen")}>
            <Field label={t("pupilRecord.findByPen")} hint={t("pupilRecord.findByPenHint")} value={pen} onChangeText={setPen} keyboardType="number-pad" maxLength={11} autoCapitalize="none" error={penError} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              <Button label={t("pupilRecord.findByPenGo")} variant="secondary" busy={lookup.isPending} onPress={find} />
              {found?.found === "HERE" && found.pupil ? (
                <Button label={t("pupilRecord.openRecord")} onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId: found.pupil!.membershipId } } as never)} />
              ) : null}
            </View>
            {sentence ? (
              <Text variant="sm" tone={found?.found === "HERE" ? "fg" : "muted"} accessibilityLiveRegion="polite">
                {sentence}
              </Text>
            ) : null}
          </Card>
          <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
            <Stat label={t("pupilRecord.allPupils")} value={d.total} />
            <Stat label={t("pupilRecord.complete")} value={d.complete} tone={d.complete > 0 ? "ok" : "fg"} />
            <Stat label={t("pupilRecord.onlyMissing")} value={d.incomplete} tone={d.incomplete > 0 ? "warn" : "fg"} />
          </View>
          <Tabs<Filter>
            label={t("pupilRecord.officeTitle")}
            current={filter}
            onChange={setFilter}
            tabs={[
              { key: "missing", label: t("pupilRecord.onlyMissing"), count: d.incomplete },
              { key: "all", label: t("pupilRecord.allPupils"), count: d.total },
            ]}
          />
          {d.incomplete > 0 ? <Button label={t("pupilRecord.askFamilies")} variant="secondary" busy={ask.isPending} onPress={() => ask.mutate(undefined)} /> : null}
          {d.total === 0 ? (
            <Empty icon="users" title={t("pupilRecord.noPupils")} body={t("pupilRecord.noPupilsBody")} action={<Button label={t(college ? "qaInterface.admitStudents" : "action.admitPupils")} variant="secondary" onPress={() => router.push("/(app)/intake" as never)} />} />
          ) : d.rows.length === 0 ? (
            <Empty icon="checkCircle" title={t("pupilRecord.complete")} body={t("pupilRecord.officeIntro")} action={<Button label={t("pupilRecord.allPupils")} variant="secondary" onPress={() => setFilter("all")} />} />
          ) : (
            d.rows.map((row) => {
              const complete = row.missing.length === 0;
              const when = row.familyFilledAt
                ? t("pupilRecord.filledOn", { date: formatDateKey(row.familyFilledAt.slice(0, 10), locale, { day: "numeric", month: "short", year: "numeric" }) })
                : row.requestedAt
                  ? t("pupilRecord.askedOn", { date: formatDateKey(row.requestedAt.slice(0, 10), locale, { day: "numeric", month: "short", year: "numeric" }) })
                  : t("pupilRecord.neverAsked");
              return (
                <Card key={row.studentMembershipId} title={row.studentName} action={complete ? <Pill label={t("pupilRecord.complete")} tone="ok" /> : <Pill label={t("pupilRecord.incomplete", { count: row.missing.length })} tone="warn" />}>
                  <Text variant="xs" tone="muted">
                    {[row.className, when].filter(Boolean).join(" · ")}
                  </Text>
                  {!complete ? (
                    <Text variant="sm" tone="warn">
                      {t("pupilRecord.missingList", { fields: fieldList(t, row.missing) })}
                    </Text>
                  ) : null}
                  {row.missingForFiling.length > 0 ? (
                    <Text variant="xs" tone="warn">
                      {t("filings.recordMissing", { fields: fieldList(t, row.missingForFiling) })}
                    </Text>
                  ) : null}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    <Button label={t("pupilRecord.edit")} accessibilityLabel={`${t("pupilRecord.edit")}: ${row.studentName}`} variant="secondary" onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId: row.studentMembershipId } } as never)} />
                    {!complete ? <Button label={t("pupilRecord.askSelected")} accessibilityLabel={`${t("pupilRecord.askSelected")}: ${row.studentName}`} variant="ghost" disabled={ask.isPending} onPress={() => ask.mutate([row.studentMembershipId])} /> : null}
                  </View>
                </Card>
              );
            })
          )}
        </>
      ) : null}
    </Screen>
  );
}
