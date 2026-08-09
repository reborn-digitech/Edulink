"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removeSchoolAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * The remove button, behind a typed confirmation.
 *
 * TYPE THE NAME, not "are you sure". This ends every membership in the school
 * at once; a dialog that can be dismissed with the same key that opened it is
 * no gate at all for that. The prompt asks for the school's exact name — the
 * same ritual git tags use for force-pushes, and for the same reason.
 */
export function RemoveSchool({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    const typed = window.prompt(t("root.removeConfirm", { name: schoolName }));
    if (typed === null) return;
    if (typed.trim() !== schoolName) {
      setError(t("root.removeMismatch"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await removeSchoolAction(schoolId);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.schoolRemovedToast") });
      router.push("/root");
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
      <Button
        variant="danger"
        icon={<TrashIcon weight="bold" />}
        loading={pending}
        onClick={remove}
      >
        {t("root.removeCta")}
      </Button>
    </div>
  );
}
