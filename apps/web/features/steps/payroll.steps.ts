/**
 * The PF return's own arithmetic (QA campaign, layer 3). An ECR line is `#~#`-separated: UAN, name, gross wages,
 * EPF wages, EPS wages, EDLI wages, the employee's EPF share, the EPS share, the EPF–EPS difference (the employer's
 * EPF share), NCP days, refunds. The employer's 12 % is split between the EPS and the difference, so where the EPF
 * and EPS wages are the same the two employer columns add up to the employee's share.
 */
import { Then } from "@cucumber/cucumber";
import { pick } from "./json-path";
import type { BddWorld } from "./world";

Then("every line of the PF return splits the employer's share exactly between EPS and the difference", function (this: BddWorld) {
  const content = String(pick(this.last().json, "content") ?? "");
  const lines = content.split("\n").filter(Boolean);
  if (!lines.length) throw new Error(`the return has no lines: ${this.describe()}`);
  const wrong = lines.filter((line) => {
    const f = line.split("#~#");
    const [epfWages, epsWages, ee, eps, diff] = [f[3], f[4], f[6], f[7], f[8]].map(Number) as [number, number, number, number, number];
    return epfWages === epsWages && eps + diff !== ee;
  });
  if (wrong.length) throw new Error(`${wrong.length} of ${lines.length} lines have EPS + difference ≠ the employee's share:\n  ${wrong.join("\n  ")}`);
});

Then("the PF return's total is the sum of its lines' contributions", function (this: BddWorld) {
  const content = String(pick(this.last().json, "content") ?? "");
  const lines = content.split("\n").filter(Boolean);
  const rupees = lines.reduce((s, line) => {
    const f = line.split("#~#").map(Number);
    return s + (f[6] ?? 0) + (f[7] ?? 0) + (f[8] ?? 0);
  }, 0);
  const total = Number(pick(this.last().json, "totalPaise"));
  if (rupees * 100 !== total) throw new Error(`the lines add up to ₹${rupees}, the return's total is ₹${total / 100}: ${this.describe()}`);
});
