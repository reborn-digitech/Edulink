import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminCalendarSchema, createdIdSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, formatDateKey, formatRange, MultiChips } from "./shared";

type When = "" | "all";
type Kind = "HOLIDAY" | "EXAM" | "EVENT";
export type ClosureBody = { name: string; startDateKey: string; endDateKey: string; kind: Kind; note?: string };

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function calendarPath(when: When): string {
  return `/api/v1/admin/calendar${when ? `?when=${when}` : ""}`;
}

function kindLabel(t: (key: TranslationKey) => string, kind: string): string {
  const k = kind.toLowerCase();
  // decision 0007 (6 Nov 2026): a COMPETITION row is made on the web's calendar with its competition; the phone names it.
  return ["holiday", "exam", "event", "competition"].includes(k) ? t(`calendar.${k}` as TranslationKey) : kind;
}

/**
 * The school calendar: the year and its terms, the closures and events
 * (coming up, or the whole year), approved staff leave, and birthdays —
 * staff only, as on the web. The office adds an entry here: a festival, a
 * break, an exam week or a sports day.
 */
export function StaffCalendar() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const { locale } = useLocale();
  const [when, setWhen] = useState<When>("");
  const [adding, setAdding] = useState(false);
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
      {role === "ADMIN" ? (
        adding ? (
          <AddEntry todayKey={d?.todayKey ?? ""} onClose={() => setAdding(false)} />
        ) : (
          <Button label={t("calendar.addTitle")} variant="secondary" icon={<Icon name="plus" size={20} color={th.fg} />} onPress={() => setAdding(true)} />
        )
      ) : null}
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
            <Empty
              title={when === "all" ? t("calendar.nothingYet") : t("calendar.nothingAhead")}
              body={when === "all" ? t("calendar.nothingYetBody") : t("calendar.nothingAheadBody")}
              action={
                when !== "all" ? (
                  <Button label={t("calendar.wholeYear")} variant="secondary" onPress={() => setWhen("all")} />
                ) : role === "ADMIN" ? (
                  <Button label={t("calendar.addTitle")} variant="secondary" onPress={() => setAdding(true)} />
                ) : (
                  <Button label={t("nav.messages")} variant="secondary" onPress={() => router.push("/(app)/messages" as never)} />
                )
              }
            />
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

/** A new calendar entry: what it is, what kind (only a holiday warns teachers off the register), the day or the days, and a note for staff. */
function AddEntry({ todayKey, onClose }: { todayKey: string; onClose: () => void }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("HOLIDAY");
  const [starts, setStarts] = useState("");
  const [longer, setLonger] = useState(false);
  const [ends, setEnds] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; starts?: string; ends?: string }>({});
  const add = useMutation({
    mutationFn: async (body: ClosureBody) => createdIdSchema.parse(unwrap(await api().post("/api/v1/admin/calendar/closures", body))),
    onSuccess: (_r, body) => {
      toast.show(t("calendar.added", { name: body.name }));
      void qc.invalidateQueries({ queryKey: ["admin", "calendar"] });
      void qc.invalidateQueries({ queryKey: ["admin", "overview"] });
      onClose();
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  function submit() {
    const end = longer ? ends.trim() : starts.trim();
    const next: { name?: string; starts?: string; ends?: string } = {};
    if (!name.trim()) next.name = t("calendar.needName");
    if (!DATE_KEY.test(starts.trim())) next.starts = t("calendar.needStart");
    else if (longer && !DATE_KEY.test(end)) next.ends = t("leaveKind.giveBothDates");
    else if (end < starts.trim()) next.ends = t("calendar.endBeforeStart");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    add.mutate({ name: name.trim(), startDateKey: starts.trim(), endDateKey: end, kind, ...(note.trim() ? { note: note.trim() } : {}) });
  }
  const kindHint = { HOLIDAY: t("calendar.holidayHint"), EXAM: t("calendar.examHint"), EVENT: t("calendar.eventHint") }[kind];
  return (
    <Card title={t("calendar.addTitle")}>
      <Text variant="xs" tone="subtle">
        {t("calendar.addBody")}
      </Text>
      <Field label={t("calendar.whatIsIt")} value={name} onChangeText={setName} placeholder={t("calendar.namePlaceholder")} error={errors.name} maxLength={120} />
      <Chips
        label={t("calendar.kind")}
        value={kind}
        options={[
          { value: "HOLIDAY", label: t("calendar.holidayOption") },
          { value: "EXAM", label: t("calendar.examOption") },
          { value: "EVENT", label: t("calendar.eventOption") },
        ]}
        onChange={setKind}
      />
      <Text variant="xs" tone="subtle">
        {`${kindHint} ${t("calendar.kindHint")}`}
      </Text>
      <Field label={longer ? t("calendar.starts") : t("calendar.date")} value={starts} onChangeText={setStarts} placeholder={todayKey} hint="YYYY-MM-DD" error={errors.starts} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} />
      <MultiChips label={t("common.optional")} values={longer ? ["longer"] : []} options={[{ value: "longer", label: t("calendar.lastsLonger") }]} onToggle={() => setLonger((v) => !v)} />
      {longer ? <Field label={t("calendar.ends")} value={ends} onChangeText={setEnds} placeholder={todayKey} hint={t("calendar.endsHint")} error={errors.ends} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} /> : null}
      <Field label={t("calendar.note")} value={note} onChangeText={setNote} hint={t("calendar.noteHint")} maxLength={500} />
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button label={t("calendar.addAction")} busy={add.isPending} onPress={submit} style={{ flexGrow: 1 }} />
        <Button label={t("common.cancel")} variant="ghost" onPress={onClose} />
      </View>
    </Card>
  );
}
