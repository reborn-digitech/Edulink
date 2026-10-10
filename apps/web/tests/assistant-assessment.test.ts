/**
 * The assessment rule (src/lib/assistant/assessment-rule.ts, §5 Phase B, §9.1–9.5), its four cases and
 * the edges: an open sitting closes the topic; a hand-in assignment gets a hint first; the same
 * question asked again right after its hint gets the worked answer; the teacher's switch keeps it a
 * hint; a question matching nothing of the pupil's own is answered in full. Pure.
 */
import { describe, expect, it } from "vitest";
import { ASSESSMENT_RULES, cosine, decideAssessment, type AssessmentItem } from "@/lib/assistant/assessment-rule";
import { ASSESSMENT_MATCH_THRESHOLD } from "@/lib/assistant/config";

const homework: AssessmentItem = { kind: "HAND_IN", id: "a1", text: "Newton's laws worksheet", assignmentId: "a1", workedAllowed: true };
const lockedHomework: AssessmentItem = { ...homework, id: "a2", assignmentId: "a2", workedAllowed: false };
const contest: AssessmentItem = { kind: "CONTEST", id: "c1", text: "Science olympiad: forces" };
const near = ASSESSMENT_MATCH_THRESHOLD + 0.05;
const far = ASSESSMENT_MATCH_THRESHOLD - 0.05;

describe("the assessment rule", () => {
  it("is one table: four kinds close the topic, the hand-in gives a hint first", () => {
    expect(ASSESSMENT_RULES.map((r) => `${r.kind}:${r.effect}`)).toEqual(["CONTEST:CLOSED", "TIMED_PRACTICE:CLOSED", "SCHOOL_EXAM:CLOSED", "COLLEGE_EXAM_SESSION:CLOSED", "HAND_IN:HINT_FIRST"]);
  });

  it("case 1: an open contest or sitting on the topic closes it, ahead of any hint", () => {
    const d = decideAssessment({ matches: [{ item: homework, similarity: near + 0.02 }, { item: contest, similarity: near }], previous: null });
    expect(d.kind).toBe("CLOSED");
    for (const kind of ["TIMED_PRACTICE", "SCHOOL_EXAM", "COLLEGE_EXAM_SESSION"] as const) {
      expect(decideAssessment({ matches: [{ item: { kind, id: kind, text: "x" }, similarity: near }], previous: null }).kind).toBe("CLOSED");
    }
  });

  it("case 2: a question matching a hand-in assignment gets a hint first", () => {
    const d = decideAssessment({ matches: [{ item: homework, similarity: near }], previous: null });
    expect(d).toMatchObject({ kind: "HINT", secondAsk: false });
  });

  it("case 3: the same question asked again right after its hint, in the same conversation, gets the worked answer", () => {
    const d = decideAssessment({ matches: [{ item: homework, similarity: near }], previous: { sameQuestion: true, hintForAssignmentId: "a1" } });
    expect(d.kind).toBe("WORKED");
    // A rephrase, or a hint that was for another assignment, is a first ask again.
    expect(decideAssessment({ matches: [{ item: homework, similarity: near }], previous: { sameQuestion: false, hintForAssignmentId: "a1" } }).kind).toBe("HINT");
    expect(decideAssessment({ matches: [{ item: homework, similarity: near }], previous: { sameQuestion: true, hintForAssignmentId: "a9" } }).kind).toBe("HINT");
  });

  it("case 4: the teacher's switch off keeps the second ask a hint", () => {
    const d = decideAssessment({ matches: [{ item: lockedHomework, similarity: near }], previous: { sameQuestion: true, hintForAssignmentId: "a2" } });
    expect(d).toMatchObject({ kind: "HINT", secondAsk: true });
  });

  it("answers in full a question matching nothing of the pupil's own", () => {
    expect(decideAssessment({ matches: [{ item: homework, similarity: far }, { item: contest, similarity: far }], previous: null }).kind).toBe("FREE");
    expect(decideAssessment({ matches: [], previous: null }).kind).toBe("FREE");
  });

  it("measures by cosine", () => {
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosine([0, 0], [1, 0])).toBe(0);
  });
});
