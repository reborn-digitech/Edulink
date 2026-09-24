import { parseCsvRecords } from "./csv";
import { buildXlsx, XLSX_MIME, type Cell } from "./xlsx";

/**
 * A download in the format the link asked for. Every export is built as CSV
 * by its library (the phone's share sheet takes the text as it is); a web
 * link with ?format=xlsx gets the same rows as a workbook the office opens
 * without an import dialog and without Excel guessing that a date of birth
 * is a sum. Cells that read as plain numbers become numbers (a mark, a fee);
 * anything with a leading zero, more than nine digits, or a header that names
 * an identifier (a pupil code, a PEN, a phone number) stays text so nothing
 * is silently rewritten.
 */
export type ExportFile = { filename: string; csv: string };

export function wantsXlsx(request: Request): boolean {
  return new URL(request.url).searchParams.get("format") === "xlsx";
}

/**
 * A column that holds an identifier, by its header: a PEN or UDISE code, a
 * phone number, a PIN code, a student or join code, a serial, an admission or
 * roll number, an id. Digits in such a column are a label, not a quantity —
 * "0042" must not become 42 and an eleven-digit PEN must not become 2.725E+10
 * — so the whole column stays text whatever it looks like.
 */
const TEXT_COLUMN = /(^|[_ -])(pen|udise|phone|mobile|contact|whatsapp|pin|pincode|postal[_ ]?code|code|serial|aadhaar|roll[_ ]?(no|number)|admission[_ ]?(no|number)|id)([_ -]|$)/i;

/** Whether the digits under this header are a label rather than a number. */
export function isTextColumn(header: string): boolean {
  return TEXT_COLUMN.test(header.trim());
}

/**
 * Which cells become numbers: a plain figure of at most nine digits, with no
 * leading zero, under a header that does not name an identifier. Anything
 * longer is an identifier whatever its column — a PEN, a UDISE code, a
 * ten-digit mobile — and stays text so it never prints in scientific notation
 * and a leading zero survives. Marks, amounts and counts are all shorter.
 */
/**
 * The CSV guard (csv.ts) puts a quote before a cell that starts like a
 * formula, so a spreadsheet opening the CSV reads text. The workbook writes
 * inline strings, which no spreadsheet evaluates, so the guard is not needed
 * there and would print as a stray quote: it comes off, and the cell is the
 * text it always was.
 */
function unguard(raw: string): string {
  return /^'[=+\-@\t\r]/.test(raw) ? raw.slice(1) : raw;
}

function cellOf(rawCell: string, header: string): Cell {
  const raw = unguard(rawCell);
  if (raw === "") return null;
  if (isTextColumn(header)) return raw;
  if (/^-?(0|[1-9]\d{0,8})(\.\d+)?$/.test(raw) && String(Number(raw)) === raw.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1")) return Number(raw);
  return raw;
}

/** The workbook bytes of a CSV export: one sheet, the CSV's header row bold. */
export async function csvToXlsx(csv: string, sheetName: string): Promise<Uint8Array> {
  const { records } = parseCsvRecords(csv);
  const [headers = [], ...rows] = records;
  return buildXlsx([{ name: sheetName, headers, rows: rows.map((r) => r.map((cell, i) => cellOf(cell, headers[i] ?? ""))) }]);
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
