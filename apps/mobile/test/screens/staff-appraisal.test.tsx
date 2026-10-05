import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { appraisalsSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { MyAppraisals, StaffAppraisal, appraisalsPath, toBody } from "@/screens/staff/appraisal";
import { json, mountStaff, offline } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const STAFF = "czz0000000000000000st1";
const ENTRY = "czz0000000000000000ap1";
const PATH = appraisalsPath(STAFF);
const ONE = "/api/v1/principal/appraisals/" + ENTRY;

const entry = (over: Partial<Record<string, unknown>> = {}) => ({ id: ENTRY, staffMembershipId: STAFF, year: "2026–27", kind: "OBSERVATION", dateKey: "2026-09-15", summary: "A lively lesson on fractions.", strengths: "Questions to every row.", targets: null, rating: 4, visibleToStaff: false, appraiserName: "ZZ Head", updatedAt: "2026-09-15T10:00:00.000Z", ...over });
const VIEW = appraisalsSchema.parse({ staffMembershipId: STAFF, name: "ZZ Asha", role: "TEACHER", year: "2026–27", canEdit: true, items: [entry()] });

const page = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { membershipId: STAFF };
});

describe("the body the form sends", () => {
  it("trims, blanks to null, and reads the rating as a number", () => {
    expect(toBody({ kind: "TARGET", dateKey: " 2026-09-15 ", summary: " Agreed. ", strengths: "  ", targets: " Mark on time. ", rating: "3", visibleToStaff: true })).toEqual({ kind: "TARGET", dateKey: "2026-09-15", summary: "Agreed.", strengths: null, targets: "Mark on time.", rating: 3, visibleToStaff: true });
    expect(toBody({ kind: "OBSERVATION", dateKey: "2026-09-15", summary: "x", strengths: "", targets: "", rating: "", visibleToStaff: false }).rating).toBeNull();
  });
});

describe("the head's notes on a member of staff", () => {
  it("lists the timeline with kind, day, rating and whether it is visible; the office reads with nothing to press", async () => {
    await mountStaff(page(<StaffAppraisal />), "ADMIN", { [`GET ${PATH}`]: () => json({ ...VIEW, canEdit: false }) });
    expect(await screen.findByText("ZZ Asha: observations and appraisal")).toBeTruthy();
    expect(screen.getByText("New entries are filed under 2026–27.")).toBeTruthy();
    expect(screen.getByText("Observation")).toBeTruthy();
    expect(screen.getByText("15/09/2026")).toBeTruthy();
    expect(screen.getByText("4/5")).toBeTruthy();
    expect(screen.getByText("Only the head and the office")).toBeTruthy();
    expect(screen.getByText("A lively lesson on fractions.")).toBeTruthy();
    expect(screen.getByText("Strengths: Questions to every row.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add an entry" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Edit:/ })).toBeNull();
  });

  it("the head adds an entry: the form refuses a blank summary, posts the kind, day, texts, rating and visibility, then rereads", async () => {
    const { calls } = await mountStaff(page(<StaffAppraisal />), "PRINCIPAL", { [`GET ${PATH}`]: () => json({ ...VIEW, items: [] }), [`POST ${PATH}`]: () => json({ id: "czz0000000000000000ap2" }, 201) });
    expect(await screen.findByText("Nothing written yet. Add an observation after a lesson, a target, or the year’s appraisal.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Add an entry" })[0]!);
    await fireEvent.press(screen.getByRole("radio", { name: "Target" }));
    // With the form open, its own submit is the first "Add an entry" on the screen; the empty state's door is the second.
    await fireEvent.press(screen.getAllByRole("button", { name: "Add an entry" })[0]!);
    expect(screen.getByText("Write at least a line.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${PATH}`)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("What you saw or agreed"), "Mark the books by Friday.");
    await fireEvent.press(screen.getByRole("radio", { name: "3/5" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Visible to them" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Add an entry" })[0]!);
    expect(await screen.findByText("Saved.")).toBeTruthy();
    const sent = calls().find((c) => c.line === `POST ${PATH}`);
    expect(sent?.body).toMatchObject({ kind: "TARGET", summary: "Mark the books by Friday.", strengths: null, targets: null, rating: 3, visibleToStaff: true });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });

  it("show sends the whole entry back with visibleToStaff flipped; remove asks first, then deletes and rereads", async () => {
    const { calls } = await mountStaff(page(<StaffAppraisal />), "PRINCIPAL", { [`GET ${PATH}`]: () => json(VIEW), [`PUT ${ONE}`]: () => json({ id: ENTRY }), [`DELETE ${ONE}`]: () => json({ changed: true }) });
    await screen.findByText("ZZ Asha: observations and appraisal");
    await fireEvent.press(screen.getByRole("button", { name: "Show them: A lively lesson on fractions." }));
    expect(await screen.findByText("They can read this entry now.")).toBeTruthy();
    const put = calls().find((c) => c.line === `PUT ${ONE}`);
    expect(put?.body).toEqual({ kind: "OBSERVATION", dateKey: "2026-09-15", summary: "A lively lesson on fractions.", strengths: "Questions to every row.", targets: null, rating: 4, visibleToStaff: true });
    await fireEvent.press(screen.getByRole("button", { name: "Remove: A lively lesson on fractions." }));
    expect(calls().some((c) => c.line === `DELETE ${ONE}`)).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Yes, remove it" }));
    expect(await screen.findByText("The entry was removed.")).toBeTruthy();
    expect(calls().some((c) => c.line === `DELETE ${ONE}`)).toBe(true);
  });

  it("offline: the failure shows with a retry", async () => {
    await mountStaff(page(<StaffAppraisal />), "PRINCIPAL", { [`GET ${PATH}`]: offline });
    expect(await screen.findByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("what the head has shown me", () => {
  const MINE = "GET /api/v1/staff/me/appraisals";
  it("lists my visible entries read-only; nothing shared is an empty state", async () => {
    await mountStaff(page(<MyAppraisals />), "TEACHER", { [MINE]: () => json({ items: [entry({ visibleToStaff: true, kind: "APPRAISAL" })] }) });
    expect(await screen.findByText("My appraisal")).toBeTruthy();
    expect(await screen.findByText("Appraisal")).toBeTruthy();
    expect(screen.getByText("A lively lesson on fractions.")).toBeTruthy();
    expect(screen.getByText("2026–27 · by ZZ Head")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Edit:/ })).toBeNull();
    await mountStaff(page(<MyAppraisals />), "TEACHER", { [MINE]: () => json({ items: [] }) });
    expect(await screen.findByText("Nothing shared with you yet")).toBeTruthy();
  });

  it("a college's FACULTY and HOD read theirs through the same door (A3-inventory-5)", async () => {
    for (const role of ["FACULTY", "HOD"] as const) {
      const { calls } = await mountStaff(page(<MyAppraisals />), role, { [MINE]: () => json({ items: [entry({ visibleToStaff: true, kind: "APPRAISAL" })] }) });
      expect(await screen.findByText("A lively lesson on fractions.")).toBeTruthy();
      expect(calls().some((c) => c.line === MINE)).toBe(true);
    }
  });
});
