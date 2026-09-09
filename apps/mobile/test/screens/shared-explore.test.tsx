import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Explore } from "@/screens/shared/explore";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const school = (schoolId: string, name: string, extra: Record<string, unknown> = {}) => ({ schoolId, name, city: "Pune", region: "Maharashtra", country: "India", logoPath: null, gradeLow: "1", gradeHigh: "10", about: "ZZ A school on a hill.", openVacancies: 2, ours: false, ...extra });
const EXPLORE = {
  schools: [school("s9", "ZZ Hillside"), school("s1", "ZZ Our School", { ours: true, openVacancies: 0, about: "", gradeLow: null })],
  countries: ["India", "Nepal"],
  regionsByCountry: { India: ["Maharashtra", "Gujarat"] },
};
const PATH = "GET /api/v1/family/explore";

describe("explore schools", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then lists the schools with where they are and what they offer; a school opens on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const gate = gated();
    await mountStaff(<Explore />, "PARENT", { [PATH]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(EXPLORE));
    await screen.findByText("ZZ Hillside");
    expect(screen.getByText("2 schools")).toBeTruthy();
    expect(screen.getAllByText("Pune, Maharashtra, India")).toHaveLength(2);
    expect(screen.getByText("Grades 1–10 · 2 open vacancies")).toBeTruthy();
    expect(screen.getByText("ZZ A school on a hill.")).toBeTruthy();
    expect(screen.getByText("Your school")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open on the web: ZZ Hillside" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/explore/s9`);
    open.mockRestore();
  });

  it("a country, then its state, then another country (the state dropped) and a search each ask the API", async () => {
    const { calls } = await mountStaff(<Explore />, "STUDENT", { [PATH]: () => json(EXPLORE) });
    await screen.findByText("ZZ Hillside");
    await fireEvent.press(screen.getByRole("radio", { name: "India" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/family/explore?country=India")).toBe(true));
    await fireEvent.press(await screen.findByRole("radio", { name: "Gujarat" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/family/explore?country=India&region=Gujarat")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "Nepal" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/family/explore?country=Nepal")).toBe(true));
    expect(screen.queryByRole("radio", { name: "Gujarat" })).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Search"), "hill");
    await fireEvent(screen.getByLabelText("Search"), "submitEditing");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/family/explore?q=hill&country=Nepal")).toBe(true));
  });

  it("with no school listed, says so, and the door is Enquiries; nothing matching offers to clear", async () => {
    const { calls } = await mountStaff(<Explore />, "PARENT", { [PATH]: ({ url }) => json(url.searchParams.get("country") ? { ...EXPLORE, schools: [] } : { ...EXPLORE, schools: [], countries: [] }) });
    expect(await screen.findByText("No schools listed yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Enquiries" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/enquiries");
    expect(calls().some((c) => c.line === "GET /api/v1/family/explore")).toBe(true);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Explore />, "PARENT", { [PATH]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/family/explore")).length).toBe(2));
  });
});
