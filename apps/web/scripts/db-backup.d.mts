/** Types for scripts/db-backup.mjs (plain Node, run by npm run db:backup before every schema command). */
export declare const SERVER_IDENTITY_SQL: string;
export declare function backupLocalityVerdict(line: string | null | undefined, options?: { ci?: boolean }): { local: boolean; why: string };
export declare function backupFileName(at: Date, pid: number): string;
export declare function prunableDumps(files: { name: string; mtimeMs: number }[], options: { cutoffMs: number; keep: string | null }): string[];
