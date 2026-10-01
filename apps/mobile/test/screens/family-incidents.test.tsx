import { screen, waitFor } from "@testing-library/react-native";
import { calls, child, ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyIncidents } from "@/screens/family/incidents";

const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const INCIDENT = {
  id: "czz0000000000000000000inc1",
  studentMembershipId: ID.child,
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
  status: "CLOSED",
  closedAt: "2026-09-19T05:00:00.000Z",
  closedByName: "ZZ Head",
  notes: [{ id: "n1", authorName: "ZZ Nurse", body: "Ice on the knee, back to class.", createdAt: "2026-09-18T05:30:00.000Z" }],
  canNote: false,
  canClose: false,
};
const QUIET = { ...INCIDENT, id: "czz0000000000000000000inc2", title: "ZZ Pushed at the gate", kind: "BEHAVIOUR", severity: "MODERATE", place: "", actionTaken: "", guardiansNotifiedAt: null, status: "OPEN", closedAt: null, closedByName: null, notes: [] };
const PATH = "/api/v1/family/incidents";
const CHILDREN_PATH = "/api/v1/family/children";

describe("a child's incidents for the guardian", () => {
  it("is loading while the log is on its way", async () => {
    await renderFamily(<FamilyIncidents />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows each record with its badges, the facts, the family line, the notes read-only and the closed line", async () => {
    await renderFamily(<FamilyIncidents />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ childName: "ZZ Asha", incidents: [INCIDENT, QUIET] }) });
    expect(await screen.findByText("ZZ Asha's incidents")).toBeTruthy();
    expect(screen.getByText(/^Anything the school recorded about ZZ Asha/)).toBeTruthy();
    expect(screen.getByText("ZZ Fell on the steps, grazed knee")).toBeTruthy();
    expect(screen.getByText("Injury")).toBeTruthy();
    expect(screen.getByText("Behaviour")).toBeTruthy();
    expect(screen.getByText("Moderate")).toBeTruthy();
    expect(screen.getByLabelText("Where: Playground")).toBeTruthy();
    expect(screen.getByLabelText("What was done: Cleaned and a plaster.")).toBeTruthy();
    expect(screen.getByText(/^Family told /)).toBeTruthy();
    expect(screen.getByText("Family not told by the app")).toBeTruthy();
    expect(screen.getByLabelText(/^ZZ Nurse, .*: Ice on the knee, back to class\.$/)).toBeTruthy();
    expect(screen.getByText("No follow-up yet.")).toBeTruthy();
    expect(screen.getByText(/^Closed .* by ZZ Head$/)).toBeTruthy();
    // Read-only: no note form, no close.
    expect(screen.queryByRole("button", { name: "Add a note" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Close the incident" })).toBeNull();
  });

  it("with nothing recorded says so, with the health card as the door", async () => {
    const { fetch } = await renderFamily(<FamilyIncidents />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ childName: "ZZ Asha", incidents: [] }) });
    expect(await screen.findByText("Nothing recorded")).toBeTruthy();
    expect(screen.getByText("The school has not recorded any incident or sick-room visit for ZZ Asha.")).toBeTruthy();
    expect(calls(fetch, PATH)[0]!.url.search).toBe("");
    await press(screen.getByRole("button", { name: "Health card" }));
  });

  it("switching the child asks for that child's log", async () => {
    const { fetch } = await renderFamily(<FamilyIncidents />, ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (_init, url) => (url.searchParams.get("childId") === ID.child2 ? { childName: "ZZ Bela", incidents: [] } : { childName: "ZZ Asha", incidents: [INCIDENT] }),
    });
    expect(await screen.findByText("ZZ Asha's incidents")).toBeTruthy();
    await press(screen.getByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
    expect(await screen.findByText("ZZ Bela's incidents")).toBeTruthy();
    expect(screen.getByText("Nothing recorded")).toBeTruthy();
  });

  it("a pupil old enough by the school's rule reads their own log, read-only", async () => {
    const { fetch } = await renderFamily(<FamilyIncidents />, ME_STUDENT, { [PATH]: () => ({ childName: "ZZ Pupil", incidents: [INCIDENT] }) });
    expect(await screen.findByText("My incidents")).toBeTruthy();
    expect(await screen.findByText("ZZ Fell on the steps, grazed knee")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add a note" })).toBeNull();
    expect(calls(fetch, PATH)[0]!.url.search).toBe("");
    expect(calls(fetch, CHILDREN_PATH)).toHaveLength(0);
  });

  it("a pupil with nothing recorded is told so, with the health card as the door", async () => {
    await renderFamily(<FamilyIncidents />, ME_STUDENT, { [PATH]: () => ({ childName: "ZZ Pupil", incidents: [] }) });
    expect(await screen.findByText("Nothing recorded")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Health card" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/health");
  });

  it("a pupil the school's rule refuses is told to ask a grown-up", async () => {
    await renderFamily(<FamilyIncidents />, ME_STUDENT, { [PATH]: refused(403, "ZZ not yet") });
    expect(await screen.findByText("Ask a grown-up")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Overview" })).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyIncidents />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
