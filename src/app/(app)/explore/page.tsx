import type { Metadata } from "next";
import Link from "next/link";
import { BuildingsIcon, BriefcaseIcon } from "@phosphor-icons/react/ssr";
import { requireUser } from "@/lib/tenancy";
import { redirect } from "next/navigation";
import { listDirectory } from "@/lib/school-profile";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("explore.metaTitle") };
}

/**
 * The directory. Any signed-in person may browse — what is listed is only
 * what schools chose to publish — but the enquiry door on each profile is a
 * parent's alone.
 */
export default async function ExplorePage() {
  const t = await getT();
  const ctx = await requireUser();
  if (!ctx.role) redirect("/switch");
  const schools = await listDirectory(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("explore.title")}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("explore.intro")}</p>
      </div>

      {schools.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon className="size-8" aria-hidden="true" />}
          title={t("explore.emptyTitle")}
          description={t("explore.emptyBody")}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {schools.map((school) => (
            <li key={school.schoolId}>
              <Card interactive className="h-full">
                <Link href={`/explore/${school.schoolId}`} className="block h-full">
                  <CardBody className="space-y-2 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-fg">{school.name}</span>
                      {school.ours && (
                        <Badge tone="info" size="sm">
                          {t("explore.yourSchool")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-fg-muted">
                      {[school.city, school.region, school.country].filter(Boolean).join(", ")}
                    </p>
                    {school.about && (
                      <p className="line-clamp-2 text-sm text-fg-muted">{school.about}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                      {school.gradeLow && school.gradeHigh && (
                        <span>
                          {t("explore.grades", { low: school.gradeLow, high: school.gradeHigh })}
                        </span>
                      )}
                      {school.openVacancies > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <BriefcaseIcon className="size-3.5" aria-hidden="true" />
                          {school.openVacancies === 1
                            ? t("explore.openVacanciesOne")
                            : t("explore.openVacanciesMany", { count: school.openVacancies })}
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
