import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { operatorSchoolDetailSchema } from "@edulink/contracts";
import { OperatorSchool } from "@/screens/operator/school";
import { ToastProvider } from "@/components";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: { schoolId: "s1" } as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

beforeEach(() => {
  mockRouter.params = { schoolId: "s1" };
  mockRouter.back.mockClear();
});

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const DETAIL = operatorSchoolDetailSchema.parse({
  school: {
    id: "s1",
    name: "ZZ Northgate",
    code: "NORTH-7X9K",
    contactEmail: "office@zz.test",
    contactPhone: null,
    website: null,
    addressLine: null,
    city: "Pune",
    region: "Maharashtra",
    postalCode: null,
    country: "India",
    gradeLow: "1",
    gradeHigh: "10",
    timezone: "Asia/Kolkata",
    createdAt: ago(3 * 86_400_000),
    removedAt: null,
  },
  invites: [
    { id: "i1", email: "head@zz.test", name: "ZZ Head", role: "PRINCIPAL", status: "PENDING", createdAt: ago(2 * 3_600_000), expiresAt: ago(-7 * 86_400_000) },
    { id: "i2", email: "admin@zz.test", name: null, role: "ADMIN", status: "ACCEPTED", createdAt: ago(5 * 86_400_000), expiresAt: ago(-2 * 86_400_000) },
  ],
  access: [{ id: "x1", operatorName: "ZZ Operator", reason: "ZZ checking the register", startedAt: ago(3_600_000), live: false }],
});
const REMOVED = { ...DETAIL, school: { ...DETAIL.school, removedAt: ago(86_400_000) } };

const mount = (overrides: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <OperatorSchool />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/operator/schools/s1": () => json(DETAIL), ...overrides },
    { me: OPERATOR },
  );

describe("one school, for the operator", () => {
  it("loads, then shows the name, the join code and zone, the invitations, who has looked inside, and the one door to the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const gate = gated();
    await mount({ "GET /api/v1/operator/schools/s1": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DETAIL));
    expect(await screen.findByText("ZZ Northgate")).toBeTruthy();
    expect(screen.getByText("Join code NORTH-7X9K · Asia/Kolkata")).toBeTruthy();
    expect(screen.getByText("head@zz.test")).toBeTruthy();
    expect(screen.getByText(/^Principal · ZZ Head · 2 hours ago/)).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("Accepted")).toBeTruthy();
    // Only the pending invitation can be withdrawn.
    expect(screen.getByRole("button", { name: "Revoke: head@zz.test" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Revoke: admin@zz.test" })).toBeNull();
    expect(screen.getByText(/^ZZ checking the register · /)).toBeTruthy();
    expect(screen.getByLabelText("City").props.value).toBe("Pune");
    expect(screen.getByText("Erasing stays on the web on purpose: nothing comes back, so it asks for the school's exact name there.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Erase school permanently" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/s1`);
    open.mockRestore();
  });

  it("invites a principal by email, then says so and reads the page again; a refusal stays under the email", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/schools/s1/invites": () => (refuse ? json({ error: "An invitation is already waiting for them.", code: "BAD_REQUEST" }, 422) : json({ ok: true }, 201)),
    });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "Principal" }));
    expect(screen.getByText("Reads the school whole, and decides who may be away. No attendance marking, no gradebook.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Email"), " new-head@zz.test ");
    await fireEvent.changeText(screen.getByLabelText("Name (optional)"), "ZZ New Head");
    await fireEvent.press(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/invites")?.body).toEqual({ email: "new-head@zz.test", name: "ZZ New Head", role: "PRINCIPAL" }));
    expect(await screen.findByText("Invitation sent")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBe(2));
    expect(screen.getByLabelText("Email").props.value).toBe("");

    refuse = true;
    await fireEvent.changeText(screen.getByLabelText("Email"), "head@zz.test");
    await fireEvent.press(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findByText("An invitation is already waiting for them.")).toBeTruthy();
    // The role chosen stays chosen after a send: a second principal is one field away. No name, no name sent.
    expect(calls().filter((c) => c.line === "POST /api/v1/operator/schools/s1/invites")[1]?.body).toEqual({ email: "head@zz.test", role: "PRINCIPAL" });
  });

  it("withdraws a pending invitation only after a confirm; a refusal is a toast with the server's sentence", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/invites/i1/revoke": () => (refuse ? json({ error: "That invitation is no longer pending.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("button", { name: "Revoke: head@zz.test" }));
    expect(screen.getByText("Withdraw the invitation to head@zz.test? The link in it stops working.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(calls().some((c) => c.line.endsWith("/revoke"))).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Revoke: head@zz.test" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/operator/invites/i1/revoke")).toBe(true));
    expect(await screen.findByText("Invitation withdrawn")).toBeTruthy();

    refuse = true;
    await fireEvent.press(screen.getByRole("button", { name: "Revoke: head@zz.test" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Not revoked: That invitation is no longer pending.")).toBeTruthy();
  });

  it("corrects the details, sending only what changed; the lib's refusal is an alert above the button", async () => {
    let refuse = false;
    const { calls } = await mount({
      "PATCH /api/v1/operator/schools/s1": () => (refuse ? json({ error: "The lowest grade cannot be above the highest.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("City"), " ZZ Nashik ");
    await fireEvent.changeText(screen.getByLabelText("Lowest grade"), "3");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(calls().find((c) => c.line === "PATCH /api/v1/operator/schools/s1")?.body).toEqual({ city: "ZZ Nashik", gradeLow: "3" }));
    expect(await screen.findByText("Saved")).toBeTruthy();

    refuse = true;
    await fireEvent.changeText(screen.getByLabelText("Highest grade"), "2");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("The lowest grade cannot be above the highest.")).toBeTruthy();
    // The form keeps what was typed, so the operator corrects it rather than starting again.
    expect(screen.getByLabelText("Highest grade").props.value).toBe("2");
  });

  it("removes only behind the school's exact name, typed, and sends the name for the server to check too", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/remove": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    const typed = screen.getByLabelText("Type the school's name to confirm removing it: ZZ Northgate");
    expect(screen.getByRole("button", { name: "Remove school" })).toBeDisabled();
    await fireEvent.changeText(typed, "ZZ Northgat");
    expect(screen.getByText("That did not match the school's name, so nothing was removed.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove school" })).toBeDisabled();
    await fireEvent.changeText(typed, " ZZ Northgate ");
    await fireEvent.press(screen.getByRole("button", { name: "Remove school" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/remove")?.body).toEqual({ confirmName: "ZZ Northgate" }));
    expect(await screen.findByText("School removed")).toBeTruthy();
  });

  it("a removed school: the badge, what removal did, and restore after a confirm — no invitations, no removal", async () => {
    const { calls } = await mount({
      "GET /api/v1/operator/schools/s1": () => json(REMOVED),
      "POST /api/v1/operator/schools/s1/restore": () => json({ ok: true }),
    });
    expect(await screen.findByText("removed yesterday")).toBeTruthy();
    expect(screen.getByText("Removed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove school" })).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Restore school" }));
    expect(screen.getByText("Put this school back on the server? Everything removal ended comes back.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/operator/schools/s1/restore")).toBe(true));
    expect(await screen.findByText("School restored")).toBeTruthy();
  });

  it("with no school id: an empty state whose door goes back", async () => {
    mockRouter.params = {};
    await mount();
    expect(await screen.findByText("No such school.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All schools" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/schools/s1": refused("No such school.", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("No such school.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBe(2));
  });
});
