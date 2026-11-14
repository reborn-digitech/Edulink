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
 * page back rather than a form that would be refused. With several open at
 * once (QA-17: a mid-year round beside next year's) the family picks the
 * round (`?cycle=`, the school page's Apply links name it); the first is
 * chosen otherwise.
 */
export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ cycle?: string | string[] }>;
}) {
  const ctx = await requireUser();
  if (ctx.role !== "PARENT") redirect("/switch");
  const t = await getT();
  const locale = await getLocale();
  const { schoolId } = await params;
  const school = await readSchoolProfile(ctx, schoolId);
  if (!school) notFound();
  const { cycles, mine } = await schoolAdmissions(ctx, schoolId);
  const asked = (await searchParams).cycle;
  const open = cycles.find((c) => c.cycleId === (Array.isArray(asked) ? asked[0] : asked)) ?? cycles[0] ?? null;

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
            {cycles.length > 1 && (
              <nav aria-label={t("admissions.chooseCycle")} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("admissions.chooseCycle")}</p>
                <ul className="flex flex-wrap gap-2">
                  {cycles.map((c) => (
                    <li key={c.cycleId}>
                      <Button asChild size="sm" variant={c.cycleId === open.cycleId ? "primary" : "secondary"}>
                        <Link href={`/explore/${schoolId}/apply?cycle=${encodeURIComponent(c.cycleId)}`} aria-current={c.cycleId === open.cycleId ? "page" : undefined}>
                          {t("admissions.applyIntro", { cycle: c.name, year: c.academicYearName })}
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {open.notice && (
              <p className="whitespace-pre-wrap rounded-[var(--radius-md)] bg-surface-muted px-3 py-2 text-sm text-fg">
                {open.notice}
              </p>
            )}
            <ul className="space-y-1 text-sm text-fg-muted">
              {open.grades.map((g) => (
                <li
                  key={g.grade}
                >{`${t("admissions.grade")} ${g.grade} · ${(g.seats === 1 ? t("admissions.seatsLeftOne", { remaining: g.remaining, seats: 1 }) : t("admissions.seatsLeft", { remaining: g.remaining, seats: g.seats }))}`}</li>
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
              key={open.cycleId}
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
