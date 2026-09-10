// Metro for the EduLink app: Expo's defaults, with one change.
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

module.exports = config;
