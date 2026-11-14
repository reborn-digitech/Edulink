"use client";

import { useState, useTransition } from "react";
import { STAFF_LEAVING_REASONS, type StaffLeavingReason } from "@edulink/contracts";
import { formatDateKey } from "@/lib/dates";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { DateField } from "@/components/ui/field";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { fieldClass } from "@/components/ui/field-class";
import { recordStaffLeavingAction } from "./actions";

export const STAFF_REASON_KEY: Record<StaffLeavingReason, TranslationKey> = {
  RESIGNED: "people.staffLeavingReasonRESIGNED",
  RETIRED: "people.staffLeavingReasonRETIRED",
  CONTRACT_ENDED: "people.staffLeavingReasonCONTRACT_ENDED",
  DISMISSED: "people.staffLeavingReasonDISMISSED",
  TRANSFERRED: "people.staffLeavingReasonTRANSFERRED",
  DIED_IN_SERVICE: "people.staffLeavingReasonDIED_IN_SERVICE",
};

/**
 * A member of staff's leaving (TA-046, the owner's decision of 14 November 2026), opened from the row's action menu
 * (directory-menu.tsx): the last working day and a coded reason. A past day ends access at once; today or a later day
 * is kept, they keep access through it, and it is recorded the morning after. Payroll pays them up to that day. Staff
 * get no certificate, so the form asks for nothing a paper would print.
 */
export function StaffLeavingPanel({ membershipId, name, onClose }: { membershipId: string; name: string; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState<StaffLeavingReason>("RESIGNED");
  const [lastDay, setLastDay] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("people.staffLeavingTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.staffLeavingBody")}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="min-w-[10rem] flex-1">
          <span className="block text-xs font-medium text-fg">{t("people.staffLeavingWhy")}</span>
          <select value={reason} onChange={(event) => setReason(event.target.value as StaffLeavingReason)} className={fieldClass("mt-1")}>
            {STAFF_LEAVING_REASONS.map((code) => (
              <option key={code} value={code}>
                {t(STAFF_REASON_KEY[code])}
              </option>
            ))}
          </select>
        </label>
        <div className="min-w-[11rem]">
          <DateField label={t("people.staffLastDay")} hint={t("people.staffLastDayHint")} value={lastDay} required onChange={(event) => setLastDay(event.target.value)} />
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="danger"
          loading={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await recordStaffLeavingAction(membershipId, { lastDay, reason });
              if (!result.ok) {
                setError(actionError(t, result, "people.didNotWork"));
                return;
              }
              toast({
                tone: "ok",
                title: result.scheduledFor ? t("people.leavingScheduled", { name, date: formatDateKey(result.scheduledFor, { dateStyle: "medium" }) }) : t("people.staffLeft", { name }),
              });
              onClose();
              router.refresh();
            });
          }}
        >
          {t("people.staffLeavingRecord")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
