import type { Metadata } from "next";
import { momentFormatter } from "@/lib/school-zone";
import { ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { hostelTable, listSquadRounds } from "@/lib/college-campus";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { Flash, Hidden, NotCollege, Table } from "@/components/college-office/parts";
import { roomChangeAction, squadRoundAction } from "../../accounts/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.squadTitle") };
}

/**
 * THE COLLEGE HOSTEL'S EXTRAS (4 Oct 2026; the warden and the office): the
 * anti-ragging squad's rounds, a boarder's move to another bed, and the
 * year's occupancy and discipline for criterion 5.
 */
export default async function HostelSquadPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("WARDEN", "ADMIN", "PRINCIPAL");
  const moment = await momentFormatter(ctx.schoolId);
  const [t, kind] = await Promise.all([getT(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "HOSTEL"))) return <ModuleOff page module="HOSTEL" t={t} college />;
  const [rounds, ht, hostels, boarders, rooms] = await Promise.all([
    listSquadRounds(ctx),
    hostelTable(ctx.schoolId),
    db.hostel.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.hostelAllotment.findMany({ where: { schoolId: ctx.schoolId, status: "ACTIVE" }, select: { id: true, bed: true, room: { select: { number: true } }, student: { select: { user: { select: { name: true } } } } }, take: 500 }),
    db.hostelRoom.findMany({ where: { schoolId: ctx.schoolId }, orderBy: [{ hostelId: "asc" }, { number: "asc" }], select: { id: true, number: true, beds: true, hostel: { select: { name: true } } } }),
  ]);
  const write = ctx.role !== "PRINCIPAL";
  const back = "/hostel/squad";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.squadTitle")} description={t("collegeOffice.squadIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label={t("collegeOffice.htOccupancy")} value={`${ht.occupancyPercent} %`} hint={t("collegeOffice.htBeds", { occupied: ht.occupied, beds: ht.beds })} />
        <StatTile label={t("collegeOffice.htBoarders", { year: ht.academicYear })} value={ht.boarders} />
        <StatTile label={t("collegeOffice.htIncidents")} value={ht.incidents} />
        <StatTile label={t("collegeOffice.htRounds")} value={ht.squadRounds} hint={t("collegeOffice.htFlagged", { n: ht.flaggedRounds })} />
        <StatTile label={t("collegeOffice.htLate")} value={ht.lateReturns} />
      </div>
      <Card>
        <CardHeader icon={<ShieldCheckIcon weight="duotone" className="size-5" />} title={t("collegeOffice.squadRoundsTitle")} />
        <CardBody className="space-y-4">
          {rounds.items.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("collegeOffice.squadNone")}</p>
          ) : (
            <Table head={[t("collegeOffice.colWhen"), t("collegeOffice.colHostel"), t("collegeOffice.colMembers"), t("collegeOffice.note")]} testId="squad-rounds">
              {rounds.items.map((r) => (
                <tr key={r.id}>
                  <td className="py-2 pr-3">{moment(r.at)}</td>
                  <td className="py-2 pr-3">{r.hostelName}</td>
                  <td className="py-2 pr-3">{r.members}</td>
                  <td className="py-2 pr-3">
                    {r.flagged ? <Badge tone="danger">{t("collegeOffice.flagged")}</Badge> : null} {r.note}
                  </td>
                </tr>
              ))}
            </Table>
          )}
          {write ? (
            <form action={squadRoundAction} className="grid gap-3 sm:grid-cols-2">
              <Hidden fields={{ back }} />
              <SelectField name="hostelId" required label={t("collegeOffice.colHostel")}>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </SelectField>
              <TextField name="at" type="datetime-local" required label={t("collegeOffice.colWhen")} />
              <TextField name="members" required minLength={3} label={t("collegeOffice.colMembers")} />
              <TextField name="note" label={t("collegeOffice.note")} />
              <CheckboxField name="flagged" label={t("collegeOffice.flagRound")} />
              <div className="sm:col-span-2">
                <Button type="submit">{t("collegeOffice.logRound")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
      {write && boarders.length > 0 ? (
        <Card>
          <CardHeader title={t("collegeOffice.roomChangeTitle")} />
          <CardBody>
            <form action={roomChangeAction} className="grid gap-3 sm:grid-cols-4">
              <Hidden fields={{ back }} />
              <SelectField name="allotmentId" required label={t("collegeOffice.boarder")}>
                {boarders.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.student.user.name} · {b.room.number}/{b.bed}
                  </option>
                ))}
              </SelectField>
              <SelectField name="roomId" required label={t("collegeOffice.room")}>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.hostel.name} · {r.number}
                  </option>
                ))}
              </SelectField>
              <TextField name="bed" type="number" min={1} max={100} required label={t("collegeOffice.bed")} />
              <div className="flex items-end">
                <Button type="submit" variant="secondary">{t("collegeOffice.move")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
