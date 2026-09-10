import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Vacancies } from "@/screens/staff/vacancies";
import { gated, json, mountStaff, refused, type Answer } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const AT = "2026-09-01T00:00:00.000Z";
const BOARD = {
  items: [
    { id: "v1", title: "ZZ Maths teacher", subjects: ["Maths", "Physics"], employmentType: "FULL_TIME", createdAt: AT, schoolId: "s2", schoolName: "ZZ Other School", city: "Pune", region: "Maharashtra", logoPath: null, ours: false },
    { id: "v2", title: "ZZ Art teacher", subjects: [], employmentType: "PART_TIME", createdAt: AT, schoolId: "s1", schoolName: "ZZ School", city: null, region: null, logoPath: null, ours: true },
  ],
};
const OPEN = { id: "p1", title: "ZZ Science teacher", employmentType: "PART_TIME", status: "OPEN", createdAt: AT, closedAt: null, contactName: "ZZ Head", enquiryCount: 2 };
const CLOSED = { id: "p0", title: "ZZ Old posting", employmentType: "TEMPORARY", status: "CLOSED", createdAt: AT, closedAt: AT, contactName: null, enquiryCount: 0 };
/** By status, the way the endpoint answers. */
const desk: Answer = ({ url }) => {
  const status = url.searchParams.get("status") ?? "open";
  return json({ postings: status === "open" ? [OPEN] : status === "closed" ? [CLOSED] : [OPEN, CLOSED], counts: { open: 1, closed: 1 } });
};

describe("the vacancies board, for a teacher", () => {
  it("loads, then lists the postings; a posting opens its own screen", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Vacancies />, "TEACHER", { "GET /api/v1/shared/vacancies": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BOARD));
    await screen.findByText("ZZ Maths teacher");
    expect(screen.getByText(/^Full-time · ZZ Other School, Pune, Maharashtra · Maths, Physics · Posted /)).toBeTruthy();
    expect(screen.getByText("Your school")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/shared/vacancies")).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Maths teacher, / }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/vacancy", params: { postingId: "v1" } });
    // The type filter narrows on the phone; nothing matching offers to clear it.
    await fireEvent.press(screen.getByRole("radio", { name: "Temporary" }));
    expect(screen.getByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByText("ZZ Art teacher")).toBeTruthy();
  });

  it("an empty board points at the schools", async () => {
    await mountStaff(<Vacancies />, "TEACHER", { "GET /api/v1/shared/vacancies": () => json({ items: [] }) });
    expect(await screen.findByText("No open vacancies")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Explore schools" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/explore");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Vacancies />, "TEACHER", { "GET /api/v1/shared/vacancies": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/shared/vacancies").length).toBe(2));
  });
});

describe("the school's vacancies desk", () => {
  it("loads, then shows the postings with their enquiries, and the status asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Vacancies />, "PRINCIPAL", { "GET /api/v1/admin/vacancies": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => desk({ url: new URL("http://api.test/api/v1/admin/vacancies?status=open"), init: {} }) as Response);
    await screen.findByText("ZZ Science teacher");
    expect(screen.getByLabelText("Open: 1")).toBeTruthy();
    expect(screen.getByText(/^Part-time · 2 enquiries · Contact: ZZ Head · Posted /)).toBeTruthy();
    // The count is the door to the enquiries: the posting's own screen lists them, as does the row.
    await fireEvent.press(screen.getByRole("button", { name: "2 enquiries" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/vacancy", params: { postingId: "p1" } });
    expect(calls().some((c) => c.line === "GET /api/v1/admin/vacancies?status=open")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "All" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/vacancies?status=all")).toBe(true));
  });

  it("closing asks first, then posts and says so", async () => {
    const { calls } = await mountStaff(<Vacancies />, "ADMIN", { "GET /api/v1/admin/vacancies": desk, "POST /api/v1/admin/vacancies/p1/close": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Close ZZ Science teacher" }));
    expect(calls().some((c) => c.line === "POST /api/v1/admin/vacancies/p1/close")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Close: ZZ Science teacher" }));
    await screen.findByText(/^The vacancy is closed\./);
    expect(calls().some((c) => c.line === "POST /api/v1/admin/vacancies/p1/close")).toBe(true);
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/vacancies?status=open").length).toBe(2));
  });

  it("posting sends the title, the description, the subjects and the poster as the hiring contact", async () => {
    const { calls } = await mountStaff(<Vacancies />, "ADMIN", { "GET /api/v1/admin/vacancies": desk, "POST /api/v1/admin/vacancies": () => json({ postingId: "p2" }, 201) });
    await fireEvent.changeText(await screen.findByLabelText("Title"), "ZZ Hindi teacher");
    await fireEvent.changeText(screen.getByLabelText("Description"), "ZZ Grades 6 to 8, full day.");
    await fireEvent.changeText(screen.getByLabelText("Subjects"), "Hindi, Marathi ,");
    await fireEvent.press(screen.getByRole("radio", { name: "Temporary" }));
    expect(screen.getByText("Hiring contact: ZZ Head")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Post a vacancy" }));
    await screen.findByText("The vacancy is on the board.");
    expect(calls().find((c) => c.line === "POST /api/v1/admin/vacancies")?.body).toEqual({ title: "ZZ Hindi teacher", body: "ZZ Grades 6 to 8, full day.", subjects: ["Hindi", "Marathi"], employmentType: "TEMPORARY", hiringContactMembershipId: "m1" });
    expect(screen.getByLabelText("Title")).toHaveDisplayValue("");
  });

  it("a refused post is said, and what was typed stays", async () => {
    await mountStaff(<Vacancies />, "ADMIN", { "GET /api/v1/admin/vacancies": desk, "POST /api/v1/admin/vacancies": refused("The hiring contact must be active staff.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Title"), "ZZ Hindi teacher");
    await fireEvent.changeText(screen.getByLabelText("Description"), "ZZ body.");
    await fireEvent.press(screen.getByRole("button", { name: "Post a vacancy" }));
    expect(await screen.findByText("The hiring contact must be active staff.")).toBeTruthy();
    expect(screen.getByLabelText("Title")).toHaveDisplayValue("ZZ Hindi teacher");
  });

  it("nothing open with old postings offers the closed ones; the board is a tab away", async () => {
    const { calls } = await mountStaff(<Vacancies />, "PRINCIPAL", { "GET /api/v1/admin/vacancies": () => json({ postings: [], counts: { open: 0, closed: 1 } }), "GET /api/v1/shared/vacancies": () => json(BOARD) });
    expect(await screen.findByText("Nothing open right now")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Closed" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/vacancies?status=closed")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "Vacancies" }));
    expect(await screen.findByText("ZZ Maths teacher")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/shared/vacancies")).toBe(true);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Vacancies />, "ADMIN", { "GET /api/v1/admin/vacancies": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/vacancies")).length).toBe(2));
  });
});
