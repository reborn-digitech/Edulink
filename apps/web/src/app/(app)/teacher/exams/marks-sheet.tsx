"use client";

import { useRef, useState } from "react";
import { DownloadSimpleIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { readWorkbook, saveXlsx, SPREADSHEET_ACCEPT } from "@/lib/spreadsheet-client";

/**
 * The marks grid as a sheet and back. A teacher who keeps marks in Excel
 * downloads the roll with an id column, a name column and an empty marks
 * column, types into the last column, and uploads it: each row is matched by
 * the id, or failing that by the name, and the matching box on the page is
 * filled. Nothing is saved by the upload itself — the boxes are what the
 * teacher checks and the Save button is what records them, exactly as when
 * typed — so a wrong sheet costs nothing.
 */
export function MarksSheet({ pupils, maxMarks, paper }: { pupils: { membershipId: string; name: string; marks: number | null }[]; maxMarks: number; paper: string }) {
  const t = useT();
  const fileRef = useRef<HTMLInputElement>(null);
  const [report, setReport] = useState<string | null>(null);

  function download() {
    void saveXlsx(`marks-${paper.replace(/[^\wऀ-ॿ-]+/g, "_")}.xlsx`, [
      {
        name: paper,
        headers: [t("exams.sheetColId"), t("exams.sheetColStudent"), t("exams.sheetColMarks", { max: maxMarks })],
        rows: pupils.map((p) => [p.membershipId, p.name, p.marks]),
      },
    ]);
  }

  async function fill(file: File) {
    const rows = await readWorkbook(file);
    if (rows === null) {
      setReport(t("invites.fileUnreadable"));
      return;
    }
    const byId = new Map(pupils.map((p) => [p.membershipId, p]));
    const byName = new Map(pupils.map((p) => [p.name.trim().toLowerCase(), p]));
    let filled = 0;
    let over = 0;
    const unmatched: string[] = [];
    let sawAny = false;
    for (const row of rows) {
      const cells = row.map((c) => c.trim());
      const nonEmpty = cells.filter((c) => c !== "");
      if (nonEmpty.length < 2) continue;
      const pupil = cells.map((c) => byId.get(c)).find(Boolean) ?? cells.map((c) => byName.get(c.toLowerCase())).find(Boolean);
      const last = nonEmpty[nonEmpty.length - 1]!;
      const isMarks = /^\d+(\.\d+)?$/.test(last) && !byId.has(last);
      if (!pupil) {
        // The header row and blank pupils are not "unmatched"; a name with marks is.
        if (isMarks) unmatched.push(cells.find((c) => c !== "" && c !== last) ?? last);
        continue;
      }
      if (!isMarks) continue; // a matched pupil with no marks stays as the page has it
      sawAny = true;
      const value = Number(last);
      const box = document.getElementById(`marks-${pupil.membershipId}`) as HTMLInputElement | null;
      if (!box) continue;
      if (value > maxMarks) {
        over += 1;
        box.value = "";
        continue;
      }
      box.value = String(value);
      filled += 1;
    }
    if (!sawAny && unmatched.length === 0) {
      setReport(t("exams.sheetNoRows"));
      return;
    }
    const parts = [t("exams.sheetFilled", { filled, total: pupils.length })];
    if (over) parts.push(t("exams.sheetOver", { count: over, max: maxMarks }));
    if (unmatched.length) parts.push(t("exams.sheetUnmatched", { names: unmatched.slice(0, 10).join(", ") + (unmatched.length > 10 ? "…" : "") }));
    setReport(parts.join(" "));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="ghost" icon={<DownloadSimpleIcon weight="bold" />} onClick={download}>
          {t("exams.sheetDownload")}
        </Button>
        <Button type="button" size="sm" variant="ghost" icon={<UploadSimpleIcon weight="bold" />} onClick={() => fileRef.current?.click()}>
          {t("exams.sheetFill")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={SPREADSHEET_ACCEPT}
          aria-label={t("exams.sheetFill")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void fill(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-fg-muted">{t("exams.sheetHint")}</p>
      {report && (
        <p className="text-xs font-medium text-fg" role="status" data-testid="marks-sheet-report">
          {report}
        </p>
      )}
    </div>
  );
}
