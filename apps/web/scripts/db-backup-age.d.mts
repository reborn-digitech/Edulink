/** Types for scripts/db-backup-age.mjs (plain Node, reads the off-machine folder only). */
export type BackupFile = { name: string; mtimeMs: number };
export declare const DUMP_MAX_HOURS: number;
export declare const BASE_MAX_DAYS: number;
export declare function backupFreshness(input: { dumps: BackupFile[]; bases: BackupFile[]; now: number }): { ok: boolean; problems: string[]; lines: string[] };
