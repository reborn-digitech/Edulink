import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUUpLeftIcon, BarcodeIcon, BookOpenIcon, ClockCountdownIcon, ReceiptIcon, UserIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { lookup, listFines, overdueLoans, reservationQueue, searchMembers } from "@/lib/library";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { COPY_STATUS_KEY, day, money } from "@/components/library/parts";
import { issueAction, returnAction } from "./actions";
import { fieldClass } from "@/components/ui/field-class";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName"), robots: { index: false, follow: false } };
}

/**
 * The library desk (module LIBRARY, 3 Oct 2026) — the LIBRARIAN's home, and
 * the office's and the head's from their NAV. A scan or a typed code finds a
 * copy, a member's card or an ISBN; a copy on the shelf is lent to a member
 * found by name, a copy out is taken back. Late returns write their fine and
 * a copy somebody waits for is held for them (src/lib/library.ts).
 */
export default async function LibraryDeskPage({ searchParams }: { searchParams: Promise<{ code?: string; member?: string; ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite } = await deskContext();
  const { code = "", member = "", ok, error } = await searchParams;
  const back = `/library${code ? `?code=${encodeURIComponent(code)}` : ""}`;
  if (!on) return <DeskFrame t={t} on={false} current="desk" title={t("modules.libraryName")}>{null}</DeskFrame>;
  const [overdue, queue, fines, found, people] = await Promise.all([
    overdueLoans(ctx),
    reservationQueue(ctx),
    listFines(ctx, "DUE"),
    code.trim() ? lookup(ctx, code.trim()) : Promise.resolve(null),
    member.trim() && canWrite ? searchMembers(ctx, member.trim()) : Promise.resolve(null),
  ]);
  const ready = queue.items.filter((r) => r.ready).length;
  return (
    <DeskFrame t={t} on current="desk" title={t("modules.libraryName")} description={t("library.deskIntro")} ok={ok} error={error}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("library.statOverdue")} value={overdue.items.length} tone={overdue.items.length ? "danger" : "neutral"} icon={<WarningCircleIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("library.statReady")} value={ready} tone={ready ? "accent" : "neutral"} icon={<ClockCountdownIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("library.statWaiting")} value={queue.items.length - ready} icon={<BookOpenIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("library.statDue")} value={money(fines.duePaise, locale)} icon={<ReceiptIcon weight="duotone" className="size-5" />} />
      </div>

      <Card>
        <CardHeader icon={<BarcodeIcon weight="duotone" className="size-5" />} title={t("library.scanTitle")} description={t("library.scanHint")} />
        <CardBody className="space-y-4">
          <form action="/library" method="get" className="flex flex-wrap items-end gap-2">
            <label className="min-w-0 flex-1 basis-56 text-sm font-medium text-fg">
              {t("library.codeLabel")}
              <input name="code" defaultValue={code} autoFocus autoComplete="off" maxLength={40} className={fieldClass("mt-1.5 block")} />
            </label>
            <Button type="submit">{t("library.find")}</Button>
          </form>

          {found?.kind === "NONE" ? <p className="text-sm text-fg-muted">{t("library.nothingHasCode", { code })}</p> : null}
          {found?.kind === "TITLE" && found.title ? (
            <p className="text-sm">
              <Link href={`/library/titles/${found.title.id}`} className="font-medium text-accent-strong hover:underline">
                {found.title.title}
              </Link>{" "}
              <span className="text-fg-muted">· {t("library.onShelf", { count: found.title.available, of: found.title.copies })}</span>
            </p>
          ) : null}
          {found?.kind === "MEMBER" && found.member ? (
            <p className="flex items-center gap-2 text-sm">
              <UserIcon weight="duotone" className="size-4 text-fg-muted" aria-hidden />
              <Link href={`/library/members/${found.member.membershipId}`} className="font-medium text-accent-strong hover:underline">
                {found.member.name}
              </Link>
              <span className="text-fg-muted">· {t("library.holding", { count: found.member.onLoan, limit: found.member.limit })}</span>
            </p>
          ) : null}
          {found?.kind === "COPY" && found.copy ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
              <div>
                <p className="text-sm font-semibold text-fg">
                  <Link href={`/library/titles/${found.copy.titleId}`} className="hover:underline">
                    {found.copy.title}
                  </Link>{" "}
                  <span className="font-normal text-fg-muted">· {found.copy.accession}</span>
                </p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {t(COPY_STATUS_KEY[found.copy.status])}
                  {found.copy.borrowerName ? ` · ${t("library.withDue", { name: found.copy.borrowerName, date: day(found.copy.dueOn!, locale) })}` : ""}
                  {found.copy.heldFor ? ` · ${t("library.heldFor", { name: found.copy.heldFor })}` : ""}
                </p>
              </div>
              {canWrite && found.copy.status === "ISSUED" ? (
                <form action={returnAction}>
                  <input type="hidden" name="accession" value={found.copy.accession} />
                  <input type="hidden" name="back" value="/library" />
                  <Button type="submit">
                    <ArrowUUpLeftIcon weight="bold" className="size-4" aria-hidden />
                    {t("library.takeBack")}
                  </Button>
                </form>
              ) : null}
              {canWrite && found.copy.status === "AVAILABLE" ? (
                <div className="space-y-3">
                  <form action="/library" method="get" className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="code" value={code} />
                    <label className="min-w-0 flex-1 basis-56 text-sm font-medium text-fg">
                      {t("library.lendToWho")}
                      <input name="member" defaultValue={member} maxLength={80} className={fieldClass("mt-1.5 block")} />
                    </label>
                    <Button type="submit" variant="secondary">
                      {t("library.findPerson")}
                    </Button>
                  </form>
                  {people ? (
                    people.items.length === 0 ? (
                      <p className="text-sm text-fg-muted">{t("library.noPeople")}</p>
                    ) : (
                      <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
                        {people.items.map((p) => (
                          <li key={p.membershipId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-fg">{p.name}</p>
                              <p className="text-xs text-fg-muted">
                                {[p.className, p.cardNumber, t("library.holding", { count: p.onLoan, limit: p.limit }), p.owedPaise ? t("library.owes", { amount: money(p.owedPaise, locale) }) : null].filter(Boolean).join(" · ")}
                              </p>
                            </div>
                            <form action={issueAction}>
                              <input type="hidden" name="accession" value={found.copy!.accession} />
                              <input type="hidden" name="membershipId" value={p.membershipId} />
                              <input type="hidden" name="back" value="/library" />
                              <Button type="submit" size="sm" disabled={p.onLoan >= p.limit}>
                                {t("library.lend")}
                              </Button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>

      {canWrite ? (
        <Card>
          <CardHeader icon={<ArrowUUpLeftIcon weight="duotone" className="size-5" />} title={t("library.quickReturn")} description={t("library.quickReturnHint")} />
          <CardBody>
            <form action={returnAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="back" value={back} />
              <label className="min-w-0 flex-1 basis-56 text-sm font-medium text-fg">
                {t("library.accession")}
                <input name="accession" required maxLength={30} autoComplete="off" className={fieldClass("mt-1.5 block")} />
              </label>
              <Button type="submit" variant="secondary">
                {t("library.takeBack")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </DeskFrame>
  );
}
