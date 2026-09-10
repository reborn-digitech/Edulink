import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { communityLinkChildPageSchema } from "@edulink/contracts";
import { LinkChild } from "@/screens/family/link-child";
import { gated, json, me, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/community/link-child";
const LINKED = communityLinkChildPageSchema.parse({ children: [{ guardianshipId: "g1", name: "ZZ Asha", schoolName: "ZZ School" }] });
const NONE = communityLinkChildPageSchema.parse({ children: [] });
const MISMATCH = "That code and date of birth do not match a student. Check both with the school — the code is on the letter they sent home.";
/** A guardian who has just signed up: no school, no role yet. */
const NEW_GUARDIAN = { ...me("PARENT"), active: { schoolId: null, role: null, membershipId: null }, contexts: [] };

async function fill(code: string, dob: string) {
  await fireEvent.changeText(await screen.findByLabelText("Student code"), code);
  await fireEvent.changeText(screen.getByLabelText("Their date of birth"), dob);
}

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
});

describe("linking a child", () => {
  it("loads, then shows who is already linked above the form", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(LINKED));
    await screen.findByText("ZZ Asha");
    expect(screen.getByText("Add another child")).toBeTruthy();
    expect(screen.getByText("Already linked")).toBeTruthy();
    expect(screen.getByText(/^You need their student code and their date of birth\./)).toBeTruthy();
    expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(1);
  });

  it("shapes the code as it is typed, and checks both before anything is sent", async () => {
    const { calls } = await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: () => json(NONE) });
    expect(await screen.findByText("Link to your child")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Link to my child" }));
    expect(screen.getByText("Enter the full student code.")).toBeTruthy();
    expect(screen.getByText("Enter their date of birth.")).toBeTruthy();
    await fill("stu4kdf3mq7", "06/04/2015");
    expect(screen.getByLabelText("Student code")).toHaveDisplayValue("STU-4KDF-3MQ7");
    await fireEvent.press(screen.getByRole("button", { name: "Link to my child" }));
    expect(screen.getByText("Use a real date.")).toBeTruthy();
    expect(screen.queryByText("Enter the full student code.")).toBeNull();
    expect(calls().some((c) => c.line === `POST ${PATH}`)).toBe(false);
  });

  it("links with both factors and the relation, re-reads who is signed in, and says so", async () => {
    const { calls } = await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: () => json(NONE), [`POST ${PATH}`]: () => json({ child: { name: "ZZ Asha", schoolName: "ZZ School" } }, 201) }, { me: NEW_GUARDIAN });
    await fill("STU-4KDF-3MQ7", "2015-04-06");
    await fireEvent.press(screen.getByRole("radio", { name: "Guardian" }));
    await fireEvent.press(screen.getByRole("button", { name: "Link to my child" }));
    expect(await screen.findByText("You’re linked to ZZ Asha")).toBeTruthy();
    expect(screen.getByText("You can now see their attendance, grades and teacher messages at ZZ School.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ studentCode: "STU-4KDF-3MQ7", birthdate: "2015-04-06", relation: "GUARDIAN" });
    // The server made the session a guardian's: the phone asks again who is signed in.
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/me").length).toBeGreaterThanOrEqual(2));
    await fireEvent.press(screen.getByRole("button", { name: "See their dashboard" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/(app)");
    await fireEvent.press(screen.getByRole("button", { name: "Link another child" }));
    expect(screen.getByLabelText("Student code")).toHaveDisplayValue("");
  });

  it("a mismatch is the one sentence, and what was typed stays", async () => {
    await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: () => json(NONE), [`POST ${PATH}`]: () => json({ error: MISMATCH, code: "BAD_REQUEST" }, 422) });
    await fill("STU-4KDF-3MQ7", "2015-04-06");
    await fireEvent.press(screen.getByRole("button", { name: "Link to my child" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(MISMATCH);
    expect(screen.getByLabelText("Student code")).toHaveDisplayValue("STU-4KDF-3MQ7");
  });

  it("past the limit it says how long to wait", async () => {
    await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: () => json(NONE), [`POST ${PATH}`]: () => json({ error: "Too many attempts. Try again in about 15 minutes.", code: "RATE_LIMITED", retryAfterSeconds: 900 }, 429) });
    await fill("STU-4KDF-3MQ7", "2015-04-06");
    await fireEvent.press(screen.getByRole("button", { name: "Link to my child" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts. Try again in about 15 minutes.");
  });

  it("a field the server names sits under that field", async () => {
    await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: () => json(NONE), [`POST ${PATH}`]: () => json({ error: "That date is in the future.", code: "BAD_REQUEST", issues: { birthdate: "That date is in the future." } }, 422) });
    await fill("STU-4KDF-3MQ7", "2031-04-06");
    await fireEvent.press(screen.getByRole("button", { name: "Link to my child" }));
    expect(await screen.findByText("That date is in the future.")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a refused list is an alert with a retry, and the form still works", async () => {
    const { calls } = await mountStaff(<LinkChild />, "PARENT", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByLabelText("Student code")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });
});
