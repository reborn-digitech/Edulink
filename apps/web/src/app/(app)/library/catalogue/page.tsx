import type { Metadata } from "next";
import { BarcodeIcon, PlusIcon, UploadSimpleIcon } from "@phosphor-icons/react/ssr";
import { LIBRARY_CATEGORIES, LIBRARY_LANGUAGES } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { searchCatalogue } from "@/lib/library";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { CATEGORY_KEY, CatalogueSearch, LANGUAGE_KEY } from "@/components/library/parts";
import { createTitleAction, importAction, isbnListAction } from "../actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabCatalogue"), robots: { index: false, follow: false } };
}

/** The desk's catalogue: search, a new title with the copies in hand, and a pasted sheet. */
export default async function LibraryCataloguePage({ searchParams }: { searchParams: Promise<{ q?: string; cursor?: string; ok?: string; error?: string }> }) {
  const { ctx, t, on, canWrite } = await deskContext();
  const { q = "", cursor, ok, error } = await searchParams;
  if (!on) return <DeskFrame t={t} on={false} current="catalogue" title={t("library.tabCatalogue")}>{null}</DeskFrame>;
  const page = await searchCatalogue(ctx, { q, cursor, limit: 30 });
  const back = `/library/catalogue${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  return (
    <DeskFrame t={t} on current="catalogue" title={t("library.tabCatalogue")} description={t("library.catalogueIntro")} ok={ok} error={error}>
      <CatalogueSearch items={page.items} q={q} t={t} back={back} action="/library/catalogue" desk nextHref={page.nextCursor ? `/library/catalogue?q=${encodeURIComponent(q)}&cursor=${page.nextCursor}` : null} addHref={canWrite ? "#add-title" : undefined} />
      {canWrite ? (
        <>
          <Card id="add-title" className="scroll-mt-20">

            <CardHeader icon={<PlusIcon weight="duotone" className="size-5" />} title={t("library.addTitle")} description={t("library.addTitleHint")} />
            <CardBody>
              <ActionForm action={createTitleAction} className="grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="back" value="/library/catalogue" />
                <TextField name="title" label={t("library.fieldTitle")} required maxLength={200} />
                <TextField name="author" label={t("library.fieldAuthor")} maxLength={120} />
                <TextField name="isbn" label={t("library.fieldIsbn")} maxLength={20} hint={t("library.isbnHint")} />
                <TextField name="publisher" label={t("library.fieldPublisher")} maxLength={120} />
                <TextField name="year" label={t("library.fieldYear")} inputMode="numeric" maxLength={4} />
                <TextField name="subject" label={t("library.fieldSubject")} maxLength={80} />
                <SelectField name="language" label={t("library.fieldLanguage")} defaultValue="OTHER">
                  {LIBRARY_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {t(LANGUAGE_KEY[l])}
                    </option>
                  ))}
                </SelectField>
                <SelectField name="category" label={t("library.fieldCategory")} defaultValue="GENERAL">
                  {LIBRARY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(CATEGORY_KEY[c])}
                    </option>
                  ))}
                </SelectField>
                <TextField name="accessions" label={t("library.fieldAccessions")} hint={t("library.accessionsHint")} maxLength={600} />
                <TextField name="rack" label={t("library.fieldRack")} maxLength={40} />
                <div className="sm:col-span-2">
                  <Button type="submit">{t("library.addTitleButton")}</Button>
                </div>
              </ActionForm>
            </CardBody>
          </Card>
          <Card>
            <CardHeader icon={<UploadSimpleIcon weight="duotone" className="size-5" />} title={t("library.importTitle")} description={t("library.importHint")} />
            <CardBody>
              <ActionForm action={importAction} className="space-y-3">
                <input type="hidden" name="back" value="/library/catalogue" />
                <TextAreaField name="text" label={t("library.importLabel")} required rows={8} maxLength={500000} />
                <Button type="submit" variant="secondary">
                  {t("library.importButton")}
                </Button>
              </ActionForm>
            </CardBody>
          </Card>
          {/* owner-batch-item9 (27 Oct 2026): a publisher's ISBN list, titles added once by ISBN, a failing check digit named back. */}
          <Card id="isbn-list" className="scroll-mt-20">
            <CardHeader icon={<BarcodeIcon weight="duotone" className="size-5" />} title={t("collegeOffice.isbnTitle")} description={t("collegeOffice.isbnIntro")} />
            <CardBody>
              <ActionForm action={isbnListAction} className="space-y-3" data-testid="isbn-import">
                <input type="hidden" name="back" value="/library/catalogue" />
                <TextAreaField name="text" label={t("collegeOffice.isbnLabel")} hint={t("schoolForms.isbnHint")} required rows={6} maxLength={200000} />
                <Button type="submit" variant="secondary">
                  {t("schoolForms.isbnButton")}
                </Button>
              </ActionForm>
            </CardBody>
          </Card>
        </>
      ) : null}
    </DeskFrame>
  );
}
