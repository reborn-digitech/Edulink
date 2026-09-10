import { Share } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminSettingsSchema, adminStaffSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { ClassNew } from "@/screens/staff/class-new";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SETTINGS = adminSettingsSchema.parse({
  school: {
    name: "ZZ School",
    code: "ZZSCH",
    logoPath: null,
    brandPrimary: null,
    contactEmail: "office@zz.test",
    contactPhone: null,
    website: null,
    addressLine: null,
    city: null,
    region: null,
    postalCode: null,
    country: null,
    gradeLow: "1",
    gradeHigh: "5",
    timezone: "Asia/Kolkata",
    notifAutoReadDays: null,
    notifExpireDays: null,
  },
  directory: { about: "", published: false, admissionsContactMembershipId: null, contactName: null, contactStillValid: false },
  contactCandidates: [],
  notifDefaults: { autoReadDays: 14, expireDays: 60 },
});
const staff = (people: { membershipId: string; name: string }[]) =>
  adminStaffSchema.parse({
    staff: people.map((p) => ({ ...p, role: "TEACHER", preferredName: null, avatarKey: null, subjects: [], staffRecord: null, leadClasses: [], balance: null })),
    total: people.length,
    roleCounts: [{ role: "TEACHER", count: people.length }],
    subjectOptions: [],
  });
const BASE: Answers = { "GET /api/v1/admin/settings": () => json(SETTINGS), "GET /api/v1/admin/staff": () => json(staff([{ membershipId: "m2", name: "ZZ Teacher" }])) };
const mount = (answers: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <ClassNew />
    </ToastProvider>,
    "ADMIN",
    { ...BASE, ...answers },
  );

async function fill() {
  await fireEvent.changeText(await screen.findByLabelText("Class name"), "ZZ Class 6B");
  await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ Maths");
  await fireEvent.press(screen.getByRole("radio", { name: "3" }));
  await fireEvent.changeText(screen.getByLabelText("Section (optional)"), "B");
  await fireEvent.changeText(screen.getByLabelText("Room"), "12");
  await fireEvent.press(screen.getByRole("radio", { name: "Teal" }));
}

beforeEach(() => mockRouter.push.mockClear());

describe("a new class", () => {
  it("loads, then offers the school's grades, the colours and the teachers", async () => {
    const gate = gated();
    const { calls } = await mount({ "GET /api/v1/admin/settings": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(SETTINGS));
    await screen.findByLabelText("Class name");
    expect(screen.getByRole("radio", { name: "Not tied to a grade" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "5" })).toBeTruthy();
    expect(screen.getByText("This school teaches 1–5.")).toBeTruthy();
    expect(await screen.findByRole("radio", { name: "ZZ Teacher" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create class" })).toBeDisabled();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/staff?role=TEACHER")).toBe(true);
  });

  it("creates the class, then puts the teacher in charge; the join code is shown and shared, and Done opens the class", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const { calls } = await mount({ "POST /api/v1/admin/classes": () => json({ classId: "k9", joinCode: "ZZJOIN" }, 201), "POST /api/v1/admin/classes/k9/teacher": () => json({ ok: true }) });
    await fill();
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create class" }));
    expect((await screen.findAllByText("ZZ Class 6B is ready")).length).toBeGreaterThan(0);
    expect(calls().find((c) => c.line === "POST /api/v1/admin/classes")?.body).toEqual({ name: "ZZ Class 6B", subject: "ZZ Maths", gradeLevel: "3", section: "B", room: "12", color: "#14b8a6" });
    expect(calls().find((c) => c.line === "POST /api/v1/admin/classes/k9/teacher")?.body).toEqual({ teacherMembershipId: "m2", assigned: true });
    expect(screen.getByText("ZZJOIN")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Share the class code" }));
    expect(share).toHaveBeenCalledWith({ message: "ZZ Class 6B: ZZJOIN" });
    await fireEvent.press(screen.getByRole("button", { name: "Done" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/classes/detail", params: { classId: "k9" } });
    share.mockRestore();
  });

  it("a name already taken is said under the name, and no teacher is assigned", async () => {
    const { calls } = await mount({
      "POST /api/v1/admin/classes": () => json({ error: "Check the form.", code: "BAD_REQUEST", issues: { name: "A class with that name already exists. Give this one a different name." } }, 422),
    });
    await fill();
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create class" }));
    expect(await screen.findByText("A class with that name already exists. Give this one a different name.")).toBeTruthy();
    expect(calls().some((c) => c.line.endsWith("/teacher"))).toBe(false);
    expect(screen.getByLabelText("Class name")).toHaveDisplayValue("ZZ Class 6B");
  });

  it("a teacher the server will not assign leaves the class made, and says so", async () => {
    await mount({ "POST /api/v1/admin/classes": () => json({ classId: "k9", joinCode: "ZZJOIN" }, 201), "POST /api/v1/admin/classes/k9/teacher": refused("That teacher is not in your school.", 422) });
    await fill();
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Create class" }));
    expect(await screen.findByText("Class created, but the teacher was not assigned")).toBeTruthy();
    expect(screen.getByText("You can assign them from the class list.")).toBeTruthy();
  });

  it("with no teachers yet, the door is inviting the first", async () => {
    await mount({ "GET /api/v1/admin/staff": () => json(staff([])) });
    expect(await screen.findByText("No teachers yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Invite your first teacher" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/invites", params: { role: "TEACHER" } });
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/settings": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/settings").length).toBe(2));
  });
});
