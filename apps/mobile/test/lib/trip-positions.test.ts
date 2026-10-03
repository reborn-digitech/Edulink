import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setOutboxStore, enqueue, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { __resetTripPositions, addFix, BATCH_EVERY_MS, BOARDINGS_TAG, fixOf, POSITIONS_TAG, queueBoarding, sendBatch, setBattery, waitingPositions } from "@/lib/trip-positions";

/** The bus's positions on their way: gathered, batched every fifteen seconds into the outbox, counted while they wait. */
const TRIP = "czz0000000000000000trip01";
const fix = (k: number) => ({ at: new Date(Date.UTC(2026, 9, 5, 2, 0, k)).toISOString(), lat: 18.5 + k / 1e5, lng: 73.8, speed: 5, accuracy: 10 });

function offline() {
  const fetch = jest.fn(async () => {
    throw new TypeError("Network request failed");
  });
  __setKeyStore(memoryStore({ [KEYS.token]: "tok-zz" }));
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "tok-zz", fetch: fetch as unknown as typeof globalThis.fetch }));
  __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
  return fetch;
}

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
  __resetTripPositions();
});

describe("a fix from the phone", () => {
  it("is the server's shape: an instant, the place, and speed and accuracy only when the phone knows them", () => {
    expect(fixOf({ coords: { latitude: 18.5, longitude: 73.8, speed: 7.25, accuracy: 12 }, timestamp: Date.UTC(2026, 9, 5, 2) })).toEqual({ at: "2026-10-05T02:00:00.000Z", lat: 18.5, lng: 73.8, speed: 7.25, accuracy: 12 });
    expect(fixOf({ coords: { latitude: 18.5, longitude: 73.8, speed: -1, accuracy: null }, timestamp: 0 })).toMatchObject({ speed: null, accuracy: null });
    expect(fixOf({ coords: { latitude: 18.5, longitude: 73.8, speed: 500, accuracy: 99_999 }, timestamp: 0 })).toMatchObject({ speed: 100, accuracy: 10_000 });
  });
});

describe("the batch", () => {
  it("gathers for fifteen seconds, then goes into the outbox as one POST with the battery", async () => {
    offline();
    setBattery(0.1);
    const t0 = 1_000_000;
    expect(await addFix(TRIP, fix(0), t0)).toBe(false);
    expect(await addFix(TRIP, fix(12), t0 + 12_000)).toBe(false);
    expect(await waitingPositions()).toBe(2);
    expect(await addFix(TRIP, fix(15), t0 + BATCH_EVERY_MS)).toBe(true);
    const [item] = await listQueued(POSITIONS_TAG);
    expect(item!.url).toBe(`/api/v1/transport/trips/${TRIP}/positions`);
    expect(item!.method).toBe("POST");
    const body = JSON.parse(item!.body) as { positions: unknown[]; battery: number; lowBattery: boolean };
    expect(body.positions).toHaveLength(3);
    expect(body.battery).toBe(0.1);
    expect(body.lowBattery).toBe(true);
    expect(await waitingPositions()).toBe(3);
  });

  it("sends what it has when the trip changes, and carries no battery it does not know", async () => {
    offline();
    setBattery(null);
    await addFix(TRIP, fix(0), 0);
    await addFix("czz0000000000000000trip02", fix(1), 1000);
    const queued = await listQueued(POSITIONS_TAG);
    expect(queued).toHaveLength(1);
    expect(JSON.parse(queued[0]!.body)).toEqual({ positions: [fix(0)] });
    expect(await sendBatch()).toBe(1);
    expect(await sendBatch()).toBe(0);
  });

  it("is low on battery when the phone saves power, whatever the level", async () => {
    offline();
    setBattery(0.9, true);
    await addFix(TRIP, fix(0), 0);
    await sendBatch();
    expect(JSON.parse((await listQueued(POSITIONS_TAG))[0]!.body)).toMatchObject({ battery: 0.9, lowBattery: true });
  });

  it("goes at two hundred fixes without waiting", async () => {
    offline();
    for (let k = 0; k < 199; k++) expect(await addFix(TRIP, fix(k), 0)).toBe(false);
    expect(await addFix(TRIP, fix(199), 0)).toBe(true);
  });

  it("counts only what parses as ours", async () => {
    offline();
    await enqueue({ url: "/x", method: "POST", body: "not json", tag: POSITIONS_TAG });
    expect(await waitingPositions()).toBe(0);
  });
});

describe("a tick on the roster", () => {
  it("waits in the outbox like the positions, with the instant it was made", async () => {
    offline();
    await queueBoarding(TRIP, { allotmentId: "czz00000000000000000seat1", boarded: true });
    const [item] = await listQueued(BOARDINGS_TAG);
    expect(item!.url).toBe(`/api/v1/transport/trips/${TRIP}/boardings`);
    expect(JSON.parse(item!.body)).toMatchObject({ allotmentId: "czz00000000000000000seat1", boarded: true, at: expect.any(String) });
  });
});
