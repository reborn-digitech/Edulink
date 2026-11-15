/**
 * The contracts package bundled with plain exports.
 *
 * Metro, as Expo sets it up, turns every `export const` of every file into a
 * getter, `Object.defineProperty(exports, "name", { enumerable: true, get() {
 * return name } })`, and every use of an import into a property read on the
 * module (`zod.z.object(…)`), so that an import cycle sees a binding's value
 * as it is when it is read rather than when it was imported ("live
 * bindings", Expo's EXPO_UNSTABLE_LIVE_BINDINGS, on by default). For the
 * contracts package that machinery was weight with nothing to do: 2,275
 * getters, 200 KB of a 6.01 MB bundle on 15 Nov 2026 (measured from the
 * export's source map), in a package whose files import nothing but zod,
 * @edulink/i18n and each other, with no cycle among them.
 *
 * This is Expo's own transform worker with one change: a file under
 * packages/contracts/src is transformed with live bindings off, which Expo
 * supports per bundle (its importExportStatic plugin, the one Metro used
 * before live bindings), so its exports are plain assignments
 * (`exports.name = name`) and its imports are read once when the file runs.
 * That is the same value a live binding gives wherever the imported file has
 * finished running first, which is every import of this package: zod and
 * @edulink/i18n import nothing from it, and test/lib/contracts-exports.test.ts
 * holds the package's own imports free of cycles (the index's among them), and
 * every file free of `export let` (whose later assignments only a live binding
 * would carry). The screens that import the contracts keep live bindings and
 * read the package as before. Every other file goes through untouched. The
 * package came to 441 KB of the bundle from 618 KB, every export and schema
 * still in it (15 Nov 2026).
 *
 * metro.config.js sets it as the transformer for every bundle, the
 * development server's too, so what a screen reads while it is written is
 * what a release reads, and puts this file's text into the transformer's
 * cache key, which Expo leaves a custom transformer out of. Under
 * EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH (Expo's unstable tree shaking) Expo
 * applies the import and export transform at the end of bundling with the
 * bundle's own options, so the per-file flag is dropped there too and the
 * getters come back; the app sets neither. scripts/bundle-verify.cjs, which
 * the bundle gate runs on its export, fails if a contracts module carries a
 * getter.
 *
 * Plain CommonJS, because Metro's transform workers load it by path.
 */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

/** Expo's own transform worker, which this hands every file on to. */
const UPSTREAM = require.resolve("@expo/metro-config/build/transform-worker/transform-worker", { paths: [path.dirname(require.resolve("expo/package.json"))] });

/** A source file of the contracts package, wherever the workspace is checked out; Metro names a file relative to the project. */
const CONTRACTS_FILE = /(?:^|[\\/])packages[\\/]contracts[\\/]src[\\/](?:[\w-]+[\\/])*[\w-]+\.ts$/;

const upstream = () => require(UPSTREAM);

/** The options a file is transformed with: live bindings off for a contracts file, as given for any other. */
function optionsFor(filename, options) {
  if (!CONTRACTS_FILE.test(filename)) return options;
  return { ...options, customTransformOptions: { ...options.customTransformOptions, liveBindings: "false" } };
}

function transform(config, projectRoot, filename, data, options) {
  return upstream().transform(config, projectRoot, filename, data, optionsFor(filename, options));
}

/** This file's text, for metro.config.js to put in the transformer's cache key. */
const CACHE_KEY = crypto.createHash("sha1").update(fs.readFileSync(__filename)).digest("hex");

module.exports = { CACHE_KEY, CONTRACTS_FILE, UPSTREAM, optionsFor, transform };
