/**
 * The streams' presets and the programmes' awards: findings TA-274 and TA-496 of the testing analysis of
 * 13 November 2026, held by cases that FAIL while the defect stands and pass once it is fixed. Pure: the contracts,
 * the tile table and the stream records' page source are read; nothing is written.
 *
 *   TA-274  At a pharmacy college the registrar and the principal had no tile, menu entry or card leading to the
 *           clinical desk, though pharmacy is offered the clinical coordinator's duty and the office keeps its sites.
 *   TA-496  A B.Voc's award ladder could not be recorded: no advanced diploma, so the exits after years 1 and 2
 *           both read "diploma", and a ladder naming one was a 422.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { EXIT_AWARDS, exitPointSchema, presetUnion, programmeSaveSchema, STREAM_PRESETS, streamOffersDuty } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { tileHref } from "@/lib/stream-tiles";
import { AWARD_KEY } from "@/components/academics/parts";

describe("TA-274: a pharmacy college's office and head reach the clinical desk", () => {
  it("TA-274: every stream offered the clinical coordinator has the clinical postings tile, leading to /duties/clinical for both", () => {
    expect(streamOffersDuty("PHARMACY", "CLINICAL_COORDINATOR")).toBe(true);
    for (const stream of ["PHARMACY", "HEALTH_SCIENCES"] as const) {
      expect(STREAM_PRESETS[stream].homeTiles, stream).toContain("clinicalPostings");
    }
    expect(presetUnion(["PHARMACY"]).homeTiles).toContain("clinicalPostings");
    expect(tileHref("clinicalPostings", "ADMIN")).toBe("/duties/clinical");
    expect(tileHref("clinicalPostings", "PRINCIPAL")).toBe("/duties/clinical");
  });

  it("TA-274: the stream records' overview draws a clinical card opening the desk, with its words in three languages", () => {
    const page = readFileSync(join(__dirname, "../src/app/(app)/admin/stream-records/page.tsx"), "utf8");
    expect(page).toMatch(/data-record="clinical"/);
    expect(page).toMatch(/href="\/duties\/clinical"/);
    expect(page).toMatch(/streamOffersDuty\(code, "CLINICAL_COORDINATOR"\)/);
    for (const dict of [en, hi, mr]) expect(typeof dict.duties.clinical.openDesk).toBe("string");
  });
});

describe("TA-496: a B.Voc's diploma, advanced diploma and degree", () => {
  it("TA-496: an exit point may be an advanced diploma, and the ladder 1 DIPLOMA, 2 ADVANCED_DIPLOMA, 3 DEGREE parses", () => {
    expect(EXIT_AWARDS).toContain("ADVANCED_DIPLOMA");
    expect(exitPointSchema.safeParse({ afterYear: 2, award: "ADVANCED_DIPLOMA", credits: 120 }).success).toBe(true);
    const ladder = [
      { afterYear: 1, award: "DIPLOMA", credits: 60 },
      { afterYear: 2, award: "ADVANCED_DIPLOMA", credits: 120 },
      { afterYear: 3, award: "DEGREE", credits: 180 },
    ];
    const shape = programmeSaveSchema.safeParse({ departmentId: "c".padEnd(25, "a"), code: "BVOC", name: "ZZ B.Voc Retail", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", exitPoints: ladder });
    expect(shape.success ? null : shape.error.issues.filter((i) => i.path[0] === "exitPoints")).toBeNull();
  });

  it("TA-496: the award has its words in English, Hindi and Marathi, and the programmes page names it", () => {
    expect(AWARD_KEY.ADVANCED_DIPLOMA).toBe("academics.awardADVANCED_DIPLOMA");
    expect(en.academics.awardADVANCED_DIPLOMA).toBe("advanced diploma");
    expect(hi.academics.awardADVANCED_DIPLOMA).toBeTruthy();
    expect(mr.academics.awardADVANCED_DIPLOMA).toBeTruthy();
    for (const award of EXIT_AWARDS) expect(AWARD_KEY[award], award).toBeTruthy();
  });
});
