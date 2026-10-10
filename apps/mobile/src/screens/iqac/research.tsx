import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RESEARCH_INDEXING, RESEARCH_KINDS, activitiesSchema, researchItemSchema, researchRegisterSchema } from "@edulink/contracts";
import type { z } from "zod";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, ShowMore, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, Notice, formatDateKey } from "../staff/shared";
import { Confirm } from "../family/shared";
import { ModuleOffScreen, OfflineDecisionNote, intOfTyped, useModuleOn } from "@/screens/shared/desk";

type ResearchItem = z.infer<typeof researchItemSchema>;
type ResearchKind = (typeof RESEARCH_KINDS)[number];
type Indexing = (typeof RESEARCH_INDEXING)[number];

/**
 * The research register on the phone (the parity batch, 10 Oct 2026, R-4):
 * the web's /faculty/research for a teacher (their own items, and a new one
 * added here through the web's door, POST /iqac/research — always their
 * own), /hod/research for a head (the department's, read) and
 * /iqac/registers for the desk (the whole college with the per-teacher
 * ratios NAAC 3.2.1 and 3.4.1 read, and the activity register beside it).
 * The door scopes the rows by role. A teacher removes their own item after
 * one ask; an item's file and the desk's additions stay on the web.
 */
export function ResearchRegisterScreen() {
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const { locale } = useLocale();
  const on = useModuleOn("IQAC");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const desk = role === "IQAC" || role === "ADMIN" || role === "PRINCIPAL";
  const title = t(role === "FACULTY" ? "iqac.navResearch" : role === "HOD" ? "iqac.navDeptResearch" : "iqac.navRegisters");
  const research = useQuery({ queryKey: ["iqac", "research"], enabled: on, queryFn: async () => researchRegisterSchema.parse(unwrap(await api().get("/api/v1/iqac/research"))) });
  const activities = useQuery({ queryKey: ["iqac", "activities"], enabled: on && (desk || role === "HOD"), queryFn: async () => activitiesSchema.parse(unwrap(await api().get("/api/v1/iqac/activities"))) });
  if (!on) return <ModuleOffScreen title={title} module="IQAC" />;
  const d = research.data;
  return (
    <Screen title={title} description={t("iqac.researchIntro")} refreshing={research.isRefetching} onRefresh={() => void research.refetch()}>
      {notice ? <Notice text={notice.text} tone={notice.tone} /> : null}
      {role === "FACULTY" || role === "HOD" ? <AddResearchCard onDone={setNotice} /> : null}
      {research.isPending ? <Loading /> : null}
      {research.isError ? <Failed message={research.error.message} onRetry={() => void research.refetch()} /> : null}
      {d ? (
        <Card title={t("iqac.researchTitle")}>
          {desk ? (
            <Text variant="sm" tone="muted">
              {t("iqac.perTeacherLine", { teachers: d.perTeacher.teachers, publications: d.perTeacher.publications.toFixed(2), books: d.perTeacher.books.toFixed(2) })}
            </Text>
          ) : null}
          {d.items.length === 0 ? (
            <Text variant="sm" tone="muted">
              {t("iqac.noResearch")}
            </Text>
          ) : null}
          <ShowMore items={d.items}>
            {(page) =>
              page.map((item) => (
                <ResearchRow key={item.id} item={item} onDone={setNotice} />
              ))
            }
          </ShowMore>
        </Card>
      ) : null}
      {desk || role === "HOD" ? (
        <Card title={t("iqac.navRegisters")}>
          {activities.isPending ? <Loading /> : null}
          {activities.isError ? <Failed message={activities.error.message} onRetry={() => void activities.refetch()} /> : null}
          {activities.data && activities.data.items.length === 0 ? <Empty icon="calendar" title={t("iqac.noActivities")} body={t("deskParity.activitiesOnWeb")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void activities.refetch()} />} /> : null}
          {activities.data && activities.data.items.length > 0 ? (
            <ShowMore items={activities.data.items}>
              {(page) => page.map((a) => <Row key={a.id} title={a.title} caption={[t(`iqac.activityKind.${a.kind}` as TranslationKey), t("iqac.activityLine", { date: formatDateKey(a.at, locale), n: a.participants })].join(" · ")} />)}
            </ShowMore>
          ) : null}
          <View style={{ height: th.space[1] }} />
        </Card>
      ) : null}
    </Screen>
  );
}

/** One item; a teacher's own carries the remove, asked once. */
function ResearchRow({ item, onDone }: { item: ResearchItem; onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const qc = useQueryClient();
  const [asked, setAsked] = useState(false);
  const remove = useMutation({
    mutationFn: async () => unwrap(await api().post(`/api/v1/iqac/research/${item.id}/remove`, {})),
    onSuccess: () => {
      setAsked(false);
      onDone({ tone: "ok", text: t("iqac.removed") });
      void qc.invalidateQueries({ queryKey: ["iqac"] });
    },
    onError: (e: Error) => {
      setAsked(false);
      onDone({ tone: "danger", text: e.message });
    },
  });
  return (
    <>
      <Row
        title={item.title}
        caption={[t(`iqac.researchKind.${item.kind}` as TranslationKey), String(item.year), item.kind === "PUBLICATION" || item.kind === "CONFERENCE" || item.kind === "BOOK" ? t(`iqac.indexing.${item.indexing}` as TranslationKey) : null, item.amountLakhs === null ? null : t("deskParity.lakhs", { amount: item.amountLakhs }), item.facultyName ?? t("iqac.facultyNone")].filter(Boolean).join(" · ")}
        right={item.mine && !asked ? <Button label={t("iqac.removeResearch")} accessibilityLabel={`${t("iqac.removeResearch")}: ${item.title}`} variant="ghost" onPress={() => setAsked(true)} /> : undefined}
      />
      {asked ? <Confirm question={t("deskParity.researchRemoveConfirm", { title: item.title })} confirmLabel={t("iqac.removeResearch")} busy={remove.isPending} onConfirm={() => remove.mutate()} onCancel={() => setAsked(false)} /> : null}
    </>
  );
}

/** A teacher's new item: kind, title, year, the indexing for a paper, the amount for a grant. */
function AddResearchCard({ onDone }: { onDone: (n: { tone: "ok" | "danger"; text: string }) => void }) {
  const t = useT();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ResearchKind>("PUBLICATION");
  const [titleText, setTitleText] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [indexing, setIndexing] = useState<Indexing>("NONE");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const money = kind === "PROJECT" || kind === "CONSULTANCY" || kind === "SEED_MONEY";
  const add = useMutation({
    mutationFn: async () => {
      const y = intOfTyped(year);
      if (y === null || y < 1950 || y > 2100) throw new Error(t("deskParity.checkYear"));
      const lakhs = amount.trim() === "" ? null : Number(amount.trim());
      if (lakhs !== null && (!Number.isFinite(lakhs) || lakhs < 0)) throw new Error(t("deskParity.checkAmount"));
      return researchItemSchema.parse(unwrap(await api().post("/api/v1/iqac/research", { kind, title: titleText.trim(), indexing, year: y, amountLakhs: money ? lakhs : null, facultyMembershipId: null, departmentId: null, fileId: null })));
    },
    onSuccess: () => {
      setOpen(false);
      setTitleText("");
      setAmount("");
      setError(null);
      onDone({ tone: "ok", text: t("iqac.researchAdded") });
      void qc.invalidateQueries({ queryKey: ["iqac"] });
    },
    onError: (e: Error) => setError(e.message),
  });
  if (!open) return <Button label={t("iqac.addResearch")} onPress={() => setOpen(true)} />;
  return (
    <Card title={t("iqac.addResearch")}>
      <Chips label={t("iqac.researchKindField")} value={kind} options={RESEARCH_KINDS.map((k) => ({ value: k, label: t(`iqac.researchKind.${k}` as TranslationKey) }))} onChange={setKind} />
      <Field label={t("iqac.titleField")} value={titleText} onChangeText={setTitleText} maxLength={400} />
      <Field label={t("iqac.yearField")} value={year} onChangeText={setYear} keyboardType="number-pad" maxLength={4} />
      {kind === "PUBLICATION" || kind === "CONFERENCE" || kind === "BOOK" ? <Chips label={t("iqac.indexingField")} value={indexing} options={RESEARCH_INDEXING.map((i) => ({ value: i, label: t(`iqac.indexing.${i}` as TranslationKey) }))} onChange={setIndexing} /> : null}
      {money ? <Field label={t("iqac.amountField")} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" maxLength={10} /> : null}
      {error ? (
        <Text variant="sm" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <Button label={t("iqac.addResearch")} disabled={titleText.trim().length < 3 || add.isPending} busy={add.isPending} onPress={() => add.mutate()} />
      <Button label={t("common.cancel")} variant="secondary" disabled={add.isPending} onPress={() => setOpen(false)} />
      <OfflineDecisionNote />
    </Card>
  );
}
