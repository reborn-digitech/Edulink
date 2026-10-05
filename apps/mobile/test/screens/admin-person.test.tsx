import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { leavingBodyFrom, Person, splitSubjects } from "@/screens/staff/person";
import { BackCtx } from "@/components/chrome";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = { membershipId: "m7", name: "ZZ Pupil", role: "STUDENT", left: "", leavingOn: "" };
const LEAVING = "/api/v1/admin/people/m7/leaving";

/** The directory's row for the person the route names, as GET /api/v1/admin/people has it. */
const rowFor = (p: Record<string, string>) => ({
  membershipId: p.membershipId,
  role: p.role ?? "STUDENT",
  status: p.status || "ACTIVE",
  name: p.name,
  preferredName: null,
  email: null,
  avatarKey: null,
  birthdateKey: p.birthdate || null,
  studentCode: null,
  title: null,
  subjects: p.subjects ? p.subjects.split(",") : [],
  joinedAt: "2026-06-01T00:00:00.000Z",
  leftAt: p.left === "1" ? "2026-09-01T00:00:00.000Z" : null,
  suspendedAt: null,
  suspendedReason: null,
  enrolledIn: [],
  teaches: [],
  staffRecord: null,
  schoolRecord: null,
  scheduledDeparture: p.leavingOn ? { leaveOnKey: p.leavingOn } : null,
  pendingParentInvites: [],
});
const directory = (members: unknown[]) => json({ members, total: members.length, page: 1, pages: 1, pageSize: 50, classes: [], roleCounts: [], suspendedCount: 0, leftCount: 0, filters: { q: "", role: null, status: "ACTIVE", classId: null, sort: "name" } });

const mount = (params: Record<string, string>, answers: Answers = {}) => {
  mockRouter.params = params;
  return mountStaff(
    <ToastProvider>
      <Person />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/admin/people": () => directory([rowFor(params)]), ...answers },
  );
};

beforeEach(() => mockRouter.push.mockClear());

describe("what the leaving form sends", () => {
  it("leaves a blank line out, sends a blank day as null and no conduct as null", () => {
    expect(leavingBodyFrom({ reason: "LEFT", conduct: "", destination: "  ", note: "", leftOn: "" })).toEqual({ reason: "LEFT", conduct: null, leftOn: null });
    expect(leavingBodyFrom({ reason: "TRANSFERRED", conduct: "GOOD", destination: " ZZ Elsewhere ", note: " Family moved. ", leftOn: " 2026-10-15 " })).toEqual({ reason: "TRANSFERRED", conduct: "GOOD", destination: "ZZ Elsewhere", note: "Family moved.", leftOn: "2026-10-15" });
  });
});

describe("a person the school does not have (A3-states-15)", () => {
  it("asks the directory first and, finding no row, draws no form: the not-found sentence and the way back, no retry", async () => {
    const onBack = jest.fn();
    mockRouter.params = { membershipId: "00000000-0000-4000-8000-000000000000" };
    await mountStaff(
      <BackCtx.Provider value={{ onBack }}>
        <ToastProvider>
          <Person />
        </ToastProvider>
      </BackCtx.Provider>,
      "ADMIN",
      { "GET /api/v1/admin/people": () => directory([]) },
    );
    expect(await screen.findByText("That person is not a member of this school.")).toBeTruthy();
    expect(screen.queryByText(/^Legal name for/)).toBeNull();
    expect(screen.queryByText(/^Date of birth for/)).toBeNull();
    expect(screen.queryByText(/access\?$/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    const backs = screen.getAllByRole("button", { name: "Back" });
    await fireEvent.press(backs[backs.length - 1]!);
    expect(onBack).toHaveBeenCalled();
  });

  it("an id the directory's page does not hold under that name is not found either; the search is the row's tab", async () => {
    const { calls } = await mount({ membershipId: "m404", name: "ZZ Pupil", role: "STUDENT", left: "1" }, { "GET /api/v1/admin/people": () => directory([rowFor({ ...PUPIL, membershipId: "m7" })]) });
    expect(await screen.findByText("That person is not a member of this school.")).toBeTruthy();
    expect(calls().find((c) => c.line.startsWith("GET /api/v1/admin/people"))?.line).toBe("GET /api/v1/admin/people?q=ZZ+Pupil&role=STUDENT&status=LEFT");
    expect(screen.queryByRole("button", { name: "Undo leaving" })).toBeNull();
  });
});

describe("a member of staff, from the directory", () => {
  it("opens their record, and offers no leaving: staff who go get a reference, not a certificate", async () => {
    await mount({ membershipId: "m2", name: "ZZ Teacher", role: "TEACHER", left: "", leavingOn: "" });
    await fireEvent.press(await screen.findByRole("button", { name: /^Staff record/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/staff-record", params: { membershipId: "m2" } });
    expect(screen.queryByText(/^Record that/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Undo leaving" })).toBeNull();
  });
});

describe("a pupil, from the directory", () => {
  it("opens their health card and their school record", async () => {
    await mount(PUPIL);
    await fireEvent.press(await screen.findByRole("button", { name: /^Health card/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-health", params: { membershipId: "m7" } });
    await fireEvent.press(screen.getByRole("button", { name: /^Pupil records/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: "m7" } });
  });

  it("⚠ says what the family will get, records the leaving with what was chosen and typed, and then offers only the undo", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${LEAVING}`]: () => json({ recordId: "sr1", scheduledFor: null }) });
    expect(await screen.findByText("Record that ZZ Pupil has left?")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Transferred to another school" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: "Finished their schooling here" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Excellent" }));
    await fireEvent.changeText(screen.getByLabelText("Where they went"), "ZZ Elsewhere School");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LEAVING}`)?.body).toEqual({ reason: "GRADUATED", conduct: "EXCELLENT", destination: "ZZ Elsewhere School", leftOn: null }));
    expect(await screen.findByRole("button", { name: "Undo leaving" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record it" })).toBeNull();
  });

  it("a last day after today is kept: the screen names the day and offers to give it up", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${LEAVING}`]: () => json({ recordId: null, scheduledFor: "2030-01-15" }), [`POST ${LEAVING}/cancel`]: () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("Last day"), "2030-01-15");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(await screen.findByText(/^Leaving on .*2030/)).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${LEAVING}`)?.body).toMatchObject({ leftOn: "2030-01-15" });
    await fireEvent.press(screen.getByRole("button", { name: "Cancel scheduled leaving" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${LEAVING}/cancel`)).toBe(true));
    expect(await screen.findByRole("button", { name: "Record it" })).toBeTruthy();
  });

  it("a day that is not one is caught before anything is sent; a refusal from the server is an alert and the form stays", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${LEAVING}`]: () => json({ error: "That pupil has already left.", code: "BAD_REQUEST" }, 422) });
    await fireEvent.changeText(await screen.findByLabelText("Last day"), "15/01/2030");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(screen.getByText("That is not a real date.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Last day"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That pupil has already left.");
    expect(screen.getByRole("button", { name: "Record it" })).toBeTruthy();
  });

  it("a pupil who has left is offered the undo, which puts the form back", async () => {
    const { calls } = await mount({ ...PUPIL, left: "1" }, { [`POST ${LEAVING}/undo`]: () => json({ ok: true }) });
    expect(screen.queryByRole("button", { name: "Record it" })).toBeNull();
    await fireEvent.press(await screen.findByRole("button", { name: "Undo leaving" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${LEAVING}/undo`)).toBe(true));
    expect(await screen.findByText("ZZ Pupil is back on the roll")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Record it" })).toBeTruthy();
  });
});

/*
 * The rest of the web's row menu, each a card: the legal name, the date of
 * birth, a teacher's subjects, pausing and restoring access, and removing a
 * pupil who was never here.
 */
const DOOR = (tail: string, id = "m7") => `/api/v1/admin/people/${id}/${tail}`;

describe("the subjects as the row carries them", () => {
  it("are split on the comma, trimmed, blanks dropped", () => {
    expect(splitSubjects("")).toEqual([]);
    expect(splitSubjects(" Mathematics , Physics,, ")).toEqual(["Mathematics", "Physics"]);
  });
});

describe("the row's other actions", () => {
  it("⚠ a legal name needs a reason before it is sent; corrected, it goes with the coded reason; the server's refusal is shown on the field", async () => {
    let answer = () => json({ ok: true });
    const { calls } = await mount(PUPIL, { [`POST ${DOOR("legal-name")}`]: () => answer() });
    await screen.findByText("Legal name for ZZ Pupil");
    expect(screen.getAllByRole("button", { name: "Save" })[0]).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Legal name, as on the admission register"), "ZZ Pupil Corrected");
    await fireEvent.press(screen.getAllByRole("button", { name: "Save" })[0]!);
    expect(screen.getByText("Choose a reason")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(screen.getByRole("radio", { name: "It was spelt wrongly" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Save" })[0]!);
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${DOOR("legal-name")}`)?.body).toEqual({ name: "ZZ Pupil Corrected", reason: "SPELLING" }));
    await screen.findByText("Legal name corrected");
    answer = () => json({ error: "ZZ not a name", code: "BAD_REQUEST" }, 422);
    await fireEvent.changeText(screen.getByLabelText("Legal name, as on the admission register"), "ZZ 123");
    await fireEvent.press(screen.getAllByRole("button", { name: "Save" })[0]!);
    await screen.findByText("ZZ not a name");
  });

  it("a date of birth that is not one is caught; a real one is sent; the date on the row can be cleared with null", async () => {
    const { calls } = await mount({ ...PUPIL, birthdate: "2015-02-02" }, { [`POST ${DOOR("birthdate")}`]: () => json({ ok: true }) });
    await screen.findByText("Date of birth for ZZ Pupil");
    expect(screen.getByLabelText("Date of birth")).toHaveDisplayValue("2015-02-02");
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "02/02/2015");
    await fireEvent.press(screen.getAllByRole("button", { name: "Save" })[1]!);
    expect(screen.getByText("That is not a real date.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "2015-03-03");
    await fireEvent.press(screen.getAllByRole("button", { name: "Save" })[1]!);
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${DOOR("birthdate")}`)?.body).toEqual({ dateKey: "2015-03-03" }));
    await screen.findByText("Date of birth saved");
    await fireEvent.press(screen.getByRole("button", { name: "Remove the date" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${DOOR("birthdate")}`).at(-1)?.body).toEqual({ dateKey: null }));
    expect(screen.getByLabelText("Date of birth")).toHaveDisplayValue("");
  });

  it("a teacher's subjects are edited as a list and sent as a set; a pupil has no subjects card", async () => {
    const { calls } = await mount({ membershipId: "m2", name: "ZZ Teacher", role: "TEACHER", left: "", leavingOn: "", status: "ACTIVE", birthdate: "", subjects: "Mathematics,Physics" }, { [`POST ${DOOR("subjects", "m2")}`]: () => json({ ok: true }) });
    await screen.findByText("Subjects for ZZ Teacher");
    expect(screen.getByLabelText("Teaching subjects 1")).toHaveDisplayValue("Mathematics");
    await fireEvent.press(screen.getByRole("button", { name: "Remove Physics" }));
    await fireEvent.press(screen.getByRole("button", { name: "Add a subject" }));
    await fireEvent.changeText(screen.getByLabelText("Teaching subjects 2"), " Chemistry ");
    await fireEvent.press(screen.getAllByRole("button", { name: "Save" }).at(-1)!);
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${DOOR("subjects", "m2")}`)?.body).toEqual({ subjects: ["Mathematics", "Chemistry"] }));
    await screen.findByText("Saved.");
    expect(screen.queryByText(/^Remove ZZ Teacher from this school/)).toBeNull();
  });

  it("a pupil has no subjects card", async () => {
    await mount(PUPIL);
    await screen.findByText("Legal name for ZZ Pupil");
    expect(screen.queryByText("Subjects for ZZ Pupil")).toBeNull();
  });

  it("⚠ access is paused with a reason and the card turns into the restore; restored, it turns back", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${DOOR("pause")}`]: () => json({ ok: true }), [`POST ${DOOR("restore")}`]: () => json({ ok: true }) });
    await screen.findByText("Pause ZZ Pupil’s access?");
    await fireEvent.changeText(screen.getByLabelText("Why (kept in the audit log)"), "ZZ fees unpaid");
    await fireEvent.press(screen.getByRole("button", { name: "Pause access" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${DOOR("pause")}`)?.body).toEqual({ reason: "ZZ fees unpaid" }));
    await screen.findByText("ZZ Pupil’s access is paused");
    await fireEvent.press(await screen.findByRole("button", { name: "Restore" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${DOOR("restore")}`)).toBe(true));
    await screen.findByText("ZZ Pupil can sign in again");
    expect(await screen.findByRole("button", { name: "Pause access" })).toBeTruthy();
  });

  it("a paused person opens on the restore; a blank reason is the server's refusal, shown on the field", async () => {
    await mount({ ...PUPIL, status: "SUSPENDED" }, { [`POST ${DOOR("restore")}`]: () => json({ error: "ZZ not paused", code: "BAD_REQUEST" }, 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Restore" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not paused");
  });

  it("⚠ removing asks twice, and what stood in the way comes back as lines under the refusal; removed, the screen goes back", async () => {
    let answer = () => json({ error: "This pupil has a record here.", code: "BAD_REQUEST", issues: { attendance: "3 days of attendance", marks: "1 mark" } }, 422);
    const { calls } = await mount(PUPIL, { [`POST ${DOOR("remove")}`]: () => answer() });
    await screen.findByText("Remove ZZ Pupil from this school?");
    expect(screen.getByText(/^Changed school instead\?/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Remove them" }));
    expect(calls().some((c) => c.line === `POST ${DOOR("remove")}`)).toBe(false);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Remove them" }).at(-1)!);
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${DOOR("remove")}`)).toBe(true));
    expect(await screen.findByRole("alert")).toHaveTextContent("This pupil has a record here.");
    expect(screen.getByText("3 days of attendance")).toBeTruthy();
    expect(screen.getByText("1 mark")).toBeTruthy();
    answer = () => json({ ok: true });
    await fireEvent.press(screen.getAllByRole("button", { name: "Remove them" }).at(-1)!);
    await screen.findByText("ZZ Pupil has been removed");
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("a pupil who has left is offered none of this: the undo alone", async () => {
    await mount({ ...PUPIL, left: "1" });
    await screen.findByRole("button", { name: "Undo leaving" });
    expect(screen.queryByText("Legal name for ZZ Pupil")).toBeNull();
    expect(screen.queryByText(/^Remove ZZ Pupil/)).toBeNull();
  });
});
