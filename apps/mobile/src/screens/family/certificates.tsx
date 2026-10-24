import { useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificateRequestSchema, certificatesListSchema, familyCertificateRequestsSchema, familyChildrenSchema, type CertificateRequestView } from "@edulink/contracts";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { formatPaise } from "@edulink/i18n";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, must, Refusal } from "../staff/shared";
import { CERTIFICATE_KIND, certificateRequestStatus, ChildSwitcher, childQuery, firstChild, Confirm, formatDateKey, Pill, type CertificateKind } from "./shared";

const REQUESTS = "/api/v1/family/certificate-requests";

/**
 * The certificates the school has issued — the web's /parent/certificates
 * and /student/certificates: every one for the pupil, or across a guardian's
 * children, newest first, each opening natively with its PDF. A revoked one
 * stays on the list and says so, as the web's does. Below it, the ask: a
 * kind the school has a format for and what the paper is for, sent to the
 * office; and the requests already made with where each stands — the
 * serial once issued, the reason once declined, and a way to take a
 * pending one back. A guardian asks for one child at a time (the switcher's
 * children come from /family/children as the record's do).
 *
 * A former pupil (ALUMNUS, campaign 2026-10-04, G-6) sees "Papers from the
 * school": no issued list (that door is the pupil's and the guardian's), the
 * ask for a paper again, and their asks — each with the fee the office set,
 * paid at the office, and the paper itself once issued.
 */
export function FamilyCertificates() {
  const t = useT();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const th = useTheme();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [childId, setChildId] = useState<string | null>(null);
  const [kind, setKind] = useState<CertificateKind | "">("");
  const [purpose, setPurpose] = useState("");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const guardian = role === "PARENT";
  const alumnus = role === "ALUMNUS";
  const query = useQuery({
    queryKey: ["family", "certificates"],
    // Not until the role is known: an alumnus never asks for the pupil's and guardian's issued list.
    enabled: role !== null && !alumnus,
    queryFn: async () => certificatesListSchema.parse(unwrap(await api().get("/api/v1/family/certificates"))),
  });
  const children = useQuery({
    queryKey: ["family", "children"],
    enabled: guardian,
    queryFn: async () => familyChildrenSchema.parse(unwrap(await api().get("/api/v1/family/children"))),
  });
  const pupils = children.data?.children ?? [];
  // The child the ask is for: the one chosen, else the first the server knows.
  const selectedChild = guardian ? (childId ?? firstChild(pupils)?.studentMembershipId ?? null) : null;
  const requestsKey = ["family", "certificate-requests", guardian ? selectedChild : "me"];
  const requests = useQuery({
    queryKey: requestsKey,
    enabled: role !== null,
    queryFn: async () => familyCertificateRequestsSchema.parse(unwrap(await api().get(`${REQUESTS}${childQuery(selectedChild)}`))),
  });
  const kinds = requests.data?.kinds ?? [];
  const ask = useMutation({
    mutationFn: async () => certificateRequestSchema.parse(must(await api().post(`${REQUESTS}${childQuery(selectedChild)}`, { kind, purpose: purpose.trim() }), t("common.somethingWrong"))),
    onSuccess: () => {
      setKind("");
      setPurpose("");
      setTried(false);
      setRefusal(null);
      toast.show(t("certificateRequests.asked"), "ok");
      void qc.invalidateQueries({ queryKey: ["family", "certificate-requests"] });
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  const cancel = useMutation({
    mutationFn: async (id: string) => certificateRequestSchema.parse(must(await api().post(`${REQUESTS}/${id}/cancel`, {}), t("common.somethingWrong"))),
    onSuccess: () => {
      setCancelling(null);
      toast.show(t("certificateRequests.cancelled"), "ok");
      void qc.invalidateQueries({ queryKey: ["family", "certificate-requests"] });
    },
    onError: (e) => {
      setCancelling(null);
      toast.show(e.message, "danger");
    },
  });
  const items = query.data?.items ?? [];
  const pupilCount = new Set(items.map((c) => c.studentMembershipId)).size;
  const kindLabel = (k: string) => (k in CERTIFICATE_KIND ? t(CERTIFICATE_KIND[k as CertificateKind]) : k);
  const refresh = () => {
    if (!alumnus) void query.refetch();
    void requests.refetch();
  };
  return (
    <Screen title={alumnus ? t("certificateRequests.alumniTitle") : t("certificates.myTitle")} description={alumnus ? t("certificateRequests.alumniIntro") : t("certificates.myIntro")} refreshing={query.isRefetching || requests.isRefetching} onRefresh={refresh}>
      {(alumnus ? requests.isPending : query.isPending) ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? (
        items.length === 0 ? (
          <Empty icon="fileText" title={t("certificates.noMine")} body={t("certificates.noMineBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
        ) : (
          <Card>
            {items.map((c) => (
              <Row
                key={c.id}
                title={c.title}
                caption={[pupilCount > 1 ? c.studentName : null, c.serial, t("certificates.issuedOn", { date: formatDateKey(c.issuedAt.slice(0, 10), locale) })].filter(Boolean).join(" · ")}
                right={c.revokedAt ? <Pill label={t("fees.concessionRevoked")} tone="danger" /> : undefined}
                onPress={() => router.push({ pathname: "/(app)/certificate", params: { id: c.id } } as never)}
              />
            ))}
          </Card>
        )
      ) : null}
      <ChildSwitcher pupils={pupils} selectedId={selectedChild} onSelect={setChildId} />
      {requests.isError ? <Failed message={requests.error.message} onRetry={() => void requests.refetch()} /> : null}
      {requests.data ? (
        <Card title={t("certificateRequests.askTitle")}>
          <Text variant="sm" tone="muted">
            {t("certificateRequests.askIntro")}
          </Text>
          {kinds.length === 0 ? (
            <Text variant="sm" tone="warn" accessibilityLiveRegion="polite">
              {t("certificateRequests.noKinds")}
            </Text>
          ) : (
            <>
              {refusal ? <Failed message={refusal.message} /> : null}
              <Chips<CertificateKind | ""> label={t("certificateRequests.kind")} value={kind} options={kinds.map((k) => ({ value: k, label: kindLabel(k) }))} onChange={setKind} disabled={ask.isPending} />
              {tried && !kind ? (
                <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                  {t("refusal.required")}
                </Text>
              ) : null}
              <Field label={t("certificateRequests.purpose")} placeholder={t("certificateRequests.purposePlaceholder")} value={purpose} onChangeText={setPurpose} maxLength={200} error={tried && !purpose.trim() ? t("refusal.required") : refusal?.issues.purpose} />
              <View style={{ paddingTop: th.space[2] }}>
                <Button
                  label={t("certificateRequests.ask")}
                  busy={ask.isPending}
                  onPress={() => {
                    setTried(true);
                    if (kind && purpose.trim()) ask.mutate();
                  }}
                />
              </View>
            </>
          )}
        </Card>
      ) : null}
      {requests.data ? (
        requests.data.items.length === 0 ? (
          <Empty icon="fileText" title={t("certificateRequests.none")} body={t("certificateRequests.noneBody")} action={<Button label={t("nav.overview")} variant="secondary" onPress={() => router.push("/(app)" as never)} />} />
        ) : (
          <Card title={t("certificateRequests.mine")}>
            {requests.data.items.map((r) => (
              <RequestRow
                key={r.id}
                request={r}
                kindLabel={kindLabel(r.kind)}
                confirming={cancelling === r.id}
                busy={cancel.isPending && cancel.variables === r.id}
                onCancel={() => setCancelling(r.id)}
                onConfirm={() => cancel.mutate(r.id)}
                onKeep={() => setCancelling(null)}
              />
            ))}
          </Card>
        )
      ) : null}
    </Screen>
  );
}

/** One request: the kind, what it was for, where it stands, and what the family may still do about it. */
function RequestRow({ request: r, kindLabel, confirming, busy, onCancel, onConfirm, onKeep }: { request: CertificateRequestView; kindLabel: string; confirming: boolean; busy: boolean; onCancel: () => void; onConfirm: () => void; onKeep: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const { locale } = useLocale();
  const status = certificateRequestStatus(r);
  return (
    <View style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
        <View style={{ flex: 1 }}>
          <Text variant="base" bold>
            {kindLabel}
          </Text>
          <Text variant="sm" tone="muted">
            {r.purpose}
          </Text>
        </View>
        <Pill label={t(status.label)} tone={status.tone} />
      </View>
      <Text variant="xs" tone="subtle">
        {t("certificateRequests.askedOn", { date: formatDateKey(r.createdAt.slice(0, 10), locale) })}
      </Text>
      {r.revokedAt ? (
        <Text variant="sm" tone="danger">
          {t("certificateRequests.revokedOn", { date: formatDateKey(r.revokedAt.slice(0, 10), locale) })}
        </Text>
      ) : null}
      {typeof r.feePaise === "number" && r.feePaise > 0 && r.status !== "CANCELLED" && r.status !== "DECLINED" ? (
        <Text variant="sm" tone={r.feePaid ? "ok" : "warn"}>
          {t(r.feePaid ? "certificateRequests.feePaidLine" : "certificateRequests.feeDue", { amount: formatPaise(r.feePaise, locale) })}
        </Text>
      ) : null}
      {r.status === "ISSUED" && r.serial ? (
        <Text variant="sm" tone="ok">
          {t("certificateRequests.issuedAs", { serial: r.serial })}
        </Text>
      ) : null}
      {r.status === "ISSUED" && r.certificateId ? <Button label={t("certificateRequests.openCertificate")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/certificate", params: { id: r.certificateId } } as never)} /> : null}
      {r.status === "DECLINED" && r.declineReason ? (
        <Text variant="sm" tone="danger">
          {t("certificateRequests.declinedBecause", { reason: r.declineReason })}
        </Text>
      ) : null}
      {r.status === "PENDING" ? (
        confirming ? (
          <Confirm question={t("certificateRequests.cancelQuestion", { kind: kindLabel })} confirmLabel={t("certificateRequests.cancel")} cancelLabel={t("common.keep")} busy={busy} onConfirm={onConfirm} onCancel={onKeep} />
        ) : (
          <Button label={t("certificateRequests.cancel")} variant="ghost" onPress={onCancel} />
        )
      ) : null}
    </View>
  );
}
