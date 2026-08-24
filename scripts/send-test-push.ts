/**
 * Proves the VAPID wiring, and says exactly which part is wrong when it is.
 *
 *   npm run push:test                     — check the configuration only
 *   npm run push:test -- someone@school   — and push to that person's devices
 *
 * The private key is never printed. A push that reaches nobody is reported as
 * reaching nobody rather than as success: the failure this whole file exists
 * to prevent is a deployment believing it sends notifications when it does not.
 */
import { readVapidConfig, isPlaceholderVapidSubject } from "../src/lib/env";
import { sendPush } from "../src/lib/notify";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const read = readVapidConfig();
  if (!read.ok) {
    console.error("VAPID is not correctly configured:");
    for (const p of read.problems) console.error(`  - ${p.key}: ${p.message}`);
    process.exit(1);
  }
  const { publicKey, subject } = read.config;
  // The public key is public by definition — it ships to every browser.
  console.log(`VAPID ok — pair matches, public key ${publicKey.slice(0, 12)}…, subject ${subject}`);
  if (isPlaceholderVapidSubject()) {
    console.warn("  ⚠ that subject is the shipped placeholder: a .local address no push service can reach.");
  }

  const who = process.argv[2]?.trim();
  if (!who) {
    console.log("Configuration only. Pass an email to push to that person's devices.");
    process.exit(0);
  }

  const user = await db.user.findFirst({
    where: { email: { equals: who, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (!user) {
    console.error(`No user with the email ${who}.`);
    process.exit(1);
  }

  const subs = await db.pushSubscription.count({ where: { userId: user.id } });
  if (subs === 0) {
    // Not an error in the configuration — an honest absence, and the commonest
    // reason a test push "does nothing".
    console.error(`${user.name} has no registered devices, so there is nothing to push to.`);
    console.error("Turn notifications on in the app on a device first, then run this again.");
    process.exit(1);
  }

  console.log(`pushing to ${subs} device(s) for ${user.name}…`);
  const result = await sendPush(user.id, {
    title: "EduLink test",
    body: `Push wiring test at ${new Date().toISOString()}.`,
    url: "/",
    tag: "push-test",
  });

  // What the send REPORTS, not what the table looks like afterwards: a
  // transient failure keeps its subscription, so counting rows would call a
  // total failure a success. That is the exact thing this script exists to
  // catch a deployment doing.
  const parts = [`${result.delivered} delivered`];
  if (result.failed > 0) parts.push(`${result.failed} failed`);
  if (result.retired > 0) parts.push(`${result.retired} retired as dead`);
  console.log(parts.join(", ") + ".");
  if (result.delivered === 0) {
    console.error("Nothing was delivered. The console lines above carry the provider's reason.");
    process.exit(1);
  }
  console.log("Now look at the handset — an accepted push is not a displayed one.");
  process.exit(0);
}

main()
  .catch((error) => {
    console.error("push:test failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
