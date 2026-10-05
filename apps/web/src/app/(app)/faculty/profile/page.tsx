import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { myPublicProfile } from "@/lib/faculty-profile";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash } from "@/components/iqac/parts";
import { FacultyProfileCard } from "@/components/faculty-profile-card";
import { setPublicProfileAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeDesks.profileTitle"), robots: { index: false, follow: false } };
}

/**
 * MY PUBLIC PAGE (5 Oct 2026; faculty-profile.ts): what a page about my work
 * would show, made from my faculty record and the research register today,
 * and the one button that puts it up, refreshes it or takes it down. Only the
 * teacher publishes; the college's published disclosure links the list.
 */
export default async function FacultyProfilePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { ok, error } = await searchParams;
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("collegeDesks.profileTitle")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const mine = await myPublicProfile(ctx);
  return (
    <div className="space-y-5">
      <PageHeader title={t("collegeDesks.profileTitle")} description={t("collegeDesks.profileIntro")} />
      <IqacFlash ok={ok} error={error} />
      {!mine.preview ? (
        <EmptyState
          title={t("collegeDesks.profileNoRecord")}
          description={t("collegeDesks.profileNoRecordBody")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/faculty/research">{t("iqac.navResearch")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardBody className="flex flex-wrap items-center gap-3 pt-5 text-sm">
              <span className="text-fg">{mine.publishedAt ? t("collegeDesks.profilePublished", { date: formatDateKey(mine.publishedAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }, locale) }) : t("collegeDesks.profileNotPublished")}</span>
              <form action={setPublicProfileAction}>
                <input type="hidden" name="publish" value="1" />
                <Button type="submit" size="sm">{t(mine.publishedAt ? "collegeDesks.profileRefresh" : "collegeDesks.profilePublish")}</Button>
              </form>
              {mine.publishedAt ? (
                <form action={setPublicProfileAction}>
                  <input type="hidden" name="publish" value="0" />
                  <Button type="submit" size="sm" variant="secondary">{t("collegeDesks.profileUnpublish")}</Button>
                </form>
              ) : null}
              {mine.url ? (
                <Link className="inline-flex min-h-11 items-center text-accent-strong underline" href={mine.url}>
                  {t("collegeDesks.profileOpen")}
                </Link>
              ) : null}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("collegeDesks.profilePreview")} />
            <CardBody>
              <FacultyProfileCard p={mine.preview} t={t} />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
