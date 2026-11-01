// Metro for the EduLink app: Expo's defaults, with five changes.
//
// 1. The minifier writes Devanagari as itself.
//
// Terser's `ascii_only` writes every non-ASCII character as a \uXXXX escape.
// For this app that meant all 238,571 Devanagari characters of the Hindi and
// Marathi dictionaries shipped as six bytes each instead of three — about
// 0.7 MB of a 5.25 MB bundle that was escape sequences, not text (measured
// from the source map, 10 Sep 2026). Writing them as UTF-8 makes the web
// target genuinely lighter to download and parse, and makes the bundle-size
// gate measure the app rather than the escaping. Native release builds ship
// Hermes bytecode, where the string table is the same either way.
const { getDefaultConfig } = require("expo/metro-config");

// 0. Android leaves out the Material Symbols table expo-router's native tabs draw with.
//
// expo-router's layouts reach its native tabs, whose Android icon converter
// imports expo-symbols and with it a 79 KB table of every Material Symbol's
// glyph (expo-symbols/build/android/symbols.json), on Android only. The app
// draws its tabs with expo-router's JavaScript Tabs and its icons with
// Phosphor, and never a native tab (test/components/no-native-tabs.test.ts),
// so the table is weight no screen can use (measured from the source map,
// item 15 of the owner's batch, 1 Nov 2026). EXPO_ROUTER_DISABLE_NATIVE_TABS_MD
// is Expo's own switch for this: the CLI reads it after this file is loaded and
// swaps the converter for expo-router's stub. Set here so that every bundle,
// an export, an EAS build, an update or the development server, has it.
process.env.EXPO_ROUTER_DISABLE_NATIVE_TABS_MD ??= "1";

const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  output: { ...config.transformer.minifierConfig.output, ascii_only: false },
};

// 2. A release is bundled with the phone's share of the dictionaries.
//
// packages/i18n holds what the web and the phone say, some 7,600 keys in each
// of three languages, and the phone asks for a little over half of them. Metro
// cannot leave the rest out by itself, so they were 0.9 MB of the bundle that
// no screen could show (30 Sep 2026). scripts/i18n-subset.cjs writes the three
// dictionaries with only the keys the phone can ask for (the names of the keys
// once, each language as its sentences), and the resolver below gives Metro
// those files wherever packages/i18n/src/{en,hi,mr}.ts is asked for.
// Since 1 Nov 2026 (item 15) Hindi and Marathi carry only the first screens'
// keys and the rest is fetched on first use (src/lib/i18n-words.ts): the
// phone's share of the two had reached 1.36 MB of a 7.37 MB bundle.
//
// Only when a release is bundled (`expo export`, an EAS build): a development
// server keeps the whole dictionaries, so a key used for the first time while
// it runs is a sentence and not a key until the next restart. EDULINK_I18N_SUBSET=1
// forces the subset on, which is how the web target is walked with it;
// EDULINK_I18N_FULL=1 forces it off.
const { writeSubset } = require("./scripts/i18n-subset.cjs");

const release = process.env.NODE_ENV === "production" || process.argv.some((arg) => arg === "export" || arg === "export:embed");
if (process.env.EDULINK_I18N_FULL !== "1" && (release || process.env.EDULINK_I18N_SUBSET === "1")) {
  const subset = writeSubset();
  const whole = /[\\/]packages[\\/]i18n[\\/]src[\\/](en|hi|mr)\.ts$/;
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const resolved = upstream ? upstream(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
    const match = resolved.type === "sourceFile" ? whole.exec(resolved.filePath) : null;
    return match ? { type: "sourceFile", filePath: subset[match[1]] } : resolved;
  };
}

// 2b. A release leaves out the contracts files the phone imports nothing from.
//
// Every screen imports from packages/contracts' index, which re-exports every
// file of the API's shapes, the web's own desks among them (the quiz bank's
// jobs and figures, the crawler, the NAAC text): 24 of its 91 files gave the
// phone no value (1 Nov 2026). scripts/contracts-subset.cjs finds them from the
// phone's imports, and where the index re-exports one Metro is given an empty
// module instead; a file another contracts file imports is bundled through that
// import as before. Release only, as the dictionaries' share is, so a name a
// screen imports for the first time while a development server runs is never
// missing; EDULINK_CONTRACTS_FULL=1 turns it off.
const { contractsSubset } = require("./scripts/contracts-subset.cjs");

if (process.env.EDULINK_CONTRACTS_FULL !== "1" && (release || process.env.EDULINK_I18N_SUBSET === "1")) {
  const { dropped, index } = contractsSubset();
  const left = new Set(dropped);
  const upstream = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    const resolved = upstream ? upstream(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
    return context.originModulePath === index && resolved.type === "sourceFile" && left.has(resolved.filePath) ? { type: "empty" } : resolved;
  };
}

// 3. The icons carry the four weights the phone draws.
//
// Each Phosphor icon file draws its icon six ways and the phone asks for four
// (regular, bold, fill, duotone); scripts/icon-weights.cjs is Expo's Babel
// transformer with a step in front that leaves out the thin and light
// drawings, 69 KB of the bundle (1 Oct 2026), and draws those two names
// regular. Every bundle, so the development server shows what a release does.
const iconWeights = require("./scripts/icon-weights.cjs");

if (config.transformer.babelTransformerPath !== iconWeights.UPSTREAM) {
  throw new Error(`metro.config.js: Expo's Babel transformer is ${config.transformer.babelTransformerPath}, not the ${iconWeights.UPSTREAM} scripts/icon-weights.cjs hands files on to`);
}
config.transformer.babelTransformerPath = require.resolve("./scripts/icon-weights.cjs");

module.exports = config;
