import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { bulletinPostDetailSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { PostDetail } from "@/screens/family/post-detail";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
jest.mock("expo-image", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});

const AT = "2026-09-08T10:00:00.000Z";
const DETAIL = bulletinPostDetailSchema.parse({
  id: "p1",
  scope: "SCHOOL",
  category: "EVENTS",
  title: "ZZ Sports day",
  body: "Friday on the field.",
  tags: ["sports"],
  media: [{ fileId: "f1", kind: "image", alt: "ZZ Sports day photo" }],
  status: "APPROVED",
  rejectionReason: null,
  pinned: false,
  createdAt: AT,
  schoolId: "s1",
  className: null,
  audience: "ALL",
  audienceGrade: null,
  requiresAck: false,
  canAck: false,
  acked: false,
  ackCount: 0,
  author: { id: "u-t", name: "ZZ Teacher", avatarKey: "preset:fox-sunset", membershipId: "m-t", role: "TEACHER" },
  reactions: { CLAP: 3 },
  myReactions: [],
  commentsWillBeHeld: false,
  comments: [
    { id: "c1", body: "ZZ Well done all", status: "APPROVED", parentCommentId: null, createdAt: AT, mine: false, author: { id: "u-p", name: "ZZ Parent", avatarKey: null, membershipId: null } },
    { id: "c2", body: "ZZ Thank you", status: "APPROVED", parentCommentId: "c1", createdAt: AT, mine: false, author: { id: "u-t", name: "ZZ Teacher", avatarKey: "preset:fox-sunset", membershipId: "m-t" } },
  ],
  ackReport: [],
});
const PATH = "/api/v1/shared/bulletin/p1";

const mount = (role: RoleCode, answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <PostDetail />
    </ToastProvider>,
    role,
    answers,
  );

describe("a post", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.params = { postId: "p1" };
  });

  it("loads, then shows the whole post and its threads; a reaction, a comment and a reply are sent", async () => {
    const gate = gated();
    let comments = 0;
    const { calls } = await mount("STUDENT", {
      [`GET ${PATH}`]: gate.answer,
      [`POST ${PATH}/react`]: () => json({ added: true }),
      [`POST ${PATH}/comments`]: () => json({ held: ++comments > 1 }),
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DETAIL));
    expect(await screen.findByRole("header", { name: "ZZ Sports day" })).toBeTruthy();
    expect(screen.getByText("ZZ Teacher")).toBeTruthy();
    expect(screen.getByText("Events & Community")).toBeTruthy();
    expect(screen.getByLabelText("ZZ Sports day photo")).toBeTruthy();
    expect(screen.getByRole("header", { name: "2 comments" })).toBeTruthy();
    expect(screen.getByText("ZZ Well done all")).toBeTruthy();
    expect(screen.getByText("ZZ Thank you")).toBeTruthy();
    expect(screen.getByText("Everyone who can see this post can read your comment.")).toBeTruthy();
    // A pupil reads; they do not review.
    expect(screen.queryByRole("button", { name: "Publish it" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Well done (3)" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}/react`)?.body).toEqual({ kind: "CLAP" }));

    await fireEvent.changeText(screen.getByLabelText("Write a comment"), " ZZ Great day ");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Posted")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Reply: ZZ Parent" }));
    await fireEvent.changeText(screen.getByLabelText("Write a reply"), "ZZ Thanks");
    await fireEvent.press(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Sent to a teacher")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}/comments`).map((c) => c.body)).toEqual([{ body: "ZZ Great day" }, { body: "ZZ Thanks", parentCommentId: "c1" }]);
  });

  it("staff publish a pupil's waiting post, or send it back with a note the pupil reads", async () => {
    const waiting = { ...DETAIL, status: "PENDING", comments: [], reactions: {}, author: { ...DETAIL.author, id: "u-p", name: "ZZ Pupil", role: "STUDENT" } };
    const { calls } = await mount("TEACHER", { [`GET ${PATH}`]: () => json(waiting), [`POST ${PATH}/review`]: () => json({ ok: true }) });
    expect(await screen.findByText("Awaiting review")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Well done/ })).toBeNull();
    expect(screen.queryByLabelText("Write a comment")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Publish it" }));
    expect(await screen.findByText("Published")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Send back" }));
    expect(screen.getByRole("button", { name: "Send back" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Why not? The student will see this."), "ZZ Please add a title");
    await fireEvent.press(screen.getByRole("button", { name: "Send back" }));
    expect(await screen.findByText("Sent back with your note")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}/review`).map((c) => c.body)).toEqual([{ decision: "APPROVE" }, { decision: "REJECT", reason: "ZZ Please add a title" }]);
  });

  it("an admin hides another school's shared post from their own school, after being asked", async () => {
    const { calls } = await mount("ADMIN", { [`GET ${PATH}`]: () => json({ ...DETAIL, scope: "GLOBAL", schoolId: "s2" }), [`POST ${PATH}/hide`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Hide at our school" }));
    expect(screen.getByText(/^Hide this post at our school\?/)).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${PATH}/hide`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Hide at our school" }));
    expect(await screen.findByText("Hidden at our school")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/hide`)?.body).toEqual({ hidden: true });
  });

  it("my own post sent back shows what the teacher said, and takes no comments", async () => {
    await mount("STUDENT", { [`GET ${PATH}`]: () => json({ ...DETAIL, status: "REJECTED", rejectionReason: "ZZ Add a picture", comments: [], author: { ...DETAIL.author, id: "u1", role: "STUDENT" } }) });
    expect(await screen.findByText("What your teacher said")).toBeTruthy();
    expect(screen.getByText("ZZ Add a picture")).toBeTruthy();
    expect(screen.getByText("Not published")).toBeTruthy();
    expect(screen.getByText("Nothing yet. Be kind — everyone in the class can read this.")).toBeTruthy();
    expect(screen.queryByLabelText("Write a comment")).toBeNull();
    expect(screen.queryByRole("button", { name: "Hide at our school" })).toBeNull();
  });

  it("a circular's reader taps seen and understood: the server is told and the card says so", async () => {
    const circular = { ...DETAIL, requiresAck: true, canAck: true, acked: false, comments: [] };
    const { calls } = await mount("PARENT", { [`GET ${PATH}`]: () => json(circular), [`POST ${PATH}/ack`]: () => json({ ok: true }) });
    expect(await screen.findByRole("header", { name: "ZZ Sports day" })).toBeTruthy();
    expect(screen.queryByText("You’ve acknowledged this")).toBeNull();
    // A family reads the notice; the reach report is staff's.
    expect(screen.queryByRole("button", { name: "Reach report" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Seen and understood" }));
    expect(await screen.findByText("You’ve acknowledged this")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Seen and understood" })).toBeNull();
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/ack`)).toBe(true));
  });

  it("a refused acknowledgement puts the button back and says why", async () => {
    const circular = { ...DETAIL, requiresAck: true, canAck: true, acked: false, comments: [] };
    await mount("PARENT", { [`GET ${PATH}`]: () => json(circular), [`POST ${PATH}/ack`]: refused("ZZ Not for you", 403) });
    await fireEvent.press(await screen.findByRole("button", { name: "Seen and understood" }));
    expect(await screen.findByText("ZZ Not for you")).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: "Seen and understood" })).toBeTruthy());
    expect(screen.queryByText("You’ve acknowledged this")).toBeNull();
  });

  it("staff see the door to a circular's reach report, and an ordinary post has none", async () => {
    await mount("PRINCIPAL", { [`GET ${PATH}`]: () => json({ ...DETAIL, requiresAck: true, canAck: false, acked: false, ackCount: 12, comments: [] }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Reach report" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/circular-reach", params: { postId: "p1" } });
    expect(screen.queryByRole("button", { name: "Seen and understood" })).toBeNull();
  });

  it("an ordinary post asks nobody to acknowledge and offers no report", async () => {
    await mount("ADMIN", { [`GET ${PATH}`]: () => json(DETAIL) });
    expect(await screen.findByRole("header", { name: "ZZ Sports day" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reach report" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Seen and understood" })).toBeNull();
  });

  it("with no post named, says so, and the door is the bulletin", async () => {
    mockRouter.params = {};
    await mount("PARENT", {});
    expect(await screen.findByText("Post not found")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount("PARENT", { [`GET ${PATH}`]: refused("ZZ Post not found", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Post not found");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
