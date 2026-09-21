import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyRecord } from "@/screens/family/record";
import { bodyFrom, formFrom, OPTIONAL_FIELDS, REQUIRED_FIELDS } from "@/screens/shared/pupil-record";

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
  requestedAt: "2026-09-01T05:00:00.000Z",
  familyFilledAt: null,
  updatedAt: "2026-09-10T05:00:00.000Z",
};
const VIEW = { studentMembershipId: ID.child, studentName: "ZZ Asha", className: "ZZ 5A", studentCode: "ZZ-001", birthdate: "2016-03-14", record: RECORD, missing: ["admissionNumber", "admissionDate"], complete: false, canEdit: true };
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
    expect(Object.keys(body).sort()).toEqual([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].sort());
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
    expect(screen.getByText("2 missing")).toBeTruthy();
    expect(screen.getByLabelText(/^Date of birth: .*2016\. Recorded by the school/)).toBeTruthy();
    expect(screen.getByText("Recorded by the school; ask the office to correct it.")).toBeTruthy();
    expect(screen.getByLabelText("Father's name").props.value).toBe("ZZ Ravi");
    expect(screen.getByLabelText("Mother tongue").props.value).toBe("Marathi");
    expect(screen.getByLabelText("Admission register number").props.value).toBe("");
    expect(screen.getByLabelText("Religion").props.value).toBe("");
    expect(screen.getByLabelText("UDISE+ PEN").props.accessibilityHint).toMatch(/^Optional · /);
    // Required before optional: the father's name comes above the religion.
    const labels = screen.getAllByText(/^(Father's name|Religion)$/).map((n) => n.props.children);
    expect(labels).toEqual(["Father's name", "Religion"]);
    expect(screen.getByText("The school needs these details to issue certificates for your child — a bonafide, a transfer certificate — without asking you again. Fill in what you know; leave the rest blank.")).toBeTruthy();
  });

  it("saves the whole record for that child, then says it is saved and reads back what still blocks", async () => {
    const { fetch } = await renderFamily(compose(), ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init) => (init?.method === "POST" ? { ...VIEW, record: { ...RECORD, admissionNumber: "GR-42", admissionDate: "2023-06-01" }, missing: [], complete: true } : VIEW),
    });
    await fireEvent.changeText(await screen.findByLabelText("Admission register number"), "GR-42");
    await fireEvent.changeText(screen.getByLabelText("Date of admission"), "2023-06-01");
    await fireEvent.changeText(screen.getByLabelText("Religion"), "");
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
      religion: "",
      caste: "",
      category: "",
      postalCode: "411001",
      admittedToGrade: "",
      previousSchool: "",
      penNumber: "",
    });
    expect(await screen.findByText("Record saved.")).toBeTruthy();
    expect(screen.getByText("Complete")).toBeTruthy();
    expect(screen.queryByText(/^Still blank/)).toBeNull();
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
