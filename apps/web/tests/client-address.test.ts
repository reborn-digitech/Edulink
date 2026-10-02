import { afterEach, describe, expect, it } from "vitest";
import { addressBytes, inRange, isCloudflareAddress } from "@/lib/cloudflare";
import { clientAddress } from "@/lib/rate-limit";

/**
 * Who the caller is, for every per-address limit and the address in audit
 * rows and sessions. Behind Cloudflare's proxy the hop that reaches Fly is a
 * Cloudflare edge; CF-Connecting-IP names the caller, but only a request that
 * really came through Cloudflare may be believed about it.
 */

const ENV = ["FLY_APP_NAME", "TRUST_FLY_CLIENT_IP", "TRUST_CLOUDFLARE"] as const;
const original = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
afterEach(() => {
  for (const k of ENV) {
    if (original[k] === undefined) delete process.env[k];
    else process.env[k] = original[k];
  }
});

function onFly(cloudflare: boolean) {
  process.env.FLY_APP_NAME = "shalaghar";
  delete process.env.TRUST_FLY_CLIENT_IP;
  if (cloudflare) process.env.TRUST_CLOUDFLARE = "1";
  else delete process.env.TRUST_CLOUDFLARE;
}

const EDGE_V4 = "162.158.10.20"; // 162.158.0.0/15
const EDGE_V6 = "2606:4700:10::ac43:1"; // 2606:4700::/32
const CALLER = "49.36.12.7";

describe("cloudflare ranges", () => {
  it("parses IPv4, IPv6, the compressed forms and IPv4-mapped IPv6", () => {
    expect(addressBytes("10.0.0.1")).toEqual([10, 0, 0, 1]);
    expect(addressBytes("::1")).toEqual([...Array(15).fill(0), 1]);
    expect(addressBytes("::ffff:162.158.1.2")).toEqual([162, 158, 1, 2]);
    expect(addressBytes("2606:4700::1")?.slice(0, 4)).toEqual([0x26, 0x06, 0x47, 0x00]);
    for (const bad of ["", "unknown", "256.1.1.1", "1.2.3", "1::2::3", "2606:4700:x::1", "1:2:3:4:5:6:7:8:9"]) {
      expect(addressBytes(bad), bad).toBeNull();
    }
  });

  it("matches by prefix and never across families", () => {
    expect(inRange("104.23.255.255", "104.16.0.0/13")).toBe(true);
    expect(inRange("104.24.0.0", "104.16.0.0/13")).toBe(false);
    expect(inRange("2a06:98c7:ffff::1", "2a06:98c0::/29")).toBe(true);
    expect(inRange("2a06:98c8::1", "2a06:98c0::/29")).toBe(false);
    expect(inRange("10.0.0.1", "2400:cb00::/32")).toBe(false);
    expect(inRange("10.0.0.1", "0.0.0.0/0")).toBe(true);
  });

  it("knows the edges and nobody else", () => {
    expect(isCloudflareAddress(EDGE_V4)).toBe(true);
    expect(isCloudflareAddress(EDGE_V6)).toBe(true);
    expect(isCloudflareAddress(`::ffff:${EDGE_V4}`)).toBe(true);
    for (const other of [CALLER, "127.0.0.1", "::1", "fdaa:0:1::3", "8.8.8.8", "not an address"]) {
      expect(isCloudflareAddress(other), other).toBe(false);
    }
  });
});

describe("clientAddress", () => {
  it("on Fly without the flag, a Cloudflare edge is the caller and CF-Connecting-IP is ignored", () => {
    onFly(false);
    expect(clientAddress(new Headers({ "fly-client-ip": EDGE_V4, "cf-connecting-ip": CALLER }))).toBe(EDGE_V4);
  });

  it("with TRUST_CLOUDFLARE=1, a request through a Cloudflare edge is keyed on CF-Connecting-IP (IPv4 and IPv6 edges)", () => {
    onFly(true);
    expect(clientAddress(new Headers({ "fly-client-ip": EDGE_V4, "cf-connecting-ip": CALLER }))).toBe(CALLER);
    expect(clientAddress(new Headers({ "fly-client-ip": EDGE_V6, "cf-connecting-ip": "2401:4900::5" }))).toBe("2401:4900::5");
  });

  it("with the flag, a request that reaches the origin directly cannot choose its key with the header", () => {
    onFly(true);
    expect(clientAddress(new Headers({ "fly-client-ip": CALLER, "cf-connecting-ip": "1.1.1.1" }))).toBe(CALLER);
  });

  it("with the flag, an edge that sends no CF-Connecting-IP is keyed on the edge", () => {
    onFly(true);
    expect(clientAddress(new Headers({ "fly-client-ip": EDGE_V4 }))).toBe(EDGE_V4);
  });

  it("off Fly, the hop is X-Forwarded-For's last entry; a forged first entry or Fly header changes nothing", () => {
    delete process.env.FLY_APP_NAME;
    delete process.env.TRUST_FLY_CLIENT_IP;
    process.env.TRUST_CLOUDFLARE = "1";
    expect(clientAddress(new Headers({ "x-forwarded-for": `9.9.9.9, ${EDGE_V4}`, "cf-connecting-ip": CALLER, "fly-client-ip": "5.5.5.5" }))).toBe(CALLER);
    expect(clientAddress(new Headers({ "x-forwarded-for": `${EDGE_V4}, ${CALLER}`, "cf-connecting-ip": "1.1.1.1" }))).toBe(CALLER);
    expect(clientAddress(new Headers({}))).toBeNull();
  });
});
