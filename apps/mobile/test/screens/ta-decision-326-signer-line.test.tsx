/**
 * The owner's decision on TA-326 (14 November 2026): under each signature already given, the paper prints who signed
 * it and the office they signed as, from what the paper stored at signing, the school's caption staying as typed. On
 * the phone that is the certificate screen and the text its Share button hands over.
 */
import { Share } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { CertificateView } from "@/screens/shared/certificate";
import { json, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CERT = "czz00000000000000000cert1";
const GET = `GET /api/v1/shared/certificates/${CERT}`;
const signature = (slot: "LEFT" | "RIGHT", role: "ADMIN" | "PRINCIPAL", status: "SIGNED" | "PENDING", signerName: string | null) => ({ id: `czz0000000000000000sig${slot === "LEFT" ? 1 : 2}`, slot, role, status, signerName, image: status === "SIGNED" ? "/api/v1/shared/signatures/zz" : null, decidedAt: status === "SIGNED" ? "2026-09-15T05:00:00.000Z" : null, can: { decide: false } });

// The office signed the RIGHT line, which the school captioned "Principal"; the head's LEFT line still waits.
const view = () => ({
  id: CERT,
  kind: "BONAFIDE",
  locale: "en",
  serial: "BC/2026-27/0003",
  title: "ZZ Bonafide Certificate",
  intro: "ZZ intro.",
  rows: [],
  outro: "",
  layout: { showLogo: false, showAddress: false, useBrandColour: false, signerLeft: "PRINCIPAL", signerRight: "ADMIN", signatureLeft: "Head", signatureRight: "Principal", footerNote: null, paper: "A4" },
  purpose: null,
  remark: null,
  studentMembershipId: "czz000000000000000pupil1",
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  school: { name: "ZZ School", code: "ZZ", logoPath: null, addressLine: null, city: null, region: null, postalCode: null, contactPhone: null, contactEmail: null, brandPrimary: null },
  code: "ZZQ7-K2M9",
  signatures: [signature("LEFT", "PRINCIPAL", "PENDING", null), signature("RIGHT", "ADMIN", "SIGNED", "ZZ A. Patil")],
  seal: null,
  issuedAt: "2026-09-15T05:00:00.000Z",
  issuedByName: "ZZ A. Patil",
  revokedAt: null,
  revokedReason: null,
  missing: [],
  canRevoke: false,
});

beforeEach(() => {
  mockRouter.params = { id: CERT };
});

describe("TA-326: who signed, under the line", () => {
  it("TA-326: the certificate screen prints 'Signed by ZZ A. Patil, Office' under the caption 'Principal', which stays as typed, and nothing under the line that waits", async () => {
    await mountStaff(
      <ToastProvider>
        <CertificateView />
      </ToastProvider>,
      "PARENT",
      { [GET]: () => json(view()) },
    );
    await screen.findByText("Serial: BC/2026-27/0003");
    expect(screen.getByText("Principal")).toBeTruthy();
    expect(screen.getByText("Head")).toBeTruthy();
    expect(screen.getByText("Signed by ZZ A. Patil, Office")).toBeTruthy();
    expect(screen.queryAllByText(/^Signed by/)).toHaveLength(1);
  });

  it("TA-326: the shared text carries the same line after the captions", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    await mountStaff(
      <ToastProvider>
        <CertificateView />
      </ToastProvider>,
      "PARENT",
      { [GET]: () => json(view()) },
    );
    await screen.findByText("Serial: BC/2026-27/0003");
    await fireEvent.press(screen.getByRole("button", { name: "Share" }));
    const text = (share.mock.calls.at(-1)![0] as { message: string }).message;
    expect(text).toContain("Head · Principal\nSigned by ZZ A. Patil, Office");
    share.mockRestore();
  });
});
