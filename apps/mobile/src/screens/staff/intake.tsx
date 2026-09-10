import { useState } from "react";
import { Share, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminClassesSchema, intakeResultSchema, officeIntakePreviewSchema, type OfficeIntakePreview } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatDateKey, problemLine } from "./shared";

type IntakeResult = ReturnType<typeof intakeResultSchema.parse>;
type Outcome = IntakeResult["outcomes"][number];
type Translate = ReturnType<typeof useT>;

/** How long a first sign-in code works — the web's FIRST_SIGNIN_TTL_DAYS (lib/first-signin-constants.ts). */
const FIRST_SIGNIN_TTL_DAYS = 14;
const EXAMPLE = "name,date of birth,class,guardian email\nAarav Patel,14/06/2019,Class 1,rekha.patel@example.com\nGita Kale,13/03/2013,Class 8,,STU-7K2M-9QDX";

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function guardianWord(t: Translate, o: Outcome): string {
  if (o.guardian === "invited") return t("intake.guardianInvited");
  if (o.guardian === "notSent") return o.guardianReasonKey ? `${t("intake.guardianNotSent")} (${t(o.guardianReasonKey as TranslationKey)})` : t("intake.guardianNotSent");
  return t("intake.guardianNone");
}

/**
 * Admitting pupils from a list — the web's /admin/intake. The office pastes
 * the admission list (a header row, one child per line); the server's own
 * parser reads it back first — who is ready, which columns it recognised,
 * which rows need a look and which classes it does not know — and only then
 * does Admit write anything. The result names each child's student code,
 * handle and first sign-in code, and goes to the share sheet as a CSV,
 * because thirty codes are not something anyone copies off a screen. The
 * phone's file picker uploads a file rather than reading it, so the list is
 * pasted here; a spreadsheet's "copy" pastes as exactly this text.
 */
export function Intake() {
  const t = useT();
  const toast = useToast();
  const qc = useQueryClient();
  const router = useRouter();
  const { locale } = useLocale();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{ csv: string; data: OfficeIntakePreview } | null>(null);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const classes = useQuery({
    queryKey: ["admin", "classes", ""],
    queryFn: async () => adminClassesSchema.parse(unwrap(await api().get("/api/v1/admin/classes"))),
  });
  const check = useMutation({
    mutationFn: async (text: string) => ({ csv: text, data: officeIntakePreviewSchema.parse(unwrap(await api().post("/api/v1/office/intake/preview", { csv: text }))) }),
    onSuccess: (next) => setPreview(next),
    onError: (e) => toast.show(e.message, "danger"),
  });
  const admit = useMutation({
    mutationFn: async (text: string) => intakeResultSchema.parse(unwrap(await api().post("/api/v1/admin/people/intake", { csv: text }))),
    onSuccess: (r) => {
      setResult(r);
      setCsv("");
      setPreview(null);
      if (r.admitted > 0) toast.show(r.admitted === 1 ? t("intake.admittedOne") : t("intake.admittedMany", { count: r.admitted }));
      for (const queryKey of [["admin", "people"], ["admin", "overview"], ["admin", "classes"], ["admin", "attendance"]]) void qc.invalidateQueries({ queryKey });
    },
    onError: (e) => toast.show(e.message, "danger"),
  });
  const fresh = preview && preview.csv === csv ? preview.data : null;
  const running = (classes.data?.classes ?? []).filter((k) => !k.archivedAt);
  return (
    <Screen title={t("intake.title")} description={t("intake.subtitle")} refreshing={classes.isRefetching} onRefresh={() => void classes.refetch()}>
      {classes.isPending ? <Loading /> : null}
      {classes.isError ? <Failed message={classes.error.message} onRetry={() => void classes.refetch()} /> : null}
      {result ? (
        <Admitted result={result} onMore={() => setResult(null)} onPeople={() => router.push("/(app)/people" as never)} />
      ) : classes.data ? (
        <>
          {running.length === 0 ? (
            <Empty icon="chalkboard" title={t("classes.noClassesYet")} body={t("classes.noClassesBody")} action={<Button label={t("classes.createClass")} variant="secondary" onPress={() => router.push("/(app)/class-new" as never)} />} />
          ) : (
            <Card title={t("classes.title")}>
              <Text variant="sm" tone="muted">
                {running.map((k) => k.name).join(", ")}
              </Text>
            </Card>
          )}
          <Card>
            <Field label={t("intake.list")} hint={t("intake.columnsHelp")} value={csv} onChangeText={setCsv} placeholder={EXAMPLE} multiline autoCapitalize="none" autoCorrect={false} style={{ minHeight: 140, textAlignVertical: "top" }} />
            {fresh ? <IntakePreview preview={fresh} locale={locale} /> : null}
            {fresh && fresh.valid.length > 0 ? (
              <Button label={fresh.valid.length === 1 ? t("intake.admitOne") : t("intake.admitMany", { count: fresh.valid.length })} busy={admit.isPending} onPress={() => admit.mutate(csv)} />
            ) : fresh ? null : (
              <Button label={t("invites.checkList")} disabled={!csv.trim()} busy={check.isPending} onPress={() => check.mutate(csv)} />
            )}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

/** The parser's reading of the list, before anybody is admitted: the counts the web shows, the first names, unknown classes and every problem row. */
function IntakePreview({ preview: p, locale }: { preview: OfficeIntakePreview; locale: string }) {
  const t = useT();
  const th = useTheme();
  const columns = [t("intake.colName"), p.recognised.birthdate ? t("intake.colDob") : null, p.recognised.className ? t("intake.colClass") : null, p.recognised.guardianEmail ? t("intake.colGuardianEmail") : null, p.recognised.pupilEmail ? t("intake.colPupilEmail") : null].filter(Boolean).join(", ");
  const unknown = p.valid.filter((r) => r.unknownClass);
  const names = p.valid.slice(0, 8).map((r) => [r.name, r.birthdateKey ? formatDateKey(r.birthdateKey, locale, { day: "numeric", month: "short", year: "numeric" }) : null, r.transfer ? t("intake.linkedBadge") : null].filter(Boolean).join(" · "));
  return (
    <View accessibilityLiveRegion="polite" style={{ backgroundColor: th.surfaceMuted, borderRadius: th.radius.md, padding: th.space[3], gap: th.space[2] }}>
      <Text variant="sm" bold>
        {[t("intake.readyToAdmit", { count: p.valid.length }), p.problems.length > 0 ? t("invites.needALook", { count: p.problems.length }) : null].filter(Boolean).join(" · ")}
      </Text>
      {p.valid.length > 0 ? (
        <>
          <Text variant="xs" tone="muted">
            {[
              t("intake.recognisedColumns", { columns }),
              t("intake.withGuardian", { count: p.valid.filter((r) => r.guardianEmail).length }),
              t("intake.withoutDob", { count: p.valid.filter((r) => !r.birthdateKey).length }),
              t("intake.withoutClass", { count: p.valid.filter((r) => !r.className).length }),
            ].join(" · ")}
          </Text>
          <Text variant="xs">{[...names, p.valid.length > 8 ? t("invites.andMore", { count: p.valid.length - 8 }) : null].filter(Boolean).join(", ")}</Text>
        </>
      ) : null}
      {unknown.slice(0, 5).map((r) => (
        <Row key={`u${r.line}`} title={`${t("invites.line", { line: r.line })} · ${r.className ?? ""}`} caption={t("intake.unknownClass")} />
      ))}
      {p.problems.slice(0, 5).map((problem) => {
        const line = problemLine(t, problem);
        return <Row key={`p${problem.line}:${problem.value}`} title={line.title} caption={line.caption} />;
      })}
      {p.problems.length > 5 ? (
        <Text variant="xs" tone="muted">
          {t("invites.andMore", { count: p.problems.length - 5 })}
        </Text>
      ) : null}
    </View>
  );
}

/** Who was admitted, with what the office will be asked for; everything that was not, with why; and the list for the share sheet. */
function Admitted({ result, onMore, onPeople }: { result: IntakeResult; onMore: () => void; onPeople: () => void }) {
  const t = useT();
  const admitted = result.outcomes.filter((o) => o.status === "admitted");
  const missed = [
    ...result.problems.map((p) => problemLine(t, p)),
    ...result.outcomes.filter((o) => o.status !== "admitted").map((o) => ({ title: `${t("invites.line", { line: o.line })} · ${o.name}`, caption: o.reasonKey ? t(o.reasonKey as TranslationKey) : t(`intake.${o.status}` as TranslationKey) })),
  ];
  const share = () => {
    const header = [t("intake.colName"), t("intake.colClass"), t("intake.colStudentCode"), t("intake.colHandle"), t("firstSignin.colCode"), t("intake.colGuardian"), t("intake.colOutcome")];
    const rows = result.outcomes.map((o) => [o.name, o.className ?? "", o.studentCode ?? "", o.handle ?? "", o.firstSignInCode ?? "", o.guardian ? guardianWord(t, o) : "", t(`intake.${o.status}` as TranslationKey)]);
    void Share.share({ title: t("intake.title"), message: [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") }).catch(() => {});
  };
  return (
    <Card title={result.admitted === 1 ? t("intake.admittedOne") : t("intake.admittedMany", { count: result.admitted })}>
      {result.guardiansInvited > 0 ? (
        <Text variant="sm" bold>
          {result.guardiansInvited === 1 ? t("intake.guardiansInvitedOne") : t("intake.guardiansInvited", { count: result.guardiansInvited })}
        </Text>
      ) : null}
      <Text variant="sm" tone="muted">
        {t("intake.doneBody")}
      </Text>
      {admitted.some((o) => o.firstSignInCode) ? (
        <Text variant="sm" bold tone="warn">
          {t("firstSignin.intakeNote", { days: FIRST_SIGNIN_TTL_DAYS })}
        </Text>
      ) : null}
      {admitted.map((o) => (
        <Row
          key={o.line}
          title={o.linked ? `${o.name} · ${t("intake.linkedBadge")}` : o.name}
          caption={[o.className, o.studentCode ? `${t("intake.colStudentCode")}: ${o.studentCode}` : null, o.handle ? `${t("intake.colHandle")}: ${o.handle}` : null, o.firstSignInCode ? `${t("firstSignin.colCode")}: ${o.firstSignInCode}` : null, `${t("intake.colGuardian")}: ${guardianWord(t, o)}`].filter(Boolean).join(" · ")}
        />
      ))}
      {missed.length > 0 ? (
        <>
          <Text variant="sm" bold tone="warn">
            {t("invites.notSent", { count: missed.length })}
          </Text>
          {missed.map((m, i) => (
            <Row key={`m${i}`} title={m.title} caption={m.caption} />
          ))}
        </>
      ) : null}
      <Button label={t("intake.shareResult")} variant="secondary" onPress={share} />
      <Button label={t("intake.admitMore")} variant="secondary" onPress={onMore} />
      <Button label={t("intake.seePeople")} onPress={onPeople} />
    </Card>
  );
}
