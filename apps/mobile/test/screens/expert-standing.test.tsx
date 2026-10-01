import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { expertBookingsSchema, expertFreeDutySchema, expertKycSchema, expertKycSubmitBodySchema, expertProfileSchema, operatorExpertsSchema, staffExpertsSchema } from "@edulink/contracts";
import { ExpertProfile } from "@/screens/expert/profile";
import { ExpertHome } from "@/screens/expert/home";
import { Experts } from "@/screens/shared/experts";
import { OperatorHome } from "@/screens/operator/home";
import { ToastProvider } from "@/components";
import { API_BASE } from "@/lib/api";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

/**
 * The expert's standing beyond their words: families' ratings on the card
 * and the profile (an average from three, "New" before), the free duty
 * decision 0004 asks (the expert's home), the identity papers (sent through
 * the phone's one picker, opened through a link) and the calendar feed
 * address (minted, copied, rotated) — and the operator's side of the
 * papers: the KYC pill, the documents, verify or reject with a reason.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
jest.mock("@/lib/pick-file", () => {
  class PickError extends Error {}
  return { PickError, pickAndUpload: jest.fn() };
});
jest.mock("@/lib/open-file", () => ({ openFile: jest.fn() }));
jest.mock("@/lib/copy", () => ({ copyText: jest.fn() }));
const pick = (jest.requireMock("@/lib/pick-file") as { pickAndUpload: jest.Mock }).pickAndUpload;
const open = (jest.requireMock("@/lib/open-file") as { openFile: jest.Mock }).openFile;
const copy = (jest.requireMock("@/lib/copy") as { copyText: jest.Mock }).copyText;

beforeEach(() => {
  mockRouter.push.mockClear();
  pick.mockReset();
  open.mockReset();
  copy.mockReset();
});

const PROFILE = expertProfileSchema.parse({
  profile: { headline: "ZZ Careers adviser", bio: "ZZ bio", organisation: null, specialisms: ["Careers"], timezone: "Asia/Kolkata", offering: "SESSIONS", mentorCapacity: null, published: true, verified: false },
  impact: { sessionsDone: 4, sessionsBooked: 0, schoolsServed: 1, activeMentorships: 0, mentorCapacity: null, upcomingSlots: 0, rating: { average: 4.3, count: 6 } },
});
const KYC_NONE = expertKycSchema.parse({ status: "NONE", note: null, submittedAt: null, decidedAt: null, documents: [], canSubmit: true });
const KYC_REJECTED = expertKycSchema.parse({ status: "REJECTED", note: "ZZ the scan is unreadable", submittedAt: "2026-09-20T06:00:00.000Z", decidedAt: "2026-09-22T06:00:00.000Z", documents: [{ fileId: "f-old", mime: "application/pdf", size: 1200 }], canSubmit: true });
const KYC_VERIFIED = expertKycSchema.parse({ status: "VERIFIED", note: null, submittedAt: "2026-09-20T06:00:00.000Z", decidedAt: "2026-09-22T06:00:00.000Z", documents: [{ fileId: "f-old", mime: "application/pdf", size: 1200 }], canSubmit: false });
const P = "/api/v1/shared/expert/profile";
const KYC = "/api/v1/expert/kyc";
const CAL = "/api/v1/expert/calendar/token";

const profileAnswers = (kyc: unknown, url: string | null) => ({ [`GET ${P}`]: () => json(PROFILE), [`GET ${KYC}`]: () => json(kyc), [`GET ${CAL}`]: () => json({ url }) });

describe("the expert's standing on their profile", () => {
  it("shows the rating with the standing, the papers not sent yet, and sends two picked documents with a note", async () => {
    pick.mockResolvedValueOnce({ fileId: "f1", mime: "application/pdf", size: 900, name: "passport.pdf" }).mockResolvedValueOnce({ fileId: "f2", mime: "image/png", size: 300, name: "bill.png" });
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { ...profileAnswers(KYC_NONE, null), [`POST ${KYC}`]: () => json({ ...KYC_NONE, status: "SUBMITTED", submittedAt: "2026-10-01T06:00:00.000Z", documents: [{ fileId: "f1", mime: "application/pdf", size: 900 }, { fileId: "f2", mime: "image/png", size: 300 }] }) });
    await screen.findByText("4.3 out of 5 from 6 ratings");
    expect(await screen.findByText("Not sent yet")).toBeTruthy();
    expect(screen.getByText("0 of 5 documents")).toBeTruthy();
    const send = screen.getByRole("button", { name: "Send for checking" });
    expect(send).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Add a document" }));
    await screen.findByText("passport.pdf");
    await fireEvent.press(screen.getByRole("button", { name: "Add a document" }));
    await screen.findByText("bill.png");
    expect(screen.getByText("2 of 5 documents")).toBeTruthy();
    expect(pick).toHaveBeenCalledWith("document", expect.any(String));
    // One taken back, then added again.
    await fireEvent.press(screen.getByRole("button", { name: "Remove bill.png" }));
    expect(screen.queryByText("bill.png")).toBeNull();
    pick.mockResolvedValueOnce({ fileId: "f2", mime: "image/png", size: 300, name: "bill.png" });
    await fireEvent.press(screen.getByRole("button", { name: "Add a document" }));
    await screen.findByText("bill.png");
    await fireEvent.changeText(screen.getByLabelText("A note for the operator"), "ZZ passport and a bill");
    await fireEvent.press(screen.getByRole("button", { name: "Send for checking" }));
    await screen.findByText("Your documents are with the operator.");
    const post = calls().find((c) => c.line === `POST ${KYC}`)!;
    expect(expertKycSubmitBodySchema.parse(post.body)).toEqual({ documentIds: ["f1", "f2"], note: "ZZ passport and a bill" });
    expect(await screen.findByText("Waiting for the operator")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send again" })).toBeTruthy();
  });

  it("a rejected set shows the operator's reason, opens the old document through a link, and a picker failure is said under the card", async () => {
    pick.mockRejectedValueOnce(new Error("ZZ the picker closed"));
    open.mockResolvedValueOnce(null);
    await mountStaff(<ExpertProfile />, "EXPERT", profileAnswers(KYC_REJECTED, null));
    expect(await screen.findByText("Not accepted")).toBeTruthy();
    expect(screen.getByText("The operator wrote: ZZ the scan is unreadable")).toBeTruthy();
    await fireEvent.press(screen.getByText("Open document 1"));
    expect(open).toHaveBeenCalledWith("f-old", expect.any(String));
    await fireEvent.press(screen.getByRole("button", { name: "Add a document" }));
    expect(await screen.findByText("ZZ the picker closed")).toBeTruthy();
  });

  it("verified reads as such with nothing to send; a refused send is an alert with a retry", async () => {
    await mountStaff(<ExpertProfile />, "EXPERT", profileAnswers(KYC_VERIFIED, null));
    expect(await screen.findByText("Identity verified")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add a document" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Send for checking" })).toBeNull();
  });

  it("a refused send keeps the picked files and offers a retry", async () => {
    pick.mockResolvedValueOnce({ fileId: "f1", mime: "application/pdf", size: 900, name: "passport.pdf" });
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { ...profileAnswers(KYC_NONE, null), [`POST ${KYC}`]: refused("ZZ not your file", 404) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a document" }));
    await screen.findByText("passport.pdf");
    await fireEvent.press(screen.getByRole("button", { name: "Send for checking" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not your file");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${KYC}`)).toHaveLength(2));
  });

  it("the calendar card: no address yet, one made on press, copied, and rotated to a new one", async () => {
    copy.mockResolvedValueOnce(true);
    const urls = ["/api/v1/expert/calendar.ics?token=first", "/api/v1/expert/calendar.ics?token=second"];
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { ...profileAnswers(KYC_NONE, null), [`POST ${CAL}`]: () => json({ url: urls.shift() }) });
    expect(await screen.findByText(/^No address yet\./)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Create the address" }));
    expect(await screen.findByText(`${API_BASE}/api/v1/expert/calendar.ics?token=first`)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Copy the address" }));
    expect(copy).toHaveBeenCalledWith(`${API_BASE}/api/v1/expert/calendar.ics?token=first`, expect.any(String));
    expect(await screen.findByText("Address copied.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Make a new address" }));
    expect(await screen.findByText(`${API_BASE}/api/v1/expert/calendar.ics?token=second`)).toBeTruthy();
    expect(screen.queryByText("Address copied.")).toBeNull();
    expect(calls().filter((c) => c.line === `POST ${CAL}`)).toHaveLength(2);
  });

  it("an address already minted is shown on load", async () => {
    await mountStaff(<ExpertProfile />, "EXPERT", profileAnswers(KYC_NONE, "/api/v1/expert/calendar.ics?token=kept"));
    expect(await screen.findByText(`${API_BASE}/api/v1/expert/calendar.ics?token=kept`)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Make a new address" })).toBeTruthy();
  });
});

describe("free duty on the expert's home", () => {
  const BOOKINGS = expertBookingsSchema.parse({ bookings: [] });
  const UNLISTED = { ...PROFILE, profile: { ...PROFILE.profile, published: true } };
  const duty = (over: Record<string, unknown>) => expertFreeDutySchema.parse({ oneToOnes: 2, workshops: 1, period: { month: "2026-10", quarter: "2026-Q4" }, stage: { oneToOnes: "ONGOING", workshops: "ONGOING" }, asked: { startOneToOnes: 10, startWorkshops: 2, monthlyOneToOnes: 2, quarterlyWorkshops: 1 }, dutyDone: false, ...over });
  const answers = (d: unknown) => ({ "GET /api/v1/shared/expert/bookings": () => json(BOOKINGS), [`GET ${P}`]: () => json(UNLISTED), "GET /api/v1/expert/free-duty": () => json(d) });

  it("says what is left this month and this quarter, with a door to the sessions screen", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", answers(duty({})));
    expect(await screen.findByText("2 free one-to-ones left this month")).toBeTruthy();
    expect(screen.getByText("1 free workshops left this quarter")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Your sessions" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/sessions");
  });

  it("the start duty reads as the first free ones; nothing owed reads as done", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", answers(duty({ oneToOnes: 7, workshops: 2, stage: { oneToOnes: "START", workshops: "START" } })));
    expect(await screen.findByText("7 of your first 10 free one-to-ones still to give")).toBeTruthy();
    expect(screen.getByText("2 of your first 2 free workshops still to give")).toBeTruthy();
  });

  it("nothing owed reads as done", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", answers(duty({ oneToOnes: 0, workshops: 0, dutyDone: true })));
    expect(await screen.findByText("Your free duty for this period is done.")).toBeTruthy();
  });
});

describe("ratings on the marketplace card", () => {
  const expert = (over: Record<string, unknown>) => ({ id: "e1", name: "ZZ Expert", headline: "ZZ Careers adviser", bio: "", organisation: null, specialisms: [], verified: false, offering: "SESSIONS", mentorCapacity: null, mentoringOpen: false, openSlots: [], ...over });
  it("an average from three on, New before", async () => {
    const rated = staffExpertsSchema.parse({ specialisms: [], experts: [expert({ rating: { average: 4.5, count: 12 } }), expert({ id: "e2", name: "ZZ Newcomer", rating: null }), expert({ id: "e3", name: "ZZ Older server" })], bookings: [] });
    await mountStaff(<Experts />, "ADMIN", { "GET /api/v1/staff/experts": () => json(rated) });
    expect(await screen.findByText("4.5 out of 5 from 12 ratings")).toBeTruthy();
    expect(screen.getAllByText("New")).toHaveLength(2);
  });
});

describe("the operator's KYC column", () => {
  const OPERATOR = { user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false }, active: { schoolId: null, role: null, membershipId: null }, contexts: [] };
  const NOW = Date.now();
  const ago = (ms: number) => new Date(NOW - ms).toISOString();
  const EXPERTS = operatorExpertsSchema.parse({
    items: [
      { profileId: "p1", name: "ZZ Papers", email: null, headline: "Robotics coach", organisation: null, specialisms: [], offering: "SESSIONS", mentorCapacity: null, activeMentorships: 0, publishedAt: null, verifiedAt: null, createdAt: ago(86_400_000), kyc: { status: "SUBMITTED", note: "ZZ passport attached", submittedAt: ago(3_600_000), decidedAt: null, documents: [{ fileId: "f-p1", mime: "application/pdf", size: 1200 }] } },
      { profileId: "p2", name: "ZZ Nothing", email: null, headline: "Chess", organisation: null, specialisms: [], offering: "SESSIONS", mentorCapacity: null, activeMentorships: 0, publishedAt: ago(86_400_000), verifiedAt: null, createdAt: ago(86_400_000) },
    ],
  });
  const answers = (over: Answers = {}) => ({
    "GET /api/v1/operator/overview": () => json({ counts: { live: 0, removed: 0, noAdmin: 0, unverified: 0, appAdmins: 0, expertsWaiting: 1 }, schools: [], jobs: [] }),
    "GET /api/v1/operator/experts": () => json(EXPERTS),
    "GET /api/v1/operator/content-team": () => json({ items: [] }),
    "GET /api/v1/operator/audit": () => json({ items: [], total: 0, actions: [] }),
    ...over,
  });
  const mount = (over: Answers = {}) =>
    mountStaff(
      <ToastProvider>
        <OperatorHome />
      </ToastProvider>,
      "ADMIN",
      answers(over),
      { me: OPERATOR },
    );

  it("shows the pill, the note and the document, opens it through a link, and verifies after a confirm", async () => {
    open.mockResolvedValueOnce(null);
    const { calls } = await mount({ "POST /api/v1/operator/experts/p1/kyc": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Experts" }));
    expect(await screen.findByText("Waiting for the operator")).toBeTruthy();
    expect(screen.getByText("ZZ passport attached")).toBeTruthy();
    expect(screen.getByText("No papers sent")).toBeTruthy();
    await fireEvent.press(screen.getByText("Open document 1"));
    expect(open).toHaveBeenCalledWith("f-p1", expect.any(String));
    await fireEvent.press(screen.getByRole("button", { name: "Verify identity: ZZ Papers" }));
    expect(screen.getByText("Verify ZZ Papers's identity? Schools will see the Verified mark.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/experts/p1/kyc")?.body).toEqual({ decision: "VERIFIED", note: "" }));
    expect(await screen.findByText("ZZ Papers is verified")).toBeTruthy();
  });

  it("a rejection needs its reason and sends it", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/experts/p1/kyc": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Experts" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Reject papers: ZZ Papers" }));
    const confirm = screen.getByRole("button", { name: "Confirm" });
    expect(confirm).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Why the papers are not accepted"), "ZZ the scan is unreadable");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/experts/p1/kyc")?.body).toEqual({ decision: "REJECTED", note: "ZZ the scan is unreadable" }));
    expect(await screen.findByText("ZZ Papers's papers were rejected")).toBeTruthy();
  });

  it("a refused decision is said in a toast and the question stays open", async () => {
    await mount({ "POST /api/v1/operator/experts/p1/kyc": refused("ZZ nothing sent", 422) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Experts" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Verify identity: ZZ Papers" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("ZZ nothing sent")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.getByRole("button", { name: "Verify identity: ZZ Papers" })).toBeTruthy();
  });
});
