import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffCirculars } from "@/screens/staff/circulars";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const GET = "GET /api/v1/office/circulars";
const POST1 = "czz000000000000000000post1";
const POST2 = "czz000000000000000000post2";
const row = (over: Record<string, unknown> = {}) => ({
  postId: POST1,
  title: "ZZ Sports day circular",
  audience: "PARENTS",
  className: null,
  publishedAt: "2026-09-16T04:30:00.000Z",
  deliveredAt: "2026-09-16T04:31:00.000Z",
  remindedAt: null,
  total: 40,
  told: 38,
  seen: 20,
  acked: 12,
  ...over,
});

beforeEach(() => mockRouter.push.mockClear());

describe("the office's circulars", () => {
  it("loads, then lists each circular with when it went, to whom, and how many have acknowledged; a row opens its reach", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffCirculars />, "ADMIN", { [GET]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json({ rows: [row(), row({ postId: POST2, title: "ZZ Class 5A picnic consent", audience: "ALL", className: "ZZ 5A", total: 20, acked: 20 })] }));
    const first = await screen.findByRole("button", { name: /^ZZ Sports day circular, / });
    expect(screen.getByRole("header", { name: "Circulars" })).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/office/circulars")).toBe(true);
    expect(first.props.accessibilityLabel).toMatch(/Published .* · Families$/);
    expect(screen.getByRole("button", { name: /^ZZ Class 5A picnic consent, / }).props.accessibilityLabel).toMatch(/· Everyone · ZZ 5A$/);
    expect(screen.getByText("12 of 40 acknowledged")).toBeTruthy();
    expect(screen.getByText("20 of 20 acknowledged")).toBeTruthy();
    await fireEvent.press(first);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/circular-reach", params: { postId: POST1 } });
  });

  it("with none yet, says so, and the door is the bulletin", async () => {
    await mountStaff(<StaffCirculars />, "PRINCIPAL", { [GET]: () => json({ rows: [] }) });
    expect(await screen.findByText("No circulars yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Write a notice" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffCirculars />, "ADMIN", { [GET]: refused("ZZ Office only", 403) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Office only");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === GET)).toHaveLength(2));
  });
});
