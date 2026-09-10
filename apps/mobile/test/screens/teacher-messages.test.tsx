import { screen } from "@testing-library/react-native";
import { inboxSchema } from "@edulink/contracts";
import { SessionProvider } from "@/lib/session";
import { Inbox } from "@/screens/teacher/messages";
import { fakeApi, ID, json, ME, refusal, renderTeacher, resetOutbox, tap } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const INBOX = inboxSchema.parse({
  conversations: [
    { id: ID.room1, schoolId: "s1", others: [{ userId: "u2", membershipId: "m2", name: "ZZ Office", avatarKey: null, role: "ADMIN" }], lastMessageAt: hourAgo, preview: "Timetable is up", previewMine: false, unread: true, messageCount: 3 },
    { id: "czz00000000000000000r2", schoolId: "s1", others: [{ userId: "u3", membershipId: null, name: "ZZ Parent", avatarKey: null, role: "PARENT" }], lastMessageAt: hourAgo, preview: "Thank you", previewMine: true, unread: false, messageCount: 1 },
  ],
  threads: [{ id: ID.thread1, subject: "ZZ Homework check-in", studentMembershipId: ID.pupil1, teacherMembershipId: "m1", studentName: "ZZ Asha", studentAvatar: null, teacherName: "ZZ Teacher", teacherAvatar: null, lastMessageAt: hourAgo, preview: "All caught up", unread: false, messageCount: 2 }],
  unreadTotal: 1,
});

const asRole = (role: string) => ({ ...ME, active: { ...ME.active, role }, contexts: [{ ...ME.contexts[0], role }] });
const inbox = () => (
  <SessionProvider>
    <Inbox />
  </SessionProvider>
);

beforeEach(() => {
  resetOutbox();
  mockRouter.push.mockReset();
});

describe("the inbox", () => {
  it("loads rooms and threads, a teacher's threads named after the pupil", async () => {
    // The session loads first; the inbox answers a beat later so the loading state is on screen.
    fakeApi({ "/api/v1/me": () => json(ME), "/api/v1/shared/inbox": () => new Promise((r) => setTimeout(() => r(json(INBOX)), 30)) });
    await renderTeacher(inbox());
    expect(await screen.findByRole("progressbar")).toBeTruthy();
    await screen.findByText("ZZ Office");
    expect(screen.getByText("1 unread")).toBeTruthy();
    expect(screen.getByText(/^Timetable is up · 1 hour ago/)).toBeTruthy();
    expect(screen.getByText(/^You: Thank you/)).toBeTruthy();
    expect(screen.getByText("Unread")).toBeTruthy();
    expect(screen.getByText("ZZ Homework check-in")).toBeTruthy();
    expect(screen.getByText(/^About ZZ Asha/)).toBeTruthy();
    expect(screen.getByText("One conversation per pupil, with them and their guardians.")).toBeTruthy();
  });

  it("a guardian sees the same list with the teacher named on the thread", async () => {
    fakeApi({ "/api/v1/me": () => json(asRole("PARENT")), "/api/v1/shared/inbox": () => json(INBOX) });
    await renderTeacher(inbox());
    await screen.findByText(/^ZZ Teacher · about ZZ Asha/);
    expect(screen.getByText("Your child's teachers, with your child in the conversation.")).toBeTruthy();
  });

  it("a room opens the room; a thread opens the thread", async () => {
    fakeApi({ "/api/v1/me": () => json(ME), "/api/v1/shared/inbox": () => json(INBOX) });
    await renderTeacher(inbox());
    await tap(await screen.findByRole("button", { name: /ZZ Office/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/room", params: { conversationId: ID.room1 } });
    await tap(screen.getByRole("button", { name: /ZZ Homework check-in/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/messages/thread", params: { threadId: ID.thread1 } });
  });

  it("nothing yet is an empty state whose door is the people to write to", async () => {
    fakeApi({ "/api/v1/me": () => json(ME), "/api/v1/shared/inbox": () => json({ conversations: [], threads: [], unreadTotal: 0 }) });
    await renderTeacher(inbox());
    await screen.findByText("No messages yet");
    await tap(screen.getByRole("button", { name: "New message" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/people");
  });

  it("a refusal is an alert with a retry", async () => {
    fakeApi({ "/api/v1/me": () => json(ME), "/api/v1/shared/inbox": () => refusal("ZZ inbox closed", 503) });
    await renderTeacher(inbox());
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ inbox closed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
