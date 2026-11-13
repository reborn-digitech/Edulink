/**
 * TA-011 and TA-013 beyond the screens their own tests name: the hostel roll call mints its client
 * id per sheet as the lecture now does, and every route wrapped in <BackTo> (all but the home tab,
 * which keys itself the same way) is drawn afresh when it is opened again with other params.
 */
import { useState } from "react";
import { Text } from "react-native";
import { act, screen, userEvent } from "@testing-library/react-native";
import type { RoleCode } from "@edulink/contracts";
import { BackTo } from "@/components/back-to";
import { WardenHome } from "@/screens/hostel/warden";
import { __setOutboxStore, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { json, me, mountStaff, offline } from "./staff-harness";

const mockNav = (() => {
  let params: Record<string, string> = {};
  const readers = new Set<() => void>();
  return {
    read: () => params,
    subscribe: (reader: () => void) => {
      readers.add(reader);
      return () => {
        readers.delete(reader);
      };
    },
    open: (next: Record<string, string>) => {
      params = next;
      for (const reader of [...readers]) reader();
    },
  };
})();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");
  return { useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), usePathname: () => "/", useLocalSearchParams: () => React.useSyncExternalStore(mockNav.subscribe, mockNav.read) };
});

const HOSTEL = "czz000000000000000hostel1";
const A1 = "czz00000000000000000allot1";
const hostels = { hostels: [{ id: HOSTEL, name: "ZZ Tilak House", kind: "MIXED", capacity: 9, wardenMembershipId: "m1", wardenName: "ZZ Head", messAttendance: false, beds: 4, occupied: 1, rooms: [] }], wardens: [], canManage: false, canAllot: true };
const sheetFor = (dateKey: string) => ({ hostelId: HOSTEL, hostelName: "ZZ Tilak House", dateKey, slot: "NIGHT", taken: null, entries: [{ allotmentId: A1, membershipId: "m-p1", name: "ZZ Asha", roomNumber: "101", bed: 1, status: "PRESENT", onLeave: false }] });

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  __setReplayFetch((async () => {
    throw new TypeError("Network request failed");
  }) as unknown as typeof fetch);
  mockNav.open({});
});
afterEach(() => {
  __stopOutboxRunner();
  __setReplayFetch(null);
  __setOutboxStore(null);
});

describe("TA-011: the hostel roll call's client id", () => {
  it("TA-011: the next night's roll call, saved from the same mounted screen, carries an id of its own", async () => {
    let night = "2026-10-04";
    const { calls } = await mountStaff(
      <WardenHome />,
      "WARDEN",
      { "GET /api/v1/hostel/hostels": () => json(hostels), "GET /api/v1/hostel/rollcall": () => json(sheetFor(night)), "POST /api/v1/hostel/rollcall": () => json({ rollCallId: "r1", present: 1, onLeave: 0, absent: 0, replay: false }) },
      { me: { ...me("WARDEN" as RoleCode), modules: ["HOSTEL"] } },
    );
    const save = await screen.findByRole("button", { name: "Save the roll call" });
    // The screen stays up overnight: after this save the roll call is read again, for the next night.
    night = "2026-10-05";
    await userEvent.setup().press(save);
    await screen.findByText(/Roll call saved/);
    await screen.findByText("ZZ Tilak House · 05/10/2026");
    await userEvent.setup().press(screen.getByRole("button", { name: "Save the roll call" }));
    const posted = () => calls().filter((c) => c.line === "POST /api/v1/hostel/rollcall").map((c) => c.body as { dateKey: string; clientId: string });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    const [first, second] = posted();
    expect([first?.dateKey, second?.dateKey]).toEqual(["2026-10-04", "2026-10-05"]);
    expect(second!.clientId).not.toBe(first!.clientId);
  });

  it("TA-011: the same sheet saved twice with no signal keeps one id, so its replay is answered as the one roll call", async () => {
    await mountStaff(
      <WardenHome />,
      "WARDEN",
      { "GET /api/v1/hostel/hostels": () => json(hostels), "GET /api/v1/hostel/rollcall": () => json(sheetFor("2026-10-04")), "POST /api/v1/hostel/rollcall": offline },
      { me: { ...me("WARDEN" as RoleCode), modules: ["HOSTEL"] } },
    );
    await userEvent.setup().press(await screen.findByRole("button", { name: "Save the roll call" }));
    await screen.findByText(/saved on your device/);
    await userEvent.setup().press(screen.getByRole("button", { name: "Save the roll call" }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    const ids = (await listQueued(`hostel-roll:${HOSTEL}`)).map((row) => (JSON.parse(row.body) as { clientId: string }).clientId);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(1);
  });
});

describe("TA-013: a route opened again with other params", () => {
  /** A screen that, like the ones the finding names, reads its param once into state. */
  function SeededOnce() {
    const asked = (mockNav.read().membershipId ?? "") as string;
    const [first] = useState(asked);
    const [typed, setTyped] = useState("");
    return (
      <>
        <Text testID="zz-first">{first}</Text>
        <Text testID="zz-typed" onPress={() => setTyped("ZZ typed")}>
          {typed}
        </Text>
      </>
    );
  }

  it("TA-013: is drawn for the new params, and keeps what it had when opened again with the same ones", async () => {
    mockNav.open({ membershipId: "czzpupil1" });
    await mountStaff(
      <BackTo>
        <SeededOnce />
      </BackTo>,
      "TEACHER",
      {},
    );
    expect(screen.getByTestId("zz-first")).toHaveTextContent("czzpupil1");
    await userEvent.setup().press(screen.getByTestId("zz-typed"));
    expect(screen.getByTestId("zz-typed")).toHaveTextContent("ZZ typed");

    // The same pupil again: nothing is lost.
    await act(async () => {
      mockNav.open({ membershipId: "czzpupil1" });
    });
    expect(screen.getByTestId("zz-typed")).toHaveTextContent("ZZ typed");

    // Another pupil: drawn afresh for that one.
    await act(async () => {
      mockNav.open({ membershipId: "czzpupil2" });
    });
    expect(screen.getByTestId("zz-first")).toHaveTextContent("czzpupil2");
    expect(screen.getByTestId("zz-typed")).toHaveTextContent("");
  });
});
