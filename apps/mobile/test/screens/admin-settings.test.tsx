import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AdminSettings } from "@/screens/staff/settings";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const DATA = {
  school: {
    name: "ZZ School",
    code: "ZZSCH",
    logoPath: null,
    brandPrimary: null,
    contactEmail: "office@zz.test",
    contactPhone: "+91 11111",
    website: null,
    addressLine: "1 ZZ Road",
    city: "Pune",
    region: "Maharashtra",
    postalCode: "411001",
    country: "India",
    gradeLow: "1",
    gradeHigh: "10",
    timezone: "Asia/Kolkata",
    notifAutoReadDays: null,
    notifExpireDays: 45,
  },
  directory: { about: "ZZ about us.", published: true, admissionsContactMembershipId: "m3", contactName: "ZZ Contact", contactStillValid: false },
  contactCandidates: [{ membershipId: "m3", name: "ZZ Contact", role: "ADMIN" }],
  notifDefaults: { autoReadDays: 14, expireDays: 60 },
};
const SAVED = {
  name: "ZZ School",
  contactEmail: "office@zz.test",
  contactPhone: "+91 11111",
  website: "",
  addressLine: "1 ZZ Road",
  city: "Pune",
  region: "Maharashtra",
  postalCode: "411001",
  country: "India",
  gradeLow: "1",
  gradeHigh: "10",
  timezone: "Asia/Kolkata",
  brandPrimary: "",
  about: "ZZ about us.",
};

describe("school settings", () => {
  it("loads, then shows the details, the directory state and the housekeeping numbers", async () => {
    const gate = gated();
    await mountStaff(<AdminSettings />, "ADMIN", { "GET /api/v1/admin/settings": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DATA));
    await screen.findByDisplayValue("ZZ School");
    expect(screen.getByText("School code ZZSCH — this cannot be changed.")).toBeTruthy();
    expect(screen.getByDisplayValue("Asia/Kolkata")).toBeTruthy();
    expect(screen.getByText("In the directory")).toBeTruthy();
    expect(screen.getByText("Admissions contact: ZZ Contact")).toBeTruthy();
    expect(screen.getByText(/^The named contact is no longer active staff/)).toBeTruthy();
    expect(screen.getByText("Unread notices are marked read after 14 days; read ones are removed after 45 days.")).toBeTruthy();
    expect(screen.getByText("No logo yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("a change enables Save, which posts the whole form and says so", async () => {
    const { calls } = await mountStaff(<AdminSettings />, "ADMIN", { "GET /api/v1/admin/settings": () => json(DATA), "POST /api/v1/admin/settings": () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("School name"), "ZZ Renamed School");
    await fireEvent.press(screen.getByRole("radio", { name: "Teal" }));
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Settings saved");
    const post = calls().find((c) => c.line === "POST /api/v1/admin/settings");
    expect(post?.body).toEqual({ ...SAVED, name: "ZZ Renamed School", brandPrimary: "#0f766e" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });

  it("a bad email is caught before anything is sent", async () => {
    const { calls } = await mountStaff(<AdminSettings />, "ADMIN", { "GET /api/v1/admin/settings": () => json(DATA) });
    await fireEvent.changeText(await screen.findByLabelText("Contact email"), "not-an-email");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Enter a valid contact email.")).toBeTruthy();
    expect(screen.getByText("Not saved: Check the highlighted fields.")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/admin/settings")).toBe(false);
  });

  it("a refused save is said, not swallowed", async () => {
    await mountStaff(<AdminSettings />, "ADMIN", { "GET /api/v1/admin/settings": () => json(DATA), "POST /api/v1/admin/settings": refused("That timezone is not known.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Timezone"), "Mars/Olympus");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Not saved: That timezone is not known.")).toBeTruthy();
  });

  it("the logo, the directory and the housekeeping open on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<AdminSettings />, "ADMIN", { "GET /api/v1/admin/settings": () => json(DATA) });
    await fireEvent.press(await screen.findByRole("button", { name: "Choose an image" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/settings`);
    await fireEvent.press(screen.getByRole("button", { name: "Remove from the directory" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/settings#directory`);
    open.mockRestore();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AdminSettings />, "ADMIN", { "GET /api/v1/admin/settings": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });
});
