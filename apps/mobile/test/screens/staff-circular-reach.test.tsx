import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffCircularReach } from "@/screens/staff/circular-reach";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";
import type { RoleCode } from "@edulink/contracts";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const POST = "czz000000000000000000post1";
const PATH = `/api/v1/shared/bulletin/${POST}`;

const guardian = (over: Record<string, unknown> = {}) => ({ userId: "u-g1", name: "ZZ Meera Rao", phone: "+919876543210", hasApp: true, texted: false, state: "TOLD", ...over });
const family = (over: Record<string, unknown> = {}) => ({ studentMembershipId: "m-p1", studentName: "ZZ Asha Rao", state: "TOLD", guardians: [guardian()], ...over });
const reach = (over: Record<string, unknown> = {}) => ({
  postId: POST,
  title: "ZZ Sports day circular",
  audience: "PARENTS",
  publishedAt: "2026-09-16T04:30:00.000Z",
  deliveredAt: "2026-09-16T04:31:00.000Z",
  deliveryQueuedAt: "2026-09-16T04:30:00.000Z",
  remindedAt: null,
  remindCount: 0,
  totals: { total: 40, told: 38, seen: 20, acked: 12 },
  groups: [
    {
      classId: "c1",
      className: "ZZ 5A",
      total: 20,
      told: 19,
      seen: 10,
      acked: 6,
      outstanding: [family(), family({ studentMembershipId: "m-p2", studentName: "ZZ Vikram Shah", state: "UNREACHED", guardians: [guardian({ userId: "u-g2", name: "ZZ Nita Shah", phone: null, hasApp: false, texted: true, state: "UNREACHED" })] })],
    },
    { classId: "c2", className: "ZZ 5B", total: 20, told: 19, seen: 10, acked: 20, outstanding: [] },
  ],
  canRemind: true,
  remindBlocked: "none",
  ...over,
});

const mount = (role: RoleCode, answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <StaffCircularReach />
    </ToastProvider>,
    role,
    answers,
  );

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = { postId: POST };
});

describe("a circular's reach report", () => {
  it("loads, then shows the totals, the delivery line, each class's count and the families still waiting with their guardians", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mount("ADMIN", { [`GET ${PATH}/reach`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(reach()));
    expect(await screen.findByRole("header", { name: "ZZ Sports day circular" })).toBeTruthy();
    expect(screen.getByText(/^Families · Published /)).toBeTruthy();
    expect(screen.getByLabelText("Families: 40")).toBeTruthy();
    expect(screen.getByLabelText("Told: 38")).toBeTruthy();
    expect(screen.getByLabelText("Opened: 20")).toBeTruthy();
    expect(screen.getByLabelText("Acknowledged: 12")).toBeTruthy();
    expect(screen.getByText(/^Told .*[0-9]/)).toBeTruthy();
    expect(screen.getByText("6 of 20 acknowledged")).toBeTruthy();
    expect(screen.getByText("20 of 20 acknowledged")).toBeTruthy();
    expect(screen.getByText("2 still waiting")).toBeTruthy();
    // 5B has nobody to chase; 5A's two families are named with how far each got.
    expect(screen.getByText("Everyone has acknowledged")).toBeTruthy();
    expect(screen.getByText("ZZ Asha Rao")).toBeTruthy();
    expect(screen.getByText("Told, not opened")).toBeTruthy();
    expect(screen.getByText("ZZ Vikram Shah")).toBeTruthy();
    expect(screen.getByText("Not reached")).toBeTruthy();
    expect(screen.getByText("ZZ Nita Shah")).toBeTruthy();
    expect(screen.getByText("No app")).toBeTruthy();
    expect(screen.getByText("Texted")).toBeTruthy();
    // The office rings the number; a guardian with none has no button.
    await fireEvent.press(screen.getByRole("button", { name: "Phone: ZZ Meera Rao" }));
    expect(open).toHaveBeenCalledWith("tel:+919876543210");
    expect(screen.queryByRole("button", { name: "Phone: ZZ Nita Shah" })).toBeNull();
    open.mockRestore();
  });

  it("chases the rest: the server is asked once, the toast says how many, and the report is read again", async () => {
    let reads = 0;
    const { calls } = await mount("PRINCIPAL", {
      [`GET ${PATH}/reach`]: () => json(reach(++reads > 1 ? { remindedAt: "2026-09-18T05:00:00.000Z", remindCount: 1, canRemind: false, remindBlocked: "too-soon" } : {})),
      [`POST ${PATH}/remind`]: () => json({ reminded: 3, texted: 2, remindedAt: "2026-09-18T05:00:00.000Z" }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Chase the rest" }));
    expect(await screen.findByText("Chased 3 people; 2 texts sent.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}/remind`)).toHaveLength(1);
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}/reach`)).toHaveLength(2));
    expect(await screen.findByText("Chased less than a day ago")).toBeTruthy();
    expect(screen.getByText(/^Chased .* · 1 times$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Chase the rest" })).toBeNull();
  });

  it("a refused chase is said and the button stays", async () => {
    await mount("ADMIN", { [`GET ${PATH}/reach`]: () => json(reach()), [`POST ${PATH}/remind`]: refused("ZZ Give them the day", 429) });
    await fireEvent.press(await screen.findByRole("button", { name: "Chase the rest" }));
    expect(await screen.findByText("ZZ Give them the day")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chase the rest" })).toBeTruthy();
  });

  it("with everyone reached, says so instead of offering the chase", async () => {
    await mount("ADMIN", { [`GET ${PATH}/reach`]: () => json(reach({ canRemind: false, remindBlocked: "nothing-outstanding", groups: [] })) });
    expect(await screen.findByText("Everyone has acknowledged")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Chase the rest" })).toBeNull();
  });

  it("with the families not yet told, says so twice over: the delivery line and the reason there is no chase", async () => {
    await mount("ADMIN", { [`GET ${PATH}/reach`]: () => json(reach({ canRemind: false, remindBlocked: "not-delivered", deliveredAt: null, deliveryQueuedAt: null, groups: [] })) });
    expect(await screen.findAllByText("Not told yet.")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Chase the rest" })).toBeNull();
  });

  it("a teacher reads their class with no chase button, no reason for its absence, and no numbers to ring", async () => {
    await mount("TEACHER", { [`GET ${PATH}/reach`]: () => json(reach({ canRemind: false, remindBlocked: "not-office", deliveredAt: null, groups: [{ ...reach().groups[0], outstanding: [family({ guardians: [guardian({ phone: null })] })] }] })) });
    expect(await screen.findByText("ZZ Asha Rao")).toBeTruthy();
    expect(screen.getByText("Being told now — a large audience goes out within the minute.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Chase the rest" })).toBeNull();
    expect(screen.queryByText("Chased less than a day ago")).toBeNull();
    expect(screen.queryByRole("button", { name: /^Phone:/ })).toBeNull();
  });

  it("the notice itself is a tap away", async () => {
    await mount("ADMIN", { [`GET ${PATH}/reach`]: () => json(reach()) });
    await fireEvent.press(await screen.findByRole("button", { name: "Open the notice" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: POST } });
  });

  it("with no post named, says so, and the door is the bulletin", async () => {
    mockRouter.params = {};
    await mount("ADMIN", {});
    expect(await screen.findByText("Post not found")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount("TEACHER", { [`GET ${PATH}/reach`]: refused("ZZ Not your class", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not your class");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}/reach`)).toHaveLength(2));
  });
});
