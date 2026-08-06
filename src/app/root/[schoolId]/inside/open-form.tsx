"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LockKeyOpenIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { open } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * The door, and the reason it needs.
 *
 * THE FORM IS THE FEATURE. Anybody could have written a button that binds a
 * school; what makes this defensible is that it costs a sentence, that the
 * sentence is shown to the school, and that saying so here — before the door
 * opens, in the place somebody is standing — is different from saying it in a
 * privacy policy.
 */
export function OpenForm({ schoolId, minutes }: { schoolId: string; minutes: number }) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-[--radius-md] border border-warn/30 bg-warn-soft p-4">
        <p className="text-sm font-semibold text-fg">{t("root.willBeTold")}</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-muted">
          {/* One sentence with a placeholder — the bold "their" went with the
              fragments. */}
          {t("root.openingWrites", { minutes })}
        </p>
      </div>

      <TextAreaField
        label={t("root.whyOpening")}
        required
        rows={3}
        value={reason}
        error={error ?? undefined}
        onChange={(e) => setReason(e.target.value)}
        hint={t("root.whyHint")}
        placeholder={t("root.whyPlaceholder")}
      />

      <Button
        icon={<LockKeyOpenIcon weight="bold" />}
        loading={pending}
        disabled={pending || reason.trim().length < 10}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await open(schoolId, reason);
            if (!result.ok) {
              setError(result.error ?? t("root.didNotWork"));
              return;
            }
            router.refresh();
          });
        }}
      >
        {t("root.openThisSchool")}
      </Button>
    </div>
  );
}
