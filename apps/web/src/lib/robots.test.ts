import { afterEach, describe, expect, it } from "vitest";
import { __setHeaders } from "../../tests/stubs/next-headers";
import { generateMetadata } from "@/app/layout";
import { robotsFor } from "./robots";

/**
 * Signed-in pages are not for search engines (campaign LOAD-5, 4 Oct 2026):
 * the root layout said `index, follow` for every page and /parent, /teacher,
 * /faculty and /student inherited it. Now nothing is indexed but the public
 * pages a person reads before they have an account.
 */
afterEach(() => __setHeaders({}));

describe("the root layout's robots", () => {
  it.each([
    ["/login", true],
    ["/parent", false],
    ["/teacher", false],
    ["/student/exams", false],
  ])("%s → index %s", async (path, indexed) => {
    __setHeaders({ "x-edulink-route": `GET ${path}` });
    const metadata = await generateMetadata();
    expect(metadata.robots).toEqual({ index: indexed, follow: indexed });
  });
});

describe("robotsFor", () => {
  it.each(["/", "/login", "/register", "/register/recruiter", "/privacy", "/public/disclosure/zz-northgate-school", "/certificates/check"])("indexes the public page %s", (path) => {
    expect(robotsFor(`GET ${path}`)).toEqual({ index: true, follow: true });
  });

  it.each(["/parent", "/teacher", "/faculty", "/student", "/admin/people", "/account", "/root", "/invite/abc", "/survey/abc", "/forgot", "/offline", "/login/code", "/public/disclosure/a/b", "/loginx"])("does not index %s", (path) => {
    expect(robotsFor(`GET ${path}`)).toEqual({ index: false, follow: false });
  });

  it("does not index a request with no stamp or an unreadable path", () => {
    expect(robotsFor(null)).toEqual({ index: false, follow: false });
    expect(robotsFor("GET !")).toEqual({ index: false, follow: false });
  });
});
