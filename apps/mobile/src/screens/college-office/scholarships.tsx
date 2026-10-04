import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { scholarshipClaimSchema, scholarshipDocumentBodySchema, studentScholarshipsSchema, type ScholarshipClaimView } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { pickAndUpload } from "@/lib/pick-file";
import { Chips } from "@/screens/family/shared";
import type { TranslationKey } from "@edulink/i18n";

/** What a document is, as the portal names it: the door's own list (contracts' scholarshipDocumentBodySchema). */
const DOC_KEYS = scholarshipDocumentBodySchema.shape.key.options;
type DocKey = (typeof DOC_KEYS)[number];
const docLabel = (t: (k: TranslationKey) => string, key: string) => t(`collegeOffice.claimDoc_${(DOC_KEYS as readonly string[]).includes(key) ? key : "other"}` as TranslationKey);

/**
 * A college student's scholarships on the phone (module SCHOLARSHIPS, 4 Oct
 * 2026), the web's /student/scholarships: their claims with the portal's id,
 * what was sanctioned and paid, and the schemes open to their category and
 * income band. A claim still open (applied or sanctioned) takes the
 * documents the portal asks for: the phone's picker uploads the file
 * (POST /api/v1/uploads, a ticket the student holds) and the ticket is spent
 * on the claim (POST /api/v1/student/scholarships/{claimId}/documents).
 */
export function StudentScholarshipsScreen() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const query = useQuery({ queryKey: ["student", "scholarships"], queryFn: async () => studentScholarshipsSchema.parse(unwrap(await api().get("/api/v1/student/scholarships"))) });
  const s = query.data;
  const money = (paise: number) => formatPaise(paise, locale);
  return (
    <Screen title={t("collegeOffice.navScholarships")} description={s ? (s.category ? t("collegeOffice.myCategory", { category: t(`collegeOffice.cat${s.category}` as TranslationKey) }) : t("collegeOffice.noCategory")) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {s && s.claims.length === 0 ? <Empty icon="receipt" title={t("collegeOffice.myClaimsEmpty")} body={t("collegeOffice.myClaimsEmptyBody")} action={<Button label={t("collegeOffice.moneyTitle")} variant="secondary" onPress={() => router.push("/(app)/money" as never)} />} /> : null}
      {s && s.claims.length > 0 ? (
        <Card>
          {s.claims.map((c) => (
            <View key={c.id}>
              <Row
                title={`${t(`collegeOffice.scheme${c.scheme}`)} · ${c.academicYear}`}
                caption={[c.portalApplicationId, c.sanctionedPaise !== null ? `${t("collegeOffice.colSanctioned")} ${money(c.sanctionedPaise)}` : null, c.disbursedPaise !== null ? `${t("collegeOffice.colDisbursed")} ${money(c.disbursedPaise)}` : null].filter(Boolean).join(" · ")}
                right={<Text tone={c.status === "DISBURSED" ? "ok" : c.status === "LAPSED" || c.status === "REJECTED" ? "danger" : "warn"}>{t(`collegeOffice.claim${c.status}`)}</Text>}
              />
              <ClaimDocuments claim={c} />
            </View>
          ))}
        </Card>
      ) : null}
      {s ? (
        <Card>
          <Text bold>{t("collegeOffice.schemesTitle")}</Text>
          {s.schemes
            .filter((x) => x.eligible && x.scheme !== "OTHER")
            .map((x) => (
              <Row key={x.scheme} title={t(`collegeOffice.scheme${x.scheme}`)} caption={x.incomeCeilingRupees !== null ? `${t("collegeOffice.colIncome")} ${money(x.incomeCeilingRupees * 100)}` : undefined} right={<Text tone="ok">{t("collegeOffice.openToYou")}</Text>} />
            ))}
        </Card>
      ) : null}
    </Screen>
  );
}

/**
 * A claim's documents, and — while the claim is still open — the way to add
 * one: choose what it is, pick the file, and the upload's ticket is spent on
 * the claim. The same file twice is listed once (the server's rule).
 */
function ClaimDocuments({ claim }: { claim: ScholarshipClaimView }) {
  const t = useT();
  const th = useTheme();
  const qc = useQueryClient();
  const [key, setKey] = useState<DocKey>("income");
  const [notice, setNotice] = useState<{ tone: "ok" | "danger"; text: string } | null>(null);
  const add = useMutation({
    mutationFn: async (): Promise<boolean> => {
      const picked = await pickAndUpload("document", t("common.somethingWrong"));
      if (!picked) return false;
      scholarshipClaimSchema.parse(unwrap(await api().post(`/api/v1/student/scholarships/${encodeURIComponent(claim.id)}/documents`, { key, fileId: picked.fileId, name: picked.name.slice(0, 120) })));
      return true;
    },
    onMutate: () => setNotice(null),
    onSuccess: (added) => {
      if (!added) return;
      setNotice({ tone: "ok", text: t("collegePhone.documentAdded") });
      void qc.invalidateQueries({ queryKey: ["student", "scholarships"] });
    },
    // A refusal from the upload (too big, wrong type) is a PickError carrying the server's sentence; the claim's own refusal is the door's.
    onError: (e: Error) => setNotice({ tone: "danger", text: e.message || t("common.somethingWrong") }),
  });
  const open = claim.status === "APPLIED" || claim.status === "SANCTIONED";
  if (!open && claim.documents.length === 0) return null;
  return (
    <View style={{ gap: th.space[2], paddingBottom: th.space[3] }}>
      {claim.documents.map((d) => (
        <Row key={d.fileId} title={d.name} caption={docLabel(t, d.key)} />
      ))}
      {open ? (
        <>
          <Text variant="xs" tone="muted">
            {t("collegePhone.documentsHint")}
          </Text>
          <Chips label={t("collegeOffice.colDocument")} value={key} onChange={setKey} options={DOC_KEYS.map((k) => ({ value: k, label: docLabel(t, k) }))} />
          <Button label={t("collegePhone.addDocument")} variant="secondary" busy={add.isPending} onPress={() => add.mutate()} />
        </>
      ) : null}
      {notice ? (
        <Text variant="sm" tone={notice.tone} accessibilityLiveRegion="polite">
          {notice.text}
        </Text>
      ) : null}
    </View>
  );
}
