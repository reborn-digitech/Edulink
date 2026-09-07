/**
 * Install, show or remove EduLink's crontab block.
 *
 *   npm run cron:install    writes ops/crontab (regenerated) into this user's crontab
 *   npm run cron:show       prints what is installed, and whether it matches ops/crontab
 *   npm run cron:remove     takes the block out again
 *
 * THE BLOCK IS MARKED AND REPLACED WHOLE. Everything between the two marker
 * lines is EduLink's; everything outside them is left exactly as found, so
 * this can be run on a box that already has a crontab. Idempotent: a
 * second install changes nothing. `ops/crontab` is the operator's copy of
 * what went in — it carries this checkout's absolute path, so it is not
 * committed; the schedule itself lives in src/lib/jobs.ts.
 *
 * This is the ONE piece that installs a schedule. Nothing in the app starts
 * a timer: two instances would mean two sweeps, and a deletion pass should
 * never race itself — which is also why `run-job.ts` takes a lock.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BEGIN = "# >>> edulink jobs >>>";
const END = "# <<< edulink jobs <<<";
const appDir = process.cwd();
const cronFile = resolve(appDir, "ops/crontab");

function generated() {
  // Generated through the same code /root/jobs reads, so the two cannot drift.
  const out = spawnSync(
    "npx",
    ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/gen-crontab.ts", appDir],
    { cwd: appDir, encoding: "utf8" },
  );
  if (out.status !== 0) throw new Error(out.stderr || "could not generate crontab");
  return out.stdout;
}

function current() {
  const out = spawnSync("crontab", ["-l"], { encoding: "utf8" });
  // "no crontab for user" is exit 1 with that message; treat as empty.
  return out.status === 0 ? out.stdout : "";
}

function withoutBlock(text) {
  const lines = text.split("\n");
  const a = lines.indexOf(BEGIN);
  const b = lines.indexOf(END);
  if (a === -1 || b === -1 || b < a) return text;
  return [...lines.slice(0, a), ...lines.slice(b + 1)].join("\n");
}

function install() {
  const block = generated();
  mkdirSync(resolve(appDir, "ops"), { recursive: true });
  writeFileSync(cronFile, block);
  mkdirSync(resolve(appDir, "logs"), { recursive: true });
  const rest = withoutBlock(current()).replace(/\n+$/, "");
  const next = `${rest ? rest + "\n\n" : ""}${BEGIN}\n${block.trimEnd()}\n${END}\n`;
  execFileSync("crontab", ["-"], { input: next });
  const count = (block.match(/^\S+ \S+ \S+ \S+ \S+  cd /gm) ?? []).length;
  console.log(`Installed ${count} jobs into crontab; copy at ops/crontab; logs in ${appDir}/logs/jobs.log`);
}

function show() {
  const text = current();
  const lines = text.split("\n");
  const a = lines.indexOf(BEGIN);
  const b = lines.indexOf(END);
  if (a === -1 || b === -1) {
    console.log("EduLink jobs are NOT installed in this user's crontab. Run `npm run cron:install`.");
    process.exit(2);
  }
  const installed = lines.slice(a + 1, b).join("\n") + "\n";
  console.log(installed);
  const fresh = generated();
  if (installed.trim() !== fresh.trim()) {
    console.log("⚠ Installed block differs from what src/lib/jobs.ts would generate now. Run `npm run cron:install` again.");
    process.exit(3);
  }
  console.log("✓ Installed and current.");
}

function remove() {
  const text = current();
  if (!text.includes(BEGIN)) {
    console.log("Nothing to remove.");
    return;
  }
  const next = withoutBlock(text).replace(/\n+$/, "");
  if (next.trim() === "") execFileSync("crontab", ["-r"]);
  else execFileSync("crontab", ["-"], { input: next + "\n" });
  console.log("Removed EduLink's block; everything else in the crontab is untouched.");
}

const cmd = process.argv[2];
if (cmd === "install") install();
else if (cmd === "show") show();
else if (cmd === "remove") remove();
else {
  console.error("usage: node scripts/cron.mjs install|show|remove");
  process.exit(1);
}
