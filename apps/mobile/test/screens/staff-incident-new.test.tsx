import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffIncidentNew } from "@/screens/staff/incident-new";
import { json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's; the screen reads the pupil's membership id and name from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = "czz000000000000000pupil1";
const INC = "czz0000000000000000000inc1";
const POST = "POST /api/v1/staff/incidents";

const created = (over: Record<string, unknown> = {}) => ({
  id: INC,
  studentMembershipId: PUPIL,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  reportedByName: "ZZ Head",
  kind: "ILLNESS",
  severity: "MODERATE",
  occurredAt: "2026-09-18T05:00:00.000Z",
  place: "Sick room",
  title: "ZZ Fever at eleven",
  body: "Felt hot after assembly.",
  actionTaken: "Rested, water.",
  guardiansNotifiedAt: "2026-09-18T05:01:00.000Z",
  status: "OPEN",
  closedAt: null,
  closedByName: null,
  notes: [],
  canNote: true,
  canClose: true,
  ...over,
});

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.replace.mockClear();
  mockRouter.params = { membershipId: PUPIL, name: "ZZ Asha" };
});

describe("recording an incident", () => {
  it("refuses an empty title and an empty account on the phone, before anything is sent", async () => {
    const { calls } = await mountStaff(<StaffIncidentNew />, "TEACHER", {});
    expect(await screen.findByText("Record an incident for ZZ Asha")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Injury" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Minor" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Tell the family now" })).toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(screen.getAllByText("This is required.")).toHaveLength(2);
    expect(calls().filter((c) => c.line === "POST /api/v1/staff/incidents")).toHaveLength(0);
  });

  it("posts exactly what was chosen and typed, with the family told, then opens the record", async () => {
    const { calls } = await mountStaff(<StaffIncidentNew />, "ADMIN", { [POST]: () => json(created(), 201) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Illness or sick room" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Moderate" }));
    await fireEvent.changeText(screen.getByLabelText("Where"), " Sick room ");
    await fireEvent.changeText(screen.getByLabelText("In one line"), "ZZ Fever at eleven");
    await fireEvent.changeText(screen.getByLabelText("What happened"), "Felt hot after assembly.");
    await fireEvent.changeText(screen.getByLabelText("What was done"), "Rested, water.");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/staff/incidents")).toHaveLength(1));
    expect(calls().find((c) => c.line === "POST /api/v1/staff/incidents")!.body).toEqual({
      studentMembershipId: PUPIL,
      kind: "ILLNESS",
      severity: "MODERATE",
      place: "Sick room",
      title: "ZZ Fever at eleven",
      body: "Felt hot after assembly.",
      actionTaken: "Rested, water.",
      notifyGuardians: true,
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/incident", params: { incidentId: INC } }));
  });

  it("the switch off sends notifyGuardians false", async () => {
    const { calls } = await mountStaff(<StaffIncidentNew />, "PRINCIPAL", { [POST]: () => json(created({ guardiansNotifiedAt: null }), 201) });
    await fireEvent.press(await screen.findByRole("switch", { name: "Tell the family now" }));
    expect(screen.getByRole("switch", { name: "Tell the family now" })).not.toBeChecked();
    await fireEvent.changeText(screen.getByLabelText("In one line"), "ZZ Pushed at the gate");
    await fireEvent.changeText(screen.getByLabelText("What happened"), "Two boys, separated by the guard.");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/staff/incidents")).toHaveLength(1));
    expect(calls().find((c) => c.line === "POST /api/v1/staff/incidents")!.body).toEqual({
      studentMembershipId: PUPIL,
      kind: "INJURY",
      severity: "MINOR",
      place: "",
      title: "ZZ Pushed at the gate",
      body: "Two boys, separated by the guard.",
      actionTaken: "",
      notifyGuardians: false,
    });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/incident", params: { incidentId: INC } }));
  });

  it("TA-108: a safeguarding concern has no switch, says who reads it, and sends notifyGuardians false", async () => {
    const { calls } = await mountStaff(<StaffIncidentNew />, "TEACHER", { [POST]: () => json(created({ kind: "SAFEGUARDING", guardiansNotifiedAt: null }), 201) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Safeguarding concern" }));
    expect(screen.queryByRole("switch", { name: "Tell the family now" })).toBeNull();
    expect(screen.getByText("A safeguarding concern is read only by the office, the head and you. The family is not told and does not see it, and the class's other teachers do not see it either.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("In one line"), "ZZ A worry from home");
    await fireEvent.changeText(screen.getByLabelText("What happened"), "ZZ what the pupil said.");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/staff/incidents")).toHaveLength(1));
    expect(calls().find((c) => c.line === "POST /api/v1/staff/incidents")!.body).toMatchObject({ kind: "SAFEGUARDING", notifyGuardians: false });
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/(app)/incident", params: { incidentId: INC } }));
  });

  it("a 422 is an alert above the form and the form stays", async () => {
    await mountStaff(<StaffIncidentNew />, "TEACHER", { [POST]: refused("ZZ not one of your pupils", 422) });
    await fireEvent.changeText(await screen.findByLabelText("In one line"), "ZZ Fell");
    await fireEvent.changeText(screen.getByLabelText("What happened"), "On the steps.");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not one of your pupils");
    expect(screen.getByLabelText("In one line").props.value).toBe("ZZ Fell");
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("without a pupil in the route, the door is the classes", async () => {
    mockRouter.params = {};
    await mountStaff(<StaffIncidentNew />, "TEACHER", {});
    expect(await screen.findByText("Nothing has been recorded. A teacher records one from a pupil's row on the class page.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });
});
