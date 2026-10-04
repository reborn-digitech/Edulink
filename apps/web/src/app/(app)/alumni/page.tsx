import type { Metadata } from "next";
import Link from "next/link";
import {
  AddressBookIcon,
  ChatCircleDotsIcon,
  FileTextIcon,
  GlobeIcon,
  MegaphoneIcon,
  NotePencilIcon,
  PauseCircleIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { alumniHome } from "@/lib/alumni";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { formatInZone } from "@/lib/dates";
import { StaffList } from "./staff-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.alumniName") };
}

/**
 * THE ALUMNUS HOME (the alumni module, 3 Oct 2026): the old school's feed,
 * its staff to write to (former teachers first), notes the school sent,
 * the directory, and the record they already own. While the school has the
 * module off it says so and nothing else — the rows are kept, not shown.
 */
export default async function AlumniHome() {
  const ctx = await requireRole("ALUMNUS");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ALUMNI"))) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("modules.alumniName")} />
        <ModuleOff module="ALUMNI" t={t} />
      </div>
    );
  }
  const home = await alumniHome(ctx);
  const batch = home.lastClass ? t("alumni.batchLineClass", { class: home.lastClass, year: home.batchYear }) : t("alumni.batchLine", { year: home.batchYear });
  const canShare = home.feedMode === "POST" && !home.muted;

  return (
    <div className="space-y-6">
      <PageHeader title={t("modules.alumniName")} description={t("modules.alumniWelcome", { school: home.schoolName })} />
      <p className="text-sm text-fg-muted" data-testid="alumni-batch">
        {batch} · {t(`alumni.feed${home.feedMode}`)}
      </p>

      {home.muted && (
        <p role="status" className="flex items-start gap-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft px-4 py-3 text-sm font-medium text-warn">
          <PauseCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {t("alumni.mutedBanner")}
            {home.muteReason && <span className="block font-normal">{t("alumni.mutedReason", { reason: home.muteReason })}</span>}
          </span>
        </p>
      )}

      <Card>
        <CardBody className="flex flex-wrap gap-3">
          <Button asChild variant="primary">
            <Link href="/bulletin">
              <MegaphoneIcon weight="duotone" className="size-5" aria-hidden />
              {t("modules.alumniFeed")}
            </Link>
          </Button>
          {/* Every school's and college's shared posts (4 Oct 2026): an alumnus reads the global feed too. */}
          <Button asChild variant="secondary">
            <Link href="/bulletin/global">
              <GlobeIcon weight="duotone" className="size-5" aria-hidden />
              {t("alumni.homeGlobalFeed")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/remarks">
              <ChatCircleDotsIcon weight="duotone" className="size-5" aria-hidden />
              {t("modules.alumniMessages")}
            </Link>
          </Button>
          {canShare && (
            <Button asChild variant="secondary">
              <Link href="/alumni/share">
                <NotePencilIcon weight="duotone" className="size-5" aria-hidden />
                {t("alumni.homeShare")}
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary">
            <Link href="/alumni/directory">
              <AddressBookIcon weight="duotone" className="size-5" aria-hidden />
              {t("alumni.directoryOpen")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/record">
              <FileTextIcon weight="duotone" className="size-5" aria-hidden />
              {t("modules.alumniRecord")}
            </Link>
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("alumni.formerTeachersTitle")}
          description={t("alumni.homeMessagesHint")}
          action={
            <Button asChild variant="secondary" size="sm">
              <Link href="/alumni/staff">{t("alumni.otherStaff")}</Link>
            </Button>
          }
        />
        <CardBody>
          {home.formerTeachers.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("alumni.formerTeachersEmpty")}</p>
          ) : (
            <StaffList people={home.formerTeachers} schoolId={home.schoolId} t={t} disabled={home.muted} />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("alumni.notesTitle")} />
        <CardBody>
          {home.notes.length === 0 ? (
            <EmptyState icon={<MegaphoneIcon weight="duotone" className="size-8" />} title={t("alumni.notesEmpty")} />
          ) : (
            <ul className="space-y-4">
              {home.notes.map((note) => (
                <li key={note.id} className="rounded-[--radius-md] border border-border p-4">
                  <p className="text-xs text-fg-muted">
                    {note.batchYear ? t("alumni.noteForBatch", { year: note.batchYear }) : t("alumni.noteForAll")} ·{" "}
                    {formatInZone(note.createdAt, "Asia/Kolkata", { dateStyle: "medium" })}
                  </p>
                  <p className="mt-1 font-semibold text-fg">{note.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-fg">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
