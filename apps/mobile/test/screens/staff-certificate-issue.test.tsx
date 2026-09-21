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

const LAYOUT = { showLogo: true, showAddress: true, useBrandColour: false, signatureLeft: "Office", signatureRight: "Principal", footerNote: null, paper: "A4" };
const template = (id: string, kind: string, name: string, locale: string, active = true) => ({ id, kind, name, locale, title: name, intro: "", rows: [], outro: "", layout: LAYOUT, serialPrefix: kind, active, issuedCount: 0, updatedAt: "2026-09-01T05:00:00.000Z" });
const TEMPLATE_VIEW = { templates: [template(BONAFIDE, "BONAFIDE", "ZZ Bonafide", "en"), template(TC, "TC", "ZZ Transfer", "mr"), template(RETIRED, "STUDY", "ZZ Old study", "hi", false)], presets: [], placeholders: [] };
const VIEW = { studentMembershipId: ASHA, studentName: "ZZ Asha", className: "ZZ 5A", studentCode: "ZZ-001", birthdate: "2016-03-14", record: null, missing: ["fatherName"], complete: false, canEdit: true };
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
    expect(screen.getByRole("progressbar")).toBeTruthy();
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
