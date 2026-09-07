"use client";

import { SelectField, TextField } from "@/components/ui/field";
import { INDIA, INDIAN_STATES, isIndia, matchIndianState } from "@/lib/places";
import { useT } from "@/lib/i18n";

/**
 * Country and state, as one pair, for every form that asks where a school is.
 *
 * The country box comes FIRST and the state box changes shape to match it:
 * for India the state is a dropdown of the 36 states and union territories,
 * for anywhere else it is free text. This is the form-side half of the fix
 * in `lib/places.ts` — a school whose admin knows "Gujarat" and sees a
 * country box will type Gujarat into it if that is the only box on offer.
 * With India already filled in and Gujarat waiting in a list beside it, the
 * mistake has nowhere to go.
 *
 * A state the row already holds that is NOT in the list (a district, an old
 * free-text value) is kept as an extra option rather than silently dropped,
 * so opening the form never changes an answer the school did not change.
 */
export function LocationFields({
  country,
  region,
  onCountryChange,
  onRegionChange,
  countryLabel,
  regionLabel,
}: {
  country: string;
  region: string;
  onCountryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  countryLabel: string;
  regionLabel: string;
}) {
  const t = useT();
  const india = isIndia(country);
  const canonical = matchIndianState(region);
  const options =
    region && !canonical ? [region, ...INDIAN_STATES] : INDIAN_STATES;

  return (
    <>
      <TextField
        label={countryLabel}
        autoComplete="country-name"
        placeholder={INDIA}
        value={country}
        onChange={(e) => onCountryChange(e.target.value)}
      />
      {india ? (
        <SelectField
          label={regionLabel}
          value={canonical ?? region}
          onChange={(e) => onRegionChange(e.target.value)}
        >
          <option value="">{t("places.chooseState")}</option>
          {options.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </SelectField>
      ) : (
        <TextField
          label={regionLabel}
          autoComplete="address-level1"
          value={region}
          onChange={(e) => onRegionChange(e.target.value)}
        />
      )}
    </>
  );
}
