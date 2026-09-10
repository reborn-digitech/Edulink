import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { accountPostOptionsSchema, bulletinCreatePostSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { PostCompose } from "@/screens/family/post-compose";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
jest.mock("@/lib/pick-file", () => ({ pickAndUpload: jest.fn() }));
jest.mock("expo-image", () => {
  const React = jest.requireActual("react");
  const { View } = jest.requireActual("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});
const pick = (jest.requireMock("@/lib/pick-file") as { pickAndUpload: jest.Mock }).pickAndUpload;

const CLASS = "czz0000000000000000class1";
const STAFF = accountPostOptionsSchema.parse({ role: "TEACHER", classes: [{ id: CLASS, name: "ZZ Class 5A" }], grades: ["5", "6"], allowSchoolWide: true, reviewedFirst: false });
const PUPIL = accountPostOptionsSchema.parse({ role: "STUDENT", classes: [{ id: CLASS, name: "ZZ Class 5A" }], grades: [], allowSchoolWide: false, reviewedFirst: true });
const OPTIONS = "GET /api/v1/account/post-options";
const CREATE = "POST /api/v1/shared/bulletin";

const mount = (role: RoleCode, answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <PostCompose />
    </ToastProvider>,
    role,
    answers,
  );

describe("a new post", () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    pick.mockReset();
  });

  it("loads; staff aim a whole-school post at one grade's parents, with a described picture and a preview", async () => {
    const gate = gated();
    pick.mockResolvedValueOnce({ fileId: "f1", mime: "image/jpeg", size: 1000, name: "zz-relay.jpg" });
    const { calls } = await mount("TEACHER", { [OPTIONS]: gate.answer, [CREATE]: () => json({ postId: "p9", status: "APPROVED" }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(STAFF));
    await fireEvent.press(await screen.findByRole("button", { name: "Post it" }));
    expect(screen.getByRole("header", { name: "New post" })).toBeTruthy();
    expect(screen.getByText("Give it a title.")).toBeTruthy();
    expect(screen.getByText("Choose a category")).toBeTruthy();
    expect(calls().some((c) => c.line === CREATE)).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Whole school" }));
    await fireEvent.press(screen.getByRole("button", { name: "Parents and guardians" }));
    await fireEvent.press(screen.getByRole("button", { name: "Class 5" }));
    await fireEvent.press(screen.getByRole("button", { name: "Events & Community" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Ask for a “seen and understood”" }));
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Sports day");
    await fireEvent.changeText(screen.getByLabelText("What do you want to say?"), "ZZ Friday on the field.");
    await fireEvent.press(screen.getByRole("button", { name: "Add photos or a video" }));
    expect(await screen.findByText("zz-relay.jpg")).toBeTruthy();
    expect(pick).toHaveBeenCalledWith("media", "Could not post that");
    expect(screen.getByRole("header", { name: "Preview" })).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Post it" }));
    expect(screen.getByText("Describe this picture, so it makes sense read aloud.")).toBeTruthy();
    expect(calls().some((c) => c.line === CREATE)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Describe it"), "ZZ The relay team crossing the line");
    await fireEvent.press(screen.getByRole("button", { name: "Post it" }));
    expect(await screen.findByText("Posted")).toBeTruthy();
    const body = calls().find((c) => c.line === CREATE)?.body;
    expect(body).toEqual({
      scope: "SCHOOL",
      category: "EVENTS",
      title: "ZZ Sports day",
      body: "ZZ Friday on the field.",
      media: [{ fileId: "f1", kind: "image", alt: "ZZ The relay team crossing the line" }],
      audience: "PARENTS",
      audienceGrade: "5",
      requiresAck: true,
    });
    expect(bulletinCreatePostSchema.safeParse(body).success).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: "p9" } });
  });

  it("a pupil posts to their class, is told a teacher reads it first, and lands on the post", async () => {
    const { calls } = await mount("STUDENT", { [OPTIONS]: () => json(PUPIL), [CREATE]: () => json({ postId: "p8", status: "PENDING" }) });
    expect(await screen.findByRole("header", { name: "Share something" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Whole school" })).toBeNull();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByRole("button", { name: "ZZ Class 5A" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Learning & Academics" }));
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ My volcano");
    await fireEvent.press(screen.getByRole("button", { name: "Send to my teacher" }));
    expect(await screen.findByText(/^Sent to your teacher/)).toBeTruthy();
    const body = calls().find((c) => c.line === CREATE)?.body;
    expect(body).toEqual({ scope: "CLASS", category: "LEARNING", classId: CLASS, title: "ZZ My volcano", body: "", media: [], audience: "ALL", requiresAck: false });
    expect(bulletinCreatePostSchema.safeParse(body).success).toBe(true);
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: "p8" } });
  });

  it("a refused upload and a refused post are both said in the server's words", async () => {
    pick.mockRejectedValueOnce(new Error("ZZ That picture is bigger than 5 MB."));
    await mount("TEACHER", { [OPTIONS]: () => json(STAFF), [CREATE]: () => json({ error: "Some of this needs another look.", code: "BAD_REQUEST", issues: { title: "ZZ Say a little more in the title." } }, 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add photos or a video" }));
    expect(await screen.findByText("ZZ That picture is bigger than 5 MB.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "People & Spotlights" }));
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Hi");
    await fireEvent.press(screen.getByRole("button", { name: "Post it" }));
    expect(await screen.findByText("ZZ Say a little more in the title.")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("a pupil not in a class yet is told so, and the door is the bulletin", async () => {
    await mount("STUDENT", { [OPTIONS]: () => json({ ...PUPIL, classes: [] }) });
    expect(await screen.findByText("You are not in a class yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Social Media" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/bulletin");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount("PARENT", { [OPTIONS]: refused("ZZ Only a school's people post here.", 403) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Only a school's people post here.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === OPTIONS).length).toBe(2));
  });
});
