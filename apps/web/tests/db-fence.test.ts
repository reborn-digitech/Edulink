import { describe, expect, it } from "vitest";
import { describeDatabase, fenceVerdict } from "../scripts/db-fence.mjs";

/**
 * The fence around the database commands (scripts/db-fence.mjs, 7 November 2026): what every db script's wrapper
 * refuses, held here without a database. The dev database was lost on 6 November to a shadow database URL that a
 * failed sed had left pointing at the database itself.
 */
describe("the fence around the database commands", () => {
  it("refuses a shadow database URL in any form, and migrate diff against migration folders", () => {
    expect(fenceVerdict(["prisma", "migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema-datamodel", "prisma/schema.prisma", "--shadow-database-url", "postgresql://x@localhost:5432/edulink_dev", "--script"]).ok).toBe(false);
    expect(fenceVerdict(["npx", "prisma", "migrate", "diff", "--shadow-database-url=postgresql://x@localhost/edulink_shadow"]).ok).toBe(false);
    expect(fenceVerdict(["prisma", "migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema-datamodel", "prisma/schema.prisma", "--script"]).ok).toBe(false);
    expect(fenceVerdict(["prisma", "migrate", "diff", "--from-schema-datamodel", "a.prisma", "--to-migrations", "prisma/migrations"]).ok).toBe(false);
    expect(fenceVerdict(["prisma", "migrate", "diff", "--from-migrations", "x"]).why).toMatch(/from-schema-datasource/);
  });
  it("allows the diff against the live datasource, deploy and the seeds; migrate dev, even create-only, is refused (TA-437)", () => {
    expect(fenceVerdict(["npx", "prisma", "migrate", "diff", "--from-schema-datasource", "prisma/schema.prisma", "--to-schema-datamodel", "prisma/schema.prisma", "--script"])).toEqual({ ok: true });
    expect(fenceVerdict(["prisma", "migrate", "deploy"])).toEqual({ ok: true });
    expect(fenceVerdict(["prisma", "migrate", "dev", "--create-only"]).ok).toBe(false);
    expect(fenceVerdict(["npx", "tsx", "prisma/seed.ts"])).toEqual({ ok: true });
    expect(fenceVerdict(["node", "scripts/local-db-guard.mjs", "db:reset"])).toEqual({ ok: true });
  });
  it("refuses a reset unless npm run db:reset has set EDULINK_DB_RESET=1 after the local guard", () => {
    expect(fenceVerdict(["prisma", "migrate", "reset", "--force"]).ok).toBe(false);
    expect(fenceVerdict(["npx", "prisma", "db", "push", "--force-reset"]).ok).toBe(false);
    expect(fenceVerdict(["prisma", "db", "push", "--accept-data-loss"]).ok).toBe(false);
    expect(fenceVerdict(["npx", "prisma", "db", "push", "--force-reset"], { resetConsent: true })).toEqual({ ok: true });
    expect(fenceVerdict(["prisma", "migrate", "reset"]).why).toMatch(/db:reset/);
  });
  it("names the database a URL points at, never its password", () => {
    expect(describeDatabase("postgresql://edulink_app:s3cret@localhost:5432/edulink_dev?connection_limit=15")).toBe("edulink_dev on localhost:5432 as edulink_app");
    expect(describeDatabase("postgresql://chinmay@localhost:5432/edulink_dev")).not.toMatch(/s3cret/);
    expect(describeDatabase("not a url")).toBe("(unreadable URL)");
  });
});
