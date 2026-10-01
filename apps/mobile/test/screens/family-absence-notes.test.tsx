import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, HEADER, ID, ME_PARENT, ME_STUDENT, refused, renderFamily, SUMMARY, press } from "./family-helpers";
import { FamilyAttendance } from "@/screens/family/attendance";

/**
 * Absence notes on the attendance screen: a guardian's days-away list for
 * the child with "Take it back" on their own, the form that files one (a
 * day, a coded reason, a line) and the refusal it shows; the pupil's own
 * list under their own register.
 */
const MONTH = {
  children: [child(ID.child, "ZZ Asha")],
  child: HEADER,
  month: "2026-09",
  thisMonth: "2026-09",
  previousMonth: "2026-08",
  nextMonth: null,
  summary: SUMMARY,
  days: [{ dateKey: "2026-09-04", status: "PRESENT", note: null, teachingDay: true }],
};
const NOTES_PATH = `/api/v1/family/students/${ID.child}/absence-notes`;
const NOTE = { id: "czz000000000000000000note1", studentMembershipId: ID.child, dateKey: "2026-09-10", reason: "RELIGIOUS", text: "Back on Friday.", authorName: "ZZ Parent", authorRole: "PARENT", createdAt: "2026-09-01T05:00:00.000Z", canDelete: true };
const OTHERS = { ...NOTE, id: "czz000000000000000000note2", dateKey: "2026-09-12", reason: "ILLNESS", text: "", authorName: "ZZ Asha", authorRole: "STUDENT", canDelete: false };
const LIST = (notes: unknown[]) => ({ studentMembershipId: ID.child, childName: "ZZ Asha", today: "2026-09-07", notes });

describe("absence notes for a guardian", () => {
  it("lists the days ahead with who filed each, and take-back only on the guardian's own", async () => {
    await renderFamily(<FamilyAttendance />, ME_PARENT, { "/api/v1/family/attendance": () => MONTH, [NOTES_PATH]: () => LIST([NOTE, OTHERS]) });
    expect(await screen.findByText("Absence notes")).toBeTruthy();
    expect(await screen.findByText(/^Thursday, (10 September|September 10)$/)).toBeTruthy();
    expect(screen.getByText("Religious observance · “Back on Friday.” · Filed by ZZ Parent")).toBeTruthy();
    expect(screen.getByText("Illness · Filed by ZZ Asha")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^Take it back:/ })).toHaveLength(1);
    expect(screen.getByText(/^Tell the school ahead of a day ZZ Asha will be away/)).toBeTruthy();
  });

  it("files a note for a day with a reason and a line, and shows the server's list back", async () => {
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, {
      "/api/v1/family/attendance": () => MONTH,
      [NOTES_PATH]: (init) => (init?.method === "POST" ? LIST([{ ...NOTE, dateKey: "2026-09-15", reason: "TRAVEL", text: "Wedding in Nashik." }]) : LIST([])),
    });
    expect(await screen.findByText("No day away ahead")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Day away"), "2026-09-15");
    await press(screen.getByRole("radio", { name: "Travel" }));
    expect(screen.getByRole("radio", { name: "Travel" })).toBeChecked();
    await fireEvent.changeText(screen.getByLabelText("A line for the teacher (optional)"), "Wedding in Nashik.");
    await press(screen.getAllByRole("button", { name: "Tell the school" })[1]!);
    await waitFor(() => expect(calls(fetch, NOTES_PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, NOTES_PATH).find((c) => c.init?.method === "POST")!)).toEqual({ dateKey: "2026-09-15", reason: "TRAVEL", text: "Wedding in Nashik." });
    expect(await screen.findByText("The school has been told.")).toBeTruthy();
    expect(screen.getByText(/^Tuesday, (15 September|September 15)$/)).toBeTruthy();
    expect(screen.getByLabelText("Day away").props.value).toBe("");
  });

  it("a day that is not a date is refused before anything is sent; the server's refusal is shown", async () => {
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, {
      "/api/v1/family/attendance": () => MONTH,
      [NOTES_PATH]: (init, url) => (init?.method === "POST" ? refused(403, "That day has passed.")(init, url) : LIST([])),
    });
    await screen.findByText("No day away ahead");
    await fireEvent.changeText(screen.getByLabelText("Day away"), "next monday");
    await press(screen.getAllByRole("button", { name: "Tell the school" })[1]!);
    expect(await screen.findByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(calls(fetch, NOTES_PATH).filter((c) => c.init?.method === "POST")).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Day away"), "2026-09-01");
    await press(screen.getAllByRole("button", { name: "Tell the school" })[1]!);
    expect(await screen.findByText("That day has passed.")).toBeTruthy();
  });

  it("takes a note back with one DELETE and shows the list the server answers", async () => {
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_PARENT, {
      "/api/v1/family/attendance": () => MONTH,
      [NOTES_PATH]: () => LIST([NOTE]),
      [`${NOTES_PATH}/${NOTE.id}`]: () => LIST([]),
    });
    await press(await screen.findByRole("button", { name: /^Take it back:/ }));
    await waitFor(() => expect(calls(fetch, `${NOTES_PATH}/${NOTE.id}`).map((c) => c.init?.method)).toEqual(["DELETE"]));
    expect(await screen.findByText("The note has been taken back.")).toBeTruthy();
    expect(screen.getByText("No day away ahead")).toBeTruthy();
  });
});

describe("absence notes for the pupil", () => {
  it("sit under the pupil's own register, worded for themselves", async () => {
    const OVERVIEW = { welcome: null, name: "ZZ Pupil", avatarKey: null, today: "2026-09-07", className: "ZZ 5A", todayStatus: null, streak: 0, attendance: { ...SUMMARY, recent: [] }, closedToday: false, closedName: null, lessonsToday: [], upcoming: [], examMarks: [] };
    const { fetch } = await renderFamily(<FamilyAttendance />, ME_STUDENT, {
      "/api/v1/family/student/overview": () => OVERVIEW,
      "/api/v1/family/students/m-pupil/absence-notes": () => ({ studentMembershipId: "m-pupil", childName: "ZZ Pupil", today: "2026-09-07", notes: [] }),
    });
    expect(await screen.findByText("Absence notes")).toBeTruthy();
    expect(await screen.findByText(/^Tell the school ahead of a day you will be away/)).toBeTruthy();
    await waitFor(() => expect(calls(fetch, "/api/v1/family/students/m-pupil/absence-notes")).toHaveLength(1));
  });
});
