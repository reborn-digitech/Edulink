import type { Metadata } from "next";
import Link from "next/link";
import { BooksIcon, ChartBarIcon, ListNumbersIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { officeSyllabus } from "@/lib/syllabus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { ListEditor } from "./list-editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("syllabus.metaTitle") };
}

/**
 * The office's chapter lists, one per grade and subject. The pair is in the
 * URL, so a list can be bookmarked and the save lands back on it; the two
 * pickers are plain text fields with the school's grades and subjects as
 * suggestions, so a subject nobody has timetabled yet can still get its
 * list. The editor itself is the client component beside this file.
 */
export default async function SyllabusPage({ searchParams }: { searchParams: Promise<{ gradeLevel?: string; subject?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { gradeLevel: wantedGrade, subject: wantedSubject } = await searchParams;

  const data = await officeSyllabus(ctx, { gradeLevel: wantedGrade?.slice(0, 20), subject: wantedSubject?.slice(0, 60) });
  const chosen = data.gradeLevel && data.subject ? { gradeLevel: data.gradeLevel, subject: data.subject } : null;
  const pairHref = (g: string, s: string) => `/admin/syllabus?gradeLevel=${encodeURIComponent(g)}&subject=${encodeURIComponent(s)}`;
  const link = "font-medium text-accent-strong underline underline-offset-2 hover:text-accent";
  const chosenTitle = chosen ? [t("syllabus.grade"), chosen.gradeLevel, "·", chosen.subject].join(" ") : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("syllabus.title")}
        description={t("syllabus.intro")}
        actions={
          <Button asChild variant="secondary" size="sm" icon={<ChartBarIcon weight="bold" />}>
            <Link href="/admin/syllabus/coverage">{t("syllabus.coverageTitle")}</Link>
          </Button>
        }
      />

      {/* ---- the pickers ---- */}
      <Card>
        <CardBody className="pt-5">
          <form method="get" action="/admin/syllabus" className="space-y-3">
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-fg">{t("syllabus.pickList")}</legend>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,12rem)_minmax(0,20rem)_auto] sm:items-end">
                <TextField label={t("syllabus.grade")} name="gradeLevel" list="syllabus-grades" defaultValue={data.gradeLevel ?? wantedGrade ?? ""} maxLength={20} autoComplete="off" required />
                <datalist id="syllabus-grades">
                  {data.grades.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <TextField label={t("syllabus.subject")} name="subject" list="syllabus-subjects" defaultValue={data.subject ?? wantedSubject ?? ""} maxLength={60} autoComplete="off" required />
                <datalist id="syllabus-subjects">
                  {data.subjects.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <Button type="submit" variant="secondary" icon={<ListNumbersIcon weight="bold" />}>
                  {t("syllabus.openSyllabus")}
                </Button>
              </div>
            </fieldset>
          </form>
        </CardBody>
      </Card>

      {/* ---- the lists so far ---- */}
      {data.lists.length === 0 && !chosen ? (
        <EmptyState icon={<BooksIcon weight="duotone" className="size-6" />} title={t("syllabus.noLists")} description={t("syllabus.noListsBody")} />
      ) : (
        data.lists.length > 0 && (
          <section aria-label={t("syllabus.lists")} className="space-y-2">
            <h2 className="text-sm font-semibold text-fg">{t("syllabus.lists")}</h2>
            <ul className="flex flex-wrap gap-2">
              {data.lists.map((list) => {
                const current = chosen?.gradeLevel === list.gradeLevel && chosen.subject === list.subject;
                return (
                  <li key={`${list.gradeLevel}|${list.subject}`}>
                    <Link
                      href={pairHref(list.gradeLevel, list.subject)}
                      aria-current={current ? "page" : undefined}
                      className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${current ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-border text-fg"}`}
                    >
                      <span>
                        {t("syllabus.grade")} {list.gradeLevel} · {list.subject}
                      </span>
                      <Badge tone={current ? "accent" : "neutral"} size="sm">
                        {t("syllabus.unitsCount", { count: list.units })}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )
      )}

      {/* ---- the chosen list ---- */}
      {chosen && (
        <Card>
          <CardHeader
            icon={<BooksIcon weight="duotone" className="size-5" />}
            title={chosenTitle}
            description={t("syllabus.unitsCount", { count: data.units.length })}
            action={
              <Link href="/admin/syllabus/coverage" className={`text-sm ${link}`}>
                {t("syllabus.coverageTitle")}
              </Link>
            }
          />
          <CardBody>
            <ListEditor key={`${chosen.gradeLevel}|${chosen.subject}|${data.units.map((u) => u.id).join(",")}`} gradeLevel={chosen.gradeLevel} subject={chosen.subject} units={data.units} readOnly={ctx.role !== "ADMIN"} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
