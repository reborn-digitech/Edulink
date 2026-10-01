import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { AdminSettings } from "@/screens/staff/settings";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
/** The phone's file picker and upload, stood in for: the test decides what the person picked. */
const mockPick = jest.fn();
jest.mock("@/lib/pick-file", () => ({ pickAndUpload: (...args: unknown[]) => mockPick(...args) }));

const DATA = {
  school: {
    name: "ZZ School",
    code: "ZZSCH",
    logoPath: null as string | null,
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
const WITH_LOGO = { ...DATA, school: { ...DATA.school, logoPath: "f0.png" } };
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
/** The teaching week the settings screen also asks for: Monday to Saturday unless a test says otherwise, and a save is remembered. */
const WEEK = "/api/v1/office/school-week";
function week(orphaned = 0): Answers {
  let days = [1, 2, 3, 4, 5, 6];
  return {
    [`GET ${WEEK}`]: () => json({ days }),
    [`POST ${WEEK}`]: async ({ init }) => {
      days = (JSON.parse(String(init.body)) as { days: number[] }).days;
      return json({ days, orphanedSlots: orphaned });
    },
  };
}
/** The pupils' own-eyes age the settings screen also asks for: never, unless a test says otherwise, and a save is remembered. */
const SELF_READ = "/api/v1/office/self-read-age";
function selfRead(initial: number | null = null): Answers {
  let selfReadAge = initial;
  return {
    [`GET ${SELF_READ}`]: () => json({ selfReadAge }),
    [`POST ${SELF_READ}`]: async ({ init }) => {
      selfReadAge = (JSON.parse(String(init.body)) as { selfReadAge: number | null }).selfReadAge;
      return json({ selfReadAge });
    },
  };
}
const withToasts = (answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <AdminSettings />
    </ToastProvider>,
    "ADMIN",
    answers,
  );

beforeEach(() => {
  mockRouter.push.mockClear();
  mockPick.mockReset();
});

describe("school settings", () => {
  it("loads, then shows the details, the directory state and the housekeeping numbers", async () => {
    const gate = gated();
    await mountStaff(<AdminSettings />, "ADMIN", { ...week(), "GET /api/v1/admin/settings": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DATA));
    await screen.findByDisplayValue("ZZ School");
    await screen.findByRole("switch", { name: "Monday" });
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
    const { calls } = await mountStaff(<AdminSettings />, "ADMIN", { ...week(), "GET /api/v1/admin/settings": () => json(DATA), "POST /api/v1/admin/settings": () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("School name"), "ZZ Renamed School");
    await screen.findByRole("switch", { name: "Monday" });
    await fireEvent.press(screen.getByRole("radio", { name: "Teal" }));
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Settings saved");
    const post = calls().find((c) => c.line === "POST /api/v1/admin/settings");
    expect(post?.body).toEqual({ ...SAVED, name: "ZZ Renamed School", brandPrimary: "#0f766e" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });

  it("a bad email is caught before anything is sent", async () => {
    const { calls } = await mountStaff(<AdminSettings />, "ADMIN", { ...week(), "GET /api/v1/admin/settings": () => json(DATA) });
    await fireEvent.changeText(await screen.findByLabelText("Contact email"), "not-an-email");
    await screen.findByRole("switch", { name: "Monday" });
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Enter a valid contact email.")).toBeTruthy();
    expect(screen.getByText("Not saved: Check the highlighted fields.")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/admin/settings")).toBe(false);
  });

  it("a refused save is said, not swallowed", async () => {
    await mountStaff(<AdminSettings />, "ADMIN", { ...week(), "GET /api/v1/admin/settings": () => json(DATA), "POST /api/v1/admin/settings": refused("That timezone is not known.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Timezone"), "Mars/Olympus");
    await screen.findByRole("switch", { name: "Monday" });
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Not saved: That timezone is not known.")).toBeTruthy();
  });

  it("a logo is picked from the phone's files and made the school's; closing the picker sends nothing", async () => {
    const { calls } = await withToasts({ ...week(), "GET /api/v1/admin/settings": () => json(DATA), "POST /api/v1/office/logo": () => json({ logoPath: "f1.png" }) });
    mockPick.mockResolvedValueOnce(null);
    await fireEvent.press(await screen.findByRole("button", { name: "Choose an image" }));
    await screen.findByRole("switch", { name: "Monday" });
    await waitFor(() => expect(mockPick).toHaveBeenCalledWith("image", "Could not save that."));
    expect(calls().some((c) => c.line === "POST /api/v1/office/logo")).toBe(false);
    mockPick.mockResolvedValueOnce({ fileId: "f1.png", mime: "image/png", size: 2048, name: "logo.png" });
    await fireEvent.press(screen.getByRole("button", { name: "Choose an image" }));
    expect(await screen.findByText("Logo saved")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/logo")?.body).toEqual({ fileId: "f1.png" });
  });

  it("a refused upload is the picker's sentence", async () => {
    await withToasts({ ...week(), "GET /api/v1/admin/settings": () => json(DATA) });
    mockPick.mockRejectedValueOnce(new Error("That file is too big."));
    await fireEvent.press(await screen.findByRole("button", { name: "Choose an image" }));
    await screen.findByRole("switch", { name: "Monday" });
    expect(await screen.findByText("That file is too big.")).toBeTruthy();
  });

  it("taking the logo off asks first", async () => {
    const { calls } = await withToasts({ ...week(), "GET /api/v1/admin/settings": () => json(WITH_LOGO), "POST /api/v1/office/logo": () => json({ logoPath: null }) });
    expect(await screen.findByText("Current logo")).toBeTruthy();
    await screen.findByRole("switch", { name: "Monday" });
    expect(screen.getByRole("button", { name: "Choose another" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Remove Logo" }));
    expect(calls().some((c) => c.line === "POST /api/v1/office/logo")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Remove Logo" }));
    expect(await screen.findByText("Logo removed")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/logo")?.body).toEqual({ fileId: null });
  });

  it("the directory profile is its own screen", async () => {
    await mountStaff(<AdminSettings />, "ADMIN", { ...week(), "GET /api/v1/admin/settings": () => json(DATA) });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit the directory profile" }));
    await screen.findByRole("switch", { name: "Monday" });
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/directory-profile");
  });

  it("housekeeping saves whole days (blank is the platform's number); anything else is caught; a range refusal is the server's", async () => {
    let answered = 0;
    const { calls } = await withToasts({
      ...week(),
      "GET /api/v1/admin/settings": () => json(DATA),
      "POST /api/v1/office/notifications/housekeeping": () => (answered++ === 0 ? json({ ok: true }) : json({ error: "Auto-read must be between 7 and 365 days.", code: "BAD_REQUEST" }, 422)),
    });
    await fireEvent.changeText(await screen.findByLabelText("Mark unread as read after (days)"), "3.5");
    await screen.findByRole("switch", { name: "Monday" });
    await fireEvent.press(screen.getByRole("button", { name: "Save: Notification housekeeping" }));
    expect(screen.getByText("Days must be whole numbers.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Mark unread as read after (days)"), "30");
    await fireEvent.changeText(screen.getByLabelText("Remove read notices after (days)"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Save: Notification housekeeping" }));
    expect(await screen.findByText("Housekeeping saved")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/notifications/housekeeping")?.body).toEqual({ autoReadDays: 30, expireDays: null });
    await fireEvent.changeText(screen.getByLabelText("Mark unread as read after (days)"), "2");
    await fireEvent.press(screen.getByRole("button", { name: "Save: Notification housekeeping" }));
    expect(await screen.findByText("Auto-read must be between 7 and 365 days.")).toBeTruthy();
  });

  it("the teaching week shows Monday to Sunday as switches; a change enables the save, which posts the days and says so", async () => {
    const { calls } = await withToasts({ ...week(), "GET /api/v1/admin/settings": () => json(DATA) });
    await screen.findByRole("switch", { name: "Monday" });
    expect(screen.getAllByRole("switch").map((s) => s.props.accessibilityLabel)).toEqual(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
    expect(screen.getByRole("switch", { name: "Saturday" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Sunday" })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Save the week" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("switch", { name: "Saturday" }));
    expect(screen.getByRole("switch", { name: "Saturday" })).not.toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Save the week" }));
    expect(await screen.findByText("Teaching week saved.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${WEEK}`)?.body).toEqual({ days: [1, 2, 3, 4, 5] });
    // Reread and settled: nothing left to save.
    await waitFor(() => expect(screen.getByRole("button", { name: "Save the week" })).toBeDisabled());
  });

  it("a day dropped with lessons on it is counted in the toast, and a week with no days is refused before anything is sent", async () => {
    const { calls } = await withToasts({ ...week(2), "GET /api/v1/admin/settings": () => json(DATA) });
    await screen.findByRole("switch", { name: "Monday" });
    await fireEvent.press(screen.getByRole("switch", { name: "Saturday" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the week" }));
    expect(await screen.findByText("Teaching week saved. 2 timetable lessons now sit on a day the school does not teach; move them on the timetable.")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: "Save the week" })).toBeDisabled());
    for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]) await fireEvent.press(screen.getByRole("switch", { name: day }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the week" }));
    expect(await screen.findByText("Pick at least one day.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${WEEK}`)).toHaveLength(1);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AdminSettings />, "ADMIN", { ...week(), "GET /api/v1/admin/settings": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });
});

describe("the pupils' own eyes", () => {
  it("shows the age, or blank for never, and saves a whole number of years with the sentence back", async () => {
    const { calls } = await withToasts({ ...week(), ...selfRead(), "GET /api/v1/admin/settings": () => json(DATA) });
    const field = await screen.findByLabelText("Pupils may read their own health card and incidents from age");
    expect(field.props.value).toBe("");
    await fireEvent.changeText(field, "16");
    await fireEvent.press(screen.getByRole("button", { name: "Save: Pupils' own eyes" }));
    await screen.findByText("Saved. Pupils aged 16 and over may read their own card and incidents.");
    expect(calls().find((c) => c.line === `POST ${SELF_READ}`)?.body).toEqual({ selfReadAge: 16 });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${SELF_READ}`).length).toBe(2));
  });

  it("blank switches it off; a word is refused before anything is sent; the server's refusal is a toast", async () => {
    const { calls } = await withToasts({ ...week(), ...selfRead(16), "GET /api/v1/admin/settings": () => json(DATA) });
    const field = await screen.findByLabelText("Pupils may read their own health card and incidents from age");
    expect(field.props.value).toBe("16");
    await fireEvent.changeText(field, "ten");
    await fireEvent.press(screen.getByRole("button", { name: "Save: Pupils' own eyes" }));
    expect(await screen.findByText("A whole number of years.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${SELF_READ}`)).toHaveLength(0);
    await fireEvent.changeText(field, "");
    await fireEvent.press(screen.getByRole("button", { name: "Save: Pupils' own eyes" }));
    await screen.findByText("Saved. Pupils do not read their own card or incidents.");
    expect(calls().find((c) => c.line === `POST ${SELF_READ}`)?.body).toEqual({ selfReadAge: null });
  });

  it("a refused save says why", async () => {
    await withToasts({ ...week(), [`GET ${SELF_READ}`]: () => json({ selfReadAge: null }), [`POST ${SELF_READ}`]: refused("ZZ not the office", 403), "GET /api/v1/admin/settings": () => json(DATA) });
    await fireEvent.changeText(await screen.findByLabelText("Pupils may read their own health card and incidents from age"), "14");
    await fireEvent.press(screen.getByRole("button", { name: "Save: Pupils' own eyes" }));
    expect(await screen.findByText("ZZ not the office")).toBeTruthy();
  });
});
