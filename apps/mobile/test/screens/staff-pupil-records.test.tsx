import { fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { PupilRecords } from "@/screens/staff/pupil-records";
import { OfficePupilRecord } from "@/screens/staff/pupil-record";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

/** The screens' doors go into the app's own routes; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ASHA = "czz000000000000000pupil1";
const BELA = "czz000000000000000pupil2";
const CHIRAG = "czz000000000000000pupil3";
const PATH = "/api/v1/office/pupil-records";

const ROWS = [
  { studentMembershipId: ASHA, studentName: "ZZ Asha", className: "ZZ 5A", missing: ["admissionNumber", "admissionDate"], missingForFiling: ["gender"], requestedAt: "2026-09-01T05:00:00.000Z", familyFilledAt: null },
  { studentMembershipId: BELA, studentName: "ZZ Bela", className: "ZZ 3B", missing: ["fatherName"], missingForFiling: [], requestedAt: null, familyFilledAt: null },
  { studentMembershipId: CHIRAG, studentName: "ZZ Chirag", className: "ZZ 5A", missing: [], missingForFiling: [], requestedAt: "2026-08-20T05:00:00.000Z", familyFilledAt: "2026-08-22T05:00:00.000Z" },
];

/** The list answers by the filter it is asked for, so the toggle can be seen to change the request. */
const answers = (): Answers => ({
  [`GET ${PATH}`]: ({ url }) => {
    const only = url.searchParams.get("missing") === "1";
    return json({ rows: only ? ROWS.filter((r) => r.missing.length > 0) : ROWS, total: 3, complete: 1, incomplete: 2 });
  },
  [`POST ${PATH}/request`]: async ({ init }) => {
    const body = JSON.parse(String(init.body)) as { membershipIds?: string[] };
    return json({ asked: body.membershipIds?.length ?? 2, families: body.membershipIds?.length ?? 2 });
  },
});

const compose = () => (
  <ToastProvider>
    <PupilRecords />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

describe("the office's pupil records", () => {
  it("loads the counts and, by default, only the incomplete records with what is blank and when the family was asked", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("ZZ Asha");
    expect(calls().some((c) => c.line === `GET ${PATH}?missing=1`)).toBe(true);
    expect(screen.getByLabelText("All pupils: 3")).toBeTruthy();
    expect(screen.getByLabelText("Complete: 1")).toBeTruthy();
    expect(screen.getByLabelText("Only incomplete: 2")).toBeTruthy();
    expect(screen.getByText("Still blank: Admission register number, Date of admission")).toBeTruthy();
    expect(screen.getByText("Still blank: Father's name")).toBeTruthy();
    expect(screen.getByText("Still blank for the UDISE+ filing: Gender")).toBeTruthy();
    expect(screen.getByText(/^ZZ 5A · Asked .*2026$/)).toBeTruthy();
    expect(screen.getByText("ZZ 3B · Not asked yet")).toBeTruthy();
    expect(screen.getByText("2 missing")).toBeTruthy();
    expect(screen.getByText("1 missing")).toBeTruthy();
    expect(screen.queryByText("ZZ Chirag")).toBeNull();
    expect(screen.getByRole("tab", { name: "Only incomplete (2)" })).toBeTruthy();
  });

  it("the toggle asks for every pupil, where a complete record says when the family's details were approved", async () => {
    const { calls } = await mountStaff(compose(), "PRINCIPAL", answers());
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("tab", { name: "All pupils (3)" }));
    expect(await screen.findByText("ZZ Chirag")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByText(/^ZZ 5A · Family's details approved .*2026$/)).toBeTruthy();
    // The word once on the stat, once on the complete row's pill.
    expect(screen.getAllByText("Complete")).toHaveLength(2);
    // A complete record has nothing to ask for.
    expect(screen.queryByRole("button", { name: "Ask this family: ZZ Chirag" })).toBeNull();
  });

  it("Ask the families posts with nobody named, and says how many were asked", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("button", { name: "Ask the families" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/request`)).toBe(true));
    expect(calls().find((c) => c.line === `POST ${PATH}/request`)!.body).toEqual({});
    expect(await screen.findByText("Asked 2 families about 2 pupils.")).toBeTruthy();
  });

  it("a row's Ask this family names that one pupil; Edit opens the record", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("button", { name: "Ask this family: ZZ Bela" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/request`)).toBe(true));
    expect(calls().find((c) => c.line === `POST ${PATH}/request`)!.body).toEqual({ membershipIds: [BELA] });
    expect(await screen.findByText("Asked 1 families about 1 pupils.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Edit the record: ZZ Asha" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: ASHA } });
  });

  it("a refused ask is said as a toast", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [`POST ${PATH}/request`]: refused("ZZ no families", 409) });
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("button", { name: "Ask the families" }));
    expect(await screen.findByText("ZZ no families")).toBeTruthy();
  });

  it("with no pupils at all, the door is admitting them; with every record complete, the door is the full list", async () => {
    await mountStaff(compose(), "ADMIN", { [`GET ${PATH}`]: () => json({ rows: [], total: 0, complete: 0, incomplete: 0 }) });
    expect(await screen.findByText("No pupils yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Admit pupils from a list" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/intake");
    expect(screen.queryByRole("button", { name: "Ask the families" })).toBeNull();
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(compose(), "ADMIN", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

const ASKS = "GET /api/v1/office/record-changes";
const ASK = { id: "rc1", studentMembershipId: BELA, studentName: "ZZ Bela", className: "ZZ 3B", requestedByName: "ZZ Parent", byPupil: false, reason: "We moved house in June", status: "PENDING", changes: [{ field: "city", from: "Pune", to: "Nashik" }, { field: "category", from: null, to: "OBC" }], declineReason: null, decidedByName: null, decidedAt: null, can: { decide: true, withdraw: false }, createdAt: "2026-09-20T05:00:00.000Z" };

describe("the asks that wait, above the list", () => {
  it("names each pupil with the fields asked about and opens that pupil's record, asking only for the ones that wait", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", { ...answers(), [ASKS]: () => json({ items: [ASK, { ...ASK, id: "rc2", studentMembershipId: CHIRAG, studentName: "ZZ Chirag", className: null, changes: [{ field: "fatherName", from: "ZZ Ravi", to: "ZZ Ravindra" }] }], pending: 2 }) });
    expect(await screen.findByText("Changes families have asked for")).toBeTruthy();
    expect(calls().some((c) => c.line === `${ASKS}?status=PENDING`)).toBe(true);
    expect(screen.getByText("2 waiting")).toBeTruthy();
    expect(screen.getByText("A family cannot change a record itself. Approve to put their values on the record, or decline.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Chirag, Father's name" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: CHIRAG } });
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Bela, ZZ 3B · Town or city, Category" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: BELA } });
  });

  it("draws no card when none wait, or when the list cannot be read", async () => {
    await mountStaff(compose(), "PRINCIPAL", { ...answers(), [ASKS]: () => json({ items: [], pending: 0 }) });
    await screen.findByText("ZZ Asha");
    expect(screen.queryByText("Changes families have asked for")).toBeNull();
    await mountStaff(compose(), "PRINCIPAL", { ...answers(), [ASKS]: refused("ZZ no list") });
    await screen.findByText("ZZ Asha");
    expect(screen.queryByText("Changes families have asked for")).toBeNull();
  });
});

const PEN = "27250100101";
const BY_PEN = `GET /api/v1/office/pupils/by-pen/${PEN}`;

describe("finding a pupil by PEN", () => {
  it("refuses anything but eleven digits before asking, then names the pupil here with the class and opens the record", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", { ...answers(), [BY_PEN]: () => json({ pen: PEN, found: "HERE", pupil: { membershipId: BELA, name: "ZZ Bela", className: "ZZ 3B", studentCode: "ZZ-002" } }) });
    await screen.findByText("ZZ Asha");
    await fireEvent.changeText(screen.getByLabelText("Find a pupil by PEN"), "123");
    await fireEvent.press(screen.getByRole("button", { name: "Find" }));
    expect(screen.getByText("A PEN is eleven digits.")).toBeTruthy();
    expect(calls().some((c) => c.line.includes("/pupils/by-pen/"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Find a pupil by PEN"), "27250 100101");
    await fireEvent.press(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText("ZZ Bela, ZZ 3B — on the roll here.")).toBeTruthy();
    expect(screen.queryByText("A PEN is eleven digits.")).toBeNull();
    expect(calls().some((c) => c.line === BY_PEN)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Open the record" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: BELA } });
  });

  it.each([
    ["here in no class yet, with the door", { pen: PEN, found: "HERE", pupil: { membershipId: BELA, name: "ZZ Bela", className: null, studentCode: null } }, "ZZ Bela — on the roll here, in no class yet.", true],
    ["on a roll elsewhere, with no door", { pen: PEN, found: "ELSEWHERE_ACTIVE", pupil: null }, /^That PEN belongs to a pupil on the roll at another school on Shalaghar\./, false],
    ["left elsewhere, with no door", { pen: PEN, found: "ELSEWHERE_LEFT", pupil: null }, /^That PEN belongs to a pupil who has left another school on Shalaghar\./, false],
    ["nobody, with no door", { pen: PEN, found: "NONE", pupil: null }, "No pupil on Shalaghar holds that PEN.", false],
  ])("a pupil %s", async (_label, answer, sentence, door) => {
    await mountStaff(compose(), "PRINCIPAL", { ...answers(), [BY_PEN]: () => json(answer) });
    await screen.findByText("ZZ Asha");
    await fireEvent.changeText(screen.getByLabelText("Find a pupil by PEN"), PEN);
    await fireEvent.press(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText(sentence)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Open the record" }) !== null).toBe(door);
  });

  it("a refused lookup is said under the field", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [BY_PEN]: refused("ZZ not yours", 403) });
    await screen.findByText("ZZ Asha");
    await fireEvent.changeText(screen.getByLabelText("Find a pupil by PEN"), PEN);
    await fireEvent.press(screen.getByRole("button", { name: "Find" }));
    expect(await screen.findByText("ZZ not yours")).toBeTruthy();
  });
});

const VIEW = {
  studentMembershipId: ASHA,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  studentCode: "ZZ-001",
  birthdate: "2016-03-14",
  record: null,
  missing: ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue", "addressLine", "city", "admissionNumber", "admissionDate"],
  complete: false,
  missingForFiling: ["gender"],
  canEdit: true,
  penEditable: true,
  penChange: null,
};

describe("one pupil's record for the office", () => {
  it("shows the form the family has with the office's sentence, saves it as a whole, and offers to issue a certificate", async () => {
    mockRouter.params = { membershipId: ASHA };
    const { calls } = await mountStaff(
      <ToastProvider>
        <OfficePupilRecord />
      </ToastProvider>,
      "ADMIN",
      {
        [`GET ${PATH}/${ASHA}`]: () => json(VIEW),
        [`POST ${PATH}/${ASHA}`]: async ({ init }) => {
          const body = JSON.parse(String(init.body)) as Record<string, string | null>;
          return json({ ...VIEW, record: { ...body, requestedAt: null, familyFilledAt: null, updatedAt: "2026-09-18T05:00:00.000Z" }, missing: ["motherName"], complete: false });
        },
      },
    );
    expect(await screen.findByText("9 missing")).toBeTruthy();
    // No PEN on the account yet: the admin types the first entry on the form, and there is no correction to propose.
    expect(screen.getByLabelText("UDISE+ PEN").props.value).toBe("");
    expect(screen.queryByText("Propose a correction to the PEN")).toBeNull();
    expect(screen.getByText("Still blank for the UDISE+ filing: Gender")).toBeTruthy();
    expect(screen.getByText("The details a school certificate names: the parents, the place of birth, the admission register, the last school. The family fills them in once; the office may correct them.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Father's name"), "ZZ Ravi");
    await fireEvent.press(within(screen.getByLabelText("Gender")).getByRole("radio", { name: "Male" }));
    await fireEvent.press(within(screen.getByLabelText("Economically weaker section or disadvantaged group")).getByRole("radio", { name: "No" }));
    // The office types the roll number, which the family only reads, and picks the category by its code.
    expect(screen.getByLabelText("Roll number").props.accessibilityHint).toBe("Optional · In the present class; printed on the filing sheets.");
    expect(screen.getByLabelText("Roll number").props.keyboardType).toBe("number-pad");
    await fireEvent.changeText(screen.getByLabelText("Roll number"), "7");
    await fireEvent.changeText(screen.getByLabelText("Mother\u2019s occupation"), "Nurse");
    await fireEvent.press(within(screen.getByLabelText("Category")).getByRole("radio", { name: "SC" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/${ASHA}`)).toBe(true));
    expect(calls().find((c) => c.line.startsWith("POST"))!.body).toMatchObject({ fatherName: "ZZ Ravi", motherName: "", admissionDate: null, penNumber: "", gender: "M", ews: "no", bpl: "", cwsnType: "", bloodGroup: "", rollNumber: "7", motherOccupation: "Nurse", category: "SC", religion: "", previousSchoolTcDate: null, annualIncome: "" });
    expect(await screen.findByText("Record saved.")).toBeTruthy();
    expect(screen.getByText("1 missing")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Issue a certificate" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate-issue", params: { membershipId: ASHA } });
  });

  const RECORD = { fatherName: "ZZ Ravi", motherName: "ZZ Meera", placeOfBirth: "Pune", nationality: "INDIAN", religion: null, caste: null, category: null, motherTongue: "MARATHI", addressLine: "1 ZZ Road", city: "Pune", postalCode: null, admissionNumber: "GR-1", admissionDate: "2023-06-01", admittedToGrade: null, previousSchool: null, penNumber: "27250100101", gender: null, nameLocal: null, fatherNameLocal: null, motherNameLocal: null, bpl: null, ews: null, cwsnType: null, bloodGroup: null, requestedAt: null, familyFilledAt: null, updatedAt: "2026-09-10T05:00:00.000Z" };
  const LOCKED = { ...VIEW, record: RECORD, missing: [], complete: true, penEditable: false };
  const CHANGE = { id: "pc1", studentMembershipId: ASHA, studentName: "ZZ Asha", className: "ZZ 5A", fromPen: "27250100101", toPen: "27250100102", reason: "Two digits swapped", status: "PENDING", requestedByName: "ZZ Admin", principal: { decided: false, approved: null, by: null }, guardian: { decided: false, approved: null, by: null, waived: true }, decisionReason: null, can: { decide: false, withdraw: true }, createdAt: "2026-09-20T05:00:00.000Z", appliedAt: null };
  const PROPOSE = `POST ${PATH}/${ASHA}/pen-change`;
  const DECIDE = "POST /api/v1/office/pen-changes/pc1/decide";
  const WITHDRAW = "POST /api/v1/office/pen-changes/pc1/withdraw";
  const mount = (role: "ADMIN" | "PRINCIPAL", view: unknown, extra: Record<string, (r: { init: RequestInit }) => Response> = {}) => {
    mockRouter.params = { membershipId: ASHA };
    return mountStaff(
      <ToastProvider>
        <OfficePupilRecord />
      </ToastProvider>,
      role,
      { [`GET ${PATH}/${ASHA}`]: () => json(view), ...extra },
    );
  };

  it("with a PEN on the account, the admin reads it locked, leaves it out of the record they save, and proposes a corrected number with a reason", async () => {
    const { calls } = await mount("ADMIN", LOCKED, {
      [`POST ${PATH}/${ASHA}`]: ({ init }) => json({ ...LOCKED, record: { ...RECORD, ...(JSON.parse(String(init.body)) as object) } }),
      [PROPOSE]: ({ init }) => json({ ...CHANGE, toPen: (JSON.parse(String(init.body)) as { toPen: string | null }).toPen }),
    });
    expect(await screen.findByText("27250100101")).toBeTruthy();
    expect(screen.getByText("Entered by the school office once; a correction needs the principal and a guardian to agree.")).toBeTruthy();
    expect(screen.queryByLabelText("UDISE+ PEN")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/${ASHA}`)).toBe(true));
    expect(calls().find((c) => c.line === `POST ${PATH}/${ASHA}`)!.body).not.toHaveProperty("penNumber");
    // The proposal: a wrong shape is said under the field and nothing is sent until it is right and the reason is there.
    expect(screen.getByText("Propose a correction to the PEN")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Corrected PEN"), "123");
    expect(screen.getByText("A PEN is eleven digits.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send for approval" }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Corrected PEN"), "27250 100102");
    await fireEvent.changeText(screen.getByLabelText("Why"), "Two digits swapped");
    await fireEvent.press(screen.getByRole("button", { name: "Send for approval" }));
    await waitFor(() => expect(calls().some((c) => c.line === PROPOSE)).toBe(true));
    expect(calls().find((c) => c.line === PROPOSE)!.body).toEqual({ toPen: "27250100102", reason: "Two digits swapped" });
    expect(await screen.findByText("Proposed. The principal and the family have been told.")).toBeTruthy();
  });

  it("Remove the number instead proposes a null PEN", async () => {
    const { calls } = await mount("ADMIN", LOCKED, { [PROPOSE]: () => json({ ...CHANGE, toPen: null }) });
    await screen.findByText("27250100101");
    await fireEvent.press(screen.getByRole("switch", { name: "Remove the number instead" }));
    await fireEvent.changeText(screen.getByLabelText("Why"), "Belongs to another child");
    await fireEvent.press(screen.getByRole("button", { name: "Send for approval" }));
    await waitFor(() => expect(calls().some((c) => c.line === PROPOSE)).toBe(true));
    expect(calls().find((c) => c.line === PROPOSE)!.body).toEqual({ toPen: null, reason: "Belongs to another child" });
  });

  it("a pending correction shows both words and the admin's Withdraw, which posts and says so; with no guardian the row says the head's word settles it", async () => {
    const { calls } = await mount("ADMIN", { ...LOCKED, penChange: CHANGE }, { [WITHDRAW]: () => json({ ...CHANGE, status: "WITHDRAWN", can: { decide: false, withdraw: false } }) });
    expect(await screen.findByText("PEN correction awaiting approval")).toBeTruthy();
    expect(screen.getByText("From 27250100101 to 27250100102")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText("No guardian linked; the principal\u2019s word settles it")).toBeTruthy();
    expect(screen.queryByText("Propose a correction to the PEN")).toBeNull();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await waitFor(() => expect(calls().some((c) => c.line === WITHDRAW)).toBe(true));
    expect(await screen.findByText("Proposal withdrawn.")).toBeTruthy();
  });

  it("the head approves with one press and rejects with a reason, each posting the office's decision", async () => {
    const head = { ...CHANGE, can: { decide: true, withdraw: false } };
    const { calls } = await mount("PRINCIPAL", { ...LOCKED, penChange: head }, { [DECIDE]: ({ init }) => json({ ...head, principal: { decided: true, approved: (JSON.parse(String(init.body)) as { approve: boolean }).approve, by: "ZZ Head" }, can: { decide: false, withdraw: false } }) });
    await screen.findByText("PEN correction awaiting approval");
    // The head neither types the number nor proposes: the field is locked with the family's note.
    expect(screen.getByText("Entered by the school office. A correction needs the principal and a guardian to agree.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Withdraw" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls().filter((c) => c.line === DECIDE)).toHaveLength(1));
    expect(calls().find((c) => c.line === DECIDE)!.body).toEqual({ approve: true });
    expect(await screen.findByText("Your decision is recorded.")).toBeTruthy();
  });

  it("the head's rejection carries the reason typed", async () => {
    const head = { ...CHANGE, can: { decide: true, withdraw: false } };
    const { calls } = await mount("PRINCIPAL", { ...LOCKED, penChange: head }, { [DECIDE]: () => json({ ...head, status: "REJECTED", principal: { decided: true, approved: false, by: "ZZ Head" }, decisionReason: "Not this one", can: { decide: false, withdraw: false } }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Reject" }));
    await fireEvent.changeText(screen.getByLabelText("Why not"), "Not this one");
    await fireEvent.press(screen.getAllByRole("button", { name: "Reject" }).at(-1)!);
    await waitFor(() => expect(calls().filter((c) => c.line === DECIDE)).toHaveLength(1));
    expect(calls().find((c) => c.line === DECIDE)!.body).toEqual({ approve: false, reason: "Not this one" });
  });

  const ASKED = { ...ASK, studentMembershipId: ASHA, studentName: "ZZ Asha", className: "ZZ 5A" };
  const DECIDE_ASK = "POST /api/v1/office/record-changes/rc1/decide";

  it("a family's ask waits above the form with its lines in words; Approve and update posts the yes, says so and reads the record again, which now holds the values", async () => {
    let applied = false;
    mockRouter.params = { membershipId: ASHA };
    const { calls } = await mountStaff(
      <ToastProvider>
        <OfficePupilRecord />
      </ToastProvider>,
      "ADMIN",
      {
        [`GET ${PATH}/${ASHA}`]: () => json(applied ? { ...LOCKED, record: { ...RECORD, city: "Nashik", category: "OBC", updatedAt: "2026-09-21T05:00:00.000Z" }, change: null } : { ...LOCKED, change: ASKED }),
        [DECIDE_ASK]: () => {
          applied = true;
          return json({ ...ASKED, status: "APPLIED", decidedByName: "ZZ Head", decidedAt: "2026-09-21T05:00:00.000Z", can: { decide: false, withdraw: false } });
        },
      },
    );
    expect(await screen.findByText("Changes families have asked for")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText(/^Asked by ZZ Parent on .*2026$/)).toBeTruthy();
    expect(screen.getByText("Town or city: Pune → Nashik")).toBeTruthy();
    expect(screen.getByText("Category: blank → OBC")).toBeTruthy();
    expect(screen.getByText("Reason: We moved house in June")).toBeTruthy();
    // The office decides; taking back is the family's.
    expect(screen.queryByRole("button", { name: "Take it back" })).toBeNull();
    expect(screen.getByLabelText("Town or city").props.value).toBe("Pune");
    await fireEvent.press(screen.getByRole("button", { name: "Approve and update" }));
    await waitFor(() => expect(calls().filter((c) => c.line === DECIDE_ASK)).toHaveLength(1));
    expect(calls().find((c) => c.line === DECIDE_ASK)!.body).toEqual({ approve: true });
    expect(await screen.findByText("Record updated")).toBeTruthy();
    await waitFor(() => expect(screen.getByLabelText("Town or city").props.value).toBe("Nashik"));
    expect(within(screen.getByLabelText("Category")).getByRole("radio", { name: "OBC" })).toBeChecked();
    expect(screen.queryByText("Changes families have asked for")).toBeNull();
  });

  it("Decline opens a box for a sentence the family will read, and posts the no with it; Cancel closes the box and a bare decline carries no reason", async () => {
    const { calls } = await mount("PRINCIPAL", { ...LOCKED, change: ASKED }, { [DECIDE_ASK]: () => json({ ...ASKED, status: "DECLINED", declineReason: "The register says Pune", can: { decide: false, withdraw: false } }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline" }));
    expect(calls().some((c) => c.line === DECIDE_ASK)).toBe(false);
    expect(screen.getByText("ZZ Asha: Town or city, Category")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("A sentence for the family (optional)")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Decline" }));
    await fireEvent.changeText(screen.getByLabelText("A sentence for the family (optional)"), " The register says Pune ");
    await fireEvent.press(screen.getAllByRole("button", { name: "Decline" }).at(-1)!);
    await waitFor(() => expect(calls().filter((c) => c.line === DECIDE_ASK)).toHaveLength(1));
    expect(calls().find((c) => c.line === DECIDE_ASK)!.body).toEqual({ approve: false, reason: "The register says Pune" });
    expect(await screen.findByText("Request declined")).toBeTruthy();
  });

  it("a decline with nothing typed posts only the no, and a refused decision is an alert on the card", async () => {
    const { calls } = await mount("ADMIN", { ...LOCKED, change: ASKED }, { [DECIDE_ASK]: () => json({ error: "ZZ already decided", code: "CONFLICT" }, 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Decline" }).at(-1)!);
    await waitFor(() => expect(calls().filter((c) => c.line === DECIDE_ASK)).toHaveLength(1));
    expect(calls().find((c) => c.line === DECIDE_ASK)!.body).toEqual({ approve: false });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ already decided");
  });

  it("opened with no pupil, offers the list", async () => {
    await mountStaff(<OfficePupilRecord />, "ADMIN", {});
    expect(await screen.findByText("No pupils yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Pupil records" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
  });
});
