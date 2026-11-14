import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * TA-261 (testing analysis of 13 November 2026, the owner's decision of 14 November 2026): the store forms'
 * answers named one permission, notifications, and said location was never requested, while app.json asked for the
 * camera and for location during a bus trip. A Data safety form that says "no location" for an app that asks for
 * it is a store-policy breach, and nothing tied the two files together.
 *
 * This ties them. Every plugin of app.json that asks the person for something, each permission string it sets and
 * each background switch it turns on must be named, in backticks, in the table "Permissions the app asks for" of
 * store/privacy-answers.md. A plugin this file does not know is taken to ask for something, so a new one cannot
 * arrive without either a row in the answers or a line in the list below saying it asks for nothing.
 */

const ROOT = join(__dirname, "..", "..");
const ANSWERS = readFileSync(join(ROOT, "store", "privacy-answers.md"), "utf8");

type Plugin = string | [string, Record<string, unknown>?];
type AppJson = { expo: { plugins?: Plugin[]; android?: { permissions?: string[] }; ios?: { infoPlist?: Record<string, unknown> } } };

/** Plugins that ask the person for nothing: no permission dialog, no system setting. */
const ASKS_NOTHING = new Set(["expo-router", "expo-splash-screen", "expo-secure-store", "expo-sqlite", "expo-sharing", "expo-localization"]);

/** Everything app.json asks for, as the names the store answers must carry. */
function asked(app: AppJson): string[] {
  const names: string[] = [];
  for (const plugin of app.expo.plugins ?? []) {
    const [name, options]: [string, Record<string, unknown>?] = typeof plugin === "string" ? [plugin] : plugin;
    if (ASKS_NOTHING.has(name)) continue;
    names.push(name);
    for (const [key, value] of Object.entries(options ?? {})) {
      if (/Permission$/.test(key) && value !== false) names.push(key);
      if (/^is[A-Z].*Enabled$/.test(key) && value === true) names.push(key);
    }
  }
  for (const permission of app.expo.android?.permissions ?? []) names.push(permission);
  for (const key of Object.keys(app.expo.ios?.infoPlist ?? {})) if (/^NS.*UsageDescription$/.test(key)) names.push(key);
  return names;
}

/** The table under "## Permissions the app asks for", up to the next heading. */
function permissionsSection(markdown: string): string {
  const start = markdown.indexOf("## Permissions the app asks for");
  if (start < 0) return "";
  const rest = markdown.slice(start + 3);
  const end = rest.indexOf("\n## ");
  return end < 0 ? rest : rest.slice(0, end);
}

const unnamed = (app: AppJson, markdown: string) => {
  const section = permissionsSection(markdown);
  return asked(app).filter((name) => !section.includes(`\`${name}\``));
};

describe("TA-261: the store answers name every permission app.json asks for", () => {
  const app = JSON.parse(readFileSync(join(ROOT, "app.json"), "utf8")) as AppJson;

  it("TA-261: finds what app.json asks for at all", () => {
    // A guard on the guard: if the reading of app.json ever returns nothing, the case below passes for no reason.
    expect(asked(app)).toEqual(expect.arrayContaining(["expo-notifications", "expo-image-picker", "cameraPermission", "expo-location", "locationWhenInUsePermission", "isIosBackgroundLocationEnabled"]));
  });

  it("TA-261: every plugin that asks, every permission string and every background switch is named in the answers", () => {
    expect(unnamed(app, ANSWERS)).toEqual([]);
  });

  it("TA-261: a permission added to app.json and not to the answers fails", () => {
    const withContacts: AppJson = { expo: { ...app.expo, plugins: [...(app.expo.plugins ?? []), ["expo-contacts", { contactsPermission: "ZZ reads your contacts." }]], android: { permissions: ["android.permission.READ_CALENDAR"] } } };
    expect(unnamed(withContacts, ANSWERS)).toEqual(["expo-contacts", "contactsPermission", "android.permission.READ_CALENDAR"]);
    // A permission switched off is not asked, so it needs no row.
    const off: AppJson = { expo: { plugins: [["expo-image-picker", { cameraPermission: "ZZ", photosPermission: false }]] } };
    expect(asked(off)).toEqual(["expo-image-picker", "cameraPermission"]);
  });

  it("TA-261: neither store form still answers No for location, and the answers no longer say it is never requested", () => {
    const line = (label: string) => ANSWERS.split("\n").find((l) => l.startsWith(`| ${label}`)) ?? "";
    expect(line("Location — Precise").split("|")[2]?.trim()).toMatch(/^Yes/);
    expect(line("Location — Approximate, Precise").split("|")[2]?.trim()).toMatch(/^Yes/);
    expect(ANSWERS).not.toMatch(/Never requested/);
  });
});
