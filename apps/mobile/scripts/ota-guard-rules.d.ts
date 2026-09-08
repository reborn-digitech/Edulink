export const NATIVE_PATHS: RegExp[];
export function nativeDependencyChanged(before: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }, after: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }, bundled: Record<string, string>): string[];
export function classify(changedFiles: string[], ctx: { before: object; after: object; bundled: Record<string, string> }): { native: string[]; deps: string[]; ok: boolean };
