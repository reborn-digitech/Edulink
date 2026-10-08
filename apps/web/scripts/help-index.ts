/**
 * The platform-help corpus (docs/plans/assistant.md §3 and §5, Phase A): what the assistant reads
 * to answer "how do I…" and "where is…" for every role.
 *
 *   npm run help:index [-- --dry]
 *
 * ONE HelpEntry PER:
 *   - door of the API catalog (src/lib/api-catalog): its method and path, the roles it opens to,
 *     its module, its summary, and the OpenAPI description docs/api/openapi.json gives it;
 *   - docs paragraph that tells somebody how to do something (docs/*.md, HANDOFF.md; the
 *     "Where to look" columns of docs/demo-schools.md a row each), with the role inferred from the
 *     section's heading and the page paths it names;
 *   - nav entry and quick action (src/lib/nav.ts), and page heading with its introduction, in
 *     English, Hindi and Marathi from the dictionaries, with the page path the nav gives it.
 *
 * TAGGED WITH THE COMMIT (`git rev-parse --short HEAD`, "-dirty" when the tree has changes) and
 * rebuilt idempotently: the commit's own rows are deleted and written again, then embedded through
 * ASSISTANT_EMBED_URL, and only then are older commits' rows removed, so the index is never empty
 * while it is being rebuilt. Runs as the owner (the content tables are owner-written) against a
 * database on this machine only.
 */
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { config } from "dotenv";
import { ENDPOINTS, type Endpoint } from "../src/lib/api-catalog";
import { NAV, PRIMARY_ACTION, QUICK_ACTIONS } from "../src/lib/nav";
import { ROLES } from "../src/lib/constants";
import { en } from "../src/lib/i18n/en";
import { hi } from "../src/lib/i18n/hi";
import { mr } from "../src/lib/i18n/mr";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";
import { requireEmbedConfig } from "../src/lib/assistant-env";
import { embedTexts, vectorLiteral } from "../src/lib/assistant-model";

config();

const DRY = process.argv.includes("--dry");
const REPO = resolve(process.cwd(), "..", "..");
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

export type HelpRow = {
  kind: "door" | "doc" | "nav" | "action" | "dictionary";
  roles: string[];
  pagePath: string | null;
  door: string | null;
  module: string | null;
  title: string;
  text: string;
  sourceFile: string;
  language: "en" | "hi" | "mr";
};

/* ---- the commit ----------------------------------------------------------- */

function commitTag(): string {
  try {
    const head = execFileSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO, encoding: "utf8" }).trim();
    const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=no"], { cwd: REPO, encoding: "utf8" }).trim().length > 0;
    return dirty ? `${head}-dirty` : head;
  } catch {
    return "unknown";
  }
}

/* ---- roles from words and paths ------------------------------------------- */

const ROLE_WORDS: [RegExp, string][] = [
  [/\b(office|ADMIN|admins?)\b/, "ADMIN"],
  [/\b(principal|PRINCIPAL|the head)\b/i, "PRINCIPAL"],
  [/\bteachers?\b|\bTEACHER\b/i, "TEACHER"],
  [/\b(pupils?|students?|STUDENT)\b/i, "STUDENT"],
  [/\b(parents?|guardians?|famil(y|ies)|PARENT)\b/i, "PARENT"],
  [/\bexperts?\b|\bEXPERT\b/i, "EXPERT"],
  [/\bdrivers?\b|\bDRIVER\b/i, "DRIVER"],
  [/\blibrarians?\b|\bLIBRARIAN\b/i, "LIBRARIAN"],
  [/\bwardens?\b|\bWARDEN\b/i, "WARDEN"],
  [/\balumn(us|i|a)\b|\bALUMNUS\b/i, "ALUMNUS"],
  [/\bfaculty\b|\bFACULTY\b/i, "FACULTY"],
  [/\bHODs?\b|head of (the )?department/i, "HOD"],
  [/\bexam cell\b|\bexam controller\b|\bEXAM_CONTROLLER\b|controller of examinations/i, "EXAM_CONTROLLER"],
  [/\bIQAC\b/, "IQAC"],
  [/\bTPO\b|placement officer|placement cell/i, "TPO"],
  [/\baccounts (desk|office|officer)\b|\bACCOUNTS\b/, "ACCOUNTS"],
  [/\brecruiters?\b|\bRECRUITER\b/i, "RECRUITER"],
  [/\boperator\b|\bsuperuser\b/i, "OPERATOR"],
  [/\bapp admins?\b|\bcontent team\b/i, "APP_ADMIN"],
];

const PATH_ROLES: [RegExp, string][] = [
  [/^\/admin\b/, "ADMIN"],
  [/^\/principal\b/, "PRINCIPAL"],
  [/^\/teacher\b/, "TEACHER"],
  [/^\/student\b/, "STUDENT"],
  [/^\/parent\b/, "PARENT"],
  [/^\/expert\b/, "EXPERT"],
  [/^\/driver\b/, "DRIVER"],
  [/^\/library\b/, "LIBRARIAN"],
  [/^\/hostel\b/, "WARDEN"],
  [/^\/alumni\b/, "ALUMNUS"],
  [/^\/faculty\b/, "FACULTY"],
  [/^\/hod\b/, "HOD"],
  [/^\/exam-cell\b/, "EXAM_CONTROLLER"],
  [/^\/iqac\b/, "IQAC"],
  [/^\/placement\b/, "TPO"],
  [/^\/accounts\b/, "ACCOUNTS"],
  [/^\/recruiter\b/, "RECRUITER"],
  [/^\/root\b/, "OPERATOR"],
  [/^\/app-admin\b/, "APP_ADMIN"],
];

const PAGE_PATH = /(?:^|[\s`(→|])(\/(?:admin|principal|teacher|student|parent|expert|driver|library|hostel|alumni|faculty|hod|exam-cell|iqac|placement|accounts|recruiter|root|app-admin|people|attendance|certificates|explore|vacancies|enquiries|bulletin|competitions|experts|mentoring|notifications|account|settings|practice|reports|report-cards|exams|incidents|remarks|sessions|duties|archive|joins|reviews)(?:\/[A-Za-z0-9_\-[\]]+)*)/g;

function pathsIn(text: string): string[] {
  return [...new Set([...text.matchAll(PAGE_PATH)].map((m) => (m[1] ?? "").replace(/[.,;:)]+$/, "")).filter(Boolean))];
}

function rolesFrom(heading: string, text: string): string[] {
  const roles = new Set<string>();
  for (const [re, role] of ROLE_WORDS) if (re.test(heading)) roles.add(role);
  for (const p of pathsIn(text)) for (const [re, role] of PATH_ROLES) if (re.test(p)) roles.add(role);
  return [...roles].sort();
}

/* ---- 1. the catalog's doors ----------------------------------------------- */

type OpenApi = { paths?: Record<string, Record<string, { description?: string }>> };

function doorRows(): HelpRow[] {
  const openapiPath = join(REPO, "docs", "api", "openapi.json");
  const openapi: OpenApi = existsSync(openapiPath) ? (JSON.parse(readFileSync(openapiPath, "utf8")) as OpenApi) : {};
  const rows: HelpRow[] = [];
  const seen = new Set<string>();
  for (const e of ENDPOINTS as Endpoint[]) {
    const door = `${e.method} ${e.path}`;
    if (seen.has(door)) continue;
    seen.add(door);
    const access = e.access;
    const roles = Array.isArray(access) ? [...access, ...(e.limitedRoles ?? [])] : access === "operator" ? ["OPERATOR"] : access === "app-admin" ? ["APP_ADMIN"] : [];
    const openapiKey = e.path.replace(/:([A-Za-z]+)/g, "{$1}");
    const description = openapi.paths?.[openapiKey]?.[e.method.toLowerCase()]?.description ?? openapi.paths?.[e.path]?.[e.method.toLowerCase()]?.description ?? null;
    rows.push({
      kind: "door",
      roles: [...new Set(roles)].sort(),
      pagePath: null,
      door,
      module: e.module ?? null,
      title: e.summary,
      text: [`${e.summary}.`.replace(/\.\.$/, "."), `Door: ${door}.`, e.module ? `Module: ${e.module}.` : "", description ?? ""].filter(Boolean).join(" "),
      sourceFile: "src/lib/api-catalog",
      language: "en",
    });
  }
  return rows;
}

/* ---- 2. the docs ---------------------------------------------------------- */

const HOW_TO = /\b(open|opens|go to|click|tap|press|choose|select|record|records|mark|upload|download|sign in|signs in|find|add|issue|print|approve|switch|set|fill|enter|invite|assign|publish|send|book|apply|request|cut|generate|export|import)\b/i;

function docFiles(): string[] {
  const docs = readdirSync(join(REPO, "docs")).filter((f) => f.endsWith(".md")).map((f) => join(REPO, "docs", f));
  return [...docs, join(REPO, "HANDOFF.md")].filter((f) => existsSync(f));
}

function docRows(): HelpRow[] {
  const rows: HelpRow[] = [];
  for (const file of docFiles()) {
    const source = relative(REPO, file).split("\\").join("/");
    const lines = readFileSync(file, "utf8").split("\n");
    const headings: string[] = [];
    let block: string[] = [];
    let inCode = false;
    let table: { header: string[]; rows: string[][] } | null = null;
    const headingPath = () => headings.filter(Boolean).join(" › ");
    const flushBlock = () => {
      const text = block.join(" ").replace(/\s+/g, " ").trim();
      block = [];
      if (text.length < 40 || text.length > 1800) return;
      const paths = pathsIn(text);
      if (!paths.length && !HOW_TO.test(text)) return;
      rows.push({ kind: "doc", roles: rolesFrom(headingPath(), text), pagePath: paths[0] ?? null, door: null, module: null, title: headingPath() || source, text, sourceFile: source, language: "en" });
    };
    const flushTable = () => {
      if (!table) return;
      const { header, rows: body } = table;
      table = null;
      const lookAt = header.findIndex((h) => /where to (look|see)/i.test(h));
      const roleAt = header.findIndex((h) => /^role$/i.test(h));
      const homeAt = header.findIndex((h) => /^home$/i.test(h));
      for (const cells of body) {
        const joined = header.map((h, i) => `${h}: ${cells[i] ?? ""}`).join("; ");
        const where = lookAt >= 0 ? (cells[lookAt] ?? "") : joined;
        const paths = pathsIn(where);
        if (!paths.length) continue;
        const role = roleAt >= 0 ? (cells[roleAt] ?? "").replace(/[`*]/g, "").trim() : "";
        const roles = role && (ROLES as readonly string[]).includes(role) ? [role] : rolesFrom(headingPath(), `${where} ${homeAt >= 0 ? (cells[homeAt] ?? "") : ""}`);
        rows.push({ kind: "doc", roles, pagePath: paths[0] ?? null, door: null, module: null, title: headingPath() || source, text: joined.replace(/\s+/g, " ").slice(0, 1800), sourceFile: source, language: "en" });
      }
    };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (/^```/.test(line.trim())) {
        inCode = !inCode;
        flushBlock();
        continue;
      }
      if (inCode) continue;
      const h = /^(#{1,6})\s+(.*)$/.exec(line);
      if (h) {
        flushBlock();
        flushTable();
        const level = (h[1] ?? "#").length;
        headings.splice(level - 1, headings.length, (h[2] ?? "").replace(/[`*]/g, "").trim());
        continue;
      }
      if (/^\s*\|/.test(line)) {
        flushBlock();
        const cells = line.replace(/^\s*\||\|\s*$/g, "").split("|").map((c) => c.trim());
        if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
        if (!table) table = { header: cells, rows: [] };
        else table.rows.push(cells);
        continue;
      }
      flushTable();
      if (!line.trim()) {
        flushBlock();
        continue;
      }
      // A list item is its own paragraph: one step, one entry.
      if (/^\s*([-*]|\d+\.)\s+/.test(line)) flushBlock();
      block.push(line.replace(/^\s*([-*]|\d+\.)\s+/, "").replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1"));
    }
    flushBlock();
    flushTable();
  }
  return rows;
}

/* ---- 3. the dictionaries -------------------------------------------------- */

type Dict = Record<string, unknown>;
const DICTS: { language: "en" | "hi" | "mr"; dict: Dict; file: string }[] = [
  { language: "en", dict: en as unknown as Dict, file: "packages/i18n/src/en.ts" },
  { language: "hi", dict: hi as unknown as Dict, file: "packages/i18n/src/hi.ts" },
  { language: "mr", dict: mr as unknown as Dict, file: "packages/i18n/src/mr.ts" },
];

function lookup(dict: Dict, key: string): string | null {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object") return null;
    node = (node as Dict)[part];
  }
  return typeof node === "string" ? node : null;
}

function dictionaryRows(): HelpRow[] {
  const rows: HelpRow[] = [];
  // Nav entries: the label a person sees, the page it opens, for whom.
  const navBy = new Map<string, { href: string; labelKey: string; roles: Set<string> }>();
  for (const role of ROLES) {
    for (const item of NAV[role] ?? []) {
      const k = `${item.href}|${item.labelKey}`;
      const got = navBy.get(k) ?? { href: item.href, labelKey: item.labelKey, roles: new Set<string>() };
      got.roles.add(role);
      navBy.set(k, got);
    }
  }
  const actions: { href: string; labelKey: string; descriptionKey: string; role: string }[] = [];
  for (const role of ROLES) {
    for (const a of QUICK_ACTIONS[role] ?? []) actions.push({ ...a, role });
    const primary = PRIMARY_ACTION[role];
    if (primary) actions.push({ ...primary, role });
  }
  // Page headings: a namespace with a title and an introduction, matched to the nav entry whose
  // label lives in the same namespace or whose path ends in the namespace's name.
  const namespaces = Object.keys(en as unknown as Dict);
  const pageOf = (ns: string): { href: string; roles: string[] } | null => {
    const kebab = ns.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    for (const n of navBy.values()) {
      if (n.labelKey.startsWith(`${ns}.`) || n.labelKey === `nav.${ns}` || n.href.endsWith(`/${kebab}`)) return { href: n.href, roles: [...n.roles].sort() };
    }
    return null;
  };
  for (const { language, dict, file } of DICTS) {
    for (const n of navBy.values()) {
      const label = lookup(dict, n.labelKey);
      if (!label) continue;
      rows.push({ kind: "nav", roles: [...n.roles].sort(), pagePath: n.href, door: null, module: null, title: label, text: `${label} — ${n.href}`, sourceFile: `src/lib/nav.ts, ${file}`, language });
    }
    for (const a of actions) {
      const label = lookup(dict, a.labelKey);
      const hint = lookup(dict, a.descriptionKey);
      if (!label) continue;
      rows.push({ kind: "action", roles: [a.role], pagePath: a.href, door: null, module: null, title: label, text: hint ? `${label}: ${hint}` : label, sourceFile: `src/lib/nav.ts, ${file}`, language });
    }
    for (const ns of namespaces) {
      const title = lookup(dict, `${ns}.title`) ?? lookup(dict, `${ns}.metaTitle`);
      const intro = lookup(dict, `${ns}.intro`) ?? lookup(dict, `${ns}.lede`) ?? lookup(dict, `${ns}.subtitle`);
      if (!title || !intro) continue;
      const page = pageOf(ns);
      rows.push({ kind: "dictionary", roles: page?.roles ?? [], pagePath: page?.href ?? null, door: null, module: null, title, text: `${title}: ${intro}`, sourceFile: file, language });
    }
  }
  return rows;
}

/* ---- the run -------------------------------------------------------------- */

function dedupe(rows: HelpRow[]): HelpRow[] {
  const seen = new Map<string, HelpRow>();
  for (const r of rows) {
    const k = `${r.language}|${r.kind}|${r.pagePath ?? ""}|${r.door ?? ""}|${r.text}`;
    const prior = seen.get(k);
    if (prior) prior.roles = [...new Set([...prior.roles, ...r.roles])].sort();
    else seen.set(k, { ...r });
  }
  return [...seen.values()];
}

export function buildHelpRows(): HelpRow[] {
  return dedupe([...doorRows(), ...docRows(), ...dictionaryRows()]);
}

async function main() {
  const rows = buildHelpRows();
  const commit = commitTag();
  const by = (k: HelpRow["kind"]) => rows.filter((r) => r.kind === k).length;
  console.log(`Help index at ${commit}: ${rows.length} entries — ${by("door")} doors, ${by("doc")} docs paragraphs, ${by("nav")} nav labels, ${by("action")} actions, ${by("dictionary")} page headings (en ${rows.filter((r) => r.language === "en").length}, hi ${rows.filter((r) => r.language === "hi").length}, mr ${rows.filter((r) => r.language === "mr").length})`);
  if (DRY) return;
  await refuseUnlessLocalDatabase(db, "help:index");
  const ep = requireEmbedConfig("help:index");

  const removed = await db.helpEntry.deleteMany({ where: { commit } });
  if (removed.count) console.log(`  replaced ${removed.count} rows already written for ${commit}`);
  for (let i = 0; i < rows.length; i += 500) {
    await db.helpEntry.createMany({ data: rows.slice(i, i + 500).map((r) => ({ ...r, commit })) });
  }

  const started = Date.now();
  let done = 0;
  for (;;) {
    const pending = await db.$queryRaw<{ id: string; title: string; text: string }[]>`
      SELECT "id", "title", "text" FROM "HelpEntry" WHERE "commit" = ${commit} AND "embedding" IS NULL ORDER BY "id" LIMIT 64`;
    if (pending.length === 0) break;
    // A broken answer (non-finite values) is retried a few times; it is never stored.
    let vectors: number[][] = [];
    for (let attempt = 1; ; attempt++) {
      try {
        vectors = await embedTexts(ep, pending.map((r) => `${r.title}\n${r.text}`.slice(0, 3500)), { timeoutMs: 300_000 });
        break;
      } catch (err) {
        if (attempt >= 4) throw err;
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
    await db.$executeRaw`
      UPDATE "HelpEntry" h SET "embedding" = v.e::vector
        FROM (SELECT unnest(${pending.map((r) => r.id)}::text[]) AS id, unnest(${vectors.map(vectorLiteral)}::text[]) AS e) v
       WHERE h."id" = v.id`;
    done += pending.length;
  }
  const minutes = (Date.now() - started) / 60000;
  const stale = await db.helpEntry.deleteMany({ where: { commit: { not: commit } } });
  const total = await db.helpEntry.count();
  console.log(`  embedded ${done} entries in ${minutes.toFixed(1)} min (${(done / Math.max(minutes, 1e-6)).toFixed(0)} a minute); removed ${stale.count} rows of older commits; ${total} entries in HelpEntry.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
