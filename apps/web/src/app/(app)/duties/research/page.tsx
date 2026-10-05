import type { Metadata } from "next";
import { ArticleIcon, MedalIcon } from "@phosphor-icons/react/ssr";
import type { ResearchKind } from "@edulink/contracts";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModuleOff } from "@/components/module-off";
import { NUM, TD, TH } from "@/components/module-flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { researchDesk } from "@/lib/duty-desks";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.research.title") };
}

/**
 * THE RESEARCH DEAN'S DESK (5 Oct 2026): the college's whole research
 * register, each teacher's publications, projects and the API-score inputs
 * the office keeps on the faculty record, and the years. A read: the teacher
 * adds their own research, the office keeps the faculty record.
 */
export default async function ResearchDeskPage() {
  const { ctx, moduleOn } = await dutyPageContext("RESEARCH_DEAN", "IQAC");
  const t = await getT();
  if (!moduleOn) return <ModuleOff module="IQAC" t={t} college />;
  const d = await researchDesk(ctx);
  const pubs = d.perFaculty.reduce((a, f) => a + f.publications, 0);
  const projects = d.perFaculty.reduce((a, f) => a + f.projects, 0);
  const lakhs = Math.round(d.perFaculty.reduce((a, f) => a + f.amountLakhs, 0) * 100) / 100;
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.research.title")} description={t("duties.research.intro")} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.research.statItems")} value={d.items.length} />
        <StatTile label={t("duties.research.statPublications")} value={pubs} />
        <StatTile label={t("duties.research.statProjects")} value={projects} />
        <StatTile label={t("duties.research.statLakhs")} value={lakhs} />
      </div>
      <Card>
        <CardHeader icon={<MedalIcon weight="duotone" className="size-5" />} title={t("duties.research.facultyTitle")} description={t("duties.research.facultyBody")} />
        <CardBody>
          {d.perFaculty.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.research.noFaculty")}</p>
          ) : (
            <TableScroll label={t("duties.research.facultyTitle")}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("duties.research.colName")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colPublications")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colBooks")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colProjects")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colLakhs")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colTeaching")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colResearch")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colService")}</th>
                    <th className={`${TH} text-right`}>{t("duties.research.colApi")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.perFaculty.map((f) => (
                    <tr key={f.membershipId}>
                      <td className={TD}>{f.name}</td>
                      <td className={NUM}>{f.publications}</td>
                      <td className={NUM}>{f.books}</td>
                      <td className={NUM}>{f.projects}</td>
                      <td className={NUM}>{f.amountLakhs}</td>
                      <td className={NUM}>{f.apiScoreInputs.teaching}</td>
                      <td className={NUM}>{f.apiScoreInputs.research}</td>
                      <td className={NUM}>{f.apiScoreInputs.service}</td>
                      <td className={NUM}>{f.apiScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ArticleIcon weight="duotone" className="size-5" />} title={t("duties.research.registerTitle")} description={t("duties.research.registerBody")} />
        <CardBody className="space-y-4">
          {d.byYear.length > 0 ? (
            <p className="text-sm text-fg-muted">{d.byYear.map((y) => t("duties.research.yearLine", { year: y.year, publications: y.publications, projects: y.projects, lakhs: y.amountLakhs })).join(" · ")}</p>
          ) : null}
          {d.items.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-4"
              title={t("duties.research.noItems")}
              description={t("duties.research.noItemsBody")}
              action={
                // The office keeps the faculty record (5 Oct 2026, the UX pass): its way on; the dean reads.
                ctx.role === "ADMIN" ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/admin/faculty-records">{t("iqac.navFacultyRecords")}</Link>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.items.map((i) => (
                <li key={i.id} className="py-2">
                  <span className="font-medium text-fg">{i.title}</span>
                  <span className="text-fg-muted"> · {[t(`iqac.researchKind.${i.kind as ResearchKind}`), String(i.year), i.facultyName, i.amountLakhs !== null ? t("duties.research.lakhsN", { lakhs: i.amountLakhs }) : null].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
