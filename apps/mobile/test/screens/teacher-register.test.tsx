import { screen, waitFor } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";
import { attendanceClassesSchema, registerSchema } from "@edulink/contracts";
import { Register } from "@/screens/teacher/register";
import { listQueued } from "@/lib/outbox";
import { flushOutbox } from "@/lib/outbox-runner";
import { callsTo, fakeApi, ID, json, offline, refusal, renderTeacher, resetOutbox, tap } from "./teacher-support";

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

  it("with nobody to mark, says so", async () => {
    fakeApi({ "/api/v1/staff/attendance/classes": () => json({ ...CLASSES, classes: [], unmarkedCount: 0 }) });
    await renderTeacher(<Register />);
    await screen.findByText("No attendance for you today");
  });

  it("a refused list is an alert with a retry", async () => {
    fakeApi({ "/api/v1/staff/attendance/classes": () => refusal("ZZ not allowed", 403) });
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
