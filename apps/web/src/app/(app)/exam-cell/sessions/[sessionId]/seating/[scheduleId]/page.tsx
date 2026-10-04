import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { seatingView, sessionView } from "@/lib/exam-cell";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CellOff, SessionFrame, when } from "@/components/exam-cell/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.viewSeating"), robots: { index: false, follow: false } };
}

/** One paper's seating, hall by hall, and anyone who found no seat. */
export default async function SeatingPage({ params }: { params: Promise<{ sessionId: string; scheduleId: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { sessionId, scheduleId } = await params;
  const [s, seating] = await Promise.all([sessionView(ctx, sessionId), seatingView(ctx, scheduleId)]);
  return (
    <SessionFrame t={t} session={s} current="logistics" autonomous={s.autonomous}>
      <p className="text-sm text-fg-muted">
        {seating.code} {seating.name} · {when(seating.at, locale)}
      </p>
      {seating.rooms.map((r) => (
        <Card key={r.id}>
          <CardHeader title={r.name} description={t("examCell.seatedOf", { seated: r.seats.length, capacity: r.capacity })} />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {r.seats.map((x) => (
                <li key={x.seatNo} className="flex justify-between px-5 py-2 text-sm">
                  <span>
                    {t("examCell.seatNo", { seat: x.seatNo })} · {x.name}
                  </span>
                  <span className="text-fg-muted">{x.ticket ?? "—"}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
      {seating.unseated.length > 0 ? (
        <Card>
          <CardHeader title={t("examCell.unseated", { count: seating.unseated.length })} />
          <CardBody className="text-sm">{seating.unseated.map((u) => u.name).join(", ")}</CardBody>
        </Card>
      ) : null}
    </SessionFrame>
  );
}
