"use client";

import { useId, useState, useTransition } from "react";
import type { SitePicture } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { uploadSiteFileAction } from "../actions";
import type { EditorFile, EditorPost } from "./types";

/**
 * ONE PICTURE OF THE SITE (website-two, 16 Oct 2026): chosen from the school's approved posts' pictures or the pictures
 * uploaded for the site, or uploaded here; described for a reader who cannot see it; and shown on the site only with
 * the consent tick — nobody can be recognised, or the people shown (and a child's family) agreed to its publication
 * (decision 0002). The server stamps who ticked it and when.
 */
export function PicturePicker({ value, onChange, files, posts, onFileAdded, label }: { value: SitePicture | null; onChange: (p: SitePicture | null) => void; files: EditorFile[]; posts: EditorPost[]; onFileAdded: (f: EditorFile) => void; label: string }) {
  const t = useT();
  const { toast } = useToast();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [uploading, startUpload] = useTransition();
  const choices = [
    ...files.filter((f) => f.kind === "IMAGE").map((f) => ({ fileId: f.fileId, postId: null as string | null, alt: "", title: f.name })),
    ...posts.flatMap((p) => p.images.map((img) => ({ fileId: img.fileId, postId: p.id as string | null, alt: img.alt, title: p.title }))),
  ];
  const pick = (c: { fileId: string; postId: string | null; alt: string }) => {
    onChange({ fileId: c.fileId, postId: c.postId, alt: c.alt, consent: false });
    setOpen(false);
  };
  const upload = (file: File | undefined) => {
    if (!file) return;
    startUpload(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", "IMAGE");
      const r = await uploadSiteFileAction(form);
      if (!r.ok || !r.file) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      onFileAdded(r.file);
      pick({ fileId: r.file.fileId, postId: null, alt: "" });
    });
  };

  return (
    <fieldset className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
      <legend className="px-1 text-sm font-medium text-fg">{label}</legend>
      {value ? (
        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w */}
          <img src={`/api/files/${encodeURIComponent(value.fileId)}?w=320`} alt={value.alt} className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover" />
          <div className="space-y-2">
            <TextField label={t("siteEditor.altLabel")} hint={t("siteEditor.altHint")} maxLength={200} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
            <CheckboxField label={t("siteEditor.consentTick")} description={t("siteEditor.consentHint")} checked={value.consent} onChange={(e) => onChange({ ...value, consent: e.target.checked })} />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${id}-choices`}>
                {t("siteEditor.pictureChange")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                {t("siteEditor.pictureRemove")}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${id}-choices`}>
          {t("siteEditor.pictureChoose")}
        </Button>
      )}
      {open ? (
        <div id={`${id}-choices`} className="space-y-3">
          <div>
            <label htmlFor={`${id}-upload`} className="block text-sm font-medium text-fg">
              {t("siteEditor.pictureUpload")}
            </label>
            <input id={`${id}-upload`} type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} className="mt-1 block text-sm" onChange={(e) => upload(e.target.files?.[0])} />
            <p className="text-xs text-fg-muted">{t("siteEditor.pictureUploadHint")}</p>
          </div>
          {choices.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("siteEditor.pictureNone")}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {choices.map((c) => (
                <li key={c.fileId}>
                  <button type="button" onClick={() => pick(c)} className="block w-full rounded-[var(--radius-sm)] border border-border p-1 text-left hover:border-accent">
                    {/* eslint-disable-next-line @next/next/no-img-element -- a stored file through the file route, sized by ?w */}
                    <img src={`/api/files/${encodeURIComponent(c.fileId)}?w=320`} alt={c.alt || c.title} className="aspect-[4/3] w-full rounded-[var(--radius-sm)] object-cover" loading="lazy" />
                    <span className="mt-1 block truncate text-xs text-fg-muted">{c.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

/** A PDF of the site: chosen from those uploaded, or uploaded here. */
export function PdfPicker({ value, onChange, files, onFileAdded, label }: { value: string | null; onChange: (fileId: string | null) => void; files: EditorFile[]; onFileAdded: (f: EditorFile) => void; label: string }) {
  const t = useT();
  const { toast } = useToast();
  const id = useId();
  const [uploading, startUpload] = useTransition();
  const pdfs = files.filter((f) => f.kind === "PDF");
  const upload = (file: File | undefined) => {
    if (!file) return;
    startUpload(async () => {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", "PDF");
      const r = await uploadSiteFileAction(form);
      if (!r.ok || !r.file) return void toast({ tone: "danger", title: r.error ?? t("common.tryAgain") });
      onFileAdded(r.file);
      onChange(r.file.fileId);
    });
  };
  return (
    <div className="space-y-2">
      <SelectField label={label} value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{t("siteEditor.pdfNone")}</option>
        {pdfs.map((f) => (
          <option key={f.fileId} value={f.fileId}>
            {f.name || f.fileId}
          </option>
        ))}
      </SelectField>
      <label htmlFor={`${id}-upload`} className="block text-sm text-fg">
        {t("siteEditor.pdfUpload")}
      </label>
      <input id={`${id}-upload`} type="file" accept="application/pdf" disabled={uploading} className="block text-sm" onChange={(e) => upload(e.target.files?.[0])} />
    </div>
  );
}
