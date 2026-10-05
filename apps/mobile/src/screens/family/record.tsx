import { useState } from "react";
import { usePrivateScreen } from "@/lib/private-screen";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, pupilRecordViewSchema, recordChangeSchema, recordChangesListSchema, type RecordChangeFile } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { bytesApi, shareBytes } from "@/lib/download";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { must, Refusal } from "../staff/shared";
import { fieldList, PenChangeSection, PupilRecordForm, RecordChangesSection } from "../shared/pupil-record";
import { ChildLeftBanner, ChildSwitcher, childQuery, param } from "./shared";

/**
 * The pupil record for the family — the web's /parent/record and /student/record:
 * the guardian reads it for one child at a time (the switcher's children
 * come from /family/children as the overview's do; the record endpoint
 * answers for one child), the pupil their own with no child to choose.
 * Neither writes it: the record is the office's. What they send is an ask —
 * the fields they would have changed, and why — which waits above the form
 * until the office approves or declines it, or they take it back.
 */
export function FamilyRecord() {
  // A child's record, a register, a message: private while on screen (no screenshots or screen recording on the phone).
  usePrivateScreen();
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  // Counts the asks sent from here: the form is keyed by it, so a sent ask puts the form back to reading the record.
  const [sent, setSent] = useState(0);
  const family = role === "PARENT" || role === "STUDENT";
  const children = useQuery({
    queryKey: ["family", "children"],
    enabled: role === "PARENT",
    queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))),
  });
  const key = ["family", "record", role === "PARENT" ? childId : "me"];
  const query = useQuery({
    queryKey: key,
    enabled: family,
    queryFn: async () => pupilRecordViewSchema.parse(unwrap(await api().get(`/api/v1/family/record${childQuery(role === "PARENT" ? childId : null)}`))),
  });
  const d = query.data;
  const changesKey = ["family", "record-changes", role === "PARENT" ? childId : "me"];
  const changes = useQuery({
    queryKey: changesKey,
    enabled: family,
    queryFn: async () => recordChangesListSchema.parse(unwrap(await api().get(`/api/v1/family/record/changes${childQuery(role === "PARENT" ? childId : null)}`))),
  });
  const ask = useMutation({
    mutationFn: async (body: RecordChangeFile) => recordChangeSchema.parse(must(await api().post(`/api/v1/family/record/changes${childQuery(role === "PARENT" && d ? d.studentMembershipId : null)}`, body), t("common.somethingWrong"))),
    onSuccess: () => {
      setRefusal(null);
      setSent((n) => n + 1);
      toast.show(t("recordChanges.sent"), "ok");
      void qc.invalidateQueries({ queryKey: key });
      void qc.invalidateQueries({ queryKey: ["family", "record-changes"] });
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  // The asks on this record, the waiting one first as the server sorts them; the record's own copy of the waiting one while the list is on its way.
  const asks = changes.data?.items ?? (d?.change ? [d.change] : []);
  if (role !== null && !family) {
    return (
      <Screen title={t("pupilRecord.title")}>
        <Empty icon="clipboard" title={t("pupilRecord.title")} body={t("pupilRecord.intro")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
      </Screen>
    );
  }
  const pupils = children.data?.children ?? [];
  const selected = pupils.find((c) => c.studentMembershipId === (d?.studentMembershipId ?? childId));
  return (
    <Screen title={d ? d.studentName : t("pupilRecord.title")} description={d ? [d.className, d.studentCode].filter(Boolean).join(" · ") || undefined : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <ChildSwitcher
        pupils={pupils}
        selectedId={d?.studentMembershipId ?? childId}
        onSelect={(id) => {
          setChildId(id);
          setRefusal(null);
        }}
      />
      {selected?.leftAt ? <ChildLeftBanner name={selected.name} leftAt={selected.leftAt} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? (
        children.data && pupils.length === 0 ? (
          <Empty title={t("parent.linkToYourChild")} body={t("parent.linkNeedCode")} action={<Button label={t("parent.linkToMyChild")} onPress={() => router.push("/(app)/link-child" as never)} />} />
        ) : (
          <Failed error={query.error} onRetry={() => void query.refetch()} />
        )
      ) : null}
      {/* The identity card (5 Oct 2026): a PDF drawn from the record on every read, shared from the phone. */}
      {d ? <IdCardButton studentMembershipId={role === "PARENT" ? d.studentMembershipId : null} /> : null}
      {/* What has been asked of the office sits above the record: the form is long, and an ask that waits should be seen before it is asked again. */}
      {d ? <RecordChangesSection items={asks} recordKey={key} /> : null}
      {d ? (
        <PupilRecordForm
          key={`${d.studentMembershipId}-${d.record?.updatedAt ?? "new"}-${sent}`}
          view={d}
          intro={role === "STUDENT" ? t("pupilRecord.studentIntro") : t("pupilRecord.familyIntro")}
          busy={ask.isPending}
          refusal={refusal}
          onAsk={(body) => ask.mutate(body)}
        />
      ) : null}
      {/* A correction to the PEN the office has proposed: the guardian's word is one of the two it needs; the pupil reads where it stands. */}
      {d ? <PenChangeSection key={`pen-${d.studentMembershipId}-${d.penChange?.id ?? "none"}`} view={d} recordKey={key} /> : null}
    </Screen>
  );
}

/**
 * "Complete the school record" — the card both family homes carry while a
 * certificate field is still blank. It asks for the record itself (the
 * overview does not carry it) and draws nothing while it loads, fails, or
 * finds the record complete: the card is a nudge, not a section.
 */
export function CompleteRecordCard({ childId }: { childId?: string | null }) {
  const t = useT();
  const router = useRouter();
  const role = useRole();
  const query = useQuery({
    queryKey: ["family", "record", role === "PARENT" ? (childId ?? null) : "me"],
    enabled: role === "PARENT" || role === "STUDENT",
    queryFn: async () => pupilRecordViewSchema.parse(unwrap(await api().get(`/api/v1/family/record${childQuery(role === "PARENT" ? childId : null)}`))),
  });
  const d = query.data;
  if (!d || d.missing.length === 0) return null;
  return (
    <Card title={t("pupilRecord.completeCard")} action={<Button variant="ghost" label={t("pupilRecord.completeCardAction")} onPress={() => router.push({ pathname: "/(app)/record", params: childId ? { child: childId } : {} } as never)} />}>
      <Text variant="sm" tone="muted">
        {t("pupilRecord.completeCardBody", { fields: fieldList(t, d.missing) })}
      </Text>
    </Card>
  );
}

/**
 * The student's identity card as a PDF (5 Oct 2026; GET /api/v1/id-cards/pdf): a student's own, a guardian's child's.
 * An adult at a college keeps their own card, and the server's refusal says so to a guardian who asks.
 */
export function IdCardButton({ studentMembershipId }: { studentMembershipId: string | null }) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const download = async () => {
    setBusy(true);
    setError(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(`/api/v1/id-cards/pdf${studentMembershipId ? `?student=${encodeURIComponent(studentMembershipId)}` : ""}`, fallback);
    const failed = got.ok ? await shareBytes(got, "id-card.pdf", fallback) : got.error;
    setBusy(false);
    setError(failed);
  };
  return (
    <>
      <Button label={t("collegeDesks.idCardDownload")} variant="secondary" busy={busy} onPress={() => void download()} />
      {error ? <Failed message={error} /> : null}
    </>
  );
}
