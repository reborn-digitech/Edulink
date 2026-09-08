// eslint-disable-next-line @typescript-eslint/no-require-imports -- a CommonJS script
const { classify, nativeDependencyChanged } = require("../../scripts/ota-guard-rules.js") as typeof import("../../scripts/ota-guard-rules.js");

/** The OTA policy as a classifier: JS-only ships over the air; native goes through the store. */
const bundled = { "expo-camera": "~17.0.0", "expo-sqlite": "~16.0.0", "expo-screen-capture": "~57.0.2" };

describe("the over-the-air guard", () => {
  it("lets a screen, a lib and a dictionary change ship over the air", () => {
    const r = classify(["apps/mobile/src/screens/teacher/home.tsx", "apps/mobile/src/lib/query.ts", "packages/i18n/src/hi.ts", "apps/web/src/lib/marks.ts"], { before: {}, after: {}, bundled });
    expect(r).toEqual({ native: [], deps: [], ok: true });
  });

  it("refuses config that becomes native, native folders and the app icon", () => {
    const r = classify(["apps/mobile/app.json", "apps/mobile/ios/Podfile", "apps/mobile/assets/images/icon.png"], { before: {}, after: {}, bundled });
    expect(r.ok).toBe(false);
    expect(r.native).toHaveLength(3);
  });

  it("refuses a native dependency added, removed or moved, and ignores a JS one", () => {
    const before = { dependencies: { "expo-sqlite": "~16.0.0", zod: "^3.0.0" } };
    const after = { dependencies: { "expo-sqlite": "~16.1.0", "expo-camera": "~17.0.0", zod: "^3.1.0" } };
    expect(nativeDependencyChanged(before, after, bundled)).toEqual(["expo-sqlite", "expo-camera"]);
    const r = classify(["apps/mobile/package.json"], { before, after, bundled });
    expect(r.ok).toBe(false);
    const jsOnly = classify(["apps/mobile/package.json"], { before: { dependencies: { zod: "^3.0.0" } }, after: { dependencies: { zod: "^3.1.0" } }, bundled });
    expect(jsOnly.ok).toBe(true);
  });
});
