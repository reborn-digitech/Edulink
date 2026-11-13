"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import Link from "next/link";
import { PAYMENT_MODES, type PaymentMode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { addSupportStaffAction } from "./actions";

/** The jobs offered as the office types (the designation stays free text, as the board calls it). */
const JOB_KEYS: TranslationKey[] = ["supportStaff.jobCleaner", "supportStaff.jobCook", "supportStaff.jobGuard", "supportStaff.jobPeon", "supportStaff.jobGardener", "supportStaff.jobAyah"];

/** Rupees as typed ("12,000.50") to paise, or null when it is not an amount. */
function toPaise(raw: string): number | null {
  const clean = raw.replace(/[,\s₹]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

/**
 * owner-batch-item2a (27 Oct 2026): the office's form for a support worker with no login. The salary part shows only
 * while the school runs payroll here and has a structure; choosing none adds the worker without one.
 */
export function SupportStaffForm({ today, payroll, structures }: { today: string; payroll: boolean; structures: { id: string; name: string }[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [joinedOnKey, setJoinedOnKey] = useState(today);
  const [structureId, setStructureId] = useState("");
  const [basic, setBasic] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    let basicPaise: number | null = null;
    if (structureId) {
      basicPaise = toPaise(basic);
      if (basicPaise === null || basicPaise <= 0) {
        setErrors({ "salary.basicPaise": t("supportStaff.invalidBasic") });
        return;
      }
    }
    startTransition(async () => {
      const result = await addSupportStaffAction({
        name,
        designation,
        phone,
        joinedOnKey,
        salary: structureId && basicPaise ? { structureId, basicPaise, paymentMode } : null,
      });
      if (!result.ok) {
        const message = actionError(t, result, "supportStaff.notAdded");
        if (result.field) setErrors({ [result.field]: message });
        else setFormError(message);
        return;
      }
      toast({ tone: "ok", title: t(result.duplicate ? "supportStaff.addedAlready" : "supportStaff.added", { name: name.trim() }) });
      router.push("/admin/people?role=SUPPORT");
      router.refresh();
    });
  }

  return (
    <Card className="mt-5">
      <CardBody>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {formError && (
            <p role="alert" className="text-sm font-medium text-danger">
              {formError}
            </p>
          )}
          <TextField label={t("supportStaff.fieldName")} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} autoComplete="off" error={errors.name} />
          <TextField
            label={t("supportStaff.fieldDesignation")}
            hint={t("supportStaff.fieldDesignationHint")}
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            required
            maxLength={80}
            list="support-jobs"
            autoComplete="off"
            error={errors.designation}
          />
          <datalist id="support-jobs">
            {JOB_KEYS.map((key) => (
              <option key={key} value={t(key)} />
            ))}
          </datalist>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label={t("supportStaff.fieldJoinedOn")} type="date" value={joinedOnKey} max={today} onChange={(e) => setJoinedOnKey(e.target.value)} required error={errors.joinedOnKey} />
            <TextField label={t("supportStaff.fieldPhone")} hint={t("supportStaff.fieldPhoneHint")} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={24} autoComplete="off" error={errors.phone} />
          </div>

          <fieldset className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
            <legend className="px-1 text-sm font-semibold text-fg">{t("supportStaff.salaryLegend")}</legend>
            {!payroll ? (
              <p className="text-sm text-fg-muted">{t("supportStaff.salaryPayrollOff")}</p>
            ) : structures.length === 0 ? (
              <p className="text-sm text-fg-muted">
                {t("supportStaff.salaryNoStructure")}{" "}
                <Link href="/admin/payroll/structures" className="font-medium text-accent-strong hover:underline">
                  {t("payroll.tabStructures")}
                </Link>
              </p>
            ) : (
              <>
                <SelectField label={t("payroll.fieldStructure")} value={structureId} onChange={(e) => setStructureId(e.target.value)} error={errors["salary.structureId"]}>
                  <option value="">{t("supportStaff.salaryNone")}</option>
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </SelectField>
                {structureId && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField label={t("payroll.fieldBasic")} inputMode="decimal" value={basic} onChange={(e) => setBasic(e.target.value)} required error={errors["salary.basicPaise"]} />
                    <SelectField label={t("payroll.fieldPaymentMode")} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}>
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {t(`payroll.mode${m}` as TranslationKey)}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                )}
                <p className="text-xs leading-relaxed text-fg-muted">{t("supportStaff.salaryHint")}</p>
              </>
            )}
          </fieldset>

          <p className="text-xs leading-relaxed text-fg-muted">{t("supportStaff.noLoginNote")}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={pending}>
              {t("supportStaff.submit")}
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/people">{t("common.cancel")}</Link>
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
