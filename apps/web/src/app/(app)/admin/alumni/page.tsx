import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCapIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { alumniForOffice } from "@/lib/alumni";
import { getT } from "@/lib/i18n/server";
import { formatInZone } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { AlumnusControls, FeedModeForm, NoteForm } from "./controls";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.alumniName") };
}

/**
 * The office's alumni page (the alumni module, 3 Oct 2026): the school's
 * former pupils by batch, a note to a batch, what alumni may do on the feed,
 * and each alumnus's pause and mentor switches. The head reads it.
 */
export default async function AdminAlumniPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ALUMNI"))) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("modules.alumniName")} />
        <ModuleOff module="ALUMNI" t={t} />
      </div>
    );
  }
  const { q } = await searchParams;
  const view = await alumniForOffice(ctx, q?.slice(0, 80) ?? "");
  const office = ctx.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("modules.alumniName")}
        description={t("alumni.adminIntro")}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/alumni/directory">{t("alumni.directoryOpen")}</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("alumni.adminBatches")} />
          <CardBody>
            {view.batches.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("alumni.adminNoAlumni")}</p>
            ) : (
              <ul className="divide-y divide-border" data-testid="alumni-batches">
                {view.batches.map((b) => (
                  <li key={b.year} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="font-semibold text-fg">{t("alumni.batchOf", { year: b.year })}</span>
                    <span className="text-fg-muted">{t("alumni.adminBatchRow", { count: b.count, listed: b.listed })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("alumni.adminFeedTitle")} description={t("alumni.adminFeedIntro")} />
          <CardBody>{office ? <FeedModeForm current={view.feedMode} /> : <p className="text-sm text-fg">{t(`alumni.feedMode${view.feedMode}`)}</p>}</CardBody>
        </Card>
      </div>

      {office && (
        <Card>
          <CardHeader title={t("alumni.adminNoteTitle")} />
          <CardBody>
            <NoteForm years={view.batches.map((b) => b.year)} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title={t("alumni.adminPeople")} description={t("alumni.adminMentorHint")} />
        <CardBody className="space-y-4">
          <form role="search">
            <label htmlFor="alumni-q" className="sr-only">
              {t("alumni.adminSearch")}
            </label>
            <input id="alumni-q" name="q" defaultValue={q ?? ""} placeholder={t("alumni.adminSearch")} className="h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] text-fg" />
          </form>
          {view.alumni.length === 0 ? (
            <EmptyState icon={<GraduationCapIcon weight="duotone" className="size-8" />} title={t("alumni.adminNoAlumni")} />
          ) : (
            <ul className="divide-y divide-border" data-testid="alumni-people">
              {view.alumni.map((a) => (
                <li key={a.membershipId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                      {a.name}
                      <Badge tone="accent" size="sm">
                        {t("alumni.batchOf", { year: a.batchYear })}
                      </Badge>
                      {a.isMinor && <Badge size="sm">{t("alumni.adminMinor")}</Badge>}
                      {a.listed && <Badge tone="info" size="sm">{t("alumni.adminListed")}</Badge>}
                      {a.mentor && <Badge tone="ok" size="sm">{t("alumni.mentorBadge")}</Badge>}
                      {a.muted && <Badge tone="warn" size="sm">{t("alumni.adminMuted")}</Badge>}
                    </p>
                    {a.lastClass && <p className="text-xs text-fg-muted">{t("alumni.batchLineClass", { class: a.lastClass, year: a.batchYear })}</p>}
                    {a.muted && a.muteReason && <p className="text-xs text-fg-muted">{t("alumni.mutedReason", { reason: a.muteReason })}</p>}
                  </div>
                  {office && <AlumnusControls membershipId={a.membershipId} muted={a.muted} mentor={a.mentor} isMinor={a.isMinor} />}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {view.notes.length > 0 && (
        <Card>
          <CardHeader title={t("alumni.adminNotesSent")} />
          <CardBody>
            <ul className="space-y-3">
              {view.notes.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className="font-semibold text-fg">{n.title}</p>
                  <p className="text-xs text-fg-muted">
                    {n.batchYear ? t("alumni.noteForBatch", { year: n.batchYear }) : t("alumni.noteForAll")} · {formatInZone(n.createdAt, "Asia/Kolkata", { dateStyle: "medium" })} ·{" "}
                    {t("alumni.adminNoteReach", { count: n.recipientCount })}
                  </p>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
