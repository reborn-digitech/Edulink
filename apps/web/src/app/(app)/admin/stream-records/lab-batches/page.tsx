import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { LAB_BATCH_MAX_SIZE, LAB_BATCH_MIN_SIZE } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { labBatches } from "@/lib/stream-records";
import { getT } from "@/lib/i18n/server";
import { moveToLabBatchAction, splitLabBatchesAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("streamRecords.batches.title") };
}

/**
 * LAB BATCHES (5 Oct 2026): every division with its batches and the students
 * in none. The office splits a division evenly by roll number (a size, twenty
 * unless it says) and moves a student between batches; the head reads. A LAB
 * hour on the timetable may then name a batch, and its lectures' rosters are
 * the batch's.
 */
export default async function LabBatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const data = await labBatches(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("streamRecords.batches.title")} description={t("streamRecords.batches.intro", { size: data.defaultSize })} back={{ href: "/admin/stream-records", label: t("streamRecords.title") }} />
      <RecordsFlash t={t} params={params} />
      {!data.offered ? <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("streamRecords.batches.notOffered")}</p> : null}
      {data.divisions.length === 0 ? (
        <EmptyState icon={<UsersThreeIcon weight="duotone" className="size-6" />} title={t("streamRecords.batches.noDivisions")} description={t("streamRecords.batches.noDivisionsBody")} action={<Button asChild size="sm" variant="secondary"><Link href="/admin/academics/terms">{t("streamRecords.batches.toAcademics")}</Link></Button>} />
      ) : (
        data.divisions.map((d) => (
          <Card key={d.divisionId} data-division={d.divisionId}>
            <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={d.name} description={t("streamRecords.batches.divisionLine", { programme: d.programmeCode, year: d.yearOfStudy, academicYear: d.academicYear, students: d.students, batches: d.batches.length })} />
            <CardBody className="space-y-4">
              {d.batches.length === 0 ? <p className="text-sm text-fg-muted">{t("streamRecords.batches.none")}</p> : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {d.batches.map((b) => (
                  <div key={b.id} className="rounded-[--radius-md] border border-border p-3">
                    <p className="text-sm font-semibold text-fg">{t("streamRecords.batchN", { name: b.name })} <span className="font-normal text-fg-muted">· {t("streamRecords.batches.members", { count: b.members.length, capacity: b.capacity })}</span></p>
                    <ul className="mt-1 text-sm text-fg">
                      {b.members.map((m) => (
                        <li key={m.studentMembershipId}>{m.rollNumber !== null ? `${m.rollNumber}. ` : ""}{m.name}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {d.unbatched.length > 0 ? <p className="text-sm text-warn">{t("streamRecords.batches.unbatched", { names: d.unbatched.map((u) => u.name).join(", ") })}</p> : null}
              {data.canEdit && data.offered ? (
                <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-2">
                  <form action={splitLabBatchesAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="divisionId" value={d.divisionId} />
                    <TextField name="size" type="number" min={LAB_BATCH_MIN_SIZE} max={LAB_BATCH_MAX_SIZE} label={t("streamRecords.batches.fieldSize")} defaultValue={String(d.batches[0]?.capacity ?? data.defaultSize)} className="w-36" />
                    <Button type="submit" variant="secondary">{t(d.batches.length ? "streamRecords.batches.resplit" : "streamRecords.batches.split")}</Button>
                  </form>
                  {d.batches.length > 1 ? (
                    <form action={moveToLabBatchAction} className="flex flex-wrap items-end gap-3">
                      <SelectField name="student" label={t("streamRecords.batches.fieldStudent")} required className="min-w-48">
                        {[...d.batches.flatMap((b) => b.members), ...d.unbatched].map((m) => (
                          <option key={m.studentMembershipId} value={m.studentMembershipId}>{m.name}</option>
                        ))}
                      </SelectField>
                      <SelectField name="batchId" label={t("streamRecords.batches.fieldBatch")} required className="w-32">
                        {d.batches.map((b) => (
                          <option key={b.id} value={b.id}>{t("streamRecords.batchN", { name: b.name })}</option>
                        ))}
                      </SelectField>
                      <Button type="submit" variant="secondary">{t("streamRecords.batches.move")}</Button>
                    </form>
                  ) : null}
                </div>
              ) : null}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
