/**
 * Text from the address shown as the product's own message: TA-309 of the testing analysis of
 * 13 November 2026.
 *
 *   TA-309  The signed-out survey page put ?error= through t(), which hands back any string that is no
 *           key as it came, and IqacFlash printed the IQAC pages' ?ok= and ?error= raw: a link could make
 *           the college's own page say any sentence in its warning box.
 *
 * Rendered to markup on the server, as the pages draw them; nothing is written to the database beyond
 * the signed-out page's own rate-limit count.
 */
import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { translator } from "@/lib/i18n/dictionary";
import { IqacFlash } from "@/components/iqac/parts";
import SurveyLinkPage from "@/app/survey/[token]/page";

// The components are compiled with the classic JSX runtime under vitest, which reads React from the global scope.
(globalThis as { React?: typeof React }).React = React;

const FORGED ="ZZ Your link has expired. Call 98000 00000 to verify.";

describe("TA-309: only the product's own sentences", () => {
  it("TA-309: IqacFlash drops a sentence from the address and prints one of the dictionaries", () => {
    expect(renderToStaticMarkup(React.createElement(IqacFlash, { error: FORGED }))).toBe("");
    expect(renderToStaticMarkup(React.createElement(IqacFlash, { ok: FORGED }))).toBe("");
    const real = translator("hi")("councilFilings.saved");
    expect(renderToStaticMarkup(React.createElement(IqacFlash, { ok: real }))).toContain(real);
  });

  it("TA-309: the signed-out survey page shows no alert carrying the address's text", async () => {
    __resetCookies();
    __setHeaders({ "x-forwarded-for": `10.9.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}` });
    const page = await SurveyLinkPage({ params: Promise.resolve({ token: "zz-no-such-link" }), searchParams: Promise.resolve({ error: FORGED }) });
    const html = renderToStaticMarkup(page as React.ReactElement);
    expect(html).not.toContain("98000");
    expect(html).not.toContain('role="alert"');
  }, 60_000);
});
