"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { AccessError } from "@/lib/tenancy";
import { requireApiSession } from "@/lib/api-reads/shared";
import { bookSeat, cancelBooking, cancelSlot, closeBooking, consentToBooking, offerSlot, rateBooking, reportUnheld, seatCheckout, setPremiumMeeting, setTeacherGuidance, type SlotInput } from "@/lib/gig-sessions";
import type { GigResult } from "@/lib/gig-questions";
import { assertFeatureForAction } from "@/lib/feature-page";
import { SESSION_FEATURES } from "@/lib/nav";
import type { FeatureCode } from "@edulink/contracts";

/**
 * The web's doors to sessions and workshops, for a family, a provider and
 * the office alike. Each signs nobody in and decides nothing: who may do
 * what, to which pupil's seat, is src/lib/gig-sessions.ts's.
 */
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const PAGES = ["/sessions", "/expert/sessions", "/teacher/guidance", "/admin/sessions"];

async function run<T extends object>(work: () => Promise<GigResult<T>>, feature: FeatureCode | readonly FeatureCode[] = SESSION_FEATURES): Promise<Result<T>> {
  try {
    // Open while expert or teacher sessions are on (15 Oct 2026); gig-sessions.ts refuses the provider kind that is off.
    await assertFeatureForAction(feature);
    const result = await work();
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey, result.vars) };
    for (const page of PAGES) revalidatePath(page);
    return result;
  } catch (error) {
    const t = await getT();
    if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
    console.error("[sessions]", error);
    return { ok: false, error: t("common.tryAgainMoment") };
  }
}

export async function bookSeatAction(input: { slotId: string; studentMembershipId: string; purpose: string }) {
  return run(async () => bookSeat(await requireApiSession(), input));
}
export async function consentAction(bookingId: string, approve: boolean) {
  return run(async () => consentToBooking(await requireApiSession(), bookingId, approve));
}
export async function cancelSeatAction(bookingId: string, reason: string) {
  return run(async () => cancelBooking(await requireApiSession(), bookingId, reason));
}
export async function unheldAction(bookingId: string) {
  return run(async () => reportUnheld(await requireApiSession(), bookingId));
}
export async function rateAction(bookingId: string, rating: number, feedback: string) {
  return run(async () => rateBooking(await requireApiSession(), bookingId, { rating, feedback }));
}
export async function offerSlotAction(input: SlotInput) {
  return run(async () => offerSlot(await requireApiSession(), input));
}
export async function cancelSlotAction(slotId: string, reason: string) {
  return run(async () => cancelSlot(await requireApiSession(), slotId, reason));
}
export async function closeSeatAction(bookingId: string, outcome: "DELIVERED" | "MISSED") {
  return run(async () => closeBooking(await requireApiSession(), bookingId, outcome));
}
/** The order for a seat waiting for its payer's payment: the panel was closed, or the gateway was down at booking. Either session feature: a teacher's guidance may be sold too (seats, 17 Oct 2026). */
export async function seatCheckoutAction(bookingId: string) {
  return run(async () => seatCheckout(await requireApiSession(), bookingId));
}
/** The provider's word that their meeting account is premium (decision 0008), which lifts the service's free-account length cap. */
export async function premiumMeetingAction(premium: boolean) {
  return run(async () => setPremiumMeeting(await requireApiSession(), premium));
}
export async function guidanceAction(on: boolean) {
  return run(async () => setTeacherGuidance(await requireApiSession(), on), "TEACHER_SESSIONS");
}
