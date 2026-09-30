"use client";

import { SelectField } from "@/components/ui/field";
import { FONTS, scriptOf, type FontKey } from "@/lib/fonts";
import { useT } from "@/lib/i18n";

/**
 * The typeface a paper or a post is set in, chosen beside its language: the
 * faces of the document's script first, the other script's after, the app's
 * own stack at the top. Each option is drawn in its own face, which is the
 * only sample a font needs.
 */
export function FontSelect({ value, locale, onChange, disabled, testId }: { value: string; locale: string; onChange: (key: FontKey) => void; disabled?: boolean; testId?: string }) {
  const t = useT();
  const first = scriptOf(locale);
  const groups = ([first, first === "latin" ? "devanagari" : "latin"] as const).map((script) => ({ script, faces: FONTS.filter((f) => f.scripts.includes(script)) }));
  return (
    <SelectField label={t("fonts.label")} hint={t("fonts.hint")} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as FontKey)} data-testid={testId}>
      <option value="default">{t("fonts.appDefault")}</option>
      {groups.map(({ script, faces }) => (
        <optgroup key={script} label={t(script === "devanagari" ? "fonts.groupDevanagari" : "fonts.groupLatin")}>
          {faces.map((f) => (
            <option key={f.key} value={f.key} style={{ fontFamily: `"${f.family}"` }}>
              {f.family}
            </option>
          ))}
        </optgroup>
      ))}
    </SelectField>
  );
}
