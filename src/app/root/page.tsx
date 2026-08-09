import Link from "next/link";
import { BuildingsIcon, PlusIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listSchools } from "@/lib/superuser";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { relativeTime } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.schools") };
}

export default async function RootPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const schools = await listSchools(session);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("root.schools")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {schools.length === 0
              ? t("root.nothingHereYet")
              : schools.length === 1
                ? t("root.schoolsOnServerOne")
                : t("root.schoolsOnServerMany", { count: schools.length })}
          </p>
        </div>
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/root/new">{t("root.addSchool")}</Link>
        </Button>
      </div>

      {/* Said once, on the page it applies to, rather than only in a comment. */}
      <p className="rounded-[--radius-md] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {t("root.operatorIntro")}
      </p>

      {schools.length === 0 ? (
        <EmptyState
          icon={<BuildingsIcon weight="duotone" className="size-8" />}
          title={t("root.noSchoolsYet")}
          description={t("root.addFirstOne")}
          action={
            <Button asChild>
              <Link href="/root/new">{t("root.addSchool")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {schools.map((school) => (
            <li key={school.id}>
              <Card className={school.removedAt ? "opacity-70" : undefined}>
                <Link href={`/root/${school.id}`} className="block p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg">{school.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {[school.city, school.country].filter(Boolean).join(", ") || t("root.noAddress")} ·{" "}
                        {school.removedAt
                          ? t("root.removedAgo", { when: relativeTime(school.removedAt) })
                          : t("root.joinedAgo", { when: relativeTime(school.createdAt) })}
                      </p>
                      {!school.removedAt && (
                        <p className="mt-0.5 truncate text-xs text-fg-subtle">
                          {t("root.joinCode")} <span className="font-mono font-semibold">{school.code}</span>
                          {school.gradeLow && school.gradeHigh
                            ? ` · ${t("root.gradesRange", { low: school.gradeLow, high: school.gradeHigh })}`
                            : ` · ${t("root.noGradeRange")}`}
                        </p>
                      )}
                    </div>

                    {school.removedAt ? (
                      <Badge tone="danger" size="sm">
                        {t("root.removedBadge")}
                      </Badge>
                    ) : (
                      <>
                        {school.pendingAdminInvites > 0 && (
                          <Badge tone="warn" size="sm">
                            {school.pendingAdminInvites === 1
                              ? t("root.invitesPendingOne")
                              : t("root.invitesPendingMany", { count: school.pendingAdminInvites })}
                          </Badge>
                        )}
                        {!school.gradeLow || !school.gradeHigh ? (
                          <span
                            className="flex items-center gap-1 text-xs font-medium text-warn"
                            title={t("root.needsSetupTitle")}
                          >
                            <WarningIcon weight="bold" className="size-4" />
                            {t("root.needsSetup")}
                          </span>
                        ) : null}
                      </>
                    )}
                  </div>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
