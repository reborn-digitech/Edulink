import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { contestCreatedSchema } from "@edulink/contracts";
import { CompetitionNew } from "@/screens/shared/competition-new";
import { gated, json, me, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SCHOOL = "/api/v1/contest/competitions";
const PLATFORM = "/api/v1/appadmin/competitions/drafts";
const CREATED = contestCreatedSchema.parse({ competitionId: "co9", status: "DRAFT" });

/** The content team: no school, no role, the flag on the account. */
const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};
/** A school admin who is on the content team too. */
const BOTH = { ...me("ADMIN"), user: { ...me("ADMIN").user, isAppAdmin: true } };

async function fillTheRequired() {
  await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Spelling Bee");
  await fireEvent.changeText(screen.getByLabelText("One line about it"), "Our own spelling bee, in the hall.");
}

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.replace.mockReset();
  mockRouter.back.mockReset();
});

describe("posting a competition", () => {
  it("waits for the session, then a school admin's draft goes to the school's endpoint with every field and opens on its own page", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<CompetitionNew />, "ADMIN", { "GET /api/v1/me": gate.answer, [`POST ${SCHOOL}`]: () => json(CREATED, 201) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(me("ADMIN")));
    expect(await screen.findByText("Posted as ZZ School. You publish it on the next screen.")).toBeTruthy();
    // Nothing to save until there is a title and a line about it.
    expect(screen.getByRole("button", { name: "Save as a draft" })).toBeDisabled();
    expect(screen.queryByLabelText("Organiser name")).toBeNull();
    await fillTheRequired();
    await fireEvent.changeText(screen.getByLabelText("Subject"), "English");
    await fireEvent.changeText(screen.getByLabelText("Lowest year group"), "4");
    await fireEvent.changeText(screen.getByLabelText("Highest year group"), "6");
    await fireEvent.changeText(screen.getByLabelText("Entries close"), "2026-10-01");
    await fireEvent.changeText(screen.getByLabelText("Starts"), "2026-10-10");
    await fireEvent.changeText(screen.getByLabelText("Organiser's own page"), "https://example.org/bee");
    await fireEvent.press(screen.getByRole("switch", { name: "Ask a parent before a child takes part" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Show a leaderboard across schools" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save as a draft" }));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/competitions/detail", params: { competitionId: "co9" } }));
    expect(calls().find((c) => c.line === `POST ${SCHOOL}`)?.body).toEqual({
      title: "ZZ Spelling Bee",
      summary: "Our own spelling bee, in the hall.",
      body: "",
      subject: "English",
      gradeLow: "4",
      gradeHigh: "6",
      eligibility: "",
      rules: "",
      prizes: "",
      externalUrl: "https://example.org/bee",
      registrationClosesAt: "2026-10-01",
      startsAt: "2026-10-10",
      endsAt: "",
      requiresParentConsent: false,
      leaderboardEnabled: true,
    });
    expect(calls().some((c) => c.line === `POST ${PLATFORM}`)).toBe(false);
  });

  it("a date that is not year-month-day is caught on the phone, and nothing is sent", async () => {
    const { calls } = await mountStaff(<CompetitionNew />, "ADMIN", {});
    await screen.findByText("Posted as ZZ School. You publish it on the next screen.");
    await fillTheRequired();
    await fireEvent.changeText(screen.getByLabelText("Ends"), "10/10/2026");
    await fireEvent.press(screen.getByRole("button", { name: "Save as a draft" }));
    expect(await screen.findByText("That is not a date.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("the server's refusal lands under each field it names, with its sentence above the button and what was typed kept", async () => {
    const issues = { title: "Give it a title.", endsAt: "The end cannot be before the start." };
    await mountStaff(<CompetitionNew />, "ADMIN", { [`POST ${SCHOOL}`]: () => json({ error: "Some of that needs another look.", code: "BAD_REQUEST", issues }, 422) });
    await screen.findByText("Posted as ZZ School. You publish it on the next screen.");
    await fillTheRequired();
    await fireEvent.press(screen.getByRole("button", { name: "Save as a draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Some of that needs another look.");
    expect(screen.getByText("Give it a title.")).toBeTruthy();
    expect(screen.getByText("The end cannot be before the start.")).toBeTruthy();
    // A form the person must fix is not retried as it stands.
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    expect(screen.getByDisplayValue("ZZ Spelling Bee")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("the content team posts a platform draft with the organiser's name, and goes back to the console", async () => {
    const { calls } = await mountStaff(<CompetitionNew />, "ADMIN", { [`POST ${PLATFORM}`]: () => json(CREATED, 201) }, { me: CURATOR });
    expect(await screen.findByText("Every school on this server will see it once published.")).toBeTruthy();
    expect(screen.queryByRole("radiogroup", { name: "Posting for" })).toBeNull();
    await fillTheRequired();
    await fireEvent.changeText(screen.getByLabelText("Organiser name"), "ZZ Trust");
    await fireEvent.press(screen.getByRole("button", { name: "Save as a draft" }));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(calls().find((c) => c.line === `POST ${PLATFORM}`)?.body).toMatchObject({ title: "ZZ Spelling Bee", organizerName: "ZZ Trust", requiresParentConsent: true, leaderboardEnabled: false });
    expect(calls().some((c) => c.line === `POST ${SCHOOL}`)).toBe(false);
  });

  it("someone who is both a school admin and on the content team picks which it is", async () => {
    const { calls } = await mountStaff(<CompetitionNew />, "ADMIN", { [`POST ${PLATFORM}`]: () => json(CREATED, 201) }, { me: BOTH });
    await screen.findByText("Posted as ZZ School. You publish it on the next screen.");
    await fireEvent.press(screen.getByRole("radio", { name: "For every school" }));
    expect(await screen.findByLabelText("Organiser name")).toBeTruthy();
    await fillTheRequired();
    await fireEvent.press(screen.getByRole("button", { name: "Save as a draft" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PLATFORM}`)).toBe(true));
  });

  it("someone who may not post is told so, and the door is the competitions list", async () => {
    await mountStaff(<CompetitionNew />, "TEACHER", {});
    expect(await screen.findByText("Only a school's admins, or Relay's content team, can post a competition.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Competitions" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/competitions");
  });

  it("a server that fell over is an alert with a retry that sends it again", async () => {
    const { calls } = await mountStaff(<CompetitionNew />, "ADMIN", { [`POST ${SCHOOL}`]: refused("ZZ not now.") });
    await screen.findByText("Posted as ZZ School. You publish it on the next screen.");
    await fillTheRequired();
    await fireEvent.press(screen.getByRole("button", { name: "Save as a draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${SCHOOL}`)).toHaveLength(2));
  });
});
