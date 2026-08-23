"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { setStaffRecordAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

export type StaffRecordInitial = {
  staffNumber: string;
  designation: string;
  qualification: string;
  joinedOnKey: string;
  leaveDaysPerYear: string;
};

/** The office's editor for a member of staff's record — five fields, one save. */
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
  const set = (k: keyof StaffRecordInitial) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setStaffRecordAction(membershipId, {
        staffNumber: form.staffNumber,
        designation: form.designation,
        qualification: form.qualification,
        joinedOnKey: form.joinedOnKey || null,
        leaveDaysPerYear: form.leaveDaysPerYear.trim() === "" ? null : Number(form.leaveDaysPerYear),
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
        <TextField label={t("staff.leaveDays")} hint={t("staff.leaveDaysHint")} inputMode="numeric" value={form.leaveDaysPerYear} onChange={set("leaveDaysPerYear")} data-testid="staff-leave-days" />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={save} loading={pending}>{t("common.save")}</Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={pending}>{t("common.cancel")}</Button>
      </div>
    </div>
  );
}
