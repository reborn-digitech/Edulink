import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collegeWorkGradebookSchema, collegeWorkGradesSavedSchema, collegeWorkPostedSchema, collegeWorkPublishedSchema, type CollegeWorkGradebook } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Stat, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { formatMilli, Pill } from "../family/shared";
import { Chips } from "../staff/shared";
import { markProblem } from "../teacher/assignment-detail";
import { relativeTime } from "../teacher/support";

/**
 * ONE PIECE OF A COLLEGE OFFERING'S HOMEWORK ON THE PHONE (R-48, the risks
 * batch of 5 Oct 2026), the web's /faculty/work/[id]: publish a draft, mark
 * the registered students — what each handed in beside a mark field, saved
 * as one batch — and post the marks into one of the offering's internal
 * components (through the internal marks' one writer on the server).
 */
type Book = CollegeWorkGradebook;

export function CollegeWorkItemScreen() {
  const { assignmentId } = useLocalSearchParams<{ assignmentId?: string }>();
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({ queryKey: ["college-work", "item", assignmentId], enabled: Boolean(assignmentId), queryFn: async () => collegeWorkGradebookSchema.parse(unwrap(await api().get(`/api/v1/academics/work/${assignmentId}`))) });
  const back = <Button label={t("collegeWork.allOfferings")} variant="secondary" onPress={() => router.push("/(app)/college-work" as never)} />;
  if (!assignmentId) {
    return (
      <Screen title={t("collegeWork.markTitle")}>
        <Empty icon="clipboard" title={t("collegeWork.noWork")} action={back} />
      </Screen>
    );
  }
  const a = query.data?.assignment;
  const description = a ? [a.label, a.category, a.pointsMilli ? t("collegeWork.outOf", { points: formatMilli(a.pointsMilli) }) : null, a.dueAt ? t("collegeWork.due", { when: relativeTime(a.dueAt, locale) }) : null].filter(Boolean).join(" · ") : undefined;
  return (
    <Screen title={a?.title ?? t("collegeWork.markTitle")} description={description} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <Marking book={query.data} refresh={() => query.refetch()} back={back} /> : null}
    </Screen>
  );
}

function Marking({ book, refresh, back }: { book: Book; refresh: () => Promise<unknown>; back: React.ReactNode }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { assignment, rows, stats } = book;
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [componentId, setComponentId] = useState<string>(book.components[0]?.id ?? "");
  const was = (id: string) => {
    const r = rows.find((x) => x.membershipId === id);
    return r?.scoreMilli === null || r?.scoreMilli === undefined ? "" : String(r.scoreMilli / 1000);
  };
  const dirty = Object.entries(edits).filter(([id, v]) => v.trim() !== was(id));
  const invalid = dirty.filter(([, v]) => markProblem(v, assignment.pointsMilli));
  const after = async () => {
    await qc.invalidateQueries({ queryKey: ["college-work"] });
    await refresh();
  };
  const publish = useMutation({
    mutationFn: async () => collegeWorkPublishedSchema.parse(unwrap(await api().post(`/api/v1/academics/work/${assignment.id}/publish`, {}))),
    onSuccess: async () => {
      toast.show(t("collegeWork.published"), "ok");
      await after();
    },
  });
  const save = useMutation({
    // The comment travels as it stands, so saving a mark on the phone never clears the web's comment.
    mutationFn: async () => collegeWorkGradesSavedSchema.parse(unwrap(await api().post(`/api/v1/academics/work/${assignment.id}/grades`, { grades: dirty.map(([id, v]) => ({ studentMembershipId: id, score: v.trim() === "" ? null : Number(v), comment: rows.find((r) => r.membershipId === id)?.comment ?? "" })) }))),
    onSuccess: async (r) => {
      toast.show(t("teacher.marksSaved", { count: r.saved + r.cleared }), "ok");
      await after();
      setEdits({});
    },
  });
  const post = useMutation({
    mutationFn: async () => collegeWorkPostedSchema.parse(unwrap(await api().post(`/api/v1/academics/work/${assignment.id}/internal`, { componentId }))),
    onSuccess: async () => {
      toast.show(t("collegeWork.posted"), "ok");
      await after();
    },
  });
  return (
    <>
      {!assignment.publishedAt ? (
        <View style={{ gap: th.space[3], padding: th.space[4], borderRadius: th.radius.lg, backgroundColor: th.warnSoft }}>
          <Text variant="sm" bold tone="warn">
            {t("collegeWork.stillDraft")}
          </Text>
          {publish.isError ? <Failed message={publish.error.message} onRetry={() => publish.mutate()} /> : null}
          <Button label={t("collegeWork.publishNow")} busy={publish.isPending} onPress={() => publish.mutate()} />
        </View>
      ) : null}
      {assignment.body ? (
        <Card>
          <Text variant="sm" tone="muted">
            {assignment.body}
          </Text>
        </Card>
      ) : null}
      <View style={{ flexDirection: "row", gap: th.space[3], flexWrap: "wrap" }}>
        <Stat label={t("teacher.students")} value={stats.total} />
        <Stat label={t("teacher.handedIn")} value={stats.submitted} />
        <Stat label={t("teacher.marked")} value={stats.graded} tone={stats.total > 0 && stats.graded === stats.total ? "ok" : "warn"} />
      </View>
      {rows.length === 0 ? (
        <Empty icon="users" title={t("collegeWork.noOfferings")} body={t("collegeWork.noOfferingsBody")} action={back} />
      ) : (
        <Card title={t("teacher.students")}>
          {rows.map((r) => (
            <View key={r.membershipId} style={{ gap: th.space[2], borderTopWidth: 1, borderTopColor: th.border, paddingTop: th.space[2] }}>
              <Row title={r.name} right={r.submittedAt ? <Pill label={r.late ? t("teacher.handedInLate") : t("teacher.handedIn")} tone={r.late ? "warn" : "ok"} /> : <Pill label={t("teacher.notHandedIn")} />} />
              {r.work?.body ? <Text variant="sm">{r.work.body}</Text> : null}
              <Field
                label={t("teacher.markFor", { name: r.name })}
                value={edits[r.membershipId] ?? was(r.membershipId)}
                onChangeText={(v) => setEdits((all) => ({ ...all, [r.membershipId]: v.replace(/[^0-9.]/g, "") }))}
                keyboardType="decimal-pad"
                placeholder="—"
                hint={assignment.pointsMilli ? t("teacher.outOfPoints", { points: formatMilli(assignment.pointsMilli) }) : undefined}
                error={markProblem(edits[r.membershipId] ?? "", assignment.pointsMilli) ? t("teacher.invalidMarkOne") : undefined}
              />
            </View>
          ))}
          {save.isError ? <Failed message={save.error.message} onRetry={() => save.mutate()} /> : null}
          <Button label={t("teacher.saveMarks")} busy={save.isPending} disabled={dirty.length === 0 || invalid.length > 0} onPress={() => save.mutate()} />
        </Card>
      )}
      <Card title={t("collegeWork.postTitle")}>
        <Text variant="sm" tone="muted">
          {book.locked ? t("collegeWork.postLocked") : !assignment.pointsMilli ? t("collegeWork.postNoPoints") : book.components.length === 0 ? t("collegeWork.postNoComponents") : t("collegeWork.postBody")}
        </Text>
        {!book.locked && assignment.pointsMilli && book.components.length > 0 ? (
          <>
            <Chips label={t("collegeWork.fieldComponent")} value={componentId} onChange={setComponentId} options={book.components.map((k) => ({ value: k.id, label: t("collegeWork.componentOption", { name: k.name, max: k.maxMarks }) }))} />
            {post.isError ? (
              <Text tone="danger" accessibilityRole="alert">
                {post.error.message}
              </Text>
            ) : null}
            <Button label={t("collegeWork.postButton")} variant="secondary" busy={post.isPending} disabled={!componentId} onPress={() => post.mutate()} />
          </>
        ) : null}
      </Card>
    </>
  );
}
