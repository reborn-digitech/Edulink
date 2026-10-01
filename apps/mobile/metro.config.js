// Metro for the EduLink app: Expo's defaults, with three changes.
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
