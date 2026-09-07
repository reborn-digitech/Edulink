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
  it("anything else opens the web", () => {
    expect(screenFor("/admin/timetable")).toBeNull();
    expect(screenFor("/root")).toBeNull();
  });
});
