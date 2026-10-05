import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { alumniCollegeSchema, alumniCompanyLinkResultSchema, alumniReferralViewSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Pill, formatInstant, openWeb } from "@/screens/family/shared";
import { formatDateKey } from "@/screens/staff/shared";

/**
 * A COLLEGE ALUMNUS'S COLLEGE ON THE PHONE (5 Oct 2026, the campaign's alumnus
 * recommendation: "/alumni/college on the phone, five doors"). The web's
 * /alumni/college: the alumni survey while one is open; the mentoring slots a
 * mentor has offered (free, never priced); a referral into an open drive or
 * as a company, and the company an alumnus recruits for; the meets to go to
 * or not; and what the alumnus has given, with the college's receipt. The
 * doors are the web's; offering a new mentoring slot — a date, a time and a
 * meeting link — opens the web page.
 */
const GIFT_KIND_KEY: Record<string, TranslationKey> = { DONATION: "placement.giftDONATION", ENDOWMENT: "placement.giftENDOWMENT", SCHOLARSHIP: "placement.giftSCHOLARSHIP", IN_KIND: "placement.giftIN_KIND" };
export const ALUMNI_COLLEGE_KEY = ["alumni", "college"] as const;

export function AlumniCollegeScreen() {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const session = useSession();
  const placementOn = session.status === "signed-in" && (session.me.modules ?? []).includes("PLACEMENT");
  const query = useQuery({ queryKey: ALUMNI_COLLEGE_KEY, queryFn: async () => alumniCollegeSchema.parse(unwrap(await api().get("/api/v1/alumni/college"))) });
  const [driveId, setDriveId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [note, setNote] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [role, setRole] = useState("");
  const reload = () => void qc.invalidateQueries({ queryKey: ALUMNI_COLLEGE_KEY });
  const refer = useMutation({
    mutationFn: async () => alumniReferralViewSchema.parse(unwrap(await api().post("/api/v1/alumni/college/referrals", { driveId, companyName: companyName.trim(), note: note.trim() }))),
    onSuccess: () => {
      toast.show(t("placement.referralSent"), "ok");
      setDriveId(null);
      setCompanyName("");
      setNote("");
      reload();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const link = useMutation({
    mutationFn: async () => alumniCompanyLinkResultSchema.parse(unwrap(await api().post("/api/v1/alumni/college/company", { identifier: identifier.trim() || null, role: role.trim() }))),
    onSuccess: (r) => toast.show(t(r.linked ? "placement.companyLinked" : "placement.companyUnlinked"), "ok"),
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const meet = useMutation({
    mutationFn: async (v: { meetId: string; going: boolean }) => {
      unwrap(await api().post(`/api/v1/alumni/college/meets/${v.meetId}`, { going: v.going }));
      return v.going;
    },
    onSuccess: (going) => {
      toast.show(t(going ? "placement.meetRegistered" : "placement.meetCancelled"), "ok");
      reload();
    },
    onError: (e: Error) => toast.show(e.message, "danger"),
  });
  const c = query.data;
  return (
    <Screen title={t("placement.alumniCollegeTitle")} description={t("placement.alumniCollegeIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {c ? (
        <>
          {c.surveyUrl ? (
            <Card>
              <Text variant="sm">{t("placement.surveyOpen")}</Text>
              <Button label={t("placement.answerSurvey")} variant="secondary" onPress={() => router.push("/(app)/voice" as never)} />
            </Card>
          ) : null}
          <Card title={t("placement.mentoringTitle")}>
            <Text variant="sm" tone="muted">
              {c.mentor ? t("placement.mentoringIntroMentor") : t("placement.mentoringIntroNot")}
            </Text>
            {c.slots.map((s) => (
              <Row key={s.id} title={s.title} caption={formatInstant(s.startsAt, locale)} right={<Pill label={s.seatsLeft > 0 ? t("placement.slotFree") : t("placement.slotTaken")} tone={s.seatsLeft > 0 ? "ok" : "muted"} />} />
            ))}
            {c.mentor ? <Button label={t("placement.offerSlot")} variant="secondary" onPress={() => openWeb("/alumni/college")} /> : null}
          </Card>
          {placementOn ? (
            <Card title={t("placement.referTitle")}>
              <Text variant="sm" tone="muted">
                {t("placement.referIntro")}
              </Text>
              {c.referrals.map((r) => (
                <Row key={r.id} title={r.driveTitle ?? r.companyName} caption={r.note} />
              ))}
              <View accessibilityRole="radiogroup" accessibilityLabel={t("placement.fieldReferDrive")} style={{ gap: th.space[1] }}>
                <Text variant="xs" tone="subtle" bold>
                  {t("placement.fieldReferDrive")}
                </Text>
                {[{ id: null as string | null, label: t("placement.referNoDrive") }, ...c.openDrives.map((d) => ({ id: d.id as string | null, label: `${d.title} · ${d.companyName}` }))].map((o) => (
                  <Button key={o.id ?? "none"} label={o.label} variant={driveId === o.id ? "primary" : "secondary"} accessibilityRole="radio" accessibilityState={{ checked: driveId === o.id }} onPress={() => setDriveId(o.id)} />
                ))}
              </View>
              <Field label={t("placement.fieldReferCompany")} value={companyName} onChangeText={setCompanyName} maxLength={160} />
              <Field label={t("placement.fieldReferNote")} value={note} onChangeText={setNote} maxLength={1000} multiline />
              <Button label={t("placement.sendReferral")} busy={refer.isPending} disabled={note.trim().length < 3 || (!driveId && !companyName.trim())} onPress={() => refer.mutate()} />
              <Field label={t("placement.fieldMyCompanyId")} hint={t("placement.fieldMyCompanyHint")} value={identifier} onChangeText={setIdentifier} autoCapitalize="characters" maxLength={30} />
              <Field label={t("placement.fieldMyRole")} value={role} onChangeText={setRole} maxLength={120} />
              <Button label={t("placement.saveMyCompany")} variant="secondary" busy={link.isPending} onPress={() => link.mutate()} />
            </Card>
          ) : null}
          <Card title={t("placement.meetsTitle")}>
            {c.meets.length === 0 ? <Text tone="muted">{t("placement.noMeets")}</Text> : null}
            {c.meets.map((m) => (
              <View key={m.id} style={{ gap: th.space[1] }}>
                <Row title={m.title} caption={[formatDateKey(m.on, locale), m.venue || null, t("placement.goingN", { count: m.registered })].filter(Boolean).join(" · ")} />
                <Button label={m.mine ? t("placement.notGoing") : t("placement.going")} variant={m.mine ? "secondary" : "primary"} disabled={meet.isPending} accessibilityLabel={`${m.mine ? t("placement.notGoing") : t("placement.going")}: ${m.title}`} onPress={() => meet.mutate({ meetId: m.id, going: !m.mine })} />
              </View>
            ))}
          </Card>
          <Card title={t("placement.giftsTitle")}>
            <Text variant="sm" tone="muted">
              {t("placement.giftsIntroAlumnus")}
            </Text>
            {c.gifts.length === 0 ? <Text tone="muted">{t("placement.noGifts")}</Text> : null}
            {c.gifts.map((g) => (
              <Row key={g.id} title={`${t(GIFT_KIND_KEY[g.kind] ?? "placement.giftDONATION")}${g.amountRupees !== null ? ` · ₹${g.amountRupees}` : ""}`} caption={`${formatDateKey(g.on, locale)} · ${t("placement.receiptRef", { ref: g.receiptRef })}`} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
