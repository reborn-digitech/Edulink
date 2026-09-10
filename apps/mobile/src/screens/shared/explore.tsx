import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { familyExploreSchema } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Chips } from "../staff/shared";
import { Pill } from "../family/shared";

/** `?q=&country=&region=` — the server filters, as the web page does from its URL. */
export function exploreQuery(q: string, country: string, region: string): string {
  const parts: string[] = [];
  if (q) parts.push(`q=${encodeURIComponent(q)}`);
  if (country) parts.push(`country=${encodeURIComponent(country)}`);
  if (region) parts.push(`region=${encodeURIComponent(region)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Explore schools — the web's /explore: the directory of schools that have
 * published a profile, narrowed by a search, a country and a state. A school
 * opens its profile, where a guardian asks about admission; the enquiries
 * they have already opened are a tap away.
 */
export function Explore() {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const query = useQuery({
    queryKey: ["family", "explore", q, country, region],
    placeholderData: keepPreviousData,
    queryFn: async () => familyExploreSchema.parse(unwrap(await api().get(`/api/v1/family/explore${exploreQuery(q, country, region)}`))),
  });
  const d = query.data;
  const regions = country ? (d?.regionsByCountry[country] ?? []) : [];
  const filtered = Boolean(q || country || region);
  const clear = () => {
    setTyped("");
    setQ("");
    setCountry("");
    setRegion("");
  };
  const enquiries = <Button label={t("nav.enquiries")} variant="secondary" onPress={() => router.push("/(app)/enquiries" as never)} />;
  return (
    <Screen title={t("explore.title")} description={t("explore.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Field label={t("common.searchLabel")} placeholder={t("explore.searchPlaceholder")} value={typed} onChangeText={setTyped} onSubmitEditing={() => setQ(typed.trim())} returnKeyType="search" autoCapitalize="none" />
      {d && d.countries.length > 0 ? (
        <Chips
          label={t("explore.countryFilter")}
          value={country}
          options={[{ value: "", label: t("explore.anyCountry") }, ...d.countries.map((c) => ({ value: c, label: c }))]}
          onChange={(next) => {
            // A state belongs to its country: switching country must not carry the old state along.
            setCountry(next);
            setRegion("");
          }}
        />
      ) : null}
      {country && regions.length > 0 ? <Chips label={t("explore.regionFilter")} value={region} options={[{ value: "", label: t("explore.anyRegion") }, ...regions.map((r) => ({ value: r, label: r }))]} onChange={setRegion} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        d.schools.length === 0 ? (
          filtered ? (
            <Empty title={t("explore.noMatchesTitle")} body={t("explore.noMatchesBody")} action={<Button label={t("explore.clearFilters")} variant="secondary" onPress={clear} />} />
          ) : (
            <Empty title={t("explore.emptyTitle")} body={t("explore.emptyBody")} action={enquiries} />
          )
        ) : (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: th.space[2] }}>
              <Text variant="sm" tone="muted">
                {d.schools.length === 1 ? t("explore.resultsOne") : t("explore.resultsMany", { count: d.schools.length })}
              </Text>
              {enquiries}
            </View>
            {d.schools.map((school) => {
              const place = [school.city, school.region, school.country].filter(Boolean).join(", ");
              const facts = [
                school.gradeLow && school.gradeHigh ? t("explore.grades", { low: school.gradeLow, high: school.gradeHigh }) : null,
                school.openVacancies > 0 ? (school.openVacancies === 1 ? t("explore.openVacanciesOne") : t("explore.openVacanciesMany", { count: school.openVacancies })) : null,
              ].filter(Boolean);
              return (
                <Card key={school.schoolId} title={school.name} action={school.ours ? <Pill tone="accent" label={t("explore.yourSchool")} /> : null}>
                  {place ? (
                    <Text variant="sm" tone="muted">
                      {place}
                    </Text>
                  ) : null}
                  {school.about ? (
                    <Text variant="sm" tone="muted" numberOfLines={2}>
                      {school.about}
                    </Text>
                  ) : null}
                  {facts.length > 0 ? (
                    <Text variant="xs" tone="muted">
                      {facts.join(" · ")}
                    </Text>
                  ) : null}
                  <Button label={t("vacancies.viewProfile")} variant="secondary" accessibilityLabel={`${t("vacancies.viewProfile")}: ${school.name}`} onPress={() => router.push({ pathname: "/(app)/school", params: { schoolId: school.schoolId } } as never)} />
                </Card>
              );
            })}
          </>
        )
      ) : null}
    </Screen>
  );
}
