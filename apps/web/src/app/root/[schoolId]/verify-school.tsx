"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ShieldCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setSchoolVerifiedAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * The operator's mark, given or withdrawn — a plain confirm either way, as
 * restore has. Neither direction ends anything: approving opens one door,
 * and withdrawing shuts it again without touching a pupil already brought
 * over. The typed-name ritual stays with removal, which does end things.
 */
export function VerifySchool({ schoolId, verified }: { schoolId: string; verified: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set(next: boolean) {
    if (!window.confirm(t(next ? "root.verifyConfirm" : "root.unverifyConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await setSchoolVerifiedAction(schoolId, next);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t(next ? "root.schoolVerifiedToast" : "root.schoolUnverifiedToast") });
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
      {verified ? (
        <Button variant="secondary" loading={pending} onClick={() => set(false)}>
          {t("root.unverifyCta")}
        </Button>
      ) : (
        <Button icon={<ShieldCheckIcon weight="bold" />} loading={pending} onClick={() => set(true)}>
          {t("root.verifyCta")}
        </Button>
      )}
    </div>
  );
}
