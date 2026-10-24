/**
 * THE PHONE'S OFFLINE QUEUE (QA campaign, layer 3). The phone's own outbox library (apps/mobile/src/lib/outbox.ts,
 * the in-memory store it uses on the web target and in tests) is driven step by step: queue, flush against a
 * network that answers what the scenario says, sign in as another person, let days pass, sign out. Where a scenario
 * flushes "to the dev server", each row goes out to the running server with the session's bearer token and the two
 * replay headers the phone's runner adds (X-Edulink-Replay, X-Edulink-Owner), so the phone's half and the server's
 * half of the contract meet.
 */
import { Given, Then, When } from "@cucumber/cucumber";
import { __setOutboxStore, clearQueue, countQueued, enqueue, flushQueue, heldElsewhere, listQueued, memoryOutbox, onQueueEvent, setOutboxOwner, type QueuedRequest } from "../../../mobile/src/lib/outbox";
import type { BddWorld } from "./world";

type Phone = { sent: QueuedRequest[]; statuses: number[]; rejected: number[]; last: { sent: number; failed: number; remaining: number } | null; now: number; off: () => void };

function phone(world: BddWorld): Phone {
  const p = world.vars.get("__phone") as Phone | undefined;
  if (!p) throw new Error('start with "Given the phone\'s outbox is empty"');
  return p;
}

Given("the phone's outbox is empty", function (this: BddWorld) {
  (this.vars.get("__phone") as Phone | undefined)?.off();
  __setOutboxStore(memoryOutbox());
  setOutboxOwner(null);
  const p: Phone = { sent: [], statuses: [], rejected: [], last: null, now: Date.now(), off: () => undefined };
  p.off = onQueueEvent((e) => {
    if (e.type === "rejected") p.rejected.push(e.status);
  });
  this.vars.set("__phone", p);
});

/** The phone learns who is signed in from the session it holds: the minted session's own /api/v1/me. */
Given("the phone is signed in as the person of this session", async function (this: BddWorld) {
  const me = await this.call("GET", "/api/v1/me");
  const json = me.json as { user?: { id: string }; active?: { schoolId: string | null; membershipId: string | null } } | null;
  if (me.status !== 200 || !json?.user) throw new Error(`could not read the session's person: ${this.describe()}`);
  setOutboxOwner({ userId: json.user.id, schoolId: json.active?.schoolId ?? null, membershipId: json.active?.membershipId ?? null });
  this.vars.set("__phoneUser", json.user.id);
  this.vars.set("__phoneSchool", json.active?.schoolId ?? null);
});

Given(/^the phone is signed in as "([\w.-]+)" at "([\w.-]+)"$/, function (this: BddWorld, userId: string, schoolId: string) {
  setOutboxOwner({ userId, schoolId, membershipId: `${userId}-at-${schoolId}` });
});

Given("the same person switches the phone to another school", function (this: BddWorld) {
  setOutboxOwner({ userId: String(this.vars.get("__phoneUser")), schoolId: "zz-bdd-another-school", membershipId: "zz-bdd-other-membership" });
});

Given("the same person switches the phone back", function (this: BddWorld) {
  setOutboxOwner({ userId: String(this.vars.get("__phoneUser")), schoolId: (this.vars.get("__phoneSchool") as string | null) ?? null, membershipId: null });
});

When(/^the phone queues (POST|PUT|PATCH|DELETE) "([^"]+)" with:$/, async function (this: BddWorld, method: string, url: string, body: string) {
  phone(this);
  await enqueue({ url: this.fill(url), method, body: this.fill(body), tag: "bdd" });
});

When(/^the network answers every request with (\d{3}) and the outbox flushes$/, async function (this: BddWorld, code: string) {
  const p = phone(this);
  p.last = await flushQueue(async (item) => {
    p.sent.push(item);
    p.statuses.push(Number(code));
    return { status: Number(code) };
  }, p.now);
});

When("the network is down and the outbox flushes", async function (this: BddWorld) {
  const p = phone(this);
  p.last = await flushQueue(async () => {
    throw new Error("Network request failed");
  }, p.now);
});

When(/^(\d+) days pass$/, function (this: BddWorld, days: string) {
  phone(this).now += Number(days) * 86_400_000;
});

/** Each row to the running server, as the phone's runner sends it: the bearer, the replay header and the owner. */
When("the outbox flushes to the dev server", async function (this: BddWorld) {
  const p = phone(this);
  p.last = await flushQueue(async (item) => {
    this.nextHeaders = { "X-Edulink-Replay": "1", ...(item.owner ? { "X-Edulink-Owner": item.owner } : {}) };
    const answer = await this.call(item.method, item.url, item.body);
    p.sent.push(item);
    p.statuses.push(answer.status);
    return { status: answer.status };
  }, p.now);
});

When("the person signs out of the phone", async function (this: BddWorld) {
  phone(this);
  await clearQueue();
  setOutboxOwner(null);
});

Then(/^the outbox holds (\d+) rows? for the person signed in$/, async function (this: BddWorld, n: string) {
  phone(this);
  const count = await countQueued();
  if (count !== Number(n)) throw new Error(`the outbox holds ${count} rows for the person signed in, expected ${n}: ${JSON.stringify(await listQueued()).slice(0, 400)}`);
});

Then(/^(\d+) rows? (?:was|were) sent$/, function (this: BddWorld, n: string) {
  const p = phone(this);
  if (p.sent.length !== Number(n)) throw new Error(`${p.sent.length} rows were sent, expected ${n}: ${JSON.stringify(p.sent.map((s) => s.url))}`);
});

Then(/^the rows were sent in the order they were queued$/, function (this: BddWorld) {
  const p = phone(this);
  const times = p.sent.map((s) => s.createdAt);
  if (times.some((t, i) => i > 0 && t < times[i - 1]!)) throw new Error(`sent out of order: ${times.join(", ")}`);
});

Then(/^the outbox reported (\d+) rejected with status (\d{3})$/, function (this: BddWorld, n: string, code: string) {
  const p = phone(this);
  const hits = p.rejected.filter((s) => s === Number(code)).length;
  if (hits !== Number(n)) throw new Error(`${hits} rejections with ${code}, expected ${n} (all: ${p.rejected.join(", ") || "none"})`);
});

Then(/^(?:the|every) waiting rows? (?:has|have) been tried (\d+) times?$/, async function (this: BddWorld, n: string) {
  const rows = await listQueued();
  if (!rows.length || rows.some((r) => r.attempts !== Number(n))) throw new Error(`expected every waiting row tried ${n} times: ${JSON.stringify(rows).slice(0, 400)}`);
});

Then(/^every row sent named its owner as the person signed in$/, function (this: BddWorld) {
  const p = phone(this);
  const who = this.vars.get("__phoneUser");
  const wrong = p.sent.filter((s) => s.owner !== who);
  if (!p.sent.length || wrong.length) throw new Error(`${wrong.length} of ${p.sent.length} rows named another owner`);
});

Then(/^the dev server answered the rows (.+)$/, function (this: BddWorld, list: string) {
  const want = list.split(/,|\band\b|\bthen\b/).map((s) => Number(s.trim())).filter(Boolean);
  const got = phone(this).statuses;
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`the server answered ${got.join(", ")}, expected ${want.join(", ")}; last answer: ${this.answer ? this.describe() : "none"}`);
});

Then(/^the phone holds (\d+) rows? of this person at another school$/, async function (this: BddWorld, n: string) {
  const held = await heldElsewhere();
  const total = [...held.values()].reduce((s, v) => s + v, 0);
  if (total !== Number(n)) throw new Error(`held elsewhere: ${total}, expected ${n}`);
});
