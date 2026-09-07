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

/* -------------------------------------------------------------------------- */
/* Admissions intake                                                           */
/* -------------------------------------------------------------------------- */

/**
 * One pupil off an admission list. Only the name is required: a school's
 * register of new admissions is a name, a date of birth, a class and a
 * guardian, and any of the last three may be missing on the day — the
 * office fills them in later from the directory, which already knows how.
 */
export type IntakeRow = {
  line: number;
  name: string;
  /** YYYY-MM-DD, already validated; null when the cell was empty. */
  birthdateKey: string | null;
  className: string | null;
  pupilEmail: string | null;
  guardianEmail: string | null;
  guardianName: string | null;
  relation: "PARENT" | "GUARDIAN" | "OTHER";
  /** Present = a transfer: link to the existing account behind this code. */
  studentCode: string | null;
};

export type IntakeCsvResult = {
  valid: IntakeRow[];
  problems: InviteCsvResult["problems"];
  /** The headers the file was read with — shown back so a silent mis-mapping is visible. */
  recognised: { name: boolean; birthdate: boolean; className: boolean; pupilEmail: boolean; guardianEmail: boolean };
};

const INTAKE_HEADERS = {
  name: ["name", "pupil", "student", "full name", "pupil name", "student name", "child"],
  birthdate: ["dob", "date of birth", "birthdate", "birth date", "born", "d.o.b.", "d.o.b"],
  className: ["class", "grade", "section", "form", "class name"],
  pupilEmail: ["pupil email", "student email", "email", "email address", "e-mail"],
  guardianEmail: ["guardian email", "parent email", "guardian", "parent", "parent/guardian email", "guardian e-mail", "parent e-mail"],
  guardianName: ["guardian name", "parent name", "parent/guardian name", "father", "mother"],
  relation: ["relation", "relationship", "guardian relation"],
  /**
   * The pupil's own code from their PREVIOUS school — printed on the leaving
   * certificate and on their profile as STU-XXXX-XXXX. A row that carries it
   * is a TRANSFER: the new membership attaches to the child's existing
   * account, so the certificate and the record follow the person instead of
   * a second account being minted beside the first.
   */
  studentCode: ["student code", "pupil code", "transfer code", "code", "stu code", "student id"],
} as const;

/**
 * A date the way an office types it: dd/mm/yyyy (the format every date in
 * this app is shown in), or ISO yyyy-mm-dd, which is what a spreadsheet
 * exports. Anything else is a problem on that row, not a guess — a birthday
 * is what a parent proves a claim with, and 03/04 read the American way
 * locks a real parent out.
 */
export function parseIntakeDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  let y: number, m: number, d: number;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/.exec(text);
    if (!match) return null;
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null; // 31/02
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Maps an admission list onto intake rows.
 *
 * HEADERS ARE REQUIRED HERE, unlike the invite paste: with seven optional
 * columns there is no sensible positional fallback, and guessing which
 * column is the child's address and which the parent's is how a child gets
 * their parent's invitation. A file with no recognisable name column is
 * reported as such rather than read as names.
 */
export function parseIntakeCsv(input: string, today: string): IntakeCsvResult {
  const { headers, rows, lineNumbers } = parseCsv(input);
  const key = (aliases: readonly string[]) => headers.find((h) => aliases.includes(h));
  const col = {
    name: key(INTAKE_HEADERS.name),
    birthdate: key(INTAKE_HEADERS.birthdate),
    className: key(INTAKE_HEADERS.className),
    // "email" alone means the pupil's only when a separate guardian column exists
    // to disambiguate it; a lone "email" column on an admission list is far more
    // often the parent's. Ask for "pupil email" to mean the child.
    pupilEmail: key(INTAKE_HEADERS.pupilEmail),
    guardianEmail: key(INTAKE_HEADERS.guardianEmail),
    guardianName: key(INTAKE_HEADERS.guardianName),
    relation: key(INTAKE_HEADERS.relation),
    studentCode: key(INTAKE_HEADERS.studentCode),
  };
  if (col.pupilEmail && ["email", "email address", "e-mail"].includes(col.pupilEmail) && !col.guardianEmail) {
    col.guardianEmail = col.pupilEmail;
    col.pupilEmail = undefined;
  }

  const recognised = {
    name: !!col.name,
    birthdate: !!col.birthdate,
    className: !!col.className,
    pupilEmail: !!col.pupilEmail,
    guardianEmail: !!col.guardianEmail,
  };
  const valid: IntakeRow[] = [];
  const problems: IntakeCsvResult["problems"] = [];
  if (!col.name) {
    if (rows.length > 0 || headers.length > 0) problems.push({ line: 1, value: headers.join(", "), reasonKey: "intake.noNameColumn" });
    return { valid, problems, recognised };
  }

  const seenEmails = new Map<string, number>();
  const seenPeople = new Map<string, number>();

  rows.forEach((row, index) => {
    const line = lineNumbers[index] ?? index + 2;
    const cell = (k: string | undefined) => (k ? (row[k] ?? "").trim() : "");
    const name = cell(col.name).slice(0, 120);
    if (!name) {
      problems.push({ line, value: "", reasonKey: "intake.noName" });
      return;
    }

    const dobRaw = cell(col.birthdate);
    const birthdateKey = parseIntakeDate(dobRaw);
    if (dobRaw && !birthdateKey) {
      problems.push({ line, value: `${name} · ${dobRaw}`, reasonKey: "intake.badDate" });
      return;
    }
    if (birthdateKey && birthdateKey > today) {
      problems.push({ line, value: `${name} · ${dobRaw}`, reasonKey: "intake.dateInFuture" });
      return;
    }

    const pupilEmail = cell(col.pupilEmail).toLowerCase() || null;
    if (pupilEmail && !EMAIL_RE.test(pupilEmail)) {
      problems.push({ line, value: pupilEmail, reasonKey: "invites.invalidEmail" });
      return;
    }
    const guardianEmail = cell(col.guardianEmail).toLowerCase() || null;
    if (guardianEmail && !EMAIL_RE.test(guardianEmail)) {
      problems.push({ line, value: guardianEmail, reasonKey: "intake.badGuardianEmail" });
      return;
    }
    if (pupilEmail && guardianEmail && pupilEmail === guardianEmail) {
      problems.push({ line, value: pupilEmail, reasonKey: "intake.sameAddress" });
      return;
    }
    if (pupilEmail) {
      const first = seenEmails.get(pupilEmail);
      if (first !== undefined) {
        problems.push({ line, value: pupilEmail, reasonKey: "invites.duplicateOfLine", reasonVars: { line: first } });
        return;
      }
      seenEmails.set(pupilEmail, line);
    }
    // The same child twice — same name and birthday — is a pasted-twice row,
    // and two accounts for one child is the mess the office least wants.
    if (birthdateKey) {
      const personKey = `${name.toLowerCase()}|${birthdateKey}`;
      const first = seenPeople.get(personKey);
      if (first !== undefined) {
        problems.push({ line, value: name, reasonKey: "invites.duplicateOfLine", reasonVars: { line: first } });
        return;
      }
      seenPeople.set(personKey, line);
    }

    const relRaw = cell(col.relation).toUpperCase();
    const relation =
      relRaw === "GUARDIAN" ? "GUARDIAN"
      : relRaw === "OTHER" ? "OTHER"
      : "PARENT";

    valid.push({
      line,
      name,
      birthdateKey,
      className: cell(col.className).slice(0, 80) || null,
      pupilEmail,
      guardianEmail,
      guardianName: cell(col.guardianName).slice(0, 120) || null,
      relation,
      studentCode: cell(col.studentCode).toUpperCase().slice(0, 40) || null,
    });
  });

  return { valid, problems, recognised };
}
