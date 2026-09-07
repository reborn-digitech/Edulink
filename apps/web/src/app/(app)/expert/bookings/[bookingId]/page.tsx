import { redirect } from "next/navigation";

/**
 * Two pages showed one booking — this one for the expert, `/experts/bookings`
 * for the school — and the school's already knew how to address an expert
 * (its back link and its cancel rule check the role). One page, one URL;
 * old links in notifications land here and go on.
 */
export default async function ExpertBookingRedirect({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  redirect(`/experts/bookings/${bookingId}`);
}
