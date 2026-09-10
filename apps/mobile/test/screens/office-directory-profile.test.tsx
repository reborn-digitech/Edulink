import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminSettingsSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { SchoolDirectoryProfile } from "@/screens/staff/directory-profile";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SCHOOL = {
  name: "ZZ School",
  code: "ZZSCH",
  logoPath: null,
  brandPrimary: null,
  contactEmail: "office@zz.test",
  contactPhone: null,
  website: null,
  addressLine: null,
  city: "Pune",
  region: null,
  postalCode: null,
  country: "India",
  gradeLow: "1",
  gradeHigh: "10",
  timezone: "Asia/Kolkata",
  notifAutoReadDays: null,
  notifExpireDays: null,
};
const CANDIDATES = [
  { membershipId: "m3", name: "ZZ Contact", role: "ADMIN" },
  { membershipId: "m4", name: "ZZ Teacher", role: "TEACHER" },
];
const settings = (published: boolean, contactCandidates = CANDIDATES) =>
  adminSettingsSchema.parse({
    school: SCHOOL,
    directory: { about: "ZZ about us.", published, admissionsContactMembershipId: "m3", contactName: "ZZ Contact", contactStillValid: true },
    contactCandidates,
    notifDefaults: { autoReadDays: 14, expireDays: 60 },
  });
const mount = (answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <SchoolDirectoryProfile />
    </ToastProvider>,
    "ADMIN",
    answers,
  );

beforeEach(() => mockRouter.push.mockClear());

describe("the school's directory profile", () => {
  it("loads, then shows the words, the admissions contact and whether the school is listed", async () => {
    const gate = gated();
    const { calls } = await mount({ "GET /api/v1/admin/settings": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(settings(false)));
    expect(await screen.findByDisplayValue("ZZ about us.")).toBeTruthy();
    expect(screen.getByText("Not listed")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Contact · School admin" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Publish to the directory" })).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/settings")).toBe(true);
  });

  it("saving sends the words and the contact, and says so", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/settings": () => json(settings(false)), "POST /api/v1/office/directory": () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("About the school"), "  ZZ New words.  ");
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Teacher · Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Profile saved.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/directory")?.body).toEqual({ about: "ZZ New words.", admissionsContactMembershipId: "m4" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });

  it("publishing saves what is on screen first, then puts the school in the directory", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/settings": () => json(settings(false)), "POST /api/v1/office/directory": () => json({ ok: true }), "POST /api/v1/office/directory/publish": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish to the directory" }));
    expect(await screen.findByText("Your school is now in the directory.")).toBeTruthy();
    const writes = calls().filter((c) => c.line.startsWith("POST"));
    expect(writes.map((c) => c.line)).toEqual(["POST /api/v1/office/directory", "POST /api/v1/office/directory/publish"]);
    expect(writes[1]!.body).toEqual({ published: true });
  });

  it("taking the school out asks first, and leaves the words alone", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/settings": () => json(settings(true)), "POST /api/v1/office/directory/publish": () => json({ ok: true }) });
    expect(await screen.findByText("In the directory")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Remove from the directory" }));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Remove from the directory" }));
    expect(await screen.findByText("Your school has left the directory. Existing enquiries stay answerable.")).toBeTruthy();
    expect(calls().filter((c) => c.line.startsWith("POST")).map((c) => [c.line, c.body])).toEqual([["POST /api/v1/office/directory/publish", { published: false }]]);
  });

  it("a refused publish is the server's sentence", async () => {
    await mount({
      "GET /api/v1/admin/settings": () => json(settings(false)),
      "POST /api/v1/office/directory": () => json({ ok: true }),
      "POST /api/v1/office/directory/publish": refused("Name an admissions contact before publishing — enquiries need somewhere to land.", 422),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish to the directory" }));
    expect(await screen.findByText("Name an admissions contact before publishing — enquiries need somewhere to land.")).toBeTruthy();
  });

  it("with nobody to name as the contact, the door is inviting staff", async () => {
    await mount({ "GET /api/v1/admin/settings": () => json(settings(false, [])) });
    expect(await screen.findByText("No staff yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Invite people" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/invites");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/settings": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });
});
