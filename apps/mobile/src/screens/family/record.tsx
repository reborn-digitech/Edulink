import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { familyChildrenSchema, pupilRecordViewSchema, type PupilRecordSave } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { must, Refusal } from "../staff/shared";
import { fieldList, PenChangeSection, PupilRecordForm } from "../shared/pupil-record";
import { ChildLeftBanner, ChildSwitcher, childQuery, param } from "./shared";

const PATH = "/api/v1/family/record";

/**
 * The pupil record for the family — the web's /parent/record and /student/record:
 * the guardian fills it in for one child at a time (the switcher's children
 * come from /family/children as the overview's do; the record endpoint
 * answers for one child), the pupil for themselves with no child to choose.
 * One POST writes the record as a whole; the server answers with what still
 * blocks a certificate, and the form says so until nothing does.
 */
export function FamilyRecord() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const [childId, setChildId] = useState<string | null>(param(params.childId) ?? param(params.child) ?? null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
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
  const save = useMutation({
    mutationFn: async (body: PupilRecordSave) => pupilRecordViewSchema.parse(must(await api().post(`${PATH}${childQuery(role === "PARENT" && d ? d.studentMembershipId : null)}`, body), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      setRefusal(null);
      toast.show(t("pupilRecord.saved"), "ok");
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
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
          <Failed message={query.error.message} onRetry={() => void query.refetch()} />
        )
      ) : null}
      {d ? (
        <PupilRecordForm
          key={`${d.studentMembershipId}-${d.record?.updatedAt ?? "new"}`}
          view={d}
          intro={role === "STUDENT" ? t("pupilRecord.studentIntro") : t("pupilRecord.familyIntro")}
          busy={save.isPending}
          refusal={refusal}
          onSave={(body) => save.mutate(body)}
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
