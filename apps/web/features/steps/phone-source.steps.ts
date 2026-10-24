/**
 * Whether the phone has a screen for something (QA campaign, layer 3): the phone's screens are read as source, so a
 * scenario about a capability the app lacks can say so in a step that turns green the day a screen calls the door.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { Then } from "@cucumber/cucumber";
import { WEB_ROOT } from "./actors";

const SCREENS = join(WEB_ROOT, "..", "mobile", "src", "screens");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? files(full) : /\.(tsx?|jsx?)$/.test(name) ? [full] : [];
  });
}

Then(/^a phone screen under "([^"]+)" mentions "([^"]+)"$/, function (dirs: string, needle: string) {
  const roots = dirs.split(",").map((d) => join(SCREENS, d.trim()));
  const hits = roots.flatMap((r) => files(r)).filter((f) => readFileSync(f, "utf8").includes(needle));
  if (!hits.length) throw new Error(`no phone screen under ${dirs} mentions ${needle}`);
});
