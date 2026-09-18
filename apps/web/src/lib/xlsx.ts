/**
 * Excel files, read and written, with nothing installed.
 *
 * A school's roll, its marks and its fee sheets live in Excel, and the
 * office will keep its old software for as long as this one only takes
 * pasted CSV. An .xlsx is a zip of XML, and both halves are small: deflate
 * comes with the platform (CompressionStream / DecompressionStream, in
 * every browser and in Node 20), the zip container is a few fixed headers
 * and a CRC, and a worksheet is cells in rows. Written here rather than
 * installed on the same grounds as s3.ts and sms.ts — the popular library is
 * unmaintained on npm with an open advisory, and the maintained one is forty
 * packages for two verbs — and CLIENT-SAFE on purpose, so a form can read a
 * workbook in the browser and hand the same CSV to the parser it already has.
 *
 * What is read: every sheet's cells as text — shared strings, inline strings,
 * numbers, booleans, and dates (a number whose cell style is a date format
 * becomes YYYY-MM-DD). Formulas give their cached value. Merged cells,
 * styles beyond dates and anything else are ignored. What is written: one
 * or more sheets with a bold header row and text or number cells, which
 * Excel, Numbers, LibreOffice and Google Sheets all open.
 */

/* -------------------------------------------------------------------------- */
/* deflate                                                                     */
/* -------------------------------------------------------------------------- */

async function pump(input: Uint8Array, stream: { readable: ReadableStream<Uint8Array>; writable: WritableStream<BufferSource> }): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(input as unknown as ArrayBufferView<ArrayBuffer>).then(() => writer.close());
  const chunks: Uint8Array[] = [];
  const reader = stream.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

const deflateRaw = (data: Uint8Array) => pump(data, new CompressionStream("deflate-raw"));
const inflateRaw = (data: Uint8Array) => pump(data, new DecompressionStream("deflate-raw"));

/* -------------------------------------------------------------------------- */
/* CRC-32 and the zip container                                                */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function le16(v: number): number[] {
  return [v & 0xff, (v >>> 8) & 0xff];
}
function le32(v: number): number[] {
  return [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
}

/** DOS date and time for the entries: the moment of writing, to the two seconds zip allows. */
function dosDateTime(d = new Date()): { date: number; time: number } {
  const year = Math.max(1980, d.getFullYear());
  return { date: ((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1) };
}

type ZipEntry = { name: string; data: Uint8Array };

/** A zip with every entry deflated — what an .xlsx is. */
export async function zip(entries: ZipEntry[]): Promise<Uint8Array> {
  const parts: number[][] = [];
  const central: number[][] = [];
  let offset = 0;
  const { date, time } = dosDateTime();
  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const packed = await deflateRaw(entry.data);
    const local = [
      ...le32(0x04034b50), ...le16(20), ...le16(0x0800), ...le16(8), ...le16(time), ...le16(date),
      ...le32(crc), ...le32(packed.length), ...le32(entry.data.length), ...le16(name.length), ...le16(0),
    ];
    parts.push(local, [...name], [...packed]);
    central.push([
      ...le32(0x02014b50), ...le16(20), ...le16(20), ...le16(0x0800), ...le16(8), ...le16(time), ...le16(date),
      ...le32(crc), ...le32(packed.length), ...le32(entry.data.length), ...le16(name.length), ...le16(0), ...le16(0),
      ...le16(0), ...le16(0), ...le32(0), ...le32(offset), ...name,
    ]);
    offset += local.length + name.length + packed.length;
  }
  const centralStart = offset;
  const centralBytes = central.flat();
  const end = [...le32(0x06054b50), ...le16(0), ...le16(0), ...le16(entries.length), ...le16(entries.length), ...le32(centralBytes.length), ...le32(centralStart), ...le16(0)];
  const all = parts.flat().concat(centralBytes, end);
  return Uint8Array.from(all);
}

function u16(b: Uint8Array, at: number): number {
  return b[at]! | (b[at + 1]! << 8);
}
function u32(b: Uint8Array, at: number): number {
  return (b[at]! | (b[at + 1]! << 8) | (b[at + 2]! << 16) | (b[at + 3]! << 24)) >>> 0;
}

/** The entries of a zip by name, from its central directory. Stored and deflated entries only, which is every .xlsx. */
export async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (u32(bytes, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file");
  const count = u16(bytes, eocd + 10);
  let at = u32(bytes, eocd + 16);
  const out = new Map<string, Uint8Array>();
  for (let n = 0; n < count; n++) {
    if (u32(bytes, at) !== 0x02014b50) throw new Error("zip central directory is damaged");
    const method = u16(bytes, at + 10);
    const packedSize = u32(bytes, at + 20);
    const nameLength = u16(bytes, at + 28);
    const extraLength = u16(bytes, at + 30);
    const commentLength = u16(bytes, at + 32);
    const localOffset = u32(bytes, at + 42);
    const name = decoder.decode(bytes.subarray(at + 46, at + 46 + nameLength));
    at += 46 + nameLength + extraLength + commentLength;
    if (u32(bytes, localOffset) !== 0x04034b50) throw new Error("zip local header is damaged");
    const dataStart = localOffset + 30 + u16(bytes, localOffset + 26) + u16(bytes, localOffset + 28);
    const packed = bytes.subarray(dataStart, dataStart + packedSize);
    if (method === 0) out.set(name, packed);
    else if (method === 8) out.set(name, await inflateRaw(packed));
    else throw new Error(`zip entry "${name}" uses compression ${method}, which is not supported`);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Writing a workbook                                                          */
/* -------------------------------------------------------------------------- */

export type Cell = string | number | null | undefined;
export type Sheet = { name: string; headers: string[]; rows: Cell[][] };

function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** A1, B1 … Z1, AA1: the column letters Excel addresses cells by. */
export function columnName(index: number): string {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function sheetXml(sheet: Sheet): string {
  const lines: string[] = [];
  const all: Cell[][] = [sheet.headers, ...sheet.rows];
  all.forEach((row, r) => {
    const cells = row
      .map((value, c) => {
        if (value === null || value === undefined || value === "") return "";
        const ref = `${columnName(c)}${r + 1}`;
        const style = r === 0 ? ' s="1"' : "";
        if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
        // Text, inline: no shared-strings table to keep in step, and every reader takes it.
        return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(String(value))}</t></is></c>`;
      })
      .join("");
    lines.push(`<row r="${r + 1}">${cells}</row>`);
  });
  const width = Math.max(1, sheet.headers.length);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${width}" width="18" customWidth="1"/></cols><sheetData>${lines.join("")}</sheetData></worksheet>`;
}

/** An .xlsx with the given sheets; the header row bold and frozen. */
export async function buildXlsx(sheets: Sheet[]): Promise<Uint8Array> {
  if (sheets.length === 0) throw new Error("a workbook needs at least one sheet");
  const safeName = (name: string, i: number) => (name.replace(/[\\/*?:[\]]/g, " ").trim().slice(0, 31) || `Sheet${i + 1}`);
  const entries: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`,
      ),
    },
    {
      name: "_rels/.rels",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/workbook.xml",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${xmlEscape(safeName(s.name, i))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`,
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      ),
    },
    {
      name: "xl/styles.xml",
      data: encoder.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      ),
    },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: encoder.encode(sheetXml(s)) })),
  ];
  return zip(entries);
}

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/* -------------------------------------------------------------------------- */
/* Reading a workbook                                                          */
/* -------------------------------------------------------------------------- */

export type ReadSheet = { name: string; rows: string[][] };

const DATE_FORMAT_IDS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? m[1]! : null;
}

function xmlUnescape(value: string): string {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, "&");
}

/** The text of every <t> inside a shared-string or inline-string item, concatenated (rich runs split one string over several). */
function textOf(item: string): string {
  return [...item.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => xmlUnescape(m[1]!)).join("");
}

/** Excel's 1900 date serial to YYYY-MM-DD, with the leap-year-that-never-was accounted for. */
export function serialToDateKey(serial: number): string {
  const days = Math.floor(serial) - (serial >= 61 ? 25569 : 25568);
  const d = new Date(days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Which cell styles (cellXfs indices) are date formats, from styles.xml. */
function dateStyles(stylesXml: string | undefined): Set<number> {
  const out = new Set<number>();
  if (!stylesXml) return out;
  const custom = new Set<number>();
  for (const m of stylesXml.matchAll(/<numFmt\s[^>]*>/g)) {
    const id = Number(attr(m[0], "numFmtId"));
    const code = (attr(m[0], "formatCode") ?? "").replace(/\[[^\]]*\]/g, "").replace(/"[^"]*"/g, "");
    if (/[dmy]/i.test(code) && !/[#0]/.test(code)) custom.add(id);
  }
  const xfs = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1] ?? "";
  [...xfs.matchAll(/<xf\s[^>]*\/?>/g)].forEach((m, i) => {
    const id = Number(attr(m[0], "numFmtId") ?? "0");
    if (DATE_FORMAT_IDS.has(id) || custom.has(id)) out.add(i);
  });
  return out;
}

function columnIndex(ref: string): number {
  const letters = /^[A-Z]+/.exec(ref)?.[0] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * Every sheet of an .xlsx as rows of text, trailing empty cells trimmed.
 * Numbers keep the digits Excel stored (a mark of 42 is "42", a fee of
 * 1250.5 is "1250.5"); dates by style become YYYY-MM-DD.
 */
export async function parseXlsx(bytes: Uint8Array): Promise<ReadSheet[]> {
  const files = await unzip(bytes);
  const read = (name: string) => {
    const data = files.get(name);
    return data ? decoder.decode(data) : undefined;
  };
  const workbook = read("xl/workbook.xml");
  if (!workbook) throw new Error("not an Excel workbook");
  const rels = new Map<string, string>();
  for (const m of (read("xl/_rels/workbook.xml.rels") ?? "").matchAll(/<Relationship\s[^>]*>/g)) {
    const id = attr(m[0], "Id");
    const target = attr(m[0], "Target");
    if (id && target) rels.set(id, target.replace(/^\/?(xl\/)?/, "xl/"));
  }
  const shared: string[] = [];
  const sst = read("xl/sharedStrings.xml");
  if (sst) for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(textOf(m[1]!));
  const dates = dateStyles(read("xl/styles.xml"));

  const sheets: ReadSheet[] = [];
  for (const m of workbook.matchAll(/<sheet\s[^>]*>/g)) {
    const name = xmlUnescape(attr(m[0], "name") ?? "Sheet");
    const rid = attr(m[0], "r:id") ?? attr(m[0], "id");
    const path = (rid && rels.get(rid)) ?? "xl/worksheets/sheet1.xml";
    const xml = read(path);
    if (!xml) continue;
    const rows: string[][] = [];
    for (const rowMatch of xml.matchAll(/<row\s[^>]*>([\s\S]*?)<\/row>/g)) {
      const rowIndex = Number(attr(rowMatch[0], "r") ?? rows.length + 1) - 1;
      const cells: string[] = [];
      for (const cellMatch of rowMatch[1]!.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const head = cellMatch[1]!;
        const body = cellMatch[2] ?? "";
        const ref = attr(`<c ${head}>`, "r") ?? "";
        const type = attr(`<c ${head}>`, "t");
        const style = Number(attr(`<c ${head}>`, "s") ?? "-1");
        const col = ref ? columnIndex(ref) : cells.length;
        let value = "";
        if (type === "s") {
          const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
          value = v !== undefined ? (shared[Number(v)] ?? "") : "";
        } else if (type === "inlineStr") value = textOf(body);
        else if (type === "b") value = /<v>1<\/v>/.test(body) ? "TRUE" : "FALSE";
        else {
          const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
          if (v === undefined) value = "";
          else if (type === "str" || type === "e") value = xmlUnescape(v);
          else if (dates.has(style) && /^-?\d+(\.\d+)?$/.test(v)) value = serialToDateKey(Number(v));
          else value = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/i.test(v) ? String(Number(v)) : xmlUnescape(v);
        }
        while (cells.length < col) cells.push("");
        cells[col] = value;
      }
      while (cells.length && cells[cells.length - 1] === "") cells.pop();
      while (rows.length < rowIndex) rows.push([]);
      rows[rowIndex] = cells;
    }
    while (rows.length && rows[rows.length - 1]!.length === 0) rows.pop();
    sheets.push({ name, rows });
  }
  return sheets;
}

/** The first sheet as CSV text, for the parsers the app already has (intake, invites, bank statements). */
export function rowsToCsv(rows: string[][]): string {
  const quote = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  return rows.map((r) => Array.from({ length: width }, (_, i) => quote(r[i] ?? "")).join(",")).join("\r\n") + "\r\n";
}

export function isXlsxFile(file: { name: string; type?: string }): boolean {
  return /\.xlsx$/i.test(file.name) || file.type === XLSX_MIME;
}
