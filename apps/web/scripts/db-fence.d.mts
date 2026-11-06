/** Types for scripts/db-fence.mjs (plain Node, asked by with-admin-db.mjs before any database command runs). */
export type FenceVerdict = { ok: boolean; why?: string };
export declare function fenceVerdict(argv: readonly string[], options?: { resetConsent?: boolean }): FenceVerdict;
export declare function describeDatabase(url: string): string;
