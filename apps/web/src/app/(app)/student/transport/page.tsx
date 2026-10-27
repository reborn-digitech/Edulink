import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { familyTransport } from "@/lib/transport";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { FamilyTransportCards } from "@/components/transport/family-view";
import { FamilyTransportLive } from "@/components/transport/family-live";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("schoolCampus.myBus"), robots: { index: false, follow: false } };
}

/**
 * The pupil's own bus (owner-batch-item5, 27 Oct 2026): GET /api/v1/family/transport already answered a STUDENT with
 * their own seat and the phone had the screen, but the web's /student had no page, so a rider saw their bus only on
 * the phone. The same cards as the guardian's page (familyTransport with no child: the pupil's own) — the seat, today's
 * trip with the bus on the map and the stops — without the guardian's near-stop switch, which is a guardian's
 * notification. The BUS, never the pupil. Reached from the STUDENT menu's entry (module TRANSPORT).
 */
export default async function StudentTransportPage() {
  const ctx = await requireRole("STUDENT");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const view = await familyTransport(ctx, null);
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.timezone, { hour: "2-digit", minute: "2-digit" }, locale) : "");
  return (
    <div className="space-y-5">
      <FamilyTransportLive />
      <PageHeader title={t("schoolCampus.myBus")} description={view.schoolName} />
      <FamilyTransportCards view={view} t={t} time={time} noSeatTitle={t("schoolCampus.myNoSeat")} noTripBody={t("schoolCampus.myNoTripBody")} />
    </div>
  );
}
