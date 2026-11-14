import { Linking } from "react-native";
import { screenFor, webLinkOrNull, webPathUrl } from "@/lib/links";
import { API_BASE } from "@/lib/api";
import { openWeb } from "@/screens/family/shared";

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
    expect(screenFor("/joins")).toEqual({ pathname: "/(app)/joins" });
    expect(screenFor("/parent/claims")).toEqual({ pathname: "/(app)/joins" });
    // TA-555: the notice that somebody asks to be an adult student's guardian opens the consent screen.
    expect(screenFor("/student/consent")).toEqual({ pathname: "/(app)/consent" });
    expect(screenFor("/enquiries/en1")).toEqual({ pathname: "/(app)/enquiries/detail", params: { enquiryId: "en1" } });
    expect(screenFor("/admin/timetable")).toEqual({ pathname: "/(app)/timetable" });
    expect(screenFor("/admin/safety")).toEqual({ pathname: "/(app)/safety" });
    expect(screenFor("/admin/filings")).toEqual({ pathname: "/(app)/filings" });
    // Gigs: the four web pages of sessions are one screen; a teacher's question opens by its id.
    for (const path of ["/sessions", "/expert/sessions", "/teacher/guidance", "/admin/sessions"]) expect(screenFor(path)).toEqual({ pathname: "/(app)/sessions" });
    expect(screenFor("/teacher/contributions")).toEqual({ pathname: "/(app)/contributions" });
    expect(screenFor("/teacher/contributions/new")).toEqual({ pathname: "/(app)/contribution" });
    expect(screenFor("/teacher/contributions/q1")).toEqual({ pathname: "/(app)/contribution", params: { id: "q1" } });
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
    expect(screenFor("/admin/messaging")).toEqual({ pathname: "/(app)/messaging" });
    expect(screenFor("/admin/messaging/new")).toEqual({ pathname: "/(app)/messaging-new" });
    expect(screenFor("/admin/messaging/b1")).toEqual({ pathname: "/(app)/messaging-broadcast", params: { broadcastId: "b1" } });
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
  it("the exam cell's notices open the exams on the phone (G4-13, risks batch 5 Oct 2026)", () => {
    // A form decided, grace marks granted, results published: the student's exams; a guardian's: the child's results.
    expect(screenFor("/student/exams")).toEqual({ pathname: "/(app)/college-exams" });
    expect(screenFor("/parent/results?student=m1")).toEqual({ pathname: "/(app)/college-exams", params: { student: "m1" } });
    expect(screenFor("/faculty/exams")).toEqual({ pathname: "/(app)/exam-duties" });
  });
  it("birthdays and the practice journey open their own screens (A3-inventory-14)", () => {
    expect(screenFor("/bulletin/celebrations")).toEqual({ pathname: "/(app)/celebrations" });
    expect(screenFor("/student/practice/journey")).toEqual({ pathname: "/(app)/practice-journey" });
  });
  it("the college desks' pages open their native screens (the parity batch, 10 Oct 2026)", () => {
    expect(screenFor("/placement/drives")).toEqual({ pathname: "/(app)/placement-drives" });
    expect(screenFor("/placement/drives/d1")).toEqual({ pathname: "/(app)/placement-drive", params: { driveId: "d1" } });
    expect(screenFor("/exam-cell/sessions/x1")).toEqual({ pathname: "/(app)/exam-session", params: { sessionId: "x1" } });
    expect(screenFor("/exam-cell/after")).toEqual({ pathname: "/(app)/exam-after" });
    expect(screenFor("/accounts/no-dues")).toEqual({ pathname: "/(app)/no-dues" });
    expect(screenFor("/iqac/grievances")).toEqual({ pathname: "/(app)/iqac-grievances" });
    expect(screenFor("/faculty/profile")).toEqual({ pathname: "/(app)/faculty-profile" });
    expect(screenFor("/hostel/expulsions")).toEqual({ pathname: "/(app)/hostel-expulsions" });
    expect(screenFor("/account/items")).toEqual({ pathname: "/(app)/my-items" });
    expect(screenFor("/admin/transport")).toEqual({ pathname: "/(app)/office-transport" });
  });
  it("a student's placement notices open the student's placement screen; a guardian's consent ask has no screen and opens the web (QA-70)", () => {
    expect(screenFor("/student/placement")).toEqual({ pathname: "/(app)/placement" });
    expect(screenFor("/parent/placement?child=c1")).toBeNull();
  });

  it("anything else opens the web", () => {
    expect(screenFor("/certificate/r1")).toBeNull();
    expect(screenFor("/teacher/worksheets/print")).toBeNull();
    expect(screenFor("/root/s9/inside")).toBeNull();
    expect(screenFor("/record/u1")).toBeNull();
  });
});

describe("a typed link fit to open (PH-7)", () => {
  it("opens http and https only", () => {
    expect(webLinkOrNull(" https://example.org/notes.pdf ")).toBe("https://example.org/notes.pdf");
    expect(webLinkOrNull("http://example.org/x")).toBe("http://example.org/x");
    for (const bad of ["javascript:alert(1)", "intent://scan/#Intent;scheme=zxing;end", "sms:+911234567890", "tel:100", "edulink://(app)/fees", "file:///etc/hosts", "not a url", "", null, undefined]) {
      expect(webLinkOrNull(bad)).toBeNull();
    }
  });
});

describe("a web page of our own, opened from the phone (A3-S-14, audit of 5 Oct 2026)", () => {
  const base = "https://app.shalaghar.example";
  it("is a single-slash path on the API's own origin, kept whole", () => {
    expect(webPathUrl("/iqac/predictor", base)).toBe(`${base}/iqac/predictor`);
    expect(webPathUrl("/iqac/predictor#entered", base)).toBe(`${base}/iqac/predictor#entered`);
    expect(webPathUrl("/parent/fees?checkout=p%201", base)).toBe(`${base}/parent/fees?checkout=p%201`);
    expect(webPathUrl("/@evil.example/x", base)).toBe(`${base}/@evil.example/x`);
  });
  it("refuses anything that could move the host or is not a path", () => {
    for (const bad of ["@evil.example/x", "//evil.example/x", "/\\evil.example/x", "\\evil.example", "/\tevil", "/\t/evil.example/x", "/\n/evil.example", "https://evil.example/x", "javascript:alert(1)", "iqac/predictor", "", " /iqac"]) {
      expect({ bad, url: webPathUrl(bad, base) }).toEqual({ bad, url: null });
    }
  });
  it("openWeb opens the good one on the API's host and nothing for a bad one", () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    openWeb("/iqac/simulator");
    expect(open).toHaveBeenCalledWith(`${API_BASE}/iqac/simulator`);
    open.mockClear();
    openWeb("@evil.example/x");
    openWeb("//evil.example/x");
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});
