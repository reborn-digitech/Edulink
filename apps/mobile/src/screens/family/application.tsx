import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { applicationSchema, type ApplicationView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { DetailsCard, DocumentsCard, Line, nextStepFor, slotLine, StagePill } from "../shared/application";
import { must, Refusal } from "../staff/shared";
import { MY_APPLICATIONS_KEY } from "./applications";
import { Confirm, formatDateKey, Note, param } from "./shared";

const day = (iso: string, locale: string) => formatDateKey(iso.slice(0, 10), locale);

/**
 * One of the guardian's applications — the web's /parent/applications/[id]:
 * the next step at the top, the form as it was sent, the documents with
 * Attach or Replace for each the cycle asks for, the sittings to book or
 * move to while the test is still ahead, the result once it is sat, the
 * offer with Accept and Decline, and Withdraw after a question. Every
 * button is there only while the server says so (`can`).
 */
export function FamilyApplication() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = param(params.id);
  const t = useT();
  const th = useTheme();
  const { locale } = useLocale();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [withdrawing, setWithdrawing] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const key = ["family", "application", id];
  const base = `/api/v1/family/applications/${id}`;
  const query = useQuery({ queryKey: key, enabled: Boolean(id), queryFn: async () => applicationSchema.parse(unwrap(await api().get(base))) });
  const landed = (next: ApplicationView) => {
    qc.setQueryData(key, next);
    setRefusal(null);
    void qc.invalidateQueries({ queryKey: MY_APPLICATIONS_KEY });
  };
  const refuse = (e: Error) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {}));
  const post = async (tail: string, body: unknown) => applicationSchema.parse(must(await api().post(`${base}${tail}`, body), t("common.somethingWrong")));
  const attach = useMutation({ mutationFn: (doc: { key: string; fileId: string; name: string }) => post("/documents", { documents: [doc] }), onSuccess: landed, onError: refuse });
  const book = useMutation({ mutationFn: (slotId: string) => post("/book", { slotId }), onSuccess: landed, onError: refuse });
  const respond = useMutation({
    mutationFn: (answer: "ACCEPT" | "DECLINE") => post("/respond", { answer }),
    onSuccess: (next) => {
      landed(next);
      toast.show(t(next.status === "ACCEPTED" ? "admissions.statusAccepted" : "admissions.statusDeclined"), "ok");
    },
    onError: refuse,
  });
  const withdraw = useMutation({
    mutationFn: () => post("/withdraw", {}),
    onSuccess: (next) => {
      setWithdrawing(false);
      landed(next);
      toast.show(t("admissions.statusWithdrawn"), "ok");
    },
    onError: refuse,
  });
  if (!id) {
    return (
      <Screen title={t("admissions.myApplications")}>
        <Empty icon="buildings" title={t("admissions.notFound")} action={<Button label={t("admissions.myApplications")} variant="secondary" onPress={() => router.push("/(app)/my-applications" as never)} />} />
      </Screen>
    );
  }
  const a = query.data;
  return (
    <Screen title={a ? a.childName : t("admissions.myApplications")} description={a ? `${a.school.name} · ${a.cycle.name} · ${a.cycle.academicYearName}` : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {a ? (
        <>
          <Note tone={a.status === "ADMITTED" || a.status === "ACCEPTED" ? "ok" : a.status === "OFFERED" ? "warn" : "accent"}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: th.space[2] }}>
              <Text variant="xs" tone="subtle" bold>
                {t("admissions.nextStep")}
              </Text>
              <StagePill status={a.status} />
            </View>
            <Text variant="base" bold>
              {t(nextStepFor(a))}
            </Text>
          </Note>
          {refusal ? <Failed message={refusal.message} /> : null}
          {a.status === "ADMITTED" ? (
            <Card title={t("admissions.statusAdmitted")}>
              <Text variant="sm" tone="ok" bold>
                {a.admittedAt ? t("admissions.admittedOn", { date: day(a.admittedAt, locale) }) : t("admissions.nextAdmitted")}
              </Text>
              {a.feeStructureName ? <Line label={t("admissions.feeStructure")} value={a.feeStructureName} /> : null}
              <Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />
            </Card>
          ) : null}
          {a.offeredAt ? (
            <Card title={t("admissions.offerTitle")}>
              <Text variant="sm" tone="muted">
                {[t("admissions.offeredOn", { date: day(a.offeredAt, locale) }), a.feeStructureName].filter(Boolean).join(" · ")}
              </Text>
              {a.offerNote ? <Line label={t("admissions.offerNote")} value={a.offerNote} /> : null}
              {a.status === "OFFERED" && a.offerExpiresAt ? (
                <Text variant="sm" tone="warn" bold>
                  {t("admissions.respondBy", { date: day(a.offerExpiresAt, locale) })}
                </Text>
              ) : null}
              {a.respondedAt && (a.status === "ACCEPTED" || a.status === "ADMITTED") ? (
                <Text variant="sm" tone="ok" bold>
                  {t("admissions.acceptedOn", { date: day(a.respondedAt, locale) })}
                </Text>
              ) : null}
              {a.respondedAt && a.status === "DECLINED" ? (
                <Text variant="sm" tone="danger" bold>
                  {t("admissions.declinedOn", { date: day(a.respondedAt, locale) })}
                </Text>
              ) : null}
              {a.can.respond ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  <Button label={t("admissions.accept")} busy={respond.isPending && respond.variables === "ACCEPT"} onPress={() => respond.mutate("ACCEPT")} />
                  <Button label={t("admissions.decline")} variant="danger" busy={respond.isPending && respond.variables === "DECLINE"} onPress={() => respond.mutate("DECLINE")} />
                </View>
              ) : null}
            </Card>
          ) : null}
          <DocumentsCard a={a} canUpload={a.can.uploadDocuments} onAttach={(doc) => attach.mutateAsync(doc)} />
          {a.cycle.testRequired ? (
            <Card title={t("admissions.testTitle")}>
              {a.testedAt ? (
                <>
                  <Text variant="sm" tone="ok" bold>
                    {t("admissions.testedOn", { date: day(a.testedAt, locale) })}
                  </Text>
                  <Line label={t("admissions.score")} value={a.testScore} />
                  {a.testNote ? <Line label={t("admissions.testNote")} value={a.testNote} /> : null}
                </>
              ) : (
                <Line label={t("admissions.testSlot")} value={a.testSlot ? slotLine(a.testSlot, locale) : t("admissions.noSlotBooked")} />
              )}
              {a.can.bookTest ? (
                a.openSlots.length === 0 ? (
                  <Text variant="sm" tone="muted">
                    {t("admissions.noSlotsOpen")}
                  </Text>
                ) : (
                  a.openSlots.map((s) => (
                    <View key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: th.space[3], paddingVertical: th.space[1] }}>
                      <View style={{ flex: 1, gap: 1 }}>
                        <Text variant="base" bold>
                          {slotLine(s, locale)}
                        </Text>
                        <Text variant="sm" tone="muted">
                          {[t("admissions.booked", { booked: s.booked, capacity: s.capacity }), s.note].filter(Boolean).join(" · ")}
                        </Text>
                      </View>
                      {a.testSlot?.id === s.id ? null : <Button label={a.testSlot ? t("admissions.changeSlot") : t("admissions.bookSlot")} variant="secondary" busy={book.isPending && book.variables === s.id} onPress={() => book.mutate(s.id)} />}
                    </View>
                  ))
                )
              ) : null}
            </Card>
          ) : null}
          <DetailsCard a={a} />
          {a.decidedAt && a.decisionNote ? (
            <Card title={t("admissions.decideTitle")}>
              <Text variant="sm" tone="muted">
                {`${t("admissions.decidedOn", { date: day(a.decidedAt, locale) })} · ${a.decisionNote}`}
              </Text>
            </Card>
          ) : null}
          {a.status === "WITHDRAWN" && a.decidedAt ? (
            <Text variant="sm" tone="muted">
              {t("admissions.withdrawnOn", { date: day(a.decidedAt, locale) })}
            </Text>
          ) : null}
          {a.can.withdraw ? (
            withdrawing ? (
              <Confirm question={t("admissions.withdrawConfirm", { name: a.childName })} confirmLabel={t("admissions.withdraw")} busy={withdraw.isPending} onConfirm={() => withdraw.mutate()} onCancel={() => setWithdrawing(false)} />
            ) : (
              <Button label={t("admissions.withdraw")} variant="ghost" onPress={() => setWithdrawing(true)} />
            )
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}
