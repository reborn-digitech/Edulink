import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { myFacultyPublicProfileSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Confirm, Pill } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, useModuleOn } from "@/screens/shared/desk";

/** The record's codes said in the reader's language where the dictionary has them; the code itself otherwise. */
function coded(t: (key: TranslationKey) => string, prefix: "iqac.designation" | "iqac.qualification" | "iqac.researchKind" | "iqac.indexing", code: string, known: readonly string[]): string {
  return known.includes(code) ? t(`${prefix}.${code}` as TranslationKey) : code;
}
const DESIGNATIONS = ["PRINCIPAL", "PROFESSOR", "ASSOCIATE_PROFESSOR", "ASSISTANT_PROFESSOR", "LECTURER", "VISITING_FACULTY"];
const QUALIFICATIONS = ["PHD", "MPHIL", "PG", "UG", "OTHER"];
const RESEARCH = ["PUBLICATION", "PATENT", "PROJECT", "CONSULTANCY", "BOOK", "CONFERENCE", "PHD_GUIDED", "AWARD", "MOU", "SEED_MONEY"];
const INDEXING = ["UGC_CARE", "SCOPUS", "WEB_OF_SCIENCE", "PEER_REVIEWED", "NONE"];

/**
 * A teacher's public page on the phone (the parity batch, 10 Oct 2026, R-4),
 * the web's /faculty/profile: whether the office has written my record, the
 * preview the college's website would show (name, designation, department,
 * qualification, years, research titles — no contact detail, no PAN, no
 * student), and whether it is up. Only the teacher puts it up, refreshes it
 * from today's rows or takes it down, through the web's door (POST
 * /faculty/profile); taking it down is asked once. Each is a decision, sent
 * live and never queued.
 */
export function FacultyProfileScreen() {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const on = useModuleOn("IQAC");
  const [asked, setAsked] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const query = useQuery({ queryKey: ["faculty", "profile"], enabled: on, queryFn: async () => myFacultyPublicProfileSchema.parse(unwrap(await api().get("/api/v1/faculty/profile"))) });
  const set = useMutation({
    mutationFn: async (publish: boolean) => myFacultyPublicProfileSchema.parse(unwrap(await api().post("/api/v1/faculty/profile", { publish }))),
    onSuccess: (_d, publish) => {
      setAsked(false);
      setNotice({ tone: "ok", text: t(publish ? "deskParity.profilePublished" : "deskParity.profileTakenDown") });
      void qc.invalidateQueries({ queryKey: ["faculty", "profile"] });
    },
    onError: (e: Error) => {
      setAsked(false);
      setNotice({ tone: "danger", text: e.message });
    },
  });
  if (!on) return <ModuleOffScreen title={t("collegeDesks.profileNav")} module="IQAC" />;
  const d = query.data;
  const p = d?.preview ?? null;
  return (
    <Screen title={t("collegeDesks.profileNav")} description={t("deskParity.profileIntro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {notice ? (
        <Text variant="sm" tone={notice.tone} accessibilityLiveRegion="polite">
          {notice.text}
        </Text>
      ) : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && !d.hasRecord ? <Empty icon="user" title={t("deskParity.profileNoRecord")} body={t("deskParity.profileNoRecordBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d && p ? (
        <Card title={p.name} action={<Pill label={t(d.publishedAt ? "deskParity.profileUp" : "deskParity.profileDown")} tone={d.publishedAt ? "ok" : "muted"} />}>
          <Text variant="sm" tone="muted">
            {[p.collegeName, p.departmentName, coded(t, "iqac.designation", p.designation, DESIGNATIONS), coded(t, "iqac.qualification", p.qualification, QUALIFICATIONS), p.netSetQualified ? t("deskParity.netSet") : null, t("deskParity.yearsN", { n: p.experienceYears })].filter(Boolean).join(" · ")}
          </Text>
          {p.research.length === 0 ? (
            <Text variant="sm" tone="muted">
              {t("iqac.noResearch")}
            </Text>
          ) : null}
          {p.research.slice(0, 20).map((r, i) => (
            <Row key={`${r.title}-${i}`} title={r.title} caption={[coded(t, "iqac.researchKind", r.kind, RESEARCH), String(r.year), r.indexing !== "NONE" ? coded(t, "iqac.indexing", r.indexing, INDEXING) : null].filter(Boolean).join(" · ")} />
          ))}
          {d.url ? (
            <Text variant="xs" tone="muted" selectable>
              {d.url}
            </Text>
          ) : null}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
            <Button label={t(d.publishedAt ? "deskParity.profileRefresh" : "deskParity.profilePublish")} disabled={set.isPending} busy={set.isPending && !asked} onPress={() => set.mutate(true)} />
            {d.publishedAt && !asked ? <Button label={t("deskParity.profileTakeDown")} variant="secondary" disabled={set.isPending} onPress={() => setAsked(true)} /> : null}
          </View>
          {asked ? <Confirm question={t("deskParity.profileTakeDownConfirm")} confirmLabel={t("deskParity.profileTakeDown")} busy={set.isPending} onConfirm={() => set.mutate(false)} onCancel={() => setAsked(false)} /> : null}
          <OfflineDecisionNote />
        </Card>
      ) : null}
    </Screen>
  );
}
