"use client";

import { buildXlsx, isXlsxFile, parseXlsx, rowsToCsv, XLSX_MIME, type Sheet } from "./xlsx";

/**
 * The browser side of Excel: a form that takes a pasted CSV takes a workbook
 * too, read here and handed to the same parser as the CSV the office would
 * otherwise have had to export first; and a template or a marks sheet is
 * built here and saved without a round trip.
 */

/** What the file pickers accept: a CSV as before, or a workbook. */
export const SPREADSHEET_ACCEPT = `.csv,.xlsx,text/csv,text/plain,${XLSX_MIME}`;

/** The file as CSV text — a workbook's first sheet, or the text as it is. Null when a workbook cannot be read. */
export async function readSpreadsheet(file: File): Promise<string | null> {
  if (!isXlsxFile(file)) return file.text();
  try {
    const [first] = await parseXlsx(new Uint8Array(await file.arrayBuffer()));
    return first ? rowsToCsv(first.rows) : "";
  } catch {
    return null;
  }
}

/** Every sheet of a workbook as rows of text, or null when the file is not one. */
export async function readWorkbook(file: File): Promise<string[][] | null> {
  try {
    if (isXlsxFile(file)) {
      const [first] = await parseXlsx(new Uint8Array(await file.arrayBuffer()));
      return first?.rows ?? [];
    }
    const { parseCsvRecords } = await import("./csv");
    return parseCsvRecords(await file.text()).records;
  } catch {
    return null;
  }
}

/** Builds the workbook and hands it to the browser as a download. */
export async function saveXlsx(filename: string, sheets: Sheet[]): Promise<void> {
  const bytes = await buildXlsx(sheets);
  const url = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: XLSX_MIME }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
