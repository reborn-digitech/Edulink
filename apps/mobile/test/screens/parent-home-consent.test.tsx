/**
 * THE GUARDIAN'S OVERVIEW: WHAT WAITS FOR THEM, AND WHERE EACH ROW GOES (QA campaign of 24 October 2026, unit layer).
 *
 * test/screens/parent-home.test.tsx holds the day, the record nudge, the PEN card and the applications. The
 * campaign's coverage run (src/screens/family/parent-home.tsx at 70.8 % of lines) found the rest unexercised: the
 * "Waiting for you" card, where a child's ask to enter a competition waits for the guardian's consent (decision 0002:
 * a minor enters nothing without it); the left child's link to their record; and the work and message rows. Each
 * is held here on the fake API, with ZZ data only.
 */
import { Linking } from "react-native";
import { screen } from "@testing-library/react-native";
import { child, HEADER, ID, LESSON, ME_PARENT, mockRouter, press, renderFamily, SUMMARY } from "./family-helpers";
import { ParentHome } from "@/screens/family/parent-home";
import { API_BASE } from "@/lib/api";

const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const OVERVIEW = {
  children: CHILDREN.children,
  child: HEADER,
  left: false,
  today: "2026-09-07",
  todayRecord: null,
  attendance: SUMMARY,
  streak: 0,
  averagePercent: null,
  scoredCount: 0,
  recentGrades: [],
  closedToday: false,
  closedName: null,
  lessonsToday: [LESSON],
  upcoming: [{ id: "a1", title: "ZZ Reading log", className: "ZZ 5A", dueAt: null, dueSoon: false }],
  threads: [{ id: "th1", subject: "ZZ About homework", teacherName: "ZZ Teacher", teacherAvatarKey: null, lastMessageAt: "2026-09-06T10:00:00.000Z" }],
  awaitingConsent: [
    { entryId: "e1", competitionId: "czz0000000000000000comp1", title: "ZZ Science Olympiad", organizerName: "ZZ Board", closesAt: null, childName: "ZZ Asha" },
    { entryId: "e2", competitionId: "czz0000000000000000comp2", title: "ZZ Essay Prize", organizerName: "ZZ Trust", closesAt: "2026-10-01T00:00:00.000Z", childName: "ZZ Asha" },
  ],
  examMarks: [],
};
const answers = (overview: object = OVERVIEW) => ({ "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => overview });

afterEach(() => {
  jest.restoreAllMocks();
  mockRouter.push.mockClear();
});

describe("what waits for the guardian", () => {
  it("lists each competition a child would like to enter, by name and organiser, and opens it on the web to decide", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderFamily(<ParentHome />, ME_PARENT, answers());
    expect(await screen.findByText("Waiting for you")).toBeTruthy();
    expect(screen.getByText("ZZ Asha would like to enter ZZ Science Olympiad, run by ZZ Board.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "ZZ Asha would like to enter ZZ Essay Prize, run by ZZ Trust." }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/competitions/czz0000000000000000comp2`);
  });

  it("draws no such card while nothing waits", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, answers({ ...OVERVIEW, awaitingConsent: [] }));
    await screen.findByText("ZZ Reading log");
    expect(screen.queryByText("Waiting for you")).toBeNull();
  });
});

describe("the day's rows", () => {
  it("a piece of work opens the child's assignments, and one with no due date says so", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, answers());
    expect(await screen.findByText("No due date")).toBeTruthy();
    await press(screen.getByRole("button", { name: /^ZZ Reading log/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/assignments", params: { child: ID.child } });
  });

  it("a teacher's thread opens that thread, and the card's link the messages", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, answers());
    await press(await screen.findByRole("button", { name: /^ZZ About homework/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/thread", params: { threadId: "th1" } });
    await press(screen.getByRole("button", { name: "Open" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("with no threads, the empty card still reaches the messages", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, answers({ ...OVERVIEW, threads: [] }));
    await press(await screen.findByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("not taken yet, no grades and no streak read as such, never as a nought", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, answers());
    expect(await screen.findByText("Attendance has not been marked yet")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });
});

describe("a child who has left", () => {
  it("links to the child's record on the web by the child's own account, not the membership", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderFamily(<ParentHome />, ME_PARENT, answers({ ...OVERVIEW, left: true, child: { ...HEADER, leftAt: "2026-06-30T00:00:00.000Z" } }));
    await press(await screen.findByRole("button", { name: "ZZ Asha’s school record" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/record/${HEADER.studentUserId}`);
  });
});
