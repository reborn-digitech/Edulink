import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communityVacancySchema, enquiryOpenedSchema } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { param, Pill, relativeTime } from "../family/shared";

const EMPLOYMENT_TYPE: Record<string, TranslationKey> = { FULL_TIME: "vacancies.typeFullTime", PART_TIME: "vacancies.typePartTime", TEMPORARY: "vacancies.typeTemporary" };

/** A posting's employment type in the reader's words — the web's EMPLOYMENT_TYPE_KEYS, full-time for anything it does not know. */
export function employmentTypeLabel(t: Translate, type: string): string {
  return t(EMPLOYMENT_TYPE[type] ?? "vacancies.typeFullTime");
}

/**
 * One vacancy — the web's /vacancies/[postingId]: the advertisement and the
 * school behind it; for a teacher of another school, the door to the hiring
 * team (or the conversation they already have); for the posting school's own
 * staff, the contact and the enquiries the post has drawn, each one opening.
 */
export function VacancyDetail() {
  const params = useLocalSearchParams<{ postingId?: string }>();
  const postingId = param(params.postingId);
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["community", "vacancy", postingId],
    enabled: Boolean(postingId),
    queryFn: async () => communityVacancySchema.parse(unwrap(await api().get(`/api/v1/community/vacancies/${postingId}`))),
  });
  const d = query.data;
  const ask = useMutation({
    mutationFn: async (body: { schoolId: string; kind: "JOB"; jobPostingId: string; body: string }) => {
      const result = await api().post("/api/v1/shared/enquiries", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return enquiryOpenedSchema.parse(result.data);
    },
    onSuccess: () => {
      setDraft("");
      setError(null);
      toast.show(t("vacancies.enquireSent"));
      void qc.invalidateQueries({ queryKey: ["shared", "enquiries"] });
      void qc.invalidateQueries({ queryKey: ["community", "vacancy", postingId] });
    },
    onError: (e) => setError(e.message),
  });
  const openEnquiry = (enquiryId: string) => router.push({ pathname: "/(app)/enquiries/detail", params: { enquiryId } } as never);

  if (!postingId) {
    return (
      <Screen title={t("vacancies.title")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  const closed = d?.status === "CLOSED";
  const description = d ? [[d.schoolName, d.city, d.region].filter(Boolean).join(" · "), employmentTypeLabel(t, d.employmentType), t("vacancies.postedAgo", { when: relativeTime(d.createdAt, locale) })].join(" · ") : undefined;
  const drew = d && d.enquiryCount !== null ? (d.enquiryCount === 0 ? t("vacancies.enquiriesNone") : d.enquiryCount === 1 ? t("vacancies.enquiriesOne") : t("vacancies.enquiriesMany", { count: d.enquiryCount })) : null;
  return (
    <Screen title={d?.title ?? t("vacancies.title")} description={description} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {closed || d.ours ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              {closed ? <Pill label={t("vacancies.closedBadge")} /> : null}
              {d.ours ? <Pill tone="accent" label={t("explore.yourSchool")} /> : null}
            </View>
          ) : null}
          {closed ? (
            <Text variant="sm" bold tone="muted">
              {t("vacancies.closedNotice")}
            </Text>
          ) : null}
          <Card>
            <Text variant="base">{d.body}</Text>
            {d.subjects.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[1] }}>
                {d.subjects.map((s) => (
                  <Pill key={s} label={s} />
                ))}
              </View>
            ) : null}
          </Card>
          <Card>
            <Row icon="buildings" title={t("vacancies.viewProfile")} caption={d.schoolName} onPress={() => router.push({ pathname: "/(app)/school", params: { schoolId: d.schoolId } } as never)} />
          </Card>
          {d.ours && drew ? (
            <Card title={t("enquiries.title")}>
              <Text variant="sm" tone="muted">
                {[drew, d.contactName ? t("vacancies.contactCell", { name: d.contactName }) : null].filter(Boolean).join(" · ")}
              </Text>
              {d.enquiries.map((e) => (
                <Row
                  key={e.id}
                  title={e.fromName}
                  caption={[relativeTime(e.lastMessageAt, locale), e.lastMessagePreview].filter(Boolean).join(" · ")}
                  right={
                    e.status === "CLOSED" ? <Pill label={t("enquiries.closedBadge")} /> : e.unread ? <Pill tone="accent" label={t("enquiries.newBadge")} /> : undefined
                  }
                  onPress={() => openEnquiry(e.id)}
                />
              ))}
            </Card>
          ) : null}
          {d.canEnquire ? (
            <Card title={t("vacancies.enquireTitle")}>
              {d.myEnquiryId ? (
                <>
                  <Text variant="sm" tone="muted">
                    {t("vacancies.yourThread")}
                  </Text>
                  <Button label={t("vacancies.openThreadLink")} onPress={() => openEnquiry(d.myEnquiryId!)} />
                </>
              ) : (
                <>
                  <Text variant="sm" tone="muted">
                    {t("vacancies.enquireBody")}
                  </Text>
                  <Field
                    label={t("expert.writeMessage")}
                    placeholder={t("vacancies.enquirePlaceholder")}
                    value={draft}
                    onChangeText={(next) => {
                      setDraft(next);
                      setError(null);
                    }}
                    multiline
                    maxLength={5000}
                    error={error}
                    style={{ minHeight: th.tap * 2, textAlignVertical: "top", paddingTop: th.space[3] }}
                  />
                  <Button label={t("vacancies.enquireCta")} busy={ask.isPending} disabled={draft.trim().length === 0} onPress={() => ask.mutate({ schoolId: d.schoolId, kind: "JOB", jobPostingId: d.id, body: draft.trim() })} />
                </>
              )}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
