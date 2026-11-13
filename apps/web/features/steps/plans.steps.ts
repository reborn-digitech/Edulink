/**
 * The passes' prices (QA campaign, layer 3): every price the page offers is its amount plus GST at the page's
 * own rate, the GST rounded to the paisa.
 */
import { Given, Then } from "@cucumber/cucumber";
import { tokenFor } from "./actors";
import { pick } from "./json-path";
import type { BddWorld } from "./world";

/**
 * A plan asked for, as the premise of a scenario (TA-467): the operator's switch, read and never set, like the platform
 * feature's premise in http.steps.ts; a run where it is off is skipped with the reason.
 */
Given(/^the plan "([A-Z]+)" is active$/, async function (this: BddWorld, code: string) {
  const saved = { token: this.token, actor: this.actor };
  this.token = tokenFor("OPERATOR");
  const answer = await this.call("GET", "/api/v1/operator/person-plans");
  Object.assign(this, saved);
  const plans = (answer.json as { plans?: { code: string; active: boolean }[] } | null)?.plans ?? [];
  const row = plans.find((p) => p.code === code);
  if (!row) throw new Error(`the operator's plans list has no ${code}: ${answer.text.slice(0, 300)}`);
  if (!row.active) {
    this.vars.set("__skip", `the ${code} plan is not active on the dev database; the run does not switch it`);
    return "skipped";
  }
  this.answer = null;
  return undefined;
});

/** The signed-in person holds no pass of the plan now (their own pass page says so); a run where they do is skipped. */
Given(/^I hold no "([A-Z]+)" pass$/, async function (this: BddWorld, code: string) {
  const answer = await this.call("GET", "/api/v1/account/pass");
  const held = (answer.json as { held?: { plan: string }[] } | null)?.held ?? [];
  this.answer = null;
  if (held.some((h) => h.plan === code)) {
    this.vars.set("__skip", `${this.actor} holds the ${code} plan on the dev database; the run does not revoke it`);
    return "skipped";
  }
  return undefined;
});

type Price = { period: string; amountPaise: number; gstPaise: number; totalPaise: number };

Then("every price offered is its amount plus GST at the stated rate", function (this: BddWorld) {
  const json = this.last().json;
  const rate = Number(pick(json, "gstPercent"));
  const offers = (pick(json, "offers") ?? []) as { plan: string; prices: Price[] }[];
  const prices = offers.flatMap((o) => o.prices.map((p) => ({ plan: o.plan, ...p })));
  if (!prices.length) throw new Error(`no prices offered: ${this.describe()}`);
  const wrong = prices.filter((p) => p.gstPaise !== Math.round((p.amountPaise * rate) / 100) || p.totalPaise !== p.amountPaise + p.gstPaise);
  if (wrong.length) throw new Error(`${wrong.length} prices do not add up at ${rate} %: ${JSON.stringify(wrong)}`);
});
