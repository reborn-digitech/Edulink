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
  const RECORD_PATH = "/api/v1/family/record";
  const record = (missing: string[]) => ({ studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", studentCode: null, birthdate: "2016-03-14", record: null, missing, missingForFiling: [], complete: missing.length === 0, canEdit: false, canRequest: true, change: null, penEditable: false, penChange: null });

  it("nudges to complete the school record while a certificate field is blank, for the child on screen, and not once it is complete", async () => {
    const { fetch } = await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW, [RECORD_PATH]: () => record(["fatherName", "admissionDate"]) });
    expect(await screen.findByText("Complete the school record")).toBeTruthy();
    expect(screen.getByText("The school needs a few details for certificates: Father's name, Date of admission.")).toBeTruthy();
    expect(calls(fetch, RECORD_PATH)[0]!.url.searchParams.get("childId")).toBe(ID.child);
    await press(screen.getByRole("button", { name: "Open the record" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/record", params: { child: ID.child } });
  });

  it("shows no record card once the record is complete, or while the record cannot be read", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW, [RECORD_PATH]: () => record([]) });
    await screen.findByText("ZZ Asha was marked present");
    expect(screen.queryByText("Complete the school record")).toBeNull();
  });

  const PEN_CHANGES = "/api/v1/family/pen-changes";
  const change = { id: "pc1", studentMembershipId: ID.child2, studentName: "ZZ Bela", className: "ZZ 3B", fromPen: "27250100101", toPen: "27250100102", reason: "Two digits swapped", status: "PENDING", requestedByName: "ZZ Admin", principal: { decided: false, approved: null, by: null }, guardian: { decided: false, approved: null, by: null, waived: false }, decisionReason: null, can: { decide: true, withdraw: false }, createdAt: "2026-09-20T05:00:00.000Z", appliedAt: null };

  it("while a correction to a child's PEN waits for the guardian's word, names the child and opens that child's record; nothing when none waits", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW, [RECORD_PATH]: () => record([]), [PEN_CHANGES]: () => ({ items: [change], pending: 1 }) });
    expect(await screen.findByText("PEN corrections")).toBeTruthy();
    await press(screen.getByRole("button", { name: "A correction to ZZ Bela\u2019s PEN needs your approval, 1 waiting" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/record", params: { child: ID.child2 } });
    mockRouter.push.mockClear();
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW, [RECORD_PATH]: () => record([]), [PEN_CHANGES]: () => ({ items: [{ ...change, status: "APPLIED", can: { decide: false, withdraw: false } }], pending: 0 }) });
    await screen.findByText("ZZ Asha was marked present");
    expect(screen.queryByText("PEN corrections")).toBeNull();
  });

  it("is loading while the overview is on its way", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("opens the child's fortnight ahead from the coming-up card", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW });
    await press(await screen.findByRole("button", { name: "What is coming up" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/agenda", params: { child: ID.child } });
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

describe("the guardian's applications on the overview", () => {
  const APPLICATIONS = "/api/v1/family/applications";
  const application = (id: string, childName: string, status = "SUBMITTED") => ({ id, serial: "ADM/2026-27/0001", status, childName, gradeApplied: "1", applicantName: "ZZ Parent", cycleName: "ZZ Admissions 2026-27", schoolName: "ZZ Hillside", documentsMissing: 0, testBooked: true, createdAt: "2026-09-18T05:00:00.000Z", updatedAt: "2026-09-18T05:00:00.000Z" });

  it("lists up to three with their stage while there are any, opening one and the list", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, {
      "/api/v1/family/children": () => CHILDREN,
      "/api/v1/family/overview": () => OVERVIEW,
      [APPLICATIONS]: () => ({ items: [application("czz00000000000000000app1", "ZZ Kabir", "OFFERED"), application("czz00000000000000000app2", "ZZ Meera"), application("czz00000000000000000app3", "ZZ Dev"), application("czz00000000000000000app4", "ZZ Nila")] }),
    });
    expect(await screen.findByRole("header", { name: "Applications" })).toBeTruthy();
    expect(screen.getByText("ZZ Kabir")).toBeTruthy();
    expect(screen.getByText("Offered")).toBeTruthy();
    expect(screen.getByText("ZZ Hillside · The school has offered a place — answer the offer.")).toBeTruthy();
    expect(screen.getByText("ZZ Dev")).toBeTruthy();
    expect(screen.queryByText("ZZ Nila")).toBeNull();
    await press(screen.getByRole("button", { name: /^ZZ Kabir/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/my-application", params: { id: "czz00000000000000000app1" } });
    // The card's link says "See all", not its own title again (B-25).
    await press(screen.getByRole("button", { name: "See all: Applications" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/my-applications");
  });

  it("draws no card with none, and a guardian with no child still reaches the list", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => ({ children: [] }), [APPLICATIONS]: () => ({ items: [] }) });
    expect(await screen.findByText("Your children")).toBeTruthy();
    expect(screen.queryByText("ZZ Hillside")).toBeNull();
    await press(screen.getByRole("button", { name: "Applications" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/my-applications");
  });
});

describe("TA-388: the home tile is the homework average of the report's twelve weeks", () => {
  it("TA-388: labels the tile Homework average and says it stands on the last 12 weeks' homework", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => OVERVIEW });
    expect(await screen.findByText("Homework average")).toBeTruthy();
    expect(screen.getByText("82%")).toBeTruthy();
    expect(screen.queryByText("Average grade")).toBeNull();
    expect(screen.getByText(/Across 3 pieces, last 12 weeks/)).toBeTruthy();
  });

  it("TA-388: with no homework marked in the twelve weeks, says so rather than nothing graded yet", async () => {
    await renderFamily(<ParentHome />, ME_PARENT, { "/api/v1/family/children": () => CHILDREN, "/api/v1/family/overview": () => ({ ...OVERVIEW, averagePercent: null, scoredCount: 0 }) });
    expect(await screen.findByText("Homework average")).toBeTruthy();
    expect(screen.getByText(/No homework marked in the last 12 weeks/)).toBeTruthy();
    expect(screen.queryByText(/Nothing graded yet/)).toBeNull();
  });
});
