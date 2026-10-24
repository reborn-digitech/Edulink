/**
 * The college desks' own rules, where a generic field step would not say them (QA campaign, layer 3).
 */
import { Then } from "@cucumber/cucumber";
import { pick } from "./json-path";
import type { BddWorld } from "./world";

type EligibilityRow = { percent: number | null; threshold: number; condoned: boolean; eligible: boolean };

/** The 75 % rule (academics-attendance.ts): under the threshold and not condoned is not eligible; at or over it is. */
Then("every row under its threshold and not condoned is not eligible", function (this: BddWorld) {
  const rows = (pick(this.last().json, "rows") ?? []) as EligibilityRow[];
  const wrong = rows.filter((r) => r.percent !== null && ((r.percent < r.threshold && !r.condoned && r.eligible) || (r.percent >= r.threshold && !r.eligible)));
  if (wrong.length) throw new Error(`${wrong.length} rows break the rule: ${JSON.stringify(wrong).slice(0, 500)}`);
});

type LogbookEntry = { id: string; state: string; signedAt: string | null; remark: string };

/** A logbook's states say what they carry: SIGNED a signing date, RETURNED the supervisor's remark (clinical.ts). */
Then("every SIGNED entry has a signing date and every RETURNED entry a remark", function (this: BddWorld) {
  const entries = (pick(this.last().json, "entries") ?? []) as LogbookEntry[];
  const wrong = entries.filter((e) => (e.state === "SIGNED" && !e.signedAt) || (e.state === "RETURNED" && !e.remark));
  if (wrong.length) throw new Error(`${wrong.length} entries lack what their state carries: ${JSON.stringify(wrong).slice(0, 500)}`);
});
