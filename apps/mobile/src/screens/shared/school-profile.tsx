import { useState } from "react";
import { Linking, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communitySchoolProfileSchema, enquiryOpenedSchema, schoolAdmissionsSchema } from "@edulink/contracts";
import { Button, Card, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api, errorText } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useRole } from "@/lib/session";
import { formatDateKey, param, Pill, relativeTime } from "../family/shared";
import { nextStepKey, StagePill } from "./application";
import { employmentTypeLabel } from "./vacancy-detail";

/**
 * One school's profile — the web's /explore/[schoolId], the prospectus: the
 * school's own words, counts and only counts, public standings, its latest
 * platform-wide posts and open vacancies, and for a guardian the admissions
 * door — the conversation they already have, or a first question that then
 * lives in Enquiries. The contact address and phone never reach it.
 */
export function SchoolProfile() {
  const params = useLocalSearchParams<{ schoolId?: string }>();
  const schoolId = param(params.schoolId);
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const role = useRole();
  const qc = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const query = useQuery({
    queryKey: ["community", "school", schoolId],
    enabled: Boolean(schoolId),
    queryFn: async () => communitySchoolProfileSchema.parse(unwrap(await api().get(`/api/v1/community/schools/${schoolId}`))),
  });
  // The open admission cycle and the guardian's own applications here: only a guardian applies, so only a guardian asks.
  const admissions = useQuery({
    queryKey: ["shared", "school-admissions", schoolId],
    enabled: Boolean(schoolId) && role === "PARENT",
    queryFn: async () => schoolAdmissionsSchema.parse(unwrap(await api().get(`/api/v1/shared/schools/${schoolId}/admissions`))),
  });
  const openCycles = admissions.data ? (admissions.data.cycles ?? (admissions.data.open ? [admissions.data.open] : [])) : [];
  const ask = useMutation({
    mutationFn: async (body: { schoolId: string; kind: "ADMISSION"; body: string }) => {
      const result = await api().post("/api/v1/shared/enquiries", body);
      if (!result.ok) throw new Error(errorText(result, t("common.somethingWrong")));
      return enquiryOpenedSchema.parse(result.data);
    },
    onSuccess: () => {
      setDraft("");
      setError(null);
      toast.show(t("explore.enquireSent"));
      void qc.invalidateQueries({ queryKey: ["shared", "enquiries"] });
      void qc.invalidateQueries({ queryKey: ["community", "school", schoolId] });
    },
    onError: (e) => setError(e.message),
  });

  if (!schoolId) {
    return (
      <Screen title={t("explore.title")}>
        <Failed message={t("convo.errorInvalid")} />
      </Screen>
    );
  }
  const d = query.data;
  const place = d ? [d.addressLine, d.city, d.region, d.postalCode, d.country].filter(Boolean).join(", ") : "";
  // A vacancy opens for the staff who may read one; a guardian sees the list, as the web's page shows it to them.
  const readsVacancies = role === "TEACHER" || role === "ADMIN" || role === "PRINCIPAL";
  return (
    <Screen title={d?.name ?? t("explore.title")} description={place || undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          {d.verified || d.ours ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
              {d.verified ? <Pill tone="ok" label={t("explore.verifiedBadge")} /> : null}
              {d.ours ? <Pill tone="accent" label={t("explore.yourSchool")} /> : null}
            </View>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[3] }}>
            <Stat label={t("explore.metricPupils")} value={d.metrics.pupils} />
            <Stat label={t("explore.metricTeachers")} value={d.metrics.teachers} />
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[3] }}>
            <Stat label={t("explore.metricClasses")} value={d.metrics.classes} />
            <Stat label={t("explore.metricSince")} value={String(d.sinceYear)} />
          </View>
          <Card title={t("explore.aboutTitle")}>
            <Text variant="base" tone={d.about ? "fg" : "muted"}>
              {d.about || t("explore.noAbout")}
            </Text>
            {d.gradeLow && d.gradeHigh ? (
              <Text variant="sm" tone="muted">
                {t("explore.grades", { low: d.gradeLow, high: d.gradeHigh })}
              </Text>
            ) : null}
            {/* Opened only when it is an http(s) address, whatever an older row holds (QA-27). */}
            {d.website && /^https?:\/\//i.test(d.website.trim()) ? <Row icon="globe" title={t("explore.websiteLabel")} caption={d.website} onPress={() => void Linking.openURL(d.website!.trim())} /> : null}
          </Card>
          {d.achievements.length > 0 ? (
            <Card title={t("explore.achievementsTitle")}>
              {d.achievements.map((a) => (
                <Row
                  key={a.competitionTitle}
                  icon="trophy"
                  title={a.competitionTitle}
                  caption={[a.bestRank !== null ? t("explore.bestPlace", { rank: a.bestRank }) : null, a.participants > 0 ? (a.participants === 1 ? t("explore.entrantsOne") : t("explore.entrantsMany", { count: a.participants })) : null].filter(Boolean).join(" · ") || undefined}
                />
              ))}
              <Text variant="xs" tone="subtle">
                {t("explore.achievementsNote")}
              </Text>
            </Card>
          ) : null}
          {d.highlights.length > 0 ? (
            <Card title={t("explore.highlightsTitle")}>
              {d.highlights.map((post) => (
                <Row key={post.id} icon="megaphone" title={post.title} caption={relativeTime(post.createdAt, locale)} />
              ))}
              <Text variant="xs" tone="subtle">
                {t("explore.highlightsNote")}
              </Text>
            </Card>
          ) : null}
          {d.vacancies.length > 0 ? (
            <Card title={t("explore.vacanciesTitle")}>
              {d.vacancies.map((v) => (
                <Row
                  key={v.id}
                  icon="briefcase"
                  title={v.title}
                  caption={`${employmentTypeLabel(t, v.employmentType)} · ${t("vacancies.postedAgo", { when: relativeTime(v.createdAt, locale) })}`}
                  onPress={readsVacancies ? () => router.push({ pathname: "/(app)/vacancy", params: { postingId: v.id } } as never) : undefined}
                />
              ))}
            </Card>
          ) : null}
          {/* Every open cycle (QA-17: a mid-year round beside next year's); a server before 24 Oct 2026 sends `open` alone. */}
          {role === "PARENT" && openCycles.length > 0 ? (
            <Card title={t("admissions.applyHere")}>
              {openCycles.map((cycle) => (
                <View key={cycle.cycleId} style={{ gap: th.space[1] }}>
                  <Text variant="sm" tone="muted">
                    {t("admissions.applyIntro", { cycle: cycle.name, year: cycle.academicYearName })}
                  </Text>
                  {cycle.grades.map((g) => (
                    <Text key={g.grade} variant="sm">
                      {`${t("admissions.grade")} ${g.grade} · ${t("admissions.seatsLeft", { remaining: g.remaining, seats: g.seats })}`}
                    </Text>
                  ))}
                  {cycle.closesAt ? (
                    <Text variant="sm" tone="warn">
                      {t("admissions.closesOn", { date: formatDateKey(cycle.closesAt, locale) })}
                    </Text>
                  ) : null}
                  <Button label={t("admissions.apply")} accessibilityLabel={`${t("admissions.apply")}: ${cycle.name}`} onPress={() => router.push({ pathname: "/(app)/apply", params: { schoolId: d.schoolId, school: d.name, cycleId: cycle.cycleId } } as never)} />
                </View>
              ))}
            </Card>
          ) : null}
          {role === "PARENT" && admissions.data && admissions.data.mine.length > 0 ? (
            <Card title={t("admissions.yourApplicationsHere")}>
              {admissions.data.mine.map((a) => (
                <Row key={a.id} title={a.childName} caption={`${a.cycleName} · ${t(nextStepKey(a))}`} right={<StagePill status={a.status} />} onPress={() => router.push({ pathname: "/(app)/my-application", params: { id: a.id } } as never)} />
              ))}
            </Card>
          ) : null}
          {d.canEnquire ? (
            <Card title={t("explore.admissionsTitle")}>
              {d.myEnquiryId ? (
                <>
                  <Text variant="sm" tone="muted">
                    {t("explore.yourEnquiry")}
                  </Text>
                  <Button label={t("explore.openEnquiryLink")} onPress={() => router.push({ pathname: "/(app)/enquiries/detail", params: { enquiryId: d.myEnquiryId } } as never)} />
                </>
              ) : (
                <>
                  <Text variant="sm" tone="muted">
                    {t("explore.admissionsBody")}
                  </Text>
                  <Field
                    label={t("expert.writeMessage")}
                    placeholder={t("explore.enquirePlaceholder")}
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
                  <Button label={t("explore.enquireCta")} busy={ask.isPending} disabled={draft.trim().length === 0} onPress={() => ask.mutate({ schoolId: d.schoolId, kind: "ADMISSION", body: draft.trim() })} />
                </>
              )}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
