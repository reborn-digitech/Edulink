"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EraserIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteSchoolAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * The shredder, behind the same typed-name gate as removal — and stricter in
 * one way: the typed name is sent to the server and checked there too, so the
 * dialog is a courtesy and the lib is the gate. There is no restore for this.
 */
export function DeleteSchool({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function erase() {
    const typed = window.prompt(t("root.deleteConfirm", { name: schoolName }));
    if (typed === null) return;
    if (typed.trim() !== schoolName) {
      setError(t("root.deleteMismatch"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteSchoolAction(schoolId, typed.trim());
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("root.schoolDeletedToast") });
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
      <Button variant="danger" icon={<EraserIcon weight="bold" />} loading={pending} onClick={erase}>
        {t("root.deleteCta")}
      </Button>
    </div>
  );
}
