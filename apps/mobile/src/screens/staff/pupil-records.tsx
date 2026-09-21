import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { officeRecordsSchema, recordRequestedSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Pill, Tabs } from "../family/shared";
import { fieldList } from "../shared/pupil-record";
import { formatDateKey } from "./shared";

const PATH = "/api/v1/office/pupil-records";
type Filter = "all" | "missing";

/**
 * Pupil records for the office — the web's /admin/pupil-records: how many
 * pupils' records can carry a certificate and how many cannot, the list
 * either way, and for each what is still blank, when the family was last
 * asked and when they answered. "Ask the families" asks every family with
 * something blank; a row's "Ask this family" asks one. Editing opens the
 * same form the family has, with the office as the writer.
 */
export function PupilRecords() {
  const t = useT();
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
  const d = query.data;
  return (
    <Screen title={t("pupilRecord.officeTitle")} description={t("pupilRecord.officeIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
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
            <Empty icon="users" title={t("pupilRecord.noPupils")} body={t("pupilRecord.noPupilsBody")} action={<Button label={t("action.admitPupils")} variant="secondary" onPress={() => router.push("/(app)/intake" as never)} />} />
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
