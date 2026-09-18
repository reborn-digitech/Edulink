import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffIncident } from "@/screens/staff/incident";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's; the screen reads the incident id from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = "czz000000000000000pupil1";
const INC = "czz0000000000000000000inc1";
const GET = `GET /api/v1/staff/incidents/${INC}`;
const NOTES = `POST /api/v1/staff/incidents/${INC}/notes`;
const CLOSE = `POST /api/v1/staff/incidents/${INC}/close`;

const NOTE = { id: "n1", authorName: "ZZ Nurse", body: "Ice on the knee, back to class.", createdAt: "2026-09-18T05:30:00.000Z" };
const view = (over: Record<string, unknown> = {}) => ({
  id: INC,
  studentMembershipId: PUPIL,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  reportedByName: "ZZ Teacher",
  kind: "INJURY",
  severity: "MINOR",
  occurredAt: "2026-09-18T05:00:00.000Z",
  place: "Playground",
  title: "ZZ Fell on the steps, grazed knee",
  body: "Tripped on the top step at break.",
  actionTaken: "Cleaned and a plaster.",
  guardiansNotifiedAt: "2026-09-18T05:01:00.000Z",
  status: "OPEN",
  closedAt: null,
  closedByName: null,
  notes: [NOTE],
  canNote: true,
  canClose: false,
  ...over,
});

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = { incidentId: INC };
});

describe("one incident for the school", () => {
  it("loads, then a teacher reads the record and its notes, with a note form and no close button", async () => {
    const gate = gated();
    await mountStaff(<StaffIncident />, "TEACHER", { [GET]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(view()));
    expect(await screen.findByText("ZZ Fell on the steps, grazed knee")).toBeTruthy();
    expect(screen.getByText("ZZ Asha · ZZ 5A")).toBeTruthy();
    expect(screen.getByText("Injury")).toBeTruthy();
    expect(screen.getByText("Minor")).toBeTruthy();
    expect(screen.getByText("Open")).toBeTruthy();
    expect(screen.getByLabelText("Where: Playground")).toBeTruthy();
    expect(screen.getByLabelText("What happened: Tripped on the top step at break.")).toBeTruthy();
    expect(screen.getByLabelText("What was done: Cleaned and a plaster.")).toBeTruthy();
    expect(screen.getByText("Recorded by ZZ Teacher")).toBeTruthy();
    expect(screen.getByText(/^Family told /)).toBeTruthy();
    expect(screen.getByLabelText(/^ZZ Nurse, .*: Ice on the knee, back to class\.$/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add a note" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close the incident" })).toBeNull();
  });

  it("a note needs words, then posts them and shows the record the server sends back", async () => {
    const { calls } = await mountStaff(<StaffIncident />, "TEACHER", {
      [GET]: () => json(view()),
      [NOTES]: () => json(view({ notes: [NOTE, { id: "n2", authorName: "ZZ Teacher", body: "Mother called back, all well.", createdAt: "2026-09-18T06:00:00.000Z" }] })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a note" }));
    expect(screen.getByText("This is required.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST /api/v1/staff/incidents/${INC}/notes`)).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Follow-up"), " Mother called back, all well. ");
    await fireEvent.press(screen.getByRole("button", { name: "Add a note" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST /api/v1/staff/incidents/${INC}/notes`)).toHaveLength(1));
    expect(calls().find((c) => c.line === `POST /api/v1/staff/incidents/${INC}/notes`)!.body).toEqual({ body: "Mother called back, all well." });
    expect(await screen.findByText("Note added.")).toBeTruthy();
    expect(screen.getByLabelText(/: Mother called back, all well\.$/)).toBeTruthy();
    expect(screen.getByLabelText("Follow-up").props.value).toBe("");
  });

  it("the office closes it behind a confirm, and the closed record takes no more notes", async () => {
    const { calls } = await mountStaff(<StaffIncident />, "ADMIN", {
      [GET]: () => json(view({ canClose: true })),
      [CLOSE]: () => json(view({ canClose: true, status: "CLOSED", closedAt: "2026-09-19T05:00:00.000Z", closedByName: "ZZ Head" })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Close the incident" }));
    expect(screen.getByText("Once follow-up is done. Closing keeps the record; nothing more can be added after.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST /api/v1/staff/incidents/${INC}/close`)).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Once follow-up is done. Closing keeps the record; nothing more can be added after.")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Close the incident" }));
    await fireEvent.press(screen.getByRole("button", { name: "Close the incident" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST /api/v1/staff/incidents/${INC}/close`)).toHaveLength(1));
    expect(await screen.findByText(/^Closed .* by ZZ Head$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Close the incident" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add a note" })).toBeNull();
    expect(screen.getByText("This incident is closed; nothing more can be added.")).toBeTruthy();
  });

  it("a refused note is an alert and the words stay", async () => {
    await mountStaff(<StaffIncident />, "PRINCIPAL", { [GET]: () => json(view({ canClose: true })), [NOTES]: refused("ZZ refused the note", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Follow-up"), "ZZ words");
    await fireEvent.press(screen.getByRole("button", { name: "Add a note" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ refused the note");
    expect(screen.getByLabelText("Follow-up").props.value).toBe("ZZ words");
  });

  it("the pupil's file in the log is a door", async () => {
    await mountStaff(<StaffIncident />, "TEACHER", { [GET]: () => json(view()) });
    await fireEvent.press(await screen.findByRole("button", { name: "Incident log" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/incidents", params: { studentMembershipId: PUPIL, name: "ZZ Asha" } });
  });

  it("without an incident in the route, the door is the log", async () => {
    mockRouter.params = {};
    await mountStaff(<StaffIncident />, "ADMIN", {});
    expect(await screen.findByText("That incident is not one you can see.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Incident log" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/incidents");
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(<StaffIncident />, "TEACHER", { [GET]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
