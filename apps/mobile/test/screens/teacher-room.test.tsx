import { screen, waitFor } from "@testing-library/react-native";
import { conversationMessageSchema, inboxConversationDetailSchema } from "@edulink/contracts";
import { Room } from "@/screens/teacher/room";
import { listQueued } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-runner";
import { callsTo, fakeApi, ID, json, offline, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ROOM = inboxConversationDetailSchema.parse({
  id: ID.room1,
  schoolId: "s1",
  others: [{ userId: "u2", membershipId: "m2", name: "ZZ Office", avatarKey: null, role: "ADMIN" }],
  myLastReadAt: null,
  messages: [
    { id: "m1", body: "Timetable is up", createdAt: "2026-09-07T08:00:00.000Z", mine: false, authorMembershipId: "m2", authorName: "ZZ Office", authorAvatar: null, readByOthers: true },
    { id: "m2", body: "Thanks, seen it", createdAt: "2026-09-07T08:05:00.000Z", mine: true, authorMembershipId: "m1", authorName: "ZZ Teacher", authorAvatar: null, readByOthers: false },
  ],
});
const path = `/api/v1/shared/conversations/${ID.room1}`;

beforeEach(() => {
  resetOutbox();
  mockRouter.params = { conversationId: ID.room1 };
});

describe("a room", () => {
  it("loads the room named in the URL, oldest message first, mine marked sent or read", async () => {
    const fetch = fakeApi({ [path]: () => json(ROOM) });
    await renderTeacher(<Room />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("Timetable is up");
    expect(callsTo(fetch, path)).toHaveLength(1);
    expect(screen.getByText("Only you and ZZ Office can read this")).toBeTruthy();
    expect(screen.getByText("Thanks, seen it")).toBeTruthy();
    expect(screen.getByText("You")).toBeTruthy();
    expect(screen.getByText(/· Sent$/)).toBeTruthy();
  });

  it("an empty room invites the first message", async () => {
    fakeApi({ [path]: () => json({ ...ROOM, messages: [] }) });
    await renderTeacher(<Room />);
    await screen.findByText("Say hello to ZZ Office — your first message opens the conversation.");
  });

  it("sends one message with a client id, clears the box and re-reads the room", async () => {
    const fetch = fakeApi({ [path]: () => json(ROOM), "/api/v1/messages": () => json({ messageId: "m3" }) });
    await renderTeacher(<Room />);
    await typeInto(await screen.findByLabelText("Write a reply"), "  On my way  ");
    await tap(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("Sent");
    const [call] = callsTo(fetch, "/api/v1/messages");
    expect(call!.method).toBe("POST");
    const body = conversationMessageSchema.parse(call!.body);
    expect(body).toMatchObject({ conversationId: ID.room1, body: "On my way" });
    expect(screen.getByLabelText("Write a reply")).toHaveDisplayValue("");
    await waitFor(() => expect(callsTo(fetch, path)).toHaveLength(2));
  });

  it("an empty message is refused on the device", async () => {
    const fetch = fakeApi({ [path]: () => json(ROOM) });
    await renderTeacher(<Room />);
    await tap(await screen.findByRole("button", { name: "Send" }));
    expect(screen.getByText("Write something first.")).toBeTruthy();
    expect(callsTo(fetch, "/api/v1/messages")).toHaveLength(0);
  });

  it("offline, the message waits in the outbox and replays once with the same client id", async () => {
    const fetch = fakeApi({ [path]: () => json(ROOM), "/api/v1/messages": offline });
    await renderTeacher(<Room />);
    await typeInto(await screen.findByLabelText("Write a reply"), "Back at three");
    await tap(screen.getByRole("button", { name: "Send" }));
    await screen.findByText(/You are offline/);
    await waitFor(() => expect(screen.getByText("1 waiting to send")).toBeTruthy());
    const queued = await listQueued(`messages:${ID.room1}`);
    expect(queued).toHaveLength(1);
    const queuedBody = conversationMessageSchema.parse(JSON.parse(queued[0]!.body));
    fetch.mockImplementation(async () => json({ messageId: "m9" }));
    expect(await flushOutbox()).toMatchObject({ sent: 1, remaining: 0 });
    const replay = callsTo(fetch, "/api/v1/messages").at(-1)!;
    expect(replay.headers["X-Edulink-Replay"]).toBe("1");
    expect(replay.body).toEqual(queuedBody);
  });

  it("a refusal from the server is shown with a retry; a missing id is an error", async () => {
    fakeApi({ [path]: () => json(ROOM), "/api/v1/messages": () => refusal("ZZ room closed", 403) });
    await renderTeacher(<Room />);
    await typeInto(await screen.findByLabelText("Write a reply"), "Hello");
    await tap(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not send: ZZ room closed");
    expect(await listQueued()).toHaveLength(0);
  });

  it("without a conversation id it says the link did not work", async () => {
    mockRouter.params = {};
    fakeApi({});
    await renderTeacher(<Room />);
    expect(screen.getByRole("alert")).toHaveTextContent(/That link did not work/);
  });
});
