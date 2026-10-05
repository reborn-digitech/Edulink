/**
 * G4-29 (5 Oct 2026, risks batch): the demo colleges are dated from the run's day through scripts/demo-calendar.ts.
 * The calendar at 5 October 2026 is exactly what the scripts held as literals; at another clock it is the same
 * shape a year on; and no date in the two scripts bypasses it.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { demoCalendar, demoToday, refuseAnotherYear, registerDays, shiftDateKey, shiftIso } from "../scripts/demo-calendar";

const SCRIPTS = ["demo-college.ts", "demo-college-engineering.ts"];

describe("the demo colleges' calendar", () => {
  it("on 5 October 2026 is the literals the scripts were written with", () => {
    const cal = demoCalendar("2026-10-05");
    expect(cal.shift).toBe(0);
    expect(cal.currentTerm).toEqual({ name: "Odd term 2026–27", academicYear: "2026–27", startsOn: "2026-07-01", endsOn: "2026-11-30", registrationOpensOn: "2026-06-20", registrationClosesOn: "2026-07-15" });
    expect(cal.pastTerm).toEqual({ name: "Even term 2025–26", academicYear: "2025–26", startsOn: "2025-12-01", endsOn: "2026-04-30", registrationOpensOn: "2025-11-20", registrationClosesOn: "2025-12-10" });
    expect([cal.registerFrom, cal.registerTo]).toEqual(["2026-09-07", "2026-10-03"]);
    expect([cal.ay(0), cal.ay(-1), cal.ayHyphen(0), cal.y(2025), cal.key("2026-05-22"), cal.at("2026-09-30T10:00:00Z").toISOString()]).toEqual(["2026–27", "2025–26", "2026-27", 2025, "2026-05-22", "2026-09-30T10:00:00.000Z"]);
  });

  it("at two pinned clocks a year apart has the same shape: as many register days, the same term lengths, everything before the run's day", () => {
    const a = demoCalendar("2026-10-05");
    const b = demoCalendar("2027-10-13");
    expect(b.shift).toBe(1);
    expect(b.currentTerm.name).toBe("Odd term 2027–28");
    expect(b.pastTerm.name).toBe("Even term 2026–27");
    expect(registerDays(b)).toHaveLength(registerDays(a).length);
    expect(registerDays(a)).toHaveLength(24);
    for (const cal of [a, b]) {
      const days = registerDays(cal);
      expect(days.every((d) => d >= cal.currentTerm.startsOn && d <= cal.currentTerm.endsOn && d < cal.today)).toBe(true);
      expect(days.every((d) => new Date(`${d}T00:00:00Z`).getUTCDay() !== 0)).toBe(true);
      expect(new Date(`${cal.registerFrom}T00:00:00Z`).getUTCDay()).toBe(1);
      expect(new Date(`${cal.registerTo}T00:00:00Z`).getUTCDay()).toBe(6);
      expect(cal.pastTerm.endsOn < cal.currentTerm.startsOn).toBe(true);
    }
    // Within one week every run writes the same lectures.
    expect(registerDays(demoCalendar("2027-10-16"))).toEqual(registerDays(b));
  });

  it("keeps the registers inside the odd term: after it, its last four weeks; in its first days, none yet; in June, the year before", () => {
    const after = demoCalendar("2026-12-15");
    expect([after.registerFrom, after.registerTo, after.ay(0)]).toEqual(["2026-11-02", "2026-11-28", "2026–27"]);
    expect(registerDays(demoCalendar("2027-07-06"))).toEqual([]);
    expect(demoCalendar("2027-06-20").ay(0)).toBe("2026–27");
    expect(demoCalendar("2027-07-01").ay(0)).toBe("2027–28");
  });

  it("moves a day by whole years, 29 February to the 28th in a common year, and an instant with it", () => {
    expect(shiftDateKey("2028-02-29", 1)).toBe("2029-02-28");
    expect(shiftDateKey("2026-11-30", 2)).toBe("2028-11-30");
    expect(shiftIso("2026-10-20T05:00:00.000Z", 1)).toBe("2027-10-20T05:00:00.000Z");
    expect(demoToday(new Date(), { DEMO_TODAY: "2027-10-13" })).toBe("2027-10-13");
    expect(() => demoToday(new Date(), { DEMO_TODAY: "2027-02-30" })).toThrow(/not a day/);
  });

  it("refuses a run over a college built for another academic year, and lets the same year or a new database through", async () => {
    const reader = (name: string | null, exists = true) => ({
      school: { findUnique: async () => (exists ? { id: "c1" } : null) },
      academicYear: { findFirst: async () => (name ? { name } : null) },
    });
    await expect(refuseAnotherYear(reader("2026–27"), "saraswati-college", demoCalendar("2027-10-13"))).rejects.toThrow(/built for 2026–27; this run's academic year is 2027–28/);
    await expect(refuseAnotherYear(reader("2026–27"), "saraswati-college", demoCalendar("2026-10-05"))).resolves.toBeUndefined();
    await expect(refuseAnotherYear(reader(null, false), "saraswati-college", demoCalendar("2027-10-13"))).resolves.toBeUndefined();
  });

  it("is the only way a date reaches the two scripts: no day, instant, year label or bare year left as a literal", () => {
    const STR = /"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*'/g;
    for (const file of SCRIPTS) {
      const src = readFileSync(join(process.cwd(), "scripts", file), "utf8");
      const offenders: string[] = [];
      src.split("\n").forEach((line, i) => {
        const t = line.trim();
        if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return;
        // A day or an instant in quotes must be the argument of the calendar's K(), T() or TI().
        for (const m of line.matchAll(/(K|T|TI)?\("?((?:19|20)\d\d-\d\d-\d\d)/g)) if (!m[1]) offenders.push(`${file}:${i + 1} ${m[2]}`);
        for (const m of line.matchAll(/(?<![KTI(])"((?:19|20)\d\d-\d\d-\d\d)/g)) offenders.push(`${file}:${i + 1} "${m[1]}`);
        // An academic-year label or a bare year in code (outside strings) must come from CAL or Y(); 2024 is the
        // schemes' own effective year ("SPPU NEP 2024", "SIT Autonomous 2024"), a name that does not move.
        if (/"20\d\d[–-]\d\d"/.test(line)) offenders.push(`${file}:${i + 1} label`);
        const code = line.replace(STR, '""');
        for (const m of code.matchAll(/(?<![\w.(])(202[5-9])(?![\w.])/g)) offenders.push(`${file}:${i + 1} ${m[1]}`);
      });
      expect(offenders).toEqual([]);
      expect(src).toMatch(/const CAL = demoCalendar\(\);/);
      expect(src).toMatch(/await refuseAnotherYear\(db, SLUG, CAL\);/);
    }
  });
});
