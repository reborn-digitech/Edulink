/**
 * The passes' prices (QA campaign, layer 3): every price the page offers is its amount plus GST at the page's
 * own rate, the GST rounded to the paisa.
 */
import { Then } from "@cucumber/cucumber";
import { pick } from "./json-path";
import type { BddWorld } from "./world";

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
