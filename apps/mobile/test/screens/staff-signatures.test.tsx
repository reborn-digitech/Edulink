import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { Signatures, strokePath } from "@/screens/staff/signatures";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(true);

/** A one-pixel PNG, as the server hands a signature back: a data URL the row keeps. */
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const VIEW = "/api/v1/office/signatures";
const view = (over: Record<string, unknown> = {}) => ({
  mine: { image: null, updatedAt: null },
  seal: { image: null, updatedAt: null },
  canSetSeal: true,
  waiting: [
    { id: "ps1", paperKind: "CERTIFICATE", paperId: "cert1", count: 1, title: "ZZ Bonafide", serial: "ZZ/2026/0007", studentName: "ZZ Asha Rao", requestedByName: "ZZ Office", createdAt: "2026-09-30T10:00:00.000Z" },
    { id: "ps2", paperKind: "REPORT_CARD_SET", paperId: "card1", count: 24, title: "ZZ Term 1", serial: null, studentName: "ZZ 5A", requestedByName: null, createdAt: "2026-09-29T10:00:00.000Z" },
  ],
  ...over,
});

const mount = (role: "ADMIN" | "PRINCIPAL" | "TEACHER", answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <Signatures />
    </ToastProvider>,
    role,
    answers,
  );

/** Draws on the pad: a layout, then a finger down, across and up. Points land in the PNG's own 600 by 200. */
async function sign(width = 300) {
  const pad = screen.getByTestId("signature-pad");
  await fireEvent(pad, "layout", { nativeEvent: { layout: { width, height: 100 } } });
  await fireEvent(pad, "responderGrant", { nativeEvent: { locationX: 50, locationY: 20 } });
  await fireEvent(pad, "responderMove", { nativeEvent: { locationX: 150, locationY: 40 } });
  await fireEvent(pad, "responderMove", { nativeEvent: { locationX: 250, locationY: 30 } });
  await fireEvent(pad, "responderRelease", { nativeEvent: {} });
}

beforeEach(() => {
  mockRouter.push.mockClear();
  openURL.mockClear();
});

describe("a stroke's path", () => {
  it("is a move and lines; a single point is a dot drawn by the round cap; nothing is nothing", () => {
    expect(strokePath([{ x: 1, y: 2 }, { x: 3, y: 4 }])).toBe("M 1 2 L 3 4");
    expect(strokePath([{ x: 5, y: 6 }])).toBe("M 5 6 L 5 6");
    expect(strokePath([])).toBe("");
  });
});

describe("the signatures screen", () => {
  it("lists the papers waiting with who issued them, says there is no signature yet, and the seal is the web's to set", async () => {
    await mount("ADMIN", { [`GET ${VIEW}`]: () => json(view()) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("ZZ Asha Rao");
    expect(screen.getByText("2 waiting")).toBeTruthy();
    expect(screen.getByText("ZZ Bonafide · ZZ/2026/0007")).toBeTruthy();
    expect(screen.getByText("ZZ Term 1 · 24 report cards")).toBeTruthy();
    expect(screen.getByText(/^Issued by ZZ Office on /)).toBeTruthy();
    expect(screen.getByText("No signature yet.")).toBeTruthy();
    expect(screen.getByText("Add your signature first, then sign.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign: ZZ Asha Rao, ZZ Bonafide" })).toBeDisabled();
    expect(screen.getByText("No seal yet.")).toBeTruthy();
    expect(screen.getByText(/^The seal is set on the web/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open on the web" }));
    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/signatures$/));
  });

  it("opens a certificate on the phone and a set of report cards on the web", async () => {
    await mount("TEACHER", { [`GET ${VIEW}`]: () => json(view({ mine: { image: PNG, updatedAt: "2026-09-01T00:00:00.000Z" } })) });
    await screen.findByText("ZZ Asha Rao");
    const open = screen.getAllByRole("button", { name: "Open the paper" });
    await fireEvent.press(open[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/certificate", params: { id: "cert1" } });
    await fireEvent.press(open[1]!);
    expect(openURL).toHaveBeenCalledWith(expect.stringMatching(/\/report-cards\/card1$/));
    // A teacher has no seal to read.
    expect(screen.queryByText("School seal")).toBeNull();
    expect(screen.getByLabelText("Your signature as it stands")).toBeTruthy();
  });

  it("signs a paper that waited and declines another, each answered by the server and said", async () => {
    const { calls } = await mount("PRINCIPAL", {
      [`GET ${VIEW}`]: () => json(view({ mine: { image: PNG, updatedAt: "2026-09-01T00:00:00.000Z" }, canSetSeal: false })),
      "POST /api/v1/office/signatures/ps1/decide": () => json({ paperKind: "CERTIFICATE", paperId: "cert1", status: "SIGNED" }),
      "POST /api/v1/office/signatures/ps2/decide": () => json({ paperKind: "REPORT_CARD_SET", paperId: "card1", status: "DECLINED" }),
    });
    await screen.findByText("ZZ Asha Rao");
    expect(screen.getByText("Only a school admin sets the seal.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sign: ZZ Asha Rao, ZZ Bonafide" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/office/signatures/ps1/decide")?.body).toEqual({ approve: true }));
    await screen.findByText("Signed");
    await fireEvent.press(screen.getByRole("button", { name: "Decline: ZZ 5A, ZZ Term 1" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/office/signatures/ps2/decide")?.body).toEqual({ approve: false }));
    await screen.findByText("Declined");
  });

  it("⚠ a signature drawn with a finger goes to the server as a PNG data URL of the web's size, never a file; saving nothing is refused on the phone; clear empties the box", async () => {
    const { calls } = await mount("TEACHER", { [`GET ${VIEW}`]: () => json(view({ waiting: [] })), "POST /api/v1/office/signatures/mine": () => json({ ok: true }) });
    await screen.findByText("Nothing is waiting for you.");
    await fireEvent.press(screen.getByRole("button", { name: "Save the signature" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign in the box first.");
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
    await sign();
    expect(screen.getByRole("button", { name: "Clear" })).not.toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Save the signature" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/office/signatures/mine")).toBe(true));
    const body = calls().find((c) => c.line === "POST /api/v1/office/signatures/mine")!.body as { image: string };
    expect(body.image).toMatch(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/);
    const bytes = Buffer.from(body.image.slice("data:image/png;base64,".length), "base64");
    // The IHDR says 600 by 200: the strokes were scaled from the 300 px box to the PNG's own size.
    expect(bytes.readUInt32BE(16)).toBe(600);
    expect(bytes.readUInt32BE(20)).toBe(200);
    expect(bytes.length).toBeLessThan(200 * 1024);
    await screen.findByText("Signature saved");
    expect(screen.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("a signature as it stands can be removed; the server's refusal is shown", async () => {
    const { calls } = await mount("ADMIN", {
      [`GET ${VIEW}`]: () => json(view({ waiting: [], mine: { image: PNG, updatedAt: "2026-09-01T00:00:00.000Z" }, seal: { image: PNG, updatedAt: "2026-09-01T00:00:00.000Z" } })),
      "POST /api/v1/office/signatures/mine/remove": () => json({ ok: true }),
      "POST /api/v1/office/signatures/mine": () => json({ error: "ZZ too large", code: "FORBIDDEN" }, 403),
    });
    await screen.findByLabelText("Your signature as it stands");
    expect(screen.getByLabelText("The school's seal as it stands")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/office/signatures/mine/remove")).toBe(true));
    await screen.findByText("Signature removed");
    await sign();
    await fireEvent.press(screen.getByRole("button", { name: "Clear" }));
    await sign(600);
    await fireEvent.press(screen.getByRole("button", { name: "Save the signature" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ too large");
  });
});
