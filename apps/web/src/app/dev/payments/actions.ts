"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperuser } from "@/lib/tenancy";
import { failOnlinePayment, settleOnlinePayment } from "@/lib/fees-payments";

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
