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
export type BookingStatus = "PENDING_CONSENT" | "CONFIRMED" | "CANCELLED" | "DELIVERED" | "MISSED" | "UNHELD";
export type SessionKind = "ONE_TO_ONE" | "WORKSHOP";

export const BOOKING_STATUS: Record<BookingStatus, { label: TranslationKey; tone: "muted" | "ok" | "warn" | "danger" | "accent" }> = {
  PENDING_CONSENT: { label: "gigs.bookingStatusPENDING_CONSENT", tone: "accent" },
  CONFIRMED: { label: "gigs.bookingStatusCONFIRMED", tone: "ok" },
  CANCELLED: { label: "gigs.bookingStatusCANCELLED", tone: "muted" },
  DELIVERED: { label: "gigs.bookingStatusDELIVERED", tone: "ok" },
  MISSED: { label: "gigs.bookingStatusMISSED", tone: "warn" },
  UNHELD: { label: "gigs.bookingStatusUNHELD", tone: "danger" },
};
export const SESSION_KIND: Record<SessionKind, TranslationKey> = { ONE_TO_ONE: "gigs.kindONE_TO_ONE", WORKSHOP: "gigs.kindWORKSHOP" };
export const PROVIDER_KIND: Record<"EXPERT" | "TEACHER", TranslationKey> = { EXPERT: "gigs.providerEXPERT", TEACHER: "gigs.providerTEACHER" };

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
