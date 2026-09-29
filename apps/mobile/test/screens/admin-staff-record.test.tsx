import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { staffRecordViewSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { CHOICES, StaffRecord, staffBodyFrom, staffFormFrom } from "@/screens/staff/staff-record";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: { membershipId: "m2" } as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/admin/people/m2/staff-record";
const RECORD = {
  staffNumber: "ZZ-T-01", designation: "Senior teacher", qualification: "MSc", joinedOnKey: "2020-06-01", birthdateKey: "1988-04-02", serviceJoinedOnKey: "2015-06-15",
  leaveDaysPerYear: 12, gender: "F", socialCategory: "OBC", academicQualification: "5", professionalQualification: "3", appointmentType: "REGULAR", appointedSubject: "MATHEMATICS",
};
const BLANK = Object.fromEntries(Object.keys(RECORD).map((k) => [k, null]));
const VIEW = staffRecordViewSchema.parse({ membershipId: "m2", name: "ZZ Teacher", role: "TEACHER", canEdit: true, record: RECORD });

const mount = (role: "ADMIN" | "PRINCIPAL", answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <StaffRecord />
    </ToastProvider>,
    role,
    answers,
  );

describe("the helpers behind the staff record", () => {
  it("the form is the record as words, and the body is the whole record with every blank a null", () => {
    expect(staffFormFrom(VIEW.record)).toMatchObject({ staffNumber: "ZZ-T-01", leaveDaysPerYear: "12", appointedSubject: "MATHEMATICS" });
    expect(staffBodyFrom(staffFormFrom(VIEW.record))).toEqual(RECORD);
    const blank = staffBodyFrom(staffFormFrom(staffRecordViewSchema.parse({ ...VIEW, record: BLANK }).record));
    expect(Object.keys(blank).sort()).toEqual(Object.keys(RECORD).sort());
    expect(Object.values(blank).every((v) => v === null)).toBe(true);
    expect(staffBodyFrom({ ...staffFormFrom(VIEW.record), designation: "  ", leaveDaysPerYear: "" })).toMatchObject({ designation: null, leaveDaysPerYear: null });
  });

  it("offers the portal's own codes: twenty-six subjects, three kinds of appointment", () => {
    expect(CHOICES.appointedSubject).toHaveLength(26);
    expect(CHOICES.appointmentType.map((c) => c.value)).toEqual(["REGULAR", "CONTRACT", "PART_TIME"]);
    expect(CHOICES.professionalQualification.map((c) => c.value)).not.toContain("9");
  });
});

describe("a member of staff's record, for the office", () => {
  it("loads, then shows the record with the coded answers chosen", async () => {
    const gate = gated();
    await mount("ADMIN", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(VIEW));
    expect(await screen.findByText("Staff record for ZZ Teacher")).toBeTruthy();
    expect(screen.getByLabelText("Designation")).toHaveDisplayValue("Senior teacher");
    expect(screen.getByLabelText("Joined the school on")).toHaveDisplayValue("2020-06-01");
    expect(screen.getByRole("radio", { name: "Mathematics" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Regular" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("saves the whole record, with what was changed and every other field as it stood, and says so", async () => {
    const { calls } = await mount("ADMIN", { [`GET ${PATH}`]: () => json(VIEW), [`POST ${PATH}`]: () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("Designation"), "Head of mathematics");
    await fireEvent.press(screen.getByRole("radio", { name: "Physics" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ ...RECORD, designation: "Head of mathematics", appointedSubject: "PHYSICS" }));
    expect(await screen.findByText("Staff record saved")).toBeTruthy();
  });

  it("a date that is not one, or more leave than a year holds, is caught before anything is sent", async () => {
    const { calls } = await mount("ADMIN", { [`GET ${PATH}`]: () => json(VIEW) });
    await fireEvent.changeText(await screen.findByLabelText("Joined the school on"), "01/06/2020");
    await fireEvent.changeText(screen.getByLabelText("Leave days a year"), "400");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("That is not a real date.")).toBeTruthy();
    expect(screen.getByText("Leave days must be a whole number up to 365.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("a refusal from the server stays above the button, and what was typed stays", async () => {
    await mount("ADMIN", { [`GET ${PATH}`]: () => json(VIEW), [`POST ${PATH}`]: () => json({ error: "That date is in the future.", code: "BAD_REQUEST" }, 422) });
    await fireEvent.changeText(await screen.findByLabelText("Designation"), "Head of mathematics");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That date is in the future.");
    expect(screen.getByLabelText("Designation")).toHaveDisplayValue("Head of mathematics");
  });

  it("the head reads the same record with nothing to press", async () => {
    await mount("PRINCIPAL", { [`GET ${PATH}`]: () => json({ ...VIEW, canEdit: false }) });
    expect(await screen.findByText("The office keeps these records; this page only reads them.")).toBeTruthy();
    expect(screen.getByLabelText("Designation")).toHaveDisplayValue("Senior teacher");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("a refused record is an alert with a retry", async () => {
    const { calls } = await mount("ADMIN", { [`GET ${PATH}`]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });
});
