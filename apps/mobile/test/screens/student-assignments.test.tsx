import { screen, waitFor } from "@testing-library/react-native";
import * as ImagePicker from "expo-image-picker";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press, type } from "./family-helpers";
import { FamilyAssignments } from "@/screens/family/assignments";

const mockPick = jest.fn();
jest.mock("expo-document-picker", () => ({ getDocumentAsync: (...args: unknown[]) => mockPick(...args) }));
const permission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const camera = ImagePicker.launchCameraAsync as jest.Mock;
const UPLOAD = "/api/v1/uploads";
afterEach(() => {
  mockPick.mockReset();
  permission.mockReset();
  camera.mockReset();
});

const ITEM = {
  id: ID.work,
  title: "ZZ Fractions sheet",
  body: "Do questions 1 to 10.",
  category: "Homework",
  className: "ZZ 5A",
  classColor: null,
  pointsMilli: 10000,
  dueAt: "2030-01-01T10:00:00.000Z",
  submittedAt: null,
  submissionId: null,
  submissionBody: "",
  attachments: [{ fileId: "f1", name: "ZZ sheet.pdf", size: 1000, mime: "application/pdf" }],
  submissionAttachments: [],
  scoreMilli: null,
  comment: null,
  overdue: false,
};
const WORK = { todo: [ITEM], handedIn: [], marked: [{ ...ITEM, id: "w2", title: "ZZ Spelling test", submittedAt: "2026-09-01T10:00:00.000Z", scoreMilli: 8000, comment: "Neat work." }] };
const PATH = "/api/v1/family/student/assignments";
const SUBMIT = "/api/v1/family/student/submissions";

describe("the pupil's assignments", () => {
  it("is loading while the work is on its way", async () => {
    await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("lists what is to do and hands a piece in with the body typed", async () => {
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: () => WORK, [SUBMIT]: () => ({ submittedAt: "2026-09-07T10:00:00.000Z", attachments: [] }) });
    expect(await screen.findByText("ZZ Fractions sheet")).toBeTruthy();
    expect(screen.getByText("ZZ sheet.pdf")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Hand it in" }));
    await type(screen.getByLabelText("Your answer"), "Three quarters.");
    await press(screen.getByRole("button", { name: "Hand it in" }));
    await waitFor(() => expect(calls(fetch, SUBMIT)).toHaveLength(1));
    expect(bodyOf(calls(fetch, SUBMIT)[0]!)).toEqual({ assignmentId: ID.work, body: "Three quarters.", attachments: [] });
    expect(await screen.findByText("Handed in 🎉")).toBeTruthy();
  });

  it("photographs the work: the camera's picture is uploaded, shown, and named in the hand-in without a word typed", async () => {
    permission.mockResolvedValue({ granted: true, status: "granted" });
    camera.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/IMG_7.jpg", fileName: "IMG_7.jpg", mimeType: "image/jpeg" }] });
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, {
      [PATH]: () => WORK,
      [UPLOAD]: () => new Response(JSON.stringify({ fileId: "file_7", mime: "image/jpeg", size: 700 }), { status: 201 }),
      [SUBMIT]: () => ({ submittedAt: "2026-09-07T10:00:00.000Z", attachments: [{ fileId: "file_7", name: "IMG_7.jpg", mime: "image/jpeg", size: 700 }] }),
    });
    await press(await screen.findByRole("button", { name: "Hand it in" }));
    await press(screen.getByRole("button", { name: "Take a photo" }));
    await waitFor(() => expect(calls(fetch, UPLOAD)).toHaveLength(1));
    expect(await screen.findByLabelText("IMG_7.jpg")).toBeTruthy();
    expect(camera).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: ["images"], exif: false }));
    await press(screen.getByRole("button", { name: "Hand it in" }));
    await waitFor(() => expect(calls(fetch, SUBMIT)).toHaveLength(1));
    expect(bodyOf(calls(fetch, SUBMIT)[0]!)).toEqual({ assignmentId: ID.work, body: "", attachments: [{ fileId: "file_7", name: "IMG_7.jpg" }] });
    expect(await screen.findByText("Handed in 🎉")).toBeTruthy();
    // The photo stays on the card after the cheer, as the teacher will see it.
    expect(screen.getByLabelText("IMG_7.jpg")).toBeTruthy();
  });

  it("a chosen picture can be removed before sending, and the hand-in then names what is left", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/page.png", name: "page.png", mimeType: "image/png", size: 10 }] });
    const existing = { ...ITEM, submittedAt: "2026-09-01T10:00:00.000Z", submissionBody: "Page one.", submissionAttachments: [{ fileId: "old1", name: "old.jpg", mime: "image/jpeg", size: 5 }] };
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, {
      [PATH]: () => ({ todo: [], handedIn: [existing], marked: [] }),
      [UPLOAD]: () => new Response(JSON.stringify({ fileId: "file_8", mime: "image/png", size: 10 }), { status: 201 }),
      [SUBMIT]: () => ({ submittedAt: "2026-09-07T10:00:00.000Z", attachments: [] }),
    });
    await press(await screen.findByRole("tab", { name: "Handed in (1)" }));
    expect(await screen.findByLabelText("old.jpg")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Change it" }));
    await press(screen.getByRole("button", { name: "Choose a picture" }));
    await waitFor(() => expect(screen.getByLabelText("page.png")).toBeTruthy());
    expect(mockPick).toHaveBeenCalledWith(expect.objectContaining({ type: ["image/*"] }));
    await press(screen.getByRole("button", { name: "Remove old.jpg" }));
    expect(screen.queryByLabelText("old.jpg")).toBeNull();
    await press(screen.getByRole("button", { name: "Change it" }));
    await waitFor(() => expect(calls(fetch, SUBMIT)).toHaveLength(1));
    expect(bodyOf(calls(fetch, SUBMIT)[0]!)).toEqual({ assignmentId: ID.work, body: "Page one.", attachments: [{ fileId: "file_8", name: "page.png" }] });
  });

  it("a refused camera shows the way to the phone's settings and leaves the picker beside it", async () => {
    permission.mockResolvedValue({ granted: false, status: "denied" });
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: () => WORK });
    await press(await screen.findByRole("button", { name: "Hand it in" }));
    await press(screen.getByRole("button", { name: "Take a photo" }));
    expect(await screen.findByText(/cannot use the camera/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open settings" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose a picture" })).toBeTruthy();
    expect(calls(fetch, UPLOAD)).toHaveLength(0);
  });

  it("an upload the server refuses is said under the box, and nothing is handed in", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/huge.png", name: "huge.png", mimeType: "image/png", size: 10 }] });
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, {
      [PATH]: () => WORK,
      [UPLOAD]: () => new Response(JSON.stringify({ error: "Check the form.", code: "BAD_REQUEST", issues: { file: "ZZ too big" } }), { status: 422 }),
    });
    await press(await screen.findByRole("button", { name: "Hand it in" }));
    await press(screen.getByRole("button", { name: "Choose a picture" }));
    expect(await screen.findByText("ZZ too big")).toBeTruthy();
    expect(screen.queryByLabelText("huge.png")).toBeNull();
    expect(calls(fetch, SUBMIT)).toHaveLength(0);
  });

  it("refuses to hand in nothing at all — no words, no photo — without asking the server", async () => {
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: () => WORK });
    await press(await screen.findByRole("button", { name: "Hand it in" }));
    await press(screen.getByRole("button", { name: "Hand it in" }));
    expect(calls(fetch, SUBMIT)).toHaveLength(0);
    expect(screen.getByLabelText("Your answer")).toBeTruthy();
  });

  it("the marked tab shows the score and the teacher's words", async () => {
    await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: () => WORK });
    await press(await screen.findByRole("tab", { name: "Marked (1)" }));
    expect(screen.getByText("ZZ Spelling test")).toBeTruthy();
    expect(screen.getByText("8 / 10")).toBeTruthy();
    expect(screen.getByText("“Neat work.”")).toBeTruthy();
  });

  it("with nothing to do, says so", async () => {
    await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: () => ({ todo: [], handedIn: [], marked: [] }) });
    expect(await screen.findByText("Nothing due right now")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a guardian reads the child's three tabs and cannot hand anything in", async () => {
    const work = {
      children: [child(ID.child, "ZZ Asha")],
      childName: "ZZ Asha",
      todo: [{ id: "c1", title: "ZZ Reading log", category: null, className: "ZZ 5A", pointsMilli: null, dueAt: null, submittedAt: null, returned: false, scoreMilli: null, comment: null, overdue: true }],
      handedIn: [],
      marked: [],
    };
    await renderFamily(<FamilyAssignments />, ME_PARENT, { "/api/v1/family/assignments": () => work });
    expect(await screen.findByText("ZZ Reading log")).toBeTruthy();
    expect(screen.getByText("Overdue")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Hand it in" })).toBeNull();
  });
});
