"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { restoreSchoolAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * The restore button — a plain confirm, deliberately NOT the typed-name
 * ritual the remove button wears. Removal ends every membership at once and
 * earns its ceremony; restore is the safe direction, and a mistaken restore
 * is undone by pressing remove again.
 */
export function RestoreSchool({ schoolId }: { schoolId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function restore() {
    if (!window.confirm(t("root.restoreConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await restoreSchoolAction(schoolId);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.schoolRestoredToast") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <Button icon={<ArrowCounterClockwiseIcon weight="bold" />} loading={pending} onClick={restore}>
        {t("root.restoreCta")}
      </Button>
    </div>
  );
}
