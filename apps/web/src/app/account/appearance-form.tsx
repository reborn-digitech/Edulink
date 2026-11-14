"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "@/lib/navigation";
import { FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { savePrefs } from "./actions";
import type { UserPrefs } from "@/lib/session";
import { fieldClass } from "@/components/ui/field-class";

/**
 * Appearance and notification preferences.
 *
 * Appearance changes apply to the live DOM **immediately**, before the save
 * round-trips: someone turning on high contrast because they cannot read the
 * page should not have to read a "Saved" toast to find out whether it worked.
 * The same values are mirrored into localStorage so the blocking theme script
 * can apply them before first paint on the next load.
 */

const STORAGE_KEY = "edulink.appearance";

export function AppearanceForm({
  prefs,
  section,
  phone,
  textsOn = true,
}: {
  prefs: UserPrefs;
  section: "appearance" | "notifications";
  /**
   * The mobile number texts go to, formatted for reading, or null when the
   * account has none — so the SMS and WhatsApp switches below say plainly
   * whether switching them on can reach anyone. Undefined when the caller
   * does not know, and then nothing is said.
   */
  phone?: string | null;
  /**
   * Whether the operator has texts on (TEXT_MESSAGING; QA-61): off, the SMS and WhatsApp boxes are shown as they are
   * kept but cannot be changed, with a line saying texts are not on, instead of describing texts that never go.
   */
  textsOn?: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<UserPrefs>(prefs);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Push a value straight onto <html> so the change is instant. */
  function applyLive(next: UserPrefs) {
    const root = document.documentElement;
    const theme =
      next.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : next.theme;

    root.setAttribute("data-theme", theme);
    root.setAttribute("data-contrast", next.contrast);
    root.setAttribute("data-font", next.font);
    root.setAttribute("data-motion", next.motion === "reduced" ? "reduced" : "full");

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0e15" : "#141924");

    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...existing,
          theme: next.theme,
          contrast: next.contrast,
          font: next.font,
          motion: next.motion,
        }),
      );
    } catch {
      // Private mode / quota. The server row is still the source of truth.
    }
  }

  // Keep in step if the server row changes under us (e.g. another tab saved).
  // Compared by identity, which is what the effect this replaced did too: a
  // fresh server render hands down a new object, an unchanged one does not.
  const [lastPrefs, setLastPrefs] = useState(prefs);
  if (prefs !== lastPrefs) {
    setLastPrefs(prefs);
    setDraft(prefs);
  }

  function update(patch: Partial<UserPrefs>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (section === "appearance") applyLive(next);
  }

  function save() {
    setErrors({});
    startTransition(async () => {
      const result = await savePrefs(draft);
      if (!result.ok) {
        setErrors(result.errors);
        toast({
          tone: "danger",
          title: t("prefs.notSaved"),
          description: result.errors._form ?? t("prefs.notSavedHint"),
        });
        return;
      }
      toast({ tone: "ok", title: t("prefs.saved") });
      router.refresh();
    });
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs);

  if (section === "notifications") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <CheckboxField
            label={t("prefs.push")}
            description={t("prefs.pushHint")}
            checked={draft.channels.push}
            onChange={(e) => update({ channels: { ...draft.channels, push: e.target.checked } })}
          />
          {/* No email switch (TA-431): nothing sends a copy of a notice by mail. The draft still carries the stored
              email value back untouched, so the row keeps what it held. */}
          {/* The texts the school sends (messaging.ts reads these two). An
              older prefs row has neither key, and the router treats a missing
              one as on, so the box reads on unless it was switched off. */}
          <CheckboxField
            label={t("prefs.sms")}
            description={t("prefs.smsHint")}
            checked={draft.channels.sms !== false}
            disabled={!textsOn}
            onChange={(e) => update({ channels: { ...draft.channels, sms: e.target.checked } })}
          />
          <CheckboxField
            label={t("prefs.whatsapp")}
            description={t("prefs.whatsappHint")}
            checked={draft.channels.whatsapp !== false}
            disabled={!textsOn}
            onChange={(e) => update({ channels: { ...draft.channels, whatsapp: e.target.checked } })}
          />
          {!textsOn && <p className="px-1 text-xs leading-relaxed text-fg-muted">{t("qaInterface.textsOff")}</p>}
          {textsOn && phone !== undefined && (
            <p className={cn("px-1 text-xs leading-relaxed", phone ? "text-fg-muted" : "text-warn")}>
              {phone ? t("messaging.phoneOn", { phone }) : t("messaging.phoneOff")}{" "}
              <Link href="/account" className="font-medium text-accent-strong underline decoration-accent-strong/40 hover:decoration-accent-strong">
                {t("messaging.phoneManage")}
              </Link>
            </p>
          )}
        </div>

        <fieldset className="rounded-[var(--radius-md)] border border-border p-4">
          <legend className="px-1 text-sm font-medium text-fg">{t("prefs.quietHours")}</legend>
          <p className="text-xs leading-relaxed text-fg-muted">{t("prefs.quietHoursHint")}</p>

          <CheckboxField
            className="mt-3"
            label={t("prefs.useQuietHours")}
            checked={draft.quietHours !== null}
            onChange={(e) =>
              update({ quietHours: e.target.checked ? { start: "21:00", end: "07:00" } : null })
            }
          />

          {draft.quietHours && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="block text-sm font-medium text-fg">{t("prefs.from")}</span>
                <input
                  type="time"
                  value={draft.quietHours.start}
                  onChange={(e) =>
                    update({ quietHours: { ...draft.quietHours!, start: e.target.value } })
                  }
                  className={fieldClass("mt-1")}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-fg">{t("prefs.until")}</span>
                <input
                  type="time"
                  value={draft.quietHours.end}
                  onChange={(e) =>
                    update({ quietHours: { ...draft.quietHours!, end: e.target.value } })
                  }
                  aria-invalid={Boolean(errors["quietHours.end"]) || undefined}
                  className={fieldClass("mt-1", Boolean(errors["quietHours.end"]))}
                />
              </label>
              {errors["quietHours.end"] && (
                <p role="alert" className="text-xs font-medium text-danger sm:col-span-2">
                  {errors["quietHours.end"]}
                </p>
              )}
              <p className="text-xs text-fg-muted sm:col-span-2">
                {t("prefs.quietHoursMidnight")}
              </p>
            </div>
          )}
        </fieldset>

        {dirty && (
          <Button loading={pending} icon={<FloppyDiskIcon weight="bold" />} onClick={save}>
            {t("prefs.saveNotifications")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OptionRow
        label={t("prefs.colourScheme")}
        hint={t("prefs.colourSchemeHint")}
        value={draft.theme}
        options={[
          { value: "system", label: t("prefs.system") },
          { value: "light", label: t("prefs.light") },
          { value: "dark", label: t("prefs.dark") },
        ]}
        onChange={(value) => update({ theme: value as UserPrefs["theme"] })}
      />

      <OptionRow
        label={t("prefs.contrast")}
        hint={t("prefs.contrastHint")}
        value={draft.contrast}
        options={[
          { value: "normal", label: t("prefs.normal") },
          { value: "high", label: t("prefs.high") },
        ]}
        onChange={(value) => update({ contrast: value as UserPrefs["contrast"] })}
      />

      <OptionRow
        label={t("prefs.typeface")}
        hint={t("prefs.typefaceHint")}
        value={draft.font}
        options={[
          { value: "default", label: t("prefs.default") },
          { value: "dyslexic", label: t("prefs.dyslexic") },
        ]}
        onChange={(value) => update({ font: value as UserPrefs["font"] })}
      />

      <OptionRow
        label={t("prefs.motion")}
        hint={t("prefs.motionHint")}
        value={draft.motion}
        options={[
          { value: "full", label: t("prefs.full") },
          { value: "reduced", label: t("prefs.reduced") },
        ]}
        onChange={(value) => update({ motion: value as UserPrefs["motion"] })}
      />

      {dirty && (
        <Button loading={pending} icon={<FloppyDiskIcon weight="bold" />} onClick={save}>
          {t("prefs.saveAppearance")}
        </Button>
      )}
    </div>
  );
}

function OptionRow({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-fg">{label}</legend>
      <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">{hint}</p>
      <div
        role="radiogroup"
        aria-label={label}
        className="mt-2 flex flex-wrap gap-1 rounded-[var(--radius-md)] bg-surface-muted p-1"
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "min-h-11 flex-1 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors",
                active ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
