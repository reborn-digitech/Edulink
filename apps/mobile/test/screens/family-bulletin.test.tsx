import { screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press, type } from "./family-helpers";
import { FamilyBulletin } from "@/screens/family/bulletin";
import { ToastProvider } from "@/components";

jest.mock("expo-image", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});

const POST = {
  id: ID.post,
  scope: "SCHOOL",
  category: "EVENTS",
  title: "ZZ Sports day",
  body: "Friday on the field.",
  tags: ["sports"],
  media: [{ fileId: "f1", kind: "image", alt: "ZZ Sports day photo" }],
  status: "APPROVED",
  rejectionReason: null,
  pinned: true,
  createdAt: "2026-09-06T10:00:00.000Z",
  authorName: "ZZ Teacher",
  authorAvatar: null,
  authorRole: "TEACHER",
  className: null,
  commentCount: 2,
  reactions: { CLAP: 3 },
  myReactions: [],
  canModerate: false,
  mine: false,
  audience: "ALL",
  audienceGrade: null,
  requiresAck: false,
  acked: false,
  ackCount: 0,
};
const page = (items: object[], nextCursor: string | null, heldCommentCount = 0) => ({ schoolId: "s1", schoolName: "ZZ School", schools: [], filter: null, pendingCount: 0, heldCommentCount, items, nextCursor });
const HELD = "/api/v1/shared/bulletin/comments/held";
const HELD_ITEMS = [
  { id: "h1", postId: ID.post, postTitle: "ZZ Sports day", shared: false, className: "ZZ Class A", reply: false, body: "ZZ Which day is it?", createdAt: "2026-09-08T10:00:00.000Z", authorName: "ZZ Pupil" },
  { id: "h2", postId: "p9", postTitle: "ZZ Science fair", shared: true, className: null, reply: true, body: "ZZ Lovely work", createdAt: "2026-09-08T11:00:00.000Z", authorName: "ZZ Teacher" },
];
const PATH = "/api/v1/shared/bulletin";
const REACT = `/api/v1/shared/bulletin/${ID.post}/react`;
const GLOBAL = "/api/v1/shared/bulletin/global";
const GLOBAL_POST = {
  id: "czz00000000000000000gpost1",
  category: "LEARNING",
  title: "ZZ Far post",
  body: "Shared with every school.",
  media: [],
  tags: ["science"],
  reactions: { CLAP: 1 },
  myReactions: [],
  commentCount: 0,
  createdAt: "2026-09-05T10:00:00.000Z",
  authorName: "ZZ Author",
  schoolName: "ZZ Far School",
  schoolId: "s2",
  ours: false,
  hiddenHere: false,
};

/** The review's "approved" and "removed" are toasts, which need their provider. */
const withToasts = (
  <ToastProvider>
    <FamilyBulletin />
  </ToastProvider>
);

describe("the bulletin", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("a post opens whole from its title or its comments; a pupil's new-post button is the app's composer", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: () => page([POST], null) });
    await press(await screen.findByRole("button", { name: "ZZ Sports day" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: ID.post } });
    await press(screen.getByRole("button", { name: "Comments (2)" }));
    expect(mockRouter.push).toHaveBeenCalledTimes(2);
    await press(screen.getByRole("button", { name: "Share something" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/(app)/post-new");
  });

  it("with nothing posted, the door is a new post in the app", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: () => page([], null) });
    await press(await screen.findByRole("button", { name: "Share something" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/post-new");
  });

  it("a guardian with no school is sent to link a child, in the app", async () => {
    await renderFamily(<FamilyBulletin />, ME_PARENT, { [PATH]: () => ({ ...page([], null), schoolId: null, schoolName: null }) });
    await press(await screen.findByRole("button", { name: "Link another child" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/link-child");
  });

  it("comments waiting on the reader head the bulletin: approved in one press, removed only with a reason, and each opens its post", async () => {
    const R1 = "/api/v1/shared/bulletin/comments/h1/review";
    const R2 = "/api/v1/shared/bulletin/comments/h2/review";
    const { fetch } = await renderFamily(withToasts, ME_STUDENT, { [PATH]: () => page([POST], null, 2), [HELD]: () => ({ items: HELD_ITEMS }), [R1]: () => ({ ok: true }), [R2]: () => ({ ok: true }) });
    expect(await screen.findByText("Comments waiting (2)")).toBeTruthy();
    // The heading's count is the page's; the comments themselves are a second fetch, and on a slow runner the
    // heading was drawn before they came (run 36950234257, "Unable to find an element with text").
    expect(await screen.findByText("ZZ Which day is it?")).toBeTruthy();
    expect(screen.getByText("Shared feed")).toBeTruthy();
    expect(screen.getByText("Reply")).toBeTruthy();
    await press(screen.getByRole("button", { name: /^On: ZZ Science fair/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: "p9" } });

    await press(screen.getByRole("button", { name: "Approve comment: ZZ Pupil" }));
    await waitFor(() => expect(calls(fetch, R1).map(bodyOf)).toEqual([{ decision: "APPROVE" }]));
    expect(await screen.findByText("Comment approved")).toBeTruthy();

    await press(screen.getByRole("button", { name: "Remove comment: ZZ Teacher" }));
    expect(screen.getAllByRole("button", { name: "Remove comment: ZZ Teacher" }).at(-1)).toBeDisabled();
    expect(calls(fetch, R2)).toEqual([]);
    await type(screen.getByLabelText("Why it is being removed"), "ZZ Not about the fair");
    await press(screen.getAllByRole("button", { name: "Remove comment: ZZ Teacher" }).at(-1)!);
    await waitFor(() => expect(calls(fetch, R2).map(bodyOf)).toEqual([{ decision: "REMOVE", reason: "ZZ Not about the fair" }]));
    expect(await screen.findByText("Comment removed")).toBeTruthy();
  });

  it("with no comment waiting, the queue is not asked for and not shown", async () => {
    const { fetch } = await renderFamily(withToasts, ME_STUDENT, { [PATH]: () => page([POST], null) });
    await screen.findByText("ZZ Sports day");
    expect(screen.queryByText(/^Comments waiting/)).toBeNull();
    expect(calls(fetch, HELD)).toEqual([]);
  });

  it("a refused decision is an alert above the buttons, which stay", async () => {
    await renderFamily(withToasts, ME_STUDENT, {
      [PATH]: () => page([POST], null, 1),
      [HELD]: () => ({ items: [HELD_ITEMS[0]] }),
      "/api/v1/shared/bulletin/comments/h1/review": refused(403, "That comment has already been reviewed"),
    });
    await press(await screen.findByRole("button", { name: "Approve comment: ZZ Pupil" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That comment has already been reviewed");
    expect(screen.getByRole("button", { name: "Approve comment: ZZ Pupil" })).toBeTruthy();
  });

  it("is loading while the feed is on its way", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the posts with their pictures fetched with the bearer token, and reacts", async () => {
    const { fetch } = await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: () => page([POST], null), [REACT]: () => ({ added: true }) });
    expect(await screen.findByText("ZZ Sports day")).toBeTruthy();
    expect(screen.getByText("ZZ Teacher")).toBeTruthy();
    expect(screen.getByText("Pinned by the school")).toBeTruthy();
    expect(screen.getByText("Events & Community")).toBeTruthy();
    const picture = await screen.findByLabelText("ZZ Sports day photo");
    expect(picture.props.source).toEqual({ uri: "http://localhost:3000/api/files/f1?w=640", headers: { Authorization: "Bearer t" } });
    await press(screen.getByRole("button", { name: "Well done (3)" }));
    await waitFor(() => expect(calls(fetch, REACT)).toHaveLength(1));
    expect(bodyOf(calls(fetch, REACT)[0]!)).toEqual({ kind: "CLAP" });
  });

  it("loads the next page through the cursor", async () => {
    const { fetch } = await renderFamily(<FamilyBulletin />, ME_STUDENT, {
      [PATH]: (init, url) => (url.searchParams.get("cursor") === "c2" ? page([{ ...POST, id: "p2", title: "ZZ Second post", pinned: false }], null) : page([POST], "c2")),
    });
    await press(await screen.findByRole("button", { name: "Load more" }));
    expect(await screen.findByText("ZZ Second post")).toBeTruthy();
    expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("cursor") === "c2")).toBe(true);
    expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
  });

  it("with nothing posted yet, says so", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: () => page([], null) });
    expect(await screen.findByText("Nothing posted yet")).toBeTruthy();
  });

  it("a guardian with no school is told to choose one", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: () => ({ ...page([], null), schoolId: null, schoolName: null }) });
    expect(await screen.findByText("No school selected")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("every school: the global feed names each post's school, reacts the same way, and with nothing shared the door is our own feed", async () => {
    const { fetch } = await renderFamily(<FamilyBulletin />, ME_STUDENT, {
      [PATH]: () => page([POST], null),
      [GLOBAL]: () => ({ items: [GLOBAL_POST], nextCursor: null }),
      [`/api/v1/shared/bulletin/${GLOBAL_POST.id}/react`]: () => ({ added: true }),
    });
    await screen.findByText("ZZ Sports day");
    await press(screen.getByRole("button", { name: "Global feed" }));
    expect(await screen.findByText("ZZ Far post")).toBeTruthy();
    expect(screen.getByText("ZZ Far School")).toBeTruthy();
    expect(screen.getByText("by ZZ Author")).toBeTruthy();
    expect(screen.getByText("Learning & Academics")).toBeTruthy();
    expect(screen.queryByText("ZZ Sports day")).toBeNull();
    expect(calls(fetch, GLOBAL).some((c) => c.url.searchParams.get("limit") === "20")).toBe(true);
    await press(screen.getByRole("button", { name: "Well done (1)" }));
    await waitFor(() => expect(calls(fetch, `/api/v1/shared/bulletin/${GLOBAL_POST.id}/react`)).toHaveLength(1));
    await press(screen.getByRole("button", { name: "Our school’s feed" }));
    expect(await screen.findByText("ZZ Sports day")).toBeTruthy();
  });

  it("with nothing shared by any school, says so, and the door is our own feed", async () => {
    await renderFamily(<FamilyBulletin />, ME_STUDENT, { [PATH]: () => page([POST], null), [GLOBAL]: () => ({ items: [], nextCursor: null }) });
    await press(await screen.findByRole("button", { name: "Global feed" }));
    expect(await screen.findByText("Nothing shared yet")).toBeTruthy();
    // The chip and the empty state's door share the label; the door is the last one on the page.
    await press(screen.getAllByRole("button", { name: "Our school’s feed" }).at(-1)!);
    expect(await screen.findByText("ZZ Sports day")).toBeTruthy();
  });
});
