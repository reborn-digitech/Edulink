/**
 * The contract matrix's rules (test/contract/role-matrix.ts) against the
 * committed OpenAPI document, without a server, so the ordinary battery holds
 * them. LOAD-6 (4 Oct 2026): on prod the matrix failed PARENT, STUDENT, ADMIN,
 * PRINCIPAL, LIBRARIAN and ALUMNUS at ZZ Northgate on 34 college doors that
 * rightly answered 403 MODULE_OFF, because it read x-access and not x-module;
 * the cases below are those answers, each now judged fine, and the opposite
 * answers judged wrong so the rule did not simply loosen.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LIMITED_ROLES } from "@edulink/contracts";
import { allowed, judge, moduleOff, tenantFromMe, walkBudgetMs, walkedGets, WALK_MS_FLOOR, type Answer, type Doc, type Tenant } from "../contract/role-matrix";
import { callsInSource } from "./api-catalog.test";

const doc = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "api", "openapi.json"), "utf8")) as Doc;
const LIMITED = [...LIMITED_ROLES] as string[];
const op = (path: string) => {
  const o = doc.paths[path]?.get;
  if (!o) throw new Error(`no GET ${path} in the document`);
  return o;
};
const verdict = (path: string, role: string | null, tenant: Tenant, res: Answer) => {
  const want = allowed(op(path), role, LIMITED);
  return judge(want, moduleOff(op(path), want, tenant), res);
};

const SCHOOL_ON = ["TRANSPORT", "LIBRARY", "HOSTEL", "INVENTORY", "PAYROLL", "ALUMNI"] as const;
const COLLEGE_ON = [...SCHOOL_ON, "ACADEMICS", "EXAMS", "IQAC", "PLACEMENT", "ADMISSIONS", "SCHOLARSHIPS"] as const;
// What /api/v1/me said on the dev server for ZZ Northgate's actors, ZZ Vidya's faculty member and Northgate's guardian.
const northgate = tenantFromMe({ active: { schoolId: "s1", role: "STUDENT", membershipId: "m1" }, modules: [...SCHOOL_ON], institutionKind: "SCHOOL", contexts: [{ schoolId: "s1", schoolName: "ZZ Northgate School", role: "STUDENT", institutionKind: "SCHOOL" }] });
const vidya = tenantFromMe({ active: { schoolId: "c1", role: "FACULTY", membershipId: "m2" }, modules: [...COLLEGE_ON], institutionKind: "COLLEGE", contexts: [{ schoolId: "c1", schoolName: "ZZ Vidya College", role: "FACULTY", institutionKind: "COLLEGE" }] });
const guardian = tenantFromMe({ active: { schoolId: null, role: "PARENT", membershipId: null }, modules: [...SCHOOL_ON], institutionKind: null, contexts: [{ schoolId: "s1", schoolName: "ZZ Northgate School", role: "PARENT", institutionKind: "SCHOOL" }] });

const MODULE_OFF: Answer = { ok: false, status: 403, code: "MODULE_OFF" };
const OK: Answer = { ok: true };

// The 34 answers of loadlogs/contract.log, by actor.
const LOAD_6: Record<string, string[]> = {
  PARENT: ["/api/v1/student/ledger", "/api/v1/student/scholarships", "/api/v1/exam-cell/mine"],
  // The e-resources (/api/v1/library/eresources) were among them until owner-batch-item5 (27 Oct 2026) opened them at a school.
  STUDENT: ["/api/v1/academics/condonations", "/api/v1/academics/mentoring", "/api/v1/academics/registration", "/api/v1/academics/mine", "/api/v1/student/ledger", "/api/v1/student/scholarships", "/api/v1/exam-cell/mine", "/api/v1/voice", "/api/v1/student/placement", "/api/v1/student/placement/resume"],
  ADMIN: ["/api/v1/academics/condonations", "/api/v1/academics/mentoring", "/api/v1/academics/registration", "/api/v1/principal/college", "/api/v1/accounts/overview", "/api/v1/exam-cell", "/api/v1/iqac/overview", "/api/v1/placement/summary"],
  PRINCIPAL: ["/api/v1/academics/condonations", "/api/v1/academics/mentoring", "/api/v1/principal/college", "/api/v1/accounts/overview", "/api/v1/exam-cell", "/api/v1/iqac/overview", "/api/v1/placement/summary"],
  ALUMNUS: ["/api/v1/voice"],
};

describe("the contract matrix's module and college rules (LOAD-6)", () => {
  it("the document marks a college's doors, module or none, and not a school's", () => {
    for (const path of ["/api/v1/student/ledger", "/api/v1/accounts/overview", "/api/v1/hostel/college-table", "/api/v1/academics/mine", "/api/v1/student/scholarships"]) expect({ path, college: op(path)["x-college"] }).toEqual({ path, college: true });
    // The e-resources are a school's too since owner-batch-item5: no longer marked a college's.
    for (const path of ["/api/v1/family/overview", "/api/v1/staff/today", "/api/v1/me", "/api/v1/library/eresources"]) expect({ path, college: op(path)["x-college"] }).toEqual({ path });
  });

  it("reads where an actor stands from its own /me", () => {
    expect(northgate).toEqual({ schoolId: "s1", modules: new Set(SCHOOL_ON), college: false, kind: "SCHOOL" });
    expect(vidya?.college).toBe(true);
    expect(vidya?.kind).toBe("COLLEGE");
    expect(guardian).toEqual({ schoolId: null, modules: new Set(SCHOOL_ON), college: false, kind: null });
    // An expert or a recruiter: no school on the session and none among the contexts.
    expect(tenantFromMe({ active: { schoolId: null, role: "RECRUITER", membershipId: null }, modules: [], institutionKind: null, contexts: [] })).toBeNull();
  });

  it.each(Object.entries(LOAD_6))("%s at a school: the access list opens each door, and its 403 MODULE_OFF is the right answer", (role, paths) => {
    const tenant = role === "PARENT" ? guardian : northgate;
    for (const path of paths) {
      // What the old matrix judged by alone: the access list says 2xx, so MODULE_OFF failed.
      expect({ path, want: allowed(op(path), role, LIMITED) }).toEqual({ path, want: "2xx" });
      expect({ path, verdict: verdict(path, role, tenant, MODULE_OFF) }).toEqual({ path, verdict: null });
    }
  });

  it("a module the school has off must answer MODULE_OFF; a 200 there is wrong", () => {
    expect(verdict("/api/v1/academics/mine", "STUDENT", northgate, OK)).toBe("wanted 403 MODULE_OFF, got 2xx");
    expect(verdict("/api/v1/principal/college", "PRINCIPAL", northgate, OK)).toBe("wanted 403 MODULE_OFF, got 2xx");
  });

  it("at a college the same doors must open, and a school's own doors never answer MODULE_OFF", () => {
    expect(verdict("/api/v1/academics/mine", "STUDENT", vidya, MODULE_OFF)).toBe("wanted 2xx, got 403 (MODULE_OFF)");
    expect(verdict("/api/v1/student/ledger", "STUDENT", vidya, MODULE_OFF)).toBe("wanted 2xx, got 403 (MODULE_OFF)");
    expect(verdict("/api/v1/family/overview", "PARENT", guardian, MODULE_OFF)).toBe("wanted 2xx, got 403 (MODULE_OFF)");
    expect(verdict("/api/v1/staff/today", "TEACHER", northgate, MODULE_OFF)).toBe("wanted 2xx, got 403 (MODULE_OFF)");
  });

  it("a college's door without a module may open at a school too, and a refused role is judged by its 403 alone", () => {
    expect(verdict("/api/v1/student/ledger", "STUDENT", northgate, OK)).toBeNull();
    expect(verdict("/api/v1/accounts/overview", "TEACHER", northgate, { ok: false, status: 403, code: "FORBIDDEN" })).toBeNull();
    expect(verdict("/api/v1/accounts/overview", "TEACHER", northgate, OK)).toBe("wanted 403, got 2xx");
    // Signed out stays 401, wherever the door belongs.
    expect(verdict("/api/v1/academics/mine", null, null, { ok: false, status: 401, code: "UNAUTHORIZED" })).toBeNull();
  });

  it("a guardian's module door may answer MODULE_OFF (the child's school decides) but need not", () => {
    const door = Object.entries(doc.paths).find(([, ops]) => ops.get?.["x-module"] === "ACADEMICS" && Array.isArray(ops.get["x-access"]) && (ops.get["x-access"] as string[]).includes("PARENT"));
    expect(door).toBeDefined();
    const [path] = door!;
    expect(verdict(path, "PARENT", guardian, MODULE_OFF)).toBeNull();
    expect(verdict(path, "PARENT", guardian, OK)).toBeNull();
  });
  it("a duty's door (x-duties, 5 Oct 2026) opens to a FACULTY or HOD holding the duty, and to the office and the head without one", () => {
    const path = "/api/v1/duties/anti-ragging";
    expect(op(path)["x-duties"]).toEqual(["ANTI_RAGGING_SQUAD"]);
    expect(allowed(op(path), "FACULTY", LIMITED, ["LAB_INCHARGE", "ANTI_RAGGING_SQUAD"])).toBe("2xx");
    expect(allowed(op(path), "FACULTY", LIMITED, ["LAB_INCHARGE"])).toBe(403);
    expect(allowed(op(path), "HOD", LIMITED)).toBe(403);
    expect(allowed(op(path), "ADMIN", LIMITED)).toBe("2xx");
    expect(allowed(op(path), "STUDENT", LIMITED, ["ANTI_RAGGING_SQUAD"])).toBe(403);
    // The squad member at Vidya: a 200 is right; the HOD without the duty: a 403 is right, a 200 wrong.
    expect(judge(allowed(op(path), "FACULTY", LIMITED, ["ANTI_RAGGING_SQUAD"]), moduleOff(op(path), "2xx", vidya), OK)).toBeNull();
    expect(judge(allowed(op(path), "HOD", LIMITED), "no", OK)).toBe("wanted 403, got 2xx");
  });
});

describe("a door for another kind of institution (x-kinds, owner-batch-item5)", () => {
  const NOT_HERE: Answer = { ok: false, status: 404, code: "NOT_FOUND" };
  it("the document marks the campus doors a college keeps, and not those a school shares", () => {
    for (const path of ["/api/v1/library/college-table", "/api/v1/library/college-settings", "/api/v1/hostel/squad-rounds", "/api/v1/hostel/college-table"]) expect({ path, kinds: op(path)["x-kinds"] }).toEqual({ path, kinds: ["COLLEGE", "AUTONOMOUS_COLLEGE"] });
    expect(op("/api/v1/library/eresources")["x-kinds"]).toBeUndefined();
  });

  it("at a school every role is answered 404, the one the access list names and the one it does not; MODULE_OFF or a 403 there is wrong", () => {
    for (const role of ["ADMIN", "LIBRARIAN", "STUDENT", "TEACHER"]) {
      expect({ role, verdict: verdict("/api/v1/library/college-table", role, northgate, NOT_HERE) }).toEqual({ role, verdict: null });
    }
    expect(verdict("/api/v1/library/college-table", "ADMIN", northgate, MODULE_OFF)).toBe("wanted 404 (a door for another kind of institution), got 403 (MODULE_OFF)");
    expect(verdict("/api/v1/hostel/squad-rounds", "TEACHER", northgate, { ok: false, status: 403, code: "FORBIDDEN" })).toBe("wanted 404 (a door for another kind of institution), got 403 (FORBIDDEN)");
    expect(verdict("/api/v1/hostel/squad-rounds", "WARDEN", northgate, OK)).toBe("wanted 404 (a door for another kind of institution), got 2xx");
  });

  it("at a college the same doors answer by the access list; signed out stays 401", () => {
    expect(verdict("/api/v1/library/college-table", "IQAC", vidya, OK)).toBeNull();
    expect(verdict("/api/v1/library/college-table", "IQAC", vidya, NOT_HERE)).toBe("wanted 2xx, got 404 (NOT_FOUND)");
    expect(verdict("/api/v1/library/college-table", "STUDENT", vidya, { ok: false, status: 403, code: "FORBIDDEN" })).toBeNull();
    expect(verdict("/api/v1/library/college-table", null, null, { ok: false, status: 401, code: "UNAUTHORIZED" })).toBeNull();
  });

  it("the e-resources are a school's too: a pupil at a school with the library on must open them", () => {
    expect(verdict("/api/v1/library/eresources", "STUDENT", northgate, OK)).toBeNull();
    expect(verdict("/api/v1/library/eresources", "TEACHER", northgate, OK)).toBeNull();
    expect(verdict("/api/v1/library/eresources", "STUDENT", northgate, MODULE_OFF)).toBe("wanted 2xx, got 403 (MODULE_OFF)");
  });
});

describe("the walk's time budget (STREAMS-7)", () => {
  const doors = walkedGets(doc, callsInSource()).length;

  it("gives next dev's measured walk room: the slowest walk took 90 s on 5 Oct 2026", () => {
    expect(doors).toBeGreaterThan(10);
    // The old fixed 60 s timed out every walk on next dev.
    expect(walkBudgetMs(doors)).toBeGreaterThanOrEqual(135_000);
  });

  it("grows with the doors walked, never under the old floor, and the environment still sets it outright", () => {
    expect(walkBudgetMs(doors + 100)).toBeGreaterThan(walkBudgetMs(doors));
    expect(walkBudgetMs(1)).toBe(WALK_MS_FLOOR);
    expect(walkBudgetMs(doors, "900000")).toBe(900_000);
    expect(walkBudgetMs(doors, "")).toBe(walkBudgetMs(doors));
    expect(walkBudgetMs(doors, "nonsense")).toBe(walkBudgetMs(doors));
  });
});
