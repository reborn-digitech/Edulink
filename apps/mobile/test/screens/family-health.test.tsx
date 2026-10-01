import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, child, ID, ME_PARENT, ME_STUDENT, pending, refused, renderFamily, press } from "./family-helpers";
import { FamilyHealth } from "@/screens/family/health";
import { bodyFrom, cmToInt, formatKg, formFrom, kgToGrams, todayKey } from "@/screens/shared/health";

const CHILDREN = { children: [child(ID.child, "ZZ Asha"), child(ID.child2, "ZZ Bela")] };
const CARD = {
  studentMembershipId: ID.child,
  studentName: "ZZ Asha",
  className: "ZZ 5A",
  card: {
    bloodGroup: "B+",
    allergies: "Peanuts",
    conditions: "",
    medications: "Inhaler, in the bag",
    dietary: "",
    notes: "",
    doctorName: "Dr ZZ Rao",
    doctorPhone: "+91 98764 00100",
    contacts: [{ name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" }],
    updatedAt: "2026-09-10T05:00:00.000Z",
    updatedByName: "ZZ Parent",
  },
  checks: [
    { id: "hc1", dateKey: "2026-08-01", heightCm: 130, weightGrams: 28_000, visionLeft: "6/6", visionRight: "6/9", notes: "" },
    { id: "hc2", dateKey: "2026-09-01", heightCm: 132, weightGrams: 29_500, visionLeft: null, visionRight: null, notes: "ZZ camp" },
  ],
  canEdit: true,
  canRecordCheck: false,
};
const PATH = "/api/v1/family/health";
const CHILDREN_PATH = "/api/v1/family/children";

const posts = (fetch: jest.Mock) => calls(fetch, PATH).filter((c) => c.init?.method === "POST");

describe("the helpers behind the card", () => {
  it("turn kilograms to one decimal into grams, and back", () => {
    expect(kgToGrams("29.5")).toBe(29_500);
    expect(kgToGrams("30")).toBe(30_000);
    expect(kgToGrams("29,5")).toBe(29_500);
    expect(kgToGrams("")).toBeNull();
    expect(kgToGrams("29.55")).toBe("bad");
    expect(kgToGrams("heavy")).toBe("bad");
    expect(formatKg(29_500)).toBe("29.5");
    expect(formatKg(30_000)).toBe("30");
    expect(cmToInt("132")).toBe(132);
    expect(cmToInt("")).toBeNull();
    expect(cmToInt("1.5")).toBe("bad");
    expect(todayKey(new Date(2026, 8, 7))).toBe("2026-09-07");
  });

  it("send the whole card trimmed, with an unknown group as null and a wholly blank person dropped", () => {
    const form = formFrom(null);
    expect(form.bloodGroup).toBe("");
    expect(form.contacts).toEqual([]);
    expect(bodyFrom({ ...form, allergies: "  Peanuts ", contacts: [{ name: "", relation: "", phone: "" }, { name: " ZZ Aunt", relation: "aunt", phone: "+919876400999 " }] })).toEqual({
      bloodGroup: null,
      allergies: "Peanuts",
      conditions: "",
      medications: "",
      dietary: "",
      notes: "",
      doctorName: "",
      doctorPhone: "",
      contacts: [{ name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" }],
    });
  });
});

describe("a child's health card for the guardian", () => {
  it("is loading while the card is on its way", async () => {
    await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the card, the people to call and the check-ups newest first", async () => {
    await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => CARD });
    expect(await screen.findByText("ZZ Asha's health card")).toBeTruthy();
    expect(screen.getByLabelText("Blood group: B+")).toBeTruthy();
    expect(screen.getByLabelText("Allergies: Peanuts")).toBeTruthy();
    expect(screen.getByLabelText("Conditions: None")).toBeTruthy();
    expect(screen.getByLabelText("Medicines: Inhaler, in the bag")).toBeTruthy();
    expect(screen.getByText("Dr ZZ Rao")).toBeTruthy();
    expect(screen.getByText("1. ZZ Aunt")).toBeTruthy();
    expect(screen.getByText("+919876400999")).toBeTruthy();
    expect(screen.getByText(/^Updated .* by ZZ Parent$/)).toBeTruthy();
    expect(screen.getByText("Height 132 cm · Weight 29.5 kg · ZZ camp")).toBeTruthy();
    expect(screen.getByText("Height 130 cm · Weight 28 kg · Sight 6/6 / 6/9")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit the card" })).toBeTruthy();
    // The family reads the check-ups; only the office records one.
    expect(screen.queryByRole("button", { name: "Record a check-up" })).toBeNull();
  });

  it("edits the card and posts the whole thing for that child, then says it is saved", async () => {
    const { fetch } = await renderFamily(<FamilyHealth />, ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init) => (init?.method === "POST" ? { ...CARD, card: { ...CARD.card, allergies: "Peanuts, eggs", updatedAt: "2026-09-18T05:00:00.000Z" } } : CARD),
    });
    await press(await screen.findByRole("button", { name: "Edit the card" }));
    expect(screen.getByRole("radio", { name: "B+" })).toBeChecked();
    await press(screen.getByRole("radio", { name: "O+" }));
    await fireEvent.changeText(screen.getByLabelText("Allergies"), "Peanuts, eggs");
    await fireEvent.changeText(screen.getByLabelText("Teachers should know"), "Sits at the front");
    await press(screen.getByRole("button", { name: "Add a person" }));
    await fireEvent.changeText(screen.getByLabelText("Name 2"), "ZZ Uncle");
    await fireEvent.changeText(screen.getByLabelText("Relation 2"), "uncle");
    await fireEvent.changeText(screen.getByLabelText("Phone 2"), "+919876400998");
    await press(screen.getByRole("button", { name: "Save the card" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(bodyOf(posts(fetch)[0]!)).toEqual({
      childId: ID.child,
      bloodGroup: "O+",
      allergies: "Peanuts, eggs",
      conditions: "",
      medications: "Inhaler, in the bag",
      dietary: "",
      notes: "Sits at the front",
      doctorName: "Dr ZZ Rao",
      doctorPhone: "+91 98764 00100",
      contacts: [
        { name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" },
        { name: "ZZ Uncle", relation: "uncle", phone: "+919876400998" },
      ],
    });
    expect(await screen.findByText("Health card saved.")).toBeTruthy();
    expect(screen.getByLabelText("Allergies: Peanuts, eggs")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save the card" })).toBeNull();
  });

  it("a person with a name and no number is refused before anything is sent; removing them clears it", async () => {
    const { fetch } = await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => CARD });
    await press(await screen.findByRole("button", { name: "Edit the card" }));
    await press(screen.getByRole("button", { name: "Add a person" }));
    await fireEvent.changeText(screen.getByLabelText("Name 2"), "ZZ Uncle");
    await press(screen.getByRole("button", { name: "Save the card" }));
    expect(screen.getByText("This is required.")).toBeTruthy();
    expect(posts(fetch)).toHaveLength(0);
    await press(screen.getByRole("button", { name: "Remove ZZ Uncle" }));
    expect(screen.queryByText("This is required.")).toBeNull();
    // Three people is the most the card holds.
    await press(screen.getByRole("button", { name: "Add a person" }));
    await press(screen.getByRole("button", { name: "Add a person" }));
    expect(screen.queryByRole("button", { name: "Add a person" })).toBeNull();
    await press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Edit the card" })).toBeTruthy();
  });

  it("a card nobody has written is an empty state with the way in", async () => {
    await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => ({ ...CARD, card: null, checks: [] }) });
    expect(await screen.findByText("No card yet")).toBeTruthy();
    expect(screen.getByText("Nobody has written ZZ Asha's health card. Fill it in once and every teacher of the class can read it.")).toBeTruthy();
    expect(screen.getByText("No check-up recorded yet.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Edit the card" }));
    expect(screen.getByRole("radio", { name: "Not known" })).toBeChecked();
    expect(screen.getByLabelText("Allergies").props.value).toBe("");
  });

  it("switching child asks for that child's card", async () => {
    const { fetch } = await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: () => CARD });
    await press(await screen.findByRole("button", { name: "ZZ Bela, ZZ School" }));
    await waitFor(() => expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true));
  });

  it("a refused save is an alert above the form, which stays open", async () => {
    const { fetch } = await renderFamily(<FamilyHealth />, ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: (init, url) => (init?.method === "POST" ? refused(422, "ZZ not saved")(init, url) : CARD),
    });
    await press(await screen.findByRole("button", { name: "Edit the card" }));
    await press(screen.getByRole("button", { name: "Save the card" }));
    await waitFor(() => expect(posts(fetch)).toHaveLength(1));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not saved");
    expect(screen.getByRole("button", { name: "Save the card" })).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => CHILDREN, [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("with no child linked, the door is linking one", async () => {
    await renderFamily(<FamilyHealth />, ME_PARENT, { [CHILDREN_PATH]: () => ({ children: [] }), [PATH]: refused(404, "ZZ no child") });
    expect(await screen.findByText("Link to your child")).toBeTruthy();
  });

  it("the guardian can see who at the school has read the card, read only when the disclosure is opened", async () => {
    const READS = `/api/v1/family/students/${ID.child}/health/reads`;
    const { fetch } = await renderFamily(<FamilyHealth />, ME_PARENT, {
      [CHILDREN_PATH]: () => CHILDREN,
      [PATH]: () => CARD,
      [READS]: () => ({ studentMembershipId: ID.child, childName: "ZZ Asha", days: 90, reads: [{ id: "r1", readerName: "ZZ Teacher", readerRole: "TEACHER", readAt: "2026-09-18T05:00:00.000Z" }, { id: "r2", readerName: "ZZ Office", readerRole: "ADMIN", readAt: "2026-09-17T05:00:00.000Z" }] }),
    });
    await screen.findByText("ZZ Asha's health card");
    expect(calls(fetch, READS)).toHaveLength(0);
    await press(screen.getByRole("button", { name: "Who has read this" }));
    expect(await screen.findByText("ZZ Teacher (teacher)")).toBeTruthy();
    expect(screen.getByText("ZZ Office (school office)")).toBeTruthy();
    expect(screen.getByText(/^Members of staff who opened ZZ Asha's card in the last 90 days/)).toBeTruthy();
    expect(calls(fetch, READS)).toHaveLength(1);
  });

  it("a pupil old enough by the school's rule reads their own card, read-only, with no child asked for", async () => {
    const { fetch } = await renderFamily(<FamilyHealth />, ME_STUDENT, { [PATH]: () => ({ ...CARD, studentName: "ZZ Pupil", canEdit: false }) });
    expect(await screen.findByText("My health card")).toBeTruthy();
    expect(await screen.findByLabelText("Allergies: Peanuts")).toBeTruthy();
    expect(screen.getByText("Height 132 cm · Weight 29.5 kg · ZZ camp")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit the card" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Who has read this" })).toBeNull();
    expect(calls(fetch, PATH)[0]!.url.search).toBe("");
    expect(calls(fetch, CHILDREN_PATH)).toHaveLength(0);
  });

  it("a pupil the school's rule refuses is told to ask a grown-up, with the overview as the door", async () => {
    await renderFamily(<FamilyHealth />, ME_STUDENT, { [PATH]: refused(403, "ZZ not yet") });
    expect(await screen.findByText("Ask a grown-up")).toBeTruthy();
    expect(screen.getByText(/^Your health card and incident log are read by your family and the school/)).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    await press(screen.getByRole("button", { name: "Overview" }));
  });

  it("a pupil's other failure is still an alert with a retry", async () => {
    await renderFamily(<FamilyHealth />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
  });
});
