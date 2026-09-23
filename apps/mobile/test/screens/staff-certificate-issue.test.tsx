import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { CertificateIssue } from "@/screens/staff/certificate-issue";
import { StaffCertificates } from "@/screens/staff/certificates";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

/** The router is the harness's; the screen reads the pupil's membership id from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ASHA = "czz000000000000000pupil1";
const BONAFIDE = "czz0000000000000000tpl01";
const TC = "czz0000000000000000tpl02";
const RETIRED = "czz0000000000000000tpl03";
const CERT = "czz00000000000000000cert1";
const RECORD = `GET /api/v1/office/pupil-records/${ASHA}`;
const TEMPLATES = "GET /api/v1/office/certificate-templates";
const ISSUE = "POST /api/v1/office/certificates";
const QUEUE = "GET /api/v1/office/certificate-requests";
const BELA = "czz000000000000000pupil2";
const REQ1 = "czz000000000000000000req1";
const REQ2 = "czz000000000000000000req2";
const REQ3 = "czz000000000000000000req3";
const DECLINE = `POST /api/v1/office/certificate-requests/${REQ1}/decline`;
const request = (id: string, status: string, extra: Record<string, unknown> = {}) => ({
  id,
  studentMembershipId: BELA,
  studentName: "ZZ Bela",
  className: "ZZ 5B",
  kind: "BONAFIDE",
  purpose: "ZZ bus pass",
  status,
  requestedByName: "ZZ Parent",
  certificateId: null,
  serial: null,
  declineReason: null,
  decidedAt: null,
  createdAt: "2026-09-12T05:00:00.000Z",
  ...extra,
});
const QUEUE_VIEW = { items: [request(REQ1, "PENDING"), request(REQ2, "PENDING", { kind: "STUDY", purpose: "ZZ scholarship", requestedByName: "ZZ Bela" }), request(REQ3, "DECLINED", { kind: "CHARACTER", declineReason: "ZZ fees due" })], pending: 2 };

const LAYOUT = { showLogo: true, showAddress: true, useBrandColour: false, signatureLeft: "Office", signatureRight: "Principal", footerNote: null, paper: "A4" };
const template = (id: string, kind: string, name: string, locale: string, active = true) => ({ id, kind, name, locale, title: name, intro: "", rows: [], outro: "", layout: LAYOUT, serialPrefix: kind, active, issuedCount: 0, updatedAt: "2026-09-01T05:00:00.000Z" });
const TEMPLATE_VIEW = { templates: [template(BONAFIDE, "BONAFIDE", "ZZ Bonafide", "en"), template(TC, "TC", "ZZ Transfer", "mr"), template(RETIRED, "STUDY", "ZZ Old study", "hi", false)], presets: [], placeholders: [] };
const VIEW = { studentMembershipId: ASHA, studentName: "ZZ Asha", className: "ZZ 5A", studentCode: "ZZ-001", birthdate: "2016-03-14", record: null, missing: ["fatherName"], missingForFiling: [], complete: false, canEdit: true, penEditable: true, penChange: null };
const ISSUED = {
  id: CERT,
  kind: "BONAFIDE",
  locale: "en",
  serial: "BONAFIDE/2026-27/0001",
  title: "ZZ Bonafide",
  intro: "",
  rows: [],
  outro: "",
  layout: LAYOUT,
  purpose: "Passport",
  remark: null,
  studentMembershipId: ASHA,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  school: { name: "ZZ School", code: "ZZ", logoPath: null, addressLine: null, city: null, region: null, postalCode: null, contactPhone: null, contactEmail: null, brandPrimary: null },
  code: "ZZQ7-K2M9",
  issuedAt: "2026-09-18T05:00:00.000Z",
  issuedByName: "ZZ Head",
  revokedAt: null,
  revokedReason: null,
  missing: ["fatherName"],
  canRevoke: true,
};

const answers = (): Answers => ({
  [QUEUE]: () => json({ items: [], pending: 0 }),
  [RECORD]: () => json(VIEW),
  [TEMPLATES]: () => json(TEMPLATE_VIEW),
  [ISSUE]: () => json(ISSUED),
});

const compose = () => (
  <ToastProvider>
    <CertificateIssue />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = { membershipId: ASHA };
});

describe("issuing a certificate", () => {
  it("loads the pupil and the active templates, each named with its language, and warns what the record has nothing for", async () => {
    await mountStaff(compose(), "ADMIN", answers());
    // The queue and the form each load on their own.
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThanOrEqual(1);
    expect(await screen.findByRole("header", { name: "ZZ Asha" })).toBeTruthy();
    expect(screen.getByText("Pupil · ZZ 5A · ZZ-001")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Bonafide · English" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Transfer · मराठी" })).toBeTruthy();
    // A retired template is not offered.
    expect(screen.queryByRole("radio", { name: /ZZ Old study/ })).toBeNull();
    expect(screen.getByText("The record has nothing for: Father's name. They will print as a dash; fill the record first or ask the family.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Fill the record" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: ASHA } });
    // The leaving date belongs to a transfer certificate, not a bonafide.
    expect(screen.queryByLabelText("Date of leaving")).toBeNull();
  });

  it("without a template chosen nothing is sent; with one, posts the body and opens the certificate", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByRole("header", { name: "ZZ Asha" });
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    expect(screen.getByText("This is required.")).toBeTruthy();
    expect(calls().some((c) => c.line === ISSUE)).toBe(false);
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Bonafide · English" }));
    await fireEvent.changeText(screen.getByLabelText("Purpose"), "Passport");
    await fireEvent.changeText(screen.getByLabelText("Remark"), " ");
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    await waitFor(() => expect(calls().some((c) => c.line === ISSUE)).toBe(true));
    // A blank remark is left out, as is the leaving date for a bonafide.
    expect(calls().find((c) => c.line === ISSUE)!.body).toEqual({ templateId: BONAFIDE, studentMembershipId: ASHA, purpose: "Passport" });
    expect(await screen.findByText("Certificate BONAFIDE/2026-27/0001 issued.")).toBeTruthy();
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: CERT } });
  });

  it("a transfer certificate asks for the date of leaving and refuses one that is not a day", async () => {
    const { calls } = await mountStaff(compose(), "PRINCIPAL", answers());
    await screen.findByRole("header", { name: "ZZ Asha" });
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Transfer · मराठी" }));
    await fireEvent.changeText(screen.getByLabelText("Date of leaving"), "next week");
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(calls().some((c) => c.line === ISSUE)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Date of leaving"), "2026-09-30");
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    await waitFor(() => expect(calls().some((c) => c.line === ISSUE)).toBe(true));
    expect(calls().find((c) => c.line === ISSUE)!.body).toEqual({ templateId: TC, studentMembershipId: ASHA, leftOn: "2026-09-30" });
  });

  it("a refused issue is said above the button, which stays", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [ISSUE]: refused("ZZ no year", 409) });
    await screen.findByRole("header", { name: "ZZ Asha" });
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Bonafide · English" }));
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ no year");
    expect(screen.getByRole("button", { name: "Issue" })).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("with no active template, says so with the door to the web's editor", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [TEMPLATES]: () => json({ ...TEMPLATE_VIEW, templates: [TEMPLATE_VIEW.templates[2]] }) });
    expect(await screen.findByText("No templates yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Templates" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Issue" })).toBeNull();
  });

  it("opened with no pupil, offers the records list", async () => {
    mockRouter.params = {};
    await mountStaff(compose(), "ADMIN", answers());
    expect(await screen.findByText("No pupils yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Pupil records" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
  });
});

describe("requests from families", () => {
  it("lists the queue pending first with the pupil, the class, the kind, the purpose and who asked, counts what waits, and only a pending one has the buttons", async () => {
    mockRouter.params = {};
    await mountStaff(compose(), "ADMIN", { ...answers(), [QUEUE]: () => json(QUEUE_VIEW) });
    expect(await screen.findByText("Requests from families")).toBeTruthy();
    expect(screen.getByText("2 waiting")).toBeTruthy();
    expect(screen.getAllByText("ZZ Bela · ZZ 5B")).toHaveLength(3);
    expect(screen.getByText("Bonafide certificate · ZZ bus pass")).toBeTruthy();
    expect(screen.getByText("Study certificate · ZZ scholarship")).toBeTruthy();
    expect(screen.getAllByText(/^ZZ Parent · Asked /)).toHaveLength(2);
    expect(screen.getByText(/^ZZ Bela · Asked /)).toBeTruthy();
    expect(screen.getByText("Declined: ZZ fees due")).toBeTruthy();
    expect(screen.getAllByText("Waiting for the office")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Issue this" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Decline" })).toHaveLength(2);
    // A study certificate has no active template, so that one cannot be issued from here.
    expect(screen.getAllByRole("button", { name: "Issue this" })[1]).toBeDisabled();
    // With no pupil opened, the form still says so beneath the queue.
    expect(screen.getByText("No pupils yet")).toBeTruthy();
  });

  it("\"Issue this\" puts the pupil and a template of that kind into the form with the purpose, and the issue carries the request", async () => {
    mockRouter.params = {};
    const { calls } = await mountStaff(compose(), "ADMIN", { ...answers(), [QUEUE]: () => json(QUEUE_VIEW), [`GET /api/v1/office/pupil-records/${BELA}`]: () => json({ ...VIEW, studentMembershipId: BELA, studentName: "ZZ Bela", className: "ZZ 5B", missing: [] }) });
    await screen.findByText("Requests from families");
    await fireEvent.press(screen.getAllByRole("button", { name: "Issue this" })[0]!);
    expect(await screen.findByRole("header", { name: "ZZ Bela" })).toBeTruthy();
    expect(screen.getByText("Issuing for a request: ZZ Bela, Bonafide certificate — ZZ bus pass")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Bonafide · English" })).toBeChecked();
    expect(screen.getByLabelText("Purpose")).toHaveDisplayValue("ZZ bus pass");
    await fireEvent.press(screen.getByRole("button", { name: "Issue" }));
    await waitFor(() => expect(calls().some((c) => c.line === ISSUE)).toBe(true));
    expect(calls().find((c) => c.line === ISSUE)!.body).toEqual({ templateId: BONAFIDE, studentMembershipId: BELA, requestId: REQ1, purpose: "ZZ bus pass" });
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: CERT } });
  });

  it("declining asks why, sends nothing without a reason, then posts it and says the family has been told", async () => {
    const { calls } = await mountStaff(compose(), "PRINCIPAL", { ...answers(), [QUEUE]: () => json(QUEUE_VIEW), [DECLINE]: () => json(request(REQ1, "DECLINED", { declineReason: "ZZ fees due" })) });
    await screen.findByText("Requests from families");
    await fireEvent.press(screen.getAllByRole("button", { name: "Decline" })[0]!);
    expect(screen.getByLabelText("Why not")).toBeTruthy();
    // The decline button inside the first row's note (the other row keeps its own) is disabled until a reason is typed.
    expect(screen.getAllByRole("button", { name: "Decline" })[0]).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Why not"), " ZZ fees due ");
    await fireEvent.press(screen.getAllByRole("button", { name: "Decline" })[0]!);
    await waitFor(() => expect(calls().some((c) => c.line === DECLINE)).toBe(true));
    expect(calls().find((c) => c.line === DECLINE)!.body).toEqual({ reason: "ZZ fees due" });
    expect(await screen.findByText("Request declined; the family has been told.")).toBeTruthy();
    // The queue is asked for again.
    await waitFor(() => expect(calls().filter((c) => c.line === QUEUE).length).toBeGreaterThanOrEqual(2));
  });

  it("with nothing asked for, says so with the door to the issued list", async () => {
    await mountStaff(compose(), "ADMIN", answers());
    expect(await screen.findByText("Nothing waiting")).toBeTruthy();
    expect(screen.getByText("Requests from pupils and guardians appear here.")).toBeTruthy();
    expect(screen.queryByText(/^\d+ waiting$/)).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Issued certificates" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/staff-certificates");
  });
});

describe("the office's issued list", () => {
  const LIST = "GET /api/v1/office/certificates";
  it("lists every certificate with the pupil, the serial and the date, marks a revoked one, and opens one", async () => {
    await mountStaff(<StaffCertificates />, "ADMIN", {
      [LIST]: () =>
        json({
          items: [
            { id: CERT, kind: "BONAFIDE", locale: "en", serial: "BONAFIDE/2026-27/0001", title: "ZZ Bonafide", studentMembershipId: ASHA, studentName: "ZZ Asha", issuedAt: "2026-09-18T05:00:00.000Z", revokedAt: null },
            { id: "czz00000000000000000cert2", kind: "TC", locale: "mr", serial: "TC/2026-27/0001", title: "ZZ Transfer", studentMembershipId: ASHA, studentName: "ZZ Asha", issuedAt: "2026-09-01T05:00:00.000Z", revokedAt: "2026-09-10T05:00:00.000Z" },
          ],
        }),
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("ZZ Bonafide")).toBeTruthy();
    expect(screen.getByText(/^ZZ Asha · BONAFIDE\/2026-27\/0001 · Issued .*2026$/)).toBeTruthy();
    expect(screen.getAllByText("Revoked")).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Bonafide/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: CERT } });
  });

  it("with nothing issued, the door is the records list", async () => {
    await mountStaff(<StaffCertificates />, "PRINCIPAL", { [LIST]: () => json({ items: [] }) });
    expect(await screen.findByText("Nothing issued yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Pupil records" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/pupil-records");
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(<StaffCertificates />, "ADMIN", { [LIST]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
