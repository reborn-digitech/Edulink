import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { mentoringThreadDetailSchema } from "@edulink/contracts";
import { MentoringThread } from "@/screens/shared/mentoring-thread";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ID = "mt1";
const PATH = `/api/v1/shared/mentoring/${ID}`;
const SEND = `${PATH}/messages`;
const CONSENT = `/api/v1/community/mentoring/${ID}/consent`;
const CLOSE = `/api/v1/community/mentoring/${ID}/close`;
const CONFIRM = "End this mentorship? Nobody will be able to send a message after this.";
const THREAD = mentoringThreadDetailSchema.parse({
  id: ID,
  status: "ACTIVE",
  purpose: "ZZ Engineering routes",
  schoolName: "ZZ School",
  studentMembershipId: "p1",
  studentName: "ZZ Asha",
  expertName: "ZZ Mentor",
  awaitingConsent: false,
  canPost: true,
  isGuardian: false,
  isStaff: false,
  messages: [
    { id: "m1", body: "Which branch of engineering interests you?", createdAt: "2026-09-06T10:00:00.000Z", authorName: "ZZ Mentor", mine: false },
    { id: "m2", body: "Bridges, mostly.", createdAt: "2026-09-06T11:00:00.000Z", authorName: "ZZ Asha", mine: true },
  ],
});
/** What a guardian is shown before they have said yes. */
const ASKING = { ...THREAD, status: "PENDING_CONSENT", awaitingConsent: true, canPost: false, isGuardian: true, messages: [] };

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { threadId: ID };
});

describe("a mentoring thread", () => {
  it("loads the thread named in the route, says who can read it, and shows both sides", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<MentoringThread />, "STUDENT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(THREAD));
    await screen.findByText("Bridges, mostly.");
    expect(screen.getByText("ZZ Asha & ZZ Mentor")).toBeTruthy();
    expect(screen.getByText("This conversation is not private. ZZ Asha’s guardians and ZZ School can read every message.")).toBeTruthy();
    expect(screen.getByText("ZZ Mentor")).toBeTruthy();
    expect(screen.getByText("You")).toBeTruthy();
    // A pupil can neither agree nor end it.
    expect(screen.queryByRole("button", { name: "End this mentorship" })).toBeNull();
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
  });

  it("sends through the thread's messages endpoint, clears the box and re-reads", async () => {
    const { calls } = await mountStaff(<MentoringThread />, "STUDENT", { [`GET ${PATH}`]: () => json(THREAD), [`POST ${SEND}`]: () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("Write a message…"), "I would like to know more.");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sent");
    expect(calls().find((c) => c.line === `POST ${SEND}`)?.body).toEqual({ body: "I would like to know more." });
    expect(screen.getByLabelText("Write a message…")).toHaveDisplayValue("");
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("an empty message is refused on the device", async () => {
    const { calls } = await mountStaff(<MentoringThread />, "STUDENT", { [`GET ${PATH}`]: () => json(THREAD) });
    await fireEvent.press(await screen.findByRole("button", { name: "Send" }));
    expect(screen.getByText("Write something first.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${SEND}`)).toBe(false);
  });

  it("a guardian asked to agree has no composer, says yes here, and from an empty thread goes back to the list", async () => {
    const { calls } = await mountStaff(<MentoringThread />, "PARENT", { [`GET ${PATH}`]: () => json(ASKING), [`POST ${CONSENT}`]: () => json({ ok: true }) });
    await screen.findByText("Do you agree to this mentoring going ahead?");
    expect(screen.getByText("Waiting for a guardian to agree — nobody can send a message yet")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Yes, go ahead" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${CONSENT}`)).toBe(true));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
    expect(screen.getByText("No messages yet. Say hello.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All mentoring" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/mentoring");
  });

  it("a guardian may say no instead: asked first, cancellable, then it ends", async () => {
    const { calls } = await mountStaff(<MentoringThread />, "PARENT", { [`GET ${PATH}`]: () => json(ASKING), [`POST ${CLOSE}`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "No, end it" }));
    expect(screen.getByText(CONFIRM)).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${CLOSE}`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText(CONFIRM)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "No, end it" }));
    await fireEvent.press(screen.getByRole("button", { name: "End this mentorship" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${CLOSE}`)).toBe(true));
    expect(calls().some((c) => c.line === `POST ${CONSENT}`)).toBe(false);
  });

  it("staff end it here, after a confirm, and it re-reads", async () => {
    const { calls } = await mountStaff(<MentoringThread />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...THREAD, canPost: false, isStaff: true }), [`POST ${CLOSE}`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "End this mentorship" }));
    expect(screen.getByText(CONFIRM)).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${CLOSE}`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "End this mentorship" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${CLOSE}`)).toBe(true));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
    expect(screen.queryByText(CONFIRM)).toBeNull();
  });

  it("a refused ending is the server's sentence", async () => {
    await mountStaff(<MentoringThread />, "TEACHER", { [`GET ${PATH}`]: () => json({ ...THREAD, canPost: false, isStaff: true }), [`POST ${CLOSE}`]: refused("ZZ not one of your pupils", 403) });
    await fireEvent.press(await screen.findByRole("button", { name: "End this mentorship" }));
    await fireEvent.press(screen.getByRole("button", { name: "End this mentorship" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not one of your pupils");
  });

  it("a closed one says so and has no composer", async () => {
    await mountStaff(<MentoringThread />, "ADMIN", { [`GET ${PATH}`]: () => json({ ...THREAD, status: "CLOSED", canPost: false, isStaff: true }) });
    expect(await screen.findByText("This mentorship has ended")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "End this mentorship" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  it("a refused message is shown with a retry", async () => {
    await mountStaff(<MentoringThread />, "STUDENT", { [`GET ${PATH}`]: () => json(THREAD), [`POST ${SEND}`]: refused("ZZ nobody can send a message yet", 409) });
    await fireEvent.changeText(await screen.findByLabelText("Write a message…"), "Hello");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ nobody can send a message yet");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a refused thread is an alert with a retry", async () => {
    const { calls } = await mountStaff(<MentoringThread />, "STUDENT", { [`GET ${PATH}`]: refused("ZZ not in this mentorship", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not in this mentorship");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("without a thread id it says the link did not work, and asks nothing", async () => {
    mockRouter.params = {};
    const { calls } = await mountStaff(<MentoringThread />, "STUDENT", {});
    expect(screen.getByRole("alert")).toHaveTextContent(/That link did not work/);
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/shared/mentoring"))).toBe(false);
  });
});
