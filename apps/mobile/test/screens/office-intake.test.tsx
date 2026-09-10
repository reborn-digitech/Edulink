import { Share } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminClassesSchema, intakeResultSchema, officeIntakePreviewSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Intake } from "@/screens/staff/intake";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASSES = adminClassesSchema.parse({
  classes: [{ id: "c1", name: "ZZ Class A", subject: null, gradeLevel: "1", section: null, room: null, color: null, joinCode: "ZZAAAA", archivedAt: null, pupils: 3, teachers: [], leaderless: false }],
  activeCount: 1,
  archivedCount: 0,
  leaderlessCount: 0,
});
const PREVIEW = officeIntakePreviewSchema.parse({
  valid: [
    { line: 2, name: "ZZ Aarav", birthdateKey: "2019-06-14", className: "ZZ Class A", guardianEmail: "rekha@zz.test", transfer: false, unknownClass: false },
    { line: 3, name: "ZZ Gita", birthdateKey: null, className: "ZZ Class 9", guardianEmail: null, transfer: true, unknownClass: true },
  ],
  problems: [{ line: 4, value: "", reasonKey: "intake.noName" }],
  recognised: { name: true, birthdate: true, className: true, pupilEmail: false, guardianEmail: true },
});
const RESULT = intakeResultSchema.parse({
  admitted: 2,
  guardiansInvited: 1,
  outcomes: [
    { line: 2, name: "ZZ Aarav", status: "admitted", studentCode: "STU-AAAA-1111", handle: "aarav.k4f9", firstSignInCode: "ABCD-2345", className: "ZZ Class A", guardian: "invited" },
    { line: 3, name: "ZZ Gita", status: "admitted", studentCode: "STU-7K2M-9QDX", className: null, guardian: "none", linked: true },
    { line: 5, name: "ZZ Dup", status: "skipped", reasonKey: "intake.alreadyOnRoll" },
  ],
  problems: [],
});
const LIST = "name,date of birth,class,guardian email\nZZ Aarav,14/06/2019,ZZ Class A,rekha@zz.test\nZZ Gita,,ZZ Class 9,\n,,,";
const BASE: Answers = { "GET /api/v1/admin/classes": () => json(CLASSES) };
const mount = (answers: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <Intake />
    </ToastProvider>,
    "ADMIN",
    { ...BASE, ...answers },
  );

beforeEach(() => mockRouter.push.mockClear());

describe("admitting pupils from a list", () => {
  it("loads, then shows the classes a list may name; nothing is checked until asked", async () => {
    const gate = gated();
    const { calls } = await mount({ "GET /api/v1/admin/classes": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(CLASSES));
    expect(await screen.findByText("ZZ Class A")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check the list" })).toBeDisabled();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/classes")).toBe(true);
  });

  it("the server's parser reads the list back first; Admit then admits, and the codes go to the share sheet", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const { calls } = await mount({ "POST /api/v1/office/intake/preview": () => json(PREVIEW), "POST /api/v1/admin/people/intake": () => json(RESULT) });
    await fireEvent.changeText(await screen.findByLabelText("Admission list"), LIST);
    await fireEvent.press(screen.getByRole("button", { name: "Check the list" }));
    await screen.findByText("2 ready to admit · 1 need a look");
    expect(calls().find((c) => c.line === "POST /api/v1/office/intake/preview")?.body).toEqual({ csv: LIST });
    expect(screen.getByText("Reading columns: name, date of birth, class, guardian email · 1 with a guardian to invite · 1 without a date of birth · 0 without a class")).toBeTruthy();
    expect(screen.getByText(/^ZZ Aarav · .*2019, ZZ Gita · Transferred in$/)).toBeTruthy();
    expect(screen.getByText("line 3 · ZZ Class 9")).toBeTruthy();
    expect(screen.getByText("No class by that name")).toBeTruthy();
    expect(screen.getByText("line 4 · (blank row)")).toBeTruthy();
    expect(screen.getByText("No name on this row")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/admin/people/intake")).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Admit 2 pupils" }));
    expect((await screen.findAllByText("2 pupils admitted")).length).toBeGreaterThan(0);
    expect(calls().find((c) => c.line === "POST /api/v1/admin/people/intake")?.body).toEqual({ csv: LIST });
    expect(screen.getByText("1 parent invited")).toBeTruthy();
    expect(screen.getByText(/^Sign-in codes work for 14 days/)).toBeTruthy();
    expect(screen.getByText("ZZ Class A · Student code: STU-AAAA-1111 · Sign-in handle: aarav.k4f9 · Sign-in code: ABCD-2345 · Guardian: Invited")).toBeTruthy();
    expect(screen.getByText("ZZ Gita · Transferred in")).toBeTruthy();
    expect(screen.getByText("1 not sent")).toBeTruthy();
    expect(screen.getByText("line 5 · ZZ Dup")).toBeTruthy();
    expect(screen.getByText("Already on the roll")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Share this list" }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("ABCD-2345") }));
    await fireEvent.press(screen.getByRole("button", { name: "See the directory" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/people");
    share.mockRestore();
  });

  it("a school with no classes is offered one first, and may still admit without", async () => {
    await mount({ "GET /api/v1/admin/classes": () => json({ classes: [], activeCount: 0, archivedCount: 0, leaderlessCount: 0 }) });
    expect(await screen.findByText("No classes yet")).toBeTruthy();
    expect(screen.getByLabelText("Admission list")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Create a class" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/class-new");
  });

  it("a refused admission is the server's sentence, and the list stays", async () => {
    await mount({ "POST /api/v1/office/intake/preview": () => json(PREVIEW), "POST /api/v1/admin/people/intake": refused("None of those rows could be admitted.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Admission list"), LIST);
    await fireEvent.press(screen.getByRole("button", { name: "Check the list" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Admit 2 pupils" }));
    expect(await screen.findByText("None of those rows could be admitted.")).toBeTruthy();
    expect(screen.getByLabelText("Admission list")).toHaveDisplayValue(LIST);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/classes": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/classes").length).toBe(2));
  });
});
