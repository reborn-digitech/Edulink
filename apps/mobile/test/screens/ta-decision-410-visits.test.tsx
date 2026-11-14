import { screen } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { Safety } from "@/screens/staff/safety";
import { json, mountStaff, type Answer } from "./staff-harness";

/**
 * TA-410 (testing analysis of 13 November 2026, the owner's decision of 14 November 2026, decision 0009): the
 * phone's Safety Centre printed the stored English words "Operator access" after each visit's time as if the
 * operator had typed them as a reason. A visit and a list of colleges are now worded by their kind in the reader's
 * language, and only a reason typed before 9 August 2026 is shown as typed.
 */

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const AT = "2026-11-14T09:00:00.000Z";
const visit = (id: string, kind: string | undefined, reason: string) => ({ id, reason, ...(kind ? { kind } : {}), startedAt: AT, expiresAt: "2026-11-14T10:00:00.000Z", endedAt: null, operatorName: `ZZ Operator ${id}`, live: false });
const VISITS = [
  visit("v1", "VISIT", "Operator access"),
  visit("v2", "COLLEGES_LIST", "Operator access: colleges list"),
  visit("v3", "REASON", "ZZ a report about a bulletin post"),
  // An older server sends no kind: its words are shown as typed.
  visit("v4", undefined, "ZZ support ticket"),
];
const answer: Answer = () => json({ openCount: 0, visits: VISITS, reports: [], audit: [] });

describe("TA-410: the visitor book on the phone", () => {
  it("TA-410: a visit and a list of colleges read in the reader's words, and a typed reason as typed", async () => {
    await mountStaff(
      <ToastProvider>
        <Safety />
      </ToastProvider>,
      "ADMIN",
      { "GET /api/v1/admin/safety": answer },
    );
    await screen.findByText("ZZ Operator v1");
    expect(screen.getByText(/— Visited the school$/)).toBeTruthy();
    expect(screen.getByText(/— Read this college's numbers in the list of colleges$/)).toBeTruthy();
    expect(screen.getByText(/— ZZ a report about a bulletin post$/)).toBeTruthy();
    expect(screen.getByText(/— ZZ support ticket$/)).toBeTruthy();
    // The stored markers are never printed.
    expect(screen.queryByText(/Operator access/)).toBeNull();
    // The sentence above the list says the team can open the school at any time, not that a reason is given.
    expect(screen.getByText(/can open any school at any time/)).toBeTruthy();
    expect(screen.queryByText(/without saying why/)).toBeNull();
  });
});
