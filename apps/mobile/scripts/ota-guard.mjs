#!/usr/bin/env node
/**
 * The over-the-air policy, enforced: a JS-only change may ship as an update
 * to the build already in people's hands; anything that touches a native
 * module goes through the store as a new version. This compares the tree
 * against the last store release (the newest tag mobile-vX.Y.Z, or a ref
 * given as --since) and refuses when a native-affecting path changed.
 *
 *   node scripts/ota-guard.mjs                 exit 1 if the update is not JS-only
 *   node scripts/ota-guard.mjs --since <ref>
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

import rules from "./ota-guard-rules.js";
const { classify } = rules;

function git(cmd) {
  return execSync(`git ${cmd}`, { encoding: "utf8" }).trim();
}

if (process.argv[1] && process.argv[1].endsWith("ota-guard.mjs")) {
  const sinceFlag = process.argv.indexOf("--since");
  const since = sinceFlag >= 0 ? process.argv[sinceFlag + 1] : git("tag --list 'mobile-v*' --sort=-v:refname").split("\n")[0];
  if (!since) {
    console.error("ota-guard: no mobile-v* tag and no --since: nothing to compare with, so nothing may ship over the air.");
    process.exit(1);
  }
  const changed = git(`diff --name-only ${since}..HEAD`).split("\n").filter(Boolean);
  const bundled = JSON.parse(readFileSync(new URL("../node_modules/expo/bundledNativeModules.json", import.meta.url), "utf8"));
  const before = changed.includes("apps/mobile/package.json") ? JSON.parse(git(`show ${since}:apps/mobile/package.json`)) : {};
  const after = changed.includes("apps/mobile/package.json") ? JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) : {};
  const result = classify(changed, { before, after, bundled });
  console.log(`ota-guard: ${changed.length} files changed since ${since}`);
  if (!result.ok) {
    if (result.native.length) console.error(`  native paths changed:\n    ${result.native.join("\n    ")}`);
    if (result.deps.length) console.error(`  native dependencies changed: ${result.deps.join(", ")}`);
    console.error("ota-guard: this is a store release, not an update. Bump the version, build, and tag mobile-vX.Y.Z.");
    process.exit(1);
  }
  console.log("ota-guard: JS only; the update may ship to the build already in people's hands.");
}
