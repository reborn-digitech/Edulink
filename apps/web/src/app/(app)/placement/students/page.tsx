import type { Metadata } from "next";
import { StudentIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { listPlacementStudents } from "@/lib/placement";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CellFrame, TABLE, TD, TH, cellContext, lpa } from "@/components/placement/parts";
import { dreamAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.tabStudents"), robots: { index: false, follow: false } };
}

/** The roll as the cell reads it: each student's record from the exam cell and the office, their season choices, offers, and the dream flag the TPO grants. */
export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { ok, error } = await searchParams;
  if (!on) return <CellFrame t={t} on={false} college={college} current="students" title={t("placement.tabStudents")}>{null}</CellFrame>;
  const { students } = await listPlacementStudents(ctx);
  return (
    <CellFrame t={t} on college={college} current="students" title={t("placement.tabStudents")} description={t("placement.studentsIntro")} ok={ok} error={error}>
      <Card>
        <CardHeader icon={<StudentIcon weight="duotone" className="size-5" />} title={t("placement.studentsTitle", { count: students.length })} />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className={TABLE}>
              <thead>
                <tr className="border-b border-border">
                  <th className={TH}>{t("placement.colStudent")}</th>
                  <th className={TH}>{t("placement.colProgramme")}</th>
                  <th className={TH}>{t("placement.colCgpa")}</th>
                  <th className={TH}>{t("placement.colBacklogs")}</th>
                  <th className={TH}>{t("placement.colAttendance")}</th>
                  <th className={TH}>{t("placement.colSeason")}</th>
                  <th className={TH}>{t("placement.colOffers")}</th>
                  <th className={TH}>{t("placement.colDream")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.studentMembershipId}>
                    <td className={TD}>{s.name}</td>
                    <td className={TD}>
                      {s.record.programmeName ?? "—"}
                      {s.record.batchYear ? <div className="text-xs text-fg-muted">{t("placement.batchOf", { batch: s.record.batchYear })}</div> : null}
                    </td>
                    <td className={TD}>{s.record.cgpa === null ? "—" : s.record.cgpa.toFixed(2)}</td>
                    <td className={TD}>{s.record.liveBacklogs ?? "—"}</td>
                    <td className={TD}>{s.record.attendancePct === null ? "—" : `${Math.round(s.record.attendancePct)} %`}</td>
                    <td className={TD}>
                      {s.optedOut ? <Badge>{t("placement.optedOut")}</Badge> : null}
                      {s.higherStudies ? <Badge tone="info">{t("placement.higherStudies")}</Badge> : null}
                      {s.entrepreneur ? <Badge tone="info">{t("placement.entrepreneur")}</Badge> : null}
                      {!s.consentAt ? <div className="text-xs text-fg-muted">{t("placement.noProfileYet")}</div> : null}
                    </td>
                    <td className={TD}>
                      {s.offers}
                      {s.acceptedRupees !== null ? <div className="text-xs text-ok">{lpa(s.acceptedRupees, t)}</div> : null}
                    </td>
                    <td className={TD}>
                      {canWrite ? (
                        <form action={dreamAction}>
                          <input type="hidden" name="back" value="/placement/students" />
                          <input type="hidden" name="studentMembershipId" value={s.studentMembershipId} />
                          <input type="hidden" name="on" value={s.dreamFlag ? "0" : "1"} />
                          <Button type="submit" size="sm" variant={s.dreamFlag ? "soft" : "ghost"}>
                            {s.dreamFlag ? t("placement.dreamOn") : t("placement.grantDream")}
                          </Button>
                        </form>
                      ) : s.dreamFlag ? (
                        <Badge tone="accent">{t("placement.dreamOn")}</Badge>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </CellFrame>
  );
}
