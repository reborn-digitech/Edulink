/**
 * The fixtures and the demo builder against the product's own rules (testing analysis of 13 November 2026, the
 * 'test-infra' batch). Nothing here builds a fixture or a demo college: the cases call the builders' pure parts and
 * read their text, so no ZZ or demo row is touched.
 *
 *   TA-583  zz:fixtures marked zz.expert1 verified by verifiedAt and left kycStatus NONE, so the fixture's experts
 *           broke the one truth: verified in the pairing form and the mentor queue, unverified in the marketplace
 *           and the paid gate.
 *   TA-485  The demo stream colleges wrote every programme at 75 %: the nursing college's INC programmes (80 %),
 *           the pharmacy college's PCI programmes (80 %) and the law college's BCI programmes (70 %) were held to
 *           the UGC's rule, and the roster said "under 75 %" for each.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defaultAttendanceThreshold } from "@edulink/contracts";
import { fixtureExpertStanding, keepsOneTruth, standingRepair } from "../scripts/zz-expert-standing";
import { STREAM_SPECS } from "../scripts/demo-college-stream-specs";

const read = (path: string) => readFileSync(join(__dirname, "..", path), "utf8");

describe("TA-583: the fixture's experts keep the one truth between verifiedAt and kycStatus", () => {
  it("TA-583: the fixture builds a verified expert verified on both columns, and an unverified one on neither", () => {
    const at = new Date("2026-11-14T06:00:00Z");
    expect(fixtureExpertStanding(true, at)).toEqual({ verifiedAt: at, verifiedBy: "zz-fixtures", kycStatus: "VERIFIED", kycDecidedAt: at });
    expect(fixtureExpertStanding(false, at)).toEqual({ verifiedAt: null, verifiedBy: null, kycStatus: "NONE", kycDecidedAt: null });
    expect(keepsOneTruth(fixtureExpertStanding(true, at))).toBe(true);
    expect(keepsOneTruth(fixtureExpertStanding(false, at))).toBe(true);
  });

  it("TA-583: a profile an earlier fixture made (verifiedAt set, kycStatus NONE) is put in step, keeping when it was verified", () => {
    const then = new Date("2026-09-01T10:00:00Z");
    const now = new Date("2026-11-14T06:00:00Z");
    expect(standingRepair({ verifiedAt: then, kycStatus: "NONE" }, true, now)).toEqual({ verifiedAt: then, verifiedBy: "zz-fixtures", kycStatus: "VERIFIED", kycDecidedAt: then });
    expect(standingRepair({ verifiedAt: then, kycStatus: "VERIFIED" }, true, now)).toBeNull();
    expect(standingRepair({ verifiedAt: null, kycStatus: "NONE" }, false, now)).toBeNull();
  });

  it("TA-583: buildExperts writes the standing on create and repairs an existing profile, never verifiedAt alone", () => {
    const text = read("scripts/zz-fixtures.ts");
    const start = text.indexOf("async function buildExperts(");
    const body = text.slice(start, text.indexOf("\n}\n", start));
    expect(body).toMatch(/\.\.\.fixtureExpertStanding\(spec\.verified, new Date\(\)\)/);
    expect(body).toMatch(/standingRepair\(existing, spec\.verified, new Date\(\)\)/);
    expect(body).not.toMatch(/verifiedAt: spec\.verified \? new Date\(\) : null/);
  });

  it("TA-583: the demo experts are named by the script that verified them, and an old demo profile is put in step", () => {
    const at = new Date("2026-11-14T06:00:00Z");
    const then = new Date("2026-09-01T10:00:00Z");
    expect(fixtureExpertStanding(true, at, "demo-seed")).toEqual({ verifiedAt: at, verifiedBy: "demo-seed", kycStatus: "VERIFIED", kycDecidedAt: at });
    expect(standingRepair({ verifiedAt: then, kycStatus: "NONE" }, true, at, "demo-schools")).toEqual({ verifiedAt: then, verifiedBy: "demo-schools", kycStatus: "VERIFIED", kycDecidedAt: then });
  });

  it("TA-583: demo:seed gives Anjali Rao the KYC state with verifiedAt, and repairs a profile an earlier run made", () => {
    const text = read("scripts/demo-seed.ts");
    expect(text).toMatch(/\.\.\.fixtureExpertStanding\(true, new Date\(\), "demo-seed"\)/);
    expect(text).toMatch(/standingRepair\(profile, true, new Date\(\), "demo-seed"\)/);
    expect(text).toMatch(/if \(standing\) await db\.expertProfile\.update\(\{ where: \{ id: profile\.id \}, data: standing \}\)/);
    expect(text).not.toMatch(/verifiedAt: new Date\(\),\s*verifiedBy: "demo-seed"/);
  });

  it("TA-583: demo:schools writes Vikram Sethi's standing on create and repairs an existing profile when it runs again", () => {
    const text = read("scripts/demo-schools.ts");
    const start = text.indexOf("async function buildExperts(");
    const body = text.slice(start, text.indexOf("\n}\n", start));
    expect(body).toMatch(/\.\.\.fixtureExpertStanding\(true, new Date\(\), "demo-schools"\)/);
    expect(body).toMatch(/standingRepair\(profile, true, new Date\(\), "demo-schools"\)/);
    expect(body).toMatch(/if \(standing\) await db\.expertProfile\.update\(\{ where: \{ id: profile\.id \}, data: standing \}\)/);
    expect(body).not.toMatch(/verifiedBy: "demo-schools"/);
  });

  it("TA-583: the data audit checks the badge's one truth for every expert profile", () => {
    const audit = read("tests/data-audit.test.ts");
    expect(audit).toMatch(/it\("expert-badge: /);
    expect(audit).toMatch(/keepsOneTruth\(e\)/);
  });
});

describe("TA-485: the demo colleges hold each programme to its regulator's attendance threshold", () => {
  it("TA-485: the regulators' defaults the demo now writes (INC and PCI 80, BCI 70, the rest 75)", () => {
    const health = STREAM_SPECS.find((s) => s.prefix === "sih")!;
    expect(health.depts.map((d) => [d.programme.regulator, defaultAttendanceThreshold(d.programme.regulator)])).toEqual([["INC", 80], ["INC", 80]]);
    const law = STREAM_SPECS.find((s) => s.prefix === "slc")!;
    expect(law.depts.map((d) => defaultAttendanceThreshold(d.programme.regulator))).toEqual([70, 70]);
  });

  it("TA-485: the demo builder writes the regulator's threshold on create and on update, and the roster names it", () => {
    const text = read("scripts/demo-college-stream.ts");
    const upsert = text.split("\n").find((line) => line.includes("db.programme.upsert("))!;
    expect(upsert).toBeDefined();
    expect(upsert).not.toMatch(/attendanceThreshold: 75/);
    expect(upsert).toMatch(/create: \{[^}]*attendanceThreshold: defaultAttendanceThreshold\(p\.regulator\)/);
    expect(upsert).toMatch(/update: \{[^}]*attendanceThreshold: defaultAttendanceThreshold\(p\.regulator\)/);
    expect(text).not.toMatch(/notes\.push\("under 75 % in one course"\)/);
  });

  it("TA-485: demo:college-check holds every programme to its regulator's default, and the roster says 80 % for the nursing college", () => {
    expect(read("scripts/demo-college-check.ts")).toMatch(/attendanceThreshold === defaultAttendanceThreshold\(p\.regulator\)/);
    const roster = readFileSync(join(__dirname, "..", "..", "..", "docs", "demo-schools.md"), "utf8");
    const line = (email: string) => roster.split("\n").find((l) => l.startsWith(`| ${email} `)) ?? "";
    expect(line("sih.student05@demo.relay.test")).toMatch(/under 80 % in one course/);
    expect(line("scp.student05@demo.relay.test")).toMatch(/under 80 % in one course/);
    expect(line("slc.student05@demo.relay.test")).toMatch(/under 70 % in one course/);
    expect(line("sim.student05@demo.relay.test")).toMatch(/under 75 % in one course/);
  });
});
