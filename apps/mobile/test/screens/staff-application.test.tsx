import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { pickAndUpload } from "@/lib/pick-file";
import { StaffApplication } from "@/screens/staff/application";
import { ApplicationNew } from "@/screens/staff/application-new";
import { A1, application, CYCLE, CYCLES_VIEW, slot } from "./admissions-fixtures";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
/* The system picker and the upload are the phone's; here a picked file is whatever the test says it is. */
jest.mock("@/lib/pick-file", () => {
  class PickError extends Error {}
  return { PickError, pickAndUpload: jest.fn() };
});
const pick = pickAndUpload as jest.Mock;

const BASE = `/api/v1/office/admissions/applications/${A1}`;
const GET = `GET ${BASE}`;
const ALL_CAN = { uploadDocuments: true, verifyDocuments: true, recordTest: true, offer: true, decide: true, admit: true };

const compose = () => (
  <ToastProvider>
    <StaffApplication />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = { id: A1 };
  pick.mockReset();
});

describe("an application as the office sees it", () => {
  it("loads the child and the family, the documents against the cycle's list, the sitting and every door the server allows", async () => {
    await mountStaff(compose(), "ADMIN", { [GET]: () => json(application({ testSlot: slot() }, ALL_CAN)) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByRole("header", { name: "Application ADM/2026-27/0001" })).toBeTruthy();
    expect(screen.getByText("ZZ Kabir · ZZ Admissions 2026-27")).toBeTruthy();
    expect(screen.getByText("ADM/2026-27/0001 · Grade applied for 1 · ZZ Admissions 2026-27 · 2026-27")).toBeTruthy();
    expect(screen.getByText("1 ZZ Road, Pune")).toBeTruthy();
    expect(screen.getByText("ZZ Parent · Parent")).toBeTruthy();
    expect(screen.getByText("Still to attach: ZZ Birth certificate")).toBeTruthy();
    expect(screen.getByText("kabir.jpg · 200 KB")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace" })).toBeTruthy();
    expect(screen.getByText(/ZZ Hall$/)).toBeTruthy();
    for (const name of ["Mark the documents checked", "Record the result", "Offer the seat", "Waitlist", "Decline the application", "Admit to the roll"]) expect(screen.getByRole("button", { name })).toBeTruthy();
    // Already in the pool: no "back to the pool".
    expect(screen.queryByRole("button", { name: "Back to the pool" })).toBeNull();
  });

  it("with nothing allowed, no button is drawn", async () => {
    await mountStaff(compose(), "PRINCIPAL", { [GET]: () => json(application({ status: "WITHDRAWN", decidedAt: "2026-09-19T05:00:00.000Z" })) });
    await screen.findByRole("header", { name: "Application ADM/2026-27/0001" });
    expect(screen.getByText("Withdrawn")).toBeTruthy();
    for (const name of ["Attach", "Replace", "Mark the documents checked", "Record the result", "Offer the seat", "Waitlist", "Decline the application", "Back to the pool", "Admit to the roll"]) expect(screen.queryByRole("button", { name })).toBeNull();
    expect(screen.getByText("No sitting booked yet.")).toBeTruthy();
  });

  it("attaches a walk-in's document through the picker and posts the ticket under its key", async () => {
    pick.mockResolvedValue({ fileId: "czz000000000000000000file1", name: "birth.pdf", mime: "application/pdf", size: 1000 });
    const verified = application({ documents: [{ key: "birth", fileId: "f2", name: "birth.pdf", mime: "application/pdf", size: 1000, uploadedAt: "2026-09-18T05:00:00.000Z" }], documentsMissing: [] }, ALL_CAN);
    const { calls } = await mountStaff(compose(), "ADMIN", { [GET]: () => json(application({}, ALL_CAN)), [`POST ${BASE}/documents`]: () => json(verified) });
    await screen.findByRole("button", { name: "Attach" });
    await fireEvent.press(screen.getByRole("button", { name: "Attach" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${BASE}/documents`)).toBe(true));
    expect(pick).toHaveBeenCalledWith("document", expect.any(String));
    expect(calls().find((c) => c.line === `POST ${BASE}/documents`)!.body).toEqual({ documents: [{ key: "birth", fileId: "czz000000000000000000file1", name: "birth.pdf" }] });
    expect(await screen.findByText("Every required document is attached.")).toBeTruthy();
  });

  it("a closed picker sends nothing", async () => {
    pick.mockResolvedValue(null);
    const { calls } = await mountStaff(compose(), "ADMIN", { [GET]: () => json(application({}, ALL_CAN)) });
    await fireEvent.press(await screen.findByRole("button", { name: "Attach" }));
    await waitFor(() => expect(pick).toHaveBeenCalled());
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
  });

  it("marks the documents checked, records the result, offers the seat and waitlists, each with its own body and the view replaced", async () => {
    const answers: Answers = {
      [GET]: () => json(application({}, ALL_CAN)),
      [`POST ${BASE}/verify`]: () => json(application({ documentsVerifiedAt: "2026-09-19T05:00:00.000Z" }, { ...ALL_CAN, verifyDocuments: false })),
      [`POST ${BASE}/test`]: () => json(application({ documentsVerifiedAt: "2026-09-19T05:00:00.000Z", testedAt: "2026-09-20T05:00:00.000Z", testScore: "42/50", testNote: "ZZ neat" }, { ...ALL_CAN, verifyDocuments: false })),
      [`POST ${BASE}/offer`]: () => json(application({ status: "OFFERED", offeredAt: "2026-09-21T05:00:00.000Z", offerExpiresAt: "2026-10-05T00:00:00.000Z", offerNote: "ZZ welcome" }, { ...ALL_CAN, offer: false, admit: false })),
      [`POST ${BASE}/decide`]: () => json(application({ status: "WAITLISTED", decidedAt: "2026-09-22T05:00:00.000Z", decisionNote: "ZZ full" }, { ...ALL_CAN, offer: false, admit: false })),
    };
    const { calls } = await mountStaff(compose(), "ADMIN", answers);
    await fireEvent.press(await screen.findByRole("button", { name: "Mark the documents checked" }));
    expect(await screen.findByText(/^Checked .*2026$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Mark the documents checked" })).toBeNull();

    await fireEvent.changeText(screen.getByLabelText("Score"), "42/50");
    await fireEvent.changeText(screen.getAllByLabelText("Note")[0]!, "ZZ neat");
    await fireEvent.press(screen.getByRole("button", { name: "Record the result" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/test`)?.body).toEqual({ score: "42/50", note: "ZZ neat" }));
    expect(await screen.findByText(/^Sat .*2026$/)).toBeTruthy();
    expect(screen.getByText("42/50")).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Answer by"), "2026-10-05");
    await fireEvent.changeText(screen.getByLabelText("Note to the family"), "ZZ welcome");
    await fireEvent.press(screen.getByRole("button", { name: "Offer the seat" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/offer`)?.body).toEqual({ expiresOn: "2026-10-05", note: "ZZ welcome" }));
    expect(await screen.findByText(/^Offered .*2026 · Please answer by .*2026$/)).toBeTruthy();
    expect(screen.getByText("ZZ welcome")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Offer the seat" })).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Waitlist" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/decide`)?.body).toEqual({ status: "WAITLISTED" }));
    expect(await screen.findByText(/^Decided .*2026 · ZZ full$/)).toBeTruthy();
    // Waitlisted now: the pool is a door, the waitlist is not.
    expect(screen.getByRole("button", { name: "Back to the pool" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Waitlist" })).toBeNull();
  });

  it("an offer needs a real day; a refusal is said above the buttons", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", { [GET]: () => json(application({}, ALL_CAN)), [`POST ${BASE}/verify`]: refused("ZZ nothing attached", 409) });
    await fireEvent.changeText(await screen.findByLabelText("Answer by"), "soon");
    await fireEvent.press(screen.getByRole("button", { name: "Offer the seat" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${BASE}/offer`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Mark the documents checked" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ nothing attached");
  });

  it("admits with the typed register number and shows what the server made once: the codes, the fee plan and the guardian", async () => {
    const accepted = application({ status: "ACCEPTED", offeredAt: "2026-09-21T05:00:00.000Z", respondedAt: "2026-09-22T05:00:00.000Z" }, { admit: true });
    const { calls } = await mountStaff(compose(), "ADMIN", {
      [GET]: () => json(accepted),
      [`POST ${BASE}/admit`]: () => json({ studentMembershipId: "czz00000000000000000mem1", studentCode: "ZZ-2026-041", className: null, feePlan: true, guardianLinked: true, firstSignInCode: "ZZQ7-K2M9" }),
    });
    expect(await screen.findByText(/^Accepted .*2026$/)).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Admission register number"), "ZZ/41");
    await fireEvent.press(screen.getByRole("button", { name: "Admit to the roll" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/admit`)?.body).toEqual({ admissionNumber: "ZZ/41" }));
    expect(await screen.findByText("ZZ Kabir is on the roll.")).toBeTruthy();
    expect(screen.getByText("ZZ-2026-041")).toBeTruthy();
    expect(screen.getByText("ZZQ7-K2M9")).toBeTruthy();
    expect(screen.getByText("No class yet")).toBeTruthy();
    expect(screen.getByText("On the fee structure, demands generated.")).toBeTruthy();
    expect(screen.getByText("The applicant is linked as guardian.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open the pupil" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: "czz00000000000000000mem1" } });
  });

  it("a blank register number sends an empty body", async () => {
    const { calls } = await mountStaff(compose(), "PRINCIPAL", {
      [GET]: () => json(application({ status: "ACCEPTED" }, { admit: true })),
      [`POST ${BASE}/admit`]: () => json({ studentMembershipId: "czz00000000000000000mem1", studentCode: "ZZ-2026-041", className: "ZZ 1A", feePlan: false, guardianLinked: false, firstSignInCode: null }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Admit to the roll" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/admit`)?.body).toEqual({}));
    expect(await screen.findByText("Not on a fee structure yet.")).toBeTruthy();
    expect(screen.getByText("No account applied; the class teacher stands in until a parent links.")).toBeTruthy();
    expect(screen.queryByText("First sign-in code")).toBeNull();
  });

  it("opened with no id, offers the pipeline", async () => {
    mockRouter.params = {};
    await mountStaff(compose(), "ADMIN", {});
    expect(await screen.findByText("There is no such application.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Applications" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/applications");
  });
});

describe("a walk-in family's application", () => {
  const CYCLES = "GET /api/v1/office/admissions/cycles";
  const CREATE = "POST /api/v1/office/admissions/applications";
  const form = () => (
    <ToastProvider>
      <ApplicationNew />
    </ToastProvider>
  );

  it("offers only the open cycles and their grades, refuses a blank child or applicant, then posts the form and opens the application", async () => {
    mockRouter.params = {};
    const { calls } = await mountStaff(form(), "ADMIN", { [CYCLES]: () => json(CYCLES_VIEW), [CREATE]: () => json(application()) });
    expect(await screen.findByRole("radio", { name: "ZZ Admissions 2026-27 · 2026-27" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: /ZZ Admissions 2025-26/ })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    expect(screen.getAllByText("This is required.").length).toBeGreaterThan(0);
    expect(calls().some((c) => c.line === CREATE)).toBe(false);
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Admissions 2026-27 · 2026-27" }));
    await fireEvent.press(screen.getByRole("radio", { name: "2 · 3 seats" }));
    await fireEvent.changeText(screen.getByLabelText("Child's name"), "ZZ Kabir");
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "2020-04-01");
    await fireEvent.changeText(screen.getByLabelText("Applicant"), "ZZ Parent");
    await fireEvent.changeText(screen.getByLabelText("Phone"), "+91 98765 00000");
    await fireEvent.press(screen.getByRole("radio", { name: "Guardian" }));
    await fireEvent.press(screen.getByRole("button", { name: "Send the application" }));
    await waitFor(() => expect(calls().some((c) => c.line === CREATE)).toBe(true));
    expect(calls().find((c) => c.line === CREATE)!.body).toEqual({ cycleId: CYCLE, childName: "ZZ Kabir", childBirthdate: "2020-04-01", gradeApplied: "2", applicantName: "ZZ Parent", applicantPhone: "+91 98765 00000", relation: "GUARDIAN" });
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/application", params: { id: A1 } });
  });

  it("with no open cycle, the door is the web's editor", async () => {
    mockRouter.params = {};
    await mountStaff(form(), "ADMIN", { [CYCLES]: () => json({ ...CYCLES_VIEW, cycles: [CYCLES_VIEW.cycles[1]] }) });
    expect(await screen.findByText("No cycle yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New cycle" })).toBeTruthy();
  });
});
