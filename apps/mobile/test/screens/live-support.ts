import { __setEventsFetch } from "@/lib/use-events";

/**
 * The event stream for a screen test: GET /api/v1/events answered with a
 * body the test writes frames into by hand, as the server would. `event`
 * sends one named event with its JSON; `opened` resolves once the screen has
 * opened the stream (the hook opens it after the screen's data is there).
 */
export function fakeEvents() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let opens = 0;
  const waiting: (() => void)[] = [];
  __setEventsFetch(async (url, init) => {
    opens++;
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        controller = c;
        c.enqueue(encoder.encode('event: ready\ndata: {"channels":[]}\n\n'));
      },
      cancel() {
        controller = null;
      },
    });
    init.signal.addEventListener("abort", () => {
      controller = null;
    });
    for (const w of waiting.splice(0)) w();
    return { ok: true, status: 200, body: stream, url };
  });
  return {
    get opens() {
      return opens;
    },
    opened: () => (opens > 0 ? Promise.resolve() : new Promise<void>((resolve) => waiting.push(resolve))),
    event: (type: string, data: Record<string, unknown>) => {
      if (!controller) throw new Error("the stream is not open");
      controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`));
    },
    keepAlive: () => controller?.enqueue(encoder.encode(": keep-alive\n\n")),
    end: () => {
      controller?.close();
      controller = null;
    },
    /** Back to the quiet stream every other test gets. */
    reset: () => __setEventsFetch(null),
  };
}
