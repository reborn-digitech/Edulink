/**
 * The competitions crawler's reach and its robots.txt name (testing analysis of 13 November 2026, the
 * 'test-infra' batch).
 *
 *   TA-105  The crawler fetched private and loopback addresses and followed redirects to them: a source root of
 *           http://127.0.0.1:5432/ or http://169.254.169.254/ was accepted by the desk, and an organiser's site
 *           answering 302 to an address inside the machine was read, with no robots.txt and no gap for the hop.
 *   TA-320  A robots.txt group for "Shalaghar-competitions", the product token the crawler announces, was not
 *           taken for the crawler's own, and an empty User-agent line was.
 *
 * THE NETWORK IS FAKED: the transport is the suite's own, with a virtual clock, as in tests/competitions-crawl.test.ts.
 * The resolver guard is called with a fake lookup. Nothing is written to the database.
 */
import { describe, expect, it } from "vitest";
import { normaliseRootUrl } from "@/lib/competition-crawl-desk";
import { parseRobots } from "../scripts/competitions-crawl/robots";
import { PoliteClient, guardedLookup, isPrivateAddress, type HttpAnswer, type Transport } from "../scripts/competitions-crawl/http";
import { crawlSource, type CachedPage, type PageCache } from "../scripts/competitions-crawl/crawl";

type Route = { status?: number; body?: string; type?: string; location?: string };

function fakeNet(routes: Record<string, Route>) {
  let clock = 0;
  const calls: { url: string; at: number }[] = [];
  const transport: Transport = async (url) => {
    calls.push({ url, at: clock });
    clock += 5;
    const r = routes[url];
    if (!r) return { status: 404, url, headers: { "content-type": "text/html" }, body: Buffer.from("<html>not here</html>"), truncated: false };
    const answer: HttpAnswer = { status: r.status ?? 200, url, headers: { "content-type": r.type ?? "text/html; charset=utf-8", location: r.location }, body: Buffer.from(r.body ?? ""), truncated: false };
    return answer;
  };
  const client = new PoliteClient({ transport, now: () => clock, sleep: async (ms) => void (clock += ms) });
  return { client, calls };
}

function memoryCache(): PageCache {
  const rows = new Map<string, CachedPage>();
  return {
    get: async (url) => rows.get(url) ?? null,
    put: async (_sourceId, page) => void rows.set(page.url, { url: page.url, etag: page.etag, lastModified: page.lastModified, sha256: page.sha256, links: page.links, status: page.status, refused: page.refused }),
  };
}

const PAGE = `<!doctype html><html><head><title>ZZ Olympiad</title></head><body><h1>ZZ Olympiad 2026</h1><p>Plenty of words here so the page is plainly not a script shell; the olympiad is for pupils, entries for 2026.</p></body></html>`;

const deps = (client: PoliteClient, pages: string[], log: string[] = []) => ({
  client,
  cache: memoryCache(),
  shouldStop: () => false,
  onPage: async (p: { url: string }) => void pages.push(p.url),
  log: (line: string) => void log.push(line),
});

describe("TA-105: the crawler reads only the public internet", () => {
  it("TA-105: a source root that is an IP literal (loopback, private, link-local, IPv6) is refused by the desk", () => {
    for (const raw of ["http://127.0.0.1:5432/", "http://192.168.1.1/", "http://169.254.169.254/latest/meta-data/", "http://10.0.0.7/", "https://8.8.8.8/", "http://127.1/", "http://[::1]/", "http://[fd00::1]/", "http://0x7f.0.0.1/"]) {
      expect(normaliseRootUrl(raw), raw).toBeNull();
    }
    // An organiser's ordinary site is still accepted.
    expect(normaliseRootUrl("https://www.sofworld.org/nso#top")).toBe("https://www.sofworld.org/nso");
  });

  it("TA-105: a root that answers 302 to http://127.0.0.1/ is refused with a reason and the second request is never made", async () => {
    const root = "https://zz-ta105-redirect.test/";
    const { client, calls } = fakeNet({
      "https://zz-ta105-redirect.test/robots.txt": { status: 404 },
      [root]: { status: 302, location: "http://127.0.0.1/admin" },
      "http://127.0.0.1/admin": { body: PAGE },
    });
    const pages: string[] = [];
    const out = await crawlSource({ id: "zz-ta105", rootUrl: root }, deps(client, pages));
    expect(out.refused?.reason).toBe("UNREACHABLE");
    expect(out.refused?.detail).toMatch(/private/);
    expect(calls.map((c) => c.url)).not.toContain("http://127.0.0.1/admin");
    expect(pages).toEqual([]);
  });

  it("TA-105: the client refuses every private range on a redirect hop, and a hop to another scheme", async () => {
    for (const target of ["http://10.1.2.3/", "http://172.16.0.1/", "http://192.168.0.10/", "http://169.254.169.254/", "http://0.0.0.0/", "http://[::1]/", "http://[fe80::1]/", "http://[fc00::5]/", "http://[::ffff:127.0.0.1]/", "file:///etc/passwd"]) {
      const { client, calls } = fakeNet({ "https://zz-ta105-hop.test/x": { status: 301, location: target } });
      await expect(client.get("https://zz-ta105-hop.test/x"), target).rejects.toThrow(/refused/);
      expect(calls.length, target).toBe(1);
    }
  });

  it("TA-105: a redirect hop to another public host is read with that host's robots.txt and the one-second gap", async () => {
    const root = "https://zz-ta105-a.test/";
    const { client, calls } = fakeNet({
      "https://zz-ta105-a.test/robots.txt": { status: 404 },
      [root]: { status: 302, location: "https://zz-ta105-b.test/olympiad" },
      "https://zz-ta105-b.test/robots.txt": { body: "User-agent: *\nDisallow: /olympiad\n", type: "text/plain" },
      "https://zz-ta105-b.test/olympiad": { body: PAGE },
    });
    const pages: string[] = [];
    const out = await crawlSource({ id: "zz-ta105-b", rootUrl: root }, deps(client, pages));
    expect(out.refused?.reason).toBe("ROBOTS");
    expect(calls.map((c) => c.url)).toEqual(["https://zz-ta105-a.test/robots.txt", root, "https://zz-ta105-b.test/robots.txt"]);
    expect(pages).toEqual([]);

    // Allowed there, the hop is read, and it waits the gap after that host's robots.txt.
    const { client: c2, calls: calls2 } = fakeNet({
      "https://zz-ta105-a.test/robots.txt": { status: 404 },
      [root]: { status: 302, location: "https://zz-ta105-b.test/olympiad" },
      "https://zz-ta105-b.test/robots.txt": { status: 404 },
      "https://zz-ta105-b.test/olympiad": { body: PAGE },
    });
    const pages2: string[] = [];
    const out2 = await crawlSource({ id: "zz-ta105-c", rootUrl: root }, deps(c2, pages2));
    expect(out2.refused).toBeNull();
    expect(pages2).toEqual([root]);
    const robotsB = calls2.find((c) => c.url === "https://zz-ta105-b.test/robots.txt")!;
    const hop = calls2.find((c) => c.url === "https://zz-ta105-b.test/olympiad")!;
    expect(hop.at - robotsB.at).toBeGreaterThanOrEqual(1_000);
  });

  it("TA-105: the machine's resolver refuses a name that resolves to a private address, and passes a public one", async () => {
    const lookup = guardedLookup(async (host) => (host === "inside.zz-ta105.test" ? [{ address: "192.168.1.20", family: 4 }] : host === "mixed.zz-ta105.test" ? [{ address: "93.184.216.34", family: 4 }, { address: "::1", family: 6 }] : [{ address: "93.184.216.34", family: 4 }]));
    const ask = (host: string, all: boolean) =>
      new Promise<{ err: NodeJS.ErrnoException | null; address: unknown }>((resolve) => lookup(host, { all }, (err, address) => resolve({ err, address })));
    const inside = await ask("inside.zz-ta105.test", false);
    expect(inside.err?.message).toMatch(/refused/);
    expect((await ask("mixed.zz-ta105.test", true)).err?.message).toMatch(/refused/);
    const outside = await ask("organiser.zz-ta105.test", false);
    expect(outside.err).toBeNull();
    expect(outside.address).toBe("93.184.216.34");
    const all = await ask("organiser.zz-ta105.test", true);
    expect(all.address).toEqual([{ address: "93.184.216.34", family: 4 }]);
  });

  it("TA-105: the address rule itself", () => {
    for (const a of ["127.0.0.1", "10.0.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "::", "fe80::1", "fd12::1", "fc00::1", "::ffff:10.0.0.1", "::ffff:7f00:1", "224.0.0.1", "255.255.255.255"]) expect(isPrivateAddress(a), a).toBe(true);
    for (const a of ["93.184.216.34", "8.8.8.8", "172.32.0.1", "2606:4700::1111"]) expect(isPrivateAddress(a), a).toBe(false);
  });
});

describe("TA-320: a robots.txt group addressed to the name the crawler announces", () => {
  it("TA-320: User-agent: Shalaghar-competitions is the crawler's own group, written with or without its version", () => {
    const file = "User-agent: *\nAllow: /\n\nUser-agent: Shalaghar-competitions\nDisallow: /\n";
    expect(parseRobots(file).allowed("/x")).toBe(false);
    expect(parseRobots(file.replace("Shalaghar-competitions", "Shalaghar-competitions/1.0")).allowed("/x")).toBe(false);
    expect(parseRobots(file.replace("Shalaghar-competitions", "shalaghar-COMPETITIONS")).allowed("/x")).toBe(false);
    // The short name still names it, as before.
    expect(parseRobots(file.replace("Shalaghar-competitions", "Shalaghar")).allowed("/x")).toBe(false);
  });

  it("TA-320: an empty User-agent line, or another crawler's name, is not the crawler's group", () => {
    const empty = "User-agent: *\nAllow: /\n\nUser-agent:\nDisallow: /\n";
    expect(parseRobots(empty).allowed("/x")).toBe(true);
    const other = "User-agent: *\nAllow: /\n\nUser-agent: Shala\nDisallow: /\n\nUser-agent: Shalaghar-other\nDisallow: /\n";
    expect(parseRobots(other).allowed("/x")).toBe(true);
  });
});
