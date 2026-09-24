import { FAMILY_RECORD_FIELDS } from "@edulink/contracts";
import { fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyRecord } from "@/screens/family/record";
import { bodyFrom, CATEGORY_VALUES, FILING_FIELDS, formFrom, OPTIONAL_FIELDS, RELIGION_VALUES, REQUIRED_FIELDS } from "@/screens/shared/pupil-record";

const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const RECORD = {
  fatherName: "ZZ Ravi",
  motherName: "ZZ Meera",
  placeOfBirth: "Pune",
  nationality: "Indian",
  religion: null,
  caste: null,
  category: null,
  motherTongue: "Marathi",
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
  rollNumber: "12",
  requestedAt: "2026-09-01T05:00:00.000Z",
  familyFilledAt: null,
  updatedAt: "2026-09-10T05:00:00.000Z",
};
const VIEW = { studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", studentCode: "ZZ-001", birthdate: "2016-03-14", record: RECORD, missing: ["admissionNumber", "admissionDate"], missingForFiling: ["gender", "bpl"], complete: false, canEdit: true, penEditable: false, penChange: null };
const PATH = "/api/v1/family/record";
const CHILDREN_PATH = "/api/v1/family/children";

const posts = (fetch: jest.Mock) => calls(fetch, PATH).filter((c) => c.init?.method === "POST");
const compose = () => (
  <ToastProvider>
    <FamilyRecord />
  </ToastProvider>
);

describe("the helpers behind the record", () => {
  it("start from the record as stored, or blank, and send every field trimmed with a blank date as null", () => {
    expect(formFrom(null).fatherName).toBe("");
    expect(formFrom(RECORD).motherTongue).toBe("Marathi");
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
    expect(OPTIONAL_FIELDS).toEqual(["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber", "rollNumber", "fatherOccupation", "motherOccupation", "annualIncome"]);
    expect(CATEGORY_VALUES).toEqual(["GENERAL", "SC", "ST", "OBC", "VJ", "NT", "SBC"]);
    expect(RELIGION_VALUES).toEqual(["HINDU", "MUSLIM", "CHRISTIAN", "SIKH", "BUDDHIST", "PARSI", "JAIN", "OTHER"]);
  });
});

describe("the pupil record for the guardian", () => {
  it("is loading while the record is on its way", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows every field with the date of birth read-only, the required ones first, and what is still blank", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW });
    expect(await screen.findByText("Still blank: Admission register number, Date of admission")).toBeTruthy();
    expect(screen.getByText("Still blank for the UDISE+ filing: Gender, Below-poverty-line card")).toBeTruthy();
    expect(screen.getByText("2 missing")).toBeTruthy();
    expect(screen.getByLabelText(/^Date of birth: .*2016\. Recorded by the school/)).toBeTruthy();
    expect(screen.getByText("Recorded by the school; ask the office to correct it.")).toBeTruthy();
    expect(screen.getByLabelText("Father's name").props.value).toBe("ZZ Ravi");
    expect(screen.getByLabelText("Mother tongue").props.value).toBe("Marathi");
    // The office's fields — the admission number and date, the grade, the last school's TC, the category and caste, the filing codes — the family reads under the office's note and cannot type.
    expect(screen.getByLabelText("Admission register number: —. Set by the school office.")).toBeTruthy();
    expect(screen.queryByLabelText("Admission register number")).toBeNull();
    expect(screen.getByLabelText("Date of admission: —. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Category: —. Set by the school office.")).toBeTruthy();
    expect(screen.queryByLabelText("Category")).toBeNull();
    expect(screen.getByLabelText("Transfer certificate number (last school): —. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Gender: —. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Below-poverty-line card: —. Set by the school office.")).toBeTruthy();
    // Religion is the family's: a coded choice, nothing stored leaving "Not said" checked.
    expect(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Not said" }).props.accessibilityState.checked).toBe(true);
    // The household, as the RTE and EWS verifications ask for it, is the family's to type.
    expect(screen.getByLabelText("Father\u2019s occupation").props.value).toBe("");
    expect(screen.getByLabelText("Mother\u2019s occupation")).toBeTruthy();
    expect(screen.getByLabelText("Family\u2019s annual income (\u20b9)").props.keyboardType).toBe("number-pad");
    // The roll number is the office's: the family reads it with the office's note and cannot type it.
    expect(screen.getByLabelText("Roll number: 12. Set by the school office.")).toBeTruthy();
    expect(screen.queryByLabelText("Roll number")).toBeNull();
    // The PEN is the office's to enter: the family reads it and never types it.
    expect(screen.getByLabelText("UDISE+ PEN: —. Only the school admin enters a pupil\u2019s PEN.")).toBeTruthy();
    expect(screen.queryByLabelText("UDISE+ PEN")).toBeNull();
    // Required before optional: the father's name comes above the religion.
    const labels = screen.getAllByText(/^(Father's name|Religion)$/).map((n) => n.props.children);
    expect(labels).toEqual(["Father's name", "Religion"]);
    expect(screen.getByText("The school needs these details to issue certificates for your child — a bonafide, a transfer certificate — without asking you again. Fill in what you know; leave the rest blank.")).toBeTruthy();
  });

  it("saves the family's fields for that child — never the office's — then says it is saved and reads back what still blocks", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init) => (init?.method === "POST" ? { ...VIEW, record: { ...RECORD, admissionNumber: "GR-42", admissionDate: "2023-06-01" }, missing: [], missingForFiling: [], complete: true } : VIEW),
    });
    await fireEvent.press(within(await screen.findByLabelText("Religion")).getByRole("radio", { name: "Hindu" }));
    await fireEvent.changeText(screen.getByLabelText("Last school attended"), "ZZ Sunrise Nursery");
    await fireEvent.changeText(screen.getByLabelText("Father\u2019s occupation"), "Farmer");
    await fireEvent.changeText(screen.getByLabelText("Family\u2019s annual income (\u20b9)"), "240000");
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBe(ID.child);
    // Exactly FAMILY_RECORD_FIELDS: the admission number, the category, the TC, the filing codes and the roll number are not in the body at all.
    expect(bodyOf(posts(fetch)[0]!)).toEqual({
      fatherName: "ZZ Ravi",
      motherName: "ZZ Meera",
      placeOfBirth: "Pune",
      nationality: "Indian",
      motherTongue: "Marathi",
      addressLine: "1 ZZ Road",
      city: "Pune",
      religion: "HINDU",
      postalCode: "411001",
      previousSchool: "ZZ Sunrise Nursery",
      nameLocal: "",
      fatherNameLocal: "",
      motherNameLocal: "",
      bloodGroup: "",
      fatherOccupation: "Farmer",
      motherOccupation: "",
      annualIncome: "240000",
    });
    expect(Object.keys(bodyOf(posts(fetch)[0]!) as object).sort()).toEqual([...FAMILY_RECORD_FIELDS].sort());
    expect(await screen.findByText("Record saved.")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
    expect(screen.queryByText(/^Still blank/)).toBeNull();
  });

  it("the filing section: the family types the name in the school's script and the blood group; the gender, BPL, EWS and impairment codes are the office's, shown as the words the office picked", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init) => (init?.method === "POST" ? { ...VIEW, record: { ...RECORD, gender: "F", bpl: "yes", nameLocal: "ZZ आशा", cwsnType: "9", bloodGroup: "B+" }, missingForFiling: [] } : { ...VIEW, record: { ...RECORD, gender: "F", cwsnType: "9", category: "OBC" } }),
    });
    expect(await screen.findByText("For the UDISE+ and board filings")).toBeTruthy();
    expect(screen.getByLabelText("Name in the school\u2019s script").props.accessibilityHint).toMatch(/^Optional · The state board prints/);
    // The office's codes read as their words, under the office's note, with nothing to press.
    expect(screen.getByLabelText("Gender: Female. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Disability, if any: 9 — Autism spectrum disorder. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Category: OBC. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Economically weaker section or disadvantaged group: —. Set by the school office.")).toBeTruthy();
    expect(screen.queryByLabelText("Gender")).toBeNull();
    expect(screen.queryByLabelText("Below-poverty-line card")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Name in the school\u2019s script"), "ZZ आशा");
    await fireEvent.press(within(screen.getByLabelText("Blood group")).getByRole("radio", { name: "B+" }));
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    const body = bodyOf(posts(fetch)[0]!);
    expect(body).toMatchObject({ nameLocal: "ZZ आशा", fatherNameLocal: "", motherNameLocal: "", bloodGroup: "B+" });
    for (const office of ["gender", "bpl", "ews", "cwsnType", "category", "caste", "admissionNumber", "admissionDate", "admittedToGrade", "previousSchoolTcNumber", "previousSchoolTcDate", "rollNumber", "penNumber"]) expect(body).not.toHaveProperty(office);
    expect(await screen.findByText("Record saved.")).toBeTruthy();
    expect(screen.queryByText(/^Still blank for the UDISE\+ filing/)).toBeNull();
  });

  it("a PEN on the account is shown locked with the office's note, and is not sent back with the record", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, record: { ...RECORD, penNumber: "27250100101" } }) });
    expect(await screen.findByText("27250100101")).toBeTruthy();
    expect(screen.getByText("Entered by the school office. A correction needs the principal and a guardian to agree.")).toBeTruthy();
    expect(screen.queryByLabelText("UDISE+ PEN")).toBeNull();
    // Nothing pending and not the admin: no door to proposing.
    expect(screen.queryByText("Propose a correction to the PEN")).toBeNull();
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).not.toHaveProperty("penNumber");
  });

  it("a religion typed before the codes shows as its own chip, goes back only as it is, and gives way to a code; a category typed before them reads as typed under the office's note", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: (init) => (init?.method === "POST" ? VIEW : { ...VIEW, record: { ...RECORD, category: "Open", religion: "Hinduism" } }) });
    expect(await screen.findByLabelText("Category: Open. Set by the school office.")).toBeTruthy();
    expect(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Hinduism" }).props.accessibilityState.checked).toBe(true);
    await fireEvent.press(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Sikh" }));
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).toMatchObject({ religion: "SIKH" });
    expect(bodyOf(posts(fetch)[0]!)).not.toHaveProperty("category");
  });

  it("the two dates — admission and the last school's TC — are the office's: the family reads them as stored and has nowhere to type one", async () => {
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...VIEW, record: { ...RECORD, admissionDate: "2023-06-01", previousSchoolTcDate: "2022-04-30" } }) });
    expect(await screen.findByLabelText("Date of admission: 2023-06-01. Set by the school office.")).toBeTruthy();
    expect(screen.getByLabelText("Transfer certificate date: 2022-04-30. Set by the school office.")).toBeTruthy();
    expect(screen.queryByLabelText("Date of admission")).toBeNull();
    expect(screen.queryByLabelText("Transfer certificate date")).toBeNull();
  });

  it("switching child asks for that child's record", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW });
    await press(await screen.findByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
  });

  it("a refused save is an alert above the fields, which stay", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init, url) => (init?.method === "POST" ? refused(422, "ZZ not saved")(init, url) : VIEW),
    });
    await press(await screen.findByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not saved");
    expect(screen.getByRole("button", { name: "Save the record" })).toBeTruthy();
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

const CHANGE = { id: "pc1", studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", fromPen: "27250100101", toPen: "27250100102", reason: "Two digits swapped", status: "PENDING", requestedByName: "ZZ Admin", principal: { decided: true, approved: true, by: "ZZ Head" }, guardian: { decided: false, approved: null, by: null, waived: false }, decisionReason: null, can: { decide: true, withdraw: false }, createdAt: "2026-09-20T05:00:00.000Z", appliedAt: null };
const DECIDE = "/api/v1/family/pen-changes/pc1/decide";
const PENDING_VIEW = { ...VIEW, record: { ...RECORD, penNumber: "27250100101" }, penChange: CHANGE };

describe("a correction to the child's PEN", () => {
  it("is shown with what would change, the head's word and the guardian's turn, and Approve posts the guardian's yes", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => PENDING_VIEW, [DECIDE]: () => ({ ...CHANGE, guardian: { decided: true, approved: true, by: "ZZ Parent", waived: false }, status: "APPLIED", can: { decide: false, withdraw: false } }) });
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
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => PENDING_VIEW, [DECIDE]: () => ({ ...CHANGE, guardian: { decided: true, approved: false, by: "ZZ Parent", waived: false }, status: "REJECTED", decisionReason: "The portal shows the old one", can: { decide: false, withdraw: false } }) });
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
    await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...PENDING_VIEW, penChange: { ...CHANGE, guardian: { decided: true, approved: true, by: "ZZ Parent", waived: false }, can: { decide: false, withdraw: false } } }) });
    expect(await screen.findByText("Approved by ZZ Parent")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Withdraw" })).toBeNull();
  });
});

describe("the pupil record for the pupil", () => {
  it("is their own, with no child to choose, and posts without a child", async () => {
    const { fetch } = await renderFamily(compose(), ME_STUDENT, { [PATH]: (init) => (init?.method === "POST" ? { ...VIEW, studentMembershipId: "m-pupil", studentName: "ZZ Pupil" } : { ...VIEW, studentMembershipId: "m-pupil", studentName: "ZZ Pupil" }) });
    expect(await screen.findByText("Your school needs these details for the certificates it issues you. Fill in what you know; your family or the office can complete the rest.")).toBeTruthy();
    expect(calls(fetch, CHILDREN_PATH)).toHaveLength(0);
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBeNull();
    expect(calls(fetch, PATH).every((c) => c.url.searchParams.get("childId") === null)).toBe(true);
  });
});
