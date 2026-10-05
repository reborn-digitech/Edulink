import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { AlumniHome } from "@/screens/alumni/home";
import { AlumniDirectory } from "@/screens/alumni/directory";
import { AlumniCollegeScreen } from "@/screens/alumni/college";
import { authorTag } from "@/screens/alumni/tag";
import { json, me, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => mockRouter.params }));

const meWith = (role: RoleCode, modules: string[]) => ({ ...me(role), modules });
const CUID = "c" + "a".repeat(24);

const home = (over: Record<string, unknown> = {}) => ({
  schoolId: "s1",
  schoolName: "ZZ School",
  batchYear: 2026,
  leftAt: "2026-04-30T06:30:00.000Z",
  lastClass: "Grade 10 A",
  feedMode: "COMMENT",
  muted: false,
  isMinor: true,
  formerTeachers: [{ userId: "t1", membershipId: "mt1", name: "ZZ Mrs Dave", avatarKey: null, role: "TEACHER", detail: "Maths", formerTeacher: true }],
  notes: [{ id: "n1", batchYear: null, title: "ZZ Founders' day", body: "All welcome.", createdAt: "2026-10-01T05:00:00.000Z" }],
  directory: { listed: false, city: null, occupation: null, contactPref: "OFFICE", mentor: false },
  ...over,
});

const directory = (over: Record<string, unknown> = {}) => ({
  schoolName: "ZZ School",
  entries: [{ membershipId: "ma2", userId: "u2", name: "ZZ Rahul", avatarKey: null, batchYear: 2018, city: "Bengaluru", occupation: "Engineer", contactPref: "OFFICE", email: null, mentor: true, mine: false }],
  me: { listed: false, city: null, occupation: null, contactPref: "OFFICE", mentor: false },
  canJoin: true,
  ...over,
});

describe("a former pupil's home (the alumni module)", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("says the batch, the class and what the feed allows; writes to a former teacher in one press; lists the school's notes", async () => {
    const { calls } = await mountStaff(<AlumniHome />, "ALUMNUS", {
      "GET /api/v1/alumni/home": () => json(home()),
      "POST /api/v1/shared/conversations": () => json({ conversationId: CUID, created: true }, 201),
    }, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    expect(await screen.findByText(/Left Grade 10 A in 2026/)).toBeTruthy();
    expect(screen.getByText(/react and comment/)).toBeTruthy();
    expect(screen.getByText("ZZ Founders' day")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /ZZ Mrs Dave/ }));
    await waitFor(() => expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/room", params: { conversationId: CUID } }));
    expect(calls().find((c) => c.line === "POST /api/v1/shared/conversations")?.body).toEqual({ schoolId: "s1", userId: "t1" });
    await fireEvent.press(screen.getByRole("button", { name: "Open the alumni directory" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/alumni-directory");
  });

  it("says when the office has paused them, offers sharing only when the school takes posts, and opens the record on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<AlumniHome />, "ALUMNUS", { "GET /api/v1/alumni/home": () => json(home({ muted: true, feedMode: "POST", formerTeachers: [], notes: [] })) }, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    expect(await screen.findByText(/paused your messages/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Share a post with the school" })).toBeNull();
    expect(screen.getByText(/None of the teachers who taught you/)).toBeTruthy();
    expect(screen.getByText(/has not written to its alumni yet/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Your school record" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/record$/));
    open.mockRestore();
  });

  it("falls back to the module's 'off' home while the school has alumni off, and asks nothing", async () => {
    const { calls } = await mountStaff(<AlumniHome />, "ALUMNUS", {}, { me: meWith("ALUMNUS", []) });
    expect(await screen.findByText("Alumni is not switched on")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/alumni"))).toBe(false);
  });
});

describe("the alumni directory", () => {
  it("lists who chose to be listed, and joins with what the alumnus wrote", async () => {
    const { calls } = await mountStaff(<AlumniDirectory />, "ALUMNUS", {
      "GET /api/v1/alumni/directory": () => json(directory()),
      "PUT /api/v1/alumni/directory": () => json({ listed: true, city: "Pune", occupation: null, contactPref: "EMAIL", mentor: false }),
    }, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    expect(await screen.findByText("ZZ Rahul · Mentor")).toBeTruthy();
    expect(screen.getByText(/Batch of 2018 · Engineer · Bengaluru · Contact through the school office/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Town or city"), "Pune");
    await fireEvent.press(screen.getByRole("radio", { name: "Show my email address" }));
    await fireEvent.press(screen.getByRole("button", { name: "Join the directory" }));
    expect(await screen.findByText("You are in the directory.")).toBeTruthy();
    expect(calls().find((c) => c.line === "PUT /api/v1/alumni/directory")?.body).toEqual({ city: "Pune", occupation: "", contactPref: "EMAIL" });
    // The list is asked again after the save; let that land before the next case mounts.
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/alumni/directory")).toHaveLength(2));
  });

  it("tells a minor when they may join and offers no form", async () => {
    await mountStaff(<AlumniDirectory />, "ALUMNUS", { "GET /api/v1/alumni/directory": () => json(directory({ canJoin: false, entries: [] })) }, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    expect(await screen.findByText("You can join the directory when you turn 18.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Join the directory" })).toBeNull();
    expect(screen.getByText("Nobody has joined the directory yet.")).toBeTruthy();
  });

  it("leaves the directory", async () => {
    const { calls } = await mountStaff(<AlumniDirectory />, "ALUMNUS", {
      "GET /api/v1/alumni/directory": () => json(directory({ me: { listed: true, city: "Pune", occupation: "Student", contactPref: "OFFICE", mentor: false } })),
      "DELETE /api/v1/alumni/directory": () => json({ listed: false, city: null, occupation: null, contactPref: "OFFICE", mentor: false }),
    }, { me: meWith("ALUMNUS", ["ALUMNI"]) });
    await fireEvent.press(await screen.findByRole("button", { name: "Leave the directory" }));
    expect(await screen.findByText(/You have left the directory/)).toBeTruthy();
    expect(calls().some((c) => c.line === "DELETE /api/v1/alumni/directory")).toBe(true);
  });
});

describe("the feed's author tag", () => {
  it("reads Alumni with the year for a former pupil, and the role for everyone else", () => {
    const t = ((key: string, vars?: Record<string, string | number>) => (key === "alumni.tag" ? `Alumni · ${vars?.year}` : key)) as Parameters<typeof authorTag>[0];
    expect(authorTag(t, "ALUMNUS", 2026)).toBe("Alumni · 2026");
    expect(authorTag(t, "STUDENT", null)).toBe("role.student");
    expect(authorTag(t, "ALUMNUS")).toBe("role.alumnus");
  });
});

describe("a college alumnus's college on the phone (5 Oct 2026)", () => {
  const iso = "2026-10-20T10:30:00.000Z";
  const college = (over: Record<string, unknown> = {}) => ({
    mentor: true,
    slots: [{ id: "sl1", title: "ZZ Careers in analytics", startsAt: iso, endsAt: iso, mentorName: "ZZ Shreya", batchYear: 2025, seatsLeft: 1 }],
    referrals: [],
    gifts: [{ id: "g1", alumnusName: "ZZ Shreya", batchYear: 2025, kind: "DONATION", amountRupees: 5000, receiptRef: "ZZ-R-1", note: "", on: "2026-08-15" }],
    meets: [{ id: "m1", title: "ZZ Alumni meet 2026", on: "2026-12-20", venue: "ZZ Hall", note: "", batchYear: null, registered: 4, mine: false }],
    openDrives: [{ id: "d1", title: "ZZ Analyst", companyName: "ZZ Zeta" }],
    surveyUrl: "/alumni/survey",
    ...over,
  });

  it("refers into an open drive, goes to a meet, and sends the survey to the voice screen", async () => {
    let going = false;
    const { calls } = await mountStaff(<AlumniCollegeScreen />, "ALUMNUS", {
      "GET /api/v1/alumni/college": () => json(college({ meets: [{ ...college().meets[0], mine: going, registered: going ? 5 : 4 }] })),
      "POST /api/v1/alumni/college/referrals": () => json({ id: "r1", alumnusName: "ZZ Shreya", companyName: "ZZ Zeta", driveTitle: "ZZ Analyst", note: "ZZ My team is hiring", createdAt: iso }),
      "POST /api/v1/alumni/college/meets/m1": () => {
        going = true;
        return json({ ...college().meets[0], mine: true, registered: 5 });
      },
    }, { me: meWith("ALUMNUS", ["ALUMNI", "ACADEMICS", "PLACEMENT"]) });
    expect(await screen.findByText("ZZ Careers in analytics")).toBeTruthy();
    expect(screen.getByText(/ZZ-R-1/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Analyst · ZZ Zeta" }));
    await fireEvent.changeText(screen.getByLabelText("The opening, and how to reach it"), "ZZ My team is hiring");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/alumni/college/referrals")?.body).toEqual({ driveId: "d1", companyName: "", note: "ZZ My team is hiring" }));
    await fireEvent.press(screen.getByRole("button", { name: "I will come: ZZ Alumni meet 2026" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/alumni/college/meets/m1")?.body).toEqual({ going: true }));
    await fireEvent.press(screen.getByRole("button", { name: "Answer the survey" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/voice");
  });

  it("opens the web to offer a mentoring slot, and hides referrals while placement is off", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<AlumniCollegeScreen />, "ALUMNUS", { "GET /api/v1/alumni/college": () => json(college({ surveyUrl: null })) }, { me: meWith("ALUMNUS", ["ALUMNI", "ACADEMICS"]) });
    expect(await screen.findByText("ZZ Careers in analytics")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Offer the time" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/alumni\/college$/));
    open.mockRestore();
  });
});
