/**
 * CSV parsing and serialisation.
 *
 * Hand-written rather than regex-based because CSV is not a flat format: a
 * quoted field can contain commas, newlines and escaped quotes, and a regex
 * that appears to work will silently mangle exactly the rows a school actually
 * has — "Okafor, Amara" or an address with a line break in it. (§13)
 *
 * Implements RFC 4180 plus the two deviations every real spreadsheet emits:
 * CRLF or LF line endings, and a UTF-8 BOM from Excel.
 */

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
  /** 1-based source line numbers, so errors can point at the user's file. */
  lineNumbers: number[];
};

export function parseCsv(input: string): ParsedCsv {
  // Excel prefixes UTF-8 files with a BOM, which otherwise becomes part of the
  // first header name and makes "name" lookups mysteriously fail.
  const text = input.replace(/^﻿/, "");

  const records: string[][] = [];
  const lineNumbers: number[] = [];

  let field = "";
  let record: string[] = [];
  let inQuotes = false;
  let line = 1;
  let recordStartLine = 1;
  let sawAnyChar = false;

  const endField = () => {
    record.push(field);
    field = "";
  };

  const endRecord = () => {
    endField();
    // Skip blank lines — a trailing newline must not produce a phantom row.
    const isBlank = record.length === 1 && record[0]!.trim() === "";
    if (!isBlank) {
      records.push(record);
      lineNumbers.push(recordStartLine);
    }
    record = [];
    recordStartLine = line;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    sawAnyChar = true;

    if (inQuotes) {
      if (char === '"') {
        // A doubled quote inside a quoted field is a literal quote.
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === "\n") line++;
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === ",") {
      endField();
    } else if (char === "\r") {
      // Consume CRLF as one terminator; a lone CR also ends the record.
      if (text[i + 1] === "\n") i++;
      line++;
      endRecord();
    } else if (char === "\n") {
      line++;
      endRecord();
    } else {
      field += char;
    }
  }

  // Flush whatever the file ended on, unless it ended cleanly on a newline.
  if (sawAnyChar && (field !== "" || record.length > 0)) endRecord();

  const headerRecord = records.shift();
  const headerLine = lineNumbers.shift();
  if (!headerRecord || headerLine === undefined) {
    return { headers: [], rows: [], lineNumbers: [] };
  }

  const headers = headerRecord.map((h) => h.trim().toLowerCase());

  const rows = records.map((values) => {
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });

  return { headers, rows, lineNumbers };
}

/** Quotes a value only when it needs it, the way spreadsheets expect. */
export function toCsvValue(value: unknown): string {
  const text =
    value === null || value === undefined
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Record<string, unknown>[], headers?: string[]): string {
  if (rows.length === 0) return headers ? headers.join(",") + "\r\n" : "";
  const cols = headers ?? Object.keys(rows[0]!);
  const lines = [cols.map(toCsvValue).join(",")];
  for (const row of rows) {
    lines.push(cols.map((col) => toCsvValue(row[col])).join(","));
  }
  // CRLF: Excel is the most common consumer and is happiest with it.
  return lines.join("\r\n") + "\r\n";
}

/* -------------------------------------------------------------------------- */
/* Invite-specific mapping                                                     */
/* -------------------------------------------------------------------------- */

export type InviteRow = {
  line: number;
  name: string;
  email: string;
  subjects: string[];
};

export type InviteCsvResult = {
  valid: InviteRow[];
  /** Rows that could not be used, with a reason the admin can act on. */
  problems: { line: number; value: string; reason: string }[];
  /** Duplicate emails within the file itself, reported once each. */
  duplicates: string[];
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Maps a pasted or uploaded CSV onto invite rows.
 *
 * Bad rows are COLLECTED and reported, never skipped silently — a school
 * pasting 200 staff needs to know which 3 did not go through, and a silent skip
 * is how you discover in September that a teacher was never invited. (§5)
 */
export function parseInviteCsv(input: string): InviteCsvResult {
  const { headers, rows, lineNumbers } = parseCsv(input);

  const valid: InviteRow[] = [];
  const problems: InviteCsvResult["problems"] = [];
  const seen = new Map<string, number>();
  const duplicates: string[] = [];

  // Accept the obvious header spellings; fall back to positional columns for a
  // headerless paste, which is what people actually do.
  const emailKey = headers.find((h) => ["email", "email address", "e-mail"].includes(h));
  const nameKey = headers.find((h) => ["name", "full name", "teacher", "staff name"].includes(h));
  const subjectsKey = headers.find((h) => ["subjects", "subject", "teaches"].includes(h));

  const headerless = !emailKey;

  // With no recognised header, the first record was data, not headers.
  const allRows = headerless
    ? reparseHeaderless(input)
    : rows.map((row, index) => ({ row, line: lineNumbers[index] ?? index + 2 }));

  for (const { row, line } of allRows) {
    const email = (headerless ? row.__1 : row[emailKey!])?.trim().toLowerCase() ?? "";
    const name = (headerless ? row.__0 : nameKey ? row[nameKey] : "")?.trim() ?? "";
    const subjectsRaw = (headerless ? row.__2 : subjectsKey ? row[subjectsKey] : "") ?? "";

    if (!email) {
      problems.push({ line, value: name || "(blank row)", reason: "No email address" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      problems.push({ line, value: email, reason: "Not a valid email address" });
      continue;
    }
    if (email.length > 320) {
      problems.push({ line, value: email.slice(0, 40) + "…", reason: "Email is too long" });
      continue;
    }

    const firstSeen = seen.get(email);
    if (firstSeen !== undefined) {
      if (!duplicates.includes(email)) duplicates.push(email);
      problems.push({ line, value: email, reason: `Already listed on line ${firstSeen}` });
      continue;
    }
    seen.set(email, line);

    valid.push({
      line,
      email,
      name: name.slice(0, 120),
      subjects: subjectsRaw
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 20),
    });
  }

  return { valid, problems, duplicates };
}

/** Positional fallback: name, email, subjects. */
function reparseHeaderless(input: string): { row: CsvRow; line: number }[] {
  const text = input.replace(/^﻿/, "");
  // Re-run the parser with a synthetic header so quoting is still handled
  // properly, rather than splitting on commas by hand.
  const withHeader = `__0,__1,__2\r\n${text}`;
  const { rows, lineNumbers } = parseCsv(withHeader);
  return rows.map((row, index) => ({
    row,
    // -1 because of the synthetic header line we prepended.
    line: (lineNumbers[index] ?? index + 2) - 1,
  }));
}
