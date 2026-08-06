import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * `next lint` is deprecated, so the Next.js rules are loaded through the
 * ESLint CLI directly — eslint-config-next v16 ships flat configs natively.
 * Same rule set as `next lint` gave: core-web-vitals plus the TypeScript
 * additions, reachable as `npm run lint`.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "public/**", "next-env.d.ts", ".claude/**"],
  },
  {
    rules: {
      // House style throughout: `!` after a check the compiler cannot see.
      "@typescript-eslint/no-non-null-assertion": "off",
      // React-compiler-era strictness, downgraded deliberately rather than
      // silenced. `purity` flags Date.now() during render — correct advice
      // for client components, but every instance here is a SERVER component
      // rendering once per request, where "now" is exactly what is meant.
      // `set-state-in-effect` flags the init-from-browser pattern (install
      // prompt, stored theme, media queries) that client components here use
      // on purpose. Warnings keep both visible on new code without failing
      // the build over working patterns; revisit if the React Compiler lands.
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default config;
