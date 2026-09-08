/**
 * The over-the-air policy as a classifier, in CommonJS so the CLI (ota-guard.mjs)
 * and the jest suite both load it.
 */
/** What a store release owns: config that becomes native, native folders, and native dependencies. */
const NATIVE_PATHS = [/^apps\/mobile\/app\.json$/, /^apps\/mobile\/app\.config\.ts$/, /^apps\/mobile\/eas\.json$/, /^apps\/mobile\/(ios|android)\//, /^apps\/mobile\/patches\//, /^apps\/mobile\/assets\/images\/(icon|splash|android-icon)/];

/** A dependency change is native when the package is one Expo lists as a native module, or React Native itself. */
function nativeDependencyChanged(before, after, bundled) {
  const deps = (pkg) => ({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) });
  const a = deps(before);
  const b = deps(after);
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...names].filter((name) => a[name] !== b[name] && (name in bundled || name === "react-native" || name === "expo"));
}

function classify(changedFiles, { before, after, bundled }) {
  const native = changedFiles.filter((f) => NATIVE_PATHS.some((re) => re.test(f)));
  const deps = changedFiles.includes("apps/mobile/package.json") ? nativeDependencyChanged(before, after, bundled) : [];
  return { native, deps, ok: native.length === 0 && deps.length === 0 };
}


module.exports = { NATIVE_PATHS, nativeDependencyChanged, classify };
