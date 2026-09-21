import { Share } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Sharing from "expo-sharing";
import { ToastProvider } from "@/components";
import { CertificateView, certificateText } from "@/screens/shared/certificate";
import { en } from "@edulink/i18n/en";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's; the screen reads the certificate's id from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CERT = "czz00000000000000000cert1";
const PUPIL = "czz000000000000000pupil1";
const GET = `GET /api/v1/shared/certificates/${CERT}`;
const PDF = `GET /api/v1/shared/certificates/${CERT}/pdf`;
const REVOKE = `POST /api/v1/office/certificates/${CERT}/revoke`;
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46]);

const view = (over: Record<string, unknown> = {}) => ({
  id: CERT,
  kind: "BONAFIDE",
  locale: "en",
  serial: "BC/2026-27/0003",
  title: "ZZ Bonafide Certificate",
  intro: "This is to certify that ZZ Asha is a bona fide pupil of ZZ School.",
  rows: [
    { label: "Class", value: "ZZ 5A" },
    { label: "Date of birth", value: "14 March 2016" },
    { label: "Father's name", value: "" },
  ],
  outro: "Issued for the purpose of a passport application.",
  layout: { showLogo: true, showAddress: true, useBrandColour: true, signatureLeft: "Office", signatureRight: "Principal", footerNote: "Valid with the school seal.", paper: "A4" },
  purpose: "Passport",
  remark: null,
  studentMembershipId: PUPIL,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  school: { name: "ZZ School", code: "ZZ", logoPath: null, addressLine: "1 ZZ Road", city: "Pune", region: "Maharashtra", postalCode: "411001", contactPhone: "+91 20 0000 0000", contactEmail: null, brandPrimary: "#123456" },
  code: "ZZQ7-K2M9",
  issuedAt: "2026-09-15T05:00:00.000Z",
  issuedByName: "ZZ Office",
  revokedAt: null,
  revokedReason: null,
  missing: ["fatherName"],
  canRevoke: true,
  ...over,
});

const compose = () => (
  <ToastProvider>
    <CertificateView />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = { id: CERT };
  (Sharing.shareAsync as jest.Mock).mockClear();
});

describe("one certificate", () => {
  it("loads, then renders the document: the school in its colour, the address, the serial and date, the numbered rows, the signatures and the verify line", async () => {
    const gate = gated();
    await mountStaff(compose(), "PARENT", { [GET]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(view({ canRevoke: false })));
    expect(await screen.findAllByRole("header", { name: "ZZ Bonafide Certificate" })).toHaveLength(2);
    expect(screen.getByText("ZZ School")).toHaveStyle({ color: "#123456" });
    expect(screen.getByText("1 ZZ Road, Pune, Maharashtra, 411001")).toBeTruthy();
    expect(screen.getByText("Serial: BC/2026-27/0003")).toBeTruthy();
    expect(screen.getByText(/^Issued .*2026$/)).toBeTruthy();
    expect(screen.getByText("This is to certify that ZZ Asha is a bona fide pupil of ZZ School.")).toBeTruthy();
    expect(screen.getByText("1. Class")).toBeTruthy();
    expect(screen.getByText("2. Date of birth")).toBeTruthy();
    expect(screen.getByText("14 March 2016")).toBeTruthy();
    // A row the record had nothing for prints as a dash, as the paper does.
    expect(screen.getByText("3. Father's name")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("Office")).toBeTruthy();
    expect(screen.getByText("Principal")).toBeTruthy();
    expect(screen.getByText("Valid with the school seal.")).toBeTruthy();
    expect(screen.getByText(/^Verify this certificate at http:\/\/.*\/certificates\/check with code ZZQ7-K2M9\.$/)).toBeTruthy();
    expect(screen.getByText("Issued by ZZ Office · Verification code: ZZQ7-K2M9")).toBeTruthy();
    // The family reads; only the office revokes, and the blank-field warning is the office's.
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
    expect(screen.queryByText(/^The record has nothing for/)).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("a school without the brand colour on prints its name plainly, and no address when the layout hides it", async () => {
    await mountStaff(compose(), "PARENT", { [GET]: () => json(view({ canRevoke: false, layout: { ...view().layout, useBrandColour: false, showAddress: false, signatureLeft: "", signatureRight: "", footerNote: null } })) });
    await screen.findByText("Serial: BC/2026-27/0003");
    expect(screen.getByText("ZZ School")).not.toHaveStyle({ color: "#123456" });
    expect(screen.queryByText("1 ZZ Road, Pune, Maharashtra, 411001")).toBeNull();
    expect(screen.queryByText("Principal")).toBeNull();
  });

  it("a revoked one carries the banner with the date and the reason, and no Revoke button", async () => {
    await mountStaff(compose(), "ADMIN", { [GET]: () => json(view({ revokedAt: "2026-09-18T05:00:00.000Z", revokedReason: "ZZ issued twice", canRevoke: false })) });
    expect(await screen.findByRole("alert")).toHaveTextContent(/^This certificate was revoked on .*2026: ZZ issued twice$/);
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
  });

  it("Share hands the document as text to the share sheet, top to bottom", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    await mountStaff(compose(), "PARENT", { [GET]: () => json(view({ canRevoke: false })) });
    await screen.findByText("Serial: BC/2026-27/0003");
    await fireEvent.press(screen.getByRole("button", { name: "Share" }));
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: "ZZ Bonafide Certificate · ZZ Asha" }));
    const text = (share.mock.calls.at(-1)![0] as { message: string }).message;
    const lines = text.split("\n");
    expect(lines[0]).toBe("ZZ School");
    expect(lines[1]).toBe("1 ZZ Road, Pune, Maharashtra, 411001");
    expect(text).toMatch(/Serial: BC\/2026-27\/0003 · Issued /);
    expect(text).toContain("1. Class: ZZ 5A");
    expect(text).toContain("3. Father's name: —");
    expect(text).toContain("Office · Principal");
    expect(text).toMatch(/with code ZZQ7-K2M9\.$/);
    // The same words the dictionary has, in the same order the screen draws them.
    const t = (key: string, vars: Record<string, string | number> = {}) => Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), key.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], en) as string);
    expect(certificateText(view({ canRevoke: false }) as never, t as never, "en")).toBe(text);
    share.mockRestore();
  });

  it("Download PDF fetches the PDF with the token and hands the file to the share sheet; a refusal is an alert with a retry", async () => {
    let refuse = true;
    const { calls } = await mountStaff(compose(), "PARENT", {
      [GET]: () => json(view({ canRevoke: false })),
      [PDF]: () => (refuse ? json({ error: "ZZ Not yours.", code: "FORBIDDEN" }, 403) : new Response(PDF_BYTES, { status: 200, headers: { "content-type": "application/pdf" } })),
    });
    await screen.findByText("Serial: BC/2026-27/0003");
    await fireEvent.press(screen.getByRole("button", { name: "Download PDF" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not yours.");
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
    refuse = false;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalled());
    expect(screen.queryByRole("alert")).toBeNull();
    expect(calls().filter((c) => c.line === `GET /api/v1/shared/certificates/${CERT}/pdf`)).toHaveLength(2);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/BC 2026-27 0003 - ZZ Asha\.pdf$/), expect.objectContaining({ mimeType: "application/pdf", UTI: "com.adobe.pdf" }));
  });

  it("the office sees what printed blank, and revokes with a reason: the banner appears and the button goes", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", {
      [GET]: () => json(view()),
      [REVOKE]: async ({ init }) => {
        const body = JSON.parse(String(init.body)) as { reason: string };
        return json(view({ revokedAt: "2026-09-18T05:00:00.000Z", revokedReason: body.reason, canRevoke: false }));
      },
    });
    await screen.findByText("Serial: BC/2026-27/0003");
    expect(screen.getByText("The record has nothing for: fatherName. They will print as a dash; fill the record first or ask the family.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Revoke" }));
    // Nothing is sent without a reason.
    expect(screen.getByRole("button", { name: "Revoke" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Why it is revoked"), "ZZ issued twice");
    await fireEvent.press(screen.getByRole("button", { name: "Revoke" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST /api/v1/office/certificates/${CERT}/revoke`)).toBe(true));
    expect(calls().find((c) => c.line.startsWith("POST"))!.body).toEqual({ reason: "ZZ issued twice" });
    expect(await screen.findByText(/^This certificate was revoked on .*: ZZ issued twice$/)).toBeTruthy();
    expect(screen.getByText("Certificate revoked.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Revoke" })).toBeNull();
  });

  it("a refused revoke is said above the reason, which stays; Cancel folds it away", async () => {
    await mountStaff(compose(), "PRINCIPAL", { [GET]: () => json(view()), [REVOKE]: refused("ZZ already revoked", 409) });
    await screen.findByText("Serial: BC/2026-27/0003");
    await fireEvent.press(screen.getByRole("button", { name: "Revoke" }));
    await fireEvent.changeText(screen.getByLabelText("Why it is revoked"), "ZZ oops");
    await fireEvent.press(screen.getByRole("button", { name: "Revoke" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ already revoked");
    expect(screen.getByLabelText("Why it is revoked").props.value).toBe("ZZ oops");
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Why it is revoked")).toBeNull();
    expect(screen.getByRole("button", { name: "Revoke" })).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(compose(), "PARENT", { [GET]: refused("ZZ not yours", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not yours");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("opened with no id, offers the list", async () => {
    mockRouter.params = {};
    await mountStaff(compose(), "ADMIN", {});
    expect(await screen.findByText("No certificates yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Certificates" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/staff-certificates");
  });
});
