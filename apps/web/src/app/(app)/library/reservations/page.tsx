import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { reservationQueue } from "@/lib/library";
import { DeskFrame, deskContext } from "@/components/library/desk";
import { ReservationList } from "@/components/library/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("library.tabReservations"), robots: { index: false, follow: false } };
}

/** The queue: ready ones first (the copy waits at the desk), then each title's waiting list in order. */
export default async function LibraryReservationsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, canWrite } = await deskContext();
  const { ok, error } = await searchParams;
  if (!on) return <DeskFrame t={t} on={false} current="reservations" title={t("library.tabReservations")}>{null}</DeskFrame>;
  const queue = await reservationQueue(ctx);
  return (
    <DeskFrame t={t} on current="reservations" title={t("library.tabReservations")} description={t("library.reservationsIntro")} ok={ok} error={error}>
      <ReservationList items={queue.items} t={t} back="/library/reservations" title={t("library.reservationsTitle")} desk canCancel={canWrite} />
    </DeskFrame>
  );
}
