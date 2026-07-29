"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { saveSchoolDetails } from "./actions";

const COLOURS = [
  { value: "", name: "Role colours" },
  { value: "#2563eb", name: "Blue" },
  { value: "#0f766e", name: "Teal" },
  { value: "#15803d", name: "Green" },
  { value: "#b45309", name: "Amber" },
  { value: "#b91c1c", name: "Red" },
  { value: "#7e22ce", name: "Purple" },
  { value: "#be185d", name: "Pink" },
  { value: "#334155", name: "Slate" },
];

type School = {
  name: string;
  brandPrimary: string | null;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  gradeLow: string | null;
  gradeHigh: string | null;
  timezone: string;
};

export function DetailsForm({ school }: { school: School }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [draft, setDraft] = useState({
    name: school.name,
    brandPrimary: school.brandPrimary ?? "",
    contactEmail: school.contactEmail,
    contactPhone: school.contactPhone ?? "",
    website: school.website ?? "",
    addressLine: school.addressLine ?? "",
    city: school.city ?? "",
    region: school.region ?? "",
    postalCode: school.postalCode ?? "",
    country: school.country ?? "",
    gradeLow: school.gradeLow ?? "",
    gradeHigh: school.gradeHigh ?? "",
    timezone: school.timezone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const timezones = useMemo(() => {
    const supported = (Intl as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    const list = supported ? supported("timeZone") : ["UTC"];
    return list.includes(draft.timezone) ? list : [draft.timezone, ...list];
  }, [draft.timezone]);

  const dirty = useMemo(() => {
    return (
      draft.name !== school.name ||
      draft.brandPrimary !== (school.brandPrimary ?? "") ||
      draft.contactEmail !== school.contactEmail ||
      draft.contactPhone !== (school.contactPhone ?? "") ||
      draft.website !== (school.website ?? "") ||
      draft.addressLine !== (school.addressLine ?? "") ||
      draft.city !== (school.city ?? "") ||
      draft.region !== (school.region ?? "") ||
      draft.postalCode !== (school.postalCode ?? "") ||
      draft.country !== (school.country ?? "") ||
      draft.gradeLow !== (school.gradeLow ?? "") ||
      draft.gradeHigh !== (school.gradeHigh ?? "") ||
      draft.timezone !== school.timezone
    );
  }, [draft, school]);

  function set<K extends keyof typeof draft>(key: K, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key as string];
      return next;
    });
  }

  /**
   * Applies the accent immediately so the choice is visible while choosing it.
   * The server row is still the source of truth; this is just not making
   * someone save-and-reload to see a colour.
   */
  function previewColour(value: string) {
    set("brandPrimary", value);
    const root = document.documentElement;
    if (value) root.style.setProperty("--accent", value);
    else root.style.removeProperty("--accent");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const next: Record<string, string> = {};
    if (draft.name.trim().length < 2) next.name = "Enter the school's name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contactEmail.trim())) {
      next.contactEmail = "Enter a valid contact email.";
    }
    if (draft.website && !/^https?:\/\/\S+\.\S+/.test(draft.website.trim())) {
      next.website = "Start with http:// or https://";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    startTransition(async () => {
      const result = await saveSchoolDetails({
        ...draft,
        name: draft.name.trim(),
        contactEmail: draft.contactEmail.trim().toLowerCase(),
      });
      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: "Not saved",
          description: result.errors._form ?? "Check the highlighted fields.",
        });
        return;
      }
      toast({ tone: "ok", title: "Settings saved" });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label="School name"
        required
        value={draft.name}
        error={errors.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <fieldset>
        <legend className="text-sm font-medium text-fg">Accent colour</legend>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          Overrides the per-role colours everywhere. Leave it on{" "}
          <strong className="text-fg">Role colours</strong> to keep teachers blue, students green
          and parents purple.
        </p>
        <div
          role="radiogroup"
          aria-label="Accent colour"
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          {COLOURS.map((option) => (
            <button
              key={option.value || "none"}
              type="button"
              role="radio"
              aria-checked={draft.brandPrimary === option.value}
              aria-label={option.name}
              title={option.name}
              onClick={() => previewColour(option.value)}
              className={cn(
                "grid size-11 place-items-center rounded-full transition-transform active:scale-90",
                draft.brandPrimary === option.value &&
                  "ring-2 ring-accent ring-offset-2 ring-offset-[--surface]",
              )}
            >
              {option.value ? (
                <span className="size-7 rounded-full" style={{ backgroundColor: option.value }} />
              ) : (
                <span className="grid size-7 place-items-center rounded-full border border-dashed border-border-strong text-[0.625rem] font-bold text-fg-muted">
                  A
                </span>
              )}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Contact email"
          required
          type="email"
          inputMode="email"
          value={draft.contactEmail}
          error={errors.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
        />
        <TextField
          label="Phone"
          type="tel"
          inputMode="tel"
          placeholder="Optional"
          value={draft.contactPhone}
          onChange={(e) => set("contactPhone", e.target.value)}
        />
      </div>

      <TextField
        label="Website"
        type="url"
        inputMode="url"
        placeholder="https://your-school.example"
        value={draft.website}
        error={errors.website}
        onChange={(e) => set("website", e.target.value)}
      />

      <TextField
        label="Address"
        placeholder="Optional"
        value={draft.addressLine}
        onChange={(e) => set("addressLine", e.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Town or city"
          value={draft.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <TextField
          label="Region or state"
          value={draft.region}
          onChange={(e) => set("region", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Postcode"
          value={draft.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
        />
        <TextField
          label="Country"
          value={draft.country}
          onChange={(e) => set("country", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Lowest grade"
          placeholder="K"
          value={draft.gradeLow}
          onChange={(e) => set("gradeLow", e.target.value)}
        />
        <TextField
          label="Highest grade"
          placeholder="6"
          value={draft.gradeHigh}
          onChange={(e) => set("gradeHigh", e.target.value)}
        />
      </div>

      <SelectField
        label="Timezone"
        required
        value={draft.timezone}
        error={errors.timezone}
        onChange={(e) => set("timezone", e.target.value)}
        hint="Attendance days and due dates are worked out in this timezone. Changing it does not move existing records."
      >
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </SelectField>

      {dirty && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center gap-3 rounded-[--radius-lg] border border-accent bg-surface p-3 shadow-lg lg:bottom-4">
          <p className="min-w-0 flex-1 text-sm font-medium text-fg">Unsaved changes</p>
          <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
            Save
          </Button>
        </div>
      )}
    </form>
  );
}
