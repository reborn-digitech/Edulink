import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { pickAndUpload } from "@/lib/pick-file";
import { FamilyApplication } from "@/screens/family/application";
import { A1, application, slot, SLOT1, SLOT2 } from "./admissions-fixtures";
import { json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));
jest.mock("@/lib/pick-file", () => {
  class PickError extends Error {}
  return { PickError, pickAndUpload: jest.fn() };
});
const pick = pickAndUpload as jest.Mock;

const BASE = `/api/v1/family/applications/${A1}`;
const GET = `GET ${BASE}`;

const compose = () => (
  <ToastProvider>
    <FamilyApplication />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = { id: A1 };
  pick.mockReset();
});

describe("one of the guardian's applications", () => {
  it("leads with the next step, lists the documents with Attach and Replace, the open sittings, and the way out", async () => {
    await mountStaff(compose(), "PARENT", { [GET]: () => json(application({ openSlots: [slot(SLOT1), slot(SLOT2, { location: "ZZ Library", booked: 5 })] }, { uploadDocuments: true, bookTest: true, withdraw: true })) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(await screen.findByRole("header", { name: "ZZ Kabir" })).toBeTruthy();
    expect(screen.getByText("ZZ Hillside · ZZ Admissions 2026-27 · 2026-27")).toBeTruthy();
    expect(screen.getByText("Attach the documents the school asks for.")).toBeTruthy();
    expect(screen.getByText("Still to attach: ZZ Birth certificate")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Attach" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace" })).toBeTruthy();
    expect(screen.getByText("No sitting booked yet.")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Book this sitting" })).toHaveLength(2);
    expect(screen.getByText("5 of 5 booked")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Withdraw the application" })).toBeTruthy();
    // Nothing to answer yet.
    expect(screen.queryByRole("button", { name: "Accept the seat" })).toBeNull();
  });

  it("attaches a document through the picker, posting the ticket under the key", async () => {
    pick.mockResolvedValue({ fileId: "czz000000000000000000file1", name: "birth.pdf", mime: "application/pdf", size: 1000 });
    const { calls } = await mountStaff(compose(), "PARENT", {
      [GET]: () => json(application({}, { uploadDocuments: true })),
      [`POST ${BASE}/documents`]: () => json(application({ documentsMissing: [], documents: [{ key: "birth", fileId: "f2", name: "birth.pdf", mime: "application/pdf", size: 1000, uploadedAt: "2026-09-18T05:00:00.000Z" }] }, { uploadDocuments: true })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Attach" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/documents`)?.body).toEqual({ documents: [{ key: "birth", fileId: "czz000000000000000000file1", name: "birth.pdf" }] }));
    expect(await screen.findByText("Every required document is attached.")).toBeTruthy();
    expect(screen.getByText("birth.pdf · 1 KB")).toBeTruthy();
    // The next step moves on to the sitting.
    expect(screen.getByText("Book an entrance-test sitting.")).toBeTruthy();
  });

  it("books a sitting, then offers to move to another", async () => {
    const slots = [slot(SLOT1), slot(SLOT2, { location: "ZZ Library" })];
    const { calls } = await mountStaff(compose(), "PARENT", {
      [GET]: () => json(application({ documentsMissing: [], openSlots: slots }, { bookTest: true })),
      [`POST ${BASE}/book`]: () => json(application({ documentsMissing: [], testSlot: slot(SLOT1, { booked: 3 }), openSlots: slots }, { bookTest: true })),
    });
    expect(await screen.findByText("Book an entrance-test sitting.")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Book this sitting" })[0]!);
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/book`)?.body).toEqual({ slotId: SLOT1 }));
    expect(await screen.findByText("Waiting for the school.")).toBeTruthy();
    // The booked sitting is shown and not offered again; the other is a move.
    expect(screen.getAllByText(/ZZ Hall$/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Move to this sitting" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Book this sitting" })).toBeNull();
  });

  it("shows the result once the test is sat", async () => {
    await mountStaff(compose(), "PARENT", { [GET]: () => json(application({ documentsMissing: [], testSlot: slot(), testedAt: "2026-09-20T05:00:00.000Z", testScore: "42/50" })) });
    expect(await screen.findByText(/^Sat .*2026$/)).toBeTruthy();
    expect(screen.getByText("42/50")).toBeTruthy();
    expect(screen.queryByText("No sitting booked yet.")).toBeNull();
  });

  it("answers an offer with one post and says so", async () => {
    const offered = application({ status: "OFFERED", documentsMissing: [], offeredAt: "2026-09-21T05:00:00.000Z", offerExpiresAt: "2026-10-05T00:00:00.000Z", offerNote: "ZZ welcome", feeStructureName: "ZZ Grade 1 fees" }, { respond: true, withdraw: true });
    const { calls } = await mountStaff(compose(), "PARENT", {
      [GET]: () => json(offered),
      [`POST ${BASE}/respond`]: () => json({ ...offered, status: "ACCEPTED", respondedAt: "2026-09-22T05:00:00.000Z", can: { ...offered.can, respond: false } }),
    });
    expect(await screen.findByText("The school has offered a place — answer the offer.")).toBeTruthy();
    expect(screen.getByText(/^Please answer by .*2026$/)).toBeTruthy();
    expect(screen.getByText(/ZZ Grade 1 fees$/)).toBeTruthy();
    expect(screen.getByText("ZZ welcome")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Accept the seat" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${BASE}/respond`)?.body).toEqual({ answer: "ACCEPT" }));
    expect(await screen.findByText(/^Accepted .*2026$/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Accept the seat" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull();
  });

  it("withdrawing asks first, then posts", async () => {
    const { calls } = await mountStaff(compose(), "PARENT", {
      [GET]: () => json(application({}, { withdraw: true, uploadDocuments: true })),
      [`POST ${BASE}/withdraw`]: () => json(application({ status: "WITHDRAWN", decidedAt: "2026-09-23T05:00:00.000Z" })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw the application" }));
    expect(screen.getByText("Withdraw ZZ Kabir's application? The school will be told.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST ${BASE}/withdraw`)).toBe(false);
    await fireEvent.press(screen.getAllByRole("button", { name: "Withdraw the application" }).at(-1)!);
    await waitFor(() => expect(calls().some((c) => c.line === `POST ${BASE}/withdraw`)).toBe(true));
    expect(await screen.findByText(/^Withdrawn .*2026$/)).toBeTruthy();
    expect(screen.getByText("Nothing more to do.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Attach" })).toBeNull();
  });

  it("once admitted, says so with the door to the overview", async () => {
    await mountStaff(compose(), "PARENT", { [GET]: () => json(application({ status: "ADMITTED", documentsMissing: [], admittedAt: "2026-09-25T05:00:00.000Z", admittedMembershipId: "m9", feeStructureName: "ZZ Grade 1 fees" })) });
    expect(await screen.findByText("Admitted. The child's school pages are yours now.")).toBeTruthy();
    expect(screen.getByText(/^Admitted .*2026$/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Overview" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });

  it("a refused book is said above the sittings, and a refused load is an alert with a retry", async () => {
    const { calls } = await mountStaff(compose(), "PARENT", { [GET]: () => json(application({ documentsMissing: [], openSlots: [slot()] }, { bookTest: true })), [`POST ${BASE}/book`]: refused("ZZ that sitting is full", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Book this sitting" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ that sitting is full");
    expect(calls().filter((c) => c.line === `POST ${BASE}/book`)).toHaveLength(1);
    await mountStaff(compose(), "PARENT", { [GET]: refused("ZZ broke") });
    expect((await screen.findAllByRole("alert")).at(-1)).toHaveTextContent("ZZ broke");
  });
});
