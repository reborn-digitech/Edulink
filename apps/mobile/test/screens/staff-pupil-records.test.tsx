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

  it("the toggle asks for every pupil, where a complete record says when the family filled it", async () => {
    const { calls } = await mountStaff(compose(), "PRINCIPAL", answers());
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("tab", { name: "All pupils (3)" }));
    expect(await screen.findByText("ZZ Chirag")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByText(/^ZZ 5A · Filled by the family .*2026$/)).toBeTruthy();
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
    ["on a roll elsewhere, with no door", { pen: PEN, found: "ELSEWHERE_ACTIVE", pupil: null }, /^That PEN belongs to a pupil on the roll at another school on Relay\./, false],
    ["left elsewhere, with no door", { pen: PEN, found: "ELSEWHERE_LEFT", pupil: null }, /^That PEN belongs to a pupil who has left another school on Relay\./, false],
    ["nobody, with no door", { pen: PEN, found: "NONE", pupil: null }, "No pupil on Relay holds that PEN.", false],
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
    expect(screen.getByText("Still blank for the UDISE+ filing: Gender")).toBeTruthy();
    expect(screen.getByText("The details a school certificate names: the parents, the place of birth, the admission register, the last school. The family fills them in once; the office may correct them.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Father's name"), "ZZ Ravi");
    await fireEvent.press(within(screen.getByLabelText("Gender")).getByRole("radio", { name: "Male" }));
    await fireEvent.press(within(screen.getByLabelText("Economically weaker section or disadvantaged group")).getByRole("radio", { name: "No" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the record" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${PATH}/${ASHA}`)).toBe(true));
    expect(calls().find((c) => c.line.startsWith("POST"))!.body).toMatchObject({ fatherName: "ZZ Ravi", motherName: "", admissionDate: null, gender: "M", ews: "no", bpl: "", cwsnType: "", bloodGroup: "" });
    expect(await screen.findByText("Record saved.")).toBeTruthy();
    expect(screen.getByText("1 missing")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Issue a certificate" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate-issue", params: { membershipId: ASHA } });
  });

  it("opened with no pupil, offers the list", async () => {
    await mountStaff(<OfficePupilRecord />, "ADMIN", {});
    expect(await screen.findByText("No pupils yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Pupil records" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
  });
});
