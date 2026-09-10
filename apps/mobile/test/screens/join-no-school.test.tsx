import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { __setOutboxStore, memoryOutbox } from "@/lib/outbox";
import { NoSchool } from "@/screens/shared/no-school";
import { json, me, mountStaff, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useLocalSearchParams: () => ({}) }));

/** Signed in, part of no school: no contexts and nothing active. */
const NO_SCHOOL = { ...me("STUDENT"), user: { ...me("STUDENT").user, name: "ZZ Aanya", preferredName: "Aanya" }, active: { schoolId: null, role: null, membershipId: null }, contexts: [] };
const JOINED = { ...NO_SCHOOL, active: { schoolId: "s1", role: "STUDENT", membershipId: "m9" }, contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "STUDENT" }] };
const CLASS = { kind: "class", schoolName: "ZZ School", className: "ZZ Class 5A" };

const mount = (answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <NoSchool />
    </ToastProvider>,
    "STUDENT",
    answers,
    { me: NO_SCHOOL },
  );

async function typeAndCheck(code: string) {
  await screen.findByText("What's your code?");
  await fireEvent.changeText(screen.getByLabelText("School or class code"), code);
  await fireEvent.press(screen.getByRole("button", { name: "Check my code" }));
}

describe("joining a school with a code, from the phone", () => {
  it("checks the code, shows the school and the class, joins as a pupil, and reads /me again", async () => {
    let joined = false;
    const { calls } = await mount({
      "POST /api/v1/join/lookup": () => json(CLASS),
      "POST /api/v1/join": () => {
        joined = true;
        return json(JOINED);
      },
      "GET /api/v1/me": () => json(joined ? JOINED : NO_SCHOOL),
    });
    expect(screen.queryByText(/web/i)).toBeNull();
    await typeAndCheck("zzc5a12");
    expect(await screen.findByText("ZZ School")).toBeTruthy();
    expect(screen.getByText("Class: ZZ Class 5A")).toBeTruthy();
    expect(screen.getByText("You will join as a pupil.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/join/lookup")?.body).toEqual({ code: "ZZC-5A12" });

    const mesBefore = calls().filter((c) => c.line === "GET /api/v1/me").length;
    await fireEvent.press(screen.getByRole("button", { name: "Join ZZ Class 5A as Aanya" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/me").length).toBeGreaterThan(mesBefore));
    expect(calls().find((c) => c.line === "POST /api/v1/join")?.body).toEqual({ code: "ZZC-5A12" });
    expect(await screen.findByText("You're in! 🎉")).toBeTruthy();
  });

  it("a whole-school code says so and names the school on the button", async () => {
    await mount({ "POST /api/v1/join/lookup": () => json({ kind: "school", schoolName: "ZZ School", className: null }) });
    await typeAndCheck("ZZSCH1234");
    expect(await screen.findByText("Whole school")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Join ZZ School as Aanya" })).toBeTruthy();
  });

  it("a code the server does not know is refused under the field, and no join is offered", async () => {
    const { calls } = await mount({
      "POST /api/v1/join/lookup": () => json({ error: "We could not find that code.", code: "BAD_REQUEST", issues: { code: "We could not find that code." } }, 422),
    });
    await typeAndCheck("QQQ8888");
    expect(await screen.findByText("We could not find that code.")).toBeTruthy();
    expect(screen.queryByText("You will join as a pupil.")).toBeNull();
    expect(calls().some((c) => c.line === "POST /api/v1/join")).toBe(false);
  });

  it("a parent's account is refused as a Failed with a retry that asks again", async () => {
    const parent = "This account is linked to a child as a parent, so it cannot join a class as a pupil.";
    const { calls } = await mount({
      "POST /api/v1/join/lookup": () => json(CLASS),
      "POST /api/v1/join": () => json({ error: parent, code: "BAD_REQUEST" }, 422),
    });
    await typeAndCheck("ZZC5A12");
    await fireEvent.press(await screen.findByRole("button", { name: "Join ZZ Class 5A as Aanya" }));
    expect(await screen.findByText(parent)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/join").length).toBe(2));
    expect(calls().filter((c) => c.line === "GET /api/v1/me").length).toBe(1);
  });

  it("keeps the way out: sign out", async () => {
    // Signing out empties the outbox; an in-memory one stands in for the device's.
    __setOutboxStore(memoryOutbox());
    const { calls } = await mount({ "POST /api/v1/auth/logout": () => json({ ok: true }) });
    await screen.findByText("You are not part of a school yet");
    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/auth/logout")).toBe(true));
  });
});
