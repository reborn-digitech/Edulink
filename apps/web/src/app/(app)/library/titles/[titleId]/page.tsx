import type { Metadata } from "next";
import { BooksIcon, ClockCountdownIcon, PencilSimpleIcon } from "@phosphor-icons/react/ssr";
import { LIBRARY_CATEGORIES, LIBRARY_DESK_STATUSES, LIBRARY_LANGUAGES } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { titleView } from "@/lib/library";
import { AccessError } from "@/lib/tenancy";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { CATEGORY_KEY, COPY_STATUS_KEY, LANGUAGE_KEY, day } from "@/components/library/parts";
import { addCopyAction, copyStatusAction, updateTitleAction } from "../../actions";
import { notFound } from "next/navigation";
import { fieldClass } from "@/components/ui/field-class";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabCatalogue"), robots: { index: false, follow: false } };
}

/** One title at the desk: its copies with who has each, the queue, and the forms to correct it and add a copy. */
export default async function LibraryTitlePage({ params, searchParams }: { params: Promise<{ titleId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite } = await deskContext();
  const { titleId } = await params;
  const { ok, error } = await searchParams;
  const backLink = { href: "/library/catalogue", label: t("library.tabCatalogue") };
  if (!on) return <DeskFrame t={t} on={false} current={null} title={t("library.tabCatalogue")} back={backLink}>{null}</DeskFrame>;
  const view = await titleView(ctx, titleId).catch((e) => {
    if (e instanceof AccessError) notFound();
    throw e;
  });
  const b = view.title;
  const back = `/library/titles/${titleId}`;
  return (
    <DeskFrame t={t} on current={null} title={b.title} description={[b.author, b.publisher, b.year, b.isbn].filter(Boolean).join(" · ")} ok={ok} error={error} back={backLink}>
      <Card>
        <CardHeader icon={<BooksIcon weight="duotone" className="size-5" />} title={t("library.copiesTitle")} description={t("library.onShelf", { count: b.available, of: b.copies })} />
        <CardBody className="p-0">
          <ul className="divide-y divide-border">
            {view.copies.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">
                    {c.accession} {c.rack ? <span className="font-normal text-fg-muted">· {t("library.rackShort", { rack: c.rack })}</span> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-muted">
                    {t(COPY_STATUS_KEY[c.status])}
                    {c.borrowerName && c.dueOn ? ` · ${t("library.withDue", { name: c.borrowerName, date: day(c.dueOn, locale) })}` : ""}
                    {c.heldFor ? ` · ${t("library.heldFor", { name: c.heldFor })}` : ""}
                    {c.seen ? ` · ${t("library.seenInStock")}` : ""}
                  </p>
                </div>
                {canWrite && c.status !== "ISSUED" ? (
                  <form action={copyStatusAction} className="flex items-center gap-2">
                    <input type="hidden" name="copyId" value={c.id} />
                    <input type="hidden" name="back" value={back} />
                    <label className="sr-only" htmlFor={`st-${c.id}`}>
                      {t("library.copyState")}
                    </label>
                    <select id={`st-${c.id}`} name="status" defaultValue={c.status} className={fieldClass("w-auto")}>
                      {LIBRARY_DESK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {t(COPY_STATUS_KEY[s])}
                        </option>
                      ))}
                    </select>
                    <Button type="submit" size="sm" variant="secondary">
                      {t("library.setState")}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
          {canWrite ? (
            <form action={addCopyAction} className="flex flex-wrap items-end gap-2 border-t border-border px-5 py-4">
              <input type="hidden" name="titleId" value={titleId} />
              <input type="hidden" name="back" value={back} />
              <TextField name="accession" label={t("library.accession")} required maxLength={30} className="min-w-0 flex-1 basis-40" />
              <TextField name="rack" label={t("library.fieldRack")} maxLength={40} className="min-w-0 flex-1 basis-40" />
              <Button type="submit" variant="secondary">
                {t("library.addCopy")}
              </Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ClockCountdownIcon weight="duotone" className="size-5" />} title={t("library.queueTitle")} />
        <CardBody>
          {view.queue.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("library.noQueue")}</p>
          ) : (
            <ol className="list-decimal space-y-1 pl-5 text-sm text-fg">
              {view.queue.map((r) => (
                <li key={r.id}>
                  {r.memberName}
                  {r.ready ? <span className="text-accent-strong"> · {t("library.readyShort")}</span> : null}
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      {canWrite ? (
        <Card>
          <CardHeader icon={<PencilSimpleIcon weight="duotone" className="size-5" />} title={t("library.editTitle")} />
          <CardBody>
            <form action={updateTitleAction} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="titleId" value={titleId} />
              <input type="hidden" name="back" value={back} />
              <TextField name="title" label={t("library.fieldTitle")} required maxLength={200} defaultValue={b.title} />
              <TextField name="author" label={t("library.fieldAuthor")} maxLength={120} defaultValue={b.author} />
              <TextField name="isbn" label={t("library.fieldIsbn")} maxLength={20} defaultValue={b.isbn ?? ""} />
              <TextField name="publisher" label={t("library.fieldPublisher")} maxLength={120} defaultValue={b.publisher} />
              <TextField name="year" label={t("library.fieldYear")} inputMode="numeric" maxLength={4} defaultValue={b.year ?? ""} />
              <TextField name="subject" label={t("library.fieldSubject")} maxLength={80} defaultValue={b.subject} />
              <SelectField name="language" label={t("library.fieldLanguage")} defaultValue={b.language}>
                {LIBRARY_LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {t(LANGUAGE_KEY[l])}
                  </option>
                ))}
              </SelectField>
              <SelectField name="category" label={t("library.fieldCategory")} defaultValue={b.category}>
                {LIBRARY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(CATEGORY_KEY[c])}
                  </option>
                ))}
              </SelectField>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary">
                  {t("library.saveTitle")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </DeskFrame>
  );
}
