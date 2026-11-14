/**
 * The owner's decision on TA-332 of the testing analysis of 13 November 2026 (taken 14 November 2026): fix the
 * counted sentences people see at one, and make the cap honest.
 *
 * Before, a library loan read "1 days late" and "renewed 1 times", the operator's college calendar "Opens in 1
 * days" (Hindi दिनों में, Marathi दिवसांत), a school's stand-in "1 pupils in your care", a workshop "1 seats left",
 * a grade "1 of 1 seats left", a course "1 credits", an e-resource "opened 1 times" and a circular "Chased today ·
 * 1 times"; the dictionary's header said every counted sentence reads right at one, and the ratchet that holds the
 * rest counted only some plural nouns (not marks, credits, cards, workshops or beds).
 *
 * Now each of the seventeen sentences below has a form for one in English, Hindi and Marathi, and every page that
 * draws it, on the web and the phone, chooses that form at one (a "{remaining} of {seats}" line chooses on the
 * total). The header says what is true, and the ratchet counts every plural noun the dictionary puts after a
 * number, with its cap at the true count. Pure: the dictionaries and the source are read, nothing is written.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";

const ROOT = resolve(__dirname, "../../..");
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

function flatten(tree: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  if (!tree || typeof tree !== "object") return out;
  for (const [k, v] of Object.entries(tree as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
    else out.set(key, String(v));
  }
  return out;
}
const E = flatten(en);
const H = flatten(hi);
const M = flatten(mr);
const fill = (value: string | undefined, vars: Record<string, string | number>) =>
  (value ?? "").replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));

/** The sentences known to show 1, with what each reads at one in English. */
const AT_ONE: Record<string, { vars: Record<string, string | number>; reads: string }> = {
  "library.daysLate": { vars: { days: 1 }, reads: "1 day late" },
  "library.renewedTimes": { vars: { count: 1 }, reads: "renewed 1 time" },
  "library.timesLent": { vars: { count: 1 }, reads: "lent 1 time" },
  "library.refuseRenewLimit": { vars: { count: 1 }, reads: "This loan has been renewed 1 time, the most the library allows." },
  "admissions.seatsLeft": { vars: { remaining: 0, seats: 1 }, reads: "0 of 1 seat left" },
  "gigs.seatsLeft": { vars: { count: 1 }, reads: "1 seat left" },
  "academics.seatsLeft": { vars: { n: 1 }, reads: "1 seat left" },
  "academics.creditsN": { vars: { n: 1 }, reads: "1 credit" },
  "talks.seatsLeft": { vars: { count: 1 }, reads: "1 seat left" },
  "operatorCollege.opensIn": { vars: { count: 1 }, reads: "Opens in 1 day" },
  "switch.standinCount": { vars: { count: 1 }, reads: "1 pupil in your care" },
  "reportView.longestRun": { vars: { count: 1 }, reads: "Longest run present: 1 day." },
  "examCell.opens": { vars: { count: 1 }, reads: "opened 1 time" },
  "collegeOffice.ltOpens": { vars: { n: 1 }, reads: "opened 1 time" },
  "schoolForms.eresOpenedTimes": { vars: { n: 1 }, reads: "Opened 1 time" },
  "circulars.reminded": { vars: { when: "today", count: 1 }, reads: "Chased today · 1 time" },
  "viduraOps.hits": { vars: { count: 1, when: "today" }, reads: "Served 1 time; last today" },
};

/** Every place, on the web and the phone, that draws one of those sentences with a number that can be 1. */
const CALLERS: [file: string, keys: string[]][] = [
  ["apps/web/src/components/library/parts.tsx", ["library.daysLate", "library.renewedTimes"]],
  ["apps/web/src/app/(app)/library/reports/page.tsx", ["library.timesLent"]],
  ["apps/web/src/lib/library.ts", ["library.refuseRenewLimit"]],
  ["apps/web/src/app/(app)/explore/[schoolId]/page.tsx", ["admissions.seatsLeft"]],
  ["apps/web/src/app/(app)/explore/[schoolId]/apply/page.tsx", ["admissions.seatsLeft"]],
  ["apps/web/src/app/(app)/sessions/page.tsx", ["gigs.seatsLeft"]],
  ["apps/web/src/components/academics/registration-form.tsx", ["academics.seatsLeft", "academics.creditsN"]],
  ["apps/web/src/app/(app)/student/placement/talks/page.tsx", ["talks.seatsLeft"]],
  ["apps/web/src/app/root/colleges/calendar/page.tsx", ["operatorCollege.opensIn"]],
  ["apps/web/src/app/account/page.tsx", ["switch.standinCount"]],
  ["apps/web/src/app/switch/page.tsx", ["switch.standinCount"]],
  ["apps/web/src/app/(app)/reports/[studentMembershipId]/page.tsx", ["reportView.longestRun"]],
  ["apps/web/src/app/(app)/exam-cell/sessions/[sessionId]/conduct/page.tsx", ["examCell.opens"]],
  ["apps/web/src/app/(app)/library/college/page.tsx", ["collegeOffice.ltOpens"]],
  ["apps/web/src/app/(app)/admin/college-campus/page.tsx", ["collegeOffice.ltOpens"]],
  ["apps/web/src/app/(app)/library/e-resources/page.tsx", ["schoolForms.eresOpenedTimes"]],
  ["apps/web/src/app/(app)/bulletin/[postId]/reach-report.tsx", ["circulars.reminded"]],
  ["apps/web/src/components/vidura-ops/answers-desk.tsx", ["viduraOps.hits"]],
  ["apps/mobile/src/screens/library/mine.tsx", ["library.daysLate"]],
  ["apps/mobile/src/screens/library/desk.tsx", ["library.daysLate"]],
  ["apps/mobile/src/screens/family/sessions.tsx", ["gigs.seatsLeft"]],
  ["apps/mobile/src/screens/family/apply.tsx", ["admissions.seatsLeft"]],
  ["apps/mobile/src/screens/shared/school-profile.tsx", ["admissions.seatsLeft"]],
  ["apps/mobile/src/screens/academics/registration.tsx", ["academics.seatsLeft", "academics.creditsN"]],
  ["apps/mobile/src/screens/staff/circular-reach.tsx", ["circulars.reminded"]],
];

const quoted = (source: string, key: string) => source.split(`"${key}"`).length - 1;

describe("TA-332: the counted sentences people see at one have a form for one", () => {
  it("TA-332: each of the seventeen has a form for one in English, Hindi and Marathi, and the English reads right at one", () => {
    for (const [key, { vars, reads }] of Object.entries(AT_ONE)) {
      expect(E.has(`${key}One`), key).toBe(true);
      expect(H.has(`${key}One`), key).toBe(true);
      expect(M.has(`${key}One`), key).toBe(true);
      expect(fill(E.get(`${key}One`), vars), key).toBe(reads);
    }
  });

  it("TA-332: Hindi and Marathi read right at one where their many form breaks", () => {
    // "Opens in": दिनों में and दिवसांत are the forms for many.
    expect(H.get("operatorCollege.opensInOne")).toBe("{count} दिन में खुलेगा");
    expect(M.get("operatorCollege.opensInOne")).toBe("{count} दिवसात सुरू");
    // Seats: सीटें is the Hindi plural; Marathi's उरल्या agrees with many, उरली with one.
    for (const key of ["admissions.seatsLeftOne", "gigs.seatsLeftOne", "academics.seatsLeftOne", "talks.seatsLeftOne"]) {
      expect(H.get(key), key).toMatch(/सीट /);
      expect(H.get(key), key).not.toMatch(/सीटें/);
    }
    expect(M.get("admissions.seatsLeftOne")).toBe("{seats} पैकी {remaining} जागा उरली");
    expect(M.get("academics.seatsLeftOne")).toBe("{n} जागा उरली");
  });

  it("TA-332: every page that draws one of them, on the web and the phone, chooses the form for one", () => {
    const missing: string[] = [];
    for (const [file, keys] of CALLERS) {
      const source = read(file);
      for (const key of keys) {
        const many = quoted(source, key);
        const one = quoted(source, `${key}One`);
        if (many === 0 || one !== many) missing.push(`${file}: ${key} drawn ${many} times, its form for one ${one}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("TA-332: a '{remaining} of {seats}' line chooses on the total, not on what is left", () => {
    for (const file of ["apps/web/src/app/(app)/explore/[schoolId]/page.tsx", "apps/web/src/app/(app)/explore/[schoolId]/apply/page.tsx", "apps/mobile/src/screens/family/apply.tsx", "apps/mobile/src/screens/shared/school-profile.tsx"]) {
      const source = read(file);
      expect(source, file).toMatch(/g\.seats === 1 \? t\("admissions\.seatsLeftOne"/);
      expect(source, file).not.toMatch(/g\.remaining === 1 \? t\("admissions\.seatsLeftOne"/);
    }
  });

  it("TA-332: a '{taken} of {seats} seats taken' line chooses on the total, so a one-to-one reads '0 of 1 seat taken' on the web, the phone and the calendar feed", () => {
    // Every one-to-one has one seat (gig-sessions.ts), so the provider's own list and the calendar feed show it at one.
    expect(fill(E.get("gigs.seatsOfOne"), { taken: 0, seats: 1 })).toBe("0 of 1 seat taken");
    expect(fill(E.get("expert.icsSeatsOne"), { taken: 1, seats: 1, schools: "ZZ" })).toBe("1 of 1 seat taken, pupils of: ZZ.");
    for (const key of ["gigs.seatsOfOne", "expert.icsSeatsOne"]) {
      expect(H.get(key), key).toMatch(/सीट ली गई/);
      expect(H.get(key), key).not.toMatch(/सीटें/);
      expect(M.get(key), key).toMatch(/जागा घेतली/);
    }
    const sites: [file: string, key: string, total: RegExp][] = [
      ["apps/web/src/components/gigs/provider-screen.tsx", "gigs.seatsOf", /s\.seats === 1 \? "gigs\.seatsOfOne" : "gigs\.seatsOf"/],
      ["apps/mobile/src/screens/shared/provider-sessions.tsx", "gigs.seatsOf", /s\.seats === 1 \? "gigs\.seatsOfOne" : "gigs\.seatsOf"/],
      ["apps/web/src/lib/expert-kyc.ts", "expert.icsSeats", /s\.seats === 1 \? "expert\.icsSeatsOne" : "expert\.icsSeats"/],
    ];
    for (const [file, key, total] of sites) {
      const source = read(file);
      expect(quoted(source, `${key}One`), file).toBe(quoted(source, key));
      expect(source, file).toMatch(total);
    }
  });
});

describe("TA-332: the cap is honest and the header tells the truth", () => {
  it("TA-332: the dictionary's header no longer claims that every counted sentence reads right at one", () => {
    const header = read("packages/i18n/src/en.ts").slice(0, 2000);
    expect(header).not.toMatch(/every counted string here reads correctly at\s+(?:\*\s+)?one/);
    expect(header).toMatch(/TA-332/);
    const engine = read("apps/web/src/lib/i18n/dictionary.ts").slice(0, 2000);
    expect(engine).not.toMatch(/Every counted string in `en\.ts` is written\s+(?:\*\s+)?to read correctly at one/);
  });

  it("TA-332: the ratchet counts every plural noun after a number, marks, credits, cards, workshops and beds among them, and its cap is the true count", () => {
    const ratchet = read("apps/web/tests/ta-contracts-i18n-tokens-dictionary.test.ts");
    const literal = /const COUNTED = \/(.+)\/;\n/.exec(ratchet)?.[1];
    expect(literal).toBeTruthy();
    const counted = new RegExp(literal!);
    for (const noun of ["marks", "credits", "cards", "workshops", "beds", "chapters", "lines", "slots", "copies", "periods", "postings", "families", "offers", "results"]) {
      expect(counted.test(`{count} ${noun}`), noun).toBe(true);
    }
    // A placeholder that holds a word, not a number, is not a count: "{school} offers {name} a place".
    expect(counted.test("{school} offers {name} a place")).toBe(false);
    const hasOne = (k: string) => E.has(`${k}One`) || (k.endsWith("Many") && E.has(`${k.slice(0, -"Many".length)}One`));
    const without = [...E.entries()].filter(([k, v]) => counted.test(v) && !k.endsWith("One") && !hasOne(k)).length;
    const ceiling = Number(/const COUNTED_WITHOUT_ONE_CEILING = (\d+);/.exec(ratchet)?.[1]);
    expect(ceiling).toBe(without);
  });
});
