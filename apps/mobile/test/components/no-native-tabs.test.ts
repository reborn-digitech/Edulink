import fs from "node:fs";
import path from "node:path";

/**
 * metro.config.js sets EXPO_ROUTER_DISABLE_NATIVE_TABS_MD, which leaves
 * expo-router's Material Symbols table (79 KB, Android) out of every bundle
 * and makes a native tab's `md` icon throw. The app draws its tabs with
 * expo-router's JavaScript Tabs and its icons with Phosphor; this holds the
 * source to that, so that the switch can never take away an icon a screen
 * draws (item 15 of the owner's batch, 1 Nov 2026).
 */
describe("the native tabs' Material Symbols, left out of the bundle", () => {
  const root = path.join(__dirname, "..", "..");

  it("is switched off by metro.config.js, before Expo's CLI reads it", () => {
    const config = fs.readFileSync(path.join(root, "metro.config.js"), "utf8");
    expect(config).toMatch(/process\.env\.EXPO_ROUTER_DISABLE_NATIVE_TABS_MD \?\?= "1";/);
  });

  it("costs nothing: no screen draws a native tab or a Material Symbol", () => {
    const found: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name) && /NativeTabs|native-tabs|expo-symbols|SymbolView/.test(fs.readFileSync(full, "utf8"))) found.push(path.relative(root, full));
      }
    };
    walk(path.join(root, "src"));
    expect(found).toEqual([]);
  });
});
