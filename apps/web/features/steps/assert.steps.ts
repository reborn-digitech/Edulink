/**
 * WHAT A SCENARIO EXPECTS (QA campaign, layer 3): the status, the error's code, the catalog's response contract,
 * and fields of the JSON answer. Every failure message carries the request, who made it and the start of the body.
 */
import { isDeepStrictEqual } from "node:util";
import { Then } from "@cucumber/cucumber";
import { contractIssues, doorFor, listed } from "./catalog";
import { pick } from "./json-path";
import type { BddWorld } from "./world";

/**
 * Plain Errors rather than node:assert's: cucumber prints an AssertionError as its bare diff and drops the message,
 * and the message (the request, who made it, the body) is what makes a red scenario readable.
 */
type Checks = {
  ok(cond: unknown, message: string): asserts cond;
  equal(actual: unknown, expected: unknown, message: string): void;
  deepEqual(actual: unknown, expected: unknown, message: string): void;
  notDeepEqual(actual: unknown, expected: unknown, message: string): void;
};
const assert: Checks = {
  ok(cond: unknown, message: string): asserts cond {
    if (!cond) throw new Error(message);
  },
  equal(actual: unknown, expected: unknown, message: string): void {
    if (actual !== expected) throw new Error(`expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)?.slice(0, 300)} — ${message}`);
  },
  deepEqual(actual: unknown, expected: unknown, message: string): void {
    if (!isDeepStrictEqual(actual, expected)) throw new Error(`expected ${JSON.stringify(expected)?.slice(0, 300)}, got ${JSON.stringify(actual)?.slice(0, 300)} — ${message}`);
  },
  notDeepEqual(actual: unknown, expected: unknown, message: string): void {
    if (isDeepStrictEqual(actual, expected)) throw new Error(`expected anything but ${JSON.stringify(expected)} — ${message}`);
  },
};

/** A literal in a step: JSON (a quoted string, a number, true, false, null), after `{{name}}` is filled. */
function literal(world: BddWorld, raw: string): unknown {
  const text = world.fill(raw.trim());
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`the value ${raw} in the step is not JSON (quote a string)`);
  }
}

function field(world: BddWorld, path: string): unknown {
  return pick(world.last().json, world.fill(path));
}

function list(world: BddWorld, path: string): unknown[] {
  const value = field(world, path);
  assert.ok(Array.isArray(value), `"${path}" is not a list (${JSON.stringify(value)?.slice(0, 200)}): ${world.describe()}`);
  return value as unknown[];
}

function num(world: BddWorld, path: string): number {
  const value = field(world, path);
  assert.equal(typeof value, "number", `"${path}" is not a number (${JSON.stringify(value)}): ${world.describe()}`);
  return value as number;
}

Then(/^the status is (\d{3})$/, function (this: BddWorld, code: string) {
  assert.equal(this.last().status, Number(code), this.describe());
});

Then(/^the status is one of ([\d, or]+)$/, function (this: BddWorld, codes: string) {
  const allowed = codes.split(/,|\bor\b/).map((s) => Number(s.trim())).filter(Boolean);
  assert.ok(allowed.includes(this.last().status), `expected one of ${allowed.join(", ")}: ${this.describe()}`);
});

Then(/^the error code is "([A-Z_]+)"$/, function (this: BddWorld, code: string) {
  assert.equal(pick(this.last().json, "code"), code, this.describe());
});

Then("the answer matches the catalog contract", function (this: BddWorld) {
  const a = this.last();
  const door = doorFor(a.method, a.path);
  assert.ok(door, `the catalog lists no door for ${a.method} ${a.path}`);
  const issues = contractIssues(door, a.json);
  assert.deepEqual(issues, [], `the answer of ${a.method} ${door.path} does not parse with the catalog's response schema:\n  ${issues.join("\n  ")}\n${this.describe()}`);
});

Then(/^the catalog (lists|does not list) "(GET|POST|PUT|PATCH|DELETE) ([^"]+)"$/, function (this: BddWorld, verb: string, method: string, template: string) {
  assert.equal(listed(method, template), verb === "lists", `the catalog ${verb === "lists" ? "does not list" : "lists"} ${method} ${template}`);
});

Then(/^the field "([^"]+)" equals ((?:"[^"]*")|-?\d+(?:\.\d+)?|true|false|null|\{\{[\w.-]+\}\}|"\{\{[\w.-]+\}\}"|\[.*\])$/, function (this: BddWorld, path: string, raw: string) {
  assert.deepEqual(field(this, path), literal(this, raw), `"${path}": ${this.describe()}`);
});

Then(/^the field "([^"]+)" does not equal ((?:"[^"]*")|-?\d+(?:\.\d+)?|true|false|null|\{\{[\w.-]+\}\}|"\{\{[\w.-]+\}\}"|\[.*\])$/, function (this: BddWorld, path: string, raw: string) {
  assert.notDeepEqual(field(this, path), literal(this, raw), `"${path}": ${this.describe()}`);
});

Then(/^the field "([^"]+)" is present$/, function (this: BddWorld, path: string) {
  const value = field(this, path);
  assert.ok(value !== undefined && value !== null, `"${path}" is ${JSON.stringify(value)}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" is absent or null$/, function (this: BddWorld, path: string) {
  const value = field(this, path);
  assert.ok(value === undefined || value === null, `"${path}" is ${JSON.stringify(value)?.slice(0, 200)}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" is a list of at least (\d+) items?$/, function (this: BddWorld, path: string, n: string) {
  assert.ok(list(this, path).length >= Number(n), `"${path}" has ${list(this, path).length} items, wanted at least ${n}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" is an empty list$/, function (this: BddWorld, path: string) {
  assert.equal(list(this, path).length, 0, `"${path}": ${this.describe()}`);
});

Then(/^the field "([^"]+)" is (at least|at most|more than|less than) (-?\d+(?:\.\d+)?)$/, function (this: BddWorld, path: string, how: string, raw: string) {
  const v = num(this, path);
  const n = Number(raw);
  const ok = how === "at least" ? v >= n : how === "at most" ? v <= n : how === "more than" ? v > n : v < n;
  assert.ok(ok, `"${path}" is ${v}, wanted ${how} ${n}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals the field "([^"]+)" minus the field "([^"]+)"$/, function (this: BddWorld, total: string, a: string, b: string) {
  assert.equal(num(this, total), num(this, a) - num(this, b), `${total} ≠ ${a} − ${b}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals the sum of "([^"]+)" over "([^"]+)"$/, function (this: BddWorld, total: string, prop: string, over: string) {
  const sum = list(this, over).reduce<number>((s, item) => s + Number(pick(item, prop) ?? 0), 0);
  assert.equal(num(this, total), sum, `${total} is ${num(this, total)}, the sum of ${prop} over ${over} is ${sum}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals the number of items of "([^"]+)"(?: whose "([^"]+)" equals (.+))?$/, function (this: BddWorld, total: string, over: string, whereArg: string | null, rawArg: string | null) {
  const where = whereArg ?? undefined;
  const want = rawArg === null || rawArg === undefined ? undefined : literal(this, rawArg);
  const count = list(this, over).filter((i) => where === undefined || pick(i, where) === want).length;
  assert.equal(num(this, total), count, `${total} is ${num(this, total)}, counted ${count}: ${this.describe()}`);
});

Then(/^(every|some|no) item of "([^"]+)" has "([^"]+)" equal to ((?:"[^"]*")|-?\d+(?:\.\d+)?|true|false|null|\{\{[\w.-]+\}\}|"\{\{[\w.-]+\}\}"|\[.*\])$/, function (this: BddWorld, quantifier: string, over: string, prop: string, raw: string) {
  const want = literal(this, raw);
  const items = list(this, over);
  const hits = items.filter((i) => JSON.stringify(pick(i, prop)) === JSON.stringify(want)).length;
  if (quantifier === "every") assert.ok(items.length > 0 && hits === items.length, `${hits} of ${items.length} items of "${over}" have ${prop} = ${raw}: ${this.describe()}`);
  else if (quantifier === "some") assert.ok(hits > 0, `no item of "${over}" has ${prop} = ${raw}: ${this.describe()}`);
  else assert.equal(hits, 0, `${hits} items of "${over}" have ${prop} = ${raw}: ${this.describe()}`);
});

Then(/^(every|some|no) item of "([^"]+)" has "([^"]+)" present$/, function (this: BddWorld, quantifier: string, over: string, prop: string) {
  const items = list(this, over);
  const hits = items.filter((i) => pick(i, prop) !== undefined && pick(i, prop) !== null).length;
  if (quantifier === "every") assert.ok(items.length > 0 && hits === items.length, `${hits} of ${items.length} items of "${over}" have ${prop}: ${this.describe()}`);
  else if (quantifier === "some") assert.ok(hits > 0, `no item of "${over}" has ${prop}: ${this.describe()}`);
  else assert.equal(hits, 0, `${hits} items of "${over}" have ${prop}: ${this.describe()}`);
});

Then(/^the content type contains "([^"]+)"$/, function (this: BddWorld, part: string) {
  assert.ok(this.last().contentType.includes(part), this.describe());
});

Then(/^the answer (contains|does not contain) "([^"]+)"$/, function (this: BddWorld, verb: string, raw: string) {
  const text = this.fill(raw);
  assert.equal(this.last().text.includes(text), verb === "contains", `${verb} "${text}": ${this.describe()}`);
});

Then(/^the answer took less than (\d+) seconds?$/, function (this: BddWorld, s: string) {
  assert.ok(this.last().ms < Number(s) * 1000, `took ${this.last().ms} ms: ${this.last().method} ${this.last().path}`);
});

Then(/^the field "([^"]+)" is not earlier than the field "([^"]+)"$/, function (this: BddWorld, later: string, earlier: string) {
  const a = Date.parse(String(field(this, later)));
  const b = Date.parse(String(field(this, earlier)));
  assert.ok(Number.isFinite(a) && Number.isFinite(b), `"${later}" or "${earlier}" is not a date: ${this.describe()}`);
  assert.ok(a >= b, `"${later}" (${String(field(this, later))}) is earlier than "${earlier}" (${String(field(this, earlier))}): ${this.describe()}`);
});

/** For a list: every item that has `when` set has it no earlier than its `since` (a revocation after its issue). */
Then(/^every item of "([^"]+)" with "([^"]+)" present has it no earlier than its "([^"]+)"$/, function (this: BddWorld, over: string, later: string, earlier: string) {
  const bad = list(this, over).filter((i) => {
    const a = pick(i, later);
    if (a === undefined || a === null) return false;
    return Date.parse(String(a)) < Date.parse(String(pick(i, earlier)));
  });
  assert.equal(bad.length, 0, `${bad.length} items of "${over}" have ${later} before ${earlier}: ${JSON.stringify(bad).slice(0, 500)}`);
});

Then(/^the field "([^"]+)" equals the rounded mean of "([^"]+)" over "([^"]+)"$/, function (this: BddWorld, total: string, prop: string, over: string) {
  const values = list(this, over).map((i) => Number(pick(i, prop)));
  assert.ok(values.length > 0, `"${over}" is empty: ${this.describe()}`);
  const mean = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  assert.equal(num(this, total), mean, `${total} against the mean of ${prop} over ${over} (${values.join(", ")})`);
});

/** A weighted part list: the item's `percent` is the weight-weighted mean of its parts' percents, rounded. */
Then(/^every item of "([^"]+)" has "([^"]+)" equal to the weighted mean of its "([^"]+)" by "([^"]+)" over "([^"]+)"$/, function (this: BddWorld, over: string, prop: string, partProp: string, weight: string, parts: string) {
  for (const item of list(this, over)) {
    const ps = pick(item, parts);
    if (!Array.isArray(ps) || ps.length === 0) continue;
    const w = ps.reduce<number>((s, p) => s + Number(pick(p, weight)), 0);
    const mean = Math.round(ps.reduce<number>((s, p) => s + Number(pick(p, partProp)) * Number(pick(p, weight)), 0) / w);
    assert.equal(pick(item, prop), mean, `${JSON.stringify(item).slice(0, 300)}`);
  }
});

/** Date keys and ISO instants compare as strings of one shape: `every item of "items" has "dueOn" before "{{today}}"`. */
Then(/^every item of "([^"]+)" has "([^"]+)" (before|after|no later than|no earlier than) (".*")$/, function (this: BddWorld, over: string, prop: string, how: string, raw: string) {
  const bound = String(literal(this, raw));
  const bad = list(this, over).filter((i) => {
    const v = String(pick(i, prop));
    return how === "before" ? !(v < bound) : how === "after" ? !(v > bound) : how === "no later than" ? !(v <= bound) : !(v >= bound);
  });
  assert.equal(bad.length, 0, `${bad.length} items of "${over}" do not have ${prop} ${how} ${bound}: ${JSON.stringify(bad).slice(0, 400)}`);
});

Then(/^every item of "([^"]+)" has "([^"]+)" no more than its "([^"]+)"$/, function (this: BddWorld, over: string, small: string, big: string) {
  const bad = list(this, over).filter((i) => Number(pick(i, small)) > Number(pick(i, big)));
  assert.equal(bad.length, 0, `${bad.length} items of "${over}" have ${small} above ${big}: ${JSON.stringify(bad).slice(0, 400)}`);
});

Then(/^the field "([^"]+)" has no more items than the field "([^"]+)"$/, function (this: BddWorld, over: string, cap: string) {
  assert.ok(list(this, over).length <= num(this, cap), `"${over}" has ${list(this, over).length} items, "${cap}" is ${num(this, cap)}: ${this.describe()}`);
});

Then("the content type does not say JSON", function (this: BddWorld) {
  assert.ok(this.last().status === 200 && !this.last().contentType.includes("json"), `expected a file: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals the field "([^"]+)" minus the field "([^"]+)" to (\d+) decimal places?$/, function (this: BddWorld, total: string, a: string, b: string, places: string) {
  const want = Number((num(this, a) - num(this, b)).toFixed(Number(places)));
  assert.equal(Number(num(this, total).toFixed(Number(places))), want, `${total} against ${a} − ${b}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals "([^"]+)" as a percentage of "([^"]+)" to (\d+) decimal places?$/, function (this: BddWorld, total: string, part: string, whole: string, places: string) {
  const want = Number(((num(this, part) / num(this, whole)) * 100).toFixed(Number(places)));
  assert.equal(num(this, total), want, `${total} against ${part} / ${whole}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals the sum of the fields (.+)$/, function (this: BddWorld, total: string, rest: string) {
  const parts = [...rest.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
  const sum = parts.reduce((s, p) => s + num(this, p), 0);
  assert.equal(num(this, total), sum, `${total} against ${parts.join(" + ")}: ${this.describe()}`);
});

Then(/^the field "([^"]+)" equals the field "([^"]+)"$/, function (this: BddWorld, a: string, b: string) {
  assert.deepEqual(field(this, a), field(this, b), `"${a}" against "${b}": ${this.describe()}`);
});

/** Eligibility: a row refused must say which rule refused it (a non-empty `failed`). */
Then(/^every item of "([^"]+)" whose "([^"]+)" is (true|false) names a failed rule$/, function (this: BddWorld, over: string, prop: string, raw: string) {
  const want = raw === "true";
  const bad = list(this, over).filter((i) => pick(i, prop) === want && !(Array.isArray(pick(i, "failed")) && (pick(i, "failed") as unknown[]).length > 0));
  assert.equal(bad.length, 0, `${bad.length} rows refused without a rule: ${JSON.stringify(bad).slice(0, 400)}`);
});
