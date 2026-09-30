import type { Metadata } from "next";
import Link from "next/link";
import { ArrowsLeftRightIcon, ClockCounterClockwiseIcon, FolderUserIcon, IdentificationCardIcon, MagnifyingGlassIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { AccessError, requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { officeRecords } from "@/lib/pupil-records";
import { lookupPen, type PenLookup } from "@/lib/pen";
import { officePenChanges } from "@/lib/pen-changes";
import { officeRecordChanges } from "@/lib/record-changes";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PersonLink } from "@/components/person-link";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AskFamiliesButton } from "./ask-button";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("pupilRecord.officeTitle") };
}

/**
 * The office's view of the pupil records: how many are complete enough to
 * issue a certificate, which are not and what each lacks, when the family
 * was asked and when they answered. One button asks every incomplete
 * family; each row can ask its own.
 */
export default async function PupilRecordsPage({ searchParams }: { searchParams: Promise<{ missing?: string; pen?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { missing, pen } = await searchParams;
  // ?pen=: who holds a UDISE+ PEN — a pupil here with a door to the record,
  // a pupil elsewhere on Relay by state alone, or nobody. A wrong shape is
  // the format sentence, not a broken page.
  const penAsked = typeof pen === "string" ? pen.trim() : "";
  let lookup: PenLookup | null = null;
  let lookupError: string | null = null;
  if (penAsked) {
    try {
      lookup = await lookupPen(ctx, penAsked);
    } catch (error) {
      if (!(error instanceof AccessError)) throw error;
      lookupError = t("pupilRecord.penFormat");
    }
  }
  const missingOnly = missing === "1";
  // ?missing=filing: the pupils the UDISE+ sheet cannot be filled for — a
  // different set from the certificate's, cut here from the same rows.
  const filingOnly = missing === "filing";
  // The corrections to PENs the head and a guardian have yet to settle: a
  // card only while there are any, each row a door to the record page
  // where the head decides.
  // And what families have asked to have changed: the same kind of card, each row a door to the record where the office decides.
  const [all, penChanges, recordChanges] = await Promise.all([officeRecords(ctx, missingOnly), officePenChanges(ctx, "PENDING"), officeRecordChanges(ctx, "PENDING")]);
  const view = filingOnly ? { ...all, rows: all.rows.filter((r) => r.missingForFiling.length > 0) } : all;
  const filingIds = view.rows.filter((r) => r.missingForFiling.length > 0).map((r) => r.studentMembershipId);
  // The PEN each row carries: the account's, or the record's mirror of it.
  const penRows = view.rows.length > 0 ? await db.membership.findMany({ where: { id: { in: view.rows.map((r) => r.studentMembershipId) } }, select: { id: true, user: { select: { penNumber: true } }, pupilRecord: { select: { penNumber: true } } } }) : [];
  const penOf = new Map(penRows.map((m) => [m.id, m.user.penNumber ?? m.pupilRecord?.penNumber ?? null]));
  const fieldLabel = (f: string) => t(`pupilRecord.${f}` as TranslationKey);
  const tab = (active: boolean) => (active ? "rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent-strong" : "rounded-full px-3 py-1.5 text-sm font-medium text-fg-muted hover:bg-surface-muted hover:text-fg");

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pupilRecord.officeTitle")}
        description={t("pupilRecord.officeIntro")}
        actions={filingOnly ? <AskFamiliesButton membershipIds={filingIds} label={t("pupilRecord.askFamilies")} disabled={filingIds.length === 0} /> : <AskFamiliesButton label={t("pupilRecord.askFamilies")} disabled={view.incomplete === 0} />}
      />

      <Card data-testid="find-by-pen">
        <CardBody className="space-y-3 pt-5">
          {/* A plain GET, so the answer is the server's own and the address carries it. */}
          <form method="get" action="/admin/records" className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 basis-56">
              <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
                <IdentificationCardIcon weight="duotone" className="size-4" aria-hidden="true" />
                {t("pupilRecord.findByPen")}
              </span>
              <input
                type="text"
                name="pen"
                defaultValue={penAsked}
                inputMode="numeric"
                maxLength={11}
                pattern="[0-9]{11}"
                autoComplete="off"
                aria-describedby="find-by-pen-hint"
                className="mt-1.5 min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3 font-mono text-[0.9375rem] text-fg outline-none focus:border-accent"
              />
            </label>
            <Button type="submit" variant="secondary" icon={<MagnifyingGlassIcon weight="bold" />}>
              {t("pupilRecord.findByPenGo")}
            </Button>
            <p id="find-by-pen-hint" className="basis-full text-xs text-fg-muted">
              {t("pupilRecord.findByPenHint")}
            </p>
          </form>
          {lookupError && (
            <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger" data-testid="pen-result">
              {lookupError}
            </p>
          )}
          {lookup && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg" data-testid="pen-result" data-found={lookup.found}>
              <p>
                {lookup.found === "HERE"
                  ? lookup.pupil.className
                    ? t("pupilRecord.penFoundHere", { name: lookup.pupil.name, className: lookup.pupil.className })
                    : t("pupilRecord.penFoundHereNoClass", { name: lookup.pupil.name })
                  : lookup.found === "ELSEWHERE_ACTIVE"
                    ? t("pupilRecord.penElsewhereActive")
                    : lookup.found === "ELSEWHERE_LEFT"
                      ? t("pupilRecord.penElsewhereLeft")
                      : t("pupilRecord.penNone")}
              </p>
              {lookup.found === "HERE" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/admin/records/${lookup.pupil.membershipId}`}>{t("pupilRecord.openRecord")}</Link>
                </Button>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {recordChanges.pending > 0 && (
        <Card className="border-warn/40" data-testid="record-changes-waiting">
          <CardHeader icon={<ClockCounterClockwiseIcon weight="duotone" className="size-5" />} title={t("recordChanges.officeTitle")} description={t("recordChanges.officeIntro")} action={<Badge tone="warn" size="sm">{t("recordChanges.waitingCount", { count: recordChanges.pending })}</Badge>} />
          <CardBody>
            <ul className="divide-y divide-border">
              {recordChanges.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <PersonLink membershipId={item.studentMembershipId} name={item.studentName} className="font-semibold text-fg" />
                      {item.className && <span className="text-xs text-fg-muted">{item.className}</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-fg">{item.changes.map((c) => fieldLabel(c.field)).join(", ")}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">{t(item.byPupil ? "recordChanges.askedByPupil" : "recordChanges.askedBy", { name: item.requestedByName, date: formatDate(new Date(item.createdAt)) })}</p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/records/${item.studentMembershipId}`}>{t("pupilRecord.openRecord")}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {penChanges.pending > 0 && (
        <Card className="border-warn/40" data-testid="pen-changes">
          <CardHeader icon={<ArrowsLeftRightIcon weight="duotone" className="size-5" />} title={t("pupilRecord.penChangesTitle")} description={t("pupilRecord.penChangesIntro")} action={<Badge tone="warn" size="sm">{t("certificateRequests.pendingCount", { count: penChanges.pending })}</Badge>} />
          <CardBody>
            <ul className="divide-y divide-border">
              {penChanges.items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <PersonLink membershipId={item.studentMembershipId} name={item.studentName} className="font-semibold text-fg" />
                      {item.className && <span className="text-xs text-fg-muted">{item.className}</span>}
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-fg">{item.toPen ? t("pupilRecord.penChangeFromTo", { from: item.fromPen ?? "—", to: item.toPen }) : t("pupilRecord.penChangeRemoval", { from: item.fromPen ?? "—" })}</p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {t("pupilRecord.penChangeProposedBy", { name: item.requestedByName })}
                      {" · "}
                      {t("pupilRecord.penChangeReason", { reason: item.reason })}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/records/${item.studentMembershipId}`}>{t("pupilRecord.openRecord")}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={t("pupilRecord.allPupils")} value={String(view.total)} icon={<UsersThreeIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("pupilRecord.complete")} value={String(view.complete)} tone={view.complete > 0 ? "ok" : "neutral"} icon={<FolderUserIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("pupilRecord.onlyMissing")} value={String(view.incomplete)} tone={view.incomplete > 0 ? "warn" : "neutral"} icon={<FolderUserIcon weight="duotone" className="size-5" />} />
      </div>

      <Card>
        <CardBody className="space-y-4 pt-5">
          <nav className="flex flex-wrap gap-1" aria-label={t("common.activeFilters")}>
            <Link href="/admin/records" className={tab(!missingOnly && !filingOnly)} aria-current={!missingOnly && !filingOnly ? "page" : undefined}>
              {t("pupilRecord.allPupils")}
            </Link>
            <Link href="/admin/records?missing=1" className={tab(missingOnly)} aria-current={missingOnly ? "page" : undefined}>
              {t("pupilRecord.onlyMissing")}
            </Link>
            <Link href="/admin/records?missing=filing" className={tab(filingOnly)} aria-current={filingOnly ? "page" : undefined}>
              {t("filings.onlyMissingFiling")}
            </Link>
          </nav>

          {view.rows.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" icon={<UsersThreeIcon weight="duotone" className="size-6" />} title={t("pupilRecord.noPupils")} description={t("pupilRecord.noPupilsBody")} />
          ) : (
            <ul className="divide-y divide-border" data-testid="pupil-records">
              {view.rows.map((row) => (
                <li key={row.studentMembershipId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 basis-64">
                    <p className="flex flex-wrap items-center gap-2">
                      <PersonLink membershipId={row.studentMembershipId} name={row.studentName} className="font-semibold text-fg" />
                      {row.className && <span className="text-xs text-fg-muted">{row.className}</span>}
                      {penOf.get(row.studentMembershipId) && (
                        <span className="font-mono text-xs text-fg-subtle" title={t("pupilRecord.penNumber")}>
                          {penOf.get(row.studentMembershipId)}
                        </span>
                      )}
                      {row.missing.length === 0 ? (
                        <Badge tone="ok" size="sm">{t("pupilRecord.complete")}</Badge>
                      ) : (
                        <Badge tone="warn" size="sm">{t("pupilRecord.incomplete", { count: row.missing.length })}</Badge>
                      )}
                    </p>
                    {row.missing.length > 0 && <p className="mt-0.5 text-xs text-fg-muted">{t("pupilRecord.missingList", { fields: row.missing.map(fieldLabel).join(", ") })}</p>}
                    {filingOnly && row.missingForFiling.length > 0 && <p className="mt-0.5 text-xs text-fg-muted">{t("filings.missingFilingList", { fields: row.missingForFiling.map(fieldLabel).join(", ") })}</p>}
                    <p className="mt-0.5 text-xs text-fg-subtle">
                      {[
                        row.familyFilledAt ? t("pupilRecord.filledOn", { date: formatDate(new Date(row.familyFilledAt)) }) : null,
                        row.requestedAt ? t("pupilRecord.askedOn", { date: formatDate(new Date(row.requestedAt)) }) : t("pupilRecord.neverAsked"),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span className="flex shrink-0 flex-wrap items-center gap-2">
                    {(row.missing.length > 0 || row.missingForFiling.length > 0) && <AskFamiliesButton membershipIds={[row.studentMembershipId]} label={t("pupilRecord.askSelected")} variant="ghost" />}
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/records/${row.studentMembershipId}`}>{t("pupilRecord.edit")}</Link>
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
