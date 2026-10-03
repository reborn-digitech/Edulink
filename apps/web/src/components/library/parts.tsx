import Link from "next/link";
import { BookOpenIcon, CheckCircleIcon, ClockCountdownIcon, MagnifyingGlassIcon, ReceiptIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { formatPaise, type Locale } from "@edulink/i18n";
import type { LibraryFine, LibraryLoan, LibraryReservation, LibraryTitleRow } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { formatDateKey } from "@/lib/dates";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import { cancelReservationAction, renewAction, reserveAction, settleFineAction, waiveFineAction } from "@/app/(app)/library/actions";

/**
 * The library's shared pieces (module LIBRARY, 3 Oct 2026): the message a
 * form came back with, and the lists of loans, fines, the queue and the
 * catalogue that the desk's pages and a member's own page both draw. Every
 * button is a form posting to app/(app)/library/actions.ts with `back`, the
 * page to come back to.
 */

export const FINE_REASON_KEY: Record<LibraryFine["reason"], TranslationKey> = { OVERDUE: "library.reasonOVERDUE", DAMAGE: "library.reasonDAMAGE", LOST: "library.reasonLOST" };
export const FINE_STATUS_KEY: Record<LibraryFine["status"], TranslationKey> = { DUE: "library.fineDUE", PAID: "library.finePAID", WAIVED: "library.fineWAIVED" };
export const COPY_STATUS_KEY: Record<"AVAILABLE" | "ISSUED" | "LOST" | "WITHDRAWN" | "REPAIR", TranslationKey> = { AVAILABLE: "library.copyAVAILABLE", ISSUED: "library.copyISSUED", LOST: "library.copyLOST", WITHDRAWN: "library.copyWITHDRAWN", REPAIR: "library.copyREPAIR" };
export const LANGUAGE_KEY: Record<LibraryTitleRow["language"], TranslationKey> = { EN: "library.langEN", HI: "library.langHI", MR: "library.langMR", SA: "library.langSA", UR: "library.langUR", OTHER: "library.langOTHER" };
export const CATEGORY_KEY: Record<LibraryTitleRow["category"], TranslationKey> = { GENERAL: "library.catGENERAL", FICTION: "library.catFICTION", NON_FICTION: "library.catNON_FICTION", REFERENCE: "library.catREFERENCE", TEXTBOOK: "library.catTEXTBOOK", PERIODICAL: "library.catPERIODICAL", CHILDREN: "library.catCHILDREN" };

export const day = (key: string, locale: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
export const money = (paise: number, locale: string) => formatPaise(paise, locale as Locale);

/** What the last form said: done (green) or refused (red). */
export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <Card role={error ? "alert" : "status"}>
      <CardBody className={`flex items-center gap-2 pt-5 text-sm ${error ? "text-danger" : "text-ok"}`}>
        {error ? <WarningIcon weight="fill" className="size-4 shrink-0" aria-hidden /> : <CheckCircleIcon weight="fill" className="size-4 shrink-0" aria-hidden />}
        {error ?? ok}
      </CardBody>
    </Card>
  );
}

function Hidden({ fields }: { fields: Record<string, string | undefined> }) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (value === undefined ? null : <input key={name} type="hidden" name={name} value={value} />))}
    </>
  );
}

export function LoanList({ loans, t, locale, back, title, desk, showMember }: { loans: LibraryLoan[]; t: Translate; locale: string; back: string; title: string; desk: boolean; showMember: boolean }) {
  return (
    <Card>
      <CardHeader icon={<BookOpenIcon weight="duotone" className="size-5" />} title={title} />
      <CardBody className="p-0">
        {loans.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-fg-muted">{t("library.noLoans")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {loans.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">
                    {l.title} <span className="font-normal text-fg-muted">· {l.accession}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {showMember ? `${l.memberName}${l.className ? ` (${l.className})` : ""} · ` : ""}
                    {l.returnedAt ? t("library.returnedOn", { date: day(l.returnedAt.slice(0, 10), locale) }) : t("library.dueOn", { date: day(l.dueOn, locale) })}
                    {l.overdueDays > 0 ? ` · ${t("library.daysLate", { days: l.overdueDays })}` : ""}
                    {l.renewedCount > 0 ? ` · ${t("library.renewedTimes", { count: l.renewedCount })}` : ""}
                  </p>
                </div>
                {desk && l.canRenew ? (
                  <form action={renewAction}>
                    <Hidden fields={{ issueId: l.id, back }} />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("library.renew")}
                    </Button>
                  </form>
                ) : l.overdueDays > 0 && !l.returnedAt ? (
                  <span className="text-xs font-semibold text-danger">{t("library.overdue")}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export function FineList({ fines, t, locale, back, desk, canSettle, title, showMember = desk }: { fines: LibraryFine[]; t: Translate; locale: string; back: string; desk: boolean; canSettle: boolean; title: string; showMember?: boolean }) {
  return (
    <Card>
      <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={title} description={desk || showMember ? undefined : t("library.finesFamilyHint")} />
      <CardBody className="p-0">
        {fines.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-fg-muted">{t("library.noFines")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {fines.map((f) => (
              <li key={f.id} className="space-y-2 px-5 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {money(f.paise, locale)} · {t(FINE_REASON_KEY[f.reason])}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {showMember ? `${f.memberName} · ` : ""}
                      {f.title} · {t(FINE_STATUS_KEY[f.status])}
                      {f.status === "DUE" ? ` · ${f.onLedger ? t("library.onLedger") : t("library.atCounter")}` : ""}
                      {f.waivedReason ? ` · ${f.waivedReason}` : ""}
                    </p>
                  </div>
                  {desk && canSettle && f.status === "DUE" && !f.onLedger ? (
                    <form action={settleFineAction}>
                      <Hidden fields={{ fineId: f.id, back }} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("library.settle")}
                      </Button>
                    </form>
                  ) : null}
                </div>
                {desk && f.status === "DUE" ? (
                  <form action={waiveFineAction} className="flex flex-wrap items-end gap-2">
                    <Hidden fields={{ fineId: f.id, back }} />
                    <label className="min-w-0 flex-1 basis-48 text-xs text-fg-muted">
                      {t("library.waiveReason")}
                      <input name="reason" required minLength={3} maxLength={300} className="mt-1 block min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg" />
                    </label>
                    <Button type="submit" size="sm" variant="ghost">
                      {t("library.waive")}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export function ReservationList({ items, t, back, title, desk, canCancel = true }: { items: LibraryReservation[]; t: Translate; back: string; title: string; desk: boolean; canCancel?: boolean }) {
  return (
    <Card>
      <CardHeader icon={<ClockCountdownIcon weight="duotone" className="size-5" />} title={title} />
      <CardBody className="p-0">
        {items.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-fg-muted">{t("library.noReservations")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{r.title}</p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {desk ? `${r.memberName} · ` : ""}
                    {r.ready ? t("library.readyAtDesk", { accession: r.readyAccession ?? "" }) : t("library.inQueue", { position: r.position })}
                  </p>
                </div>
                {canCancel ? (
                  <form action={cancelReservationAction}>
                    <Hidden fields={{ reservationId: r.id, back }} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("library.leaveQueue")}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/** The catalogue's search box and its results; a member may reserve, the desk opens the title. */
export function CatalogueSearch({ items, q, t, back, action, reserveFor, desk, nextHref }: { items: LibraryTitleRow[]; q: string; t: Translate; back: string; action: string; reserveFor?: { childId?: string } | null; desk: boolean; nextHref?: string | null }) {
  return (
    <Card>
      <CardHeader icon={<MagnifyingGlassIcon weight="duotone" className="size-5" />} title={t("library.catalogueTitle")} description={t("library.catalogueHint")} />
      <CardBody className="space-y-4">
        <form action={action} method="get" className="flex flex-wrap items-end gap-2">
          {reserveFor?.childId ? <input type="hidden" name="child" value={reserveFor.childId} /> : null}
          <label className="min-w-0 flex-1 basis-56 text-sm font-medium text-fg">
            {t("library.searchLabel")}
            <input name="q" defaultValue={q} maxLength={100} className="mt-1.5 block min-h-12 w-full rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] text-fg" />
          </label>
          <Button type="submit" variant="secondary">
            {t("library.search")}
          </Button>
        </form>
        {items.length === 0 ? (
          <EmptyState icon={<BookOpenIcon weight="duotone" className="size-8" />} title={t("library.noTitlesTitle")} description={q ? t("library.noTitlesSearch") : t("library.noTitlesBody")} />
        ) : (
          <ul className="divide-y divide-border rounded-[--radius-md] border border-border">
            {items.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  {desk ? (
                    <Link href={`/library/titles/${b.id}`} className="text-sm font-medium text-accent-strong hover:underline">
                      {b.title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-fg">{b.title}</p>
                  )}
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {[b.author, b.subject, t(LANGUAGE_KEY[b.language])].filter(Boolean).join(" · ")}
                    {" · "}
                    {b.available > 0 ? t("library.onShelf", { count: b.available, of: b.copies }) : t("library.allOut", { of: b.copies })}
                    {b.waiting > 0 ? ` · ${t("library.waiting", { count: b.waiting })}` : ""}
                  </p>
                </div>
                {reserveFor && b.copies > 0 ? (
                  <form action={reserveAction}>
                    <Hidden fields={{ titleId: b.id, childId: reserveFor.childId, back }} />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("library.reserve")}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {nextHref ? (
          <Link href={nextHref} className="inline-block text-sm font-medium text-accent-strong hover:underline">
            {t("library.moreTitles")}
          </Link>
        ) : null}
      </CardBody>
    </Card>
  );
}
