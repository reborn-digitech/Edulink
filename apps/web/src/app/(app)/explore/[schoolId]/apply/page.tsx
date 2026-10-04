import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/tenancy";
import { readSchoolProfile } from "@/lib/school-profile";
import { schoolAdmissions } from "@/lib/admissions";
import { formatDateKey } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT, getLocale } from "@/lib/i18n/server";
import { ApplyForm } from "./apply-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("admissions.applyHere"),
    robots: { index: false, follow: false },
  };
}

/**
 * The application form on a school's page. A guardian account only — the
 * child need not exist on the platform yet, because this is how the first
 * one arrives. With no open cycle the page says so and offers the school's
 * page back rather than a form that would be refused.
 */
export default async function ApplyPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const ctx = await requireUser();
  if (ctx.role !== "PARENT") redirect("/switch");
  const t = await getT();
  const locale = await getLocale();
  const { schoolId } = await params;
  const school = await readSchoolProfile(ctx, schoolId);
  if (!school) notFound();
  const { open, mine } = await schoolAdmissions(ctx, schoolId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={t("admissions.applyTitle", { school: school.name })}
        description={
          open
            ? t("admissions.applyIntro", {
                cycle: open.name,
                year: open.academicYearName,
              })
            : undefined
        }
        back={{ href: `/explore/${schoolId}`, label: school.name }}
      />
      {!open ? (
        <EmptyState
          title={t("admissions.noOpenCycle")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href={`/explore/${schoolId}`}>{school.name}</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardBody className="space-y-4 pt-5">
            {open.notice && (
              <p className="whitespace-pre-wrap rounded-[--radius-md] bg-surface-muted px-3 py-2 text-sm text-fg">
                {open.notice}
              </p>
            )}
            <ul className="space-y-1 text-sm text-fg-muted">
              {open.grades.map((g) => (
                <li
                  key={g.grade}
                >{`${t("admissions.grade")} ${g.grade} · ${t("admissions.seatsLeft", { remaining: g.remaining, seats: g.seats })}`}</li>
              ))}
              {open.closesAt && (
                <li>
                  {t("admissions.closesOn", {
                    date: formatDateKey(open.closesAt, undefined, locale),
                  })}
                </li>
              )}
              {open.documents.length > 0 && (
                <li>
                  {t("admissions.documentsAsked", {
                    names: open.documents.map((d) => d.name).join(", "),
                  })}
                </li>
              )}
              {open.testRequired && <li>{t("admissions.testAsked")}</li>}
            </ul>
            <ApplyForm
              schoolId={schoolId}
              cycleId={open.cycleId}
              grades={open.grades.map((g) => g.grade)}
              existing={mine.map((m) => ({ id: m.id, childName: m.childName }))}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
