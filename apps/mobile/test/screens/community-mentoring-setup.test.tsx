import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { communityMentoringOptionsSchema, mentoringPageSchema } from "@edulink/contracts";
import { MentoringSetup } from "@/screens/shared/mentoring-setup";
import { gated, json, me, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const OPTIONS = "/api/v1/community/mentoring/options";
const LIST = "/api/v1/shared/mentoring";
const ASK = "/api/v1/community/mentoring/ask";
const PAIR = "/api/v1/community/mentoring/pair";
const EXPERT = "czz00000000000000expert01";
const EXPERT2 = "czz00000000000000expert02";
const PUPIL = "czz000000000000000pupil01";
const REQUEST = "czz0000000000000request01";
const DECIDE = `/api/v1/community/mentoring/${REQUEST}/decide`;
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();

const ASKABLE = communityMentoringOptionsSchema.parse({
  pairing: { experts: [], pupils: [] },
  askable: [{ id: EXPERT, name: "ZZ Mentor", headline: "ZZ Bridges and beams", bio: "ZZ Twenty years building bridges.", specialisms: ["Civil engineering", "Maths"], verified: true }],
  openRequests: 0,
  maxOpenRequests: 3,
});
const PAIRING = communityMentoringOptionsSchema.parse({
  pairing: {
    experts: [
      { id: EXPERT, name: "ZZ Mentor", headline: "ZZ Bridges", verified: true },
      { id: EXPERT2, name: "ZZ Tutor", headline: "ZZ Music", verified: false },
    ],
    pupils: [
      { id: PUPIL, name: "ZZ Asha" },
      { id: "czz000000000000000pupil02", name: "ZZ Ravi" },
    ],
  },
  askable: [],
  openRequests: 0,
  maxOpenRequests: 3,
});
const REQUESTS = mentoringPageSchema.parse({
  threads: [],
  requests: [{ threadId: REQUEST, studentName: "ZZ Kiran", studentMembershipId: "p4", expertName: "ZZ Guide", expertHeadline: "ZZ Robotics", expertVerified: true, purpose: "ZZ Help me build a robot arm", askedAt: hourAgo }],
});

beforeEach(() => {
  mockRouter.push.mockReset();
});

describe("mentoring set-up, for a pupil", () => {
  it("loads, says who decides before anything is typed, and asks the chosen mentor", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<MentoringSetup />, "STUDENT", { [`GET ${OPTIONS}`]: gate.answer, [`POST ${ASK}`]: () => json({ threadId: "czz00000000000000thread01" }, 201) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(ASKABLE));
    await screen.findByText("ZZ Mentor");
    expect(screen.getByText(/^Asking is not the same as being paired\./)).toBeTruthy();
    expect(screen.getByText("Checked")).toBeTruthy();
    expect(screen.getByText("Civil engineering · Maths")).toBeTruthy();
    // Nothing to type until a mentor is chosen; too little typed keeps the button off.
    expect(screen.queryByLabelText("What would you like help with?")).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Mentor, ZZ Bridges and beams" }));
    await fireEvent.changeText(screen.getByLabelText("What would you like help with?"), "Bridges");
    expect(screen.getByRole("button", { name: "Ask your school" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("What would you like help with?"), "  How bridges carry heavy loads  ");
    await fireEvent.press(screen.getByRole("button", { name: "Ask your school" }));
    expect(await screen.findByText("Sent to your school")).toBeTruthy();
    expect(screen.getByText("They will look at it and let you know.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${ASK}`)?.body).toEqual({ expertProfileId: EXPERT, purpose: "How bridges carry heavy loads" });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${OPTIONS}`)).toHaveLength(2));
  });

  it("the library's refusal sits under the box, and what was typed stays", async () => {
    await mountStaff(<MentoringSetup />, "STUDENT", { [`GET ${OPTIONS}`]: () => json(ASKABLE), [`POST ${ASK}`]: refused("You have already asked this mentor. Your school has it.", 422) });
    await fireEvent.press(await screen.findByRole("radio", { name: /^ZZ Mentor/ }));
    await fireEvent.changeText(screen.getByLabelText("What would you like help with?"), "How bridges carry heavy loads");
    await fireEvent.press(screen.getByRole("button", { name: "Ask your school" }));
    expect(await screen.findByText("You have already asked this mentor. Your school has it.")).toBeTruthy();
    expect(screen.getByLabelText("What would you like help with?")).toHaveDisplayValue("How bridges carry heavy loads");
  });

  it("at the limit there is nothing to fill in, and the door is the list", async () => {
    await mountStaff(<MentoringSetup />, "STUDENT", { [`GET ${OPTIONS}`]: () => json({ ...ASKABLE, openRequests: 3 }) });
    expect(await screen.findByText(/^You have 3 requests waiting already\./)).toBeTruthy();
    expect(screen.queryByRole("radio")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "All mentoring" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/mentoring");
  });

  it("with nobody taking requests, says so", async () => {
    await mountStaff(<MentoringSetup />, "STUDENT", { [`GET ${OPTIONS}`]: () => json({ ...ASKABLE, askable: [] }) });
    expect(await screen.findByText("Nobody is taking mentoring requests just now. Have a look again soon.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All mentoring" })).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<MentoringSetup />, "STUDENT", { [`GET ${OPTIONS}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${OPTIONS}`)).toHaveLength(2));
  });
});

describe("mentoring set-up, for the school", () => {
  it("the office sees the pupils' asks and agrees to one; the family is asked next", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<MentoringSetup />, "ADMIN", { [`GET ${OPTIONS}`]: () => json(PAIRING), [`GET ${LIST}`]: gate.answer, [`POST ${DECIDE}`]: () => json({ ok: true }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(REQUESTS));
    await screen.findByText("ZZ Kiran → ZZ Guide");
    expect(screen.getByText("1 pupil asking for a mentor")).toBeTruthy();
    expect(screen.getByText("“ZZ Help me build a robot arm”")).toBeTruthy();
    expect(screen.getByText(/^ZZ Robotics · asked 1 hour ago$/)).toBeTruthy();
    // The office pairs too: the pairing lists are on the same screen.
    expect(screen.getByRole("radio", { name: "ZZ Asha" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Agree, and ask the family: ZZ Kiran" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${DECIDE}`)?.body).toEqual({ approve: true }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${LIST}`)).toHaveLength(2));
  });

  it("the head declines with a reason the pupil reads — asked for first, cancellable — and does not pair", async () => {
    const { calls } = await mountStaff(<MentoringSetup />, "PRINCIPAL", { [`GET ${LIST}`]: () => json(REQUESTS), [`POST ${DECIDE}`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "No, and tell them why" }));
    expect(calls().some((c) => c.line === `POST ${DECIDE}`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Why not? ZZ Kiran will read this.")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "No, and tell them why" }));
    await fireEvent.changeText(screen.getByLabelText("Why not? ZZ Kiran will read this."), " We have a robotics club on Fridays. ");
    await fireEvent.press(screen.getByRole("button", { name: "No, and tell them why: ZZ Kiran" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${DECIDE}`)?.body).toEqual({ approve: false, reason: "We have a robotics club on Fridays." }));
    expect(calls().some((c) => c.line === `GET ${OPTIONS}`)).toBe(false);
    expect(screen.queryByRole("button", { name: "Ask the guardian" })).toBeNull();
  });

  it("the head with nothing waiting is told so, and the door is the list", async () => {
    await mountStaff(<MentoringSetup />, "PRINCIPAL", { [`GET ${LIST}`]: () => json({ threads: [], requests: [] }) });
    expect(await screen.findByText("Nobody is waiting on a decision just now.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All mentoring" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/mentoring");
  });

  it("a refused decision is the server's sentence", async () => {
    await mountStaff(<MentoringSetup />, "ADMIN", { [`GET ${OPTIONS}`]: () => json(PAIRING), [`GET ${LIST}`]: () => json(REQUESTS), [`POST ${DECIDE}`]: refused("That request is no longer waiting.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Agree, and ask the family: ZZ Kiran" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That request is no longer waiting.");
  });

  it("a teacher pairs a pupil with a mentor, is warned about an unverified one, and lands on the new thread", async () => {
    const THREAD = "czz00000000000000thread02";
    const { calls } = await mountStaff(<MentoringSetup />, "TEACHER", { [`GET ${OPTIONS}`]: () => json(PAIRING), [`POST ${PAIR}`]: () => json({ threadId: THREAD }, 201) });
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Asha" }));
    // Chosen, the list folds to the one pupil.
    expect(screen.queryByRole("radio", { name: "ZZ Ravi" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Tutor, ZZ Music" }));
    expect(screen.getByText("This mentor has been published but their identity is not verified.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Tutor, ZZ Music" }));
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Mentor, ZZ Bridges" }));
    expect(screen.queryByText("This mentor has been published but their identity is not verified.")).toBeNull();
    expect(screen.getByRole("button", { name: "Ask the guardian" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("What is the mentoring for?"), " Careers in engineering ");
    await fireEvent.press(screen.getByRole("button", { name: "Ask the guardian" }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/mentoring/thread", params: { threadId: THREAD } }));
    expect(calls().find((c) => c.line === `POST ${PAIR}`)?.body).toEqual({ expertProfileId: EXPERT, studentMembershipId: PUPIL, purpose: "Careers in engineering" });
    // A teacher does not decide the pupils' asks: the queue is never read.
    expect(calls().some((c) => c.line === `GET ${LIST}`)).toBe(false);
  });

  it("a refused pairing is the server's sentence", async () => {
    await mountStaff(<MentoringSetup />, "TEACHER", { [`GET ${OPTIONS}`]: () => json(PAIRING), [`POST ${PAIR}`]: refused("ZZ Mentor is mentoring as many people as they have agreed to just now.", 409) });
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Asha" }));
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Mentor, ZZ Bridges" }));
    await fireEvent.changeText(screen.getByLabelText("What is the mentoring for?"), "Careers in engineering");
    await fireEvent.press(screen.getByRole("button", { name: "Ask the guardian" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Mentor is mentoring as many people as they have agreed to just now.");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("with no mentor to pair, says so, and the door is the experts", async () => {
    await mountStaff(<MentoringSetup />, "TEACHER", { [`GET ${OPTIONS}`]: () => json({ ...PAIRING, pairing: { experts: [], pupils: PAIRING.pairing.pupils } }) });
    expect(await screen.findByText(/^No reviewed experts are available yet/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Experts" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/experts");
  });

  it("a guardian has nothing to set up; the door is the list", async () => {
    const { calls } = await mountStaff(<MentoringSetup />, "PARENT", {}, { me: { ...me("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null } } });
    expect(await screen.findByText(/^A teacher or admin sets up mentoring/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All mentoring" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/mentoring");
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/community"))).toBe(false);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<MentoringSetup />, "ADMIN", { [`GET ${OPTIONS}`]: refused("ZZ broke"), [`GET ${LIST}`]: () => json(REQUESTS) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${OPTIONS}`)).toHaveLength(2));
  });
});
