import { describe, expect, it } from "vitest";
import { buildXlsx, columnName, crc32, isXlsxFile, parseXlsx, rowsToCsv, serialToDateKey, unzip, zip } from "../src/lib/xlsx";

const enc = new TextEncoder();

describe("zip container", () => {
  it("computes the standard CRC-32", () => {
    expect(crc32(enc.encode("123456789")).toString(16)).toBe("cbf43926");
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("round-trips entries, including empty and non-ASCII names", async () => {
    const bytes = await zip([
      { name: "a.txt", data: enc.encode("hello") },
      { name: "dir/शाळा.txt", data: enc.encode("x".repeat(10_000)) },
      { name: "empty", data: new Uint8Array() },
    ]);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    const back = await unzip(bytes);
    expect([...back.keys()]).toEqual(["a.txt", "dir/शाळा.txt", "empty"]);
    expect(new TextDecoder().decode(back.get("a.txt"))).toBe("hello");
    expect(back.get("dir/शाळा.txt")!.length).toBe(10_000);
    expect(back.get("empty")!.length).toBe(0);
  });

  it("refuses something that is not a zip", async () => {
    await expect(unzip(enc.encode("name,marks\nAsha,42\n"))).rejects.toThrow(/not a zip/);
  });
});

describe("workbook", () => {
  it("names columns the way Excel does", () => {
    expect([0, 1, 25, 26, 27, 701, 702].map(columnName)).toEqual(["A", "B", "Z", "AA", "AB", "ZZ", "AAA"]);
  });

  it("writes a sheet Excel opens and reads it back as text, numbers kept exact", async () => {
    const bytes = await buildXlsx([
      { name: "Marks", headers: ["Student", "Marks", "Note"], rows: [["Asha <Rao> & co", 42, null], ["Bilal", 0, "absent \"quoted\""], ["Chitra", 37.5, ""]] },
      { name: "Second/sheet:name?", headers: ["k"], rows: [["v"]] },
    ]);
    const files = await unzip(bytes);
    expect([...files.keys()].sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml"]);
    const sheets = await parseXlsx(bytes);
    expect(sheets.map((s) => s.name)).toEqual(["Marks", "Second sheet name"]);
    expect(sheets[0]!.rows).toEqual([
      ["Student", "Marks", "Note"],
      ["Asha <Rao> & co", "42"],
      ["Bilal", "0", 'absent "quoted"'],
      ["Chitra", "37.5"],
    ]);
    expect(sheets[1]!.rows).toEqual([["k"], ["v"]]);
  });

  it("reads shared strings, rich runs, booleans, formulas and dates the way Excel saves them", async () => {
    const bytes = await zip([
      { name: "[Content_Types].xml", data: enc.encode("<Types/>") },
      {
        name: "xl/workbook.xml",
        data: enc.encode(`<workbook xmlns:r="x"><sheets><sheet name="Roll &amp; Dates" sheetId="1" r:id="rId3"/></sheets></workbook>`),
      },
      {
        name: "xl/_rels/workbook.xml.rels",
        data: enc.encode(`<Relationships><Relationship Id="rId3" Type="ws" Target="/xl/worksheets/sheet9.xml"/></Relationships>`),
      },
      {
        name: "xl/sharedStrings.xml",
        data: enc.encode(`<sst><si><t>Name</t></si><si><r><t>Asha </t></r><r><rPr><b/></rPr><t>Rao</t></r></si><si><t xml:space="preserve"> padded </t></si></sst>`),
      },
      {
        name: "xl/styles.xml",
        data: enc.encode(
          `<styleSheet><numFmts count="1"><numFmt numFmtId="164" formatCode="[$-409]dd\\-mmm\\-yy;@"/></numFmts><cellXfs count="4"><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="164"/><xf numFmtId="2"/></cellXfs></styleSheet>`,
        ),
      },
      {
        name: "xl/worksheets/sheet9.xml",
        data: enc.encode(
          `<worksheet><sheetData>` +
            `<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="inlineStr"><is><t>Born</t></is></c><c r="C1" t="s"><v>2</v></c></row>` +
            `<row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2" s="1"><v>45658</v></c><c r="C2" t="b"><v>1</v></c><c r="D2" s="3"><v>12.50</v></c></row>` +
            `<row r="4"><c r="A4" t="str"><f>CONCAT("a","b")</f><v>ab</v></c><c r="B4" s="2"><v>36526</v></c><c r="C4"/><c r="D4"><v>1e3</v></c></row>` +
            `</sheetData></worksheet>`,
        ),
      },
    ]);
    const [sheet] = await parseXlsx(bytes);
    expect(sheet!.name).toBe("Roll & Dates");
    expect(sheet!.rows).toEqual([
      ["Name", "Born", " padded "],
      ["Asha Rao", "2025-01-01", "TRUE", "12.5"],
      [],
      ["ab", "2000-01-01", "", "1000"],
    ]);
  });

  it("converts 1900-system serials, either side of Excel's phantom leap day", () => {
    expect(serialToDateKey(1)).toBe("1900-01-01");
    expect(serialToDateKey(59)).toBe("1900-02-28");
    expect(serialToDateKey(61)).toBe("1900-03-01");
    expect(serialToDateKey(25569)).toBe("1970-01-01");
    expect(serialToDateKey(45658.75)).toBe("2025-01-01");
  });

  it("refuses a zip that is not a workbook", async () => {
    const bytes = await zip([{ name: "readme.txt", data: enc.encode("hi") }]);
    await expect(parseXlsx(bytes)).rejects.toThrow(/not an Excel workbook/);
  });

  it("turns rows into the CSV the intake parser reads", () => {
    expect(rowsToCsv([["name", "dob"], ["Rao, Asha", "2015-06-01"], ['say "hi"']])).toBe('name,dob\r\n"Rao, Asha",2015-06-01\r\n"say ""hi""",\r\n');
  });

  it("recognises a workbook by extension or type", () => {
    expect(isXlsxFile({ name: "roll.XLSX" })).toBe(true);
    expect(isXlsxFile({ name: "roll.csv", type: "text/csv" })).toBe(false);
    expect(isXlsxFile({ name: "blob", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })).toBe(true);
  });
});
