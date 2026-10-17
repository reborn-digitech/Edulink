"use client";

import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { parseAnswer, type AnswerInline } from "@edulink/contracts";
import { cn } from "@/lib/cn";
import { TableScroll } from "@/components/ui/table-scroll";

/**
 * An answer as Vidura's restricted Markdown (docs/plans/vidura.md, decision 6; pass 1, 17 Oct 2026): headings,
 * numbered and bulleted lists, bold, platform links and tables, drawn from the one parser the phone uses too
 * (packages/contracts v1/assistant-markdown.ts). Nothing else is ever drawn as markup: whatever else the text holds is
 * text. A platform path is a link on the platform; a citation mark stays a small "[2]" pointing at the sources below.
 */
export function AnswerMarkdown({ text, className }: { text: string; className?: string }) {
  const blocks = parseAnswer(text);
  return (
    <div className={cn("space-y-2 break-words", className)} data-testid="vidura-answer">
      {blocks.map((b, i) => {
        if (b.kind === "heading")
          return (
            <h3 key={i} className="pt-1 text-sm font-semibold text-fg">
              <Inlines items={b.inlines} />
            </h3>
          );
        if (b.kind === "paragraph")
          return (
            <p key={i}>
              <Inlines items={b.inlines} />
            </p>
          );
        if (b.kind === "list") {
          const items = b.items.map((it, n) => (
            <li key={n}>
              <Inlines items={it} />
            </li>
          ));
          return b.ordered ? (
            <ol key={i} start={b.start} className="list-decimal space-y-1 pl-5">
              {items}
            </ol>
          ) : (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {items}
            </ul>
          );
        }
        return (
          // A table scrolls inside its own box at phone width rather than pushing the page sideways; it is focusable so a
          // keyboard can scroll it (axe's scrollable-region-focusable).
          <TableScroll key={i} className="max-w-full rounded-[var(--radius-sm)] border border-border" label={b.header.map((h) => h.map(inlineWords).join("")).join(", ")}>
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-muted">
                <tr>
                  {b.header.map((h, n) => (
                    <th key={n} scope="col" className="px-2 py-1.5 text-left font-semibold text-fg">
                      <Inlines items={h} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((row, r) => (
                  <tr key={r} className="border-t border-border">
                    {row.map((cell, n) => (
                      <td key={n} className="px-2 py-1.5 align-top">
                        <Inlines items={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        );
      })}
    </div>
  );
}

function inlineWords(x: AnswerInline): string {
  return x.kind === "cite" ? `[${x.n}]` : x.kind === "path" ? x.path : x.text;
}

function Inlines({ items }: { items: AnswerInline[] }): ReactNode {
  return (
    <>
      {items.map((x, i) => {
        if (x.kind === "bold")
          return (
            <strong key={i} className="font-semibold text-fg">
              {x.text}
            </strong>
          );
        if (x.kind === "cite")
          return (
            <span key={i} className="text-xs font-semibold text-fg-muted">
              [{x.n}]
            </span>
          );
        if (x.kind === "path")
          return (
            <Link key={i} href={x.path} className="font-medium text-accent-strong underline underline-offset-4">
              {x.path}
            </Link>
          );
        return <Fragment key={i}>{x.text}</Fragment>;
      })}
    </>
  );
}
