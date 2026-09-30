// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const a11y = require("eslint-plugin-react-native-a11y");
const reactNative = require("eslint-plugin-react-native");

module.exports = defineConfig([
  expoConfig,
  {
    plugins: { "react-native-a11y": a11y, "react-native": reactNative },
    rules: {
      // Colours come from the tokens package, never typed into a screen.
      // (no-inline-styles is not enabled: it flags layout literals such as
      // flexDirection: "row", which are idiomatic; spacing and type sizes
      // typed into a style are held to a floor by test/components/tokens-in-styles.test.ts.)
      "react-native/no-color-literals": "error",
      "react-native/no-unused-styles": "error",
      "react-native/no-single-element-style-arrays": "error",
      // Every pressable thing has a name a screen reader can say.
      "react-native-a11y/has-accessibility-hint": "off",
      "react-native-a11y/has-valid-accessibility-descriptors": "error",
      "react-native-a11y/has-valid-accessibility-role": "error",
      "react-native-a11y/no-nested-touchables": "error",
    },
  },
  // Node's own names in the one script Metro's config loads as CommonJS.
  { files: ["scripts/*.cjs"], languageOptions: { globals: { __dirname: "readonly", Buffer: "readonly" } } },
  { ignores: ["dist/*", ".expo/*", "node_modules/*", "coverage/*", "i18n-subset/*"] },
]);
