import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { StaffInventory } from "@/screens/staff/inventory";
import { StaffPayroll } from "@/screens/staff/payroll";
import { MyPayslips } from "@/screens/shared/payslips";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

beforeEach(() => {
  mockRouter.push.mockClear();
  (Sharing.shareAsync as jest.Mock).mockClear();
});

const INVENTORY = "GET /api/v1/admin/inventory";
const PAYROLL = "GET /api/v1/admin/payroll";
const MINE = "GET /api/v1/account/payslips";
const at = "2026-10-01T05:00:00.000Z";

const item = { id: "i1", code: "ZZ-CHALK", name: "ZZ White chalk", categoryId: null, categoryName: null, unit: "box", reorderLevel: 5, kind: "CONSUMABLE", onHand: 2, stock: [{ location: "ZZ Store", quantity: 2 }], low: true, archived: false };
const SUMMARY = {
  counts: { items: 3, lowStock: 1, assets: 3, inRepair: 1, openRequests: 1 },
  lowStock: [item],
  assetsByStatus: { IN_USE: 1, IN_STORE: 1, REPAIR: 1, DISPOSED: 0 },
  costPaise: 11_500_000,
  bookValuePaise: 9_000_000,
  recentMovements: [{ id: "mv1", itemCode: "ZZ-CHALK", itemName: "ZZ White chalk", unit: "box", kind: "ISSUE", delta: -2, location: "ZZ Store", toName: "ZZ Teacher", toRoom: null, toDepartment: null, reference: null, note: "", byName: "ZZ Office", at }],
  openRequests: [{ id: "r1", requesterMembershipId: "m2", requesterName: "ZZ Teacher", itemCode: "ZZ-MARKER", itemName: "ZZ Marker", quantity: 4, note: "", status: "PENDING", decisionNote: null, decidedAt: null, createdAt: at }],
  canEdit: true,
};
const EMPTY_SUMMARY = { ...SUMMARY, counts: { items: 0, lowStock: 0, assets: 0, inRepair: 0, openRequests: 0 }, lowStock: [], recentMovements: [], openRequests: [], costPaise: 0, bookValuePaise: 0, canEdit: false };

const settings = { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "", pfEstablishmentCode: "", esiEmployerCode: "" };
const PAY = {
  settings,
  staffCount: 4,
  withSalary: 3,
  structures: 1,
  runs: [
    { month: "2026-09", status: "DRAFT", lockedAt: null, headcount: 3, grossPaise: 9_000_000, deductionsPaise: 900_000, employerPaise: 500_000, netPaise: 8_100_000 },
    { month: "2026-08", status: "LOCKED", lockedAt: at, headcount: 3, grossPaise: 8_800_000, deductionsPaise: 880_000, employerPaise: 480_000, netPaise: 7_920_000 },
    // owner-batch-item2b: a run whose every slip the school recorded paid.
    { month: "2026-07", status: "PAID", lockedAt: at, headcount: 3, grossPaise: 8_800_000, deductionsPaise: 880_000, employerPaise: 480_000, netPaise: 7_920_000 },
  ],
  costByMonth: [{ month: "2026-08", grossPaise: 8_800_000, employerPaise: 480_000, netPaise: 7_920_000, headcount: 3 }],
  costByDepartment: [{ department: "TEACHER", grossPaise: 6_000_000, employerPaise: 300_000, headcount: 2 }],
  latestLockedMonth: "2026-08",
  advancesWaiting: 1,
  canEdit: true,
};

const MY = {
  name: "ZZ Teacher",
  structure: { name: "ZZ Teaching staff", effectiveFrom: "2026-04-01", basicPaise: 1_500_000, monthlyGrossPaise: 2_250_000, components: [{ code: "BASIC", kind: "EARNING", label: "", monthlyPaise: 1_500_000 }, { code: "PF_EMPLOYEE", kind: "DEDUCTION", label: "", monthlyPaise: 0 }] },
  slips: [
    { month: "2026-08", grossPaise: 2_250_000, deductionsPaise: 200_000, netPaise: 2_050_000, lockedAt: at, payment: { mode: "UPI", amountPaise: 2_050_000, paidOn: "2026-09-01", reference: "AXI123456789012" } },
    { month: "2026-07", grossPaise: 2_250_000, deductionsPaise: 200_000, netPaise: 2_050_000, lockedAt: at, payment: null },
  ],
  advances: [{ id: "a1", membershipId: "m1", name: "ZZ Teacher", amountPaise: 500_000, reason: "ZZ wedding", status: "RECORDED", monthlyRecoveryPaise: 200_000, recoveredPaise: 200_000, outstandingPaise: 300_000, decisionNote: null, createdAt: at, decidedAt: at }],
  years: ["2026-27"],
};
const PDF = "GET /api/v1/account/payslips/2026-08/pdf";
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

describe("inventory on the phone, read-only", () => {
  it("loads, then shows what is low, the ask waiting and the last movement", async () => {
    const gate = gated();
    await mountStaff(<StaffInventory />, "ADMIN", { [INVENTORY]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(SUMMARY));
    expect(await screen.findByText("Items: 3 · Running low: 1 · Asks waiting: 1")).toBeTruthy();
    expect(screen.getByText("ZZ White chalk")).toBeTruthy();
    expect(screen.getByText("2 box left · reorder at 5")).toBeTruthy();
    expect(screen.getByText("4 × ZZ Marker")).toBeTruthy();
    expect(screen.getByText("ZZ White chalk · -2 box")).toBeTruthy();
    expect(screen.getByText("Issue · ZZ Store · ZZ Teacher")).toBeTruthy();
    expect(screen.queryByText("You can read the stores and the register here; the school office makes the entries.")).toBeNull();
  });

  it("says so when nothing is low or waiting, each with the way home, and tells the head they read", async () => {
    await mountStaff(<StaffInventory />, "PRINCIPAL", { [INVENTORY]: () => json(EMPTY_SUMMARY) });
    expect(await screen.findByText("Nothing is running low")).toBeTruthy();
    expect(screen.getByText("No asks waiting")).toBeTruthy();
    expect(screen.getByText("You can read the stores and the register here; the school office makes the entries.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Overview" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("is not a teacher's screen, and a refusal is an alert with a retry", async () => {
    await mountStaff(<StaffInventory />, "TEACHER", {});
    expect(await screen.findByText("What the school keeps in its stores, what it owns, who holds it and where it is.")).toBeTruthy();
    await mountStaff(<StaffInventory />, "ADMIN", { [INVENTORY]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("the payroll summary on the phone, read-only", () => {
  it("shows the runs with their totals, the cost by month and by department, and the asks waiting", async () => {
    await mountStaff(<StaffPayroll />, "ADMIN", { [PAYROLL]: () => json(PAY) });
    expect(await screen.findByText("Staff with a salary: 3/4")).toBeTruthy();
    expect(screen.getByText("1 advance asks waiting")).toBeTruthy();
    expect(screen.getByText(/^September 2026 · Draft$/)).toBeTruthy();
    expect(screen.getByText(/^August 2026 · Locked$/)).toBeTruthy();
    expect(screen.getByText(/^July 2026 · Paid$/)).toBeTruthy();
    expect(screen.getByText("People 3 · Gross ₹90,000 · Net ₹81,000 · Employer's share ₹5,000")).toBeTruthy();
    expect(screen.getByText("Teaching")).toBeTruthy();
  });

  it("with no runs says so with the way home; the head is told what they read", async () => {
    await mountStaff(<StaffPayroll />, "PRINCIPAL", { [PAYROLL]: () => json({ ...PAY, runs: [], costByMonth: [], costByDepartment: [], latestLockedMonth: null, canEdit: false }) });
    expect(await screen.findByText("No runs yet")).toBeTruthy();
    expect(screen.getByText("The office has not run payroll yet.")).toBeTruthy();
    expect(screen.getByText("You read the summary and the runs' totals. A run's payslips appear here once the office shares them.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Overview" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("is not a driver's screen, and a refusal is an alert", async () => {
    await mountStaff(<StaffPayroll />, "DRIVER", {});
    expect(await screen.findByText("Salary structures, each person's salary, and the monthly payroll. No money moves through the app: the bank file goes to your bank.")).toBeTruthy();
    await mountStaff(<StaffPayroll />, "ADMIN", { [PAYROLL]: refused("ZZ down") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ down");
  });
});

describe("my payslips on the phone", () => {
  it("lists my locked months, my structure and my advance, and hands a month's PDF to the share sheet", async () => {
    let refuse = true;
    const { calls } = await mountStaff(<MyPayslips />, "TEACHER", {
      [MINE]: () => json(MY),
      [PDF]: () => (refuse ? json({ error: "ZZ Not yet.", code: "NOT_FOUND" }, 404) : new Response(PDF_BYTES, { status: 200, headers: { "content-type": "application/pdf" } })),
    });
    expect(await screen.findByText("August 2026")).toBeTruthy();
    // How the school recorded paying each slip (owner-batch-item2b): the day, the mode and the UTR, or not yet.
    expect(screen.getByText("Net ₹20,500.00 · Gross ₹22,500.00\nPaid on 01/09/2026 by UPI · Reference AXI123456789012")).toBeTruthy();
    expect(screen.getByText("Net ₹20,500.00 · Gross ₹22,500.00\nNot yet recorded paid")).toBeTruthy();
    expect(screen.getByText("ZZ Teaching staff, from 01/04/2026.")).toBeTruthy();
    expect(screen.getByText("Provident fund")).toBeTruthy();
    expect(screen.getByText("By the rules")).toBeTruthy();
    expect(screen.getByText("ZZ wedding · ₹3,000.00 still to go")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Payslip (PDF): August 2026" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not yet.");
    refuse = false;
    await fireEvent.press(screen.getByRole("button", { name: "Payslip (PDF): August 2026" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/payslip-2026-08\.pdf$/), expect.objectContaining({ mimeType: "application/pdf" }));
    expect(calls().filter((c) => c.line === "GET /api/v1/account/payslips/2026-08/pdf")).toHaveLength(2);
  });

  it("with nothing yet says so, each with the way home", async () => {
    await mountStaff(<MyPayslips />, "DRIVER", { [MINE]: () => json({ name: "ZZ Driver", structure: null, slips: [], advances: [], years: [] }) });
    expect(await screen.findByText("No payslips yet")).toBeTruthy();
    expect(screen.getByText("No salary on record")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Overview" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(<MyPayslips />, "TEACHER", { [MINE]: refused("ZZ off", 403) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ off");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
