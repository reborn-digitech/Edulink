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
      // React-compiler-era strictness, kept at full strength.
      //
      // Both of these were "warn" while the codebase still had instances, on
      // the reasoning that the instances were correct as written. Working
      // through them showed that was true of exactly one — the register
      // wizard restoring a sessionStorage draft, which carries its own
      // eslint-disable and the paragraph explaining it. The rest had real
      // fixes: `Date.now()` in a server component reads better as a named
      // `isPast`/`isFuture`, connectivity and the user agent belong in
      // `useSyncExternalStore` rather than mirrored into state by a mount
      // effect, and syncing from a prop belongs in render, not an effect.
      //
      // So they are errors now. A blanket downgrade hides the next real one
      // behind the ones already argued about; a disable comment at the single
      // site that needs it does not.
      "react-hooks/purity": "error",
      "react-hooks/set-state-in-effect": "error",
    },
  },
];

export default config;
