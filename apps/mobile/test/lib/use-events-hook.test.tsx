import { AppState } from "react-native";
import { screen, waitFor } from "@testing-library/react-native";
import { Text } from "@/components";
import { useSession } from "@/lib/session";
import { useEvents, type RealtimeEvent } from "@/lib/use-events";
import { json, me, mountStaff } from "../screens/staff-harness";
import { fakeEvents } from "../screens/live-support";

/**
 * The hook over the connection: the stream is held only while the app is in
 * front (closed on "background", reopened on "active" with the screen told to
 * re-read), and session.ended hands the session provider the news, which
 * signs the person out the way a 401 does.
 */
const heard: RealtimeEvent[] = [];
const resumed = jest.fn();

function Ear() {
  const session = useSession();
  useEvents(["notification"], (event) => heard.push(event), { onResume: resumed });
  return <Text>{`session: ${session.status}`}</Text>;
}

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

describe("useEvents", () => {
  afterEach(() => {
    fakeEvents().reset();
    heard.length = 0;
    resumed.mockClear();
    jest.restoreAllMocks();
  });

  it("closes the stream when the app goes to the background and reopens it, telling the screen, when it is back", async () => {
    const live = fakeEvents();
    const listen = jest.spyOn(AppState, "addEventListener");
    await mountStaff(<Ear />, "ADMIN", {});
    await screen.findByText("session: signed-in");
    await live.opened();
    expect(live.opens).toBe(1);
    live.event("notification", { userId: "u1" });
    await waitFor(() => expect(heard).toHaveLength(1));

    const onChange = listen.mock.calls.find((c) => c[0] === "change")![1] as (state: string) => void;
    onChange("background");
    await tick();
    expect(() => live.event("notification", { userId: "u1" })).toThrow("the stream is not open");
    expect(resumed).not.toHaveBeenCalled();

    onChange("active");
    await waitFor(() => expect(live.opens).toBe(2));
    expect(resumed).toHaveBeenCalledTimes(1);
    live.event("notification", { userId: "u2" });
    await waitFor(() => expect(heard).toHaveLength(2));
    // Active again without having left: nothing to re-read, nothing reopened.
    onChange("active");
    await tick();
    expect(live.opens).toBe(2);
    expect(resumed).toHaveBeenCalledTimes(1);
  });

  it("session.ended asks the session provider to refresh, which finds the session gone and signs out", async () => {
    const live = fakeEvents();
    let asked = 0;
    await mountStaff(<Ear />, "ADMIN", { "GET /api/v1/me": () => (asked++ === 0 ? json(me("ADMIN")) : json({ error: "Signed out", code: "UNAUTHENTICATED" }, 401)) });
    await screen.findByText("session: signed-in");
    await live.opened();
    live.event("session.ended", {});
    await screen.findByText("session: signed-out");
    expect(asked).toBe(2);
    // Stopped for good: the stream was aborted and not reopened.
    await tick(50);
    expect(live.opens).toBe(1);
  });
});
