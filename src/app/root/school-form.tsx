"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createSchoolAction, updateSchoolAction } from "./actions";
import type { SchoolDetails } from "@/lib/superuser";

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
    country: initial?.country ?? "",
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
        setError(result.error ?? "That did not work.");
        return;
      }
      if (schoolId) {
        toast({ tone: "ok", title: "Saved" });
        router.refresh();
        return;
      }
      toast({ tone: "ok", title: `${form.name} created`, description: `Join code ${result.code}` });
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
        <legend className="text-sm font-semibold text-fg">The school</legend>
        <TextField
          label="Name"
          required
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          hint="As the school writes it. Parents will see this."
        />
        <TextField
          label="Contact email"
          type="email"
          required
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Phone"
            value={form.contactPhone ?? ""}
            onChange={(e) => set("contactPhone", e.target.value)}
          />
          <TextField
            label="Website"
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">Grades taught</legend>
        <p className="text-xs leading-relaxed text-fg-muted">
          The range this school actually teaches — 3 to 10, 5 to 12, K to 5. Its administrator will
          be offered exactly these when they create classes, so getting it right here saves them
          scrolling past years the school does not run. Any label works: 1, K, LKG, Nursery.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Lowest grade"
            value={form.gradeLow ?? ""}
            placeholder="3"
            onChange={(e) => set("gradeLow", e.target.value)}
          />
          <TextField
            label="Highest grade"
            value={form.gradeHigh ?? ""}
            placeholder="10"
            onChange={(e) => set("gradeHigh", e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-fg">Where it is</legend>
        <TextField
          label="Address"
          value={form.addressLine ?? ""}
          onChange={(e) => set("addressLine", e.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="City"
            value={form.city ?? ""}
            onChange={(e) => set("city", e.target.value)}
          />
          <TextField
            label="State or region"
            value={form.region ?? ""}
            onChange={(e) => set("region", e.target.value)}
          />
          <TextField
            label="Postal code"
            value={form.postalCode ?? ""}
            onChange={(e) => set("postalCode", e.target.value)}
          />
          <TextField
            label="Country"
            value={form.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
          />
        </div>
        <TextField
          label="Timezone"
          required
          value={form.timezone}
          onChange={(e) => set("timezone", e.target.value)}
          hint="An IANA zone, e.g. Asia/Kolkata. Every register date is resolved against this, so it is not cosmetic."
        />
      </fieldset>

      <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
        {schoolId ? "Save changes" : "Create school"}
      </Button>
    </form>
  );
}
