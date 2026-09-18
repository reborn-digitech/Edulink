import { describe, expect, it } from "vitest";
import { csvToXlsx, exportResponse, wantsXlsx } from "../src/lib/export-file";
import { parseXlsx, XLSX_MIME } from "../src/lib/xlsx";

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

  it("keeps a leading-zero code and a long phone number as text, and an amount as a number", async () => {
    const bytes = await csvToXlsx("code,phone,amount,note\r\n007,+919876400001,1250.50,12.0\r\n", "s");
    const [sheet] = await parseXlsx(bytes);
    expect(sheet!.rows[1]).toEqual(["007", "+919876400001", "1250.5", "12"]);
  });
});
