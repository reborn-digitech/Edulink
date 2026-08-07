"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireParent, AccessError } from "@/lib/tenancy";
import { bookSlot, cancelBooking } from "@/lib/meetings";
import { getT } from "@/lib/i18n/server";

export async function bookSlotAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  try {
    await bookSlot(
      session.user.id,
      String(formData.get("slotId") ?? ""),
      String(formData.get("studentMembershipId") ?? ""),
      String(formData.get("note") ?? ""),
    );
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/parent/meetings?error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/parent/meetings");
  redirect("/parent/meetings?booked=1");
}

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const session = await requireParent();
  try {
    await cancelBooking(session.user.id, String(formData.get("bookingId") ?? ""));
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/parent/meetings?error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/parent/meetings");
  redirect("/parent/meetings");
}
