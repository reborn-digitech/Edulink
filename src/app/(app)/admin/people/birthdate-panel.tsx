"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { setBirthdateAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/**
 * The office's date-of-birth editor. Prefilled with what is on file, with
 * a separate "remove" because clearing is a decision and not an empty box.
 */
export function BirthdatePanel({
  membershipId,
  name,
  initial,
  onClose,
}: {
  membershipId: string;
  name: string;
  /** ISO YYYY-MM-DD, or "" when none is on file. */
  initial: string;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function save(next: string) {
    setError(null);
    startTransition(async () => {
      const result = await setBirthdateAction(membershipId, next);
      if (!result.ok) {
        setError(actionError(t, result, "people.birthdateNotSaved"));
        return;
      }
      toast({ tone: "ok", title: t("people.birthdateSaved") });
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("people.birthdateTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.birthdateBody", { name })}</p>

      <DateField
        className="mt-3 max-w-xs"
        label={t("people.birthdateField")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error ?? undefined}
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => save(value)} loading={pending} disabled={value.trim() === ""}>
          {t("common.save")}
        </Button>
        {initial !== "" && (
          <Button size="sm" variant="secondary" onClick={() => save("")} disabled={pending}>
            {t("people.birthdateClear")}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
