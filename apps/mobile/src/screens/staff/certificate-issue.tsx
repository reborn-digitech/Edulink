import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificateRequestSchema, certificateTemplatesViewSchema, issuedCertificateSchema, officeCertificateRequestsSchema, pupilRecordViewSchema, type CertificateRequestView } from "@edulink/contracts";
import { LOCALES } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Row, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { CERTIFICATE_KIND, certificateRequestStatus, Note, Pill, type CertificateKind } from "../family/shared";
import { dateProblem, fieldList } from "../shared/pupil-record";
import { Chips, formatDateKey, must, openWeb, Refusal } from "./shared";

const QUEUE_PATH = "/api/v1/office/certificate-requests";
const QUEUE_KEY = ["office", "certificate-requests"];

const kindLabel = (t: ReturnType<typeof useT>, kind: string) => (kind in CERTIFICATE_KIND ? t(CERTIFICATE_KIND[kind as CertificateKind]) : kind);

/**
 * Issue a certificate — the web's /admin/certificates/issue for one pupil:
 * a template from the school's active ones (designed on the web; the phone
 * only picks), a purpose for a bonafide, a remark, and for a transfer or
 * leaving certificate the date the paper should carry. What the record has
 * nothing for is said before the button, with the door to the record. The
 * server fills, numbers and freezes the document and tells the family; the
 * phone then opens it.
 *
 * Above the form, the queue of what families have asked for, pending first.
 * "Issue this" puts that pupil and a template of that kind into the form
 * with the purpose they gave, and the issue carries the request's id so it
 * is answered; "Decline" takes a reason and tells the family.
 */
export function CertificateIssue() {
  const params = useLocalSearchParams<{ membershipId?: string }>();
  const routed = params.membershipId || undefined;
  // A fresh form for each pupil the route is opened for and after each issue (TA-157): the route stays mounted as a
  // tab, and the last pupil's template, purpose, remark, leaving date and picked request went with the next one.
  const [issued, setIssued] = useState(0);
  return <IssueForm key={`${routed ?? ""}:${issued}`} routed={routed} onIssued={() => setIssued((n) => n + 1)} />;
}

function IssueForm({ routed, onIssued }: { routed: string | undefined; onIssued: () => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  // The pupil: the one a request picked, else the one the route opened with.
  const [picked, setPicked] = useState<string | null>(null);
  const membershipId = picked ?? routed;
  const [templateId, setTemplateId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [remark, setRemark] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [fromRequest, setFromRequest] = useState<CertificateRequestView | null>(null);
  const record = useQuery({
    queryKey: ["office", "pupil-record", membershipId],
    enabled: Boolean(membershipId),
    queryFn: async () => pupilRecordViewSchema.parse(unwrap(await api().get(`/api/v1/office/pupil-records/${membershipId}`))),
  });
  const templates = useQuery({
    queryKey: ["office", "certificate-templates"],
    queryFn: async () => certificateTemplatesViewSchema.parse(unwrap(await api().get("/api/v1/office/certificate-templates"))),
  });
  const active = (templates.data?.templates ?? []).filter((tp) => tp.active);
  const chosen = active.find((tp) => tp.id === templateId) ?? null;
  const leaving = chosen?.kind === "TC" || chosen?.kind === "NIRGAM";
  const dateBad = leaving ? dateProblem(t, leftOn) : undefined;
  const issue = useMutation({
    mutationFn: async () =>
      issuedCertificateSchema.parse(
        must(
          await api().post("/api/v1/office/certificates", {
            templateId,
            studentMembershipId: membershipId,
            ...(fromRequest ? { requestId: fromRequest.id } : {}),
            ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
            ...(remark.trim() ? { remark: remark.trim() } : {}),
            ...(leaving && leftOn.trim() ? { leftOn: leftOn.trim() } : {}),
          }),
          t("common.somethingWrong"),
        ),
      ),
    onSuccess: (cert) => {
      void qc.invalidateQueries({ queryKey: ["office", "certificates"] });
      void qc.invalidateQueries({ queryKey: QUEUE_KEY });
      qc.setQueryData(["shared", "certificate", cert.id], cert);
      toast.show(t("certificates.issuedDone", { serial: cert.serial }), "ok");
      onIssued();
      router.replace({ pathname: "/(app)/certificate", params: { id: cert.id } } as never);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  /** "Issue this": the pupil, a template of that kind, and the purpose the family gave. */
  const pick = (r: CertificateRequestView) => {
    const template = active.find((tp) => tp.kind === r.kind);
    setFromRequest(r);
    setPicked(r.studentMembershipId);
    setTemplateId(template?.id ?? "");
    setPurpose(r.purpose);
    setRefusal(null);
    setTried(false);
  };
  const d = record.data;
  const pending = (Boolean(membershipId) && record.isPending) || templates.isPending;
  const language = (code: string) => LOCALES.find((l) => l.code === code)?.native ?? code;
  return (
    <Screen title={t("certificates.issueTitle")} description={t("certificates.issueIntro")}>
      <RequestQueue active={active.map((tp) => tp.kind)} onIssue={pick} />
      {!membershipId ? (
        <Empty icon="users" title={t("pupilRecord.noPupils")} body={t("pupilRecord.noPupilsBody")} action={<Button label={t("pupilRecord.officeTitle")} variant="secondary" onPress={() => router.push("/(app)/pupil-records" as never)} />} />
      ) : null}
      {pending ? <Loading /> : null}
      {record.isError ? <Failed error={record.error} onRetry={() => void record.refetch()} /> : null}
      {templates.isError ? <Failed error={templates.error} onRetry={() => void templates.refetch()} /> : null}
      {d && templates.data ? (
        active.length === 0 ? (
          <Empty icon="fileText" title={t("certificates.noTemplates")} body={t("certificates.noTemplatesBody")} action={<Button label={t("certificates.templatesTitle")} variant="secondary" onPress={() => openWeb("/admin/certificates")} />} />
        ) : (
          <Card title={d.studentName}>
            <Text variant="xs" tone="muted">
              {[t("certificates.pupil"), d.className, d.studentCode].filter(Boolean).join(" · ")}
            </Text>
            {fromRequest && fromRequest.studentMembershipId === d.studentMembershipId ? (
              <Note tone="accent">
                <Text variant="sm" tone="accent">
                  {t("certificateRequests.fromRequest", { name: fromRequest.studentName, kind: kindLabel(t, fromRequest.kind), purpose: fromRequest.purpose })}
                </Text>
              </Note>
            ) : null}
            {d.missing.length > 0 ? (
              <Note tone="warn">
                <Text variant="sm" tone="warn">
                  {t("certificates.missingWarning", { fields: fieldList(t, d.missing) })}
                </Text>
                <Button label={t("certificates.fillRecord")} variant="secondary" onPress={() => router.push({ pathname: "/(app)/pupil-record", params: { membershipId } } as never)} />
              </Note>
            ) : null}
            {refusal ? <Failed message={refusal.message} /> : null}
            <Chips<string>
              label={t("certificates.template")}
              value={templateId}
              options={active.map((tp) => ({ value: tp.id, label: `${tp.name} · ${language(tp.locale)}` }))}
              onChange={setTemplateId}
              disabled={issue.isPending}
            />
            {tried && !templateId ? (
              <Text variant="xs" tone="danger" accessibilityLiveRegion="polite">
                {t("refusal.required")}
              </Text>
            ) : null}
            <Field label={t("certificates.purpose")} hint={t("certificates.purposeHint")} value={purpose} onChangeText={setPurpose} maxLength={200} error={refusal?.issues.purpose} />
            <Field label={t("certificates.remark")} value={remark} onChangeText={setRemark} maxLength={400} multiline error={refusal?.issues.remark} />
            {leaving ? <Field label={t("certificates.leftOn")} hint={`${t("certificates.leftOnHint")} · YYYY-MM-DD`} value={leftOn} onChangeText={setLeftOn} autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} error={tried && dateBad ? dateBad : refusal?.issues.leftOn} /> : null}
            <View style={{ paddingTop: th.space[2] }}>
              <Button
                label={t("certificates.issue")}
                busy={issue.isPending}
                onPress={() => {
                  setTried(true);
                  if (templateId && !dateBad) issue.mutate();
                }}
              />
            </View>
          </Card>
        )
      ) : null}
    </Screen>
  );
}

/**
 * The queue of requests from families, pending first as the server orders
 * it: who asked, for whom, which kind and what for. A pending one can be
 * issued from (the form below fills itself) or declined with a reason.
 */
function RequestQueue({ active, onIssue }: { active: string[]; onIssue: (r: CertificateRequestView) => void }) {
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [declining, setDeclining] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const query = useQuery({ queryKey: QUEUE_KEY, queryFn: async () => officeCertificateRequestsSchema.parse(unwrap(await api().get(QUEUE_PATH))) });
  const decline = useMutation({
    mutationFn: async (id: string) => certificateRequestSchema.parse(must(await api().post(`${QUEUE_PATH}/${id}/decline`, { reason: reason.trim() }), t("common.somethingWrong"))),
    onSuccess: () => {
      setDeclining(null);
      setReason("");
      setRefusal(null);
      toast.show(t("certificateRequests.declined"), "ok");
      void qc.invalidateQueries({ queryKey: QUEUE_KEY });
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (query.isPending) return <Loading />;
  if (query.isError) return <Failed error={query.error} onRetry={() => void query.refetch()} />;
  const d = query.data;
  return (
    <Card title={t("certificateRequests.queueTitle")} action={d.pending > 0 ? <Pill label={t("certificateRequests.pendingCount", { count: d.pending })} tone="warn" /> : undefined}>
      <Text variant="sm" tone="muted">
        {t("certificateRequests.queueIntro")}
      </Text>
      {d.items.length === 0 ? (
        <Empty icon="tray" title={t("certificateRequests.queueEmpty")} body={t("certificateRequests.queueEmptyBody")} action={<Button label={t("certificates.issuedTitle")} variant="ghost" onPress={() => router.push("/(app)/staff-certificates" as never)} />} />
      ) : (
        d.items.map((r) => {
          const status = certificateRequestStatus(r);
          const open = declining === r.id;
          return (
            <View key={r.id} style={{ gap: th.space[2], paddingVertical: th.space[2], borderTopWidth: 1, borderColor: th.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: th.space[2] }}>
                <View style={{ flex: 1 }}>
                  <Text variant="base" bold>
                    {[r.studentName, r.className].filter(Boolean).join(" · ")}
                  </Text>
                  <Text variant="sm">{`${kindLabel(t, r.kind)} · ${r.purpose}`}</Text>
                  <Text variant="xs" tone="subtle">
                    {`${r.requestedByName} · ${t("certificateRequests.askedOn", { date: formatDateKey(r.createdAt.slice(0, 10), locale) })}`}
                  </Text>
                </View>
                <Pill label={t(status.label)} tone={status.tone} />
              </View>
              {r.status === "DECLINED" && r.declineReason ? (
                <Text variant="xs" tone="danger">
                  {t("certificateRequests.declinedBecause", { reason: r.declineReason })}
                </Text>
              ) : null}
              {r.revokedAt ? (
                <Text variant="xs" tone="danger">
                  {t("certificateRequests.revokedOn", { date: formatDateKey(r.revokedAt.slice(0, 10), locale) })}
                </Text>
              ) : null}
              {r.status === "ISSUED" && r.serial ? (
                <Text variant="xs" tone="ok">
                  {t("certificateRequests.issuedAs", { serial: r.serial })}
                </Text>
              ) : null}
              {r.status === "PENDING" ? (
                open ? (
                  <Note tone="warn">
                    {refusal ? <Failed message={refusal.message} /> : null}
                    <Field label={t("certificateRequests.declineReason")} placeholder={t("certificateRequests.declineReasonPlaceholder")} value={reason} onChangeText={setReason} maxLength={400} multiline error={refusal?.issues.reason} />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                      <Button label={t("certificateRequests.decline")} variant="danger" busy={decline.isPending} disabled={!reason.trim()} onPress={() => decline.mutate(r.id)} />
                      <Button
                        label={t("common.cancel")}
                        variant="secondary"
                        disabled={decline.isPending}
                        onPress={() => {
                          setDeclining(null);
                          setRefusal(null);
                        }}
                      />
                    </View>
                  </Note>
                ) : (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                    <Button label={t("certificateRequests.issueFromRequest")} disabled={!active.includes(r.kind)} onPress={() => onIssue(r)} />
                    <Button
                      label={t("certificateRequests.decline")}
                      variant="secondary"
                      onPress={() => {
                        setDeclining(r.id);
                        setReason("");
                        setRefusal(null);
                      }}
                    />
                  </View>
                )
              ) : null}
            </View>
          );
        })
      )}
    </Card>
  );
}

/**
 * "Requests from families" — the card the office's overview carries while
 * a request is waiting. Draws nothing while it loads, fails, or finds the
 * queue clear: the card is a nudge, not a section.
 */
export function CertificateRequestsCard() {
  const t = useT();
  const router = useRouter();
  const query = useQuery({ queryKey: QUEUE_KEY, queryFn: async () => officeCertificateRequestsSchema.parse(unwrap(await api().get(QUEUE_PATH))) });
  const d = query.data;
  if (!d || d.pending === 0) return null;
  return (
    <Card title={t("certificateRequests.queueTitle")}>
      <Row title={t("certificateRequests.pendingCount", { count: d.pending })} onPress={() => router.push("/(app)/certificate-issue" as never)} />
    </Card>
  );
}
