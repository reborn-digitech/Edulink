import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pupilRecordViewSchema, type PupilRecordSave } from "@edulink/contracts";
import { Button, Empty, Failed, Loading, Screen, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { PenChangeSection, PupilRecordForm, RecordChangeCard } from "../shared/pupil-record";
import { must, Refusal } from "./shared";

/**
 * One pupil's record for the office — the web's /admin/pupil-records/[id]:
 * the form the family reads, with the office as the writer, and under it
 * the door to issuing a certificate from what the record now holds. Above
 * it, while a family's ask waits, the ask itself with the two decisions:
 * approving puts their values on the record, and the form — keyed by when
 * the record last changed — then shows them. Reached from the records list
 * with the membership id in the route.
 */
export function OfficePupilRecord() {
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const base = `/api/v1/office/pupil-records/${membershipId}`;
  const key = ["office", "pupil-record", membershipId];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(membershipId),
    queryFn: async () => pupilRecordViewSchema.parse(unwrap(await api().get(base))),
  });
  const save = useMutation({
    mutationFn: async (body: PupilRecordSave) => pupilRecordViewSchema.parse(must(await api().post(base, body), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      void qc.invalidateQueries({ queryKey: ["office", "pupil-records"] });
      setRefusal(null);
      toast.show(t("pupilRecord.saved"), "ok");
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (!membershipId) {
    return (
      <Screen title={t("pupilRecord.title")}>
        <Empty icon="users" title={t("pupilRecord.noPupils")} body={t("pupilRecord.noPupilsBody")} action={<Button label={t("pupilRecord.officeTitle")} variant="secondary" onPress={() => router.push("/(app)/pupil-records" as never)} />} />
      </Screen>
    );
  }
  const d = query.data;
  return (
    <Screen title={d ? d.studentName : t("pupilRecord.title")} description={d ? [d.className, d.studentCode].filter(Boolean).join(" · ") || undefined : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d?.change ? <RecordChangeCard key={d.change.id} change={d.change} recordKey={key} /> : null}
      {d ? (
        <PupilRecordForm
          key={d.record?.updatedAt ?? "new"}
          view={d}
          intro={t("pupilRecord.intro")}
          busy={save.isPending}
          refusal={refusal}
          onSave={(body) => save.mutate(body)}
          extra={
            <View style={{ paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
              <Button label={t("certificates.issueFor")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/certificate-issue", params: { membershipId } } as never)} />
            </View>
          }
        />
      ) : null}
      {/* The PEN correction: the admin's door to proposing one, or the pending one the head decides here. */}
      {d ? <PenChangeSection key={`pen-${d.penChange?.id ?? "none"}`} view={d} recordKey={key} /> : null}
    </Screen>
  );
}
