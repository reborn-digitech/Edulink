"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { NAAC_GRADES, NIRF_CATEGORIES, type CollegeProfile } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { saveCollegeProfile } from "./actions";

/** The college's regulator references, as the office keeps them; the head reads them. */
export function CollegeProfileForm({ profile, canWrite }: { profile: CollegeProfile; canWrite: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    affiliatingUniversity: profile.affiliatingUniversity ?? "",
    aisheCode: profile.aisheCode ?? "",
    aicteApprovalRef: profile.aicteApprovalRef ?? "",
    ugcApprovalRef: profile.ugcApprovalRef ?? "",
    naacGrade: profile.naacGrade ?? "",
    naacValidUntil: profile.naacValidUntil ?? "",
    nirfCategory: profile.nirfCategory ?? "",
  });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveCollegeProfile({
        affiliatingUniversity: form.affiliatingUniversity || null,
        aisheCode: form.aisheCode.trim().toUpperCase() || null,
        aicteApprovalRef: form.aicteApprovalRef || null,
        ugcApprovalRef: form.ugcApprovalRef || null,
        naacGrade: form.naacGrade || null,
        naacValidUntil: form.naacValidUntil || null,
        nirfCategory: form.nirfCategory || null,
      });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: t("college.profileSaved") });
      router.refresh();
    });
  }
  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <TextField label={t("college.fieldUniversity")} value={form.affiliatingUniversity} onChange={set("affiliatingUniversity")} disabled={!canWrite} maxLength={200} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("college.fieldAishe")} value={form.aisheCode} onChange={set("aisheCode")} disabled={!canWrite} hint={t("college.fieldAisheHint")} maxLength={10} />
        <SelectField label={t("college.fieldNirf")} value={form.nirfCategory} onChange={set("nirfCategory")} disabled={!canWrite}>
          <option value="">{t("college.none")}</option>
          {NIRF_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`college.nirf.${c}`)}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("college.fieldAicte")} value={form.aicteApprovalRef} onChange={set("aicteApprovalRef")} disabled={!canWrite} maxLength={120} />
        <TextField label={t("college.fieldUgc")} value={form.ugcApprovalRef} onChange={set("ugcApprovalRef")} disabled={!canWrite} maxLength={120} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t("college.fieldNaac")} value={form.naacGrade} onChange={set("naacGrade")} disabled={!canWrite}>
          <option value="">{t("college.none")}</option>
          {NAAC_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </SelectField>
        <DateField label={t("college.fieldNaacUntil")} value={form.naacValidUntil} onChange={set("naacValidUntil")} disabled={!canWrite} />
      </div>
      {canWrite && (
        <Button type="submit" variant="primary" loading={pending}>
          {t("college.profileSave")}
        </Button>
      )}
    </form>
  );
}
