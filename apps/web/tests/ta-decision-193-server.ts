/**
 * One server process of the two-server test (tests/ta-decision-193-two-servers.test.ts, TA-193).
 *
 * Run under tsx with the scripts' tsconfig, as the scripts are; it is not a test file and vitest does not collect
 * it. It holds the real bus of src/lib/realtime.ts in a process of its own, as a web machine does, and does what it
 * is told on stdin, one JSON object a line:
 *
 *   {"do":"subscribe","name":"s1","channels":["class:…"]}   → {"subscribed":"s1","phase":"up"} once it is listening
 *   {"do":"publish","channels":["class:…"],"event":{…}}       → {"published":true} once the signal has been sent
 *   {"do":"exit"}
 *
 * and says what its subscribers hear: {"heard":"s1","event":{…}}, and {"ended":"s1"} when the bus ends a stream.
 * It writes nothing to the database but the bus's own notify.
 */
import { createInterface } from "node:readline";
import * as realtime from "@/lib/realtime";
import type { RealtimeEvent } from "@/lib/realtime";

type Command = { do: "subscribe"; name: string; channels: string[] } | { do: "publish"; channels: string[]; event: RealtimeEvent } | { do: "exit" };

// Read through a loose type, so that this file also runs against a bus that has none of them (the code before the
// change): the test then fails on what the other server did not hear, not on a missing function.
const shared = realtime as unknown as { linkPhase?: () => string; signalsSent?: () => Promise<void>; busMode?: () => string };

const say = (line: Record<string, unknown>) => process.stdout.write(`${JSON.stringify(line)}\n`);

createInterface({ input: process.stdin }).on("line", (text) => {
  const command = JSON.parse(text) as Command;
  if (command.do === "exit") process.exit(0);
  if (command.do === "subscribe") {
    const name = command.name;
    realtime.subscribe(
      command.channels,
      (event: RealtimeEvent) => say({ heard: name, event }),
      // The third argument is the change's: a bus from before it takes two and ignores this one.
      () => say({ ended: name }),
    );
    const started = Date.now();
    const tick = setInterval(() => {
      const phase = shared.linkPhase?.() ?? "none";
      const listening = shared.busMode?.() === "database" ? phase === "up" : true;
      if (!listening && Date.now() - started < 15_000) return;
      clearInterval(tick);
      say({ subscribed: name, phase });
    }, 25);
    return;
  }
  realtime.publish(command.channels, command.event);
  void (shared.signalsSent?.() ?? Promise.resolve()).then(() => say({ published: true }));
});

say({ started: true });
