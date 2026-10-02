/** Types for scripts/local-db-guard.mjs (plain Node, so db:reset can run it before Prisma's reset). */
export type LocalDatabaseVerdict = { local: boolean; why: string };
type RawQueryClient = { $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> };
export declare function localDatabaseVerdict(serverAddr: string | null | undefined, options?: { ci?: boolean }): LocalDatabaseVerdict;
export declare function databaseServerAddress(client: RawQueryClient): Promise<string | null>;
export declare function refuseUnlessLocalDatabase(client: RawQueryClient, what: string): Promise<LocalDatabaseVerdict>;
