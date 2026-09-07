import { screen, waitFor } from "@testing-library/react-native";
import { calls, child, HEADER, ID, LESSON, ME_PARENT, mockRouter, pending, refused, renderFamily, SUMMARY, press } from "./family-helpers";
import { ParentHome } from "@/screens/family/parent-home";

const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const OVERVIEW = {
  children: CHILDREN.children,
  child: HEADER,
  left: false,
  today: "2026-09-07",
  todayRecord: { status: "PRESENT", note: "Cheerful" },
  attendance: SUMMARY,
  streak: 6,
  averagePercent: 82,
  scoredCount: 3,
  recentGrades: [],
  closedToday: false,
  closedName: null,
  lessonsToday: [LESSON],
  upcoming: [{ id: "a1", title: "ZZ Reading log", className: "ZZ 5A", dueAt: "2030-01-01T10:00:00.000Z", dueSoon: false }],
  threads: [{ id: "th1", subject: "ZZ About homework", teacherName: "ZZ Teacher", teacherAvatarKey: null, lastMessageAt: "2026-09-06T10:00:00.000Z" }],
  awaitingConsent: [],
  examMarks: [],
};

describe("the guardian's overview", () => {
  it("is loading while the overview is on its way", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the child's day, and switching child asks the API for that child", async () => {
    const { fetch } = await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW });
    expect(await screen.findByText("ZZ Asha was marked present")).toBeTruthy();
    expect(screen.getByText("ZZ Maths")).toBeTruthy();
    expect(screen.getByText("ZZ Reading log")).toBeTruthy();
    expect(screen.getByText("ZZ About homework")).toBeTruthy();
    expect(screen.getByText("95%")).toBeTruthy();
    await press(await screen.findByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, "/api/v1/family/overview").some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
  });

  it("a refusal is an alert with a retry that asks again", async () => {
    let attempt = 0;
    await renderFamily(<ParentHome />, ME_PARENT, {
      "/api/v1/family/children": () => CHILDREN,
      "/api/v1/family/overview": (init, url) => (attempt++ === 0 ? refused(500, "ZZ broke")(init, url) : OVERVIEW),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("ZZ Asha was marked present")).toBeTruthy();
  });

  it("a guardian with no child linked yet is told so, with the door to link one", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => ({ children: [] }) });
    expect(await screen.findByText("Your children")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link another child" })).toBeTruthy();
  });

  it("a child who has left gets the panel, not a stale day", async () => {
    const left = { ...OVERVIEW, left: true, child: { ...HEADER, leftAt: "2026-06-30T00:00:00.000Z" } };
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => left });
    expect(await screen.findByText(/ZZ Asha left ZZ School on/)).toBeTruthy();
    expect(screen.queryByText("ZZ Maths")).toBeNull();
  });

  it("opening the timetable goes to the timetable tab with the child", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW });
    await press(await screen.findByRole("button", { name: "Open the timetable" }));
    expect(mockRouter.push).toHaveBeenCalledWith(expect.objectContaining({ pathname: "/(app)/timetable", params: { child: ID.child } }));
  });
});
