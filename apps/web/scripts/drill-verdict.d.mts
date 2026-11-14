/** Types for scripts/drill-verdict.mjs (plain Node, run by scripts/db-restore-drill.sh). */
export type DrillRecord = { dump: string; dumpBytes: number; restored: Record<string, number> };
export declare const DRILL_KEY_TABLES: readonly string[];
export declare const DRILL_RECORD: string;
export declare function drillVerdict(input: { liveTables: number; restoredTables: number; restored: Record<string, number>; dumpBytes: number; last: DrillRecord | null }): { ok: boolean; problems: string[] };
export declare function readDrillRecord(dir: string): DrillRecord | null;
