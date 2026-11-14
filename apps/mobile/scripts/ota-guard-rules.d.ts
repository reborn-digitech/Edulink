type Pkg = { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
type RootPkg = { pnpm?: { overrides?: Record<string, string>; patchedDependencies?: Record<string, string> } };
export const NATIVE_PATHS: RegExp[];
export function nativeDependencyChanged(before: Pkg, after: Pkg, bundled: Record<string, string>): string[];
export function lockVersions(text: string | null | undefined): Map<string, string>;
export function nativeLockChanged(lockBefore: string | null | undefined, lockAfter: string | null | undefined, bundled: Record<string, string>): string[];
export function nativeRootChanged(changedFiles: string[], rootBefore: RootPkg | null | undefined, rootAfter: RootPkg | null | undefined, bundled: Record<string, string>): string[];
export function classify(
  changedFiles: string[],
  ctx: {
    before: object;
    after: object;
    bundled: Record<string, string>;
    lockBefore?: string | null;
    lockAfter?: string | null;
    rootBefore?: RootPkg | null;
    rootAfter?: RootPkg | null;
    workspaceBefore?: Record<string, Pkg>;
    workspaceAfter?: Record<string, Pkg>;
  },
): { native: string[]; deps: string[]; ok: boolean };
