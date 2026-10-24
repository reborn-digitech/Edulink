/**
 * THE SCENARIOS' VERBS (QA campaign, layer 3): who I am, what I ask the API, what I remember. Every request goes to
 * the running dev server's /api/v1 with a minted bearer token, the phone's door; nothing types a password, nothing
 * creates an account, and every person named is a ZZ or @demo.relay.test one (actors.ts refuses anyone else).
 */
import { Given, When } from "@cucumber/cucumber";
import { tokenFor } from "./actors";
import { pick } from "./json-path";
import type { BddWorld } from "./world";

Given(/^I am signed in as (?:the |an? )?([A-Z_]+)(?: (\S+@\S+))?$/, function (this: BddWorld, role: string, email?: string) {
  this.token = tokenFor(role, email);
  this.actor = email ? `${role} ${email}` : `the ZZ fixture's ${role}`;
});

Given("I am signed out", function (this: BddWorld) {
  this.token = null;
  this.actor = "signed out";
});

/**
 * A platform feature's switch as the premise of a scenario. The switches are the operator's and the campaign leaves
 * them as it found them (accounts.md: off on the dev database), so a scenario whose premise does not hold is skipped
 * for its environment, with the reason, rather than switched by the run.
 */
Given(/^the platform feature "([A-Z_]+)" is (on|off)$/, async function (this: BddWorld, code: string, want: "on" | "off") {
  const saved = { token: this.token, actor: this.actor };
  this.token = tokenFor("OPERATOR");
  const answer = await this.call("GET", "/api/v1/operator/features");
  Object.assign(this, saved);
  const features = (answer.json as { features?: { code: string; enabled: boolean }[] } | null)?.features ?? [];
  const row = features.find((f) => f.code === code);
  if (!row) throw new Error(`the operator's features list has no ${code}: ${answer.text.slice(0, 300)}`);
  if (row.enabled !== (want === "on")) {
    this.vars.set("__skip", `${code} is ${row.enabled ? "on" : "off"} on the dev database; the run does not switch it`);
    return "skipped";
  }
  this.answer = null;
  return undefined;
});

/** A premise the run cannot satisfy on this machine (a model server, Meta's Graph API): skipped with the reason. */
Given(/^the environment provides (.+)$/, function (this: BddWorld, what: string) {
  this.vars.set("__skip", `needs ${what}, which this run does not reach`);
  return "skipped";
});

Given(/^the next request carries the header "([^"]+)" set to "([^"]*)"$/, function (this: BddWorld, name: string, value: string) {
  this.nextHeaders[name] = this.fill(value);
});

When(/^I (GET|POST|PUT|PATCH|DELETE) "([^"]+)"$/, async function (this: BddWorld, method: string, path: string) {
  await this.call(method, path);
});

When(/^I (POST|PUT|PATCH|DELETE) "([^"]+)" with:$/, async function (this: BddWorld, method: string, path: string, body: string) {
  await this.call(method, path, body);
});

Given(/^I remember the field "([^"]+)" as "([\w.-]+)"$/, function (this: BddWorld, path: string, name: string) {
  const value = pick(this.last().json, path);
  if (value === undefined || value === null) throw new Error(`nothing at "${path}" to remember: ${this.describe()}`);
  this.vars.set(name, value);
});

/** The `field` of the first item of a list (optionally the first whose `where` equals a value), remembered. */
Given(/^I remember the "([^"]+)" of the first item of "([^"]+)"(?: whose "([^"]+)" equals (.+?))? as "([\w.-]+)"$/, function (this: BddWorld, field: string, list: string, whereArg: string | null, rawArg: string | null, name: string) {
  // An optional group that did not match arrives as null.
  const where = whereArg ?? undefined;
  const raw = rawArg ?? undefined;
  const items = pick(this.last().json, list);
  if (!Array.isArray(items)) throw new Error(`"${list}" is not a list: ${this.describe()}`);
  const want = raw === undefined ? undefined : JSON.parse(this.fill(raw));
  const item = items.find((i) => where === undefined || pick(i, where) === want);
  const value = item === undefined ? undefined : pick(item, field);
  if (value === undefined || value === null) throw new Error(`no item of "${list}"${where ? ` whose "${where}" is ${raw}` : ""} has a "${field}": ${this.describe()}`);
  this.vars.set(name, value);
});

Given(/^I remember (".*"|-?\d+(?:\.\d+)?|true|false) as "([\w.-]+)"$/, function (this: BddWorld, raw: string, name: string) {
  this.vars.set(name, JSON.parse(this.fill(raw)));
});
