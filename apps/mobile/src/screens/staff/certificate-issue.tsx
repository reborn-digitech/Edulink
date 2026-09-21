import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificateTemplatesViewSchema, issuedCertificateSchema, pupilRecordViewSchema } from "@edulink/contracts";
import { LOCALES } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Loading, Screen, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { Note } from "../family/shared";
import { dateProblem, fieldList } from "../shared/pupil-record";
import { Chips, must, openWeb, Refusal } from "./shared";

/**
 * Issue a certificate — the web's /admin/certificates/issue for one pupil:
 * a template from the school's active ones (designed on the web; the phone
 * only picks), a purpose for a bonafide, a remark, and for a transfer or
 * leaving certificate the date the paper should carry. What the record has
 * nothing for is said before the button, with the door to the record. The
 * server fills, numbers and freezes the document and tells the family; the
 * phone then opens it.
 */
export function CertificateIssue() {
  const { membershipId } = useLocalSearchParams<{ membershipId?: string }>();
  const t = useT();
  const th = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const [templateId, setTemplateId] = useState<string>("");
  const [purpose, setPurpose] = useState("");
  const [remark, setRemark] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [tried, setTried] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
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
            ...(purpose.trim() ? { purpose: purpose.trim() } : {}),
            ...(remark.trim() ? { remark: remark.trim() } : {}),
            ...(leaving && leftOn.trim() ? { leftOn: leftOn.trim() } : {}),
          }),
          t("common.somethingWrong"),
        ),
      ),
    onSuccess: (cert) => {
      void qc.invalidateQueries({ queryKey: ["office", "certificates"] });
      qc.setQueryData(["shared", "certificate", cert.id], cert);
      toast.show(t("certificates.issuedDone", { serial: cert.serial }), "ok");
      router.replace({ pathname: "/(app)/certificate", params: { id: cert.id } } as never);
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  if (!membershipId) {
    return (
      <Screen title={t("certificates.issueTitle")}>
        <Empty icon="users" title={t("pupilRecord.noPupils")} body={t("pupilRecord.noPupilsBody")} action={<Button label={t("pupilRecord.officeTitle")} variant="secondary" onPress={() => router.push("/(app)/pupil-records" as never)} />} />
      </Screen>
    );
  }
  const d = record.data;
  const pending = record.isPending || templates.isPending;
  const language = (code: string) => LOCALES.find((l) => l.code === code)?.native ?? code;
  return (
    <Screen title={t("certificates.issueTitle")} description={t("certificates.issueIntro")}>
      {pending ? <Loading /> : null}
      {record.isError ? <Failed message={record.error.message} onRetry={() => void record.refetch()} /> : null}
      {templates.isError ? <Failed message={templates.error.message} onRetry={() => void templates.refetch()} /> : null}
      {d && templates.data ? (
        active.length === 0 ? (
          <Empty icon="fileText" title={t("certificates.noTemplates")} body={t("certificates.noTemplatesBody")} action={<Button label={t("certificates.templatesTitle")} variant="secondary" onPress={() => openWeb("/admin/certificates")} />} />
        ) : (
          <Card title={d.studentName}>
            <Text variant="xs" tone="muted">
              {[t("certificates.pupil"), d.className, d.studentCode].filter(Boolean).join(" · ")}
            </Text>
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
