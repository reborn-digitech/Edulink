import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ReviewDesk } from "@/screens/staff/reviews";
import { gated, json, mountStaff, refused } from "./staff-harness";

const REVIEWS = {
  rounds: [{ id: "r1", audience: "BOTH", closesDateKey: "2026-09-21", status: "OPEN", createdAt: "2026-09-01T00:00:00.000Z", teacherCount: 2, responseCount: 5 }],
  counts: { open: 1, closed: 3 },
  dashboard: [
    { membershipId: "m2", name: "ZZ Teacher", allTime: { responseCount: 12, byQuestion: { q1: 4.1 }, overall: 4.25 }, latest: { overall: 4.4, count: 5 }, previous: { overall: 4.0, count: 7 }, delta: 0.4 },
    { membershipId: "m4", name: "ZZ Newer", allTime: { responseCount: 0, byQuestion: {}, overall: null }, latest: null, previous: null, delta: null },
  ],
  teacherOptions: [{ membershipId: "m2", name: "ZZ Teacher" }, { membershipId: "m4", name: "ZZ Newer" }],
  defaultCloseDateKey: "2026-09-21",
};

describe("the review desk", () => {
  it("loads, then shows the ratings and the rounds", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<ReviewDesk />, "PRINCIPAL", { "GET /api/v1/admin/reviews": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(REVIEWS));
    await screen.findByText(/^Open until .* · 2 teachers · 5 answers$/);
    expect(screen.getAllByText("Students and parents")).toHaveLength(2);
    expect(screen.getByText("4.3")).toBeTruthy();
    expect(screen.getByText("12 answers · Up 0.4 since the previous round (4.0 → 4.4)")).toBeTruthy();
    expect(screen.getByText("0 answers")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/reviews?status=open")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Closed (3)" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/reviews?status=closed")).toBe(true));
  });

  it("opening a round needs teachers, then posts them with the audience and the closing day", async () => {
    const { calls } = await mountStaff(<ReviewDesk />, "ADMIN", { "GET /api/v1/admin/reviews": () => json(REVIEWS), "POST /api/v1/admin/reviews": () => json({ roundId: "r2" }) });
    const start = await screen.findByRole("button", { name: "Start a review round" });
    expect(start).toBeDisabled();
    await fireEvent.press(screen.getByRole("checkbox", { name: "ZZ Newer" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Parents" }));
    expect(screen.getByRole("button", { name: "Start a review round" })).not.toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Start a review round" }));
    await screen.findByText("The round is open.");
    expect(calls().find((c) => c.line === "POST /api/v1/admin/reviews")?.body).toEqual({ teacherMembershipIds: ["m4"], audience: "PARENTS", closesDateKey: "2026-09-21" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/reviews?status=open").length).toBe(2));
  });

  it("everyone toggles every teacher on, and a bad date holds the button", async () => {
    await mountStaff(<ReviewDesk />, "ADMIN", { "GET /api/v1/admin/reviews": () => json(REVIEWS) });
    await fireEvent.press(await screen.findByRole("checkbox", { name: "Everyone" }));
    expect(screen.getByRole("checkbox", { name: "ZZ Teacher" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "ZZ Newer" })).toBeChecked();
    await fireEvent.changeText(screen.getByLabelText("Open until"), "next week");
    expect(screen.getByRole("button", { name: "Start a review round" })).toBeDisabled();
  });

  it("no round open says so", async () => {
    await mountStaff(<ReviewDesk />, "PRINCIPAL", { "GET /api/v1/admin/reviews": () => json({ ...REVIEWS, rounds: [], dashboard: [], counts: { open: 0, closed: 0 } }) });
    expect(await screen.findByText("No round is open")).toBeTruthy();
    expect(screen.queryByText("Ratings")).toBeNull();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<ReviewDesk />, "PRINCIPAL", { "GET /api/v1/admin/reviews": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/reviews")).length).toBe(2));
  });
});
