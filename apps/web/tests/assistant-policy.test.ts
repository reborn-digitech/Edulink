/**
 * The assistant's role policy table (src/lib/assistant/policy.ts), role by role, and the catalog's
 * doors agreeing with it: help for every role that belongs to a school, the tutor for STUDENT, TEACHER,
 * FACULTY and HOD only, the assessment rule for a pupil only, the tools each role may have read for it,
 * and EXPERT and RECRUITER outside. Pure.
 */
import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants";
import { ROLE_POLICY, TUTOR_ROLES, corpusBoardFor, gradeBandOf, policyFor } from "@/lib/assistant/policy";
import { TOOLS, toolsFor } from "@/lib/assistant/tools";
import { ASSISTANT } from "@/lib/api-catalog/assistant";
import { ENDPOINTS } from "@/lib/api-catalog";
import { permits } from "@/lib/api-catalog/types";

describe("the role policy", () => {
  it("has a row for every role", () => {
    expect(Object.keys(ROLE_POLICY).sort()).toEqual([...ROLES].sort());
  });

  it("gives the tutor to STUDENT, TEACHER, FACULTY and HOD, and to nobody else", () => {
    expect([...TUTOR_ROLES].sort()).toEqual(["FACULTY", "HOD", "STUDENT", "TEACHER"]);
    for (const role of ROLES) expect(ROLE_POLICY[role].tutor, role).toBe(["STUDENT", "TEACHER", "FACULTY", "HOD"].includes(role));
  });

  it("gives platform help to every role that belongs to a school, an alumnus too, and none to the expert or the recruiter", () => {
    for (const role of ROLES) expect(ROLE_POLICY[role].help, role).toBe(role !== "EXPERT" && role !== "RECRUITER");
    expect(policyFor(null)).toMatchObject({ help: false, tutor: false });
  });

  it("holds the assessment rule to a pupil alone: a teacher is never limited by sittings (§9.1)", () => {
    for (const role of ROLES) expect(ROLE_POLICY[role].assessed, role).toBe(role === "STUDENT");
    for (const role of ROLES) expect(ROLE_POLICY[role].gradeScoped, role).toBe(role === "STUDENT");
  });

  it("lets each role's tools read only doors the catalog lets that role pass", () => {
    for (const role of ROLES) {
      for (const name of ROLE_POLICY[role].tools) {
        const entry = ENDPOINTS.find((e) => e.method === "GET" && e.path === TOOLS[name].path);
        expect(entry, `${role} ${name}`).toBeDefined();
        expect(permits(entry!, role), `${role} may pass ${TOOLS[name].path}`).toBe(true);
      }
    }
  });

  it("chooses a tool from the question in code, never more than two, and only the role's own", () => {
    expect(toolsFor("TEACHER", "which registers are still to be marked today?")).toEqual(["registersDue"]);
    expect(toolsFor("PARENT", "how much of my child's fees is still to pay?")).toEqual(["childFees"]);
    expect(toolsFor("PARENT", "मेरे बच्चे की फीस कितनी बाकी है")).toEqual(["childFees"]);
    expect(toolsFor("STUDENT", "what is my timetable tomorrow")).toEqual(["myTimetable"]);
    expect(toolsFor("STUDENT", "what are my child's fees")).toEqual([]);
    expect(toolsFor("ALUMNUS", "my timetable")).toEqual([]);
    expect(toolsFor("PARENT", "timetable exams homework attendance fees").length).toBe(2);
  });

  it("names the class bands of the explanation and the books a board's pupil is searched in first", () => {
    expect([3, 7, 9, 12].map((g) => gradeBandOf(g))).toEqual(["PRIMARY", "MIDDLE", "SECONDARY", "SENIOR"]);
    expect(gradeBandOf(null, { college: true })).toBe("COLLEGE");
    expect(gradeBandOf(9, { teacher: true })).toBe("TEACHER");
    expect([corpusBoardFor("CBSE"), corpusBoardFor("MSBSHSE"), corpusBoardFor("NIOS"), corpusBoardFor("CISCE"), corpusBoardFor(null)]).toEqual(["NCERT", "Balbharati", "NIOS", "NCERT", "NCERT"]);
  });
});

describe("the catalog's assistant doors", () => {
  it("open the person's own doors to exactly the roles with platform help", () => {
    const own = ASSISTANT.filter((e) => e.path.startsWith("/api/v1/assistant"));
    expect(own.length).toBe(7);
    for (const e of own) for (const role of ROLES) expect(permits(e, role), `${e.method} ${e.path} ${role}`).toBe(ROLE_POLICY[role].help);
  });

  it("put opening and asking behind the ASSISTANT module, and never the office's switch, the opt-out or the teacher's switch", () => {
    const moduled = ASSISTANT.filter((e) => e.module === "ASSISTANT").map((e) => `${e.method} ${e.path}`).sort();
    expect(moduled).toEqual(["POST /api/v1/assistant/conversations", "POST /api/v1/assistant/conversations/{conversationId}/messages"]);
    for (const e of ASSISTANT.filter((x) => /admin|family|teacher/.test(x.path))) expect(e.module, e.path).toBeUndefined();
  });

  it("are all in the registry", () => {
    for (const e of ASSISTANT) expect(ENDPOINTS).toContain(e);
  });
});
