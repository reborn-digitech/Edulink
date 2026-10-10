import { useQuery } from "@tanstack/react-query";
import { collegeFeeStructuresSchema } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Empty, Failed, Loading, Row, Screen, Text } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useLocale, useT } from "@/lib/i18n";
import { formatDateKey } from "../staff/shared";
import { Pill } from "../family/shared";
import { money } from "@/screens/shared/desk";

/**
 * This year's fee structures on the phone (the parity batch, 10 Oct 2026,
 * R-4), the web's /accounts/structures, read only: each structure as the
 * fee regulating authority approved it — programme year and category, the
 * approval reference, the terms with their due days and totals, the late-fee
 * slabs, and how many students are on it. Adding one and raising the
 * demands stay on the web.
 */
export function FeeStructuresScreen() {
  const t = useT();
  const { locale } = useLocale();
  const query = useQuery({ queryKey: ["accounts", "fee-structures"], queryFn: async () => collegeFeeStructuresSchema.parse(unwrap(await api().get("/api/v1/accounts/fee-structures"))) });
  const d = query.data;
  return (
    <Screen title={t("collegeOffice.navStructures")} description={d ? t("collegeOffice.structuresIntro", { year: d.year?.name ?? "—" }) : undefined} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {d && d.structures.length === 0 ? <Empty icon="receipt" title={t("collegeOffice.structuresEmpty")} body={t("collegeOffice.structuresEmptyBody")} action={<Button label={t("common.retry")} variant="secondary" onPress={() => void query.refetch()} />} /> : null}
      {d?.structures.map((s) => (
        <Card key={s.id} title={s.name} action={<Pill label={t(s.published ? "deskParity.structurePublished" : "deskParity.structureDraft")} tone={s.published ? "ok" : "warn"} />}>
          <Text variant="sm" tone="muted">
            {[t("deskParity.structureYearOf", { year: s.yearOfStudy }), t(`collegeOffice.cat${s.category}` as TranslationKey), s.approvalRef ? `${t("collegeOffice.colApproval")} ${s.approvalRef}` : null, t("deskParity.structureStudents", { count: s.students })].filter(Boolean).join(" · ")}
          </Text>
          {s.terms.map((term, i) => (
            <Row key={`${s.id}-${i}`} title={term.label} caption={t("deskParity.structureDue", { date: formatDateKey(term.dueDateKey, locale) })} right={<Text>{money(term.totalPaise, locale)}</Text>} />
          ))}
          <Row title={t("collegeOffice.colTotal")} right={<Text bold>{money(s.totalPaise, locale)}</Text>} />
          {s.lateFeeSlabs.length > 0 ? (
            <Text variant="xs" tone="muted">
              {t("deskParity.structureLateFees", { slabs: s.lateFeeSlabs.map((slab) => t("deskParity.structureLateSlab", { days: slab.afterDays, amount: money(slab.paise, locale) })).join("; ") })}
            </Text>
          ) : null}
        </Card>
      ))}
    </Screen>
  );
}
