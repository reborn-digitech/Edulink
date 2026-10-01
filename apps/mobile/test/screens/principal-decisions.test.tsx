import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffDecisions, decisionsQuery, monthBounds } from "@/screens/staff/decisions";
import { json, mountStaff, offline, type Answer } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }), useLocalSearchParams: () => ({}) }));

const PATH = "GET /api/v1/principal/decisions";
const item = (id: string, kind: string, sentence: string, approved = true) => ({ id, at: "2026-10-01T04:30:00.000Z", kind, action: `${kind}.x`, approved, sentence });
const page = (items: unknown[], extra: Partial<{ nextCursor: string | null; total: number; own: boolean }> = {}) => ({ items, nextCursor: null, total: items.length, own: true, ...extra });

describe("the query the screen sends", () => {
  it("names the kind, the month's bounds and the cursor only when they narrow", () => {
    expect(decisionsQuery("ALL", null, null)).toBe("?limit=30");
    expect(decisionsQuery("leave", "2026-02", "cabc")).toBe("?limit=30&kind=leave&from=2026-02-01&to=2026-02-28&cursor=cabc");
    expect(monthBounds("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
  });
});

describe("the head's decision log", () => {
  it("lists the sentences newest first with their kind and date, and the count shown", async () => {
    await mountStaff(<StaffDecisions />, "PRINCIPAL", {
      [PATH]: () => json(page([item("d1", "record", "Applied the record change for Asha Patil (1 fields)"), item("d2", "leave", "Declined R. Desai's leave, 03/10/2026", false)])),
    });
    expect(await screen.findByText("Applied the record change for Asha Patil (1 fields)")).toBeTruthy();
    expect(screen.getByText("Declined R. Desai's leave, 03/10/2026")).toBeTruthy();
    expect(screen.getByText("Oct 1, 2026 · Record changes")).toBeTruthy();
    expect(screen.getByText("2 of 2")).toBeTruthy();
    expect(screen.getByText("Decisions")).toBeTruthy();
  });

  it("empty: says no decisions yet; narrowed by a kind chip, asks again with the kind and says nothing matched", async () => {
    const asked: string[] = [];
    const answer: Answer = ({ url }) => {
      asked.push(url.search);
      return json(url.searchParams.get("kind") === "pen" ? page([]) : page([item("d1", "leave", "Approved Asha Patil's leave, 03/10/2026–05/10/2026, cover: R. Desai")]));
    };
    const { calls } = await mountStaff(<StaffDecisions />, "PRINCIPAL", { [PATH]: answer });
    expect(await screen.findByText("Approved Asha Patil's leave, 03/10/2026–05/10/2026, cover: R. Desai")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "PEN changes" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/principal/decisions?limit=30&kind=pen")).toBe(true));
    expect(await screen.findByText("Nothing matches")).toBeTruthy();
  });

  it("with nothing decided yet, the empty state says so; the office reads the head's", async () => {
    await mountStaff(<StaffDecisions />, "ADMIN", { [PATH]: () => json(page([], { own: false })) });
    expect(await screen.findByText("The head has not decided anything yet")).toBeTruthy();
    expect(screen.getByText("The head's decisions")).toBeTruthy();
  });

  it("the month stepper narrows to a month and back to all months", async () => {
    const { calls } = await mountStaff(<StaffDecisions />, "PRINCIPAL", { [PATH]: () => json(page([item("d1", "join", "Approved ZZ Pupil joining the school")])) });
    await screen.findByText("Approved ZZ Pupil joining the school");
    expect(screen.getByText("All months")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Previous month" }));
    const month = new Date().toISOString().slice(0, 7);
    await waitFor(() => expect(calls().some((c) => c.line.includes(`&from=${month}-01&to=${month}-`))).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByText("All months")).toBeTruthy();
  });

  it("thirty rows at a time: Show more fetches the next page by cursor and appends it", async () => {
    const first = Array.from({ length: 30 }, (_, i) => item(`a${i}`, "leave", `ZZ decision ${i}`));
    const { calls } = await mountStaff(<StaffDecisions />, "PRINCIPAL", {
      [PATH]: ({ url }) => (url.searchParams.get("cursor") === "a29" ? json(page([item("b0", "admission", "Admitted ZZ Child")], { total: 31 })) : json(page(first, { nextCursor: "a29", total: 31 }))),
    });
    expect(await screen.findByText("ZZ decision 29")).toBeTruthy();
    expect(screen.getByText("30 of 31")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Show 1 more" }));
    expect(await screen.findByText("Admitted ZZ Child")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/principal/decisions?limit=30&cursor=a29")).toBe(true);
    expect(screen.getByText("31 of 31")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Show .* more/ })).toBeNull();
  });

  it("offline: the failure shows with a retry", async () => {
    await mountStaff(<StaffDecisions />, "PRINCIPAL", { [PATH]: offline });
    expect(await screen.findByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
