import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { PupilHealth } from "@/screens/staff/pupil-health";
import { todayKey } from "@/screens/shared/health";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's; the screen reads the pupil's membership id from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = "czz000000000000000pupil1";
const GET = `GET /api/v1/staff/pupils/${PUPIL}/health`;
const POST = `POST /api/v1/staff/pupils/${PUPIL}/health`;
const CHECKS = `POST /api/v1/staff/pupils/${PUPIL}/health/checks`;

const view = (over: Record<string, unknown> = {}) => ({
  studentMembershipId: PUPIL,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  card: {
    bloodGroup: null,
    allergies: "Peanuts",
    conditions: "Asthma",
    medications: "",
    dietary: "",
    notes: "Carries an inhaler.",
    doctorName: "",
    doctorPhone: "",
    contacts: [{ name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" }],
    updatedAt: "2026-09-10T05:00:00.000Z",
    updatedByName: "ZZ Office",
  },
  checks: [{ id: "hc1", dateKey: "2026-08-01", heightCm: 130, weightGrams: 28_000, visionLeft: "", visionRight: "", notes: "" }],
  canEdit: true,
  canRecordCheck: true,
  ...over,
});

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = { membershipId: PUPIL };
});

describe("a pupil's health card for the school", () => {
  it("loads, then a teacher reads it with no way to write", async () => {
    const gate = gated();
    await mountStaff(<PupilHealth />, "TEACHER", { [GET]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(view({ canEdit: false, canRecordCheck: false })));
    expect(await screen.findByText("ZZ Asha's health card")).toBeTruthy();
    expect(screen.getByLabelText("Blood group: Not known")).toBeTruthy();
    expect(screen.getByLabelText("Allergies: Peanuts")).toBeTruthy();
    expect(screen.getByLabelText("Conditions: Asthma")).toBeTruthy();
    expect(screen.getByLabelText("Teachers should know: Carries an inhaler.")).toBeTruthy();
    expect(screen.getByText("1. ZZ Aunt")).toBeTruthy();
    expect(screen.getByText("Height 130 cm · Weight 28 kg")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit the card" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Record a check-up" })).toBeNull();
  });

  it("a teacher sees a card nobody has written as the office's or the family's to fill", async () => {
    await mountStaff(<PupilHealth />, "TEACHER", { [GET]: () => json(view({ card: null, checks: [], canEdit: false, canRecordCheck: false })) });
    expect(await screen.findByText("No card yet")).toBeTruthy();
    expect(screen.getByText("The office or a guardian fills this in; a teacher reads it here.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit the card" })).toBeNull();
  });

  it("the office edits the card and posts the whole thing", async () => {
    const { calls } = await mountStaff(<PupilHealth />, "ADMIN", {
      [GET]: () => json(view()),
      [POST]: () => json(view({ card: { ...view().card, bloodGroup: "B+", updatedAt: "2026-09-18T05:00:00.000Z" } })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit the card" }));
    expect(screen.getByRole("radio", { name: "Not known" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: "B+" }));
    await fireEvent.changeText(screen.getByLabelText("Doctor's name"), "Dr ZZ Rao");
    await fireEvent.press(screen.getByRole("button", { name: "Remove ZZ Aunt" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save the card" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST /api/v1/staff/pupils/${PUPIL}/health`)).toBe(true));
    expect(calls().find((c) => c.line === `POST /api/v1/staff/pupils/${PUPIL}/health`)!.body).toEqual({
      bloodGroup: "B+",
      allergies: "Peanuts",
      conditions: "Asthma",
      medications: "",
      dietary: "",
      notes: "Carries an inhaler.",
      doctorName: "Dr ZZ Rao",
      doctorPhone: "",
      contacts: [],
    });
    expect(await screen.findByText("Health card saved.")).toBeTruthy();
    expect(screen.getByLabelText("Blood group: B+")).toBeTruthy();
  });

  it("a check-up needs at least one measurement, and sends kilograms as grams", async () => {
    const { calls } = await mountStaff(<PupilHealth />, "ADMIN", {
      [GET]: () => json(view()),
      [CHECKS]: () => json(view({ checks: [...view().checks, { id: "hc2", dateKey: todayKey(), heightCm: null, weightGrams: 29_500, visionLeft: "6/6", visionRight: "", notes: "" }] })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Record a check-up" }));
    expect(screen.getByLabelText("Date").props.value).toBe(todayKey());
    await fireEvent.press(screen.getByRole("button", { name: "Record a check-up" }));
    expect(screen.getByText("Enter at least one measurement or a note.")).toBeTruthy();
    expect(calls().filter((c) => c.line.endsWith("/health/checks"))).toHaveLength(0);
    await fireEvent.changeText(screen.getByLabelText("Weight (kg)"), "29.5");
    await fireEvent.changeText(screen.getByLabelText("Left eye"), "6/6");
    await fireEvent.press(screen.getByRole("button", { name: "Record a check-up" }));
    await waitFor(() => expect(calls().filter((c) => c.line.endsWith("/health/checks"))).toHaveLength(1));
    expect(calls().find((c) => c.line.endsWith("/health/checks"))!.body).toEqual({ dateKey: todayKey(), heightCm: null, weightGrams: 29_500, visionLeft: "6/6", visionRight: "", notes: "" });
    expect(await screen.findByText("Check-up recorded.")).toBeTruthy();
    expect(screen.getByText("Weight 29.5 kg · Sight 6/6 / —")).toBeTruthy();
  });

  it("a weight that is not kilograms to one decimal is refused on the phone", async () => {
    const { calls } = await mountStaff(<PupilHealth />, "PRINCIPAL", { [GET]: () => json(view()) });
    await fireEvent.press(await screen.findByRole("button", { name: "Record a check-up" }));
    await fireEvent.changeText(screen.getByLabelText("Weight (kg)"), "29.55");
    await fireEvent.press(screen.getByRole("button", { name: "Record a check-up" }));
    expect(screen.getByText("That is not valid.")).toBeTruthy();
    expect(calls().filter((c) => c.line.endsWith("/health/checks"))).toHaveLength(0);
  });

  it("a refused check-up is an alert above the form", async () => {
    await mountStaff(<PupilHealth />, "ADMIN", { [GET]: () => json(view()), [CHECKS]: refused("ZZ not recorded", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Record a check-up" }));
    await fireEvent.changeText(screen.getByLabelText("Height (cm)"), "132");
    await fireEvent.press(screen.getByRole("button", { name: "Record a check-up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not recorded");
  });

  it("without a pupil in the route, the door is the classes", async () => {
    mockRouter.params = {};
    await mountStaff(<PupilHealth />, "ADMIN", {});
    expect(await screen.findByText("No card yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(<PupilHealth />, "TEACHER", { [GET]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
