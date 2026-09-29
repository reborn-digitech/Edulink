import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { leavingBodyFrom, Person } from "@/screens/staff/person";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = { membershipId: "m7", name: "ZZ Pupil", role: "STUDENT", left: "", leavingOn: "" };
const LEAVING = "/api/v1/admin/people/m7/leaving";

const mount = (params: Record<string, string>, answers: Answers = {}) => {
  mockRouter.params = params;
  return mountStaff(
    <ToastProvider>
      <Person />
    </ToastProvider>,
    "ADMIN",
    answers,
  );
};

beforeEach(() => mockRouter.push.mockClear());

describe("what the leaving form sends", () => {
  it("leaves a blank line out, sends a blank day as null and no conduct as null", () => {
    expect(leavingBodyFrom({ reason: "LEFT", conduct: "", destination: "  ", note: "", leftOn: "" })).toEqual({ reason: "LEFT", conduct: null, leftOn: null });
    expect(leavingBodyFrom({ reason: "TRANSFERRED", conduct: "GOOD", destination: " ZZ Elsewhere ", note: " Family moved. ", leftOn: " 2026-10-15 " })).toEqual({ reason: "TRANSFERRED", conduct: "GOOD", destination: "ZZ Elsewhere", note: "Family moved.", leftOn: "2026-10-15" });
  });
});

describe("a member of staff, from the directory", () => {
  it("opens their record, and offers no leaving: staff who go get a reference, not a certificate", async () => {
    await mount({ membershipId: "m2", name: "ZZ Teacher", role: "TEACHER", left: "", leavingOn: "" });
    await fireEvent.press(await screen.findByRole("button", { name: /^Staff record/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/staff-record", params: { membershipId: "m2" } });
    expect(screen.queryByText(/^Record that/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Undo leaving" })).toBeNull();
  });
});

describe("a pupil, from the directory", () => {
  it("opens their health card and their school record", async () => {
    await mount(PUPIL);
    await fireEvent.press(await screen.findByRole("button", { name: /^Health card/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-health", params: { membershipId: "m7" } });
    await fireEvent.press(screen.getByRole("button", { name: /^Pupil records/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-record", params: { membershipId: "m7" } });
  });

  it("⚠ says what the family will get, records the leaving with what was chosen and typed, and then offers only the undo", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${LEAVING}`]: () => json({ recordId: "sr1", scheduledFor: null }) });
    expect(await screen.findByText("Record that ZZ Pupil has left?")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Transferred to another school" })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: "Finished their schooling here" }));
    await fireEvent.press(screen.getByRole("radio", { name: "Excellent" }));
    await fireEvent.changeText(screen.getByLabelText("Where they went"), "ZZ Elsewhere School");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LEAVING}`)?.body).toEqual({ reason: "GRADUATED", conduct: "EXCELLENT", destination: "ZZ Elsewhere School", leftOn: null }));
    expect(await screen.findByRole("button", { name: "Undo leaving" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Record it" })).toBeNull();
  });

  it("a last day after today is kept: the screen names the day and offers to give it up", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${LEAVING}`]: () => json({ recordId: null, scheduledFor: "2030-01-15" }), [`POST ${LEAVING}/cancel`]: () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("Last day"), "2030-01-15");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(await screen.findByText(/^Leaving on .*2030/)).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${LEAVING}`)?.body).toMatchObject({ leftOn: "2030-01-15" });
    await fireEvent.press(screen.getByRole("button", { name: "Cancel scheduled leaving" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${LEAVING}/cancel`)).toBe(true));
    expect(await screen.findByRole("button", { name: "Record it" })).toBeTruthy();
  });

  it("a day that is not one is caught before anything is sent; a refusal from the server is an alert and the form stays", async () => {
    const { calls } = await mount(PUPIL, { [`POST ${LEAVING}`]: () => json({ error: "That pupil has already left.", code: "BAD_REQUEST" }, 422) });
    await fireEvent.changeText(await screen.findByLabelText("Last day"), "15/01/2030");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(screen.getByText("That is not a real date.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Last day"), "");
    await fireEvent.press(screen.getByRole("button", { name: "Record it" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That pupil has already left.");
    expect(screen.getByRole("button", { name: "Record it" })).toBeTruthy();
  });

  it("a pupil who has left is offered the undo, which puts the form back", async () => {
    const { calls } = await mount({ ...PUPIL, left: "1" }, { [`POST ${LEAVING}/undo`]: () => json({ ok: true }) });
    expect(screen.queryByRole("button", { name: "Record it" })).toBeNull();
    await fireEvent.press(await screen.findByRole("button", { name: "Undo leaving" }));
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${LEAVING}/undo`)).toBe(true));
    expect(await screen.findByText("ZZ Pupil is back on the roll")).toBeTruthy();
    expect(await screen.findByRole("button", { name: "Record it" })).toBeTruthy();
  });
});
