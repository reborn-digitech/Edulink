import { useState } from "react";
import { Share, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { issuedCertificateSchema, type IssuedCertificateView } from "@edulink/contracts";
import type { Translate } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Field, Icon, Loading, Row, Screen, Text, useToast } from "@/components";
import { api, API_BASE } from "@/lib/api";
import { bytesApi, shareBytes } from "@/lib/download";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { formatDateKey, Note } from "../family/shared";
import { must, Refusal } from "../staff/shared";

/** Where the paper's foot sends a reader to check it — the web's /certificates/check, on the same host the app talks to. */
export const VERIFY_URL = `${API_BASE}/certificates/check`;

/**
 * One certificate as it was issued — natively, from the frozen document the
 * server keeps (wording, rows, layout), with the phone's share sheet instead
 * of a printer and the server's PDF through the same sheet as a file. The
 * family and the pupil's teachers read it; the office also revokes it here,
 * with a reason, when the server says it may. Reached with `?id=` from the
 * lists and from the notification the issue sends.
 */
export function CertificateView() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const t = useT();
  const th = useTheme();
  const role = useRole();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const { locale } = useLocale();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [reason, setReason] = useState("");
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const key = ["shared", "certificate", id];
  const query = useQuery({
    queryKey: key,
    enabled: Boolean(id),
    queryFn: async () => issuedCertificateSchema.parse(unwrap(await api().get(`/api/v1/shared/certificates/${id}`))),
  });
  const c = query.data;
  const revoke = useMutation({
    mutationFn: async (why: string) => issuedCertificateSchema.parse(must(await api().post(`/api/v1/office/certificates/${id}/revoke`, { reason: why }), t("common.somethingWrong"))),
    onSuccess: (next) => {
      qc.setQueryData(key, next);
      void qc.invalidateQueries({ queryKey: ["office", "certificates"] });
      setRevoking(false);
      setReason("");
      setRefusal(null);
      toast.show(t("certificates.revokedDone"), "ok");
    },
    onError: (e) => setRefusal(e instanceof Refusal ? e : new Refusal(e.message, 0, {})),
  });
  const office = role === "ADMIN" || role === "PRINCIPAL";
  if (!id) {
    return (
      <Screen title={t("certificates.title")}>
        <Empty icon="fileText" title={t("certificates.noMine")} body={t("certificates.noMineBody")} action={<Button label={t("nav.certificates")} variant="secondary" onPress={() => router.push((office ? "/(app)/staff-certificates" : "/(app)/certificates") as never)} />} />
      </Screen>
    );
  }
  const share = () => {
    if (!c) return;
    void Share.share({ title: `${c.title} · ${c.studentName}`, message: certificateText(c, t, locale) });
  };
  const downloadPdf = async () => {
    if (!c) return;
    setPdfBusy(true);
    setPdfError(null);
    const fallback = t("common.somethingWrong");
    const got = await bytesApi.get(`/api/v1/shared/certificates/${encodeURIComponent(c.id)}/pdf`, fallback);
    const error = got.ok ? await shareBytes(got, `${c.serial} - ${c.studentName}.pdf`, fallback) : got.error;
    setPdfBusy(false);
    setPdfError(error);
  };
  const brand = c?.layout.useBrandColour && c.school.brandPrimary ? c.school.brandPrimary : null;
  const address = c ? addressOf(c) : "";
  const signers = c ? signerLines(c, t) : { LEFT: null, RIGHT: null };
  const contact = c ? [c.school.contactPhone, c.school.contactEmail].filter(Boolean).join(" · ") : "";
  return (
    <Screen title={c?.title ?? t("certificates.title")} description={c ? [c.school.name, c.studentName].join(" · ") : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <View style={{ flexDirection: "row", gap: th.space[2] }}>
        <Button variant="secondary" label={t("certificates.downloadPdf")} icon={<Icon name="fileText" size={18} color={th.fg} weight="bold" />} busy={pdfBusy} disabled={!c} onPress={() => void downloadPdf()} style={{ flex: 1 }} />
        <Button label={t("mobile.share")} onPress={share} disabled={!c} style={{ flex: 1 }} />
      </View>
      {pdfError ? <Failed message={pdfError} onRetry={() => void downloadPdf()} /> : null}
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed error={query.error} onRetry={() => void query.refetch()} /> : null}
      {c ? (
        <>
          {c.revokedAt ? (
            <Note tone="danger">
              <Text variant="sm" bold tone="danger" accessibilityRole="alert">
                {t("certificates.revokedBanner", { date: formatDateKey(c.revokedAt.slice(0, 10), locale), reason: c.revokedReason ?? "" })}
              </Text>
            </Note>
          ) : null}
          {office && c.missing.length > 0 ? (
            <Note tone="warn">
              <Text variant="sm" tone="warn">
                {t("certificates.missingWarning", { fields: c.missing.join(", ") })}
              </Text>
            </Note>
          ) : null}
          <Card>
            <Text variant="lg" bold style={brand ? { color: brand } : undefined}>
              {c.school.name}
            </Text>
            {c.layout.showAddress && address ? (
              <Text variant="xs" tone="muted">
                {address}
              </Text>
            ) : null}
            {c.layout.showAddress && contact ? (
              <Text variant="xs" tone="muted">
                {contact}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: th.space[2], flexWrap: "wrap" }}>
              <Text variant="xs" tone="muted">{`${t("certificates.serial")}: ${c.serial}`}</Text>
              <Text variant="xs" tone="muted">
                {t("certificates.issuedOn", { date: formatDateKey(c.issuedAt.slice(0, 10), locale) })}
              </Text>
            </View>
            <Text variant="2xl" bold accessibilityRole="header" style={{ textAlign: "center" }}>
              {c.title}
            </Text>
            {c.intro ? <Text variant="base">{c.intro}</Text> : null}
            {c.rows.length > 0 ? (
              <View style={{ gap: th.space[1], paddingTop: th.space[2], borderTopWidth: 1, borderTopColor: th.border }}>
                {c.rows.map((row, i) => (
                  <Row key={`${i}-${row.label}`} title={`${i + 1}. ${row.label}`} right={<Text variant="sm" bold style={{ flexShrink: 1, textAlign: "right" }}>{row.value || "—"}</Text>} />
                ))}
              </View>
            ) : null}
            {c.outro ? <Text variant="base">{c.outro}</Text> : null}
            {c.remark ? (
              <Text variant="sm" tone="muted">
                {`${t("certificates.remark")}: ${c.remark}`}
              </Text>
            ) : null}
            {c.layout.signatureLeft || c.layout.signatureRight || signers.LEFT || signers.RIGHT ? (
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: th.space[3], paddingTop: th.space[5] }}>
                <View style={{ flex: 1 }}>
                  <Text variant="xs" bold tone="muted">
                    {c.layout.signatureLeft}
                  </Text>
                  {signers.LEFT ? (
                    <Text variant="xs" tone="muted">
                      {signers.LEFT}
                    </Text>
                  ) : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="xs" bold tone="muted" style={{ textAlign: "right" }}>
                    {c.layout.signatureRight}
                  </Text>
                  {signers.RIGHT ? (
                    <Text variant="xs" tone="muted" style={{ textAlign: "right" }}>
                      {signers.RIGHT}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
            {c.layout.footerNote ? (
              <Text variant="xs" tone="muted">
                {c.layout.footerNote}
              </Text>
            ) : null}
            <Text variant="xs" tone="muted" selectable>
              {t("certificates.verifyLine", { url: VERIFY_URL, code: c.code })}
            </Text>
          </Card>
          <Text variant="xs" tone="muted">
            {[c.issuedByName ? t("certificates.issuedBy", { name: c.issuedByName }) : null, `${t("certificates.codeLabel")}: ${c.code}`].filter(Boolean).join(" · ")}
          </Text>
          {c.canRevoke ? (
            revoking ? (
              <Card title={t("certificates.revoke")}>
                {refusal ? <Failed message={refusal.message} /> : null}
                <Field label={t("certificates.revokeReason")} value={reason} onChangeText={setReason} maxLength={200} multiline error={refusal?.issues.reason} />
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: th.space[2] }}>
                  <Button label={t("certificates.revoke")} variant="danger" busy={revoke.isPending} disabled={!reason.trim()} onPress={() => revoke.mutate(reason.trim())} />
                  <Button
                    label={t("common.cancel")}
                    variant="secondary"
                    disabled={revoke.isPending}
                    onPress={() => {
                      setRevoking(false);
                      setRefusal(null);
                    }}
                  />
                </View>
              </Card>
            ) : (
              <Button label={t("certificates.revoke")} variant="danger" onPress={() => setRevoking(true)} />
            )
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function addressOf(c: IssuedCertificateView): string {
  return [c.school.addressLine, c.school.city, c.school.region, c.school.postalCode].filter(Boolean).join(", ");
}

/**
 * Who signed each line, under the school's caption as typed (TA-326, the owner's decision of 14 November 2026): the
 * signer's name and the office they signed as, from what the paper stored at signing, for a line already signed and
 * no other. The same rule as the web's lib/signer-line.ts, in the reader's language as the rest of this screen.
 */
const OFFICE_WORD = { ADMIN: "certificateDefaults.signatureOffice", PRINCIPAL: "reportCardDefaults.principal", TEACHER: "reportCardDefaults.classTeacher" } as const;
export function signerLines(c: IssuedCertificateView, t: Translate): Record<"LEFT" | "RIGHT", string | null> {
  const line = (slot: "LEFT" | "RIGHT") => {
    // An answer without the list (an older server's, before the contract's default) has nothing signed to name.
    const s = (c.signatures ?? []).find((x) => x.slot === slot);
    const name = s?.signerName?.trim();
    return s && s.status === "SIGNED" && name ? t("signatures.signedByOffice", { name, office: t(OFFICE_WORD[s.role]) }) : null;
  };
  return { LEFT: line("LEFT"), RIGHT: line("RIGHT") };
}

/** The certificate as plain text for the share sheet — the same lines, top to bottom. */
export function certificateText(c: IssuedCertificateView, t: Translate, locale: string): string {
  const lines = [c.school.name];
  if (c.layout.showAddress && addressOf(c)) lines.push(addressOf(c));
  lines.push(`${t("certificates.serial")}: ${c.serial} · ${t("certificates.issuedOn", { date: formatDateKey(c.issuedAt.slice(0, 10), locale) })}`, "", c.title, "");
  if (c.intro) lines.push(c.intro, "");
  lines.push(...c.rows.map((row, i) => `${i + 1}. ${row.label}: ${row.value || "—"}`));
  if (c.outro) lines.push("", c.outro);
  if (c.remark) lines.push("", `${t("certificates.remark")}: ${c.remark}`);
  // The captions as typed, then who signed them (TA-326).
  const signers = signerLines(c, t);
  const captions = [c.layout.signatureLeft, c.layout.signatureRight].filter(Boolean).join(" · ");
  const signedBy = [signers.LEFT, signers.RIGHT].filter(Boolean).join(" · ");
  if (captions || signedBy) lines.push("", ...[captions, signedBy].filter(Boolean));
  if (c.layout.footerNote) lines.push("", c.layout.footerNote);
  lines.push("", t("certificates.verifyLine", { url: VERIFY_URL, code: c.code }));
  if (c.revokedAt) lines.push("", t("certificates.revokedBanner", { date: formatDateKey(c.revokedAt.slice(0, 10), locale), reason: c.revokedReason ?? "" }));
  return lines.join("\n");
}
