"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { checkInAction } from "./actions";

/**
 * "I'm in". One tap, once a day; the library decides present or late in the
 * school's zone, and the toast says which — with the clock the lateness was
 * measured against, so the person knows the rule rather than just the verdict.
 */
export function CheckInButton({ lateAfter }: { lateAfter: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function tap() {
    setError(null);
    startTransition(async () => {
      const result = await checkInAction();
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: result.late ? "warn" : "ok", title: result.late ? t("staffAttendance.checkInLateDone", { time: lateAfter }) : t("staffAttendance.checkInDone") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="lg" loading={pending} onClick={tap} icon={<CheckCircleIcon weight="bold" />} data-testid="staff-check-in">
        {t("staffAttendance.checkIn")}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
