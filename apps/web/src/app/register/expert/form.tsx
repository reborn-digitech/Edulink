"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircleIcon, PaperPlaneTiltIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import {
  EXPERT_APPLICATION_LIMITS,
  EXPERT_APPLICATION_OFFERINGS,
  EXPERT_SPECIALISMS,
  EXPERT_SPECIALISMS_MAX,
  EXPERT_TEACHING_LANGUAGES,
  expertApplicationReceivedSchema,
} from "@edulink/contracts";
import { fieldClass } from "@/components/ui/field-class";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CheckboxField, Field, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { FileField } from "@/components/ui/file-field";
import { EXPERT_OFFERING_META } from "@/lib/constants";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

type Offering = (typeof EXPERT_APPLICATION_OFFERINGS)[number];
/** The fields a refusal may name; anything else (the contract's own path, "_form") reads above the form. */
const FIELDS = new Set(["name", "email", "phone", "city", "organisation", "headline", "specialisms", "languages", "yearsExperience", "bio", "links", "offering", "document", "declaration"]);

/**
 * The expert's application (15 Oct 2026): every field the operator needs to decide, one document, the
 * declaration, and no password. Sent as one multipart body to POST /api/v1/public/expert-applications — the
 * phone's door too, and the only way to carry a 5 MB document past a server action's one-megabyte body. A
 * refusal comes back as a sentence with the field it is about; a 201 turns the form into the thank-you note.
 */
export function ExpertApplicationForm() {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<{ text: string; field?: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", organisation: "", headline: "", years: "", bio: "" });
  const [specialisms, setSpecialisms] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([""]);
  const [offering, setOffering] = useState<Offering>("BOTH");
  const [declared, setDeclared] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const toggle = (list: string[], value: string, max: number) => (list.includes(value) ? list.filter((v) => v !== value) : list.length >= max ? list : [...list, value]);
  const fieldError = (field: string) => (error?.field === field ? error.text : undefined);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const document = formRef.current ? new FormData(formRef.current).get("document") : null;
    const body = new FormData();
    body.set(
      "application",
      JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        organisation: form.organisation || null,
        headline: form.headline,
        specialisms,
        languages,
        // A blank or a word is sent as -1, which the library answers with its own sentence on the field.
        yearsExperience: form.years.trim() !== "" && Number.isFinite(Number(form.years)) ? Number(form.years) : -1,
        bio: form.bio,
        links: links.map((l) => l.trim()).filter(Boolean),
        offering,
        declaration: declared,
      }),
    );
    if (document instanceof File && document.size > 0) body.set("document", document);
    startTransition(async () => {
      try {
        const response = await fetch("/api/v1/public/expert-applications", { method: "POST", body, credentials: "same-origin" });
        const data = (await response.json().catch(() => null)) as { error?: string; issues?: Record<string, string> } | null;
        if (response.status === 201) {
          const received = expertApplicationReceivedSchema.safeParse(data);
          setSentTo(received.success ? received.data.email : form.email.trim().toLowerCase());
          window.scrollTo({ top: 0 });
          return;
        }
        // A field the contract refused (a number that is not whole, say) comes back as an issue on its own path.
        const named = data?.issues ? Object.keys(data.issues)[0] : undefined;
        const field = named && FIELDS.has(named) ? named : undefined;
        // `error` is always the server's sentence in the reader's language (a contract issue's own text is not).
        setError({ text: data?.error || t("common.checkTheForm"), field });
      } catch {
        setError({ text: t("common.tryAgain") });
      }
    });
  }

  if (sentTo) {
    return (
      <section aria-live="polite" className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <CheckCircleIcon weight="duotone" className="size-10 text-success" aria-hidden />
        <h2 className="text-xl font-semibold text-fg">{t("expertApply.thanksTitle")}</h2>
        <p className="text-fg">{t("expertApply.thanksBody", { email: sentTo })}</p>
        <p className="text-sm text-fg-muted">{t("expertApply.thanksNext")}</p>
        <Button asChild variant="secondary">
          <Link href="/">{t("expertApply.backHome")}</Link>
        </Button>
      </section>
    );
  }

  const L = EXPERT_APPLICATION_LIMITS;
  return (
    <form ref={formRef} onSubmit={submit} className="space-y-5" noValidate>
      {error && !error.field && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error.text}
        </p>
      )}
      <TextField label={t("expertApply.fieldName")} required autoComplete="name" value={form.name} onChange={set("name")} error={fieldError("name")} maxLength={L.name} />
      <TextField label={t("expertApply.fieldEmail")} required type="email" autoComplete="email" value={form.email} onChange={set("email")} error={fieldError("email")} hint={t("expertApply.fieldEmailHint")} maxLength={200} />
      <TextField label={t("expertApply.fieldPhone")} required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={set("phone")} error={fieldError("phone")} hint={t("expertApply.fieldPhoneHint")} maxLength={20} />
      <TextField label={t("expertApply.fieldCity")} required autoComplete="address-level2" value={form.city} onChange={set("city")} error={fieldError("city")} maxLength={L.city} />
      <TextField label={t("expertApply.fieldOrganisation")} autoComplete="organization" value={form.organisation} onChange={set("organisation")} error={fieldError("organisation")} hint={t("expertApply.fieldOrganisationHint")} maxLength={L.organisation} />
      <TextField label={t("expertApply.fieldHeadline")} required value={form.headline} onChange={set("headline")} error={fieldError("headline")} hint={t("expertApply.fieldHeadlineHint")} maxLength={L.headline} />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("expertApply.fieldSpecialisms")}</legend>
        <p className="text-xs text-fg-muted">
          {t("expertApply.fieldSpecialismsHint")} {t("expertApply.specialismsChosen", { count: specialisms.length })}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXPERT_SPECIALISMS.map((code) => (
            <Chip
              key={code}
              pressed={specialisms.includes(code)}
              disabled={!specialisms.includes(code) && specialisms.length >= EXPERT_SPECIALISMS_MAX}
              onClick={() => setSpecialisms((list) => toggle(list, code, EXPERT_SPECIALISMS_MAX))}
            >
              {t(`expertApply.specialism${code}` as TranslationKey)}
            </Chip>
          ))}
        </div>
        {fieldError("specialisms") && <p role="alert" className="text-xs font-medium text-danger">{fieldError("specialisms")}</p>}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("expertApply.fieldLanguages")}</legend>
        <div className="flex flex-wrap gap-2">
          {EXPERT_TEACHING_LANGUAGES.map((code) => (
            <Chip key={code} pressed={languages.includes(code)} onClick={() => setLanguages((list) => toggle(list, code, EXPERT_TEACHING_LANGUAGES.length))}>
              {t(`expertApply.language${code}` as TranslationKey)}
            </Chip>
          ))}
        </div>
        {fieldError("languages") && <p role="alert" className="text-xs font-medium text-danger">{fieldError("languages")}</p>}
      </fieldset>

      <TextField label={t("expertApply.fieldYears")} required type="number" inputMode="numeric" min={0} max={L.years} step={1} value={form.years} onChange={set("years")} error={fieldError("yearsExperience")} />
      <TextAreaField
        label={t("expertApply.fieldBio")}
        required
        rows={6}
        value={form.bio}
        onChange={set("bio")}
        error={fieldError("bio")}
        hint={[t("expertApply.fieldBioHint"), t("expertApply.bioCount", { count: form.bio.length })].join(" ")}
        maxLength={L.bio}
      />

      <Field label={t("expertApply.fieldLinks")} hint={t("expertApply.fieldLinksHint")} error={fieldError("links")}>
        {({ id, describedBy }) => (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  id={index === 0 ? id : undefined}
                  aria-describedby={describedBy}
                  aria-label={t("expertApply.linkLabel", { number: index + 1 })}
                  type="url"
                  inputMode="url"
                  value={link}
                  maxLength={L.link}
                  onChange={(e) => setLinks((list) => list.map((l, i) => (i === index ? e.target.value : l)))}
                  className={fieldClass("w-full")}
                />
                {links.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" aria-label={t("expertApply.removeLink")} icon={<XIcon weight="bold" />} onClick={() => setLinks((list) => list.filter((_, i) => i !== index))} />
                )}
              </div>
            ))}
            {links.length < L.links && (
              <Button type="button" variant="secondary" size="sm" icon={<PlusIcon weight="bold" />} onClick={() => setLinks((list) => [...list, ""])}>
                {t("expertApply.addLink")}
              </Button>
            )}
          </div>
        )}
      </Field>

      <SelectField label={t("expertApply.fieldOffering")} value={offering} onChange={(e) => setOffering(e.target.value as Offering)} error={fieldError("offering")} hint={t(EXPERT_OFFERING_META[offering].hintKey)}>
        {EXPERT_APPLICATION_OFFERINGS.map((code) => (
          <option key={code} value={code}>
            {t(EXPERT_OFFERING_META[code].labelKey)}
          </option>
        ))}
      </SelectField>

      <FileField label={t("expertApply.fieldDocument")} name="document" accept="application/pdf,image/jpeg,image/png" required hint={t("expertApply.fieldDocumentHint")} />
      {fieldError("document") && <p role="alert" className="-mt-3 text-xs font-medium text-danger">{fieldError("document")}</p>}

      <CheckboxField label={t("expertApply.declaration")} checked={declared} onChange={(e) => setDeclared(e.target.checked)} error={fieldError("declaration")} />

      <p className="text-sm text-fg-muted">{t("expertApply.noPasswordNote")}</p>
      <Button type="submit" variant="primary" loading={pending} icon={<PaperPlaneTiltIcon weight="bold" />}>
        {t("expertApply.submit")}
      </Button>
    </form>
  );
}
