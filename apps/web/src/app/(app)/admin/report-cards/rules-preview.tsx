"use client";

import type { ReportCardLayout } from "@edulink/contracts";
import { useT } from "@/lib/i18n";
import { fontStack } from "@/lib/fonts";
import type { LiveBand } from "./scale-bar";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * A sample report card, drawn by the rules as they stand in the form. The
 * marks are made up and spread across the scale on purpose, one near the
 * top, one near the bottom and the rest between, so that changing a band's
 * starting mark changes a grade the office can see change. Every switch of
 * the layout shows or hides what it shows or hides on a real card.
 *
 * It is a picture of the rules and not the card's own page: the real card
 * has the pupil's papers, the register and the class teacher's words.
 */
const SAMPLE = [
  { key: "reportCardConfig.sampleEnglish", percent: 91 },
  { key: "reportCardConfig.sampleMaths", percent: 78 },
  { key: "reportCardConfig.sampleScience", percent: 64 },
  { key: "reportCardConfig.sampleSocial", percent: 47 },
  { key: "reportCardConfig.sampleSecond", percent: 29 },
] as const;

/** A percent falls into the first band, highest first, whose minimum it reaches. */
function bandOf(percent: number, bands: LiveBand[]): LiveBand | null {
  return [...bands].filter((b) => b.minPercent !== null).sort((a, b) => (b.minPercent ?? 0) - (a.minPercent ?? 0)).find((b) => percent >= (b.minPercent ?? 0)) ?? null;
}

export function RulesPreview({ schoolName, locale, bands, areas, coScale, layout }: { schoolName: string; locale: string; bands: LiveBand[]; areas: string[]; coScale: string[]; layout: ReportCardLayout }) {
  const t = useT();
  const rows = SAMPLE.map((s) => ({ subject: t(s.key), percent: s.percent, band: bandOf(s.percent, bands) }));
  const overall = Math.round((rows.reduce((sum, r) => sum + r.percent, 0) / rows.length) * 10) / 10;
  const pointed = rows.map((r) => r.band?.points).filter((p): p is number => typeof p === "number");
  // As on a real card: no mean while a subject with a mark has no points to give it.
  const meanPoints = pointed.length === rows.length ? Math.round((pointed.reduce((a, b) => a + b, 0) / pointed.length) * 10) / 10 : null;
  const letters = bands.length > 0;
  const points = layout.showGradePoints && bands.some((b) => b.points !== null);
  const muted = "text-fg-muted";

  return (
    <section aria-label={t("reportCardConfig.previewTitle")} className="space-y-2" data-testid="rules-preview">
      <div>
        <h3 className="text-sm font-semibold text-fg">{t("reportCardConfig.previewTitle")}</h3>
        <p className="text-xs leading-relaxed text-fg-muted">{t("reportCardConfig.previewHint")}</p>
      </div>
      <div style={{ fontFamily: fontStack(layout.font, locale) }} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-fg shadow-sm" data-testid="preview-paper">
        <header className="border-b border-border pb-3">
          <p className={`text-base font-bold tracking-tight ${layout.useBrandColour ? "text-accent-strong" : "text-fg"}`} data-testid="preview-school">
            {schoolName}
          </p>
          {layout.headerNote?.trim() && (
            <p className={`text-[0.6875rem] ${muted}`} data-testid="preview-header-note">
              {layout.headerNote}
            </p>
          )}
          {layout.showAddress && <p className={`text-[0.6875rem] ${muted}`}>{t("certificateSample.address")}</p>}
        </header>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">{t("certificateSample.name")}</p>
          <p className={`text-xs ${muted}`}>{[t("certificateSample.className"), t("reportCardConfig.sampleTerm")].join(" · ")}</p>
        </div>

        <TableScroll className="mt-3">
          <table className="w-full text-xs" data-testid="preview-subjects">
            <thead>
              <tr className={`border-b border-border text-left ${muted}`}>
                <th scope="col" className="py-1.5 pr-2 font-medium">{t("reportView.subject")}</th>
                <th scope="col" className="py-1.5 pr-2 text-right font-medium">{t("reportView.percent")}</th>
                {letters && <th scope="col" className="py-1.5 pr-2 font-medium">{t("reportView.grade")}</th>}
                {points && <th scope="col" className="py-1.5 text-right font-medium">{t("reportView.points")}</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.subject} className="border-b border-border/60" data-testid="preview-subject">
                  <th scope="row" className="py-1.5 pr-2 text-left font-medium">{row.subject}</th>
                  <td className="py-1.5 pr-2 text-right tabular-nums">{row.percent}</td>
                  {letters && (
                    <td className="py-1.5 pr-2" data-testid="preview-grade">
                      <span className="font-semibold">{row.band?.label ?? "—"}</span>
                      {row.band?.descriptor && <span className={`ml-1.5 ${muted}`}>{row.band.descriptor}</span>}
                    </td>
                  )}
                  {points && <td className="py-1.5 text-right tabular-nums">{row.band?.points ?? "—"}</td>}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <th scope="row" className="py-1.5 pr-2 text-left">{t("reportView.overall")}</th>
                <td className="py-1.5 pr-2 text-right tabular-nums">{overall}</td>
                {letters && <td className="py-1.5 pr-2">{bandOf(overall, bands)?.label ?? "—"}</td>}
                {points && <td className="py-1.5 text-right tabular-nums" data-testid="preview-mean-points">{meanPoints ?? "—"}</td>}
              </tr>
            </tfoot>
          </table>
        </TableScroll>

        {layout.showCoScholastic && areas.length > 0 && (
          <div className="mt-4" data-testid="preview-co">
            <p className={`text-[0.6875rem] font-semibold uppercase tracking-wide ${muted}`}>{t("reportView.coScholastic")}</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-4 text-xs">
              {areas.map((area, index) => (
                <li key={`${area}-${index}`} className="flex justify-between gap-2 border-b border-border/60 py-1">
                  <span className="min-w-0 truncate">{area}</span>
                  <span className="font-semibold">{coScale.length > 0 ? coScale[index % coScale.length] : "—"}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {layout.showAttendance && (
          <p className="mt-4 text-xs" data-testid="preview-attendance">
            <span className={muted}>{t("reportView.attendance")}: </span>
            {t("reportCardConfig.sampleAttendance")}
          </p>
        )}
        {layout.showRemark && (
          <p className="mt-2 text-xs italic" data-testid="preview-remark">
            {t("reportCardConfig.sampleRemark")}
          </p>
        )}
        {layout.showPractice && (
          <p className={`mt-2 text-[0.6875rem] ${muted}`} data-testid="preview-practice">
            {t("reportCardConfig.samplePractice")}
          </p>
        )}

        {layout.showSignatures && (
          <div className={`mt-6 grid grid-cols-3 items-end gap-4 text-center text-[0.6875rem] ${muted}`} data-testid="preview-signatures">
            {/* Where a signature and the seal will be drawn, as a word in a box: the pictures are the signers' own. */}
            {([["signerLeft", layout.signatureLeft], ["parent", t("reportView.signatureParent")], ["signerRight", layout.signatureRight]] as const).map(([slot, who]) => (
              <div key={slot}>
                <div className="grid h-9 place-items-center">
                  {slot === "parent"
                    ? layout.showSeal && <span className="grid size-9 place-items-center rounded-full border border-dashed border-border-strong text-[0.5625rem] italic">{t("signatures.sampleSeal")}</span>
                    : layout[slot] !== "NONE" && <span className="rounded-[var(--radius-sm)] border border-dashed border-border-strong px-2 py-0.5 italic">{t("signatures.sampleSignature")}</span>}
                </div>
                <div className="min-h-6 border-t border-border pt-1.5">{who}</div>
              </div>
            ))}
          </div>
        )}
        {layout.footerNote?.trim() && <p className={`mt-5 border-t border-border pt-3 text-[0.6875rem] ${muted}`}>{layout.footerNote}</p>}
      </div>
    </section>
  );
}
