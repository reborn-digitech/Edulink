import { screen, waitFor } from "@testing-library/react-native";
import { inboxThreadDetailSchema } from "@edulink/contracts";
import { Thread } from "@/screens/teacher/thread";
import { callsTo, fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const THREAD = inboxThreadDetailSchema.parse({
  id: ID.thread1,
  subject: "ZZ Homework check-in",
  schoolId: "s1",
  closedAt: null,
  student: { membershipId: ID.pupil1, name: "ZZ Asha", fullName: "ZZ Asha Rao", avatarKey: null },
  teacher: { membershipId: "m1", name: "ZZ Teacher", avatarKey: null },
  messages: [
    { id: "m1", body: "Asha has been doing well this week.", createdAt: "2026-09-06T10:00:00.000Z", authorId: "u1", authorMembershipId: "m1", authorName: "ZZ Teacher", authorAvatar: null, mine: true, readByOthers: true },
    { id: "m2", body: "Thank you for letting us know.", createdAt: "2026-09-06T18:00:00.000Z", authorId: "u3", authorMembershipId: null, authorName: "ZZ Parent", authorAvatar: null, mine: false, readByOthers: false },
  ],
});
const path = `/api/v1/shared/threads/${ID.thread1}`;
const replyPath = `${path}/reply`;

beforeEach(() => {
  resetOutbox();
  mockRouter.params = { threadId: ID.thread1 };
});

describe("a remark thread", () => {
  it("loads the thread named in the URL with who can see it", async () => {
    const fetch = fakeApi({ [path]: () => json(THREAD) });
    await renderTeacher(<Thread />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("Asha has been doing well this week.");
    expect(callsTo(fetch, path)).toHaveLength(1);
    expect(screen.getByText("Only ZZ Asha, ZZ Teacher, ZZ Asha’s guardians and the school office can see this")).toBeTruthy();
    expect(screen.getByText("ZZ Parent")).toBeTruthy();
    expect(screen.getByText(/· Read$/)).toBeTruthy();
  });

  it("replies through the thread's reply endpoint, clears the box and re-reads", async () => {
    const fetch = fakeApi({ [path]: () => json(THREAD), [replyPath]: () => json({ messageId: "m3" }) });
    await renderTeacher(<Thread />);
    await typeInto(await screen.findByLabelText("Write a reply"), "We will keep it up.");
    await tap(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sent");
    const [call] = callsTo(fetch, replyPath);
    expect(call!.method).toBe("POST");
    expect(call!.body).toEqual({ body: "We will keep it up." });
    expect(screen.getByLabelText("Write a reply")).toHaveDisplayValue("");
    await waitFor(() => expect(callsTo(fetch, path)).toHaveLength(2));
  });

  it("an empty reply is refused on the device", async () => {
    const fetch = fakeApi({ [path]: () => json(THREAD) });
    await renderTeacher(<Thread />);
    await tap(await screen.findByRole("button", { name: "Send" }));
    expect(screen.getByText("Write something first.")).toBeTruthy();
    expect(callsTo(fetch, replyPath)).toHaveLength(0);
  });

  it("a closed thread has no reply box; an empty one says so", async () => {
    fakeApi({ [path]: () => json({ ...THREAD, closedAt: "2026-09-07T00:00:00.000Z", messages: [] }) });
    await renderTeacher(<Thread />);
    await screen.findByText("This conversation has been closed.");
    expect(screen.getByText("No messages yet")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  it("a refused reply is shown with a retry", async () => {
    fakeApi({ [path]: () => json(THREAD), [replyPath]: () => refusal("ZZ thread is closed", 409) });
    await renderTeacher(<Thread />);
    await typeInto(await screen.findByLabelText("Write a reply"), "Hello");
    await tap(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not send: ZZ thread is closed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a refused thread is an alert; a missing id is an error", async () => {
    fakeApi({ [path]: () => refusal("ZZ not in this thread", 403) });
    await renderTeacher(<Thread />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not in this thread");
  });

  it("without a thread id it says the link did not work", async () => {
    mockRouter.params = {};
    fakeApi({});
    await renderTeacher(<Thread />);
    expect(screen.getByRole("alert")).toHaveTextContent(/That link did not work/);
  });
});
