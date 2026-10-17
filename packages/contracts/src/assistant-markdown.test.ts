import { describe, expect, it } from "vitest";
import { answerPlainText, parseAnswer, parseInlines, restrictAnswerMarkdown } from "./v1/assistant-markdown";

/** Vidura pass 1 (17 Oct 2026): the answers' restricted Markdown, one parser for the web drawer and the phone's sheet. */
describe("restricted Markdown: headings, lists, bold, platform links and tables, nothing else", () => {
  it("narrows what the model wrote before the gate reads it", () => {
    expect(restrictAnswerMarkdown("# Title\n## Sub")).toBe("### Title\n### Sub");
    expect(restrictAnswerMarkdown("See ![a chart](https://x.example/c.png) here")).toBe("See  here");
    expect(restrictAnswerMarkdown("Open [Fees](/parent/fees) now")).toBe("Open Fees (/parent/fees) now");
    expect(restrictAnswerMarkdown("Read [this](https://evil.example)")).toBe("Read this");
    expect(restrictAnswerMarkdown("```js\nalert(1)\n```")).toBe("alert(1)");
    expect(restrictAnswerMarkdown("Press `Save` <b>now</b>")).toBe("Press Save now");
    expect(restrictAnswerMarkdown("an *emphasis* and __strong__ and **bold**")).toBe("an emphasis and **strong** and **bold**");
    expect(restrictAnswerMarkdown("* a bullet\n* another")).toBe("* a bullet\n* another");
    expect(restrictAnswerMarkdown("5 * 3 = 15")).toBe("5 * 3 = 15");
  });

  it("reads bold, citation marks and platform paths as inlines", () => {
    expect(parseInlines("Open **Fees** at /parent/fees [2].")).toEqual([
      { kind: "text", text: "Open " },
      { kind: "bold", text: "Fees" },
      { kind: "text", text: " at " },
      { kind: "path", path: "/parent/fees" },
      { kind: "text", text: " " },
      { kind: "cite", n: 2 },
      { kind: "text", text: "." },
    ]);
    // A date or "and/or" is not a path.
    expect(parseInlines("on 17/10/2026 and/or later").every((x) => x.kind === "text")).toBe(true);
  });

  it("draws headings, a numbered list across blank lines, a bulleted list and paragraphs", () => {
    const blocks = parseAnswer("### Steps\n1. Open /student/assignments.\n\n2. Press **Hand it in**.\n- a note\nThe end.");
    expect(blocks.map((b) => b.kind)).toEqual(["heading", "list", "list", "paragraph"]);
    const list = blocks[1]!;
    expect(list.kind === "list" && list.ordered && list.items.length).toBe(2);
    const bullets = blocks[2]!;
    expect(bullets.kind === "list" && !bullets.ordered).toBe(true);
  });

  it("draws a table for a person's own figures, padding a short row", () => {
    const blocks = parseAnswer("| Month | Due |\n|---|---:|\n| October | ₹2,000 |\n| November |\n");
    expect(blocks).toHaveLength(1);
    const table = blocks[0]!;
    expect(table.kind).toBe("table");
    if (table.kind !== "table") return;
    expect(table.header.length).toBe(2);
    expect(table.rows.length).toBe(2);
    expect(table.rows[1]!.length).toBe(2);
  });

  it("reads as plain sentences for the one announcement", () => {
    expect(answerPlainText("### Steps\n1. Open **Fees**.\n2. Pay.")).toBe("Steps\n1. Open Fees.\n2. Pay.");
  });
});
