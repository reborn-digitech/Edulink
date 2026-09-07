"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { LocationFields } from "@/components/location-fields";
import { useToast } from "@/components/ui/toast";
import { INDIA } from "@/lib/places";
import { createSchoolAction, updateSchoolAction } from "./actions";
import type { SchoolDetails } from "@/lib/superuser";
import { useT } from "@/lib/i18n";

/**
 * School details, for creating and for correcting.
 *
 * ONE FORM FOR BOTH, because they are the same fields and a second copy is a
 * second thing to forget to update. `schoolId` decides which action runs.
 *
 * The GRADE RANGE is the field that matters most and is easiest to skip, so it
 * has its own explanation rather than a placeholder. It is what the school's own
 * admin will be offered when they come to create classes — a school that teaches
 * 3 to 10 should not be shown a list starting at Reception. Both ends are free
 * text on purpose: "K", "LKG", "Nursery" and "I" are all real first years, and
 * refusing them would be the software telling a school it is named wrong.
 */
export function SchoolForm({
  schoolId,
  initial,
}: {
  schoolId?: string;
  initial?: Partial<SchoolDetails>;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SchoolDetails>({
    name: initial?.name ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactPhone: initial?.contactPhone ?? "",
    website: initial?.website ?? "",
    addressLine: initial?.addressLine ?? "",
    city: initial?.city ?? "",
    region: initial?.region ?? "",
    postalCode: initial?.postalCode ?? "",
    // A new school starts in India, the product's home; a correction shows
    // whatever the row holds, so opening the form never changes an answer.
    country: initial?.country ?? (schoolId ? "" : INDIA),
    gradeLow: initial?.gradeLow ?? "",
    gradeHigh: initial?.gradeHigh ?? "",
    timezone: initial?.timezone ?? "Asia/Kolkata",
    brandPrimary: initial?.brandPrimary ?? "",
  });

  function set<K extends keyof SchoolDetails>(key: K, value: SchoolDetails[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = schoolId
        ? await updateSchoolAction(schoolId, form)
        : await createSchoolAction(form);

      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      if (schoolId) {
        toast({ tone: "ok", title: t("competitions.saved") });
        router.refresh();
        return;
      }
      toast({ tone: "ok", title: t("root.created", { name: form.name }), description: t("root.joinCodeIs", { code: result.code ?? "" }) });
      router.push(`/root/${result.schoolId}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.theSchool")}</legend>
        <TextField
          label={t("root.name")}
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          hint={t("root.nameHint")}
        />
        <TextField
          label={t("root.contactEmail")}
          type="email"
          required
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("root.phone")}
            value={form.contactPhone ?? ""}
            onChange={(e) => set("contactPhone", e.target.value)}
          />
          <TextField
            label={t("root.website")}
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.gradesTaught")}</legend>
        <p className="text-xs leading-relaxed text-fg-muted">{t("root.gradesExplainer")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("root.lowestGrade")}
            value={form.gradeLow ?? ""}
            placeholder="3"
            onChange={(e) => set("gradeLow", e.target.value)}
          />
          <TextField
            label={t("root.highestGrade")}
            value={form.gradeHigh ?? ""}
            placeholder="10"
            onChange={(e) => set("gradeHigh", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">{t("root.whereItIs")}</legend>
        <TextField
          label={t("root.address")}
          value={form.addressLine ?? ""}
          onChange={(e) => set("addressLine", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("root.city")}
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
          <TextField
            label={t("root.postalCode")}
            value={form.postalCode ?? ""}
            onChange={(e) => set("postalCode", e.target.value)}
          />
          <LocationFields
            country={form.country ?? ""}
            region={form.region ?? ""}
            onCountryChange={(value) => set("country", value)}
            onRegionChange={(value) => set("region", value)}
            countryLabel={t("root.country")}
            regionLabel={t("root.stateRegion")}
          />
        </div>
        <TextField
          label={t("root.timezone")}
          required
          value={form.timezone}
          onChange={(e) => set("timezone", e.target.value)}
          hint={t("root.timezoneHint")}
        />
      </fieldset>

      <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
        {schoolId ? t("root.saveChanges") : t("root.createSchool")}
      </Button>
    </form>
  );
}
