import { screen, userEvent, waitFor } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { LibraryDesk } from "@/screens/library/desk";
import { json, me, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => ({}) }));

const meWith = (modules: string[]) => ({ ...me("LIBRARIAN" as RoleCode), modules });
const press = async (name: string) => userEvent.setup().press(await screen.findByRole("button", { name }));
const copyRow = (status: string, extra: Record<string, unknown> = {}) => ({ id: "czz00000000000000000copy1", accession: "ZZ-0002", rack: "ZZ-A1", status, seen: false, borrowerName: null, dueOn: null, heldFor: null, titleId: "czz0000000000000000title1", title: "ZZ The Tiger in the Well", author: "ZZ A", loanId: null, ...extra });
const loan = (extra: Record<string, unknown> = {}) => ({ id: "czz00000000000000000loan1", copyId: "czz00000000000000000copy1", accession: "ZZ-0002", titleId: "czz0000000000000000title1", title: "ZZ The Tiger in the Well", author: "ZZ A", membershipId: "czz000000000000000000pup1", memberName: "ZZ Asha", className: "ZZ 5A", issuedAt: "2026-09-15T05:30:00.000Z", dueOn: "2026-09-29", returnedAt: null, renewedCount: 0, overdueDays: 5, canRenew: false, ...extra });
const member = { membershipId: "czz000000000000000000pup1", name: "ZZ Asha", kind: "PUPIL", className: "ZZ 5A", cardNumber: "L00001", onLoan: 1, limit: 2, owedPaise: 300 };

describe("the library desk on the phone (3 Oct 2026)", () => {
  it("says the library is off when the school has not switched it on", async () => {
    await mountStaff(<LibraryDesk />, "LIBRARIAN", {}, { me: meWith(["ALUMNI"]) });
    expect(await screen.findByText("Library is not switched on")).toBeTruthy();
  });

  it("finds a copy on loan by its scanned number and takes it back", async () => {
    const { calls } = await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      {
        "GET /api/v1/library/lookup": () => json({ kind: "COPY", copy: copyRow("ISSUED", { borrowerName: "ZZ Asha", dueOn: "2026-09-29", loanId: "czz00000000000000000loan1" }), member: null, title: null }),
        "POST /api/v1/library/returns": () => json({ loan: loan({ returnedAt: "2026-10-04T05:30:00.000Z" }), fine: null, heldFor: null }),
      },
      { me: meWith(["LIBRARY"]) },
    );
    await userEvent.setup().type(await screen.findByLabelText("Code"), "zz-0002");
    await press("Find");
    expect(await screen.findByText("ZZ The Tiger in the Well · ZZ-0002")).toBeTruthy();
    expect(screen.getByText(/On loan · with ZZ Asha, due/)).toBeTruthy();
    await press("Take it back");
    expect(await screen.findByText("\"ZZ The Tiger in the Well\" is back on the shelf.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/library/returns")?.body).toEqual({ accession: "ZZ-0002" });
    expect(calls().some((c) => c.line === "GET /api/v1/library/lookup?code=zz-0002")).toBe(true);
  });

  it("lends a copy on the shelf to a member found by name", async () => {
    const { calls } = await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      {
        "GET /api/v1/library/lookup": () => json({ kind: "COPY", copy: copyRow("AVAILABLE"), member: null, title: null }),
        "GET /api/v1/library/members": () => json({ items: [member, { ...member, membershipId: "czz000000000000000000pup2", name: "ZZ Bela", onLoan: 2 }] }),
        "POST /api/v1/library/issues": () => json(loan({ dueOn: "2026-10-18", overdueDays: 0 })),
      },
      { me: meWith(["LIBRARY"]) },
    );
    await userEvent.setup().type(await screen.findByLabelText("Code"), "ZZ-0002");
    await press("Find");
    await userEvent.setup().type(await screen.findByLabelText("Lend to whom? Type a name, a pupil code or a card"), "ZZ");
    await press("Find the person");
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
    const lend = screen.getAllByRole("button", { name: "Lend" });
    // Bela already holds her limit: her button is off.
    expect(lend[1]).toBeDisabled();
    await userEvent.setup().press(lend[0]!);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/library/issues")?.body).toEqual({ accession: "ZZ-0002", membershipId: "czz000000000000000000pup1" }));
    expect(await screen.findByText(/Lent "ZZ The Tiger in the Well" to ZZ Asha, due back on/)).toBeTruthy();
  });

  it("says when a code finds nothing, and a member's card shows what they hold and owe", async () => {
    let n = 0;
    await mountStaff(<LibraryDesk />, "LIBRARIAN", { "GET /api/v1/library/lookup": () => json(n++ === 0 ? { kind: "NONE", copy: null, member: null, title: null } : { kind: "MEMBER", copy: null, member, title: null }) }, { me: meWith(["LIBRARY"]) });
    const code = await screen.findByLabelText("Code");
    await userEvent.setup().type(code, "XX-9");
    await press("Find");
    expect(await screen.findByText("Nothing in the library has the code XX-9.")).toBeTruthy();
    await userEvent.setup().clear(code);
    await userEvent.setup().type(code, "L00001");
    await press("Find");
    expect(await screen.findByText(/holds 1 of 2 · owes ₹3/)).toBeTruthy();
  });

  it("lists the overdue loans and tells the borrowers once", async () => {
    const { calls } = await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      { "GET /api/v1/library/overdue": () => json({ todayKey: "2026-10-04", items: [loan()] }), "POST /api/v1/library/overdue/notices": () => json({ sent: 1, already: 0 }) },
      { me: meWith(["LIBRARY"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Overdue" }));
    expect(await screen.findByText("1 overdue")).toBeTruthy();
    expect(screen.getByText(/ZZ Asha \(ZZ 5A\) · due .* · 5 days late/)).toBeTruthy();
    await press("Send the notices");
    expect(await screen.findByText("1 told now; 0 already told today.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/library/overdue/notices")).toHaveLength(1);
  });

  it("shows the queue, ready ones with their copy", async () => {
    await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      { "GET /api/v1/library/reservations": () => json({ items: [{ id: "czz00000000000000000resv1", titleId: "czz0000000000000000title1", title: "ZZ The Tiger in the Well", membershipId: "czz000000000000000000pup2", memberName: "ZZ Bela", placedAt: "2026-10-02T06:30:00.000Z", ready: true, readyAccession: "ZZ-0001", position: 1 }] }) },
      { me: meWith(["LIBRARY"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Reservations" }));
    expect(await screen.findByText("ZZ Bela · ready at the desk (ZZ-0001)")).toBeTruthy();
  });

  it("an empty overdue list and queue lead back to the desk", async () => {
    await mountStaff(<LibraryDesk />, "LIBRARIAN", { "GET /api/v1/library/overdue": () => json({ todayKey: "2026-10-04", items: [] }), "GET /api/v1/library/reservations": () => json({ items: [] }) }, { me: meWith(["LIBRARY"]) });
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Overdue" }));
    expect(await screen.findByText("Nothing is overdue.")).toBeTruthy();
    await press("Desk");
    expect(await screen.findByLabelText("Code")).toBeTruthy();
    await userEvent.setup().press(screen.getByRole("radio", { name: "Reservations" }));
    expect(await screen.findByText("No reservations.")).toBeTruthy();
  });

  it("runs the stock-take: started, a copy marked seen, finished", async () => {
    let started = false;
    let seen = 0;
    const st = () => json({ startedAt: started ? "2026-10-04T04:30:00.000Z" : null, total: 30, seen, unseen: started ? [{ accession: "ZZ-0007", title: "ZZ Rivers", rack: "ZZ-A4", status: "AVAILABLE" }] : [] });
    const { calls } = await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      {
        "GET /api/v1/library/stocktake": st,
        "POST /api/v1/library/stocktake": ({ init }) => {
          started = (JSON.parse(String(init.body)) as { action: string }).action === "START";
          return st();
        },
        "POST /api/v1/library/stocktake/seen": () => {
          seen += 1;
          return st();
        },
      },
      { me: meWith(["LIBRARY"]) },
    );
    await userEvent.setup().press(await screen.findByRole("radio", { name: "Stock-take" }));
    await press("Start a stock-take");
    expect(await screen.findByText("The stock-take has started.")).toBeTruthy();
    expect(screen.getByText("ZZ-0007 · ZZ Rivers")).toBeTruthy();
    await userEvent.setup().type(screen.getByLabelText("Accession number"), "ZZ-0001");
    await press("Mark seen");
    expect(await screen.findByText("ZZ-0001 seen: 1 of 30.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/library/stocktake/seen")?.body).toEqual({ accession: "ZZ-0001" });
    await press("Finish the stock-take");
    // Asked first (TA-355), then finished.
    await press("Finish the stock-take");
    expect(await screen.findByText("The stock-take is finished: 1 of 30 seen.")).toBeTruthy();
  });

  it("says why the desk refused", async () => {
    await mountStaff(
      <LibraryDesk />,
      "LIBRARIAN",
      {
        "GET /api/v1/library/lookup": () => json({ kind: "COPY", copy: copyRow("ISSUED"), member: null, title: null }),
        "POST /api/v1/library/returns": () => json({ error: "That copy is not out on loan.", code: "FORBIDDEN" }, 403),
      },
      { me: meWith(["LIBRARY"]) },
    );
    await userEvent.setup().type(await screen.findByLabelText("Code"), "ZZ-0002");
    await press("Find");
    await press("Take it back");
    expect(await screen.findByText("That copy is not out on loan.")).toBeTruthy();
  });
});
