"use client";

import type { CertificateLayout } from "@edulink/contracts";
import type { PaletteEntry } from "@/lib/certificates";
import { useT } from "@/lib/i18n";
import { fontStack, paragraphFont } from "@/lib/fonts";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * The certificate as it will print, filled for the sample pupil in the
 * language the document is written in, and redrawn as the office types. It
 * is the same paper the issued certificate's page draws — heading, opening
 * paragraph, numbered rows, closing paragraph, the two signatures and the
 * footer — without the things only an issued one has: a serial of its own,
 * a code to check and the name of who issued it.
 */
const TOKEN = /\[\[\s*([a-z]+\.[A-Za-z]+)\s*\]\]/g;

export function TemplatePreview({ palette, locale, title, intro, rows, outro, layout }: { palette: PaletteEntry[]; locale: "en" | "hi" | "mr"; title: string; intro: string; rows: { key: string; label: string; value: string }[]; outro: string; layout: CertificateLayout }) {
  const t = useT();
  const sample = new Map(palette.map((p) => [p.key, p.samples[locale]]));
  const fill = (text: string) => text.replace(TOKEN, (_whole, key: string) => sample.get(key) ?? "—");
  const shownRows = rows.filter((r) => r.label.trim() || r.value.trim());
  const muted = "text-fg-muted";

  return (
    <section aria-label={t("certificates.preview")} className="space-y-2" data-testid="template-preview">
      <div>
        <h3 className="text-sm font-semibold text-fg">{t("certificates.preview")}</h3>
        <p className="text-xs leading-relaxed text-fg-muted">{t("certificates.previewHint")}</p>
      </div>
      <div lang={locale} style={{ fontFamily: fontStack(layout.font, locale) }} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-fg shadow-sm" data-testid="preview-paper">
        <header className="flex items-start gap-3 border-b border-border pb-3">
          {layout.showLogo && <div aria-hidden="true" className="size-10 shrink-0 rounded-[var(--radius-md)] border border-dashed border-border-strong" />}
          <div className="min-w-0 flex-1">
            <p className={`text-base font-bold tracking-tight ${layout.useBrandColour ? "text-accent-strong" : "text-fg"}`}>{sample.get("school.name")}</p>
            {layout.showAddress && <p className={`text-[0.6875rem] ${muted}`}>{sample.get("school.address")}</p>}
          </div>
          <div className={`text-right text-[0.6875rem] ${muted}`}>
            <p className="font-mono text-xs text-fg">{sample.get("issue.serial")}</p>
            <p>{sample.get("issue.date")}</p>
          </div>
        </header>

        <p className={`mt-5 text-center text-base font-bold uppercase underline decoration-1 underline-offset-8 ${locale === "en" ? "tracking-[0.2em]" : ""}`} data-testid="preview-title">
          {fill(title) || "—"}
        </p>
        {intro.trim() && (
          <p style={{ fontFamily: fontStack(paragraphFont(layout.introFont, layout.font), locale) }} className="mt-4 whitespace-pre-wrap text-xs leading-relaxed" data-testid="preview-intro">
            {fill(intro)}
          </p>
        )}
        {shownRows.length > 0 && (
          <TableScroll className="mt-4">
            <table className="w-full text-xs" data-testid="preview-rows">
              <tbody>
                {shownRows.map((row, index) => (
                  <tr key={row.key} className="border-b border-border/60">
                    <td className={`w-6 py-1.5 pr-1.5 align-top tabular-nums ${muted}`}>{index + 1}.</td>
                    <th scope="row" className={`py-1.5 pr-3 text-left align-top font-medium ${muted}`}>
                      {row.label || "—"}
                    </th>
                    <td className="py-1.5 align-top font-medium">{fill(row.value) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        )}
        {outro.trim() && (
          <p style={{ fontFamily: fontStack(paragraphFont(layout.outroFont, layout.font), locale) }} className="mt-4 whitespace-pre-wrap text-xs leading-relaxed" data-testid="preview-outro">
            {fill(outro)}
          </p>
        )}

        {/* Where a signature and the seal will be drawn, as a word in a box: the pictures are the signers' own. */}
        <div className={`mt-6 grid grid-cols-[1fr_auto_1fr] items-end gap-4 text-center text-[0.6875rem] ${muted}`} data-testid="preview-signatures">
          {([["signerLeft", layout.signatureLeft], ["seal", ""], ["signerRight", layout.signatureRight]] as const).map(([slot, who]) =>
            slot === "seal" ? (
              <div key={slot} className="w-14">
                {layout.showSeal && <div className="grid size-14 place-items-center rounded-full border border-dashed border-border-strong italic">{t("signatures.sampleSeal")}</div>}
              </div>
            ) : (
              <div key={slot}>
                <div className="grid h-8 place-items-center">{layout[slot] !== "NONE" && <span className="rounded-[var(--radius-sm)] border border-dashed border-border-strong px-2 py-0.5 italic">{t("signatures.sampleSignature")}</span>}</div>
                <div className="min-h-6 border-t border-border pt-1.5">{who}</div>
              </div>
            ),
          )}
        </div>
        {layout.footerNote?.trim() && <p className={`mt-5 border-t border-border pt-3 text-[0.6875rem] ${muted}`}>{layout.footerNote}</p>}
      </div>
    </section>
  );
}
