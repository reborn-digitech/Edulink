/** Types for scripts/db-role-check.mjs, which plain Node runs in the image's release step (db-grants.mjs). */
export type ReleaseRoleFlags = { role: string; superuser: boolean; bypassRls: boolean };
export declare const ROLE_FLAGS_SQL: string;
export declare function parseRoleFlags(line: string | null | undefined): ReleaseRoleFlags | null;
export declare function releaseRoleProblems(input: { app: ReleaseRoleFlags | null; owner: ReleaseRoleFlags | null; singleRole: boolean; production: boolean }): string[];
export declare function appliesMigrations(argv: string[]): boolean;
export declare function migrateRoleProblems(input: { argv: string[]; adminUrl: string; appUrl: string | null | undefined; production: boolean; readFlags: (url: string) => ReleaseRoleFlags | null }): string[];
