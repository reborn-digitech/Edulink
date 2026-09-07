import { screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press, type } from "./family-helpers";
import { FamilyAssignments } from "@/screens/family/assignments";

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
    const { fetch } = await renderFamily(<FamilyAssignments />, ME_STUDENT, { [PATH]: () => WORK, [SUBMIT]: () => ({ submittedAt: "2026-09-07T10:00:00.000Z" }) });
    expect(await screen.findByText("ZZ Fractions sheet")).toBeTruthy();
    expect(screen.getByText("ZZ sheet.pdf")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Hand it in" }));
    await type(screen.getByLabelText("Your answer"), "Three quarters.");
    await press(screen.getByRole("button", { name: "Hand it in" }));
    await waitFor(() => expect(calls(fetch, SUBMIT)).toHaveLength(1));
    expect(bodyOf(calls(fetch, SUBMIT)[0]!)).toEqual({ assignmentId: ID.work, body: "Three quarters." });
    expect(await screen.findByText("Handed in 🎉")).toBeTruthy();
  });

  it("refuses to hand in an empty answer without asking the server", async () => {
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
