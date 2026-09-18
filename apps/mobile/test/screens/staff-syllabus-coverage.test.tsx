import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { syllabusCoverageSchema } from "@edulink/contracts";
import { SyllabusCoverage } from "@/screens/staff/syllabus-coverage";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASS1 = "czz00000000000000000c1";
const CLASS2 = "czz00000000000000000c2";
const PATH = "/api/v1/office/syllabus/coverage";

const COVERAGE = syllabusCoverageSchema.parse({
  yearName: "2026-27",
  yearElapsedPercent: 40,
  overallPercent: 35,
  classesBehind: 1,
  rows: [
    { classId: CLASS1, className: "ZZ 5A", gradeLevel: "5", subject: "Maths", units: 10, done: 4, inProgress: 1, percent: 40, expected: 4, behind: false, lastTaughtOn: "2026-09-16" },
    { classId: CLASS2, className: "ZZ 5B", gradeLevel: "5", subject: "Maths", units: 10, done: 1, inProgress: 0, percent: 10, expected: 4, behind: true, lastTaughtOn: null },
  ],
});

describe("syllabus coverage", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads the two headline figures, how far the year has gone, and a row per class and subject with its pill", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<SyllabusCoverage />, "PRINCIPAL", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(COVERAGE));
    await screen.findByText("ZZ 5A · Maths");
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByLabelText("Overall: 35%")).toBeTruthy();
    expect(screen.getByLabelText("Behind: 1")).toBeTruthy();
    expect(screen.getByText("2026-27 · 40% of the year gone · 1 classes behind")).toBeTruthy();
    expect(screen.getByText("4/10 · Should be at 4 of 10 by now · Last taught Sep 16")).toBeTruthy();
    expect(screen.getByText("1/10 · Should be at 4 of 10 by now · Not started")).toBeTruthy();
    expect(screen.getByText("On track")).toBeTruthy();
    // "Behind" is the Stat label and the one row's pill.
    expect(screen.getAllByText("Behind")).toHaveLength(2);
    expect(screen.getByText("40%")).toBeTruthy();
    expect(screen.getByText("10%")).toBeTruthy();
  });

  it("a row opens that class's syllabus on the subject", async () => {
    await mountStaff(<SyllabusCoverage />, "ADMIN", { [`GET ${PATH}`]: () => json(COVERAGE) });
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ 5B · Maths/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/syllabus", params: { classId: CLASS2, subject: "Maths" } });
  });

  it("with no lists yet, says so and points at the classes", async () => {
    await mountStaff(<SyllabusCoverage />, "PRINCIPAL", { [`GET ${PATH}`]: () => json({ ...COVERAGE, overallPercent: null, classesBehind: 0, rows: [] }) });
    expect(await screen.findByText("No syllabus yet")).toBeTruthy();
    expect(screen.getByLabelText("Overall: —")).toBeTruthy();
    expect(screen.getByText("2026-27 · 40% of the year gone · Nobody is behind")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<SyllabusCoverage />, "PRINCIPAL", { [`GET ${PATH}`]: refused("ZZ coverage refused", 403) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ coverage refused");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
