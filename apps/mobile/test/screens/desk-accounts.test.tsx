import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { FeeStructuresScreen } from "@/screens/college-office/structures";
import { ScholarshipClaimsScreen } from "@/screens/college-office/claims";
import { NoDuesDeskScreen } from "@/screens/college-office/no-dues";
import { ConcessionsScreen } from "@/screens/college-office/concessions";
import { AccountsHomeScreen } from "@/screens/college-office/accounts-home";
import { AccountsLookupScreen } from "@/screens/college-office/lookup";
import { StaffPayroll } from "@/screens/staff/payroll";
import { StaffInventory } from "@/screens/staff/inventory";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const atCollege = (role: RoleCode, modules: string[] = ["ACADEMICS", "SCHOLARSHIPS", "PAYROLL", "INVENTORY"]) => ({ ...me(role), contexts: [{ schoolId: "s1", schoolName: "ZZ Vidya College", role }], modules, institutionKind: "COLLEGE" });
const iso = "2026-10-04T05:00:00.000Z";

describe("the fee structures on the phone (the parity batch, 10 Oct 2026)", () => {
  it("lists each structure with its terms, total, slabs and students", async () => {
    await mountStaff(<FeeStructuresScreen />, "ACCOUNTS", {
      "GET /api/v1/accounts/fee-structures": () =>
        json({
          year: { id: "y1", name: "2026–27" },
          structures: [{ id: "s1", name: "ZZ BSc year 1 open", programmeId: "p1", yearOfStudy: 1, category: "OPEN", approvalRef: "ZZ FRA/2026/11", published: true, totalPaise: 4_500_000, terms: [{ label: "ZZ Odd semester", dueDateKey: "2026-07-15", totalPaise: 2_500_000 }, { label: "ZZ Even semester", dueDateKey: "2027-01-15", totalPaise: 2_000_000 }], lateFeeSlabs: [{ afterDays: 30, paise: 50_000 }], students: 42 }],
        }),
    }, { me: atCollege("ACCOUNTS") });
    expect(await screen.findByText("ZZ BSc year 1 open")).toBeTruthy();
    expect(screen.getByText("Published")).toBeTruthy();
    expect(screen.getByText(/Year 1 · Open · Approval reference ZZ FRA\/2026\/11 · 42 students on it/)).toBeTruthy();
    expect(screen.getByText("ZZ Odd semester")).toBeTruthy();
    expect(screen.getByText(/Late fee: ₹500 after 30 days\./)).toBeTruthy();
  });
});

const claim = (id: string, status: string, over: Record<string, unknown> = {}) => ({ id, studentMembershipId: "m1", studentName: "ZZ Ishaan Pathak", scheme: "OBC_POST_MATRIC", academicYear: "2026-27", portalApplicationId: "ZZMDBT0001", appliedAt: iso, expectedPaise: 1_250_000, sanctionedPaise: null, sanctionedAt: null, disbursedPaise: null, disbursedAt: null, disbursementRef: null, status, documents: [], alumniGiftId: null, ageDays: 30, ...over });

describe("the scholarship claims on the phone", () => {
  it("shows the waiting claims first, sanctions one with the amount and day, and disburses another with a reference", async () => {
    const { calls } = await mountStaff(<ScholarshipClaimsScreen />, "ACCOUNTS", {
      "GET /api/v1/college/scholarships/claims": () => json({ items: [claim("c1", "APPLIED"), claim("c2", "SANCTIONED", { studentName: "ZZ Ananya", sanctionedPaise: 1_000_000 }), claim("c3", "DISBURSED", { studentName: "ZZ Done", disbursedPaise: 1_000_000 })] }),
      "POST /api/v1/college/scholarships/claims/c1": () => json(claim("c1", "SANCTIONED", { sanctionedPaise: 1_250_000 })),
      "POST /api/v1/college/scholarships/claims/c2": () => json(claim("c2", "DISBURSED", { studentName: "ZZ Ananya", disbursedPaise: 1_000_000 })),
    }, { me: atCollege("ACCOUNTS") });
    expect(await screen.findByText("ZZ Ishaan Pathak")).toBeTruthy();
    expect(screen.queryByText("ZZ Done")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Sanction: ZZ Ishaan Pathak" }));
    await fireEvent.changeText(screen.getByLabelText("Day"), "2026-10-10");
    await fireEvent.press(screen.getByRole("button", { name: "Sanction" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/college/scholarships/claims/c1")?.body).toEqual({ action: "SANCTION", amountPaise: 1_250_000, on: "2026-10-10" }));
    expect(await screen.findByText("ZZ Ishaan Pathak's claim is now: Sanctioned.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Disburse: ZZ Ananya" }));
    const disburse = screen.getByRole("button", { name: "Disburse" });
    expect(disburse.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Bank reference"), "ZZUTR0001");
    await fireEvent.press(screen.getByRole("button", { name: "Disburse" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/college/scholarships/claims/c2")?.body).toMatchObject({ action: "DISBURSE", amountPaise: 1_000_000, reference: "ZZUTR0001" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Disbursed" }));
    expect(await screen.findByText("ZZ Done")).toBeTruthy();
  });

  it("gives the principal the list and no buttons, and says scholarships are off where they are", async () => {
    await mountStaff(<ScholarshipClaimsScreen />, "PRINCIPAL", { "GET /api/v1/college/scholarships/claims": () => json({ items: [claim("c1", "APPLIED")] }) }, { me: atCollege("PRINCIPAL") });
    expect(await screen.findByText("ZZ Ishaan Pathak")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Sanction/ })).toBeNull();
  });
});

const noDues = (over: Record<string, unknown> = {}) => ({ studentMembershipId: "m1", studentName: "ZZ Ishaan Pathak", event: "EXAM_FORM", completed: false, completedAt: null, lines: [{ desk: "ACCOUNTS", owedPaise: 425_000, itemsOut: 0, cleared: false, clearedByName: null, clearedAt: null }, { desk: "LIBRARY", owedPaise: 0, itemsOut: 2, cleared: false, clearedByName: null, clearedAt: null }, { desk: "HOSTEL", owedPaise: 0, itemsOut: 0, cleared: true, clearedByName: "ZZ Warden", clearedAt: iso }], ...over });

describe("the no-dues desk on the phone", () => {
  it("lists the students held up for the event, opens one, and the library clears its own line with a note while items are out", async () => {
    const { calls } = await mountStaff(<NoDuesDeskScreen />, "LIBRARIAN", {
      "GET /api/v1/accounts/no-dues": ({ url }) => json({ items: url.searchParams.get("event") === "EXAM_FORM" ? [{ studentMembershipId: "m1", studentName: "ZZ Ishaan Pathak", completed: false, uncleared: ["ACCOUNTS", "LIBRARY"] }] : [] }),
      "GET /api/v1/accounts/no-dues/m1": () => json(noDues()),
      "POST /api/v1/accounts/no-dues/m1": () => json(noDues({ lines: [{ desk: "ACCOUNTS", owedPaise: 425_000, itemsOut: 0, cleared: false, clearedByName: null, clearedAt: null }, { desk: "LIBRARY", owedPaise: 0, itemsOut: 2, cleared: true, clearedByName: "ZZ Librarian", clearedAt: iso }] })),
    }, { me: atCollege("LIBRARIAN", ["ACADEMICS", "LIBRARY"]) });
    expect(await screen.findByText("Still open (1)")).toBeTruthy();
    await fireEvent.press(screen.getByText("ZZ Ishaan Pathak"));
    expect(await screen.findByText("ZZ Ishaan Pathak · Exam form")).toBeTruthy();
    // The library's line alone carries the button; the accounts line is another desk's.
    expect(screen.getByRole("button", { name: "Clear this line: Library" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear this line: Accounts" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Clear this line: Library" }));
    const clear = screen.getByRole("button", { name: "Clear this line" });
    expect(clear.props.accessibilityState?.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Note"), "ZZ books returned at the desk");
    await fireEvent.press(screen.getByRole("button", { name: "Clear this line" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/accounts/no-dues/m1")?.body).toEqual({ event: "EXAM_FORM", desk: "LIBRARY", note: "ZZ books returned at the desk" }));
    expect(await screen.findByText("ZZ Ishaan Pathak's line is cleared.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Leaving the college" }));
    expect(await screen.findByText("Nobody is held up")).toBeTruthy();
  });
});

describe("concessions on the phone", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = {};
  });

  it("the accounts desk grants one to the student handed over from the look-up, in the web's units", async () => {
    mockRouter.params = { studentMembershipId: "m1", name: "ZZ Ishaan Pathak" };
    const { calls } = await mountStaff(<ConcessionsScreen />, "ACCOUNTS", {
      "GET /api/v1/accounts/concessions": () => json({ items: [] }),
      "GET /api/v1/accounts/settings": () => json({ concessionLimitPaise: 1_000_000 }),
      "POST /api/v1/accounts/concessions": () => json({ id: "k1", approvalStatus: "PENDING", valuePaise: 1_125_000 }),
    }, { me: atCollege("ACCOUNTS") });
    expect(await screen.findByText("Nothing waits for the principal")).toBeTruthy();
    expect(screen.getByText("ZZ Ishaan Pathak")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Percentage or amount"), "12.5");
    await fireEvent.changeText(screen.getByLabelText("Reason"), "ZZ merit");
    await fireEvent.changeText(screen.getByLabelText("Sanctioned by"), "ZZ Governing body");
    await fireEvent.press(screen.getByRole("button", { name: "Grant" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/accounts/concessions")?.body).toEqual({ studentMembershipId: "m1", headId: null, kind: "PERCENT", value: 1250, reason: "ZZ merit", authority: "ZZ Governing body" }));
    expect(await screen.findByText("The concession is above the limit and waits for the principal.")).toBeTruthy();
  });

  it("the principal approves one from the queue", async () => {
    const { calls } = await mountStaff(<ConcessionsScreen />, "PRINCIPAL", {
      "GET /api/v1/accounts/concessions": () => json({ items: [{ id: "k1", studentMembershipId: "m1", studentName: "ZZ Ishaan Pathak", kind: "PERCENT", value: 1250, valuePaise: 1_125_000, reason: "ZZ merit", authority: "ZZ Governing body", grantedBy: "ZZ Accounts", createdAt: iso }] }),
      "GET /api/v1/accounts/settings": () => json({ concessionLimitPaise: 1_000_000 }),
      "POST /api/v1/accounts/concessions/k1/decide": () => json({ ok: true }),
    }, { me: atCollege("PRINCIPAL") });
    expect(await screen.findByText(/12.5 % · Worth ₹11,250/)).toBeTruthy();
    expect(screen.queryByText("Grant a concession")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Approve: ZZ Ishaan Pathak" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/accounts/concessions/k1/decide")?.body).toEqual({ approve: true }));
    expect(await screen.findByText("Approved and applied.")).toBeTruthy();
  });
});

describe("the accounts home and the look-up lead to the desk's own screens", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("the home opens the concessions, no-dues, claims, structures and the ledger", async () => {
    await mountStaff(<AccountsHomeScreen />, "ACCOUNTS", { "GET /api/v1/accounts/overview": () => json({ year: null, collection: [], defaulters: [], receivableAgeing: [], incomeExpense: { feesCollectedPaise: 0, scholarshipsDisbursedPaise: 0, purchasesPaise: 0, payrollGrossPaise: 0 }, pendingConcessions: 3 }) }, { me: atCollege("ACCOUNTS") });
    await fireEvent.press(await screen.findByRole("button", { name: "Concessions, Waiting for the principal: 3" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/concessions");
    await fireEvent.press(screen.getByRole("button", { name: "Scholarships" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/scholarship-claims");
    await fireEvent.press(screen.getByRole("button", { name: "Fees" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/fees");
  });

  it("the look-up shows the ledger's claims and hands the student to the concession screen", async () => {
    await mountStaff(<AccountsLookupScreen />, "ACCOUNTS", {
      "GET /api/v1/accounts/lookup": () => json({ items: [{ studentMembershipId: "m1", name: "ZZ Ishaan Pathak", prn: "ZZPRN0123", studentCode: "ZZ-2025-01", programme: "ZZ BCom", yearOfStudy: 2 }] }),
      "GET /api/v1/accounts/ledger/m1": () => json({ student: { studentMembershipId: "m1", name: "ZZ Ishaan Pathak", programmeId: "p1", category: "OBC", yearOfStudy: 2 }, year: { id: "y1", name: "2026–27" }, terms: [], claims: [{ id: "c1", scheme: "OBC_POST_MATRIC", status: "SANCTIONED", receivablePaise: 1_000_000, sanctionedPaise: 1_000_000, disbursedPaise: null }], totals: { demandPaise: 0, scholarshipReceivablePaise: 1_000_000, paidPaise: 0, netDuePaise: 0 }, todayKey: "2026-10-10" }),
      "GET /api/v1/accounts/no-dues/m1": () => json(noDues()),
    }, { me: atCollege("ACCOUNTS") });
    await fireEvent.changeText(screen.getByLabelText("PRN, college code or name"), "ZZPRN");
    await fireEvent.press(screen.getByRole("button", { name: "Look up" }));
    await fireEvent.press(await screen.findByText("ZZ Ishaan Pathak"));
    expect(await screen.findByText("Post-matric scholarship (OBC)")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Grant a concession" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/concessions", params: { studentMembershipId: "m1", name: "ZZ Ishaan Pathak" } });
  });
});

describe("the office's approval queues: advances and the stores' asks", () => {
  it("the accounts desk records an advance ask with its instalment", async () => {
    const summary = { settings: { pfEnabled: false, pfOnFullBasic: false, esiEnabled: false, ptState: "NONE", employerName: "ZZ Vidya College", pfEstablishmentCode: "", esiEmployerCode: "" }, staffCount: 10, withSalary: 8, structures: 2, runs: [], costByMonth: [], costByDepartment: [], latestLockedMonth: null, advancesWaiting: 1, canEdit: true };
    const { calls } = await mountStaff(<StaffPayroll />, "ACCOUNTS", {
      "GET /api/v1/admin/payroll": () => json(summary),
      "GET /api/v1/admin/payroll/advances": () => json({ advances: [{ id: "a1", membershipId: "m7", name: "ZZ Peon", amountPaise: 1_000_000, reason: "ZZ medical", status: "REQUESTED", monthlyRecoveryPaise: null, recoveredPaise: 0, outstandingPaise: 0, decisionNote: null, createdAt: iso, decidedAt: null }], canEdit: true }),
      "POST /api/v1/admin/payroll/advances/decide": () => json({ id: "a1", membershipId: "m7", name: "ZZ Peon", amountPaise: 1_000_000, reason: "ZZ medical", status: "RECORDED", monthlyRecoveryPaise: 100_000, recoveredPaise: 0, outstandingPaise: 1_000_000, decisionNote: null, createdAt: iso, decidedAt: iso }),
    }, { me: atCollege("ACCOUNTS") });
    await fireEvent.press(await screen.findByRole("button", { name: "Record it: ZZ Peon" }));
    await fireEvent.changeText(screen.getByLabelText("Taken back each month"), "1000");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/admin/payroll/advances/decide")?.body).toEqual({ advanceId: "a1", decision: "RECORD", amountPaise: 1_000_000, monthlyRecoveryPaise: 100_000, note: "" }));
    expect(await screen.findByText("The advance is recorded.")).toBeTruthy();
  });

  it("the office gives an ask from a place the stores keep, and the head only reads the asks", async () => {
    const request = { id: "r1", requesterMembershipId: "m7", requesterName: "ZZ Teacher", itemCode: "CHK", itemName: "ZZ Chalk", quantity: 2, note: "", status: "PENDING", decisionNote: null, decidedAt: null, createdAt: iso };
    const summary = (canEdit: boolean) => ({ counts: { items: 1, lowStock: 0, assets: 0, inRepair: 0, openRequests: 1 }, lowStock: [], assetsByStatus: {}, costPaise: 0, bookValuePaise: 0, recentMovements: [], openRequests: [request], canEdit });
    const { calls } = await mountStaff(<StaffInventory />, "ADMIN", {
      "GET /api/v1/admin/inventory": () => json(summary(true)),
      "GET /api/v1/admin/inventory/setup": () => json({ categories: [], vendors: [], locations: ["ZZ Store room"], staff: [], canEdit: true }),
      "POST /api/v1/admin/inventory/requests/decide": () => json({ ...request, status: "FULFILLED" }),
    }, { me: atCollege("ADMIN") });
    await fireEvent.press(await screen.findByRole("button", { name: "Give it: ZZ Teacher" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Store room" }));
    await fireEvent.press(screen.getByRole("button", { name: "Give it" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/admin/inventory/requests/decide")?.body).toEqual({ requestId: "r1", decision: "FULFIL", location: "ZZ Store room", note: "" }));
    expect(await screen.findByText("Given, and issued from the stock.")).toBeTruthy();
    await mountStaff(<StaffInventory />, "PRINCIPAL", { "GET /api/v1/admin/inventory": () => json(summary(false)) }, { me: atCollege("PRINCIPAL") });
    expect(await screen.findByText("ZZ Teacher")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Give it/ })).toBeNull();
  });
});
