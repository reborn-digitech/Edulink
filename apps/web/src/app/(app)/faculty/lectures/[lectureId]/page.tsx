import type { Metadata } from "next";
import { randomBytes } from "node:crypto";
import { CheckSquareIcon } from "@phosphor-icons/react/ssr";
import { LECTURE_MARKS } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash } from "@/components/module-flash";
import { LECTURE_KIND_KEY, MARK_KEY, clock } from "@/components/academics/parts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { lectureSheet } from "@/lib/academics-attendance";
import { getT } from "@/lib/i18n/server";
import { markLectureAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.markLecture") };
}

/**
 * One lecture's register: every student registered on the offering, present
 * unless marked otherwise, with their running percentage. The form carries a
 * client id minted for this render, so a second press of the same form
 * writes nothing; the phone does the same through its outbox.
 */
export default async function LecturePage({ params, searchParams }: { params: Promise<{ lectureId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff module="ACADEMICS" t={t} college />;
  const { lectureId } = await params;
  const sheet = await lectureSheet(ctx, lectureId);
  const l = sheet.lecture;
  const clientId = `web-${randomBytes(9).toString("hex")}`;
  return (
    <div className="space-y-6">
      <PageHeader title={[l.courseCode, l.courseName].join(" · ")} description={[l.dateKey, clock(l.startMinute, l.endMinute), t(LECTURE_KIND_KEY[l.kind]!), l.divisionName, l.roomName].filter(Boolean).join(" · ")} />
      <ModuleFlash t={t} params={await searchParams} />
      <Card>
        <CardHeader icon={<CheckSquareIcon weight="duotone" className="size-5" />} title={t("academics.registerTitle", { n: sheet.entries.length })} description={t("academics.registerBody", { threshold: sheet.threshold })} />
        <CardBody>
          {sheet.entries.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.noRegistered")} description={t("academics.noRegisteredBody")} />
          ) : (
            <form action={markLectureAction} className="space-y-4">
              <input type="hidden" name="lectureId" value={l.lectureId} />
              <input type="hidden" name="clientId" value={clientId} />
              <ul className="divide-y divide-border text-sm">
                {sheet.entries.map((e) => (
                  <li key={e.studentMembershipId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <input type="hidden" name="student" value={e.studentMembershipId} />
                    <span>
                      <span className="tabular-nums text-fg-muted">{e.rollNumber ?? "—"}</span> <span className="font-medium text-fg">{e.name}</span>{" "}
                      {e.percent !== null ? <Badge tone={e.percent >= sheet.threshold ? "ok" : "danger"}>{`${e.percent}%`}</Badge> : null}
                    </span>
                    <fieldset className="flex gap-1" disabled={!sheet.canMark}>
                      <legend className="sr-only">{e.name}</legend>
                      {LECTURE_MARKS.map((m) => (
                        <label key={m} className="flex min-h-11 cursor-pointer items-center gap-1 rounded-[--radius-md] border border-border px-2">
                          <input type="radio" name={`mark:${e.studentMembershipId}`} value={m} defaultChecked={(e.status ?? "PRESENT") === m} />
                          {t(MARK_KEY[m]!)}
                        </label>
                      ))}
                    </fieldset>
                  </li>
                ))}
              </ul>
              {sheet.canMark ? <Button type="submit">{t(l.marked ? "academics.saveChanges" : "academics.saveMarks")}</Button> : <p className="text-sm text-fg-muted">{t("academics.cannotMark")}</p>}
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
