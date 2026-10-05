"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LEGAL_NAME_REASONS, type LegalNameReason } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { correctLegalNameAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

const REASON_KEY = {
  SPELLING: "people.legalNameReasonSpelling",
  ADMISSION_RECORD: "people.legalNameReasonAdmission",
  LEGAL_CHANGE: "people.legalNameReasonLegalChange",
} as const satisfies Record<LegalNameReason, string>;

/**
 * The office's legal-name editor: the name as it stands, the name as it
 * should be, and why, from a list. It says before saving what will and will
 * not change — new papers print the new name, papers already out keep theirs.
 */
export function LegalNamePanel({ membershipId, name, initial, onClose }: { membershipId: string; name: string; initial: string; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(initial);
  const [reason, setReason] = useState<LegalNameReason | "">("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await correctLegalNameAction(membershipId, value, reason);
      if (!result.ok) {
        setError(actionError(t, result, "people.legalNameNotSaved"));
        return;
      }
      toast({ tone: "ok", title: t("people.legalNameSaved") });
      onClose();
      router.refresh();
    });
  }

  const unchanged = value.replace(/\s+/g, " ").trim() === initial;

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("people.legalNameTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.legalNameBody")}</p>

      <TextField
        className="mt-3 max-w-md"
        label={t("people.legalNameField")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={120}
        autoComplete="off"
        error={error ?? undefined}
      />
      <SelectField className="mt-3 max-w-md" label={t("people.legalNameReason")} value={reason} onChange={(e) => setReason(e.target.value as LegalNameReason | "")}>
        <option value="">{t("people.legalNameChoose")}</option>
        {LEGAL_NAME_REASONS.map((code) => (
          <option key={code} value={code}>
            {t(REASON_KEY[code])}
          </option>
        ))}
      </SelectField>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={save} loading={pending} disabled={unchanged || reason === "" || value.trim().length < 2}>
          {t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
