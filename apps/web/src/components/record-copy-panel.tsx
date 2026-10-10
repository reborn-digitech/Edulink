import { ArrowsLeftRightIcon } from "@phosphor-icons/react/ssr";
import type { RecordCopyPreview } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { recordValueText } from "@/components/pupil-record-words";
import { RecordCopyButton } from "./record-copy-button";

/**
 * THE OFFER (R-69, 10 Oct 2026): after an admission matched by PEN, the admit
 * panel on the application page and the pupil's record page show what the
 * previous school's record holds — each coded line with its value, marked
 * blank here (to be copied) or already filled (kept) — and one button. Drawn
 * only when the server found a previous school's record (a non-PEN
 * admission has none, so no offer); the button only for the office while a
 * line is blank. The preview comes from record-copy.ts, which reads the lines
 * under the roll clause and nothing else of the old record.
 */
export async function RecordCopyPanel({ preview, office }: { preview: RecordCopyPreview | null; office: boolean }) {
  if (!preview) return null;
  const t = await getT();
  const locale = await getLocale();
  const label = (field: string) => t(`pupilRecord.${field}` as TranslationKey);
  return (
    <Card data-testid="record-copy-panel">
      <CardHeader icon={<ArrowsLeftRightIcon weight="duotone" className="size-5" />} title={t("ownerDecisions.copyTitle")} description={t("ownerDecisions.copyIntro", { school: preview.fromSchoolName })} />
      <CardBody className="space-y-3">
        {preview.lines.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("ownerDecisions.copyNothing")}</p>
        ) : (
          <dl className="grid gap-2 sm:grid-cols-2">
            {preview.lines.map((l) => (
              <div key={l.field} className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2" data-testid="record-copy-line" data-blank={l.blankHere ? "yes" : "no"}>
                <dt className="text-xs uppercase tracking-wide text-fg-muted">{label(l.field)}</dt>
                <dd className="mt-0.5 flex flex-wrap items-center justify-between gap-2 text-sm text-fg">
                  <span>{recordValueText(t, l.field, l.value)}</span>
                  <Badge tone={l.blankHere ? "warn" : "neutral"} size="sm">{t(l.blankHere ? "ownerDecisions.copyLineBlank" : "ownerDecisions.copyLineKept")}</Badge>
                </dd>
              </div>
            ))}
          </dl>
        )}
        {preview.copiedAt && <p className="text-xs text-fg-muted">{t("ownerDecisions.copiedOn", { date: formatDateKey(preview.copiedAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }, locale) })}</p>}
        {office && preview.canCopy && <RecordCopyButton studentMembershipId={preview.studentMembershipId} />}
      </CardBody>
    </Card>
  );
}
