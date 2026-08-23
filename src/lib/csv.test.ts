import { describe, expect, it } from "vitest";
import { parseCsv, parseInviteCsv, parseIntakeCsv, toCsv, toCsvValue } from "./csv";

/**
 * Expected values are written out by hand, never derived by running the parser
 * on itself. (§13)
 */

describe("parseCsv", () => {
  it("parses a plain file", () => {
    const { headers, rows } = parseCsv("name,email\nAmara,a@x.school\nBen,b@x.school");
    expect(headers).toEqual(["name", "email"]);
    expect(rows).toEqual([
      { name: "Amara", email: "a@x.school" },
      { name: "Ben", email: "b@x.school" },
    ]);
  });

  it("handles CRLF line endings", () => {
    const { rows } = parseCsv("name,email\r\nAmara,a@x.school\r\n");
    expect(rows).toEqual([{ name: "Amara", email: "a@x.school" }]);
  });

  it("strips the Excel UTF-8 BOM from the first header", () => {
    const { headers } = parseCsv("﻿name,email\nAmara,a@x.school");
    expect(headers).toEqual(["name", "email"]);
  });

  it("keeps commas inside quoted fields", () => {
    const { rows } = parseCsv('name,email\n"Okafor, Amara",a@x.school');
    expect(rows[0]!.name).toBe("Okafor, Amara");
    expect(rows[0]!.email).toBe("a@x.school");
  });

  it("unescapes doubled quotes", () => {
    const { rows } = parseCsv('name,note\n"She said ""hi""",ok');
    expect(rows[0]!.name).toBe('She said "hi"');
  });

  it("keeps newlines inside quoted fields and does not split the record", () => {
    const { rows } = parseCsv('name,address\n"Amara","12 High St\nBristol"');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.address).toBe("12 High St\nBristol");
  });

  it("ignores a trailing newline rather than emitting a blank row", () => {
    expect(parseCsv("name\nAmara\n").rows).toHaveLength(1);
    expect(parseCsv("name\nAmara\n\n\n").rows).toHaveLength(1);
  });

  it("pads short rows instead of returning undefined", () => {
    const { rows } = parseCsv("name,email,subjects\nAmara,a@x.school");
    expect(rows[0]!.subjects).toBe("");
  });

  it("lowercases and trims headers so lookups are predictable", () => {
    const { headers } = parseCsv("  Name , EMAIL Address \nAmara,a@x.school");
    expect(headers).toEqual(["name", "email address"]);
  });

  it("returns empty structures for empty input rather than throwing", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [], lineNumbers: [] });
    expect(parseCsv("\n").rows).toEqual([]);
  });

  it("reports the source line number of each record", () => {
    const { lineNumbers } = parseCsv("name\nA\nB\nC");
    expect(lineNumbers).toEqual([2, 3, 4]);
  });
});

describe("toCsv", () => {
  it("quotes only what needs quoting", () => {
    expect(toCsvValue("plain")).toBe("plain");
    expect(toCsvValue("has,comma")).toBe('"has,comma"');
    expect(toCsvValue('has"quote')).toBe('"has""quote"');
    expect(toCsvValue("has\nnewline")).toBe('"has\nnewline"');
    expect(toCsvValue(null)).toBe("");
    expect(toCsvValue(undefined)).toBe("");
  });

  it("round-trips through the parser", () => {
    const original = [
      { name: "Okafor, Amara", email: "a@x.school" },
      { name: 'She said "hi"', email: "b@x.school" },
    ];
    const { rows } = parseCsv(toCsv(original));
    expect(rows).toEqual(original);
  });

  it("emits a header-only file for an empty row set", () => {
    expect(toCsv([], ["name", "email"])).toBe("name,email\r\n");
  });
});

describe("parseInviteCsv", () => {
  it("reads a headered file", () => {
    const result = parseInviteCsv(
      "name,email,subjects\nPriya Raman,priya@x.school,Maths;Science\nTom Fielding,tom@x.school,English",
    );
    expect(result.problems).toEqual([]);
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]).toMatchObject({
      name: "Priya Raman",
      email: "priya@x.school",
      subjects: ["Maths", "Science"],
    });
  });

  it("accepts alternative header spellings", () => {
    const result = parseInviteCsv("Full Name,E-Mail\nPriya Raman,priya@x.school");
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0]!.name).toBe("Priya Raman");
  });

  it("falls back to positional columns for a headerless paste", () => {
    const result = parseInviteCsv("Priya Raman,priya@x.school\nTom Fielding,tom@x.school");
    expect(result.valid).toHaveLength(2);
    expect(result.valid[0]!.email).toBe("priya@x.school");
    expect(result.valid[1]!.name).toBe("Tom Fielding");
  });

  it("normalises email case", () => {
    const result = parseInviteCsv("name,email\nPriya,PRIYA@X.School");
    expect(result.valid[0]!.email).toBe("priya@x.school");
  });

  it("collects bad rows instead of skipping them silently", () => {
    const result = parseInviteCsv(
      ["name,email", "Good One,good@x.school", "No Email,", "Bad Address,not-an-email"].join("\n"),
    );
    // Header is line 1, so the two bad rows are on lines 3 and 4.
    expect(result.valid).toHaveLength(1);
    expect(result.problems).toHaveLength(2);
    expect(result.problems[0]).toMatchObject({ line: 3, reasonKey: "invites.noEmail" });
    expect(result.problems[1]).toMatchObject({ line: 4, reasonKey: "invites.invalidEmail" });
  });

  it("reports in-file duplicates once, pointing at the first occurrence", () => {
    const result = parseInviteCsv(
      ["name,email", "Priya,priya@x.school", "Priya Again,PRIYA@x.school"].join("\n"),
    );
    expect(result.valid).toHaveLength(1);
    expect(result.duplicates).toEqual(["priya@x.school"]);
    expect(result.problems[0]!.reasonKey).toBe("invites.duplicateOfLine");
    expect(result.problems[0]!.reasonVars).toEqual({ line: 2 });
  });

  it("survives a quoted name containing a comma", () => {
    const result = parseInviteCsv('name,email\n"Raman, Priya",priya@x.school');
    expect(result.valid[0]!.name).toBe("Raman, Priya");
    expect(result.valid[0]!.email).toBe("priya@x.school");
  });

  it("caps runaway subject lists rather than storing them all", () => {
    const subjects = Array.from({ length: 50 }, (_, i) => `S${i}`).join(";");
    const result = parseInviteCsv(`name,email,subjects\nP,p@x.school,"${subjects}"`);
    expect(result.valid[0]!.subjects).toHaveLength(20);
  });

  it("returns empty results for empty input rather than throwing", () => {
    const result = parseInviteCsv("");
    expect(result.valid).toEqual([]);
    expect(result.problems).toEqual([]);
  });

  it("does not treat a header row as an invitee", () => {
    const result = parseInviteCsv("name,email\nPriya,priya@x.school");
    expect(result.valid.every((r) => r.email !== "email")).toBe(true);
    expect(result.valid).toHaveLength(1);
  });
});

describe("parseInviteCsv — one email per line", () => {
  it("accepts the paste the page itself suggests", () => {
    const result = parseInviteCsv("a@school.test\nb@school.test\n");
    expect(result.valid.map((r) => r.email)).toEqual(["a@school.test", "b@school.test"]);
    expect(result.problems).toEqual([]);
  });

  it("still reads name,email,subjects and flags the row with no address", () => {
    const result = parseInviteCsv("Priya Nair,p@school.test,Maths\nnot-an-email\n");
    expect(result.valid).toMatchObject([{ email: "p@school.test", name: "Priya Nair", subjects: ["Maths"] }]);
    expect(result.problems.map((p) => p.reasonKey)).toEqual(["invites.invalidEmail"]);
  });
});

describe("parseIntakeCsv — an admission list", () => {
  const TODAY = "2026-08-22";

  it("reads name, date of birth (dd/mm/yyyy), class and guardian by header", () => {
    const result = parseIntakeCsv(
      "name,date of birth,class,guardian email,guardian name,relation\n" +
        'Aarav Patel,14/06/2019,Class 1,rekha@example.com,Rekha Patel,parent\n' +
        '"Joshi, Meera",2019-11-02,Class 1,,,\n',
      TODAY,
    );
    expect(result.problems).toEqual([]);
    expect(result.valid).toMatchObject([
      { line: 2, name: "Aarav Patel", birthdateKey: "2019-06-14", className: "Class 1", guardianEmail: "rekha@example.com", guardianName: "Rekha Patel", relation: "PARENT" },
      { line: 3, name: "Joshi, Meera", birthdateKey: "2019-11-02", className: "Class 1", guardianEmail: null, guardianName: null },
    ]);
    expect(result.recognised).toMatchObject({ name: true, birthdate: true, className: true, guardianEmail: true, pupilEmail: false });
  });

  it("⚠ refuses a file with no name column rather than guessing", () => {
    const result = parseIntakeCsv("Aarav Patel,14/06/2019\nMeera Joshi,02/11/2019\n", TODAY);
    expect(result.valid).toEqual([]);
    expect(result.problems.map((p) => p.reasonKey)).toEqual(["intake.noNameColumn"]);
  });

  it("⚠ a date it cannot read is a problem on that row, never a guess", () => {
    const result = parseIntakeCsv("name,dob\nA,31/02/2019\nB,June 2019\nC,14/06/2031\nD,\n", TODAY);
    expect(result.valid.map((r) => r.name)).toEqual(["D"]);
    expect(result.problems.map((p) => p.reasonKey)).toEqual(["intake.badDate", "intake.badDate", "intake.dateInFuture"]);
  });

  it("⚠ a lone \"email\" column on an admission list is the guardian's, not the child's", () => {
    const result = parseIntakeCsv("name,email\nAarav,rekha@example.com\n", TODAY);
    expect(result.valid[0]).toMatchObject({ guardianEmail: "rekha@example.com", pupilEmail: null });
    const both = parseIntakeCsv("name,pupil email,parent email\nAarav,aarav@example.com,rekha@example.com\n", TODAY);
    expect(both.valid[0]).toMatchObject({ guardianEmail: "rekha@example.com", pupilEmail: "aarav@example.com" });
  });

  it("⚠ the same child twice, and a shared address, are reported", () => {
    const result = parseIntakeCsv(
      "name,dob,pupil email,guardian email\n" +
        "Aarav Patel,14/06/2019,,\n" +
        "aarav patel,14/06/2019,,\n" +
        "Meera,,same@example.com,same@example.com\n",
      TODAY,
    );
    expect(result.valid).toHaveLength(1);
    expect(result.problems).toMatchObject([
      { line: 3, reasonKey: "invites.duplicateOfLine", reasonVars: { line: 2 } },
      { line: 4, reasonKey: "intake.sameAddress" },
    ]);
  });
});
