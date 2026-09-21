"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { MANAGEMENT_TYPES, SCHOOL_BOARDS, type FilingIdentitySave, type FilingsView } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { saveFilingIdentityAction } from "./actions";

/**
 * What the portals know the school as: the UDISE+ code, the board and its
 * number, district, block, medium and management type. The state, city and
 * postcode come from the school's own details and are shown, not edited,
 * because the settings page owns them. An admin saves; the principal reads
 * the same form with every field disabled, which is what the library
 * refuses them anyway.
 */
type Draft = Required<{ [K in keyof FilingIdentitySave]: string }>;

export function IdentityForm({ identity, missing, canEdit }: { identity: FilingsView["identity"]; missing: string[]; canEdit: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft>({
    udiseCode: identity.udiseCode ?? "",
    board: identity.board ?? "",
    affiliationNumber: identity.affiliationNumber ?? "",
    district: identity.district ?? "",
    block: identity.block ?? "",
    medium: identity.medium ?? "",
    managementType: identity.managementType ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Draft | "_form", string>>>({});
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setDraft((d) => ({ ...d, [k]: value }));
    setErrors((prev) => (prev[k] ? { ...prev, [k]: undefined } : prev));
  };
  const fieldLabel = (f: string) => t(`filings.${f}` as TranslationKey);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    const next: typeof errors = {};
    if (!/^(\d{11})?$/.test(draft.udiseCode.trim())) next.udiseCode = t("filings.udiseHint");
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const input: FilingIdentitySave = {
      udiseCode: draft.udiseCode.trim(),
      board: draft.board as FilingIdentitySave["board"],
      affiliationNumber: draft.affiliationNumber,
      district: draft.district,
      block: draft.block,
      medium: draft.medium,
      managementType: draft.managementType as FilingIdentitySave["managementType"],
    };
    startTransition(async () => {
      const result = await saveFilingIdentityAction(input);
      if (!result.ok) {
        setErrors({ _form: actionError(t, result, "common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("filings.identitySaved") });
      router.refresh();
    });
  }

  const disabled = !canEdit;

  return (
    <form onSubmit={submit} noValidate className="space-y-4" data-testid="filing-identity-form">
      {errors._form && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {errors._form}
        </p>
      )}
      {missing.length > 0 && (
        <p className="text-sm font-medium text-warn" data-testid="filing-identity-missing">
          {t("filings.identityMissing", { fields: missing.map(fieldLabel).join(", ") })}
        </p>
      )}
      {!canEdit && <p className="text-xs text-fg-muted">{t("filings.identityReadOnly")}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <TextField label={t("filings.udiseCode")} hint={t("filings.udiseHint")} error={errors.udiseCode} inputMode="numeric" maxLength={11} autoComplete="off" value={draft.udiseCode} disabled={disabled} readOnly={disabled} onChange={set("udiseCode")} data-testid="filing-udise" />
        <SelectField label={t("filings.board")} value={draft.board} disabled={disabled} onChange={set("board")} data-testid="filing-board">
          <option value="">{t("filings.boardNone")}</option>
          {SCHOOL_BOARDS.map((b) => (
            <option key={b} value={b}>
              {t(`filings.board${b}` as TranslationKey)}
            </option>
          ))}
        </SelectField>
        <TextField label={t("filings.affiliationNumber")} hint={t("filings.affiliationHint")} maxLength={40} autoComplete="off" value={draft.affiliationNumber} disabled={disabled} readOnly={disabled} onChange={set("affiliationNumber")} data-testid="filing-affiliation" />
        <TextField label={t("filings.medium")} hint={t("filings.mediumHint")} maxLength={40} autoComplete="off" value={draft.medium} disabled={disabled} readOnly={disabled} onChange={set("medium")} data-testid="filing-medium" />
        <TextField label={t("filings.district")} maxLength={80} autoComplete="off" value={draft.district} disabled={disabled} readOnly={disabled} onChange={set("district")} data-testid="filing-district" />
        <TextField label={t("filings.block")} maxLength={80} autoComplete="off" value={draft.block} disabled={disabled} readOnly={disabled} onChange={set("block")} data-testid="filing-block" />
        <SelectField label={t("filings.managementType")} value={draft.managementType} disabled={disabled} onChange={set("managementType")} data-testid="filing-management">
          <option value="">{t("filings.mgmtNone")}</option>
          {MANAGEMENT_TYPES.map((m) => (
            <option key={m} value={m}>
              {t(`filings.mgmt${m}` as TranslationKey)}
            </option>
          ))}
        </SelectField>
      </div>

      {/* From the school's details: the portals ask for them beside the code, and the settings page owns them. */}
      <dl className="grid gap-3 text-sm sm:grid-cols-3" data-testid="filing-identity-location">
        {[
          { key: "settings.region" as const, value: identity.state },
          { key: "settings.city" as const, value: identity.city },
          { key: "settings.postcode" as const, value: identity.postalCode },
        ].map((row) => (
          <div key={row.key}>
            <dt className="text-xs font-medium text-fg-muted">{t(row.key)}</dt>
            <dd className="font-medium text-fg">{row.value || "—"}</dd>
          </div>
        ))}
      </dl>

      {canEdit && (
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="filing-identity-save">
          {t("filings.saveIdentity")}
        </Button>
      )}
    </form>
  );
}
