import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { waitingQueueSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Joins } from "@/screens/shared/joins";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn() }), useLocalSearchParams: () => ({}) }));

const PATH = "/api/v1/shared/joins";
const JOIN = { id: "jr1", name: "ZZ Aanya Rao", age: 11, via: "CLASS", className: "ZZ Class 5A", onRoll: false, createdAt: "2026-09-29T08:00:00.000Z" };
const SCHOOL_JOIN = { id: "jr2", name: "ZZ Kabir Shah", age: null, via: "SCHOOL", className: null, onRoll: true, createdAt: "2026-09-29T09:00:00.000Z" };
const CLAIM = { id: "gc1", claimantName: "ZZ Meera Rao", claimantEmail: "zz-meera@test.invalid", relation: "GUARDIAN", childName: "ZZ Asha", className: "ZZ Class 5A", schoolName: "ZZ School", createdAt: "2026-09-29T08:30:00.000Z" };
const QUEUE = waitingQueueSchema.parse({ joins: [JOIN, SCHOOL_JOIN], claims: [CLAIM] });
const EMPTY = waitingQueueSchema.parse({ joins: [], claims: [] });

const mount = (role: "ADMIN" | "TEACHER" | "PARENT", answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <Joins />
    </ToastProvider>,
    role,
    answers,
  );

describe("people waiting for a yes", () => {
  it("loads, then lists who asked to join and who asked to be linked, with what the decider checks", async () => {
    const gate = gated();
    await mount("ADMIN", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(QUEUE));
    expect(await screen.findByText("ZZ Aanya Rao")).toBeTruthy();
    expect(screen.getByText("Waiting to join")).toBeTruthy();
    expect(screen.getByText("Pupils asking to join (2)")).toBeTruthy();
    expect(screen.getByText("By the class's code")).toBeTruthy();
    expect(screen.getByText("By the school's code")).toBeTruthy();
    expect(screen.getByText("Already a pupil here")).toBeTruthy();
    expect(screen.getByText(/^ZZ Class 5A · Age 11 · /)).toBeTruthy();
    expect(screen.getByText(/^No date of birth given · /)).toBeTruthy();
    expect(screen.getByText("Guardians asking to be linked (1)")).toBeTruthy();
    expect(screen.getByText("ZZ Meera Rao asks to be linked to ZZ Asha")).toBeTruthy();
    expect(screen.getByText(/^zz-meera@test\.invalid · ZZ Class 5A · ZZ School · /)).toBeTruthy();
  });

  it("lets a pupil in with one press, says so, and reads the queue again", async () => {
    let decided = false;
    const { calls } = await mount("TEACHER", {
      [`GET ${PATH}`]: () => json(decided ? EMPTY : waitingQueueSchema.parse({ joins: [JOIN], claims: [] })),
      "POST /api/v1/shared/joins/jr1/decide": () => {
        decided = true;
        return json({ ok: true });
      },
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Let in: ZZ Aanya Rao" }));
    expect(await screen.findByText("They are in")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/shared/joins/jr1/decide")?.body).toEqual({ decision: "APPROVE" });
    expect(await screen.findByText("Nobody is waiting")).toBeTruthy();
    expect(screen.queryByText("ZZ Aanya Rao")).toBeNull();
  });

  it("declining asks for a sentence first, which may be left empty; what is written goes with the decision", async () => {
    const { calls } = await mount("TEACHER", {
      [`GET ${PATH}`]: () => json(waitingQueueSchema.parse({ joins: [JOIN, SCHOOL_JOIN], claims: [] })),
      "POST /api/v1/shared/joins/jr1/decide": () => json({ ok: true }),
      "POST /api/v1/shared/joins/jr2/decide": () => json({ ok: true }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline: ZZ Aanya Rao" }));
    expect(screen.getByText("The person who asked will read this. Leave it empty to say only that the request was not accepted.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("A sentence for them (optional)"), "  Wrong class, ask for 5B.  ");
    await fireEvent.press(screen.getByRole("button", { name: "Decline: ZZ Aanya Rao" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/shared/joins/jr1/decide")?.body).toEqual({ decision: "DECLINE", reason: "Wrong class, ask for 5B." }));
    expect(await screen.findByText("Declined")).toBeTruthy();

    await fireEvent.press(await screen.findByRole("button", { name: "Decline: ZZ Kabir Shah" }));
    await fireEvent.press(screen.getByRole("button", { name: "Decline: ZZ Kabir Shah" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/shared/joins/jr2/decide")?.body).toEqual({ decision: "DECLINE" }));
  });

  it("declines a claim, and a refusal stays above the buttons", async () => {
    const taken = "That request to be linked has already been decided.";
    const { calls } = await mount("ADMIN", {
      [`GET ${PATH}`]: () => json(QUEUE),
      "POST /api/v1/shared/claims/gc1/decide": () => json({ error: taken, code: "FORBIDDEN" }, 403),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline: ZZ Meera Rao" }));
    // A claimant has not been told whose code it is, and the box says so.
    expect(screen.getByText(/^The person who asked will read this\. Do not name the child/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Decline: ZZ Meera Rao" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(taken);
    expect(calls().find((c) => c.line === "POST /api/v1/shared/claims/gc1/decide")?.body).toEqual({ decision: "DECLINE" });
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Approve: ZZ Meera Rao" })).toBeTruthy();
  });

  it("a guardian's is the claims on their own child, under the guardian's own title", async () => {
    await mount("PARENT", { [`GET ${PATH}`]: () => json(waitingQueueSchema.parse({ joins: [], claims: [CLAIM] })) });
    expect(await screen.findByText("Requests to be linked to your child")).toBeTruthy();
    expect(screen.getByText(/^Somebody typed your child's student code/)).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Approve: ZZ Meera Rao" })).toBeTruthy();
    expect(screen.queryByText("Waiting to join")).toBeNull();
  });

  it("nothing waiting says so, to the office and to a guardian in their own words", async () => {
    await mount("PARENT", { [`GET ${PATH}`]: () => json(EMPTY) });
    expect(await screen.findByText("Nobody is asking to be linked to your child.")).toBeTruthy();
  });

  it("a refused queue is an alert with a retry", async () => {
    const { calls } = await mount("ADMIN", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });
});
