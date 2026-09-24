import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffAdmissions } from "@/screens/staff/admissions";
import { AdmissionSlots } from "@/screens/staff/admission-slots";
import { StaffApplications } from "@/screens/staff/applications";
import { A1, A2, CLOSED_CYCLE, CYCLE, CYCLES_VIEW, row, slot, SLOT1, SLOT2 } from "./admissions-fixtures";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CYCLES = "GET /api/v1/office/admissions/cycles";
const STATUS = (id: string) => `POST /api/v1/office/admissions/cycles/${id}/status`;
const PURGE = (id: string) => `POST /api/v1/office/admissions/cycles/${id}/purge`;
const SLOTS = (id: string) => `/api/v1/office/admissions/cycles/${id}/slots`;
const PIPELINE = "GET /api/v1/office/admissions/applications";

const answers = (): Answers => ({ [CYCLES]: () => json(CYCLES_VIEW) });
const compose = (ui: React.ReactElement) => <ToastProvider>{ui}</ToastProvider>;

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = {};
});

describe("the office's admission cycles", () => {
  it("loads every cycle with its status, its seats per grade and the counts at each stage, and opens the sittings and the pipeline", async () => {
    await mountStaff(compose(<StaffAdmissions />), "ADMIN", answers());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByText("ZZ Admissions 2026-27")).toBeTruthy();
    // "Open" is the open cycle's pill and the closed cycle's button; "Closed" is a pill alone.
    expect(screen.getAllByText("Open")).toHaveLength(2);
    expect(screen.getByText("Closed")).toBeTruthy();
    expect(screen.getAllByText("Grade 1 · 5 seats")).toHaveLength(2);
    expect(screen.getAllByText("Applied 3 · Offered 1 · Accepted 1 · Admitted 0 · Waitlisted 1")).toHaveLength(2);
    // The open cycle closes; the closed one opens again and can be purged.
    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Open" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Delete the forms not admitted" })).toHaveLength(1);
    await fireEvent.press(screen.getAllByRole("button", { name: /^Entrance-test sittings/ })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/admission-slots", params: { id: CYCLE } });
    await fireEvent.press(screen.getAllByRole("button", { name: "Applications" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/applications");
  });

  it("closes an open cycle with one post and says so", async () => {
    const { calls } = await mountStaff(compose(<StaffAdmissions />), "PRINCIPAL", { ...answers(), [STATUS(CYCLE)]: () => json({ ...CYCLES_VIEW.cycles[0], status: "CLOSED" }) });
    await screen.findByText("ZZ Admissions 2026-27");
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(calls().some((c) => c.line === STATUS(CYCLE))).toBe(true));
    expect(calls().find((c) => c.line === STATUS(CYCLE))!.body).toEqual({ status: "CLOSED" });
    expect(await screen.findByText("The cycle is closed.")).toBeTruthy();
  });

  it("opens a closed cycle", async () => {
    const { calls } = await mountStaff(compose(<StaffAdmissions />), "ADMIN", { ...answers(), [STATUS(CLOSED_CYCLE)]: () => json({ ...CYCLES_VIEW.cycles[1], status: "OPEN" }) });
    await screen.findByText("ZZ Admissions 2026-27");
    await fireEvent.press(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(calls().find((c) => c.line === STATUS(CLOSED_CYCLE))?.body).toEqual({ status: "OPEN" }));
    expect(await screen.findByText("The cycle is open. It shows on your page in the directory.")).toBeTruthy();
  });

  it("the head opens and closes a cycle and never sees the purge", async () => {
    await mountStaff(compose(<StaffAdmissions />), "PRINCIPAL", answers());
    await screen.findByText("ZZ Admissions 2026-27");
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete the forms not admitted" })).toBeNull();
  });

  it("purging a closed cycle asks first, then posts and counts what went", async () => {
    const { calls } = await mountStaff(compose(<StaffAdmissions />), "ADMIN", { ...answers(), [PURGE(CLOSED_CYCLE)]: () => json({ ok: true, removed: 2 }) });
    await screen.findByText("ZZ Admissions 2026-27");
    await fireEvent.press(screen.getByRole("button", { name: "Delete the forms not admitted" }));
    expect(screen.getByText("Delete the forms and documents of every family this cycle did not admit?")).toBeTruthy();
    expect(calls().some((c) => c.line === PURGE(CLOSED_CYCLE))).toBe(false);
    // The question's own button carries the same words; cancelling takes it away.
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Delete the forms and documents of every family this cycle did not admit?")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Delete the forms not admitted" }));
    await fireEvent.press(screen.getAllByRole("button", { name: "Delete the forms not admitted" }).at(-1)!);
    await waitFor(() => expect(calls().some((c) => c.line === PURGE(CLOSED_CYCLE))).toBe(true));
    expect(await screen.findByText("Removed 2 applications.")).toBeTruthy();
  });

  it("a refused status change is a toast, and the button stays", async () => {
    await mountStaff(compose(<StaffAdmissions />), "ADMIN", { ...answers(), [STATUS(CYCLE)]: refused("ZZ add a grade first", 409) });
    await screen.findByText("ZZ Admissions 2026-27");
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(await screen.findByText("ZZ add a grade first")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });

  it("with no cycle, the door is the web's editor", async () => {
    await mountStaff(compose(<StaffAdmissions />), "ADMIN", { [CYCLES]: () => json({ cycles: [], years: [], structures: [] }) });
    expect(await screen.findByText("No cycle yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "New cycle" })).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(compose(<StaffAdmissions />), "ADMIN", { [CYCLES]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("a cycle's sittings", () => {
  it("lists each with its places, marks a cancelled one, and cancels one with a post", async () => {
    mockRouter.params = { id: CYCLE };
    const { calls } = await mountStaff(compose(<AdmissionSlots />), "ADMIN", {
      [`GET ${SLOTS(CYCLE)}`]: () => json({ slots: [slot(SLOT1), slot(SLOT2, { booked: 0, cancelledAt: "2026-09-10T05:00:00.000Z" })] }),
      [`POST /api/v1/office/admissions/slots/${SLOT1}/cancel`]: () => json({ ok: true, released: 2 }),
    });
    expect(await screen.findByText("2 of 5 booked")).toBeTruthy();
    expect(screen.getByText("0 of 5 booked")).toBeTruthy();
    expect(screen.getAllByText(/ZZ Hall$/)).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Cancel" })).toHaveLength(1);
    expect(screen.getByText("Cancelled")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST /api/v1/office/admissions/slots/${SLOT1}/cancel`)).toBe(true));
  });

  it("publishes a run of sittings from a day and a time, refusing a blank day, and says how many were made", async () => {
    mockRouter.params = { id: CYCLE };
    const { calls } = await mountStaff(compose(<AdmissionSlots />), "PRINCIPAL", { [`GET ${SLOTS(CYCLE)}`]: () => json({ slots: [] }), [`POST ${SLOTS(CYCLE)}`]: () => json({ created: 3 }) });
    expect(await screen.findByText("No sittings yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Publish sittings" }));
    expect(screen.getAllByText("This is required.").length).toBeGreaterThan(0);
    expect(calls().some((c) => c.line === `POST ${SLOTS(CYCLE)}`)).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Date"), "2031-01-15");
    await fireEvent.changeText(screen.getByLabelText("Time"), "10:00");
    await fireEvent.changeText(screen.getByLabelText("How many in a row"), "3");
    await fireEvent.changeText(screen.getByLabelText("Where"), "ZZ Hall");
    await fireEvent.press(screen.getByRole("button", { name: "Publish sittings" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${SLOTS(CYCLE)}`)).toBe(true));
    const body = calls().find((c) => c.line === `POST ${SLOTS(CYCLE)}`)!.body as Record<string, unknown>;
    expect(body).toMatchObject({ durationMinutes: 30, count: 3, capacity: 10, location: "ZZ Hall" });
    // The instant is the typed day and clock in this phone's zone, sent as ISO.
    expect(new Date(body.startsAt as string).getTime()).toBe(new Date(2031, 0, 15, 10, 0, 0, 0).getTime());
    expect(body).not.toHaveProperty("note");
    expect(await screen.findByText("Published 3 sittings.")).toBeTruthy();
  });
});

describe("the pipeline", () => {
  it("lists every application with its stage, names what is still to attach, filters by stage, and opens one", async () => {
    const { calls } = await mountStaff(compose(<StaffApplications />), "ADMIN", {
      ...answers(),
      [PIPELINE]: ({ url }) => json({ items: url.searchParams.get("status") === "OFFERED" ? [row(A2, { childName: "ZZ Meera", serial: "ADM/2026-27/0002", status: "OFFERED" })] : [row(A1, { documentsMissing: 1 }), row(A2, { childName: "ZZ Meera", serial: "ADM/2026-27/0002", status: "OFFERED" })] }),
    });
    expect(await screen.findByText("ZZ Kabir")).toBeTruthy();
    expect(screen.getByText("ADM/2026-27/0001 · Grade 1 · ZZ Parent · Documents still to attach: 1")).toBeTruthy();
    expect(screen.getByText("ZZ Meera")).toBeTruthy();
    expect(screen.getAllByText("Offered").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole("radio", { name: "Offered" }));
    await waitFor(() => expect(calls().some((c) => c.line === `${PIPELINE}?status=OFFERED`)).toBe(true));
    await waitFor(() => expect(screen.queryByText("ZZ Kabir")).toBeNull());
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Meera/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/application", params: { id: A2 } });
  });

  it("opened on a cycle, asks for that cycle and offers the walk-in form on it", async () => {
    mockRouter.params = { cycleId: CYCLE };
    const { calls } = await mountStaff(compose(<StaffApplications />), "ADMIN", { ...answers(), [PIPELINE]: () => json({ items: [] }) });
    expect(await screen.findByText("No applications yet")).toBeTruthy();
    expect(calls().some((c) => c.line === `${PIPELINE}?cycleId=${CYCLE}`)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Enter a walk-in" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/application-new", params: { cycleId: CYCLE } });
  });
});
