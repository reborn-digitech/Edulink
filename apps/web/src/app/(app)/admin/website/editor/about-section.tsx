"use client";

import { useState } from "react";
import { SITE_PHONES_MAX } from "@edulink/contracts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";
import type { SectionProps } from "./types";

/**
 * ABOUT THE SCHOOL (the second of the six screens, kept as it was and grown by the medium, website-two): the school's
 * own words and how to reach it, prefilled from what the school already entered. The About, Academics and Contact
 * pages print them.
 */
export function AboutSection({ draft, setDraft, problem, schoolName, principalName, canName }: SectionProps & { schoolName: string; principalName: string | null; canName: boolean }) {
  const t = useT();
  const [year, setYear] = useState(draft.foundedYear === null ? "" : String(draft.foundedYear));
  const phones = [...draft.phones, ...Array(SITE_PHONES_MAX).fill("")].slice(0, SITE_PHONES_MAX) as string[];
  const err = (field: string) => (problem?.field === field ? problem.message : undefined);
  const setYearText = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    const n = Number(digits);
    setDraft("foundedYear", digits.length === 4 && n >= 1800 && n <= 2100 ? n : null);
  };
  return (
    <Card>
      <CardHeader title={t("website.aboutTitle")} description={t("website.aboutIntro")} />
      <CardBody className="space-y-5">
        <div>
          <p className="text-sm font-medium text-fg">{t("website.nameLabel")}</p>
          <p className="text-base font-semibold text-fg">{schoolName}</p>
          <p className="text-xs text-fg-muted">{t("website.nameHint")}</p>
        </div>
        <TextField label={t("website.mottoLabel")} hint={t("website.mottoHint")} maxLength={140} value={draft.motto} onChange={(e) => setDraft("motto", e.target.value)} />
        <TextAreaField label={t("website.aboutLabel")} hint={t("website.aboutHint")} maxLength={3000} rows={6} value={draft.about} onChange={(e) => setDraft("about", e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField label={t("website.boardLabel")} hint={t("website.boardHint")} maxLength={140} value={draft.board} onChange={(e) => setDraft("board", e.target.value)} />
          <TextField label={t("website.foundedLabel")} hint={t("website.foundedHint")} inputMode="numeric" maxLength={4} value={year} error={err("foundedYear")} onChange={(e) => setYearText(e.target.value)} />
          <TextField label={t("siteWeb.factMedium")} hint={t("siteEditor.mediumHint")} maxLength={60} value={draft.medium} onChange={(e) => setDraft("medium", e.target.value)} />
        </div>
        <TextAreaField label={t("website.addressLabel")} maxLength={300} rows={2} value={draft.address} onChange={(e) => setDraft("address", e.target.value)} />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-fg">{t("website.phonesLabel")}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {phones.map((p, i) => (
              <TextField
                key={i}
                label={t("website.phoneN", { n: i + 1 })}
                type="tel"
                maxLength={20}
                value={p}
                error={i === 0 ? err("phones") : undefined}
                onChange={(e) => setDraft("phones", phones.map((x, j) => (j === i ? e.target.value : x)))}
              />
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t("website.emailLabel")} type="email" maxLength={200} value={draft.email} error={err("email")} onChange={(e) => setDraft("email", e.target.value)} />
          <TextField label={t("website.hoursLabel")} hint={t("website.hoursHint")} maxLength={200} value={draft.hours} onChange={(e) => setDraft("hours", e.target.value)} />
        </div>
        <TextField label={t("website.mapLabel")} hint={t("website.mapHint")} type="url" maxLength={500} value={draft.mapUrl} error={err("mapUrl")} onChange={(e) => setDraft("mapUrl", e.target.value)} />
        <TextAreaField label={t("website.principalMessageLabel")} hint={t("website.principalMessageHint")} maxLength={2000} rows={4} value={draft.principalMessage} onChange={(e) => setDraft("principalMessage", e.target.value)} />
        {principalName ? (
          <CheckboxField
            label={t("website.principalNamed", { name: principalName })}
            description={canName || draft.principalNamed ? t("website.principalNamedHint") : t("website.principalNamedHeadOnly")}
            checked={draft.principalNamed}
            disabled={!canName && !draft.principalNamed}
            error={err("principalNamed")}
            onChange={(e) => setDraft("principalNamed", e.target.checked)}
          />
        ) : (
          <p className="text-xs text-fg-muted">{t("website.principalNone")}</p>
        )}
      </CardBody>
    </Card>
  );
}
