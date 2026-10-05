import { describe, expect, it } from "vitest";
import { streamedStatus } from "../scripts/streamed-status";

describe("the page sweep reads a refusal streamed under a loading boundary", () => {
  it("a 200 shell carrying a redirect digest is the redirect, with its location", () => {
    const body = `<script>self.__next_f.push([1,"...digest\\":\\"NEXT_REDIRECT;replace;/switch;307;\\"..."])</script>`;
    expect(streamedStatus(200, body, null)).toEqual({ status: 307, loc: "/switch", streamed: true });
  });
  it("a 200 shell carrying the not-found fallback digest is a 404", () => {
    const body = `digest\\":\\"NEXT_HTTP_ERROR_FALLBACK;404\\"`;
    expect(streamedStatus(200, body, null)).toEqual({ status: 404, loc: null, streamed: true });
  });
  it("a real 200 page and a real 307 pass through untouched", () => {
    expect(streamedStatus(200, "<h1>Vacancies</h1>", null)).toEqual({ status: 200, loc: null, streamed: false });
    expect(streamedStatus(307, "", "/login")).toEqual({ status: 307, loc: "/login", streamed: false });
  });
});
