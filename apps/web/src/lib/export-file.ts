import { parseCsvRecords } from "./csv";
import { buildXlsx, XLSX_MIME, type Cell } from "./xlsx";

/**
 * A download in the format the link asked for. Every export is built as CSV
 * by its library (the phone's share sheet takes the text as it is); a web
 * link with ?format=xlsx gets the same rows as a workbook the office opens
 * without an import dialog and without Excel guessing that a date of birth
 * is a sum. Cells that read as plain numbers become numbers (a mark, a fee);
 * anything with a leading zero or a sign of text (a pupil code, a phone
 * number) stays text so nothing is silently rewritten.
 */
export type ExportFile = { filename: string; csv: string };

export function wantsXlsx(request: Request): boolean {
  return new URL(request.url).searchParams.get("format") === "xlsx";
}

function cellOf(raw: string): Cell {
  if (raw === "") return null;
  if (/^-?(0|[1-9]\d{0,14})(\.\d+)?$/.test(raw) && String(Number(raw)) === raw.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")) return Number(raw);
  return raw;
}

/** The workbook bytes of a CSV export: one sheet, the CSV's header row bold. */
export async function csvToXlsx(csv: string, sheetName: string): Promise<Uint8Array> {
  const { records } = parseCsvRecords(csv);
  const [headers = [], ...rows] = records;
  return buildXlsx([{ name: sheetName, headers, rows: rows.map((r) => r.map(cellOf)) }]);
}

const PRIVATE = { "Cache-Control": "no-store, private" };

/** The file as the browser should save it: CSV unless the link said xlsx. */
export async function exportResponse(request: Request, file: ExportFile): Promise<Response> {
  if (!wantsXlsx(request)) {
    return new Response(file.csv, {
      headers: { ...PRIVATE, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${file.filename}"` },
    });
  }
  const filename = file.filename.replace(/\.csv$/i, "") + ".xlsx";
  const sheet = filename.replace(/\.xlsx$/, "").replace(/^edulink-/, "").slice(0, 31);
  const bytes = await csvToXlsx(file.csv, sheet);
  return new Response(bytes as unknown as BodyInit, {
    headers: { ...PRIVATE, "Content-Type": XLSX_MIME, "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
