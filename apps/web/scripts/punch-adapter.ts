/**
 * THE VENDOR ADAPTER FOR AN ATTENDANCE DEVICE (R-2, 5 Oct 2026) — UNTESTED
 * AGAINST ANY VENDOR'S DEVICE OR EXPORT. It turns a reader's log into the
 * platform's own signed batches (packages/contracts v1/attendance-devices.ts)
 * and posts them; the server's door is format-agnostic, so this file is the
 * only place a vendor's shape is read.
 *
 *   PUNCH_URL=https://…/api/v1/punch/<schoolId> PUNCH_DEVICE_ID=<id> PUNCH_KEY=<key> \
 *     npx tsx --tsconfig scripts/tsconfig.json scripts/punch-adapter.ts attlog.dat
 *
 * THE INPUT it reads, one punch a line, tab- or comma-separated, the shape
 * many readers' "attendance log" exports take (a ZKTeco ATTLOG line is
 * `PIN<TAB>YYYY-MM-DD HH:MM:SS<TAB>…`, read from documentation, never from a
 * device here): the badge code, the local date and time, and optionally a
 * third field 0/IN for arriving or 1/OUT for leaving. Lines that do not parse
 * are counted and skipped. PUNCH_TZ_OFFSET (default +05:30) is the reader's
 * clock zone. Each punch's id is a digest of its code and time, so posting
 * the same log twice changes nothing on the server.
 *
 * Batches of PUNCH_BATCH_MAX, each signed with lib/punch-signature.ts, the
 * same function the server checks with. Prints each batch's counts and the
 * outcomes that changed nothing, never the key.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { PUNCH_BATCH_MAX, PUNCH_HEADERS, type PunchBatch } from "@edulink/contracts";
import { signPunches } from "../src/lib/punch-signature";

type Punch = PunchBatch["punches"][number];

export function parseLog(text: string, offset = "+05:30"): { punches: Punch[]; skipped: number } {
  const punches: Punch[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [code, when, dir] = line.split(/\t|,/).map((x) => x.trim());
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/.exec(when ?? "");
    if (!code || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$/.test(code) || !m) {
      skipped += 1;
      continue;
    }
    const time = m[2]!.length === 5 ? `${m[2]}:00` : m[2]!;
    const at = `${m[1]}T${time}${offset}`;
    const direction = dir === "1" || /^out$/i.test(dir ?? "") ? "OUT" : dir === "0" || /^in$/i.test(dir ?? "") ? "IN" : undefined;
    const id = createHash("sha256").update(`${code}|${at}|${direction ?? ""}`).digest("hex").slice(0, 32);
    punches.push({ id, code, at, ...(direction ? { direction } : {}) });
  }
  return { punches, skipped };
}

async function main(): Promise<void> {
  const [file] = process.argv.slice(2);
  const url = process.env.PUNCH_URL;
  const device = process.env.PUNCH_DEVICE_ID;
  const key = process.env.PUNCH_KEY;
  if (!file || !url || !device || !key) {
    console.error("Usage: PUNCH_URL=… PUNCH_DEVICE_ID=… PUNCH_KEY=… tsx scripts/punch-adapter.ts <log file>");
    process.exit(2);
  }
  const { punches, skipped } = parseLog(readFileSync(file, "utf8"), process.env.PUNCH_TZ_OFFSET ?? "+05:30");
  console.log(`${punches.length} punches read, ${skipped} lines skipped`);
  for (let i = 0; i < punches.length; i += PUNCH_BATCH_MAX) {
    const body = JSON.stringify({ punches: punches.slice(i, i + PUNCH_BATCH_MAX) });
    const ts = String(Math.floor(Date.now() / 1000));
    const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", [PUNCH_HEADERS.device]: device, [PUNCH_HEADERS.timestamp]: ts, [PUNCH_HEADERS.signature]: signPunches(key, ts, body) }, body });
    const answer = (await res.json().catch(() => ({}))) as { received?: number; applied?: number; replayed?: number; results?: { id: string; outcome: string }[]; code?: string };
    if (!res.ok) {
      console.error(`batch ${i / PUNCH_BATCH_MAX + 1}: ${res.status} ${answer.code ?? ""}`);
      process.exit(1);
    }
    const quiet = (answer.results ?? []).filter((r) => r.outcome !== "APPLIED" && r.outcome !== "ALREADY_MARKED");
    console.log(`batch ${i / PUNCH_BATCH_MAX + 1}: ${answer.received} received, ${answer.applied} applied, ${answer.replayed} sent before${quiet.length ? `; ${quiet.map((r) => r.outcome).join(", ")}` : ""}`);
  }
}

if (process.argv[1]?.endsWith("punch-adapter.ts")) void main();
