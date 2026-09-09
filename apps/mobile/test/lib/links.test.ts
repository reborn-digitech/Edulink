import { screenFor } from "@/lib/links";

describe("notification URLs map to screens", () => {
  it("the ones the server writes", () => {
    expect(screenFor("/teacher/attendance?classId=c1")).toEqual({ pathname: "/(app)/attendance", params: { classId: "c1" } });
    expect(screenFor("/remarks/c/room1")).toEqual({ pathname: "/(app)/messages/room", params: { conversationId: "room1" } });
    expect(screenFor("/remarks/thread9")).toEqual({ pathname: "/(app)/messages/thread", params: { threadId: "thread9" } });
    expect(screenFor("/notifications")).toEqual({ pathname: "/(app)/notifications" });
    expect(screenFor("/teacher/classes/c2")).toEqual({ pathname: "/(app)/classes/detail", params: { classId: "c2" } });
    expect(screenFor("https://app.example/parent")).toEqual({ pathname: "/(app)" });
  });
  it("every section the More sheet lists, for every role", () => {
    expect(screenFor("/bulletin/global")).toEqual({ pathname: "/(app)/bulletin" });
    expect(screenFor("/mentoring")).toEqual({ pathname: "/(app)/mentoring" });
    expect(screenFor("/mentoring/th1")).toEqual({ pathname: "/(app)/mentoring/thread", params: { threadId: "th1" } });
    expect(screenFor("/competitions/co1")).toEqual({ pathname: "/(app)/competitions/detail", params: { competitionId: "co1" } });
    expect(screenFor("/competitions/new")).toBeNull();
    expect(screenFor("/enquiries/en1")).toEqual({ pathname: "/(app)/enquiries/detail", params: { enquiryId: "en1" } });
    expect(screenFor("/admin/timetable")).toEqual({ pathname: "/(app)/timetable" });
    expect(screenFor("/admin/safety")).toEqual({ pathname: "/(app)/safety" });
    expect(screenFor("/parent/settings")).toEqual({ pathname: "/(app)/settings" });
    expect(screenFor("/expert/availability")).toEqual({ pathname: "/(app)/availability" });
    expect(screenFor("/attendance/history")).toEqual({ pathname: "/(app)/attendance" });
    expect(screenFor("/report-cards/card1")).toEqual({ pathname: "/(app)/exams", params: { cardId: "card1" } });
    expect(screenFor("/root")).toEqual({ pathname: "/(app)/operator" });
    expect(screenFor("/appadmin")).toEqual({ pathname: "/(app)/appadmin" });
  });
  it("anything else opens the web", () => {
    expect(screenFor("/admin/invites/new")).toBeNull();
    expect(screenFor("/admin/classes/new")).toBeNull();
    expect(screenFor("/certificate/r1")).toBeNull();
    expect(screenFor("/root/audit")).toBeNull();
    expect(screenFor("/teacher/worksheets/print")).toBeNull();
  });
});
