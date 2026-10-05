"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { LocationFields } from "@/components/location-fields";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { saveSchoolDetails } from "./actions";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/* Swatch names are the `aria-label` and the `title`, so they are read aloud and
   hovered — words, and therefore keys. */
const COLOURS: { value: string; nameKey: TranslationKey }[] = [
  { value: "", nameKey: "settings.roleColours" },
  { value: "#2563eb", nameKey: "settings.blue" },
  { value: "#0f766e", nameKey: "settings.teal" },
  { value: "#15803d", nameKey: "settings.green" },
  { value: "#b45309", nameKey: "settings.amber" },
  { value: "#b91c1c", nameKey: "settings.red" },
  { value: "#7e22ce", nameKey: "settings.purple" },
  { value: "#be185d", nameKey: "settings.pink" },
  { value: "#334155", nameKey: "settings.slate" },
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
  const t = useT();
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
    if (draft.name.trim().length < 2) next.name = t("settings.needName");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.contactEmail.trim())) {
      next.contactEmail = t("settings.needEmail");
    }
    if (draft.website && !/^https?:\/\/\S+\.\S+/.test(draft.website.trim())) {
      next.website = t("settings.websiteHint");
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
          title: t("settings.notSaved"),
          description: result.errors._form ?? t("settings.checkFields"),
        });
        return;
      }
      toast({ tone: "ok", title: t("settings.saved") });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {errors._form && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {errors._form}
        </p>
      )}

      <TextField
        label={t("settings.schoolName")}
        required
        value={draft.name}
        error={errors.name}
        onChange={(e) => set("name", e.target.value)}
      />

      <fieldset>
        <legend className="text-sm font-medium text-fg">{t("settings.accentColour")}</legend>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          {t("settings.accentPrefix")}{" "}
          <strong className="text-fg">{t("settings.roleColours")}</strong>{" "}
          {t("settings.accentSuffix")}
        </p>
        <div
          role="radiogroup"
          aria-label={t("settings.accentColour")}
          className="mt-2 flex flex-wrap items-center gap-2"
        >
          {COLOURS.map((option) => (
            <button
              key={option.value || "none"}
              type="button"
              role="radio"
              aria-checked={draft.brandPrimary === option.value}
              aria-label={t(option.nameKey)}
              title={t(option.nameKey)}
              onClick={() => previewColour(option.value)}
              className={cn(
                "grid size-11 place-items-center rounded-full transition-transform active:scale-90",
                draft.brandPrimary === option.value &&
                  "ring-2 ring-accent ring-offset-2 ring-offset-[var(--surface)]",
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
          label={t("settings.contactEmail")}
          required
          type="email"
          inputMode="email"
          value={draft.contactEmail}
          error={errors.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
        />
        <TextField
          label={t("settings.phone")}
          type="tel"
          inputMode="tel"
          placeholder={t("settings.optional")}
          value={draft.contactPhone}
          onChange={(e) => set("contactPhone", e.target.value)}
        />
      </div>

      <TextField
        label={t("settings.website")}
        type="url"
        inputMode="url"
        placeholder={t("settings.websitePlaceholder")}
        value={draft.website}
        error={errors.website}
        onChange={(e) => set("website", e.target.value)}
      />

      <TextField
        label={t("settings.address")}
        placeholder={t("settings.optional")}
        value={draft.addressLine}
        onChange={(e) => set("addressLine", e.target.value)}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={t("settings.city")}
          value={draft.city}
          onChange={(e) => set("city", e.target.value)}
        />
        <TextField
          label={t("settings.postcode")}
          value={draft.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <LocationFields
          country={draft.country}
          region={draft.region}
          onCountryChange={(value) => set("country", value)}
          onRegionChange={(value) => set("region", value)}
          countryLabel={t("settings.country")}
          regionLabel={t("settings.region")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label={t("settings.lowestGrade")}
          placeholder="K"
          value={draft.gradeLow}
          onChange={(e) => set("gradeLow", e.target.value)}
        />
        <TextField
          label={t("settings.highestGrade")}
          placeholder="6"
          value={draft.gradeHigh}
          onChange={(e) => set("gradeHigh", e.target.value)}
        />
      </div>

      <SelectField
        label={t("settings.timezone")}
        required
        value={draft.timezone}
        error={errors.timezone}
        onChange={(e) => set("timezone", e.target.value)}
        hint={t("settings.timezoneHint")}
      >
        {timezones.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </SelectField>

      {dirty && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] flex items-center gap-3 rounded-[var(--radius-lg)] border border-accent bg-surface p-3 shadow-lg lg:bottom-4">
          <p className="min-w-0 flex-1 text-sm font-medium text-fg">{t("settings.unsaved")}</p>
          <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />}>
            {t("common.save")}
          </Button>
        </div>
      )}
    </form>
  );
}
