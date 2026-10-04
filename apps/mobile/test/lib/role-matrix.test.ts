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
import { allowed, judge, moduleOff, tenantFromMe, type Answer, type Doc, type Tenant } from "../contract/role-matrix";

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
  STUDENT: ["/api/v1/academics/condonations", "/api/v1/academics/mentoring", "/api/v1/academics/registration", "/api/v1/academics/mine", "/api/v1/student/ledger", "/api/v1/student/scholarships", "/api/v1/exam-cell/mine", "/api/v1/voice", "/api/v1/library/eresources", "/api/v1/student/placement", "/api/v1/student/placement/resume"],
  ADMIN: ["/api/v1/academics/condonations", "/api/v1/academics/mentoring", "/api/v1/academics/registration", "/api/v1/principal/college", "/api/v1/accounts/overview", "/api/v1/exam-cell", "/api/v1/iqac/overview", "/api/v1/library/eresources", "/api/v1/placement/summary"],
  PRINCIPAL: ["/api/v1/academics/condonations", "/api/v1/academics/mentoring", "/api/v1/principal/college", "/api/v1/accounts/overview", "/api/v1/exam-cell", "/api/v1/iqac/overview", "/api/v1/library/eresources", "/api/v1/placement/summary"],
  LIBRARIAN: ["/api/v1/library/eresources"],
  ALUMNUS: ["/api/v1/voice"],
};

describe("the contract matrix's module and college rules (LOAD-6)", () => {
  it("the document marks a college's doors, module or none, and not a school's", () => {
    for (const path of ["/api/v1/student/ledger", "/api/v1/accounts/overview", "/api/v1/library/eresources", "/api/v1/academics/mine", "/api/v1/student/scholarships"]) expect({ path, college: op(path)["x-college"] }).toEqual({ path, college: true });
    for (const path of ["/api/v1/family/overview", "/api/v1/staff/today", "/api/v1/me"]) expect({ path, college: op(path)["x-college"] }).toEqual({ path });
  });

  it("reads where an actor stands from its own /me", () => {
    expect(northgate).toEqual({ schoolId: "s1", modules: new Set(SCHOOL_ON), college: false });
    expect(vidya?.college).toBe(true);
    expect(guardian).toEqual({ schoolId: null, modules: new Set(SCHOOL_ON), college: false });
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
