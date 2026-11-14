/**
 * Two page pieces, findings of the testing analysis of 13 November 2026 (attendance-timetable batch), rendered to
 * markup on the server as the pages draw them; nothing touches the database.
 *
 *   TA-427  The exam cell's and the library's Flash (the library's is the one the placement and hostel frames draw)
 *           printed whatever ?ok= or ?error= said, so a link on the platform's own address made the page show any
 *           sentence in its own alert.
 *   TA-385  The studio card drew a badge for each submission and nothing else, so no member of staff could open a
 *           student's sheet or read their note from the product.
 */
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { StudioRow } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";
import { Flash as ExamCellFlash } from "@/components/exam-cell/parts";
import { Flash as LibraryFlash } from "@/components/library/parts";
import { StudioCard } from "@/components/studio/studio-card";

// The components are compiled with the classic JSX runtime under vitest, which reads React from the global scope.
(globalThis as { React?: typeof React }).React = React;

const FORGED = "ZZ Your results are withheld. Pay the release fee by UPI to 98000 00000.";

describe("TA-427: a notice from the address", () => {
  for (const [name, Flash] of [["exam cell", ExamCellFlash], ["library", LibraryFlash]] as const) {
    it(`TA-427: the ${name}'s Flash drops a sentence the product does not say and prints one it does`, () => {
      expect(renderToStaticMarkup(React.createElement(Flash, { error: FORGED }))).toBe("");
      expect(renderToStaticMarkup(React.createElement(Flash, { ok: FORGED }))).toBe("");
      const real = translator("mr")("placement.driveOpened");
      expect(renderToStaticMarkup(React.createElement(Flash, { ok: real }))).toContain(real);
    });
  }
});

const ID = (n: number) => `czzstudio${String(n).padStart(16, "0")}`;
const row = (state: "DRAFT" | "SUBMITTED" | "LATE", n: number) => ({
  studentMembershipId: ID(10 + n),
  name: `ZZ Student ${n}`,
  submissions: [{ stage: "FINAL_SUBMISSION" as const, state, submittedAt: state === "DRAFT" ? null : "2026-11-10T06:30:00.000Z", note: `ZZ note ${n}`, fileId: ID(20 + n), fileName: `zz-sheet-${n}.pdf` }],
  results: [],
});
const studio = {
  id: ID(1), offeringId: ID(2), courseCode: "ZZ-AR101", courseName: "ZZ Design Studio", termId: ID(3), termName: "ZZ Term", title: "ZZ Housing", brief: "", maxMarks: 100,
  coordinatorMembershipId: ID(4), coordinatorName: "ZZ Coordinator", facultyName: null, briefIssuedOn: "2026-08-01", interimOn: null, finalOn: "2026-11-10", juryOn: null,
  stages: [],
  students: [row("SUBMITTED", 1), row("LATE", 2), row("DRAFT", 3)],
  juries: [],
} as unknown as StudioRow;

describe("TA-385: the studio card as staff see it", () => {
  it("TA-385: a sheet handed in, on time or late, is a link to the file with the student's note beside it; a draft's is not", () => {
    const html = renderToStaticMarkup(React.createElement(StudioCard, { s: studio, t: translator("en"), locale: "en" }));
    expect(html).toContain(`href="/api/files/${ID(21)}"`);
    expect(html).toContain("zz-sheet-1.pdf");
    expect(html).toContain(`href="/api/files/${ID(22)}"`);
    expect(html).toContain("ZZ note 1");
    expect(html).not.toContain(`/api/files/${ID(23)}`);
    expect(html).not.toContain("ZZ note 3");
  });
});
