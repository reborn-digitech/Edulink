import { screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, ID, ME_PARENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyMeetings } from "@/screens/family/meetings";

const MEETINGS = {
  timezone: "Asia/Kolkata",
  children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")],
  open: [{ id: ID.slot, teacherName: "ZZ Teacher", startsAt: "2030-01-10T09:30:00.000Z", endsAt: "2030-01-10T09:45:00.000Z", location: "Room 4", note: null, forStudentMembershipIds: [ID.child, ID.child2] }],
  mine: [{ bookingId: ID.booking, teacherName: "ZZ Other", childName: "ZZ Asha", startsAt: "2030-01-12T09:30:00.000Z", endsAt: "2030-01-12T09:45:00.000Z", location: null, note: null }],
};
const PATH = "/api/v1/family/meetings";
const CANCEL = "/api/v1/family/meetings/cancel";

describe("meet the teacher", () => {
  it("is loading while the windows are on their way", async () => {
    await renderFamily(<FamilyMeetings />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("lists the open windows and the family's bookings, and books a slot for the chosen child", async () => {
    const { fetch } = await renderFamily(<FamilyMeetings />, ME_PARENT, { [PATH]: () => MEETINGS });
    expect(await screen.findByText("With ZZ Teacher")).toBeTruthy();
    expect(screen.getByText("With ZZ Other · about ZZ Asha")).toBeTruthy();
    await press(screen.getByRole("button", { name: "ZZ Bela" }));
    await press(screen.getByRole("button", { name: "Book" }));
    await waitFor(() => expect(calls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ slotId: ID.slot, studentMembershipId: ID.child2 });
    expect(await screen.findByText("Booked. The teacher has been told.")).toBeTruthy();
  });

  it("cancels a booking", async () => {
    const { fetch } = await renderFamily(<FamilyMeetings />, ME_PARENT, { [PATH]: () => MEETINGS, [CANCEL]: () => ({ ok: true }) });
    await press(await screen.findByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(calls(fetch, CANCEL)).toHaveLength(1));
    expect(bodyOf(calls(fetch, CANCEL)[0]!)).toEqual({ bookingId: ID.booking });
  });

  it("a refused booking is shown as an alert", async () => {
    await renderFamily(<FamilyMeetings />, ME_PARENT, { [PATH]: (init) => (init?.method === "POST" ? refused(409, "ZZ taken")(init, new URL("http://api.test/")) : MEETINGS) });
    await press(await screen.findByRole("button", { name: "Book" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ taken");
  });

  it("with no windows open, says so", async () => {
    await renderFamily(<FamilyMeetings />, ME_PARENT, { [PATH]: () => ({ ...MEETINGS, open: [], mine: [] }) });
    expect(await screen.findByText("No open times right now")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyMeetings />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
