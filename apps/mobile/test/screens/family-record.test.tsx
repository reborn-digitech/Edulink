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
    expect(screen.getByLabelText("Admission register number").props.value).toBe("");
    // Religion and category are coded choices; nothing stored leaves "Not said" checked.
    expect(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Not said" }).props.accessibilityState.checked).toBe(true);
    expect(within(screen.getByLabelText("Category")).getByRole("radio", { name: "OBC" })).toBeTruthy();
    expect(screen.getByText("As on the admission form. VJ, NT and SBC file with UDISE+ as OBC.")).toBeTruthy();
    // The collection gaps the audit named, each with its label and hint.
    expect(screen.getByLabelText("Transfer certificate number (last school)").props.accessibilityHint).toBe("Optional · From the TC the last school issued; the admission register records it.");
    expect(screen.getByLabelText("Transfer certificate date").props.accessibilityHint).toBe("Optional · YYYY-MM-DD");
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

  it("saves the whole record for that child, then says it is saved and reads back what still blocks", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init) => (init?.method === "POST" ? { ...VIEW, record: { ...RECORD, admissionNumber: "GR-42", admissionDate: "2023-06-01" }, missing: [], missingForFiling: [], complete: true } : VIEW),
    });
    await fireEvent.changeText(await screen.findByLabelText("Admission register number"), "GR-42");
    await fireEvent.changeText(screen.getByLabelText("Date of admission"), "2023-06-01");
    await fireEvent.press(within(screen.getByLabelText("Category")).getByRole("radio", { name: "OBC" }));
    await fireEvent.press(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Hindu" }));
    await fireEvent.changeText(screen.getByLabelText("Transfer certificate number (last school)"), "TC/2022/17");
    await fireEvent.changeText(screen.getByLabelText("Transfer certificate date"), "2022-04-30");
    await fireEvent.changeText(screen.getByLabelText("Father\u2019s occupation"), "Farmer");
    await fireEvent.changeText(screen.getByLabelText("Family\u2019s annual income (\u20b9)"), "240000");
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(posts(fetch)[0]!.url.searchParams.get("childId")).toBe(ID.child);
    expect(bodyOf(posts(fetch)[0]!)).toEqual({
      fatherName: "ZZ Ravi",
      motherName: "ZZ Meera",
      placeOfBirth: "Pune",
      nationality: "Indian",
      motherTongue: "Marathi",
      addressLine: "1 ZZ Road",
      city: "Pune",
      admissionNumber: "GR-42",
      admissionDate: "2023-06-01",
      religion: "HINDU",
      caste: "",
      category: "OBC",
      postalCode: "411001",
      admittedToGrade: "",
      previousSchool: "",
      gender: "",
      nameLocal: "",
      fatherNameLocal: "",
      motherNameLocal: "",
      bpl: "",
      ews: "",
      cwsnType: "",
      bloodGroup: "",
      previousSchoolTcNumber: "TC/2022/17",
      previousSchoolTcDate: "2022-04-30",
      fatherOccupation: "Farmer",
      motherOccupation: "",
      annualIncome: "240000",
    });
    expect(await screen.findByText("Record saved.")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
    expect(screen.queryByText(/^Still blank/)).toBeNull();
  });

  it("the filing section sends the portal's codes: gender, the name in the school's script, BPL, the impairment type and the blood group", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init) => (init?.method === "POST" ? { ...VIEW, record: { ...RECORD, gender: "F", bpl: "yes", nameLocal: "ZZ आशा", cwsnType: "9", bloodGroup: "B+" }, missingForFiling: [] } : VIEW),
    });
    expect(await screen.findByText("For the UDISE+ and board filings")).toBeTruthy();
    expect(screen.getByLabelText("Name in the school\u2019s script").props.accessibilityHint).toMatch(/^Optional · The state board prints/);
    await fireEvent.press(within(screen.getByLabelText("Gender")).getByRole("radio", { name: "Female" }));
    await fireEvent.changeText(screen.getByLabelText("Name in the school\u2019s script"), "ZZ आशा");
    await fireEvent.press(within(screen.getByLabelText("Below-poverty-line card")).getByRole("radio", { name: "Yes" }));
    await fireEvent.press(within(screen.getByLabelText("Disability, if any")).getByRole("radio", { name: "9 — Autism spectrum disorder" }));
    await fireEvent.press(within(screen.getByLabelText("Blood group")).getByRole("radio", { name: "B+" }));
    // The section's "Not said" stays on the section not touched.
    expect(within(screen.getByLabelText("Economically weaker section or disadvantaged group")).getByRole("radio", { name: "Not said" }).props.accessibilityState.checked).toBe(true);
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).toMatchObject({ gender: "F", nameLocal: "ZZ आशा", fatherNameLocal: "", motherNameLocal: "", bpl: "yes", ews: "", cwsnType: "9", bloodGroup: "B+" });
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

  it("a category or religion typed before the codes shows as its own chip, goes back only as it is, and gives way to a code", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: (init) => (init?.method === "POST" ? VIEW : { ...VIEW, record: { ...RECORD, category: "Open", religion: "Hinduism" } }) });
    const category = within(await screen.findByLabelText("Category"));
    expect(category.getByRole("radio", { name: "Open" }).props.accessibilityState.checked).toBe(true);
    expect(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Hinduism" }).props.accessibilityState.checked).toBe(true);
    await fireEvent.press(within(screen.getByLabelText("Religion")).getByRole("radio", { name: "Sikh" }));
    await press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).toMatchObject({ category: "Open", religion: "SIKH" });
  });

  it("a transfer certificate date that is not a day is refused before anything is sent", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW });
    await fireEvent.changeText(await screen.findByLabelText("Transfer certificate date"), "April 2022");
    await press(screen.getByRole("button", { name: "Save the record" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(posts(fetch)).toHaveLength(0);
  });

  it("a date of admission that is not a day is refused before anything is sent", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => VIEW });
    await fireEvent.changeText(await screen.findByLabelText("Date of admission"), "June 2023");
    await press(screen.getByRole("button", { name: "Save the record" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(posts(fetch)).toHaveLength(0);
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
