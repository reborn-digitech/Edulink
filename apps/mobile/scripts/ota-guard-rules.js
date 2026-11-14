/**
 * The over-the-air policy as a classifier, in CommonJS so the CLI (ota-guard.mjs)
 * and the jest suite both load it.
 */
/** What a store release owns: config that becomes native, native folders, and native dependencies. */
const NATIVE_PATHS = [/^apps\/mobile\/app\.json$/, /^apps\/mobile\/app\.config\.ts$/, /^apps\/mobile\/eas\.json$/, /^apps\/mobile\/(ios|android)\//, /^apps\/mobile\/patches\//, /^apps\/mobile\/assets\/images\/(icon|splash|android-icon)/];

/** A package that has a native half: one Expo lists as a native module, or React Native, or Expo itself. */
function isNative(name, bundled) {
  return name in bundled || name === "react-native" || name === "expo";
}

/** A dependency change is native when the package is one Expo lists as a native module, or React Native itself. */
function nativeDependencyChanged(before, after, bundled) {
  const deps = (pkg) => ({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) });
  const a = deps(before);
  const b = deps(after);
  const names = new Set([...Object.keys(a), ...Object.keys(b)]);
  return [...names].filter((name) => a[name] !== b[name] && isNative(name, bundled));
}

/**
 * The versions pnpm-lock.yaml resolves each package to, read from its `packages:` section (TA-264, 13 Nov 2026): a
 * lockfile refresh moves a native module inside its tilde range ("~57.0.2" to 57.0.9) without touching any
 * package.json, and the JavaScript built against the newer native half would ship to binaries holding the older one.
 * Name to the sorted, comma-joined versions; pure text, so the CLI needs no YAML parser.
 */
function lockVersions(text) {
  const found = new Map();
  let inPackages = false;
  for (const line of String(text ?? "").split("\n")) {
    if (/^\S/.test(line)) {
      inPackages = line.startsWith("packages:");
      continue;
    }
    if (!inPackages) continue;
    const m = /^ {2}'?((?:@[^@/\s']+\/)?[^@\s'(]+)@([^(:'\s]+)/.exec(line);
    if (!m) continue;
    const versions = found.get(m[1]) ?? new Set();
    versions.add(m[2]);
    found.set(m[1], versions);
  }
  return new Map([...found].map(([name, versions]) => [name, [...versions].sort().join(",")]));
}

/** The native packages whose resolved versions differ between two lockfiles (TA-264). */
function nativeLockChanged(lockBefore, lockAfter, bundled) {
  const a = lockVersions(lockBefore);
  const b = lockVersions(lockAfter);
  const names = new Set([...a.keys(), ...b.keys()]);
  return [...names].filter((name) => a.get(name) !== b.get(name) && isNative(name, bundled)).sort();
}

/** The package a root pnpm key names: "expo-sqlite@57.0.2", "a>expo-sqlite", "@scope/x@<2" (TA-264). */
function packageOfKey(key) {
  const last = String(key).split(">").pop().trim();
  const at = last.indexOf("@", last.startsWith("@") ? 1 : 0);
  return at > 0 ? last.slice(0, at) : last;
}

/**
 * The native packages a change to the root package.json's pnpm overrides or patched dependencies touches, or a root
 * patch file names (patches/<name>@<version>.patch, a scope's "/" written "__") (TA-264): either rewrites the native
 * module the binary holds.
 */
function nativeRootChanged(changedFiles, rootBefore, rootAfter, bundled) {
  const touched = new Set();
  for (const field of ["overrides", "patchedDependencies"]) {
    const a = (rootBefore?.pnpm ?? {})[field] ?? {};
    const b = (rootAfter?.pnpm ?? {})[field] ?? {};
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[key] !== b[key]) touched.add(packageOfKey(key));
    }
  }
  for (const file of changedFiles) {
    const m = /^patches\/(.+)\.patch$/.exec(file);
    if (m) touched.add(packageOfKey(m[1].replace(/__/g, "/")));
  }
  return [...touched].filter((name) => isNative(name, bundled)).sort();
}

/**
 * `lockBefore`/`lockAfter`: pnpm-lock.yaml's text at the release and now; `rootBefore`/`rootAfter`: the root
 * package.json; `workspaceBefore`/`workspaceAfter`: packages/<name>/package.json by path. Each is read only when its
 * file changed, so a caller that has none passes nothing (TA-264).
 */
function classify(changedFiles, { before, after, bundled, lockBefore, lockAfter, rootBefore, rootAfter, workspaceBefore, workspaceAfter }) {
  const native = changedFiles.filter((f) => NATIVE_PATHS.some((re) => re.test(f)));
  const found = new Set(changedFiles.includes("apps/mobile/package.json") ? nativeDependencyChanged(before, after, bundled) : []);
  if (changedFiles.includes("pnpm-lock.yaml")) for (const name of nativeLockChanged(lockBefore, lockAfter, bundled)) found.add(name);
  if (changedFiles.includes("package.json") || changedFiles.some((f) => f.startsWith("patches/"))) {
    for (const name of nativeRootChanged(changedFiles, rootBefore, rootAfter, bundled)) found.add(name);
  }
  // A workspace package the app bundles may add or move a native module of its own.
  for (const file of changedFiles.filter((f) => /^packages\/[^/]+\/package\.json$/.test(f))) {
    for (const name of nativeDependencyChanged((workspaceBefore ?? {})[file] ?? {}, (workspaceAfter ?? {})[file] ?? {}, bundled)) found.add(name);
  }
  const deps = [...found];
  return { native, deps, ok: native.length === 0 && deps.length === 0 };
}


module.exports = { NATIVE_PATHS, nativeDependencyChanged, nativeLockChanged, nativeRootChanged, lockVersions, classify };
