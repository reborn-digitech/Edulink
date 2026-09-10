import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { competitionsPageSchema } from "@edulink/contracts";
import { Competitions } from "@/screens/shared/competitions";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/shared/competitions";
const card = (over: Record<string, unknown>) => ({
  id: "co1",
  title: "ZZ Maths Bee",
  summary: "Our own maths bee, in the hall.",
  organizerName: "ZZ School",
  organizerSchoolId: "s1",
  subject: "Maths",
  gradeLow: "4",
  gradeHigh: "6",
  verified: true,
  requiresParentConsent: true,
  registrationClosesAt: "2026-09-20T00:00:00.000Z",
  startsAt: "2026-10-01T00:00:00.000Z",
  endsAt: null,
  entry: null,
  ...over,
});
const ENTRY = { id: "en1", status: "ENTERED", awaitingConsent: false, consentedAt: "2026-09-07T00:00:00.000Z", studentMembershipId: "p1", studentName: "ZZ Asha", submissionUrl: null, scoreMilli: null, rank: null };
const PAGE = competitionsPageSchema.parse({
  school: [card({ entry: ENTRY })],
  platform: [card({ id: "co2", title: "ZZ Spelling Bee", organizerName: "EduLink", organizerSchoolId: null, subject: "English", verified: false, entry: { ...ENTRY, id: "en2", awaitingConsent: true, consentedAt: null } })],
  waiting: [],
});
const WAITING = { entryId: "en2", competitionId: "co2", title: "ZZ Spelling Bee", organizerName: "EduLink", closesAt: "2026-09-20T00:00:00.000Z", childName: "ZZ Asha" };

beforeEach(() => {
  mockRouter.push.mockReset();
});

describe("competitions", () => {
  it("loads, then shows the school's and the platform's, what I have done about each, and opens one", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Competitions />, "STUDENT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PAGE));
    await screen.findByText("ZZ Maths Bee");
    expect(screen.getByText("From your school")).toBeTruthy();
    expect(screen.getByText("For every school")).toBeTruthy();
    expect(screen.getByText("Checked by EduLink")).toBeTruthy();
    expect(screen.getByText(/^ZZ School · Maths · 4–6 · closes /)).toBeTruthy();
    expect(screen.getByText("You are entered")).toBeTruthy();
    expect(screen.getByText("Waiting for a grown-up to say yes")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: /ZZ Maths Bee/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/competitions/detail", params: { competitionId: "co1" } });
  });

  it("a guardian sees the entries waiting on their yes first, named after the child", async () => {
    await mountStaff(<Competitions />, "PARENT", { [`GET ${PATH}`]: () => json({ ...PAGE, waiting: [WAITING] }) });
    await screen.findByText("Waiting for you");
    expect(screen.getByText("ZZ Asha is entered")).toBeTruthy();
    expect(screen.getByText("ZZ Asha is waiting on you")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /ZZ Asha would like to enter ZZ Spelling Bee, run by EduLink\./ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/competitions/detail", params: { competitionId: "co2" } });
  });

  it("showing the closed ones asks the API; the subject chips narrow on the device", async () => {
    const { calls } = await mountStaff(<Competitions />, "TEACHER", { [`GET ${PATH}`]: () => json(PAGE) });
    await screen.findByText("ZZ Maths Bee");
    await fireEvent.press(screen.getByRole("radio", { name: "Show closed ones too" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?show=all`)).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "English" }));
    expect(screen.queryByText("ZZ Maths Bee")).toBeNull();
    expect(screen.getByText("ZZ Spelling Bee")).toBeTruthy();
  });

  it("nothing open offers the closed ones; nothing at all sends an admin to the app's own form", async () => {
    const empty = { school: [], platform: [], waiting: [] };
    await mountStaff(<Competitions />, "ADMIN", { [`GET ${PATH}`]: () => json(empty) });
    expect(await screen.findByText("Nothing open just now")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Show closed ones too" }));
    expect(await screen.findByText("No competitions yet")).toBeTruthy();
    // The admin's two doors, the standing one and the empty state's, both open the form.
    await fireEvent.press(screen.getAllByRole("button", { name: "Post one" })[1]!);
    expect(mockRouter.push).toHaveBeenLastCalledWith("/(app)/competition-new");
    await fireEvent.press(screen.getAllByRole("button", { name: "Post one" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
  });

  it("nothing at all sends everyone else to the bulletin", async () => {
    await mountStaff(<Competitions />, "STUDENT", { [`GET ${PATH}`]: () => json({ school: [], platform: [], waiting: [] }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Show closed ones too" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Competitions />, "PARENT", { [`GET ${PATH}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
