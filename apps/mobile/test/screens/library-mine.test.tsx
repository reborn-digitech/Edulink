import { screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { MyLibraryScreen } from "@/screens/library/mine";
import { json, me, mountStaff } from "./staff-harness";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const CHILD = "czz000000000000000000pup1";
const CHILD2 = "czz000000000000000000pup2";
const meAs = (role: RoleCode, modules: string[], extra: Record<string, unknown> = {}) => ({ ...me(role), modules, ...extra });
const PARENT = { ...meAs("PARENT", []), active: { schoolId: null, role: "PARENT", membershipId: null }, contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }] };
const child = (id: string, name: string) => ({ guardianshipId: `g-${id}`, studentMembershipId: id, studentUserId: `u-${id}`, name, schoolId: "s1", schoolName: "ZZ School", leftAt: null, relation: "mother" });
const loan = (extra: Record<string, unknown> = {}) => ({ id: "czz00000000000000000loan1", copyId: "czz00000000000000000copy1", accession: "ZZ-0002", titleId: "czz0000000000000000title1", title: "ZZ The Tiger in the Well", author: "ZZ A", membershipId: CHILD, memberName: "ZZ Asha", className: "ZZ 5A", issuedAt: "2026-09-15T05:30:00.000Z", dueOn: "2026-09-29", returnedAt: null, renewedCount: 0, overdueDays: 5, canRenew: false, ...extra });
const mine = (extra: Record<string, unknown> = {}) => ({
  membershipId: CHILD,
  name: "ZZ Asha",
  limit: 2,
  loans: [loan(), loan({ id: "czz00000000000000000loan2", title: "ZZ Old Book", returnedAt: "2026-05-21T05:30:00.000Z", overdueDays: 0 })],
  fines: [{ id: "czz00000000000000000fine1", issueId: "czz00000000000000000loan2", title: "ZZ Old Book", membershipId: CHILD, memberName: "ZZ Asha", paise: 300, reason: "OVERDUE", createdAt: "2026-05-21T05:30:00.000Z", status: "DUE", onLedger: false, waivedReason: null }],
  reservations: [{ id: "czz00000000000000000resv2", titleId: "czz0000000000000000title2", title: "ZZ Numbers Everywhere", membershipId: CHILD, memberName: "ZZ Asha", placedAt: "2026-10-01T05:30:00.000Z", ready: false, readyAccession: null, position: 2 }],
  ...extra,
});
const title = (id: string, name: string, available: number) => ({ id, isbn: null, title: name, author: "ZZ B", publisher: "", year: null, subject: "", language: "EN", category: "GENERAL", copies: 2, available, waiting: available ? 0 : 1 });
const catalogue = { items: [title("czz0000000000000000title3", "ZZ Stars and Planets", 0)], nextCursor: null };

describe("a member's own library on the phone (3 Oct 2026)", () => {
  beforeEach(() => mockPush.mockClear());

  it("shows a pupil's loans, fines and queue, and the catalogue", async () => {
    await mountStaff(<MyLibraryScreen />, "STUDENT", { "GET /api/v1/library/mine": () => json(mine()), "GET /api/v1/library/titles": () => json(catalogue) }, { me: meAs("STUDENT", ["LIBRARY"]) });
    expect(await screen.findByText("ZZ The Tiger in the Well")).toBeTruthy();
    expect(screen.getByText(/due .* · 5 days late/)).toBeTruthy();
    // A returned book is not listed as on loan; its fine is, at the counter.
    expect(screen.queryByText("ZZ Old Book")).toBeNull();
    expect(screen.getByText(/ZZ Old Book · Due · paid at the school office/)).toBeTruthy();
    expect(screen.getByText("number 2 in the queue")).toBeTruthy();
    expect(screen.getByText(/ZZ Stars and Planets/)).toBeTruthy();
    expect(screen.getByText(/All 2 out · 1 waiting/)).toBeTruthy();
  });

  it("reserves a book and leaves the queue", async () => {
    const { calls } = await mountStaff(
      <MyLibraryScreen />,
      "TEACHER",
      {
        "GET /api/v1/library/mine": () => json(mine()),
        "GET /api/v1/library/titles": () => json(catalogue),
        "POST /api/v1/library/reservations": () => json({ id: "czz00000000000000000resv3", titleId: "czz0000000000000000title3", title: "ZZ Stars and Planets", membershipId: CHILD, memberName: "ZZ T", placedAt: "2026-10-04T05:30:00.000Z", ready: false, readyAccession: null, position: 1 }),
        "POST /api/v1/library/reservations/czz00000000000000000resv2/cancel": () => json({ ...mine().reservations[0], position: 0 }),
      },
      { me: meAs("TEACHER", ["LIBRARY"]) },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: "Reserve" }));
    expect(await screen.findByText("Reserved \"ZZ Stars and Planets\": number 1 in the queue.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/library/reservations")?.body).toEqual({ titleId: "czz0000000000000000title3" });
    await userEvent.setup().press(screen.getByRole("button", { name: "Leave the queue" }));
    expect(await screen.findByText("You have left the queue.")).toBeTruthy();
  });

  it("searches the catalogue", async () => {
    const { calls } = await mountStaff(<MyLibraryScreen />, "STUDENT", { "GET /api/v1/library/mine": () => json(mine({ loans: [], fines: [], reservations: [] })), "GET /api/v1/library/titles": () => json({ items: [], nextCursor: null }) }, { me: meAs("STUDENT", ["LIBRARY"]) });
    expect(await screen.findByText("No books out.")).toBeTruthy();
    await userEvent.setup().type(screen.getByLabelText("Search the catalogue"), "owls");
    await userEvent.setup().press(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/library/titles?q=owls")).toBe(true));
    expect(await screen.findByText("No book matches that search.")).toBeTruthy();
  });

  it("for a guardian, reads the chosen child's library and reserves for them", async () => {
    const { calls } = await mountStaff(
      <MyLibraryScreen />,
      "PARENT",
      {
        "GET /api/v1/family/children": () => json({ children: [child(CHILD, "ZZ Asha"), child(CHILD2, "ZZ Bela")] }),
        "GET /api/v1/library/mine": ({ url }) => json(mine(url.search.includes(CHILD2) ? { membershipId: CHILD2, name: "ZZ Bela", loans: [] } : {})),
        "GET /api/v1/library/titles": () => json(catalogue),
        "POST /api/v1/library/reservations": () => json({ id: "czz00000000000000000resv4", titleId: "czz0000000000000000title3", title: "ZZ Stars and Planets", membershipId: CHILD2, memberName: "ZZ Bela", placedAt: "2026-10-04T05:30:00.000Z", ready: true, readyAccession: "ZZ-0019", position: 1 }),
      },
      { me: PARENT },
    );
    expect(await screen.findByText("ZZ Asha's library: books out, fines and reservations.")).toBeTruthy();
    await userEvent.setup().press(await screen.findByRole("button", { name: /ZZ Bela/ }));
    expect(await screen.findByText("ZZ Bela's library: books out, fines and reservations.")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "Reserve" }));
    expect(await screen.findByText("Reserved \"ZZ Stars and Planets\": a copy is waiting at the desk.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/library/reservations")?.body).toEqual({ titleId: "czz0000000000000000title3", childId: CHILD2 });
  });

  it("says the library is off for a pupil whose school has not switched it on, and offers More", async () => {
    await mountStaff(<MyLibraryScreen />, "STUDENT", {}, { me: meAs("STUDENT", ["ALUMNI"]) });
    expect(await screen.findByText("Library is not switched on")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("button", { name: "More" }));
    expect(mockPush).toHaveBeenCalledWith("/(app)/more");
  });

  it("says why a reservation was refused", async () => {
    await mountStaff(
      <MyLibraryScreen />,
      "STUDENT",
      { "GET /api/v1/library/mine": () => json(mine()), "GET /api/v1/library/titles": () => json(catalogue), "POST /api/v1/library/reservations": () => json({ error: "This book is already on loan to them.", code: "FORBIDDEN" }, 403) },
      { me: meAs("STUDENT", ["LIBRARY"]) },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: "Reserve" }));
    expect(await screen.findByText("This book is already on loan to them.")).toBeTruthy();
  });
});
