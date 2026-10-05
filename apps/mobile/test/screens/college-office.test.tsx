import { fireEvent, screen } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { StudentMoneyScreen } from "@/screens/college-office/money";
import { StudentScholarshipsScreen } from "@/screens/college-office/scholarships";
import { StudentAccountScreen } from "@/screens/college-office/student-account";
import { AccountsHomeScreen } from "@/screens/college-office/accounts-home";
import { AccountsLookupScreen } from "@/screens/college-office/lookup";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

/** /api/v1/me for a role at a college with these modules on. */
const atCollege = (role: RoleCode, modules: string[]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });

const ledger = (terms: { label: string; demand: number; receivable: number; paid: number }[]) => ({
  student: { studentMembershipId: "m1", name: "ZZ Ishaan Pathak", programmeId: "p1", category: "OBC", yearOfStudy: 1 },
  year: { id: "y1", name: "2026–27" },
  terms: terms.map((x, i) => ({ demandId: `d${i}`, label: x.label, dueDateKey: "2026-07-15", demandPaise: x.demand, scholarshipReceivablePaise: x.receivable, paidPaise: x.paid, netDuePaise: x.demand - x.receivable - x.paid, status: "OPEN", overdue: false, lateFeePaise: 0 })),
  claims: [],
  totals: { demandPaise: terms.reduce((a, x) => a + x.demand, 0), scholarshipReceivablePaise: terms.reduce((a, x) => a + x.receivable, 0), paidPaise: terms.reduce((a, x) => a + x.paid, 0), netDuePaise: terms.reduce((a, x) => a + x.demand - x.receivable - x.paid, 0) },
  todayKey: "2026-10-04",
});

const claim = (status: string, extra: Record<string, unknown> = {}) => ({
  id: `c-${status}`,
  studentMembershipId: "m1",
  studentName: "ZZ Ishaan Pathak",
  scheme: "OBC_POST_MATRIC",
  academicYear: "2026-27",
  portalApplicationId: "ZZMDBT0001",
  appliedAt: "2026-08-01T00:00:00.000Z",
  expectedPaise: 1_250_000,
  sanctionedPaise: null,
  sanctionedAt: null,
  disbursedPaise: null,
  disbursedAt: null,
  disbursementRef: null,
  status,
  documents: [],
  alumniGiftId: null,
  ageDays: 30,
  ...extra,
});

describe("a college student's money (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("shows each term net of the scholarship, and the totals", async () => {
    await mountStaff(<StudentMoneyScreen />, "STUDENT", { "GET /api/v1/student/ledger": () => json(ledger([{ label: "ZZ Odd semester", demand: 825_000, receivable: 825_000, paid: 0 }, { label: "ZZ Even semester", demand: 625_000, receivable: 175_000, paid: 0 }])) }, { me: atCollege("STUDENT", ["ACADEMICS", "SCHOLARSHIPS"]) });
    expect(await screen.findByText("ZZ Odd semester")).toBeTruthy();
    expect(screen.getByText("ZZ Even semester")).toBeTruthy();
    expect(screen.getByText("You owe")).toBeTruthy();
    expect(screen.getAllByText(/4,500/).length).toBeGreaterThan(0);
  });

  it("says nothing is asked yet, and offers the fees page", async () => {
    await mountStaff(<StudentMoneyScreen />, "STUDENT", { "GET /api/v1/student/ledger": () => json(ledger([])) }, { me: atCollege("STUDENT", ["ACADEMICS"]) });
    expect(await screen.findByText("Nothing asked yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "My fees" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/fees");
  });
});

describe("a guardian's view of a college child's money (5 Oct 2026)", () => {
  const child = (n: string, name: string) => ({ guardianshipId: `g${n}`, studentMembershipId: `m${n}`, studentUserId: `u${n}`, name, schoolId: "s1", schoolName: "ZZ Vidya College", leftAt: null, relation: "PARENT" });

  it("reads the first child's ledger, and the other child's refusal as the server says it", async () => {
    const { calls } = await mountStaff(<StudentMoneyScreen />, "PARENT", {
      "GET /api/v1/family/children": () => json({ children: [child("1", "ZZ Ishaan Pathak"), child("2", "ZZ Ananya Pathak")] }),
      "GET /api/v1/student/ledger": ({ url }) => (url.searchParams.get("childId") === "m2" ? json({ error: "ZZ Ananya has not shared her money with you.", code: "FORBIDDEN" }, 403) : json(ledger([{ label: "ZZ Odd semester", demand: 825_000, receivable: 0, paid: 400_000 }]))),
    }, { me: { ...me("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null }, modules: ["ACADEMICS"] } });
    expect(await screen.findByText("ZZ Odd semester")).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Ananya Pathak"));
    expect(await screen.findByText("ZZ Ananya has not shared her money with you.")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/student/ledger?childId=m2")).toBe(true);
  });
});

describe("a college student's scholarships (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("lists the claims with their status, and the schemes open to the student", async () => {
    await mountStaff(
      <StudentScholarshipsScreen />,
      "STUDENT",
      {
        "GET /api/v1/student/scholarships": () =>
          json({
            claims: [claim("SANCTIONED", { sanctionedPaise: 1_000_000 }), claim("LAPSED", { id: "c2", scheme: "EBC" })],
            schemes: [
              { scheme: "OBC_POST_MATRIC", categories: ["OBC"], incomeCeilingRupees: 100_000, coversPercent: 100, portal: "MAHADBT", eligible: true },
              { scheme: "GOI_POST_MATRIC_SC", categories: ["SC"], incomeCeilingRupees: 250_000, coversPercent: 100, portal: "MAHADBT", eligible: false },
            ],
            category: "OBC",
          }),
      },
      { me: atCollege("STUDENT", ["ACADEMICS", "SCHOLARSHIPS"]) },
    );
    expect(await screen.findByText("Sanctioned")).toBeTruthy();
    expect(screen.getByText("Lapsed")).toBeTruthy();
    expect(screen.getByText("Your category: OBC.")).toBeTruthy();
    expect(screen.getByText("Open to you")).toBeTruthy();
    expect(screen.queryByText("Post-matric scholarship (SC)")).toBeNull();
  });

  it("says there are no claims yet, and offers the money screen", async () => {
    await mountStaff(<StudentScholarshipsScreen />, "STUDENT", { "GET /api/v1/student/scholarships": () => json({ claims: [], schemes: [], category: null }) }, { me: atCollege("STUDENT", ["ACADEMICS", "SCHOLARSHIPS"]) });
    expect(await screen.findByText("No claims yet")).toBeTruthy();
    expect(screen.getByText("The office has not recorded your category.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "My money" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/money");
  });
});

describe("an adult student's own account (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("names what the guardians see, the two-step state and each clearance, and leads to the consent screen", async () => {
    await mountStaff(
      <StudentAccountScreen />,
      "STUDENT",
      {
        "GET /api/v1/student/account": () =>
          json({ consentApplies: true, grants: [{ grant: "MONEY", on: true }, { grant: "RESULTS", on: false }], twoFactorOn: false, exportPath: "/api/v1/family/export", noDues: [{ event: "EXAM_FORM", completed: false }, { event: "LEAVING", completed: true }] }),
      },
      { me: atCollege("STUDENT", ["ACADEMICS"]) },
    );
    expect(await screen.findByText("Fees and money")).toBeTruthy();
    expect(screen.getByText("Off")).toBeTruthy();
    expect(screen.getByText("Exam form")).toBeTruthy();
    expect(screen.getByText("Still open")).toBeTruthy();
    expect(screen.getByText("Cleared")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Change what they see" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/consent");
    await fireEvent.press(screen.getByRole("button", { name: "Manage my sign-in" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
  });

  it("tells a student whose guardians see everything so, and offers no change", async () => {
    await mountStaff(<StudentAccountScreen />, "STUDENT", { "GET /api/v1/student/account": () => json({ consentApplies: false, grants: [], twoFactorOn: true, exportPath: "/api/v1/family/export", noDues: [] }) }, { me: atCollege("STUDENT", ["ACADEMICS"]) });
    expect(await screen.findByText(/Your guardians see everything/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Change what they see" })).toBeNull();
  });
});

describe("the accounts desk at a glance (4 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("shows the year's demand, collection and dues, the receivable by age and the defaulters", async () => {
    await mountStaff(
      <AccountsHomeScreen />,
      "ACCOUNTS",
      {
        "GET /api/v1/accounts/overview": () =>
          json({
            year: { id: "y1", name: "2026–27" },
            collection: [{ programmeId: "p1", term: "ZZ Odd semester", demandPaise: 3_100_000, collectedPaise: 1_450_000, outstandingPaise: 1_650_000 }],
            defaulters: [{ studentMembershipId: "m3", name: "ZZ Omkar Jadhav", overduePaise: 825_000, oldestDueKey: "2026-07-15" }],
            receivableAgeing: [{ bucket: "0_30", claims: 1, receivablePaise: 1_250_000 }, { bucket: "31_90", claims: 0, receivablePaise: 0 }, { bucket: "91_180", claims: 0, receivablePaise: 0 }, { bucket: "OVER_180", claims: 0, receivablePaise: 0 }],
            incomeExpense: { feesCollectedPaise: 1_450_000, scholarshipsDisbursedPaise: 0, purchasesPaise: 0, payrollGrossPaise: 0 },
            pendingConcessions: 2,
          }),
      },
      { me: atCollege("ACCOUNTS", ["ALUMNI", "ACADEMICS", "SCHOLARSHIPS"]) },
    );
    expect(await screen.findByText("ZZ Omkar Jadhav")).toBeTruthy();
    expect(screen.getByText("Up to 30 days")).toBeTruthy();
    expect(screen.getByText("2 concessions wait for the principal")).toBeTruthy();
  });

  it("says nobody is overdue, and offers the college's feed", async () => {
    await mountStaff(
      <AccountsHomeScreen />,
      "ACCOUNTS",
      { "GET /api/v1/accounts/overview": () => json({ year: null, collection: [], defaulters: [], receivableAgeing: [], incomeExpense: { feesCollectedPaise: 0, scholarshipsDisbursedPaise: 0, purchasesPaise: 0, payrollGrossPaise: 0 }, pendingConcessions: 0 }) },
      { me: atCollege("ACCOUNTS", ["ALUMNI"]) },
    );
    expect(await screen.findByText("Nobody is overdue.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });
});

describe("the accounts desk's look-up on the phone (5 Oct 2026)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("finds a student by PRN and reads the ledger and the exam form's no-dues, desk by desk", async () => {
    const { calls } = await mountStaff(<AccountsLookupScreen />, "ACCOUNTS", {
      "GET /api/v1/accounts/lookup": ({ url }) => json({ items: url.searchParams.get("q") === "ZZPRN01" ? [{ studentMembershipId: "m1", name: "ZZ Ishaan Pathak", prn: "ZZPRN0123", studentCode: "ZZ-2025-01", programme: "ZZ BCom", yearOfStudy: 2 }] : [] }),
      "GET /api/v1/accounts/ledger/m1": () => json(ledger([{ label: "ZZ Odd semester", demand: 825_000, receivable: 0, paid: 400_000 }])),
      "GET /api/v1/accounts/no-dues/m1": () => json({ studentMembershipId: "m1", studentName: "ZZ Ishaan Pathak", event: "EXAM_FORM", completed: false, completedAt: null, lines: [{ desk: "ACCOUNTS", owedPaise: 425_000, itemsOut: 0, cleared: false, clearedByName: null, clearedAt: null }, { desk: "LIBRARY", owedPaise: 0, itemsOut: 0, cleared: true, clearedByName: "ZZ Librarian", clearedAt: "2026-10-01T05:00:00.000Z" }] }),
    }, { me: atCollege("ACCOUNTS", ["ACADEMICS"]) });
    await fireEvent.changeText(screen.getByLabelText("PRN, college code or name"), "ZZPRN01");
    await fireEvent.press(screen.getByRole("button", { name: "Look up" }));
    await fireEvent.press(await screen.findByText("ZZ Ishaan Pathak"));
    expect(await screen.findByText("ZZ Odd semester")).toBeTruthy();
    expect(await screen.findByText("No-dues · Exam form")).toBeTruthy();
    expect(screen.getByText("Still open")).toBeTruthy();
    expect(screen.getByText("Cleared")).toBeTruthy();
    expect(calls().map((c) => c.line)).toEqual(expect.arrayContaining(["GET /api/v1/accounts/lookup?q=ZZPRN01", "GET /api/v1/accounts/ledger/m1", "GET /api/v1/accounts/no-dues/m1?event=EXAM_FORM"]));
    // Nothing is written from here.
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("says when nobody matches, and the accounts home leads to the look-up", async () => {
    await mountStaff(<AccountsLookupScreen />, "ACCOUNTS", { "GET /api/v1/accounts/lookup": () => json({ items: [] }) }, { me: atCollege("ACCOUNTS", ["ACADEMICS"]) });
    await fireEvent.changeText(screen.getByLabelText("PRN, college code or name"), "ZZNOBODY");
    await fireEvent.press(screen.getByRole("button", { name: "Look up" }));
    expect(await screen.findByText('No student matches "ZZNOBODY"')).toBeTruthy();
  });
});
