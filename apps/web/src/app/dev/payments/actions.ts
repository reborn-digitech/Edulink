"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperuser } from "@/lib/tenancy";
import { failOnlinePayment, settleOnlinePayment } from "@/lib/fees-payments";
import { markOrderFailed } from "@/lib/gig-payments";
import { settleSeatPayment } from "@/lib/gig-sessions";
import { markPassFailed, markPassPaid } from "@/lib/pass-orders"; // plans-pay (17 Oct 2026)

/**
 * The devbox gateway's two buttons. Each goes through the SAME door the real
 * webhook uses — settleOnlinePayment / failOnlinePayment — so what the family
 * sees after pressing one is exactly what it would see after a real capture.
 *
 * Gated twice: NODE_ENV, because a production server has no pretend
 * gateway; and the operator, because a settlement reaches every tenant.
 */
function gate() {
  if (process.env.NODE_ENV === "production") throw new Error("dev payments are not available in production");
}

export async function markPaidAction(formData: FormData): Promise<void> {
  gate();
  await requireSuperuser();
  const schoolId = String(formData.get("schoolId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  const amountPaise = Number(formData.get("amountPaise") ?? 0);
  if (!schoolId || !orderId || !Number.isInteger(amountPaise) || amountPaise <= 0) redirect("/dev/payments?outcome=bad-request");
  const result = await settleOnlinePayment(schoolId, { orderId, gatewayPaymentId: `pay_devbox${Date.now()}`, amountPaise, gatewayMethod: "upi" });
  revalidatePath("/dev/payments");
  redirect(`/dev/payments?outcome=${encodeURIComponent(result.outcome)}`);
}

export async function failAction(formData: FormData): Promise<void> {
  gate();
  await requireSuperuser();
  const schoolId = String(formData.get("schoolId") ?? "");
  const orderId = String(formData.get("orderId") ?? "");
  if (!schoolId || !orderId) redirect("/dev/payments?outcome=bad-request");
  await failOnlinePayment(schoolId, orderId, "devbox: failed by the operator");
  revalidatePath("/dev/payments");
  redirect("/dev/payments?outcome=failed");
}

/** A paid workshop seat: the same door the sessions webhook uses (settleSeatPayment), no school bound. */
export async function markSeatPaidAction(formData: FormData): Promise<void> {
  gate();
  await requireSuperuser();
  const orderId = String(formData.get("orderId") ?? "");
  const amountPaise = Number(formData.get("amountPaise") ?? 0);
  if (!orderId || !Number.isInteger(amountPaise) || amountPaise <= 0) redirect("/dev/payments?outcome=bad-request");
  const result = await settleSeatPayment({ orderId, gatewayPaymentId: `pay_devbox${Date.now()}`, amountPaise });
  revalidatePath("/dev/payments");
  redirect(`/dev/payments?outcome=${encodeURIComponent(result.outcome)}`);
}

export async function failSeatAction(formData: FormData): Promise<void> {
  gate();
  await requireSuperuser();
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/dev/payments?outcome=bad-request");
  await markOrderFailed(orderId, "devbox: failed by the operator");
  revalidatePath("/dev/payments");
  redirect("/dev/payments?outcome=failed");
}

// plans-pay (17 Oct 2026)
/** A pass bought for a plan: the same door the platform webhook uses (markPassPaid), no school bound. */
export async function markPassPaidAction(formData: FormData): Promise<void> {
  gate();
  await requireSuperuser();
  const orderId = String(formData.get("orderId") ?? "");
  const amountPaise = Number(formData.get("amountPaise") ?? 0);
  if (!orderId || !Number.isInteger(amountPaise) || amountPaise <= 0) redirect("/dev/payments?outcome=bad-request");
  const result = await markPassPaid({ orderId, gatewayPaymentId: `pay_devbox${Date.now()}`, amountPaise });
  revalidatePath("/dev/payments");
  redirect(`/dev/payments?outcome=${encodeURIComponent(result.outcome)}`);
}

export async function failPassAction(formData: FormData): Promise<void> {
  gate();
  await requireSuperuser();
  const orderId = String(formData.get("orderId") ?? "");
  if (!orderId) redirect("/dev/payments?outcome=bad-request");
  await markPassFailed(orderId, "devbox: failed by the operator");
  revalidatePath("/dev/payments");
  redirect("/dev/payments?outcome=failed");
}
// end plans-pay
