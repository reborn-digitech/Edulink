import { describe, expect, it } from "vitest";
import { csvToXlsx, exportResponse, isTextColumn, wantsXlsx } from "../src/lib/export-file";
import { parseXlsx, unzip, XLSX_MIME } from "../src/lib/xlsx";

const file = { filename: "edulink-register-Class_3-2026-09.csv", csv: "student_code,name,2026-09-01,days_present\r\nSTU-007,Asha Rao,P,1\r\n0042,Bilal,A,0\r\n,Chitra,,\r\n" };

describe("export file", () => {
  it("answers CSV as before when the link does not ask for Excel", async () => {
    const res = await exportResponse(new Request("http://x/admin/export"), file);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toContain('filename="edulink-register-Class_3-2026-09.csv"');
    expect(res.headers.get("cache-control")).toBe("no-store, private");
    expect(await res.text()).toBe(file.csv);
  });

  it("answers a workbook of the same rows for ?format=xlsx, numbers as numbers and codes as text", async () => {
    const request = new Request("http://x/admin/export?classId=c&format=xlsx");
    expect(wantsXlsx(request)).toBe(true);
    const res = await exportResponse(request, file);
    expect(res.headers.get("content-type")).toBe(XLSX_MIME);
    expect(res.headers.get("content-disposition")).toContain('filename="edulink-register-Class_3-2026-09.xlsx"');
    const [sheet] = await parseXlsx(new Uint8Array(await res.arrayBuffer()));
    expect(sheet!.name).toBe("register-Class_3-2026-09");
    expect(sheet!.rows).toEqual([
      ["student_code", "name", "2026-09-01", "days_present"],
      ["STU-007", "Asha Rao", "P", "1"],
      ["0042", "Bilal", "A", "0"],
      ["", "Chitra"],
    ]);
  });

  it("drops the CSV's formula guard on the workbook path: a '=1+1 cell is the text =1+1", async () => {
    const bytes = await csvToXlsx("name,note\r\n'=1+1,'@mention\r\n'-5,-5\r\nO'Brien,'plain\r\n", "s");
    const [sheet] = await parseXlsx(bytes);
    expect(sheet!.rows[1]).toEqual(["=1+1", "@mention"]);
    // A guarded "-5" is text, as the CSV guard meant it; an unguarded one is a number.
    expect(sheet!.rows[2]).toEqual(["-5", "-5"]);
    // An apostrophe that is not a guard stays.
    expect(sheet!.rows[3]).toEqual(["O'Brien", "'plain"]);
  });

  it("keeps a leading-zero code and a long phone number as text, and an amount as a number", async () => {
    const bytes = await csvToXlsx("code,phone,amount,note\r\n007,+919876400001,1250.50,12.0\r\n", "s");
    const [sheet] = await parseXlsx(bytes);
    expect(sheet!.rows[1]).toEqual(["007", "+919876400001", "1250.5", "12"]);
  });
});

describe("identifier columns", () => {
  it("keeps a PEN, a UDISE code, a mobile and a PIN as text by header or by length, and marks and amounts as numbers", async () => {
    const csv = "name,pen,udise_code,mobile,postal_code,roll_no,marks,amount,count\r\nAsha,27250100001,27250100942,9876543210,411001,7,85,1250.50,12\r\nBilal,10000000000,,0987654321,,12,9,0,3\r\n";
    const [sheet] = await parseXlsx(await csvToXlsx(csv, "s"));
    // parseXlsx reads every cell back as a string; a number cell comes back normalised (1250.50 → 1250.5) and a text cell exactly as written.
    expect(sheet!.rows[1]).toEqual(["Asha", "27250100001", "27250100942", "9876543210", "411001", "7", "85", "1250.5", "12"]);
    expect(sheet!.rows[2]).toEqual(["Bilal", "10000000000", "", "0987654321", "", "12", "9", "0", "3"]);
    // Under a header that names an identifier the cell is text whatever it looks like; under any other, more than nine digits is text too.
    expect(isTextColumn("pen")).toBe(true);
    expect(isTextColumn("student_code")).toBe(true);
    expect(isTextColumn("PEN Number")).toBe(true);
    expect(isTextColumn("paid")).toBe(false);
    expect(isTextColumn("days_present")).toBe(false);
    // In the sheet's own XML: the PEN and the twelve-digit id are inline strings, the nine-digit figure and the marks are <v> numbers.
    const bytes = await csvToXlsx("note,value,pen,marks\r\nx,123456789012,27250100001,85\r\ny,123456789,,9\r\n", "s");
    const [long] = await parseXlsx(bytes);
    expect(long!.rows[1]).toEqual(["x", "123456789012", "27250100001", "85"]);
    expect(long!.rows[2]).toEqual(["y", "123456789", "", "9"]);
    const xml = new TextDecoder().decode((await unzip(bytes)).get("xl/worksheets/sheet1.xml"));
    expect(xml).toMatch(/<c r="B2"[^>]*t="inlineStr"><is><t[^>]*>123456789012<\/t>/);
    expect(xml).toMatch(/<c r="C2"[^>]*t="inlineStr"><is><t[^>]*>27250100001<\/t>/);
    expect(xml).toMatch(/<c r="D2"[^>]*><v>85<\/v>/);
    expect(xml).toMatch(/<c r="B3"[^>]*><v>123456789<\/v>/);
  });
});
