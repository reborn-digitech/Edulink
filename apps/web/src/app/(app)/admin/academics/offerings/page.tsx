import type { Metadata } from "next";
import Link from "next/link";
import { ChalkboardTeacherIcon, ScalesIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { KIND_KEY, LOAD_KEY, OfficeTop } from "@/components/academics/parts";
import { OfferingForm } from "@/components/academics/offering-form";
import { TermPicker } from "@/components/academics/term-picker";
import { academicsStructure, listOfferings } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { academicsGate, one, type SearchParams } from "../shared";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabOfferings") };
}

/** The term's offerings with faculty and weekly load, each faculty member's hours against the band, and students per faculty member by department. */
export default async function OfferingsPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const [s, o] = await Promise.all([academicsStructure(ctx), listOfferings(ctx, { termId: one(params.termId) })]);
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="offerings" params={params} />
      <TermPicker t={t} terms={s.terms} current={o.termId} path="/admin/academics/offerings" />
      <Card>
        <CardHeader icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />} title={t("academics.offeringsTitle")} description={t("academics.offeringsBody")} />
        <CardBody className="space-y-4">
          {o.offerings.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.offeringsNone")} description={t("academics.offeringsNoneBody")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.fieldCourse")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldKind")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldDivision")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldFaculty")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colHours")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colRegistered")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {o.offerings.map((x) => (
                    <tr key={x.id}>
                      <td className={TD}>
                        <Link className={LINK} href={`/admin/academics/attendance?offeringId=${x.id}`}>{x.courseCode}</Link> <span className="text-fg-muted">{x.courseName}</span>
                      </td>
                      <td className={TD}>{t(KIND_KEY[x.kind]!)}</td>
                      <td className={TD}>{x.divisionName ?? t("academics.sharedAcrossDivisions")}</td>
                      <td className={TD}>{x.facultyName ?? <Badge tone="warn">{t("academics.unstaffed")}</Badge>}</td>
                      <td className={NUM}>{t("academics.hoursLtp", { l: x.lectureHours, t: x.tutorialHours, p: x.practicalHours })}</td>
                      <td className={NUM}>{x.capacity ? `${x.registered}/${x.capacity}` : x.registered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {canEdit && o.termId ? <OfferingForm t={t} s={s} termId={o.termId} back="/admin/academics/offerings" /> : null}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ScalesIcon weight="duotone" className="size-5" />} title={t("academics.loadTitle")} description={t("academics.loadBody", { min: o.settings.loadMinHours, max: o.settings.loadMaxHours })} />
        <CardBody className="grid gap-6 lg:grid-cols-2">
          <ul className="divide-y divide-border text-sm">
            {o.load.map((l) => (
              <li key={l.membershipId} className="flex items-center justify-between gap-2 py-2">
                <span className="text-fg">{l.name}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-fg-muted">{t("academics.hoursWeek", { n: l.hours })}</span>
                  <Badge tone={l.state === "WITHIN" ? "ok" : l.state === "OVER" ? "danger" : "warn"}>{t(LOAD_KEY[l.state]!)}</Badge>
                </span>
              </li>
            ))}
          </ul>
          <ul className="divide-y divide-border text-sm">
            {o.ratios.map((r) => (
              <li key={r.departmentId} className="flex items-center justify-between gap-2 py-2">
                <span className="text-fg">{r.name}</span>
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-fg-muted">{t("academics.ratioLine", { students: r.students, faculty: r.faculty, per: r.perFaculty ?? "—" })}</span>
                  <Badge tone={r.withinNorm ? "ok" : "warn"}>{t(r.withinNorm ? "academics.ratioWithin" : "academics.ratioOver", { norm: r.norm })}</Badge>
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
