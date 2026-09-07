import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { adminCalendarSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { Chips, formatDateKey, formatRange, openWeb } from "./shared";

type When = "" | "all";

export function calendarPath(when: When): string {
  return `/api/v1/admin/calendar${when ? `?when=${when}` : ""}`;
}

function kindLabel(t: (key: TranslationKey) => string, kind: string): string {
  const k = kind.toLowerCase();
  return ["holiday", "exam", "event"].includes(k) ? t(`calendar.${k}` as TranslationKey) : kind;
}

/**
 * The school calendar: the year and its terms, the closures and events
 * (coming up, or the whole year), approved staff leave, and birthdays —
 * staff only, as on the web. Adding an entry is the web's form.
 */
export function StaffCalendar() {
  const t = useT();
  const role = useRole();
  const { locale } = useLocale();
  const [when, setWhen] = useState<When>("");
  const query = useQuery({
    queryKey: ["admin", "calendar", when],
    placeholderData: keepPreviousData,
    queryFn: async () => adminCalendarSchema.parse(unwrap(await api().get(calendarPath(when)))),
  });
  const d = query.data;
  const year = d?.years.find((y) => y.id === d.currentYearId) ?? null;
  return (
    <Screen title={t("feature.calendar")} description={t("calendar.subtitle")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Chips
        label={t("calendar.whenLabel")}
        value={when}
        options={[
          { value: "", label: t("calendar.upcoming") },
          { value: "all", label: t("calendar.wholeYear") },
        ]}
        onChange={setWhen}
      />
      {role === "ADMIN" ? <Button label={t("calendar.addTitle")} variant="secondary" onPress={() => openWeb("/admin/calendar")} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d ? (
        <>
          <Card title={t("feature.academicYear")}>
            <Text variant="sm" tone="muted">
              {year ? `${t("calendar.yearRunning", { name: year.name })} ${formatRange(t, year.startDateKey, year.endDateKey, locale)}` : t("calendar.yearNone")}
            </Text>
            {d.terms.map((term) => (
              <Row key={term.id} title={term.name} caption={formatRange(t, term.startDateKey, term.endDateKey, locale)} right={term.current ? <Text variant="xs" tone="accent" bold>{t("calendar.upcoming")}</Text> : null} />
            ))}
          </Card>
          {d.entries.length === 0 ? (
            <Empty title={when === "all" ? t("calendar.nothingYet") : t("calendar.nothingAhead")} body={when === "all" ? t("calendar.nothingYetBody") : t("calendar.nothingAheadBody")} />
          ) : (
            <Card title={t("calendar.listTitle")}>
              {d.entries.map((e) => (
                <Row key={e.id} title={e.name} caption={[formatRange(t, e.startDateKey, e.endDateKey, locale), e.note].filter(Boolean).join(" · ")} right={<Text variant="xs" tone="muted">{kindLabel(t, e.kind)}</Text>} />
              ))}
            </Card>
          )}
          {d.leave.length > 0 ? (
            <Card title={t("calendar.staffAway")}>
              <Text variant="xs" tone="subtle">
                {t("calendar.staffAwayBody")}
              </Text>
              {d.leave.map((l) => (
                <Row key={l.id} title={l.applicantName} caption={formatRange(t, l.fromDateKey, l.toDateKey, locale)} right={l.nominatedName ? <Text variant="xs" tone="muted">{l.nominatedName}</Text> : null} />
              ))}
            </Card>
          ) : null}
          <Card title={t("calendar.birthdays")}>
            <Text variant="xs" tone="subtle">
              {t("calendar.birthdaysBody")}
            </Text>
            {d.birthdays.length === 0 ? (
              <Text variant="sm" tone="muted">
                {t("calendar.noBirthdays")}
              </Text>
            ) : (
              d.birthdays.map((b) => (
                <Row
                  key={`${b.membershipId}:${b.dateKey}`}
                  title={b.name}
                  caption={[formatDateKey(b.dateKey, locale), b.turning !== null ? t("calendar.turning", { age: b.turning }) : null, b.movedFromLeapDay ? t("calendar.bornLeapDay") : null].filter(Boolean).join(" · ")}
                  right={<Text variant="xs" tone="muted">{t(`role.${b.role.toLowerCase()}` as TranslationKey)}</Text>}
                />
              ))
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
