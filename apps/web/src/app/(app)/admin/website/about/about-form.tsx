"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SITE_PHONES_MAX } from "@edulink/contracts";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { saveSiteDraftAction } from "../actions";
import { StepFooter } from "../steps";

type About = {
  motto: string;
  about: string;
  address: string;
  phones: string[];
  email: string;
  mapUrl: string;
  hours: string;
  board: string;
  foundedYear: number | null;
  principalMessage: string;
  principalNamed: boolean;
};

export function AboutForm({ schoolName, principalName, canName, initial }: { schoolName: string; principalName: string | null; canName: boolean; initial: About }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [a, setA] = useState<About>(initial);
  const [phones, setPhones] = useState<string[]>(() => [...initial.phones, ...Array(SITE_PHONES_MAX).fill("")].slice(0, SITE_PHONES_MAX));
  const [year, setYear] = useState(initial.foundedYear === null ? "" : String(initial.foundedYear));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof About>(k: K, v: About[K]) => setA((x) => ({ ...x, [k]: v }));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const foundedYear = year.trim() === "" ? null : Number(year);
        if (foundedYear !== null && (!Number.isInteger(foundedYear) || foundedYear < 1800 || foundedYear > new Date().getFullYear())) {
          setErrors({ foundedYear: t("website.refuseYear") });
          return;
        }
        start(async () => {
          const r = await saveSiteDraftAction({ ...a, phones: phones.map((p) => p.trim()).filter(Boolean), foundedYear });
          if (!r.ok) {
            setErrors(r.field ? { [r.field]: r.error ?? t("common.tryAgain") } : {});
            return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
          }
          setErrors({});
          router.push("/admin/website/sections");
        });
      }}
    >
      <div>
        <p className="text-sm font-medium text-fg">{t("website.nameLabel")}</p>
        <p className="text-base font-semibold text-fg">{schoolName}</p>
        <p className="text-xs text-fg-muted">{t("website.nameHint")}</p>
      </div>
      <TextField label={t("website.mottoLabel")} hint={t("website.mottoHint")} maxLength={140} value={a.motto} onChange={(e) => set("motto", e.target.value)} />
      <TextAreaField label={t("website.aboutLabel")} hint={t("website.aboutHint")} maxLength={3000} rows={6} value={a.about} onChange={(e) => set("about", e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("website.boardLabel")} hint={t("website.boardHint")} maxLength={140} value={a.board} onChange={(e) => set("board", e.target.value)} />
        <TextField label={t("website.foundedLabel")} hint={t("website.foundedHint")} inputMode="numeric" maxLength={4} value={year} error={errors.foundedYear} onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))} />
      </div>
      <TextAreaField label={t("website.addressLabel")} maxLength={300} rows={2} value={a.address} onChange={(e) => set("address", e.target.value)} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("website.phonesLabel")}</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {phones.map((p, i) => (
            <TextField key={i} label={t("website.phoneN", { n: i + 1 })} type="tel" maxLength={20} value={p} error={i === 0 ? errors.phones : undefined} onChange={(e) => setPhones((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))} />
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("website.emailLabel")} type="email" maxLength={200} value={a.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
        <TextField label={t("website.hoursLabel")} hint={t("website.hoursHint")} maxLength={200} value={a.hours} onChange={(e) => set("hours", e.target.value)} />
      </div>
      <TextField label={t("website.mapLabel")} hint={t("website.mapHint")} type="url" maxLength={500} value={a.mapUrl} error={errors.mapUrl} onChange={(e) => set("mapUrl", e.target.value)} />
      <TextAreaField label={t("website.principalMessageLabel")} hint={t("website.principalMessageHint")} maxLength={2000} rows={4} value={a.principalMessage} onChange={(e) => set("principalMessage", e.target.value)} />
      {principalName ? (
        <CheckboxField
          label={t("website.principalNamed", { name: principalName })}
          description={canName || a.principalNamed ? t("website.principalNamedHint") : t("website.principalNamedHeadOnly")}
          checked={a.principalNamed}
          disabled={!canName && !a.principalNamed}
          error={errors.principalNamed}
          onChange={(e) => set("principalNamed", e.target.checked)}
        />
      ) : (
        <p className="text-xs text-fg-muted">{t("website.principalNone")}</p>
      )}
      <StepFooter back="/admin/website/look" pending={pending} />
    </form>
  );
}
