import { screen, waitFor, within } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { onlineManager } from "@tanstack/react-query";
import { attendanceClassesSchema, registerSchema } from "@edulink/contracts";
import { Register } from "@/screens/teacher/register";
import { listQueued } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-runner";
import { callsTo, fakeApi, ID, json, offline, refusal, renderTeacher, resetOutbox, tap } from "./teacher-support";
import { fakeEvents } from "./live-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASSES = attendanceClassesSchema.parse({
  dateKey: "2026-09-07",
  today: "2026-09-07",
  calendar: { closed: false, entries: [], nonTeachingDay: false },
  classes: [
    { id: ID.class1, name: "ZZ 5A", subject: null, color: null, students: 2, taken: false },
    { id: ID.class2, name: "ZZ 5B", subject: "Science", color: null, students: 1, taken: true },
  ],
  unmarkedCount: 1,
});
const REGISTER = registerSchema.parse({
  class: { id: ID.class1, name: "ZZ 5A", subject: null, color: null },
  dateKey: "2026-09-07",
  roster: [
    { membershipId: ID.pupil1, name: "ZZ Asha", fullName: "ZZ Asha Rao", avatarKey: null, status: null, note: null },
    { membershipId: ID.pupil2, name: "ZZ Bhavesh", fullName: "ZZ Bhavesh Patil", avatarKey: null, status: "PRESENT", note: "Left early" },
  ],
  finalizedAt: null,
  takenAt: null,
  duty: { reason: "CLASS_TEACHER", coverUntil: null },
  readOnly: false,
  calendar: { closed: false, entries: [], nonTeachingDay: false },
});
const SAVED = { applied: 1, rejected: [] };
const slow = { timeout: 3000 };

beforeEach(() => {
  resetOutbox();
  mockRouter.params = {};
});

describe("the register", () => {
  it("lists the classes I am down to mark, and a row opens that class's register", async () => {
    const fetch = fakeApi({ "/api/v1/staff/attendance/classes": () => json(CLASSES), "/api/v1/staff/attendance/register": () => json(REGISTER) });
    await renderTeacher(<Register />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("Attendance to do");
    expect(screen.getByText("Attendance done")).toBeTruthy();
    await tap(screen.getByRole("button", { name: /ZZ 5A, 2 students/ }));
    await screen.findByText("1 of 2 marked");
    expect(callsTo(fetch, "/api/v1/staff/attendance/register")[0]!.url.searchParams.get("classId")).toBe(ID.class1);
    expect(screen.getByText("Note for ZZ Bhavesh: Left early")).toBeTruthy();
  });

  it("the family's absence note for the day sits under the pupil's name", async () => {
    mockRouter.params = { classId: ID.class1 };
    const roster = [
      { ...REGISTER.roster[0]!, absenceNote: { reason: "ILLNESS", text: "Fever since last night.", byFamily: true } },
      { ...REGISTER.roster[1]!, absenceNote: { reason: "RELIGIOUS", text: "", byFamily: false } },
    ];
    fakeApi({ "/api/v1/staff/attendance/register": () => json({ ...REGISTER, roster }) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    expect(screen.getByText("Absent — Illness, told by the family · “Fever since last night.”")).toBeTruthy();
    expect(screen.getByText("Absent — Religious observance, told by the pupil")).toBeTruthy();
    // An older server's answer, with no note at all, still parses.
    expect(registerSchema.parse(REGISTER).roster[0]!.absenceNote).toBeUndefined();
  });

  it("with nobody to mark, says so", async () => {
    fakeApi({ "/api/v1/staff/attendance/classes": () => json({ ...CLASSES, classes: [], unmarkedCount: 0 }) });
    await renderTeacher(<Register />);
    await screen.findByText("No attendance for you today");
  });

  it("a refused list is an alert with a retry", async () => {
    fakeApi({ "/api/v1/staff/attendance/classes": () => refusal("ZZ not allowed", 503) });
    await renderTeacher(<Register />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not allowed");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a tap on a status buzzes, and sends one batch with a client id 700 ms later", async () => {
    const buzz = jest.spyOn(Haptics, "impactAsync");
    mockRouter.params = { classId: ID.class1 };
    const fetch = fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => json(SAVED) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    const radios = screen.getAllByRole("radio", { name: "Late" });
    await tap(radios[0]!);
    expect(buzz).toHaveBeenCalled();
    expect(screen.getByText("Attendance complete")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), slow);
    const [call] = callsTo(fetch, "/api/attendance");
    expect(call!.method).toBe("POST");
    const body = call!.body as { classId: string; dateKey: string; marks: { studentMembershipId: string; status: string; clientId: string; markedAt: string }[] };
    expect(body.classId).toBe(ID.class1);
    expect(body.dateKey).toBe("2026-09-07");
    expect(body.marks).toHaveLength(1);
    expect(body.marks[0]).toMatchObject({ studentMembershipId: ID.pupil1, status: "LATE" });
    expect(body.marks[0]!.clientId.length).toBeGreaterThanOrEqual(8);
    expect(body.marks[0]!.markedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("mark all present fills in everyone unmarked, and only them", async () => {
    mockRouter.params = { classId: ID.class1 };
    const fetch = fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => json(SAVED) });
    await renderTeacher(<Register />);
    await tap(await screen.findByRole("button", { name: "Mark all 1 present" }));
    await waitFor(() => expect(callsTo(fetch, "/api/attendance")).toHaveLength(1), slow);
    const body = callsTo(fetch, "/api/attendance")[0]!.body as { marks: { studentMembershipId: string; status: string }[] };
    expect(body.marks).toEqual([expect.objectContaining({ studentMembershipId: ID.pupil1, status: "PRESENT" })]);
  });

  it("offline, the batch goes to the outbox and the screen says so; back online, it replays with the replay header", async () => {
    mockRouter.params = { classId: ID.class1 };
    const fetch = fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": offline });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await tap(screen.getAllByRole("radio", { name: "Absent" })[0]!);
    await waitFor(() => expect(screen.getByText("Saved on this device")).toBeTruthy(), slow);
    expect(screen.getByText("1 waiting to send")).toBeTruthy();
    const queued = await listQueued(`attendance:${ID.class1}`);
    expect(queued).toHaveLength(1);
    expect(queued[0]!.url).toBe("/api/attendance");
    expect(JSON.parse(queued[0]!.body).marks[0]).toMatchObject({ studentMembershipId: ID.pupil1, status: "ABSENT" });

    fetch.mockImplementation(async () => json(SAVED));
    expect(await flushOutbox()).toEqual({ sent: 1, failed: 0, remaining: 0 });
    const replay = callsTo(fetch, "/api/attendance").at(-1)!;
    expect(replay.headers["X-Edulink-Replay"]).toBe("1");
    expect(replay.headers.Authorization).toBe("Bearer t");
    expect(replay.body).toEqual(JSON.parse(queued[0]!.body));
    await waitFor(() => expect(screen.queryByText("1 waiting to send")).toBeNull());
    // Sent from the outbox, the line says the marks reached the school, not "Saved on this device" (A3-journeys-32).
    await waitFor(() => expect(screen.getByTestId("register-state")).toHaveTextContent("Sent: the marks reached the school."));
    expect(screen.queryByText("Saved on this device")).toBeNull();
  });

  it("names each pupil's Present/Late/Absent/Excused as one group, as the web's register does (A3-journeys-32)", async () => {
    mockRouter.params = { classId: ID.class1 };
    fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    const group = screen.getByTestId(`register-group-${ID.pupil1}`);
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(group.props.accessibilityLabel).toBe("Attendance for ZZ Asha");
    expect(within(group).getAllByRole("radio").map((r) => r.props.accessibilityLabel)).toEqual(["Present", "Late", "Absent", "Excused"]);
    expect(screen.getByTestId(`register-group-${ID.pupil2}`).props.accessibilityLabel).toBe("Attendance for ZZ Bhavesh");
  });

  it("known to be offline, a tap goes straight to the outbox with no fetch first, as the web's register does", async () => {
    mockRouter.params = { classId: ID.class1 };
    const fetch = fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => json(SAVED) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    onlineManager.setOnline(false);
    try {
      // Offline before anything is marked: the line says the marks will wait, not "Ready" (A3-journeys-32).
      await waitFor(() => expect(screen.getByTestId("register-state")).toHaveTextContent("Offline: marks stay on this device and send when you are back."));
      expect(screen.queryByText("Ready")).toBeNull();
      await tap(screen.getAllByRole("radio", { name: "Late" })[0]!);
      await waitFor(() => expect(screen.getByText("1 waiting to send")).toBeTruthy(), slow);
      expect(screen.getByTestId("register-state")).toHaveTextContent("Offline: marks stay on this device and send when you are back.");
      expect(callsTo(fetch, "/api/attendance")).toHaveLength(0);
      const queued = await listQueued(`attendance:${ID.class1}`);
      expect(queued).toHaveLength(1);
      expect(JSON.parse(queued[0]!.body)).toMatchObject({ classId: ID.class1, dateKey: "2026-09-07" });
    } finally {
      onlineManager.setOnline(true);
    }
    // Back online: the runner hears it and replays, byte for byte.
    await waitFor(() => expect(callsTo(fetch, "/api/attendance")).toHaveLength(1), slow);
    expect(callsTo(fetch, "/api/attendance")[0]!.headers["X-Edulink-Replay"]).toBe("1");
    await waitFor(() => expect(screen.queryByText("1 waiting to send")).toBeNull());
    expect(await listQueued()).toHaveLength(0);
    await waitFor(() => expect(screen.getByTestId("register-state")).toHaveTextContent("Sent: the marks reached the school."));
  });

  it("a mark the server would not take (a pupil no longer in the class) is said beside the saved state", async () => {
    mockRouter.params = { classId: ID.class1 };
    fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => json({ applied: 0, rejected: [{ studentMembershipId: ID.pupil1, reason: "NOT_ENROLLED" }] }) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await tap(screen.getAllByRole("radio", { name: "Present" })[0]!);
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), slow);
    expect(screen.getByText("Some marks were not saved: 1 student(s) are no longer in this class.")).toBeTruthy();
  });

  it("TA-029: a mark the server skipped for a later one it already holds is said beside the saved state", async () => {
    mockRouter.params = { classId: ID.class1 };
    fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => json({ applied: 0, skipped: 1, rejected: [] }) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await tap(screen.getAllByRole("radio", { name: "Absent" })[0]!);
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), slow);
    expect(screen.getByText("1 mark(s) were not saved: the register already holds a later mark for them. Reload to see it.")).toBeTruthy();
  });

  it("a save the server took whole says nothing more than Saved", async () => {
    mockRouter.params = { classId: ID.class1 };
    fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => json({ applied: 1, skipped: 0, rejected: [] }) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await tap(screen.getAllByRole("radio", { name: "Absent" })[0]!);
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), slow);
    expect(screen.queryByText(/were not saved/)).toBeNull();
  });

  it("a refusal the server means is shown with a retry, not queued", async () => {
    mockRouter.params = { classId: ID.class1 };
    fakeApi({ "/api/v1/staff/attendance/register": () => json(REGISTER), "/api/attendance": () => refusal("ZZ future date", 422) });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await tap(screen.getAllByRole("radio", { name: "Excused" })[0]!);
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("ZZ future date"), slow);
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(await listQueued()).toHaveLength(0);
  });

  it("a future register is read only", async () => {
    mockRouter.params = { classId: ID.class1, date: "2026-09-08" };
    const fetch = fakeApi({ "/api/v1/staff/attendance/register": () => json({ ...REGISTER, dateKey: "2026-09-08", readOnly: true }) });
    await renderTeacher(<Register />);
    await screen.findByText("You cannot mark attendance for a future date.");
    expect(callsTo(fetch, "/api/v1/staff/attendance/register")[0]!.url.searchParams.get("date")).toBe("2026-09-08");
    expect(screen.getAllByRole("radio", { name: "Present" })[0]).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Mark all/ })).toBeNull();
  });
});

/**
 * The register hears the event stream: a colleague's save re-reads the
 * roster and says so for a moment; the device's own save (every clientId on
 * the event is one this screen minted) is left alone; and a mark the server
 * has not yet confirmed stays the teacher's through the re-read.
 */
describe("the register, live", () => {
  afterEach(() => fakeEvents().reset());

  it("a colleague's marks re-read the roster and say 'Updated by a colleague.'; the device's own event is ignored", async () => {
    const live = fakeEvents();
    mockRouter.params = { classId: ID.class1 };
    let reads = 0;
    const fetch = fakeApi({
      "/api/v1/staff/attendance/register": () => json(++reads === 1 ? REGISTER : { ...REGISTER, roster: [{ ...REGISTER.roster[0]!, status: "ABSENT" }, REGISTER.roster[1]!] }),
      "/api/attendance": () => json(SAVED),
    });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await live.opened();
    expect(live.opens).toBe(1);
    expect(screen.queryByText("Updated by a colleague.")).toBeNull();

    // Another class's register changing is not this one's.
    live.event("attendance.updated", { classId: ID.class2, dateKey: "2026-09-07", clientIds: ["zz-other-1"] });
    await new Promise((r) => setTimeout(r, 20));
    expect(callsTo(fetch, "/api/v1/staff/attendance/register")).toHaveLength(1);

    live.keepAlive();
    live.event("attendance.updated", { classId: ID.class1, dateKey: "2026-09-07", clientIds: ["zz-colleague-1"] });
    await screen.findByText("Updated by a colleague.");
    expect(callsTo(fetch, "/api/v1/staff/attendance/register")).toHaveLength(2);
    await screen.findByText("Attendance complete");
    expect(screen.getAllByRole("radio", { name: "Absent" })[0]).toBeChecked();

    // The teacher's own tap: the event the server sends back carries the clientId this screen minted, and nothing is re-read.
    await tap(screen.getAllByRole("radio", { name: "Late" })[1]!);
    await waitFor(() => expect(screen.getByText("Saved")).toBeTruthy(), slow);
    const sent = callsTo(fetch, "/api/attendance")[0]!.body as { marks: { clientId: string }[] };
    live.event("attendance.updated", { classId: ID.class1, dateKey: "2026-09-07", clientIds: [sent.marks[0]!.clientId] });
    await new Promise((r) => setTimeout(r, 20));
    expect(callsTo(fetch, "/api/v1/staff/attendance/register")).toHaveLength(2);
  });

  it("a mark not yet confirmed by the server stays the teacher's through a colleague's re-read", async () => {
    const live = fakeEvents();
    mockRouter.params = { classId: ID.class1 };
    let reads = 0;
    fakeApi({
      // The second read says the colleague marked both absent.
      "/api/v1/staff/attendance/register": () => json(++reads === 1 ? REGISTER : { ...REGISTER, roster: REGISTER.roster.map((p) => ({ ...p, status: "ABSENT" })) }),
      "/api/attendance": offline,
    });
    await renderTeacher(<Register />);
    await screen.findByText("1 of 2 marked");
    await live.opened();
    // The teacher marks the first pupil late; the network is not there, so the mark waits in the outbox, unconfirmed.
    await tap(screen.getAllByRole("radio", { name: "Late" })[0]!);
    await waitFor(() => expect(screen.getByText("Saved on this device")).toBeTruthy(), slow);
    live.event("attendance.updated", { classId: ID.class1, dateKey: "2026-09-07", clientIds: ["zz-colleague-2"] });
    await screen.findByText("Updated by a colleague.");
    // The first pupil is still the teacher's "Late"; the second is the colleague's "Absent".
    expect(screen.getAllByRole("radio", { name: "Late" })[0]).toBeChecked();
    expect(screen.getAllByRole("radio", { name: "Absent" })[0]).not.toBeChecked();
    expect(screen.getAllByRole("radio", { name: "Absent" })[1]).toBeChecked();
  });
});
