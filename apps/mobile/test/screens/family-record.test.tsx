import { RECORD_CHANGE_FIELDS, recordChangeFileSchema } from "@edulink/contracts";
import { fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyRecord, IdCardButton } from "@/screens/family/record";
import * as Sharing from "expo-sharing";
import { me, mountStaff, json } from "./staff-harness";
import { ASKABLE, bodyFrom, CATEGORY_VALUES, changesFrom, FILING_FIELDS, formFrom, LANGUAGE_VALUES, NATIONALITY_VALUES, OPTIONAL_FIELDS, RELIGION_VALUES, REQUIRED_FIELDS, valueWords } from "@/screens/shared/pupil-record";

const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const RECORD = {
  fatherName: "ZZ Ravi",
  motherName: "ZZ Meera",
  placeOfBirth: "Pune",
  nationality: "INDIAN",
  religion: null,
  caste: null,
  category: null,
  motherTongue: "MARATHI",
  addressLine: "1 ZZ Road",
  city: "Pune",
  postalCode: "411001",
  admissionNumber: "",
  admissionDate: null,
  admittedToGrade: null,
  previousSchool: null,
  penNumber: null,
  gender: null,
  nameLocal: null,
  fatherNameLocal: null,
  motherNameLocal: null,
  bpl: null,
  ews: null,
  cwsnType: null,
  bloodGroup: null,
  previousSchoolTcNumber: null,
  previousSchoolTcDate: null,
  fatherOccupation: null,
  motherOccupation: null,
  annualIncome: null,
  guardianPhone: null,
  rte: null, alternatePhone: null, freeUniform: null, freeTextbook: null, extracurricular: null, stream: null, vocationalCourse: null, vocationalTradeId: null, vocationalJobRoleId: null, vocationalExamAppeared: null,
  repeating: "no",
  rollNumber: "12",
  requestedAt: "2026-09-01T05:00:00.000Z",
  familyFilledAt: null,
  updatedAt: "2026-09-10T05:00:00.000Z",
};
const VIEW = { studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", studentCode: "ZZ-001", birthdate: "2016-03-14", record: RECORD, missing: ["admissionNumber", "admissionDate"], missingForFiling: ["gender", "bpl"], complete: false, canEdit: false, canRequest: true, change: null, penEditable: false, penChange: null };
const PATH = "/api/v1/family/record";
const CHANGES = "/api/v1/family/record/changes";
const CHILDREN_PATH = "/api/v1/family/children";
const ASK = { id: "rc1", studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", requestedByName: "ZZ Parent", byPupil: false, reason: "We moved house in June", status: "PENDING", changes: [{ field: "city", from: "Pune", to: "Nashik" }, { field: "motherTongue", from: "MARATHI", to: "HINDI" }, { field: "religion", from: null, to: "HINDU" }], declineReason: null, decidedByName: null, decidedAt: null, can: { decide: false, withdraw: true }, createdAt: "2026-09-20T05:00:00.000Z" };
const WITHDRAW = "/api/v1/family/record/changes/rc1/withdraw";
const NONE = { items: [], pending: 0 };

const posts = (fetch: jest.Mock, path = CHANGES) => calls(fetch, path).filter((c) => c.init?.method === "POST");
const asks = (answer: (init: RequestInit | undefined) => object = () => ASK) => (init: RequestInit | undefined) => (init?.method === "POST" ? answer(init) : NONE);
const compose = () => (
  <ToastProvider>
    <FamilyRecord />
  </ToastProvider>
);

describe("the helpers behind the record", () => {
  it("start from the record as stored, or blank, and send every field trimmed with a blank date as null", () => {
    expect(formFrom(null).fatherName).toBe("");
    expect(formFrom(RECORD).motherTongue).toBe("MARATHI");
    expect(formFrom(RECORD).religion).toBe("");
    const body = bodyFrom({ ...formFrom(RECORD), fatherName: "  ZZ Ravi ", admissionDate: " " });
    expect(body.fatherName).toBe("ZZ Ravi");
    expect(body.admissionDate).toBeNull();
    expect(bodyFrom({ ...formFrom(null), admissionDate: "2023-06-01" }).admissionDate).toBe("2023-06-01");
    expect(Object.keys(body).sort()).toEqual([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, ...FILING_FIELDS].sort());
    expect(bodyFrom({ ...formFrom(null), gender: "F", bpl: "yes", cwsnType: "9", bloodGroup: "B+" })).toMatchObject({ gender: "F", bpl: "yes", ews: "", cwsnType: "9", bloodGroup: "B+", nameLocal: "" });
    // The collection gaps: the TC date goes as a key or null, the roll number is left out when told to.
    expect(body).toMatchObject({ previousSchoolTcNumber: "", previousSchoolTcDate: null, fatherOccupation: "", motherOccupation: "", annualIncome: "", rollNumber: "12" });
    expect(bodyFrom({ ...formFrom(null), previousSchoolTcDate: " 2022-04-30 " }).previousSchoolTcDate).toBe("2022-04-30");
    expect(bodyFrom(formFrom(RECORD), ["rollNumber"])).not.toHaveProperty("rollNumber");
    expect(OPTIONAL_FIELDS).toEqual(["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber", "rollNumber", "fatherOccupation", "motherOccupation", "annualIncome", "guardianPhone"]);
    expect(bodyFrom({ ...formFrom(null), guardianPhone: " 98765 43210 " }).guardianPhone).toBe("98765 43210");
    expect(CATEGORY_VALUES).toEqual(["GENERAL", "SC", "ST", "OBC", "VJ", "NT", "SBC"]);
    // Names from a list: the languages of the Eighth Schedule with English and "another", and six nationalities.
    expect(LANGUAGE_VALUES).toHaveLength(24);
    expect(LANGUAGE_VALUES).toEqual(expect.arrayContaining(["MARATHI", "HINDI", "ENGLISH", "URDU", "OTHER"]));
    expect(NATIONALITY_VALUES).toEqual(["INDIAN", "NEPALI", "BHUTANESE", "BANGLADESHI", "SRI_LANKAN", "OTHER"]);
    expect(RELIGION_VALUES).toEqual(["HINDU", "MUSLIM", "CHRISTIAN", "SIKH", "BUDDHIST", "PARSI", "JAIN", "OTHER"]);
  });

  it("an ask holds only the askable fields that differ from the record, a cleared date as null, and is a body the contract takes", () => {
    // Every field of the form but the PEN, the roll number and "repeating" may be asked about: the contracts' list, whole.
    expect([...ASKABLE].sort()).toEqual([...RECORD_CHANGE_FIELDS].sort());
    expect([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS, ...FILING_FIELDS].filter((f) => !ASKABLE.has(f)).sort()).toEqual(["penNumber", "repeating", "rollNumber"]);
    expect(changesFrom(formFrom(RECORD), RECORD)).toEqual({});
    // A space either side is not a change; the three that are not the family's to ask about never travel.
    expect(changesFrom({ ...formFrom(RECORD), fatherName: " ZZ Ravi ", penNumber: "27250100101", rollNumber: "7", repeating: "yes" }, RECORD)).toEqual({});
    const withDate = { ...RECORD, admissionDate: "2023-06-01" };
    const changes = changesFrom({ ...formFrom(withDate), city: " Nashik ", admissionDate: "", admissionNumber: "GR-42", category: "OBC", postalCode: "" }, withDate);
    expect(changes).toEqual({ city: "Nashik", admissionDate: null, admissionNumber: "GR-42", category: "OBC", postalCode: "" });
    expect(recordChangeFileSchema.safeParse({ changes, reason: "ZZ why" }).success).toBe(true);
    // A record nobody has written: whatever is typed differs from nothing.
    expect(changesFrom({ ...formFrom(null), fatherName: "ZZ Ravi" }, null)).toEqual({ fatherName: "ZZ Ravi" });
  });

  it("show a stored code as its word, and a value typed before the lists as itself", () => {
    const t = ((key: string) => key) as never;
    expect(valueWords(t, "bpl", "yes")).toBe("pupilRecord.yes");
    expect(valueWords(t, "rte", "no")).toBe("pupilRecord.no");
    expect(valueWords(t, "ews", "perhaps")).toBe("perhaps");
    expect(valueWords(t, "gender", "M")).toBe("pupilRecord.genderM");
    expect(valueWords(t, "gender", "F")).toBe("pupilRecord.genderF");
    expect(valueWords(t, "gender", "T")).toBe("pupilRecord.genderT");
    expect(valueWords(t, "gender", "X")).toBe("X");
    expect(valueWords(t, "cwsnType", "NONE")).toBe("pupilRecord.cwsnNone");
    expect(valueWords(t, "cwsnType", "9")).toBe("9 — Autism spectrum disorder");
    expect(valueWords(t, "motherTongue", "MARATHI")).toBe("pupilRecord.langMarathi");
    expect(valueWords(t, "motherTongue", "Ahirani")).toBe("Ahirani");
    expect(valueWords(t, "nationality", "SRI_LANKAN")).toBe("pupilRecord.natSriLankan");
    expect(valueWords(t, "nationality", "constructor")).toBe("constructor");
    expect(valueWords(t, "category", "OBC")).toBe("pupilRecord.catOBC");
    expect(valueWords(t, "category", "Open")).toBe("Open");
    expect(valueWords(t, "religion", "SIKH")).toBe("pupilRecord.relSikh");
    expect(valueWords(t, "religion", "Hinduism")).toBe("Hinduism");
    expect(valueWords(t, "city", "Pune")).toBe("Pune");
  });
});

describe("the pupil record for the guardian", () => {
  it("is loading while the record is on its way", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("is read, not written: every field as words with nothing to type and no Save, the office's note only on what cannot be asked about", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, record: { ...RECORD, gender: "F", cwsnType: "9", category: "OBC", admissionDate: "2023-06-01" } }), [CHANGES]: () => NONE });
    expect(await screen.findByText("Still blank: Admission register number, Date of admission")).toBeTruthy();
    expect(screen.getByText("Still blank for the UDISE+ filing: Gender, Below-poverty-line card")).toBeTruthy();
    expect(screen.getByText("2 missing")).toBeTruthy();
    expect(screen.getByLabelText(/^Date of birth: .*2016\. Recorded by the school/)).toBeTruthy();
    expect(screen.getByText("The school issues your child's certificates — a bonafide, a transfer certificate — from these details. Only the office can change them; if something is wrong or blank, ask for a change.")).toBeTruthy();
    // Words, not inputs: the family's own details and the office's alike, a code as its label, a blank as a dash.
    expect(screen.getByLabelText("Father's name: ZZ Ravi")).toBeTruthy();
    expect(screen.getByLabelText("Mother tongue: Marathi")).toBeTruthy();
    expect(screen.getByLabelText("Nationality: Indian")).toBeTruthy();
    expect(screen.getByLabelText("Religion: —")).toBeTruthy();
    expect(screen.getByLabelText("Admission register number: —")).toBeTruthy();
    expect(screen.getByLabelText("Date of admission: 2023-06-01")).toBeTruthy();
    expect(screen.getByLabelText("Category: OBC")).toBeTruthy();
    expect(screen.getByLabelText("Gender: Female")).toBeTruthy();
    expect(screen.getByLabelText("Disability, if any: 9 — Autism spectrum disorder")).toBeTruthy();
    expect(screen.getByLabelText("Blood group: —")).toBeTruthy();
    for (const label of ["Father's name", "Religion", "Mother tongue", "Admission register number", "Category", "Gender", "Blood group", "Town or city", "Roll number", "UDISE+ PEN", "Repeating this class", "Why this should change"]) expect(screen.queryByLabelText(label)).toBeNull();
    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    // The three that are never the family's to ask about keep the note that says whose they are.
    expect(screen.getByLabelText("Roll number: 12. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Repeating this class: No. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("UDISE+ PEN: —. Only the school admin enters a pupil\u2019s PEN.")).toBeTruthy();
    expect(screen.getAllByText("Set by the school office.")).toHaveLength(2);
    // Required before optional: the father's name comes above the religion.
    const labels = screen.getAllByText(/^(Father's name|Religion)$/).map((n) => n.props.children);
    expect(labels).toEqual(["Father's name", "Religion"]);
    expect(screen.queryByRole("button", { name: "Save the record" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send to the office" })).toBeNull();
    expect(screen.getByText("Only the school office can change this record. If something is wrong or missing, ask for a change.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ask for a change" })).toBeTruthy();
  });

  it("a reader who may not ask has no door to asking", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, canRequest: false }), [CHANGES]: () => NONE });
    expect(await screen.findByLabelText("Father's name: ZZ Ravi")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Ask for a change" })).toBeNull();
    expect(screen.queryByText(/^Only the school office can change this record/)).toBeNull();
  });

  it("Ask for a change opens every field but the PEN, the roll number and repeating — the office's admission number and category among them — and asks why", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: () => NONE });
    await press(await screen.findByRole("button", { name: "Ask for a change" }));
    expect(screen.getByLabelText("Father's name").props.value).toBe("ZZ Ravi");
    expect(screen.getByLabelText("Father's name").props.editable).toBe(true);
    expect(screen.getByLabelText("Admission register number").props.value).toBe("");
    expect(screen.getByLabelText("Date of admission").props.accessibilityHint).toMatch(/YYYY-MM-DD$/);
    expect(screen.getByLabelText("Family\u2019s annual income (\u20b9)").props.keyboardType).toBe("number-pad");
    expect(within(screen.getByLabelText("Mother tongue")).getByRole("radio", { name: "Marathi" })).toBeChecked();
    expect(within(screen.getByLabelText("Category")).getByRole("radio", { name: "Not said" })).toBeChecked();
    expect(within(screen.getByLabelText("Gender")).getByRole("radio", { name: "Female" })).toBeTruthy();
    expect(within(screen.getByLabelText("Blood group")).getByRole("radio", { name: "B+" })).toBeTruthy();
    expect(within(screen.getByLabelText("Admitted under the RTE quota")).getByRole("radio", { name: "Yes" })).toBeTruthy();
    // Never the family's to ask about: shown as before, with nothing to type or press.
    expect(screen.getByLabelText("Roll number: 12. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Repeating this class: No. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("UDISE+ PEN: —. Only the school admin enters a pupil\u2019s PEN.")).toBeTruthy();
    for (const label of ["Roll number", "UDISE+ PEN", "Repeating this class"]) expect(screen.queryByLabelText(label)).toBeNull();
    expect(screen.getByText("Change what is wrong or fill in what is blank, and say why. The office checks it and updates the record; nothing changes until it does.")).toBeTruthy();
    expect(screen.getByLabelText("Why this should change").props.accessibilityHint).toBe("The office reads this. For example: we moved house in June.");
    expect(screen.getByLabelText("Why this should change").props.maxLength).toBe(400);
    expect(screen.queryByRole("button", { name: "Ask for a change" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Save the record" })).toBeNull();
    expect(screen.getByRole("button", { name: "Send to the office" })).toBeTruthy();
  });

  it("sends the office only what differs from the record, with the reason, for that child — then says so and reads the record again", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: asks() });
    await press(await screen.findByRole("button", { name: "Ask for a change" }));
    await fireEvent.changeText(screen.getByLabelText("Town or city"), " Nashik ");
    await fireEvent.changeText(screen.getByLabelText("Admission register number"), "GR-42");
    await fireEvent.changeText(screen.getByLabelText("Date of admission"), "2023-06-01");
    await fireEvent.press(within(screen.getByLabelText("Category")).getByRole("radio", { name: "OBC" }));
    await fireEvent.press(within(screen.getByLabelText("Gender")).getByRole("radio", { name: "Female" }));
    await fireEvent.press(within(screen.getByLabelText("Blood group")).getByRole("radio", { name: "B+" }));
    // Typed and put back as it was: not a change.
    await fireEvent.changeText(screen.getByLabelText("Father's name"), "ZZ Ravi ");
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "  We moved house in June ");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBe(ID.child);
    expect(bodyOf(posts(fetch)[0]!)).toEqual({ changes: { city: "Nashik", admissionNumber: "GR-42", admissionDate: "2023-06-01", category: "OBC", gender: "F", bloodGroup: "B+" }, reason: "We moved house in June" });
    expect(recordChangeFileSchema.safeParse(bodyOf(posts(fetch)[0]!)).success).toBe(true);
    expect(await screen.findByText("Sent to the office")).toBeTruthy();
    // Nothing was written to the record: the old endpoint is never posted to, and the form goes back to reading what the record holds.
    expect(posts(fetch, PATH)).toHaveLength(0);
    expect(await screen.findByLabelText("Town or city: Pune")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ask for a change" })).toBeTruthy();
    expect(calls(fetch, PATH).length).toBeGreaterThan(1);
  });

  it("sends nothing while nothing differs from the record, and nothing without a reason", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: asks() });
    await press(await screen.findByRole("button", { name: "Ask for a change" }));
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "ZZ why");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nothing here differs from the record.");
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "  ");
    await fireEvent.changeText(screen.getByLabelText("Town or city"), "Nashik");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    expect(await screen.findByText("Say why, in a few words.")).toBeTruthy();
    expect(screen.queryByText("Nothing here differs from the record.")).toBeNull();
    // A date that is not a day is refused under its own field.
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "ZZ why");
    await fireEvent.changeText(screen.getByLabelText("Date of admission"), "1 June");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(posts(fetch)).toHaveLength(0);
  });

  it("Cancel leaves asking and puts the form back to the record", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: asks() });
    await press(await screen.findByRole("button", { name: "Ask for a change" }));
    await fireEvent.changeText(screen.getByLabelText("Town or city"), "Nashik");
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "ZZ why");
    await press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByLabelText("Town or city: Pune")).toBeTruthy();
    expect(screen.queryByLabelText("Why this should change")).toBeNull();
    await press(screen.getByRole("button", { name: "Ask for a change" }));
    expect(screen.getByLabelText("Town or city").props.value).toBe("Pune");
    expect(screen.getByLabelText("Why this should change").props.value).toBe("");
    expect(posts(fetch)).toHaveLength(0);
  });

  it("a value typed before the codes shows as itself when read and as its own chip when asking, and gives way to a code", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, record: { ...RECORD, category: "Open", religion: "Hinduism" } }), [CHANGES]: asks() });
    expect(await screen.findByLabelText("Category: Open")).toBeTruthy();
    expect(screen.getByLabelText("Religion: Hinduism")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Ask for a change" }));
    expect(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Hinduism" })).toBeChecked();
    await fireEvent.press(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Sikh" }));
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "ZZ why");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).toEqual({ changes: { religion: "SIKH" }, reason: "ZZ why" });
  });

  it("a refused ask is an alert beside the button, and what was typed stays", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: (init, url) => (init?.method === "POST" ? refused(403, "ZZ not asked")(init, url) : NONE) });
    await press(await screen.findByRole("button", { name: "Ask for a change" }));
    await fireEvent.changeText(screen.getByLabelText("Town or city"), "Nashik");
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "ZZ why");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not asked");
    expect(screen.getByLabelText("Town or city").props.value).toBe("Nashik");
    expect(screen.getByLabelText("Why this should change").props.value).toBe("ZZ why");
  });

  it("a PEN on the account is shown locked with the office's note, asking or not", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, record: { ...RECORD, penNumber: "27250100101" } }), [CHANGES]: () => NONE });
    expect(await screen.findByText("27250100101")).toBeTruthy();
    expect(screen.getByText("Entered by the school office. A correction needs the principal and a guardian to agree.")).toBeTruthy();
    // Nothing pending and not the admin: no door to proposing.
    expect(screen.queryByText("Propose a correction to the PEN")).toBeNull();
    await press(screen.getByRole("button", { name: "Ask for a change" }));
    expect(screen.getByText("27250100101")).toBeTruthy();
    expect(screen.queryByLabelText("UDISE+ PEN")).toBeNull();
  });

  it("switching child asks for that child's record and that child's asks", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: () => NONE });
    await press(await screen.findByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
    await waitFor(() => expect(calls(fetch, CHANGES).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("with no child linked, the door is linking one", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => ({ children: [] }), [PATH]: refused(404, "ZZ no child") });
    expect(await screen.findByText("Link to your child")).toBeTruthy();
  });
});

describe("what the family has asked of the office", () => {
  it("the ask that waits is shown above the record with who asked, a line per field in words, and the reason; asking again says it replaces it", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, change: ASK }), [CHANGES]: () => ({ items: [ASK], pending: 1 }) });
    expect(await screen.findByText("Waiting for the office")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText(/^Asked by ZZ Parent on .*2026$/)).toBeTruthy();
    expect(screen.getByText("Town or city: Pune → Nashik")).toBeTruthy();
    expect(screen.getByText("Mother tongue: Marathi → Hindi")).toBeTruthy();
    expect(screen.getByText("Religion: blank → Hindu")).toBeTruthy();
    expect(screen.getByText("Reason: We moved house in June")).toBeTruthy();
    // The family takes back; it does not decide.
    expect(screen.queryByRole("button", { name: "Approve and update" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
    // One card, though the record and the list both carry the ask.
    expect(screen.getAllByTestId("record-change")).toHaveLength(1);
    await press(screen.getByRole("button", { name: "Ask for a change" }));
    expect(screen.getByText("Change what is wrong or fill in what is blank, and say why. The office checks it and updates the record; nothing changes until it does. Sending again replaces the request that is waiting.")).toBeTruthy();
  });

  it("is shown from the record's own copy while the list cannot be read", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, change: ASK }), [CHANGES]: refused(500, "ZZ no list") });
    expect(await screen.findByText("Town or city: Pune → Nashik")).toBeTruthy();
  });

  it("Take it back posts to the ask's withdraw path, says so and reads the list again", async () => {
    let taken = false;
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: () => ({ ...VIEW, change: taken ? null : ASK }),
      [CHANGES]: () => (taken ? { items: [{ ...ASK, status: "WITHDRAWN", can: { decide: false, withdraw: false } }], pending: 0 } : { items: [ASK], pending: 1 }),
      [WITHDRAW]: () => {
        taken = true;
        return { ...ASK, status: "WITHDRAWN", can: { decide: false, withdraw: false } };
      },
    });
    await press(await screen.findByRole("button", { name: "Take it back" }));
    await waitFor(() => expect(posts(fetch, WITHDRAW)).toHaveLength(1));
    expect(bodyOf(posts(fetch, WITHDRAW)[0]!)).toEqual({});
    expect(await screen.findByText("Request taken back")).toBeTruthy();
    expect(await screen.findByText("Taken back")).toBeTruthy();
    expect(screen.getByText("Earlier requests")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Take it back" })).toBeNull();
  });

  it("a refused taking back is an alert on the card", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, change: ASK }), [CHANGES]: () => ({ items: [ASK], pending: 1 }), [WITHDRAW]: refused(404, "ZZ gone") });
    await press(await screen.findByRole("button", { name: "Take it back" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ gone");
  });

  it("a declined one carries the office's sentence, an updated one and one the pupil asked for stand beside it, and five at most are shown", async () => {
    const earlier = (n: number, extra: object) => ({ ...ASK, id: `rc${n}`, can: { decide: false, withdraw: false }, ...extra });
    const items = [
      earlier(2, { status: "DECLINED", declineReason: "The register says Pune", decidedByName: "ZZ Admin", decidedAt: "2026-09-21T05:00:00.000Z", changes: [{ field: "city", from: "Pune", to: "Nashik" }] }),
      earlier(3, { status: "APPLIED", byPupil: true, requestedByName: "ZZ Asha", changes: [{ field: "bpl", from: "no", to: "yes" }] }),
      earlier(4, { status: "WITHDRAWN", changes: [{ field: "gender", from: "M", to: "" }] }),
      earlier(5, { status: "APPLIED", changes: [{ field: "cwsnType", from: "NONE", to: "9" }] }),
      earlier(6, { status: "APPLIED", changes: [{ field: "category", from: "Open", to: "OBC" }] }),
      earlier(7, { status: "APPLIED", changes: [{ field: "caste", from: null, to: "ZZ sixth" }] }),
    ];
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW, [CHANGES]: () => ({ items, pending: 0 }) });
    expect(await screen.findByText("Earlier requests")).toBeTruthy();
    expect(screen.queryByText("Waiting for the office")).toBeNull();
    expect(screen.getByText("Declined")).toBeTruthy();
    expect(screen.getByText("The office said: The register says Pune")).toBeTruthy();
    expect(screen.getByText(/^Asked by the pupil, ZZ Asha, on .*2026$/)).toBeTruthy();
    expect(screen.getByText("Below-poverty-line card: No → Yes")).toBeTruthy();
    expect(screen.getByText("Gender: Male → blank")).toBeTruthy();
    expect(screen.getByText("Disability, if any: No impairment → 9 — Autism spectrum disorder")).toBeTruthy();
    expect(screen.getByText("Category: Open → OBC")).toBeTruthy();
    expect(screen.getAllByText("Updated")).toHaveLength(3);
    expect(screen.getAllByTestId("record-change")).toHaveLength(5);
    expect(screen.queryByText(/ZZ sixth/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Take it back" })).toBeNull();
  });
});

const PEN_CHANGE = { id: "pc1", studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", fromPen: "27250100101", toPen: "27250100102", reason: "Two digits swapped", status: "PENDING", requestedByName: "ZZ Admin", principal: { decided: true, approved: true, by: "ZZ Head" }, guardian: { decided: false, approved: null, by: null, waived: false }, decisionReason: null, can: { decide: true, withdraw: false }, createdAt: "2026-09-20T05:00:00.000Z", appliedAt: null };
const DECIDE = "/api/v1/family/pen-changes/pc1/decide";
const PENDING_VIEW = { ...VIEW, record: { ...RECORD, penNumber: "27250100101" }, penChange: PEN_CHANGE };

describe("a correction to the child's PEN", () => {
  it("is shown with what would change, the head's word and the guardian's turn, and Approve posts the guardian's yes", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => PENDING_VIEW, [DECIDE]: () => ({ ...PEN_CHANGE, guardian: { decided: true, approved: true, by: "ZZ Parent", waived: false }, status: "APPLIED", can: { decide: false, withdraw: false } }) });
    expect(await screen.findByText("PEN correction awaiting approval")).toBeTruthy();
    expect(screen.getByText("From 27250100101 to 27250100102")).toBeTruthy();
    expect(screen.getByText("Proposed by ZZ Admin · Reason: Two digits swapped")).toBeTruthy();
    expect(screen.getByText("Approved by ZZ Head")).toBeTruthy();
    expect(screen.getByText("Waiting")).toBeTruthy();
    expect(screen.getByText("Awaiting approval")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(calls(fetch, DECIDE)).toHaveLength(1));
    expect(bodyOf(calls(fetch, DECIDE)[0]!)).toEqual({ approve: true });
    expect(await screen.findByText("Your decision is recorded.")).toBeTruthy();
  });

  it("Reject asks why and confirms before posting the guardian's no with the reason", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => PENDING_VIEW, [DECIDE]: () => ({ ...PEN_CHANGE, guardian: { decided: true, approved: false, by: "ZZ Parent", waived: false }, status: "REJECTED", decisionReason: "The portal shows the old one", can: { decide: false, withdraw: false } }) });
    await press(await screen.findByRole("button", { name: "Reject" }));
    expect(calls(fetch, DECIDE)).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Why not"), "The portal shows the old one");
    // The question names the change; the danger button carries the word again.
    expect(screen.getAllByText("From 27250100101 to 27250100102")).toHaveLength(2);
    await press(screen.getAllByRole("button", { name: "Reject" }).at(-1)!);
    await waitFor(() => expect(calls(fetch, DECIDE)).toHaveLength(1));
    expect(bodyOf(calls(fetch, DECIDE)[0]!)).toEqual({ approve: false, reason: "The portal shows the old one" });
    expect(await screen.findByText("Your decision is recorded.")).toBeTruthy();
  });

  it("once the guardian has spoken, or the pupil is not theirs to decide for, there are no buttons", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...PENDING_VIEW, penChange: { ...PEN_CHANGE, guardian: { decided: true, approved: true, by: "ZZ Parent", waived: false }, can: { decide: false, withdraw: false } } }) });
    expect(await screen.findByText("Approved by ZZ Parent")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Withdraw" })).toBeNull();
  });
});

describe("the pupil record for the pupil", () => {
  const MINE = { ...VIEW, studentMembershipId: "m-pupil", studentName: "ZZ Pupil" };

  it("is their own to read, with no child to choose, and their ask goes without a child", async () => {
    const { fetch } = await renderFamily(compose(), ME_STUDENT, { [PATH]: () => MINE, [CHANGES]: asks(() => ({ ...ASK, studentMembershipId: "m-pupil", studentName: "ZZ Pupil", byPupil: true, requestedByName: "ZZ Pupil" })) });
    expect(await screen.findByText("Your school issues your certificates from these details. Only the office can change them; if something is wrong or blank, ask for a change.")).toBeTruthy();
    expect(calls(fetch, CHILDREN_PATH)).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Save the record" })).toBeNull();
    await press(screen.getByRole("button", { name: "Ask for a change" }));
    await fireEvent.changeText(screen.getByLabelText("Home address"), "2 ZZ Lane");
    await fireEvent.changeText(screen.getByLabelText("Why this should change"), "ZZ we moved");
    await press(screen.getByRole("button", { name: "Send to the office" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).toEqual({ changes: { addressLine: "2 ZZ Lane" }, reason: "ZZ we moved" });
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBeNull();
    expect(calls(fetch, PATH).every((c) => c.url.searchParams.get("childId") === null)).toBe(true);
    expect(calls(fetch, CHANGES).every((c) => c.url.searchParams.get("childId") === null)).toBe(true);
  });

  it("takes back their own ask", async () => {
    const mine = { ...ASK, studentMembershipId: "m-pupil", studentName: "ZZ Pupil", byPupil: true, requestedByName: "ZZ Pupil" };
    const { fetch } = await renderFamily(compose(), ME_STUDENT, { [PATH]: () => ({ ...MINE, change: mine }), [CHANGES]: () => ({ items: [mine], pending: 1 }), [WITHDRAW]: () => ({ ...mine, status: "WITHDRAWN", can: { decide: false, withdraw: false } }) });
    expect(await screen.findByText(/^Asked by the pupil, ZZ Pupil, on .*2026$/)).toBeTruthy();
    await press(screen.getByRole("button", { name: "Take it back" }));
    await waitFor(() => expect(posts(fetch, WITHDRAW)).toHaveLength(1));
    expect(await screen.findByText("Request taken back")).toBeTruthy();
  });
});

describe("the identity card from the record screen (5 Oct 2026)", () => {
  const pdf = () => new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { status: 200, headers: { "content-type": "application/pdf" } });

  it("shares a student's own card, asked without naming anyone", async () => {
    (Sharing.shareAsync as jest.Mock).mockClear();
    const { calls: seen } = await mountStaff(<IdCardButton studentMembershipId={null} />, "STUDENT", { "GET /api/v1/id-cards/pdf": () => pdf() });
    fireEvent.press(screen.getByRole("button", { name: "Identity card (PDF)" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/id-card\.pdf$/), expect.objectContaining({ mimeType: "application/pdf" })));
    expect(seen().map((c) => c.line)).toContain("GET /api/v1/id-cards/pdf");
  });

  it("asks for the chosen child's card, and shows an adult's refusal as the server says it", async () => {
    const { calls: seen } = await mountStaff(<IdCardButton studentMembershipId="m-adult" />, "PARENT", { "GET /api/v1/id-cards/pdf": () => json({ error: "ZZ They have not shared this with you.", code: "FORBIDDEN" }, 403) }, { me: { ...me("PARENT"), active: { schoolId: null, role: "PARENT", membershipId: null } } });
    fireEvent.press(screen.getByRole("button", { name: "Identity card (PDF)" }));
    expect(await screen.findByText("ZZ They have not shared this with you.")).toBeTruthy();
    expect(seen().map((c) => c.line)).toContain("GET /api/v1/id-cards/pdf?student=m-adult");
  });
});
