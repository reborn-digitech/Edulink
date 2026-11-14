import type { Metadata } from "next";
import { ArrowSquareOutIcon, GlobeIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind, LIBRARY_ERESOURCE_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { listEResources } from "@/lib/college-campus";
import { getT } from "@/lib/i18n/server";
import type { Translate } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ActionForm } from "@/components/ui/action-form";
import { ModuleOff } from "@/components/module-off";
import { NotCollege } from "@/components/college-office/parts";
import { DeskFrame } from "@/components/library/desk";
import { EResourceList, eResourceOpenHref } from "@/components/library/eresources";
import { eResourceSaveAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.eResourcesTitle"), robots: { index: false, follow: false } };
}

/** The library's own people (owner-batch-item9): the desk adds and corrects; the head reads the list and its opens. */
const DESK = ["LIBRARIAN", "ADMIN", "PRINCIPAL"] as const;

/**
 * A college's e-resources for its members (campaign 2026-10-04, G-3): a
 * student, a faculty member and an HOD open N-LIST, DELNET and the journals
 * here, through the app, so each open counts on the library's criterion-4
 * numbers (libraryTable). FACULTY and HOD reach this page through their NAV
 * entry (module LIBRARY; role-gate.ts); a student also sees the list on
 * /student/library.
 *
 * THE DESK'S TAB (owner-batch-item9, 27 Oct 2026): the librarian and the office
 * — at a school as at a college, since item 5 opened the doors to a school with
 * the module on — list every e-resource with its opens, add one, correct one's
 * link and kind (the name is the key), and open one through the app; the head
 * reads. The college's /library/college keeps its criterion-4 numbers.
 */
export default async function EResourcesPage() {
  const ctx = await requireRole("STUDENT", "FACULTY", "HOD", ...DESK);
  const [t, kind] = await Promise.all([getT(), institutionKindOf(ctx.schoolId)]);
  if ((DESK as readonly string[]).includes(ctx.role)) {
    const on = await isModuleOn(ctx.schoolId, "LIBRARY");
    if (!on) return <DeskFrame t={t} on={false} current="eresources" title={t("collegeOffice.eResourcesTitle")}>{null}</DeskFrame>;
    const { items } = await listEResources(ctx);
    return (
      <DeskFrame t={t} on current="eresources" title={t("collegeOffice.eResourcesTitle")} description={t("schoolForms.eresDeskIntro")}>
        <EResourceDesk items={items} t={t} canWrite={ctx.role !== "PRINCIPAL"} />
      </DeskFrame>
    );
  }
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "LIBRARY"))) return <ModuleOff page module="LIBRARY" t={t} college />;
  const { items } = await listEResources(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.eResourcesTitle")} description={t("collegeOffice.eResourcesIntro")} />
      <EResourceList items={items} t={t} />
    </div>
  );
}

type DeskItem = Awaited<ReturnType<typeof listEResources>>["items"][number];

const KindOptions = ({ t }: { t: Translate }) => (
  <>
    {LIBRARY_ERESOURCE_KINDS.map((k) => (
      <option key={k} value={k}>
        {t(`collegeOffice.ekind${k}`)}
      </option>
    ))}
  </>
);

/** The desk's list: each e-resource with its kind, its link, how often it was opened, an open and (for the desk) a correction. */
function EResourceDesk({ items, t, canWrite }: { items: readonly DeskItem[]; t: Translate; canWrite: boolean }) {
  const back = "/library/e-resources";
  return (
    <>
      <Card>
        <CardHeader icon={<GlobeIcon weight="duotone" className="size-5" />} title={t("collegeOffice.eResourcesTitle")} />
        <CardBody>
          {items.length === 0 ? (
            <EmptyState title={t("schoolForms.eresEmptyDesk")} description={canWrite ? t("schoolForms.eresEmptyDeskBody") : t("collegeOffice.eResourcesEmpty")} />
          ) : (
            <ul className="divide-y divide-border" data-testid="eresource-desk">
              {items.map((e) => (
                <li key={e.id} className="space-y-2 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-fg">
                        {e.name}
                        {e.active ? null : (
                          <Badge tone="neutral" size="sm">
                            {t("schoolForms.eresInactive")}
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-fg-muted">
                        {[t(`collegeOffice.ekind${e.kind}`), (e.clicks === 1 ? t("schoolForms.eresOpenedTimesOne", { n: 1 }) : t("schoolForms.eresOpenedTimes", { n: e.clicks }))].join(" · ")}
                      </p>
                      <p className="break-all text-xs text-fg-subtle">{e.url}</p>
                    </div>
                    {e.active ? (
                      <Button asChild variant="secondary" size="sm">
                        {/* A plain anchor through the app, not the publisher's link: the open is counted (and a prefetch must not count). */}
                        <a href={eResourceOpenHref(e.id)} target="_blank" rel="noopener noreferrer" aria-label={t("collegeOffice.eResourceOpenLabel", { name: e.name })}>
                          {t("collegeOffice.eResourceOpen")}
                          <ArrowSquareOutIcon className="size-4" aria-hidden />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                  {canWrite ? (
                    <details>
                      <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-medium text-accent-strong hover:underline">
                        {t("schoolForms.eresCorrect")}
                        <span className="sr-only">: {e.name}</span>
                      </summary>
                      <ActionForm action={eResourceSaveAction} className="mt-2 grid gap-3 sm:grid-cols-3">
                        <input type="hidden" name="back" value={back} />
                        <input type="hidden" name="name" value={e.name} />
                        <TextField name="url" type="url" required maxLength={500} defaultValue={e.url} label={t("collegeOffice.link")} hint={t("schoolForms.eresUrlHint")} />
                        <SelectField name="kind" required defaultValue={e.kind} label={t("collegeOffice.colKind")}>
                          <KindOptions t={t} />
                        </SelectField>
                        <div className="flex items-end">
                          <Button type="submit" size="sm" variant="secondary">
                            {t("schoolForms.eresSave")}
                          </Button>
                        </div>
                      </ActionForm>
                    </details>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      {canWrite ? (
        <Card>
          <CardHeader icon={<PlusIcon weight="duotone" className="size-5" />} title={t("schoolForms.eresAddTitle")} description={t("schoolForms.eresAddHint")} />
          <CardBody>
            <ActionForm action={eResourceSaveAction} className="grid gap-3 sm:grid-cols-2" data-testid="eresource-add">
              <input type="hidden" name="back" value={back} />
              <TextField name="name" required minLength={2} maxLength={120} label={t("collegeOffice.eResource")} />
              <TextField name="url" type="url" required maxLength={500} label={t("collegeOffice.link")} hint={t("schoolForms.eresUrlHint")} />
              <SelectField name="kind" required defaultValue="EBOOK" label={t("collegeOffice.colKind")}>
                <KindOptions t={t} />
              </SelectField>
              <div className="flex items-end">
                <Button type="submit">{t("schoolForms.eresAddButton")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
