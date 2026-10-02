import { describe, expect, it } from "vitest";
import { libpqUrl, PRISMA_ONLY_PARAMS } from "../scripts/pg-url.mjs";

/**
 * deploy.md's pool advice puts `?connection_limit=30&pool_timeout=20` on
 * DATABASE_URL; psql refuses the whole URL over one Prisma parameter
 * ("invalid URI query parameter"), and the release step's db-grants.mjs hands
 * that URL to psql. Every script passes its URL through libpqUrl first.
 */
describe("libpqUrl — a Prisma URL made fit for psql", () => {
  it("drops the pool settings deploy.md recommends and nothing else", () => {
    expect(libpqUrl("postgresql://edulink_app:pw@db.internal:5432/edulink?connection_limit=30&pool_timeout=20")).toBe(
      "postgresql://edulink_app:pw@db.internal:5432/edulink",
    );
    expect(libpqUrl("postgresql://edulink_app:pw@db.internal:5432/edulink?sslmode=require&connection_limit=30&pool_timeout=20")).toBe(
      "postgresql://edulink_app:pw@db.internal:5432/edulink?sslmode=require",
    );
  });

  it("drops every Prisma-only parameter, whatever its case", () => {
    const query = PRISMA_ONLY_PARAMS.map((name, i) => `${i % 2 ? name.toUpperCase() : name}=1`).join("&");
    expect(libpqUrl(`postgres://u@h/d?${query}`)).toBe("postgres://u@h/d");
    for (const name of ["schema", "connection_limit", "pool_timeout", "pgbouncer", "sslaccept", "socket_timeout"]) {
      expect(PRISMA_ONLY_PARAMS, name).toContain(name);
    }
  });

  it("keeps what libpq reads: sslmode, application_name, options, connect_timeout", () => {
    const url = "postgresql://u@h:5432/d?sslmode=verify-full&application_name=grants&options=-c%20statement_timeout%3D5000&connect_timeout=10";
    expect(libpqUrl(url)).toBe(url);
    expect(libpqUrl("postgresql://u@h/d?schema=public&sslmode=require&pgbouncer=true")).toBe("postgresql://u@h/d?sslmode=require");
  });

  it("leaves the userinfo exactly as written — an encoded password is not decoded and re-encoded", () => {
    expect(libpqUrl("postgresql://edulink_app:p%40ss%2Fw0rd@[fdaa::3]:5432/edulink?connection_limit=5")).toBe(
      "postgresql://edulink_app:p%40ss%2Fw0rd@[fdaa::3]:5432/edulink",
    );
  });

  it("returns what is not a postgres URL untouched (a bare name, conninfo, nothing)", () => {
    expect(libpqUrl("edulink_restore")).toBe("edulink_restore");
    expect(libpqUrl("host=localhost dbname=edulink")).toBe("host=localhost dbname=edulink");
    expect(libpqUrl(undefined)).toBeUndefined();
    expect(libpqUrl("postgresql://u@localhost/d")).toBe("postgresql://u@localhost/d");
    expect(libpqUrl("postgresql://u@localhost/d?")).toBe("postgresql://u@localhost/d");
  });

  it("is what db-grants.mjs, ops/backup.sh and ops/restore.sh pass to libpq", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("scripts/db-grants.mjs", "utf8")).toMatch(/const appUrl = libpqUrl\(env\.DATABASE_URL\);/);
    expect(readFileSync("scripts/db-grants.mjs", "utf8")).toMatch(/const adminUrl = libpqUrl\(env\.DATABASE_ADMIN_URL\)/);
    for (const script of ["../../ops/backup.sh", "../../ops/restore.sh"]) {
      expect(readFileSync(script, "utf8"), script).toMatch(/scripts\/pg-url\.mjs/);
    }
    // The image's release step runs db-grants.mjs, so the helper ships beside it.
    expect(readFileSync("Dockerfile", "utf8")).toMatch(/scripts\/pg-url\.mjs/);
  });
});
