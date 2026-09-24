"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { setStaffRecordAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export type StaffRecordInitial = {
  staffNumber: string;
  designation: string;
  qualification: string;
  joinedOnKey: string;
  birthdateKey: string;
  serviceJoinedOnKey: string;
  leaveDaysPerYear: string;
  /** The UDISE+ teacher profile's coded answers; "" for not said. */
  gender: string;
  socialCategory: string;
  academicQualification: string;
  professionalQualification: string;
  appointmentType: string;
};

/**
 * The UDISE+ teacher profile's codes (DCF 2024-25 §3.2), each with the key
 * that says it in the reader's language. The lists src/lib/staff-records.ts
 * accepts are the same codes; that file is server-only, so the picker names
 * them here.
 */
const GENDERS: { code: string; key: TranslationKey }[] = [{ code: "M", key: "pupilRecord.genderM" }, { code: "F", key: "pupilRecord.genderF" }, { code: "T", key: "pupilRecord.genderT" }];
const SOCIAL_CATEGORIES: { code: string; key: TranslationKey }[] = [{ code: "GENERAL", key: "filings.catGeneral" }, { code: "SC", key: "filings.catSC" }, { code: "ST", key: "filings.catST" }, { code: "OBC", key: "filings.catOBC" }];
const ACADEMIC: { code: string; key: TranslationKey }[] = ["1", "2", "3", "4", "5", "6", "7", "8"].map((code) => ({ code, key: `staff.aq${code}` as TranslationKey }));
const PROFESSIONAL: { code: string; key: TranslationKey }[] = ["1", "2", "3", "4", "5", "6", "7", "8", "10", "11", "12"].map((code) => ({ code, key: `staff.pq${code}` as TranslationKey }));
const APPOINTMENTS: { code: string; key: TranslationKey }[] = [{ code: "REGULAR", key: "staff.apptRegular" }, { code: "CONTRACT", key: "staff.apptContract" }, { code: "PART_TIME", key: "staff.apptPartTime" }];

/** The office's editor for a member of staff's record — the desk's five fields and the filing's five, one save. */
export function StaffRecordPanel({
  membershipId,
  name,
  initial,
  onClose,
}: {
  membershipId: string;
  name: string;
  initial: StaffRecordInitial;
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof StaffRecordInitial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setStaffRecordAction(membershipId, {
        staffNumber: form.staffNumber,
        designation: form.designation,
        qualification: form.qualification,
        joinedOnKey: form.joinedOnKey || null,
        birthdateKey: form.birthdateKey || null,
        serviceJoinedOnKey: form.serviceJoinedOnKey || null,
        leaveDaysPerYear: form.leaveDaysPerYear.trim() === "" ? null : Number(form.leaveDaysPerYear),
        gender: form.gender || null,
        socialCategory: form.socialCategory || null,
        academicQualification: form.academicQualification || null,
        professionalQualification: form.professionalQualification || null,
        appointmentType: form.appointmentType || null,
      });
      if (!result.ok) {
        setError(actionError(t, result, "staff.notSaved"));
        return;
      }
      toast({ tone: "ok", title: t("staff.saved") });
      onClose();
      router.refresh();
    });
  }

  const coded = (k: keyof StaffRecordInitial, label: string, options: { code: string; key: TranslationKey }[], testId: string) => (
    <SelectField label={label} value={form[k]} onChange={set(k)} data-testid={testId}>
      <option value="">{t("pupilRecord.notSaid")}</option>
      {options.map((o) => (
        <option key={o.code} value={o.code}>
          {t(o.key)}
        </option>
      ))}
    </SelectField>
  );

  return (
    <div className="w-full rounded-[--radius-md] border border-border bg-surface-muted p-3" data-testid="staff-record-panel">
      <p className="text-sm font-semibold text-fg">{t("staff.title", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("staff.body", { name })}</p>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextField label={t("staff.staffNumber")} value={form.staffNumber} onChange={set("staffNumber")} data-testid="staff-number" />
        <TextField label={t("staff.designation")} value={form.designation} placeholder={t("staff.designationPlaceholder")} onChange={set("designation")} data-testid="staff-designation" />
        <TextField label={t("staff.qualification")} value={form.qualification} placeholder={t("staff.qualificationPlaceholder")} onChange={set("qualification")} className="sm:col-span-2" data-testid="staff-qualification" />
        <DateField label={t("staff.joinedOn")} value={form.joinedOnKey} onChange={set("joinedOnKey")} />
        <DateField label={t("staff.serviceJoinedOn")} hint={t("staff.serviceJoinedOnHint")} value={form.serviceJoinedOnKey} onChange={set("serviceJoinedOnKey")} data-testid="staff-service-joined" />
        <DateField label={t("staff.birthdate")} value={form.birthdateKey} onChange={set("birthdateKey")} data-testid="staff-birthdate" />
        <TextField label={t("staff.leaveDays")} hint={t("staff.leaveDaysHint")} inputMode="numeric" value={form.leaveDaysPerYear} onChange={set("leaveDaysPerYear")} data-testid="staff-leave-days" />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-fg-muted">{t("staff.filingHint")}</p>
      <div className="mt-2 grid gap-3 sm:grid-cols-2" data-testid="staff-filing-fields">
        {coded("gender", t("staff.filingGender"), GENDERS, "staff-gender")}
        {coded("socialCategory", t("staff.filingSocialCategory"), SOCIAL_CATEGORIES, "staff-social-category")}
        {coded("academicQualification", t("staff.filingAcademic"), ACADEMIC, "staff-academic")}
        {coded("professionalQualification", t("staff.filingProfessional"), PROFESSIONAL, "staff-professional")}
        {coded("appointmentType", t("staff.filingAppointment"), APPOINTMENTS, "staff-appointment")}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={save} loading={pending}>{t("common.save")}</Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>{t("common.cancel")}</Button>
      </div>
    </div>
  );
}
