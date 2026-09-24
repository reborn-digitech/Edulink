/**
 * The container's jobs process: the same image, a second command.
 *
 *   JOBS_RUNNER=1 node scripts/jobs-runner.mjs          (fly.toml's `jobs` process)
 *
 * Starts `node server.js` on loopback, then POSTs /api/internal/jobs until
 * the server answers, which starts the schedule in-process
 * (src/lib/job-scheduler.ts). Exits when the server exits, so the platform's
 * restart policy restarts both. No dependencies: this file is copied into the
 * runtime image beside the traced server.
 */
import { spawn } from "node:child_process";

// Loopback and a fixed port, NOT inherited: the platform sets HOSTNAME to
// the machine's own name and PORT to the public one, and the jobs server
// answering on either would be the scheduler's private door open to the
// network. Nothing outside this process needs to reach it.
const host = "127.0.0.1";
const port = "3999";
const env = { ...process.env, JOBS_RUNNER: "1", HOSTNAME: host, PORT: port };

const server = spawn(process.execPath, ["server.js"], { env, stdio: "inherit" });
server.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));

async function kick(attempt = 1) {
  try {
    const res = await fetch(`http://${host}:${port}/api/internal/jobs`, { method: "POST" });
    const body = await res.text();
    if (res.ok) {
      console.log(JSON.stringify({ level: "info", at: new Date().toISOString(), scheduler: "kick", response: JSON.parse(body) }));
      return;
    }
    console.error(JSON.stringify({ level: "error", at: new Date().toISOString(), scheduler: "kick", status: res.status, body: body.slice(0, 200) }));
    process.exit(1);
  } catch {
    if (attempt >= 60) {
      console.error(JSON.stringify({ level: "error", at: new Date().toISOString(), scheduler: "kick", error: "server never answered" }));
      process.exit(1);
    }
    setTimeout(() => kick(attempt + 1), 1000);
  }
}
kick();
