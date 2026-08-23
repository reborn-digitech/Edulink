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

import type { TranslationKey } from "./i18n/dictionary";

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
  /**
   * Rows that could not be used, with a reason the admin can act on.
   *
   * ⚠ A KEY AND ITS NUMBERS, NOT A SENTENCE. This parser runs in TWO places —
   * the live preview in the browser and the invite action on the server — and
   * only one of them knows who is reading. Returning finished English put "Not
   * a valid email address" in the middle of a Marathi form.
   */
  problems: { line: number; value: string; reasonKey: TranslationKey; reasonVars?: Record<string, string | number> }[];
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
    // Headerless: the email is WHICHEVER cell looks like one. "One email per
    // line" is the format the page itself suggests, and it puts the address
    // in the first column; "name,email,subjects" puts it in the second.
    // Reading a fixed column rejected the simplest paste with "No email".
    const cells = headerless ? [row.__0 ?? "", row.__1 ?? "", row.__2 ?? ""] : [];
    const emailIndex = headerless ? cells.findIndex((c) => EMAIL_RE.test(c.trim())) : -1;
    // A lone cell that is not an address is still "their email, mistyped" —
    // reported as invalid with the value shown, not as a blank row.
    const nonEmpty = cells.filter((c) => c.trim().length > 0);
    const email = (headerless
      ? (emailIndex >= 0 ? cells[emailIndex] : nonEmpty.length === 1 ? nonEmpty[0] : row.__1)
      : row[emailKey!])?.trim().toLowerCase() ?? "";
    const name = (headerless
      ? (emailIndex === 0 ? "" : cells[0])
      : nameKey ? row[nameKey] : "")?.trim() ?? "";
    const subjectsRaw = (headerless
      ? (emailIndex === 0 ? cells[1] : cells[2])
      : subjectsKey ? row[subjectsKey] : "") ?? "";

    if (!email) {
      // Empty `value` means "there was nothing on this row to show" — the
      // renderer says so in the reader's language rather than us baking in
      // "(blank row)" here.
      problems.push({ line, value: name, reasonKey: "invites.noEmail" });
      continue;
    }
    if (!EMAIL_RE.test(email)) {
      problems.push({ line, value: email, reasonKey: "invites.invalidEmail" });
      continue;
    }
    if (email.length > 320) {
      problems.push({ line, value: email.slice(0, 40) + "…", reasonKey: "invites.emailTooLong" });
      continue;
    }

    const firstSeen = seen.get(email);
    if (firstSeen !== undefined) {
      if (!duplicates.includes(email)) duplicates.push(email);
      problems.push({
        line,
        value: email,
        reasonKey: "invites.duplicateOfLine",
        reasonVars: { line: firstSeen },
      });
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
