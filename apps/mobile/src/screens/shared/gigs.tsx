import { useState } from "react";
import { View } from "react-native";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Field } from "@/components";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/**
 * What the gig screens share (sessions and workshops, decision 0004): the
 * words for a booking's status, a session's kind and who provides it, the
 * query key every one of them invalidates, and the small "a reason, then the
 * act" control used wherever a seat or a time is cancelled.
 */
export type BookingStatus = "PENDING_CONSENT" | "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED" | "DELIVERED" | "MISSED" | "UNHELD" | "DISPUTED";
export type SessionKind = "ONE_TO_ONE" | "WORKSHOP";

export const BOOKING_STATUS: Record<BookingStatus, { label: TranslationKey; tone: "muted" | "ok" | "warn" | "danger" | "accent" }> = {
  PENDING_CONSENT: { label: "gigs.bookingStatusPENDING_CONSENT", tone: "accent" },
  PENDING_PAYMENT: { label: "gigs.bookingStatusPENDING_PAYMENT", tone: "warn" },
  CONFIRMED: { label: "gigs.bookingStatusCONFIRMED", tone: "ok" },
  CANCELLED: { label: "gigs.bookingStatusCANCELLED", tone: "muted" },
  DELIVERED: { label: "gigs.bookingStatusDELIVERED", tone: "ok" },
  MISSED: { label: "gigs.bookingStatusMISSED", tone: "warn" },
  UNHELD: { label: "gigs.bookingStatusUNHELD", tone: "danger" },
  // TA-122: the family says a marked seat was not held; the operator decides.
  DISPUTED: { label: "gigs.bookingStatusDISPUTED", tone: "warn" },
};
export const SESSION_KIND: Record<SessionKind, TranslationKey> = { ONE_TO_ONE: "gigs.kindONE_TO_ONE", WORKSHOP: "gigs.kindWORKSHOP" };
export const PROVIDER_KIND: Record<"EXPERT" | "TEACHER" | "ALUMNUS", TranslationKey> = { EXPERT: "gigs.providerEXPERT", TEACHER: "gigs.providerTEACHER", ALUMNUS: "gigs.providerALUMNUS" };

export const SESSIONS_KEY = ["gigs", "sessions"] as const;

/** A button that asks for a reason before it acts: the reason's box opens where it was pressed. */
export function ReasonThen({ label, about, busy, onSubmit }: { label: string; about: string; busy?: boolean; onSubmit: (reason: string) => void }) {
  const t = useT();
  const th = useTheme();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  if (!open) return <Button label={label} variant="ghost" accessibilityLabel={[label, about].join(": ")} onPress={() => setOpen(true)} />;
  return (
    <View style={{ gap: th.space[2] }}>
      <Field label={t("gigs.reasonLabel")} value={reason} onChangeText={setReason} maxLength={300} />
      <Button label={label} variant="secondary" busy={busy} onPress={() => onSubmit(reason)} />
    </View>
  );
}

/** Razorpay Route (decision 0004, third amendment of 2 October 2026): HELD until delivered plus 48 h, then RELEASED to the expert's linked account; DUE and PAID_OUT are the company's hand-paid rows from before Route. */
export type SessionPaymentStatus = "INITIATED" | "PAID" | "HELD" | "RELEASED" | "DUE" | "PAID_OUT" | "REFUNDED" | "FAILED";
export const PAYMENT_STATUS: Record<SessionPaymentStatus, { label: TranslationKey; tone: "muted" | "ok" | "warn" | "danger" | "accent" }> = {
  INITIATED: { label: "gigs.paymentStatusINITIATED", tone: "accent" },
  PAID: { label: "gigs.paymentStatusPAID", tone: "warn" },
  HELD: { label: "gigs.paymentStatusHELD", tone: "warn" },
  RELEASED: { label: "gigs.paymentStatusRELEASED", tone: "ok" },
  DUE: { label: "gigs.paymentStatusDUE", tone: "accent" },
  PAID_OUT: { label: "gigs.paymentStatusPAID_OUT", tone: "ok" },
  REFUNDED: { label: "gigs.paymentStatusREFUNDED", tone: "muted" },
  FAILED: { label: "gigs.paymentStatusFAILED", tone: "danger" },
};
/** A seat the company collected for has a receipt once it is paid; a refunded one carries the refund line. */
export const RECEIPT_STATUSES: SessionPaymentStatus[] = ["PAID", "HELD", "RELEASED", "DUE", "PAID_OUT", "REFUNDED"];
/** The thirty days an open free one-to-one offer counts within (the server's MENTORING_OFFER_DAYS). */
export const MENTORING_OFFER_DAYS = 30;
