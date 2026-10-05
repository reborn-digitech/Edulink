"use server";

import { requireParent } from "@/lib/tenancy";
import { bookSlot, cancelBooking } from "@/lib/meetings";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";

/** A family's booking and cancelling answer in place (A3-journeys-27): the note typed is kept on a refusal, a booking is a toast. */
export async function bookSlotAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const session = await requireParent();
      await bookSlot(session.user.id, String(formData.get("slotId") ?? ""), String(formData.get("studentMembershipId") ?? ""), String(formData.get("note") ?? ""));
      return "meetings.bookedNote";
    },
    { revalidate: ["/parent/meetings"] },
  );
}

export async function cancelBookingAction(previous: FormState, formData: FormData): Promise<FormState> {
  return answerForm(
    previous,
    formData,
    async () => {
      const session = await requireParent();
      await cancelBooking(session.user.id, String(formData.get("bookingId") ?? ""));
      return null;
    },
    { revalidate: ["/parent/meetings"] },
  );
}
