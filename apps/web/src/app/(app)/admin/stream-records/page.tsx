import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { notFound } from "next/navigation";
import { ChalkboardTeacherIcon, FlaskIcon, GavelIcon, HandHeartIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { streamRecordsSummary } from "@/lib/stream-records";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("streamRecords.title") };
}

/**
 * THE STREAM RECORDS' OVERVIEW (5 Oct 2026) for the office and the head: the
 * year's figures of each record the college's streams make its own — the
 * labs' batches and practical record, a law college's moots and internship
 * weeks, an education college's teaching practice — and NSS and NCC, which
 * every stream but health sciences raises; each card opens its page. A record
 * no stream of the college keeps is left out rather than drawn empty.
 */
export default async function StreamRecordsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const s = await streamRecordsSummary(ctx);
  const yearLabel = `${s.year}–${String((s.year + 1) % 100).padStart(2, "0")}`;
  const corpsOn = s.streams.some((x) => x !== "HEALTH_SCIENCES");
  return (
    <div className="space-y-6">
      <PageHeader title={t("streamRecords.title")} description={t("streamRecords.intro", { year: yearLabel })} />

      {s.labs ? (
        <Card data-record="labs">
          <CardHeader icon={<FlaskIcon weight="duotone" className="size-5" />} title={t("streamRecords.labsTitle")} description={t("streamRecords.labsBody")} />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label={t("streamRecords.statBatches")} value={s.practical.batches} />
              <StatTile label={t("streamRecords.statRecords")} value={s.practical.records} />
              <StatTile label={t("streamRecords.statSigned")} value={s.practical.signed} tone="ok" />
              <StatTile label={t("streamRecords.statUnsigned")} value={s.practical.unsigned} tone={s.practical.unsigned ? "warn" : "neutral"} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary"><Link href="/admin/stream-records/lab-batches">{t("streamRecords.openBatches")}</Link></Button>
              <Button asChild size="sm" variant="secondary"><Link href="/admin/stream-records/practicals">{t("streamRecords.openPracticals")}</Link></Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {s.law ? (
        <Card data-record="law">
          <CardHeader icon={<GavelIcon weight="duotone" className="size-5" />} title={t("streamRecords.lawTitle")} description={t("streamRecords.lawBody")} />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label={t("streamRecords.statMoots")} value={s.lawInternships.mootCourts.total} />
              <StatTile label={t("streamRecords.statInternships")} value={s.lawInternships.internships} />
              <StatTile label={t("streamRecords.statLawStudents")} value={s.lawInternships.students} />
              <StatTile label={t("streamRecords.statMeetingBci")} value={`${s.lawInternships.meetingMinimum} / ${s.lawInternships.students}`} tone={s.lawInternships.meetingMinimum < s.lawInternships.students ? "warn" : "ok"} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary"><Link href="/admin/stream-records/moot-courts">{t("streamRecords.openMoots")}</Link></Button>
              <Button asChild size="sm" variant="secondary"><Link href="/placement/internships">{t("streamRecords.openInternships")}</Link></Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {s.education ? (
        <Card data-record="teaching-practice">
          <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("streamRecords.practiceTitle")} description={t("streamRecords.practiceBody", { weeks: s.teachingPractice.minimumWeeks })} />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label={t("streamRecords.statPracticeSchools")} value={s.teachingPractice.practiceSchools} />
              <StatTile label={t("streamRecords.statPostings")} value={s.teachingPractice.postings} />
              <StatTile label={t("streamRecords.statObserved")} value={`${s.teachingPractice.lessonsObserved} / ${s.teachingPractice.lessonsPlanned}`} />
              <StatTile label={t("streamRecords.statMeetingNcte")} value={`${s.teachingPractice.meetingMinimum} / ${s.teachingPractice.students}`} tone={s.teachingPractice.meetingMinimum < s.teachingPractice.students ? "warn" : "ok"} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary"><Link href="/duties/teaching-practice">{t("streamRecords.openPractice")}</Link></Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {corpsOn ? (
        <Card data-record="corps">
          <CardHeader icon={<HandHeartIcon weight="duotone" className="size-5" />} title={t("streamRecords.corpsTitle")} description={t("streamRecords.corpsBody", { hours: s.corps.hoursPerYear })} />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label={t("streamRecords.statNssEnrolled")} value={s.corps.nss.enrolled} />
              <StatTile label={t("streamRecords.statNssHours")} value={s.corps.nss.hours} />
              <StatTile label={t("streamRecords.statNccEnrolled")} value={s.corps.ncc.enrolled} />
              <StatTile label={t("streamRecords.statCamps")} value={s.corps.nss.camps + s.corps.ncc.camps} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary"><Link href="/duties/nss">{t("streamRecords.openNss")}</Link></Button>
              <Button asChild size="sm" variant="secondary"><Link href="/duties/ncc">{t("streamRecords.openNcc")}</Link></Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {!s.labs && !s.law && !s.education && !corpsOn ? (
        <EmptyState
          title={t("streamRecords.title")}
          description={t("streamRecords.noneForStreams")}
          action={
            ctx.role === "ADMIN" ? (
              <Button asChild size="sm" variant="secondary">
                <Link href="/admin/settings/college">{t("streams.homeEdit")}</Link>
              </Button>
            ) : undefined
          }
        />
      ) : null}
    </div>
  );
}
