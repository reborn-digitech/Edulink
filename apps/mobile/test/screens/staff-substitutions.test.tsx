import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { substitutionBoardSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Substitutions } from "@/screens/staff/substitutions";
import { json, mountStaff, type Answers } from "./staff-harness";
import { fakeEvents } from "./live-support";

/** The screen's doors go into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ANITA = "czz0000000000000000sa1";
const BALA = "czz0000000000000000sa2";
const CHITRA = "czz0000000000000000sa3";
const DEV = "czz0000000000000000sa4";
const ESHA = "czz0000000000000000sa5";
const MATHS = "czz0000000000000000sl1";
const ENGLISH = "czz0000000000000000sl2";
const SCIENCE = "czz0000000000000000sl3";
const PATH = "/api/v1/office/substitutions";

const DEV_FREE = { membershipId: DEV, name: "ZZ Dev", role: "TEACHER", free: true, teachesSubject: true, load: 2 };
const ESHA_BUSY = { membershipId: ESHA, name: "ZZ Esha", role: "TEACHER", free: false, teachesSubject: false, load: 5 };

const BOARD = substitutionBoardSchema.parse({
  dateKey: "2026-09-17",
  closed: false,
  closedName: null,
  absent: [
    { membershipId: ANITA, name: "ZZ Anita", reason: "ABSENT", lessons: 2, covered: 1 },
    { membershipId: BALA, name: "ZZ Bala", reason: "ON_LEAVE", lessons: 1, covered: 0 },
  ],
  lessons: [
    {
      slotId: MATHS,
      periodId: "p1",
      periodName: "Period 1",
      position: 0,
      startMinute: 540,
      endMinute: 580,
      classId: "c1",
      className: "ZZ 5A",
      subject: "Maths",
      room: "Room 3",
      absentMembershipId: ANITA,
      absentName: "ZZ Anita",
      absentReason: "ABSENT",
      substitute: { membershipId: CHITRA, name: "ZZ Chitra", note: "Worksheet 4" },
      candidates: [DEV_FREE, ESHA_BUSY],
    },
    {
      slotId: ENGLISH,
      periodId: "p2",
      periodName: "Period 2",
      position: 1,
      startMinute: 580,
      endMinute: 620,
      classId: "c2",
      className: "ZZ 5B",
      subject: "English",
      room: null,
      absentMembershipId: ANITA,
      absentName: "ZZ Anita",
      absentReason: "ABSENT",
      substitute: null,
      candidates: [DEV_FREE, ESHA_BUSY],
    },
    {
      slotId: SCIENCE,
      periodId: "p3",
      periodName: null,
      position: 2,
      startMinute: null,
      endMinute: null,
      classId: "c3",
      className: "ZZ 6A",
      subject: "Science",
      room: "Lab",
      absentMembershipId: BALA,
      absentName: "ZZ Bala",
      absentReason: "ON_LEAVE",
      substitute: null,
      candidates: [{ ...DEV_FREE, teachesSubject: false }],
    },
  ],
  covered: 1,
  uncovered: 2,
});

/** The board answers for whichever day is asked, echoing the date so the arrows can be seen to move it. */
const answers = (changed = true): Answers => ({
  [`GET ${PATH}`]: ({ url }) => json({ ...BOARD, dateKey: url.searchParams.get("date") ?? BOARD.dateKey }),
  [`POST ${PATH}`]: () => json({ changed }),
  [`POST ${PATH}/clear`]: () => json({ changed: true }),
});

const compose = () => (
  <ToastProvider>
    <Substitutions />
  </ToastProvider>
);

describe("the substitution board", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads the day: the count covered, who is away and why, each lesson with its substitute or its candidates", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("Maths · ZZ 5A");
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByText("3 lessons to cover · 1 of 3 covered")).toBeTruthy();
    expect(screen.getByText("Absent · 1 of 2 covered")).toBeTruthy();
    expect(screen.getByText("On leave · 0 of 1 covered")).toBeTruthy();
    expect(screen.getByText("Period 1 · 09:00–09:40 · Room 3")).toBeTruthy();
    expect(screen.getByText("Period 2 · 09:40–10:20")).toBeTruthy();
    // A period with no name and no clock is named by its number.
    expect(screen.getByText("Period 3 · Lab")).toBeTruthy();
    expect(screen.getAllByText("Away: ZZ Anita · Absent")).toHaveLength(2);
    expect(screen.getByText("Away: ZZ Bala · On leave")).toBeTruthy();
    expect(screen.getByText("Substitute: ZZ Chitra")).toBeTruthy();
    expect(screen.getByText("Note: Worksheet 4")).toBeTruthy();
    expect(screen.getAllByText("Substitute: Nobody yet")).toHaveLength(2);
    expect(screen.getByText("Covered")).toBeTruthy();
    expect(screen.getAllByText("Uncovered")).toHaveLength(2);
    // The covered lesson keeps its picker folded away; the two uncovered ones list their candidates.
    expect(screen.getAllByRole("radio", { name: "ZZ Dev" })).toHaveLength(2);
    expect(screen.getAllByRole("radio", { name: "ZZ Esha" })).toHaveLength(1);
    expect(screen.getByText("Free · Teaches English · 2 today")).toBeTruthy();
    expect(screen.getByText("Busy that period · 5 today")).toBeTruthy();
    expect(screen.getByText("Free · 2 today")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Assign: English · ZZ 5B" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Change: Maths · ZZ 5A" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear: Maths · ZZ 5A" })).toBeTruthy();
  });

  it("picking a candidate and assigning posts the lesson, the person and the note, says who covers what, and rereads the board", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("Maths · ZZ 5A");
    await fireEvent.press(screen.getAllByRole("radio", { name: "ZZ Dev" })[0]!);
    expect(screen.getAllByRole("radio", { name: "ZZ Dev" })[0]).toBeChecked();
    await fireEvent.changeText(screen.getAllByLabelText("Note for the substitute")[0]!, "Take the reader");
    await fireEvent.press(screen.getByRole("button", { name: "Assign: English · ZZ 5B" }));
    expect(await screen.findByText("ZZ Dev will cover English for ZZ 5B.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ dateKey: "2026-09-17", slotId: ENGLISH, substituteMembershipId: DEV, note: "Take the reader" });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });

  it("a blank note is left out of the body, and the same person again is said to be unchanged", async () => {
    const { calls } = await mountStaff(compose(), "PRINCIPAL", answers(false));
    await screen.findByText("Maths · ZZ 5A");
    await fireEvent.press(screen.getAllByRole("radio", { name: "ZZ Dev" })[1]!);
    await fireEvent.press(screen.getByRole("button", { name: "Assign: Science · ZZ 6A" }));
    expect(await screen.findByText("Already assigned to that person.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({ dateKey: "2026-09-17", slotId: SCIENCE, substituteMembershipId: DEV });
  });

  it("Clear posts the lesson and says the cover is gone; Change opens the picker and Cancel folds it", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("Maths · ZZ 5A");
    await fireEvent.press(screen.getByRole("button", { name: "Change: Maths · ZZ 5A" }));
    expect(screen.getAllByRole("radio", { name: "ZZ Dev" })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Assign: Maths · ZZ 5A" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getAllByRole("radio", { name: "ZZ Dev" })).toHaveLength(2);
    await fireEvent.press(screen.getByRole("button", { name: "Clear: Maths · ZZ 5A" }));
    expect(await screen.findByText("Cover removed; the lesson is uncovered again.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/clear`)?.body).toEqual({ dateKey: "2026-09-17", slotId: MATHS });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });

  it("the day arrows ask the API for that day, and Today comes back", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("Maths · ZZ 5A");
    expect(screen.getByText("Thu, 17/09/2026")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Previous day" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?date=2026-09-16`)).toBe(true));
    await screen.findByText("Wed, 16/09/2026");
    await fireEvent.press(screen.getByRole("button", { name: "Today" }));
    await screen.findByText("Thu, 17/09/2026");
    await fireEvent.press(screen.getByRole("button", { name: "Next day" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?date=2026-09-18`)).toBe(true));
    await screen.findByText("Fri, 18/09/2026");
  });

  it("a closed day says so, by name when the calendar has one", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [`GET ${PATH}`]: () => json({ ...BOARD, closed: true, closedName: null, absent: [], lessons: [], covered: 0, uncovered: 0 }) });
    expect(await screen.findByText("The school is not open on this day, so there is no board.")).toBeTruthy();
    expect(screen.queryByText("Nobody is away")).toBeNull();
  });

  it("a holiday is named", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [`GET ${PATH}`]: () => json({ ...BOARD, closed: true, closedName: "ZZ Holiday", absent: [], lessons: [], covered: 0, uncovered: 0 }) });
    expect(await screen.findByText("Closed: ZZ Holiday.")).toBeTruthy();
  });

  it("a day with nobody away is an empty state with a door to the staff register", async () => {
    await mountStaff(compose(), "PRINCIPAL", { ...answers(), [`GET ${PATH}`]: () => json({ ...BOARD, absent: [], lessons: [], covered: 0, uncovered: 0 }) });
    await screen.findByText("Nobody is away");
    expect(screen.getByText("Every lesson has its teacher. Mark someone absent or on leave on the staff register and their lessons appear here.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Staff attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/staff-attendance");
  });
});

/**
 * The board hears the event stream: a cover named or cleared by anyone in
 * the school on this day (the server's `substitution.updated`) re-reads the
 * board and says so for a moment; another day's change is not this board's.
 */
describe("the substitution board, live", () => {
  afterEach(() => fakeEvents().reset());

  it("a change to this day's board re-reads it and says 'The board changed and has been refreshed.'", async () => {
    const live = fakeEvents();
    let reads = 0;
    const { calls } = await mountStaff(
      compose(),
      "ADMIN",
      {
        ...answers(),
        [`GET ${PATH}`]: () => json(++reads === 1 ? BOARD : { ...BOARD, lessons: [{ ...BOARD.lessons[0]!, substitute: { membershipId: DEV, name: "ZZ Dev", note: null } }, ...BOARD.lessons.slice(1)] }),
      },
    );
    await screen.findByText("Maths · ZZ 5A");
    await live.opened();
    expect(live.opens).toBe(1);
    expect(screen.queryByText("The board changed and has been refreshed.")).toBeNull();

    // Another day's board changing is not this one's.
    live.event("substitution.updated", { dateKey: "2026-09-18", slotId: MATHS });
    await new Promise((r) => setTimeout(r, 20));
    expect(calls().filter((c) => c.line.startsWith(`GET ${PATH}`))).toHaveLength(1);

    live.keepAlive();
    live.event("substitution.updated", { dateKey: "2026-09-17", slotId: MATHS });
    await screen.findByText("The board changed and has been refreshed.");
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith(`GET ${PATH}`))).toHaveLength(2));
    await screen.findByText("Substitute: ZZ Dev");
    expect(screen.queryByText("Substitute: ZZ Chitra")).toBeNull();
  });
});
