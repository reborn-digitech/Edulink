import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { Apply } from "@/screens/family/apply";
import { A1, application, CYCLE, DOCUMENTS, row, SCHOOL } from "./admissions-fixtures";
import { json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SCHOOL_PATH = `GET /api/v1/shared/schools/${SCHOOL}/admissions`;
const APPLY = "POST /api/v1/family/applications";
const OPEN = {
  cycleId: CYCLE,
  name: "ZZ Admissions 2026-27",
  academicYearName: "2026-27",
  grades: [
    { grade: "1", seats: 5, remaining: 3 },
    { grade: "2", seats: 3, remaining: 0 },
  ],
  documents: DOCUMENTS,
  testRequired: true,
  notice: "ZZ Bring the originals.",
  closesAt: "2026-12-31",
};

const compose = () => (
  <ToastProvider>
    <Apply />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = { schoolId: SCHOOL, school: "ZZ Hillside" };
});

describe("applying to a school", () => {
  it("with no open cycle, says so with the door to the directory", async () => {
    await mountStaff(compose(), "PARENT", { [SCHOOL_PATH]: () => json({ open: null, mine: [] }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("This school is not taking applications through Relay right now.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Explore schools" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/explore");
    expect(screen.queryByRole("button", { name: "Send the application" })).toBeNull();
  });

  it("shows the cycle, the seats left, what is asked for and the test; refuses a blank name; then posts the form and opens the application", async () => {
    const { calls } = await mountStaff(compose(), "PARENT", { [SCHOOL_PATH]: () => json({ open: OPEN, mine: [row(A1)] }), [APPLY]: () => json(application()) });
    expect(await screen.findByRole("header", { name: "Apply to ZZ Hillside" })).toBeTruthy();
    expect(await screen.findByText("ZZ Admissions 2026-27 · 2026-27")).toBeTruthy();
    expect(screen.getByText("Grade 1 · 3 of 5 seats left")).toBeTruthy();
    expect(screen.getByText("Grade 2 · 0 of 3 seats left")).toBeTruthy();
    expect(screen.getByText("You will be asked for: ZZ Birth certificate, ZZ Photograph")).toBeTruthy();
    expect(screen.getByText("There is an entrance test; you book a sitting after applying.")).toBeTruthy();
    expect(screen.getByText(/^Closes .*2026$/)).toBeTruthy();
    expect(screen.getByText("ZZ Bring the originals.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    expect(screen.getAllByText("This is required.").length).toBeGreaterThan(0);
    expect(calls().some((c) => c.line === APPLY)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Child's name"), "ZZ Kabir");
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "2020-04-01");
    await fireEvent.press(screen.getByRole("radio", { name: "1 · 3 of 5 seats left" }));
    await fireEvent.changeText(screen.getByLabelText("City"), "Pune");
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    await waitFor(() => expect(calls().some((c) => c.line === APPLY)).toBe(true));
    expect(calls().find((c) => c.line === APPLY)!.body).toEqual({ schoolId: SCHOOL, cycleId: CYCLE, childName: "ZZ Kabir", childBirthdate: "2020-04-01", gradeApplied: "1", relation: "PARENT", city: "Pune" });
    expect(await screen.findByText("Application sent.")).toBeTruthy();
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/my-application", params: { id: A1 } });
  });

  it("a date that is not a day is refused before anything is sent; a refused post is said above the form", async () => {
    const { calls } = await mountStaff(compose(), "PARENT", { [SCHOOL_PATH]: () => json({ open: OPEN, mine: [] }), [APPLY]: refused("ZZ no seats left", 409) });
    await fireEvent.changeText(await screen.findByLabelText("Child's name"), "ZZ Kabir");
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "last spring");
    await fireEvent.press(screen.getByRole("radio", { name: "2 · 0 of 3 seats left" }));
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(calls().some((c) => c.line === APPLY)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ no seats left");
    expect(calls().find((c) => c.line === APPLY)!.body).toEqual({ schoolId: SCHOOL, cycleId: CYCLE, childName: "ZZ Kabir", childBirthdate: null, gradeApplied: "2", relation: "PARENT" });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("the child's PEN goes in the body when given, and a short one is refused before anything is sent", async () => {
    const { calls } = await mountStaff(compose(), "PARENT", { [SCHOOL_PATH]: () => json({ open: OPEN, mine: [] }), [APPLY]: () => json(application({ penNumber: "27250100101" })) });
    await fireEvent.changeText(await screen.findByLabelText("Child's name"), "ZZ Kabir");
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "2020-04-01");
    await fireEvent.press(screen.getByRole("radio", { name: "1 · 3 of 5 seats left" }));
    await fireEvent.changeText(screen.getByLabelText("UDISE+ PEN (if the child has one)"), "2725");
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    expect(screen.getByText("A PEN is eleven digits.")).toBeTruthy();
    expect(calls().some((c) => c.line === APPLY)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("UDISE+ PEN (if the child has one)"), "27250100101");
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    await waitFor(() => expect(calls().some((c) => c.line === APPLY)).toBe(true));
    expect(calls().find((c) => c.line === APPLY)!.body).toEqual({ schoolId: SCHOOL, cycleId: CYCLE, childName: "ZZ Kabir", childBirthdate: "2020-04-01", gradeApplied: "1", relation: "PARENT", penNumber: "27250100101" });
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/my-application", params: { id: A1 } });
  });

  it("without a school named, the title is the plain one", async () => {
    mockRouter.params = { schoolId: SCHOOL };
    await mountStaff(compose(), "PARENT", { [SCHOOL_PATH]: () => json({ open: OPEN, mine: [] }) });
    expect(await screen.findByRole("header", { name: "Apply for a place" })).toBeTruthy();
  });
});
