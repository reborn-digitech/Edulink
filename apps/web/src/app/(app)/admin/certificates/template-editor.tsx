"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, DotsSixVerticalIcon, FloppyDiskIcon, TrashIcon } from "@phosphor-icons/react";
import type { CertificateKind, CertificateLayout, CertificateTemplateSave, CertificateTemplatesView, PaperSigner } from "@edulink/contracts";
import type { PaletteEntry } from "@/lib/certificates";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useLocale, useT } from "@/lib/i18n";
import { CERTIFICATE_KIND_KEY, localeName } from "@/components/certificates/labels";
import { DetailPicker } from "@/components/certificates/detail-picker";
import { FontSelect } from "@/components/font-select";
import { fontStack, paragraphFont, typingFor } from "@/lib/fonts";
import { TemplatePreview } from "@/components/certificates/template-preview";
import { TokenField, type TokenFieldHandle } from "@/components/certificates/token-field";
import { saveTemplateAction } from "./actions";

type Preset = CertificateTemplatesView["presets"][number];
type Template = CertificateTemplatesView["templates"][number];
type RowDraft = { key: string; label: string; value: string };

const KINDS: CertificateKind[] = ["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM"];
const LOCALES: ("en" | "hi" | "mr")[] = ["en", "hi", "mr"];
const LAYOUT_TOGGLES: (keyof Pick<CertificateLayout, "showLogo" | "showAddress" | "useBrandColour">)[] = ["showLogo", "showAddress", "useBrandColour"];
const TOKEN = /\[\[\s*([a-z]+\.[A-Za-z]+)\s*\]\]/g;

let seq = 0;
const nextKey = () => `row-${++seq}`;
const toRows = (rows: { label: string; value: string }[]): RowDraft[] => rows.map((r) => ({ key: nextKey(), label: r.label, value: r.value }));

type Draft = Omit<CertificateTemplateSave, "rows"> & { rows: RowDraft[] };

function draftFrom(source: Preset | Template, active: boolean): Draft {
  return {
    kind: source.kind,
    name: source.name,
    locale: source.locale,
    title: source.title,
    intro: source.intro,
    rows: toRows(source.rows),
    outro: source.outro,
    layout: { ...source.layout },
    serialPrefix: source.serialPrefix,
    active,
  };
}

/**
 * The office's editor for one certificate template: its wording in the
 * language the document is written in, its numbered rows, its layout and
 * its serial prefix. A preset fills the whole form so a school starts from
 * a board-shaped document and changes the words, never from a blank page.
 *
 * A DETAIL OF THE PUPIL IS CHOSEN, NOT TYPED. Until 2026-09-30 it was a code
 * in double brackets, picked from a list of thirty-six at the foot of the
 * form and written into whichever text had last been clicked in — or into
 * nothing, silently, when none had. Now:
 *  - "Add a row" opens the list under the rows. Choosing "Admission
 *    register number" makes the row, labelled in the DOCUMENT's language
 *    and filled with that detail; "a row of your own" makes an empty one.
 *  - each paragraph has "Insert a detail" of its own, which writes at the
 *    caret of that paragraph and no other.
 *  - a detail is shown as a chip with its name in the READER's language
 *    (token-field.tsx). What is saved is what was always saved.
 *  - the certificate is drawn beside the form as it is written, filled for
 *    a sample pupil in the document's language (template-preview.tsx).
 *  - a code the certificate cannot fill is red in the text, named above
 *    the save button, and stops the save. It used to save and print a dash.
 *  - a row is moved by its handle, dragged with a mouse or a finger, the
 *    rows making way as it passes. The two arrows stay, and the handle
 *    takes the arrow keys, because a keyboard and a screen reader cannot
 *    drag; where the row now stands is said aloud.
 */
/** `readOnly` is the head's view: every control disabled and no save, because designing a template is the admin's. */
export function TemplateEditor({ view, palette, template, readOnly = false }: { view: CertificateTemplatesView; palette: PaletteEntry[]; template?: Template; readOnly?: boolean }) {
  const t = useT();
  const uiLocale = useLocale();
  const reader = uiLocale === "hi" || uiLocale === "mr" ? uiLocale : "en";
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [preset, setPreset] = useState<string>(template ? "" : (view.presets[0]?.key ?? ""));
  const [draft, setDraft] = useState<Draft>(() => (template ? draftFrom(template, template.active) : view.presets[0] ? draftFrom(view.presets[0], true) : { kind: "CUSTOM", name: "", locale: "en", title: "", intro: "", rows: [], outro: "", layout: { font: "default", introFont: "default", outroFont: "default", signerLeft: "NONE", signerRight: "NONE", showSeal: false, showLogo: true, showAddress: true, useBrandColour: true, signatureLeft: "", signatureRight: "", footerNote: null, paper: "A4" }, serialPrefix: "CERT", active: true }));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  /** A preset replaces every text at once; the fields are made anew so none keeps what it was showing. */
  const [generation, setGeneration] = useState(0);
  /** The row being dragged, the rows as they stand now, and where each is drawn: what a drag is worked out from. */
  const [dragging, setDragging] = useState<string | null>(null);
  const [moved, setMoved] = useState("");
  const rowEls = useRef(new Map<string, HTMLLIElement>());
  const rowsNow = useRef<RowDraft[]>([]);
  const fields = useRef(new Map<string, TokenFieldHandle>());
  const hold = (id: string) => (handle: TokenFieldHandle | null) => {
    if (handle) fields.current.set(id, handle);
    else fields.current.delete(id);
  };

  const byKey = new Map(palette.map((p) => [p.key, p]));
  const labelOf = (key: string) => byKey.get(key)?.labels[reader] ?? null;
  const unknownIn = (text: string) => [...text.matchAll(TOKEN)].map((m) => m[1]!).filter((key) => !byKey.has(key));
  const unknown = [...new Set([draft.title, draft.intro, draft.outro, ...draft.rows.map((r) => r.value)].flatMap(unknownIn))];

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const patchLayout = (p: Partial<CertificateLayout>) => setDraft((d) => ({ ...d, layout: { ...d.layout, ...p } }));
  const patchRow = (key: string, p: Partial<RowDraft>) => setDraft((d) => ({ ...d, rows: d.rows.map((r) => (r.key === key ? { ...r, ...p } : r)) }));
  const removeRow = (key: string) => setDraft((d) => ({ ...d, rows: d.rows.filter((r) => r.key !== key) }));
  const moveRow = (key: string, delta: -1 | 1) =>
    setDraft((d) => {
      const index = d.rows.findIndex((r) => r.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= d.rows.length) return d;
      const rows = [...d.rows];
      const [row] = rows.splice(index, 1);
      rows.splice(target, 0, row!);
      return { ...d, rows };
    });
  /** The row under the pointer takes the dragged row's place as soon as the pointer is past its middle. */
  const dragTo = (key: string, y: number) => {
    const rows = rowsNow.current;
    const from = rows.findIndex((r) => r.key === key);
    if (from < 0) return;
    let target = from;
    rows.forEach((row, index) => {
      const box = rowEls.current.get(row.key)?.getBoundingClientRect();
      if (!box || index === from) return;
      const middle = box.top + box.height / 2;
      if (index < from && y < middle) target = Math.min(target, index);
      if (index > from && y > middle) target = Math.max(target, index);
    });
    if (target === from) return;
    setDraft((d) => {
      const next = [...d.rows];
      const at = next.findIndex((r) => r.key === key);
      if (at < 0) return d;
      const [row] = next.splice(at, 1);
      next.splice(Math.min(target, next.length), 0, row!);
      return { ...d, rows: next };
    });
  };
  const say = (key: string, delta = 0) => {
    const rows = rowsNow.current;
    const index = rows.findIndex((r) => r.key === key);
    if (index < 0) return;
    const position = Math.min(Math.max(index + delta, 0), rows.length - 1) + 1;
    setMoved(t("certificates.rowMoved", { name: rows[index]!.label || String(index + 1), position, count: rows.length }));
  };

  useEffect(() => {
    rowsNow.current = draft.rows;
  }, [draft.rows]);
  /**
   * The drag is followed on the WINDOW and not on the handle. A row that
   * changes place is moved in the page, the handle with it, and a handle
   * that has been moved lets go of the pointer it had captured: the finger
   * lifted over another row's handle and the drag never ended.
   */
  useEffect(() => {
    if (!dragging) return;
    const move = (event: PointerEvent) => dragTo(dragging, event.clientY);
    const end = () => {
      setDragging(null);
      say(dragging);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
    // dragTo and say read the rows through a ref; the listeners are made once for a drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  /** A row for one detail: labelled in the language the document is written in, which need not be the reader's. */
  const addRowFor = (entry: PaletteEntry) => setDraft((d) => ({ ...d, rows: [...d.rows, { key: nextKey(), label: entry.labels[d.locale], value: `[[${entry.key}]]` }] }));
  const addBlankRow = () => setDraft((d) => ({ ...d, rows: [...d.rows, { key: nextKey(), label: "", value: "" }] }));
  /** Another detail for a row that has one: the value is replaced, and the label with it if it was the old detail's own. */
  const setRowDetail = (row: RowDraft, entry: PaletteEntry) => {
    const was = [...row.value.matchAll(TOKEN)].map((m) => byKey.get(m[1]!)).find(Boolean);
    const ownLabel = !row.label.trim() || (was !== undefined && LOCALES.some((l) => was.labels[l] === row.label.trim()));
    patchRow(row.key, { value: `[[${entry.key}]]`, ...(ownLabel ? { label: entry.labels[draft.locale] } : {}) });
    setGeneration((g) => g + 1);
  };

  function choosePreset(key: string) {
    setPreset(key);
    const found = view.presets.find((p) => p.key === key);
    if (!found) return;
    // The name and the active flag are the office's own; the preset brings the words.
    setDraft((d) => ({ ...draftFrom(found, d.active), name: template ? d.name : found.name }));
    setGeneration((g) => g + 1);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    const needed = t("common.checkTheForm");
    if (!draft.name.trim()) errors.name = needed;
    if (!draft.title.trim()) errors.title = needed;
    if (!/^[A-Za-z0-9-]{1,12}$/.test(draft.serialPrefix.trim())) errors.serialPrefix = t("certificates.serialHint");
    const rows = draft.rows.filter((r) => r.label.trim() || r.value.trim());
    for (const r of rows) if (!r.label.trim()) errors[`row-${r.key}`] = needed;
    setFieldErrors(errors);
    if (unknown.length > 0) {
      setError(t("certificates.unknownDetails", { list: unknown.map((k) => `[[${k}]]`).join(", ") }));
      return;
    }
    if (Object.keys(errors).length > 0) {
      setError(needed);
      return;
    }
    const input: CertificateTemplateSave = {
      kind: draft.kind,
      name: draft.name.trim().slice(0, 80),
      locale: draft.locale,
      title: draft.title.trim().slice(0, 120),
      intro: draft.intro.trim().slice(0, 2000),
      rows: rows.slice(0, 40).map((r) => ({ label: r.label.trim().slice(0, 80), value: r.value.trim().slice(0, 200) })),
      outro: draft.outro.trim().slice(0, 2000),
      layout: {
        ...draft.layout,
        signatureLeft: draft.layout.signatureLeft.trim().slice(0, 40),
        signatureRight: draft.layout.signatureRight.trim().slice(0, 40),
        footerNote: draft.layout.footerNote?.trim().slice(0, 240) || null,
      },
      serialPrefix: draft.serialPrefix.trim().toUpperCase(),
      active: draft.active,
    };
    startTransition(async () => {
      const result = await saveTemplateAction(input, template?.id);
      if (!result.ok) {
        if (result.errorKey === "certificates.nameTaken") {
          setFieldErrors({ name: t("certificates.nameTaken") });
          setError(t("certificates.nameTaken"));
          return;
        }
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("certificates.saved") });
      if (template) router.refresh();
      else router.push("/admin/certificates");
    });
  }

  const iconButton = "grid size-11 shrink-0 place-items-center rounded-[--radius-md] text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40";
  const layoutLabel: Record<(typeof LAYOUT_TOGGLES)[number], string> = {
    showLogo: t("certificates.showLogo"),
    showAddress: t("certificates.showAddress"),
    useBrandColour: t("certificates.useBrandColour"),
  };
  /**
   * One of the two paragraphs, with its own face and the button that inserts a detail at its own caret.
   * The face decides what is typed into it, over the header's switch: a Devanagari face is typed in
   * Devanagari and a Latin face in English; "same as the paper" follows the template's language.
   */
  const paragraph = (id: "intro" | "outro", label: string) => {
    const key = id === "intro" ? "introFont" : "outroFont";
    const face = paragraphFont(draft.layout[key], draft.layout.font);
    const typing = typingFor(face, draft.locale);
    return (
      <div className="space-y-2">
        <TokenField key={`${id}-${generation}-${reader}`} ref={hold(id)} label={label} multiline value={draft[id]} onChange={(next) => patch({ [id]: next } as Partial<Draft>)} labelOf={labelOf} disabled={readOnly} typing={typing} style={{ fontFamily: fontStack(face, draft.locale) }} hint={t("typing.byFace", { language: t(`typing.${typing}`) })} data-testid={`template-${id}`} />
        <div className="flex flex-wrap items-end gap-3">
          <FontSelect label={t("fonts.forParagraph")} defaultLabel={t("fonts.sameAsPaper")} hint={null} value={draft.layout[key]} locale={draft.locale} onChange={(font) => patchLayout({ [key]: font })} className="w-full max-w-xs" testId={`template-${id}-font`} />
          {!readOnly && <DetailPicker palette={palette} label={t("certificates.insertDetail")} onPick={(entry) => fields.current.get(id)?.insert(entry.key)} testId={`insert-${id}`} />}
        </div>
      </div>
    );
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <form onSubmit={submit} noValidate className="min-w-0 space-y-6" data-testid="certificate-template-editor">
        {readOnly && (
          <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted" data-testid="office-sets-this">
            {t("common.officeSetsThis")}
          </p>
        )}
        <fieldset disabled={readOnly} className="min-w-0 space-y-6">
          {/* ---- what this template is ---- */}
          <Card>
            <CardHeader title={t("certificates.templatesTitle")} description={t("certificates.templatesIntro")} />
            <CardBody className="space-y-4">
              <SelectField label={t("certificates.fromPreset")} value={preset} onChange={(e) => choosePreset(e.target.value)} className="max-w-sm" data-testid="template-preset">
                {template && <option value="">—</option>}
                {LOCALES.map((locale) => (
                  <optgroup key={locale} label={localeName(locale)}>
                    {view.presets
                      .filter((p) => p.locale === locale)
                      .map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </SelectField>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label={t("certificates.name")} value={draft.name} maxLength={80} required autoComplete="off" error={fieldErrors.name} onChange={(e) => patch({ name: e.target.value })} data-testid="template-name" />
                <SelectField label={t("certificates.kind")} value={draft.kind} onChange={(e) => patch({ kind: e.target.value as CertificateKind })}>
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(CERTIFICATE_KIND_KEY[k])}
                    </option>
                  ))}
                </SelectField>
                <SelectField label={t("certificates.language")} value={draft.locale} onChange={(e) => patch({ locale: e.target.value as Draft["locale"] })} data-testid="template-language">
                  {LOCALES.map((l) => (
                    <option key={l} value={l}>
                      {localeName(l)}
                    </option>
                  ))}
                </SelectField>
                <FontSelect value={draft.layout.font} locale={draft.locale} onChange={(font) => patchLayout({ font })} testId="template-font" />
                <TextField label={t("certificates.serialPrefix")} hint={t("certificates.serialHint")} value={draft.serialPrefix} maxLength={12} autoComplete="off" error={fieldErrors.serialPrefix} onChange={(e) => patch({ serialPrefix: e.target.value })} />
              </div>
              <CheckboxField label={t("certificates.active")} checked={draft.active} onChange={(e) => patch({ active: e.target.checked })} />
            </CardBody>
          </Card>

          {/* ---- the words ---- */}
          <Card>
            <CardHeader title={t("certificates.heading")} description={t("certificates.detailsHint")} />
            <CardBody className="space-y-5">
              <TextField label={t("certificates.heading")} value={draft.title} maxLength={120} required autoComplete="off" error={fieldErrors.title} onChange={(e) => patch({ title: e.target.value })} data-testid="template-title" />
              {paragraph("intro", t("certificates.introText"))}

              <fieldset className="space-y-2" data-testid="template-rows">
                <legend className="text-sm font-medium text-fg">{t("certificates.rows")}</legend>
                {draft.rows.length === 0 && <p className="rounded-[--radius-md] border border-dashed border-border px-3 py-4 text-center text-sm text-fg-muted">{t("certificates.noRowsYet")}</p>}
                {/* The two columns are named once, above the rows; each row's own labels are a screen reader's. */}
                {draft.rows.length > 0 && (
                  <div className="hidden grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.3fr)] gap-2 px-3 text-xs font-medium text-fg-muted sm:grid" aria-hidden="true">
                    <span />
                    <span>{t("certificates.rowLabel")}</span>
                    <span>{t("certificates.rowValue")}</span>
                  </div>
                )}
                <ol className="space-y-2">
                  {draft.rows.map((row, index) => {
                    const rowName = row.label || String(index + 1);
                    return (
                      <li
                        key={row.key}
                        ref={(el) => {
                          if (el) rowEls.current.set(row.key, el);
                          else rowEls.current.delete(row.key);
                        }}
                        className={`rounded-[--radius-md] border px-3 pb-1 pt-3 ${dragging === row.key ? "border-accent bg-accent-soft shadow-md" : "border-border"}`}
                        data-testid="template-row"
                        data-dragging={dragging === row.key || undefined}
                      >
                        <div className="grid items-start gap-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_minmax(0,1.3fr)]">
                          <span className="pt-3 text-sm tabular-nums text-fg-muted" aria-hidden="true">
                            {index + 1}.
                          </span>
                          <TextField label={t("certificates.rowLabel")} value={row.label} maxLength={80} autoComplete="off" error={fieldErrors[`row-${row.key}`]} onChange={(e) => patchRow(row.key, { label: e.target.value })} className="sm:[&>label]:sr-only" data-testid="row-label" />
                          <TokenField key={`${row.key}-${generation}-${reader}`} label={t("certificates.rowValue")} value={row.value} onChange={(next) => patchRow(row.key, { value: next })} labelOf={labelOf} disabled={readOnly} className="sm:[&>span:first-child]:sr-only" data-testid="row-value" />
                        </div>
                        {!readOnly && (
                          <div className="mt-1 flex flex-wrap items-start justify-end gap-1">
                            <div className="mr-auto min-w-0 flex-1 sm:pl-8">
                              <DetailPicker palette={palette} variant="icon" label={[t("certificates.changeDetail"), rowName].join(": ")} onPick={(entry) => setRowDetail(row, entry)} />
                            </div>
                            <button
                              type="button"
                              className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
                              aria-label={[t("certificates.dragRow"), rowName].join(": ")}
                              title={t("certificates.dragRow")}
                              data-testid="row-handle"
                              onPointerDown={(event) => {
                                if (event.button !== 0) return;
                                event.preventDefault();
                                setDragging(row.key);
                              }}
                              onKeyDown={(event) => {
                                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                                event.preventDefault();
                                const delta = event.key === "ArrowUp" ? -1 : 1;
                                say(row.key, delta);
                                moveRow(row.key, delta);
                              }}
                            >
                              <DotsSixVerticalIcon weight="bold" className="size-4" aria-hidden="true" />
                            </button>
                            <button type="button" className={iconButton} onClick={() => moveRow(row.key, -1)} disabled={index === 0} aria-label={[t("syllabus.moveUp"), rowName].join(": ")} title={t("syllabus.moveUp")}>
                              <ArrowUpIcon weight="bold" className="size-4" aria-hidden="true" />
                            </button>
                            <button type="button" className={iconButton} onClick={() => moveRow(row.key, 1)} disabled={index === draft.rows.length - 1} aria-label={[t("syllabus.moveDown"), rowName].join(": ")} title={t("syllabus.moveDown")}>
                              <ArrowDownIcon weight="bold" className="size-4" aria-hidden="true" />
                            </button>
                            <button type="button" className={`${iconButton} hover:text-danger`} onClick={() => removeRow(row.key)} aria-label={[t("certificates.removeRow"), rowName].join(": ")} title={t("certificates.removeRow")}>
                              <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <p className="sr-only" role="status" aria-live="polite" data-testid="row-moved">
                  {moved}
                </p>
                {!readOnly && <DetailPicker palette={palette} variant="add" label={t("certificates.addRow")} intro={t("certificates.pickIntro")} onPick={addRowFor} onBlank={addBlankRow} disabled={draft.rows.length >= 40} testId="add-row" />}
              </fieldset>

              {paragraph("outro", t("certificates.outroText"))}
            </CardBody>
          </Card>

          {/* ---- the printed layout ---- */}
          <Card>
            <CardHeader title={t("certificates.layoutTitle")} />
            <CardBody className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {LAYOUT_TOGGLES.map((key) => (
                  <CheckboxField key={key} label={layoutLabel[key]} checked={draft.layout[key]} onChange={(e) => patchLayout({ [key]: e.target.checked })} />
                ))}
              </div>
              {/* Who signs each line, and whether the seal is printed. The words under the lines are below. */}
              <div className="grid gap-3 sm:grid-cols-2">
                {(["signerLeft", "signerRight"] as const).map((side) => (
                  <SelectField key={side} label={t(side === "signerLeft" ? "signatures.signerLeft" : "signatures.signerRight")} value={draft.layout[side]} onChange={(e) => patchLayout({ [side]: e.target.value as PaperSigner })} data-testid={`template-${side}`}>
                    <option value="NONE">{t("signatures.signerNone")}</option>
                    <option value="ADMIN">{t("signatures.signerAdmin")}</option>
                    <option value="PRINCIPAL">{t("signatures.signerPrincipal")}</option>
                  </SelectField>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-fg-muted">{t("signatures.signerHint")}</p>
              <CheckboxField label={t("signatures.showSeal")} checked={draft.layout.showSeal} onChange={(e) => patchLayout({ showSeal: e.target.checked })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label={t("certificates.signatureLeft")} value={draft.layout.signatureLeft} maxLength={40} autoComplete="off" onChange={(e) => patchLayout({ signatureLeft: e.target.value })} />
                <TextField label={t("certificates.signatureRight")} value={draft.layout.signatureRight} maxLength={40} autoComplete="off" onChange={(e) => patchLayout({ signatureRight: e.target.value })} />
              </div>
              <TextField label={t("certificates.footerNote")} value={draft.layout.footerNote ?? ""} maxLength={240} autoComplete="off" onChange={(e) => patchLayout({ footerNote: e.target.value })} />
              <SelectField label={t("certificates.paper")} value={draft.layout.paper} onChange={(e) => patchLayout({ paper: e.target.value === "LETTER" ? "LETTER" : "A4" })} className="max-w-xs">
                <option value="A4">{t("reportCardConfig.paperA4")}</option>
                <option value="LETTER">{t("reportCardConfig.paperLetter")}</option>
              </SelectField>
            </CardBody>
          </Card>

          {unknown.length > 0 && !error && (
            <p className="rounded-[--radius-md] border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-fg" data-testid="unknown-details">
              {t("certificates.unknownDetails", { list: unknown.map((k) => `[[${k}]]`).join(", ") })}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="template-save">
                {t("certificates.save")}
              </Button>
            </div>
          )}
        </fieldset>
      </form>

      <aside className="min-w-0 lg:sticky lg:top-20">
        <TemplatePreview palette={palette} locale={draft.locale} title={draft.title} intro={draft.intro} rows={draft.rows} outro={draft.outro} layout={draft.layout} />
      </aside>
    </div>
  );
}
