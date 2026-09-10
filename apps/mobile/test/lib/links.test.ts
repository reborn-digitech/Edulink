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
    expect(screenFor("/competitions/new")).toEqual({ pathname: "/(app)/competition-new" });
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
  it("the screens that used to open the web", () => {
    expect(screenFor("/admin/invites/new")).toEqual({ pathname: "/(app)/invites" });
    expect(screenFor("/admin/classes/new")).toEqual({ pathname: "/(app)/class-new" });
    expect(screenFor("/admin/intake")).toEqual({ pathname: "/(app)/intake" });
    expect(screenFor("/admin/directory")).toEqual({ pathname: "/(app)/directory-profile" });
    expect(screenFor("/account")).toEqual({ pathname: "/(app)/account" });
    expect(screenFor("/parent/link")).toEqual({ pathname: "/(app)/link-child" });
    expect(screenFor("/remarks/new")).toEqual({ pathname: "/(app)/remark-new" });
    expect(screenFor("/bulletin/new")).toEqual({ pathname: "/(app)/post-new" });
    expect(screenFor("/bulletin/p1")).toEqual({ pathname: "/(app)/post", params: { postId: "p1" } });
    expect(screenFor("/bulletin/global")).toEqual({ pathname: "/(app)/bulletin" });
    expect(screenFor("/teacher/assignments/a1")).toEqual({ pathname: "/(app)/assignment", params: { assignmentId: "a1" } });
    expect(screenFor("/teacher/assignments/new")).toEqual({ pathname: "/(app)/assignments" });
    expect(screenFor("/teacher/classes/c1/report-cards")).toEqual({ pathname: "/(app)/report-cards", params: { classId: "c1" } });
    expect(screenFor("/competitions/new")).toEqual({ pathname: "/(app)/competition-new" });
    expect(screenFor("/competitions/co1/entries")).toEqual({ pathname: "/(app)/competition-entries", params: { competitionId: "co1" } });
    expect(screenFor("/explore/s1")).toEqual({ pathname: "/(app)/school", params: { schoolId: "s1" } });
    expect(screenFor("/vacancies/v1")).toEqual({ pathname: "/(app)/vacancy", params: { postingId: "v1" } });
    expect(screenFor("/experts/bookings/b1")).toEqual({ pathname: "/(app)/booking", params: { bookingId: "b1" } });
    expect(screenFor("/student/practice/fractions-3")).toEqual({ pathname: "/(app)/quiz", params: { mode: "topic", slug: "fractions-3" } });
    expect(screenFor("/student/practice/revision")).toEqual({ pathname: "/(app)/quiz", params: { mode: "revision" } });
    expect(screenFor("/teacher/worksheets")).toEqual({ pathname: "/(app)/worksheets" });
    expect(screenFor("/root/s9")).toEqual({ pathname: "/(app)/operator-school", params: { schoolId: "s9" } });
    expect(screenFor("/root/new")).toEqual({ pathname: "/(app)/operator-new-school" });
    expect(screenFor("/root/audit")).toEqual({ pathname: "/(app)" });
    expect(screenFor("/appadmin/bank/t1/q1")).toEqual({ pathname: "/(app)/question-bank", params: { topicId: "t1", questionId: "q1" } });
  });
  it("anything else opens the web", () => {
    expect(screenFor("/certificate/r1")).toBeNull();
    expect(screenFor("/teacher/worksheets/print")).toBeNull();
    expect(screenFor("/root/s9/inside")).toBeNull();
    expect(screenFor("/record/u1")).toBeNull();
  });
});
