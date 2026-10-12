/**
 * The competitions crawler (competitions-crawler, 12 October 2026; docs/plans/competitions-crawler.md,
 * docs/runbooks/assistant-local.md §10).
 *
 *   npm run competitions:crawl -- --job=<CompetitionCrawlJob id>   the desk's crawl (the desk spawns it)
 *   npm run competitions:crawl -- --seed-sources                   add the official organisers not yet listed
 *   npm run competitions:crawl -- --check-sources                  ask every listed root URL, politely, and print the answers
 *
 * A crawl is started from the competitions desk (/appadmin, /root/competitions: "Suggested from the web"),
 * never from a shell: the desk's job holds the one crawl slot and the model servers' rule.
 */
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { machineClient } from "./http";
import { robotsFor } from "./crawl";
import { renderedByScript } from "./text";
import { seedCompetitionSources } from "./sources";
import { runCrawlJob } from "./job";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

async function main() {
  config();
  const job = arg("job");
  if (job) return runCrawlJob(job);
  const db = new PrismaClient();
  try {
    if (arg("seed-sources")) {
      const r = await seedCompetitionSources(db);
      console.log(`competition sources: ${r.added} added, ${r.present} already listed`);
      return;
    }
    if (arg("check-sources")) {
      const client = machineClient();
      const sources = await db.competitionSource.findMany({ where: { removedAt: null }, orderBy: { createdAt: "asc" } });
      for (const s of sources) {
        const origin = new URL(s.rootUrl).origin;
        const { robots, note } = await robotsFor(client, origin);
        let line: string;
        try {
          const res = await client.get(s.rootUrl);
          const html = res.body.toString("utf8");
          line = `${res.status} ${res.headers["content-type"] ?? "?"} ${res.body.length} bytes${renderedByScript(html) ? " — rendered by script" : ""}`;
        } catch (e) {
          line = `no answer: ${(e as Error).message}`;
        }
        console.log(`${s.name}\n  ${s.rootUrl}\n  ${line}\n  ${note}; root ${robots.allowed(new URL(s.rootUrl).pathname) ? "allowed" : "DISALLOWED"}`);
      }
      return;
    }
    console.error("usage: competitions:crawl -- --job=<id> | --seed-sources | --check-sources");
    process.exitCode = 2;
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
