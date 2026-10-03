import type { Metadata } from "next";
import Link from "next/link";
import { AddressBookIcon, ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { alumniDirectory } from "@/lib/alumni";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DirectoryForm } from "./directory-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("alumni.directoryTitle") };
}

/**
 * The alumni directory (the alumni module, 3 Oct 2026): the former pupils who
 * chose to be listed, for the school's alumni and its staff. An adult
 * alumnus joins, changes or leaves their own entry here; a minor is told when
 * they may.
 */
export default async function AlumniDirectoryPage() {
  const ctx = await requireRole("ALUMNUS", "ADMIN", "PRINCIPAL", "TEACHER");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ALUMNI"))) return <ModuleOff module="ALUMNI" t={t} />;
  const directory = await alumniDirectory(ctx);
  const back = ctx.role === "ALUMNUS" ? "/alumni" : ctx.role === "ADMIN" ? "/admin/alumni" : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {back && (
        <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("modules.alumniName")}
        </Link>
      )}
      <PageHeader title={t("alumni.directoryTitle")} description={t("alumni.directoryIntro")} />

      {directory.me && (
        <Card>
          <CardHeader title={t("alumni.directoryJoinTitle")} description={directory.canJoin ? t("alumni.directoryJoinIntro") : t("alumni.directoryMinor")} />
          {directory.canJoin && (
            <CardBody>
              <DirectoryForm me={directory.me} />
            </CardBody>
          )}
        </Card>
      )}

      {directory.entries.length === 0 ? (
        <EmptyState icon={<AddressBookIcon weight="duotone" className="size-8" />} title={t("alumni.directoryEmpty")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-[--radius-lg] border border-border bg-surface" data-testid="alumni-directory">
          {directory.entries.map((entry) => (
            <li key={entry.membershipId} className="flex items-start gap-3 p-4">
              <Avatar avatarKey={entry.avatarKey} name={entry.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                  {entry.name}
                  <Badge tone="accent" size="sm">
                    {t("alumni.batchOf", { year: entry.batchYear })}
                  </Badge>
                  {entry.mentor && (
                    <Badge tone="ok" size="sm">
                      {t("alumni.mentorBadge")}
                    </Badge>
                  )}
                </p>
                {(entry.occupation || entry.city) && <p className="mt-0.5 text-sm text-fg">{[entry.occupation, entry.city].filter(Boolean).join(" · ")}</p>}
                <p className="mt-0.5 text-xs text-fg-muted">
                  {entry.contactPref === "EMAIL" && entry.email ? (
                    <a href={`mailto:${entry.email}`} className="underline">
                      {entry.email}
                    </a>
                  ) : entry.contactPref === "OFFICE" ? (
                    t("alumni.viaOffice")
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
