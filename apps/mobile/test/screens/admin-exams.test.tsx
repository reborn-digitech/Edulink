import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AdminExams, PrincipalExams } from "@/screens/staff/exams";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const TERM = { id: "t1", name: "Term 1", startDateKey: "2026-06-01", endDateKey: "2026-10-31", current: true, finished: false };
const DRAFT = { id: "s1", name: "ZZ Term 1", gradeLevel: "5", kind: "UNIT_TEST", term: { id: "t1", name: "Term 1" }, publishedAt: null, createdAt: "2026-09-01T00:00:00.000Z", slots: [{ id: "x1", subject: "ZZ Maths", dateKey: "2026-09-20", startMinute: 540, endMinute: 660, maxMarks: 80, position: 1 }] };
const PUBLISHED = { id: "s2", name: "ZZ Half-yearly", gradeLevel: "6", kind: "MID_TERM", term: null, publishedAt: "2026-09-02T00:00:00.000Z", createdAt: "2026-09-01T00:00:00.000Z", slots: [] };
const EXAMS = { series: [DRAFT, PUBLISHED], total: 2, grades: ["5", "6"], terms: [TERM] };
const SHEETS = {
  sheets: [{ id: "s2", name: "ZZ Half-yearly", kind: "MID_TERM", gradeLevel: "6", schoolName: "ZZ School", slots: [{ id: "x2", subject: "ZZ Science", dateKey: "2026-10-05", startMinute: null, endMinute: null, maxMarks: 50 }] }],
  classes: [{ id: "c1", name: "ZZ Class A", publishedCards: 1 }, { id: "c2", name: "ZZ Class B", publishedCards: 0 }],
};

describe("the exam office", () => {
  it("loads, then shows each series with its papers and state, and a filter asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<AdminExams />, "ADMIN", { "GET /api/v1/admin/exams": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(EXAMS));
    await screen.findByText("ZZ Term 1 · Unit test · Class 5 · Term 1");
    expect(screen.getByText("ZZ Half-yearly · Mid-term · Class 6")).toBeTruthy();
    expect(screen.getByText("ZZ Maths")).toBeTruthy();
    expect(screen.getByText(/ · 09:00 – 11:00$/)).toBeTruthy();
    expect(screen.getByText("Out of 80")).toBeTruthy();
    expect(screen.getByLabelText("Published: 1")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/exams")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Draft" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/exams?state=draft")).toBe(true));
    await fireEvent.press(screen.getAllByRole("radio", { name: "Class 6" })[0]!);
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/exams?state=draft&grade=6")).toBe(true));
  });

  it("publishing asks first, then posts; archiving is the web's", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<AdminExams />, "ADMIN", { "GET /api/v1/admin/exams": () => json(EXAMS), "POST /api/v1/admin/exams/s1/publish": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish" }));
    expect(calls().some((c) => c.line === "POST /api/v1/admin/exams/s1/publish")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Publish: ZZ Term 1" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/admin/exams/s1/publish")).toBe(true));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/exams").length).toBe(2));
    await fireEvent.press(screen.getAllByRole("button", { name: "Archive" })[0]!);
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/exams`);
    open.mockRestore();
  });

  it("creating a series and adding a paper post the simple bodies", async () => {
    const { calls } = await mountStaff(<AdminExams />, "ADMIN", {
      "GET /api/v1/admin/exams": () => json(EXAMS),
      "POST /api/v1/admin/exams": () => json({ seriesId: "s3" }, 201),
      "POST /api/v1/admin/exams/s1/slots": () => json({ ok: true }, 201),
    });
    await fireEvent.changeText(await screen.findByLabelText("Name"), "ZZ Finals");
    await fireEvent.press(screen.getAllByRole("radio", { name: "Final exam" })[1]!);
    await fireEvent.press(screen.getByRole("button", { name: "Create the series" }));
    await screen.findByText("Create the series: ZZ Finals");
    expect(calls().find((c) => c.line === "POST /api/v1/admin/exams")?.body).toEqual({ name: "ZZ Finals", gradeLevel: "5", kind: "FINAL", termId: "t1" });
    await fireEvent.press(screen.getAllByRole("button", { name: "Add a paper" })[0]!);
    await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ Hindi");
    await fireEvent.changeText(screen.getByLabelText("Day"), "2026-09-22");
    await fireEvent.changeText(screen.getByLabelText("Out of"), "50");
    await fireEvent.press(screen.getAllByRole("button", { name: "Add a paper" })[0]!);
    await screen.findByText("Add a paper: ZZ Hindi");
    expect(calls().find((c) => c.line === "POST /api/v1/admin/exams/s1/slots")?.body).toEqual({ subject: "ZZ Hindi", dateKey: "2026-09-22", maxMarks: 50 });
  });

  it("a refused publish is said", async () => {
    await mountStaff(<AdminExams />, "ADMIN", { "GET /api/v1/admin/exams": () => json(EXAMS), "POST /api/v1/admin/exams/s1/publish": refused("A series with no papers cannot be published.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish" }));
    await fireEvent.press(screen.getByRole("button", { name: "Publish: ZZ Term 1" }));
    expect(await screen.findByText("A series with no papers cannot be published.")).toBeTruthy();
  });

  it("no series yet says so, with the form as the door", async () => {
    await mountStaff(<AdminExams />, "ADMIN", { "GET /api/v1/admin/exams": () => json({ series: [], total: 0, grades: [], terms: [] }) });
    expect(await screen.findByText("No exam series yet. Create the first one above.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "New exam series" }));
    // With no graded classes the grade is typed rather than chosen.
    expect(screen.getByLabelText("Grade")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AdminExams />, "ADMIN", { "GET /api/v1/admin/exams": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/exams")).length).toBe(2));
  });
});

describe("the head's exams", () => {
  it("loads, then shows the date sheets and the classes whose cards may be built", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const gate = gated();
    await mountStaff(<PrincipalExams />, "PRINCIPAL", { "GET /api/v1/staff/exams/sheets": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(SHEETS));
    await screen.findByText("ZZ Half-yearly · Class 6");
    expect(screen.getByText("ZZ Science")).toBeTruthy();
    expect(screen.getByText(/ · —$/)).toBeTruthy();
    expect(screen.getByLabelText("Report cards: 1")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Report cards" }));
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Class A, 1 card issued" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/teacher/classes/c1/report-cards`);
    open.mockRestore();
  });

  it("nothing announced and no classes: each says so, with a door to the classes", async () => {
    await mountStaff(<PrincipalExams />, "PRINCIPAL", { "GET /api/v1/staff/exams/sheets": () => json({ sheets: [], classes: [] }) });
    expect(await screen.findByText("No exams announced")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Report cards" }));
    expect(await screen.findByText("No classes to build cards for")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<PrincipalExams />, "PRINCIPAL", { "GET /api/v1/staff/exams/sheets": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/exams/sheets").length).toBe(2));
  });
});
