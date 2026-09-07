// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const a11y = require("eslint-plugin-react-native-a11y");

module.exports = defineConfig([
  expoConfig,
  {
    plugins: { "react-native-a11y": a11y },
    rules: {
      // Every pressable thing has a name a screen reader can say.
      "react-native-a11y/has-accessibility-hint": "off",
      "react-native-a11y/has-valid-accessibility-descriptors": "error",
      "react-native-a11y/has-valid-accessibility-role": "error",
      "react-native-a11y/no-nested-touchables": "error",
    },
  },
  { ignores: ["dist/*", ".expo/*", "node_modules/*", "coverage/*"] },
]);
