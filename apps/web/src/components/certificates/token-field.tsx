"use client";

import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import type { TypingLanguage } from "@/lib/transliterate";

/**
 * A text the office types in, where a detail of the pupil is a word and not
 * a code. The template keeps `[[pupil.name]]`; the person writing it reads
 * "Pupil's name" on a coloured chip, cannot mistype it, and removes it with
 * one press of backspace. What is stored has not changed: the text goes out
 * of here as the same string with the same double brackets.
 *
 * WHY IT IS NOT A TEXTAREA. A textarea can only show characters, so the
 * code itself was what the office read and edited around. This is an
 * editable region whose chips are not editable; everything between them is
 * plain text, typed in any script the keyboard writes.
 *
 * THE BROWSER OWNS THE TEXT WHILE IT IS BEING TYPED. The region is drawn
 * from `value` only when `value` changes from outside — a preset chosen, a
 * detail inserted, the language of the chips changed — and never on a
 * keystroke, so a syllable being composed in Devanagari is never redrawn
 * under the keyboard. A code typed by hand becomes a chip when the field is
 * left.
 */
export type TokenFieldHandle = { insert: (key: string) => void; focus: () => void };

const TOKEN = /\[\[\s*([a-z]+\.[A-Za-z]+)\s*\]\]/g;
const ZERO_WIDTH = /​/g;

type Props = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** The word a detail is shown by, or null for one the certificate cannot fill. */
  labelOf: (key: string) => string | null;
  multiline?: boolean;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  /** The label is for a screen reader alone: a row's value sits under a column the row already names. */
  hideLabel?: boolean;
  /** What this region is typed in, over the header's switch: a paragraph set in a Devanagari face is typed in Devanagari. */
  typing?: TypingLanguage;
  /** The face the region is drawn in, so the writer sees the paper's. */
  style?: CSSProperties;
  "data-testid"?: string;
};

function chip(doc: Document, key: string, word: string | null): HTMLElement {
  const el = doc.createElement("span");
  el.contentEditable = "false";
  el.dataset.token = key;
  el.dataset.known = word === null ? "false" : "true";
  el.className = cn(
    "mx-0.5 inline-block rounded-[var(--radius-sm)] px-1.5 py-0.5 align-baseline text-[0.8125rem] font-medium leading-tight",
    word === null ? "bg-danger-soft text-danger" : "bg-accent-soft text-accent-strong",
  );
  el.textContent = word ?? `[[${key}]]`;
  return el;
}

function draw(root: HTMLElement, value: string, labelOf: (key: string) => string | null) {
  const doc = root.ownerDocument;
  root.textContent = "";
  let at = 0;
  for (const match of value.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    if (start > at) root.append(doc.createTextNode(value.slice(at, start)));
    root.append(chip(doc, match[1]!, labelOf(match[1]!)));
    at = start + match[0].length;
  }
  if (at < value.length) root.append(doc.createTextNode(value.slice(at)));
}

function read(root: HTMLElement, multiline: boolean): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.dataset.token) {
      out += `[[${node.dataset.token}]]`;
      return;
    }
    if (node.tagName === "BR") {
      out += "\n";
      return;
    }
    // A browser that wraps a new line in a block of its own: the block is the line.
    const block = node !== root && (node.tagName === "DIV" || node.tagName === "P");
    if (block && out.length > 0 && !out.endsWith("\n")) out += "\n";
    node.childNodes.forEach(walk);
  };
  walk(root);
  out = out.replace(ZERO_WIDTH, "").replace(/ /g, " ");
  return multiline ? out : out.replace(/\s*\n+\s*/g, " ");
}

/** How far into the text, as it is stored, the caret stands. */
function offsetOf(root: HTMLElement, range: Range, multiline: boolean): number {
  const before = root.ownerDocument.createRange();
  before.selectNodeContents(root);
  before.setEnd(range.startContainer, range.startOffset);
  const holder = root.ownerDocument.createElement("div");
  holder.append(before.cloneContents());
  return read(holder, multiline).length;
}

/** The caret put that far into a region that has just been drawn, where every node is a text or a chip. */
function caretAt(root: HTMLElement, offset: number) {
  const doc = root.ownerDocument;
  const range = doc.createRange();
  let left = offset;
  let placed = false;
  for (const node of Array.from(root.childNodes)) {
    const length = node instanceof HTMLElement && node.dataset.token ? `[[${node.dataset.token}]]`.length : (node.textContent ?? "").length;
    if (node.nodeType === Node.TEXT_NODE && left <= length) {
      range.setStart(node, left);
      placed = true;
      break;
    }
    if (node.nodeType !== Node.TEXT_NODE && left <= length) {
      // Straight after a chip, which is not text: something for the caret to stand in, taken out of what is read.
      const after = doc.createTextNode("\u200B");
      node.after(after);
      range.setStart(after, 1);
      placed = true;
      break;
    }
    left -= length;
  }
  if (!placed) {
    range.selectNodeContents(root);
    range.collapse(false);
  }
  range.collapse(true);
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

export const TokenField = forwardRef<TokenFieldHandle, Props>(function TokenField({ label, value, onChange, labelOf, multiline = false, required, disabled, hint, error, className, hideLabel, typing, style, ...rest }, ref) {
  const t = useT();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  /** What the region held when it last spoke, so a value that is only its own echo is not drawn again. */
  const spoken = useRef<string | null>(null);
  /**
   * Where the caret last stood in this text. The list a detail is chosen
   * from takes the focus to search in, and the browser forgets the caret of
   * a region that has lost it; the detail goes where the writer left off.
   */
  const caret = useRef<number | null>(null);
  const remember = () => {
    const el = root.current;
    const selection = el?.ownerDocument.getSelection();
    if (!el || !selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (el.contains(range.startContainer)) caret.current = offsetOf(el, range, multiline);
  };
  const labels = useRef(labelOf);
  useEffect(() => {
    labels.current = labelOf;
  });

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (spoken.current === value && el.childNodes.length > 0) return;
    draw(el, value, labelOf);
    spoken.current = value;
    // `labelOf` is a new function on every render of the editor; the chips are redrawn for a new VALUE, and for a
    // new language by the key the editor gives this field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const speak = () => {
    const el = root.current;
    if (!el) return;
    const next = read(el, multiline);
    spoken.current = next;
    if (next !== value) onChange(next);
  };

  /** Puts a node where the caret is, or at the end when the caret is somewhere else, and the caret after it. */
  const place = (node: Node) => {
    const el = root.current;
    if (!el) return;
    const selection = el.ownerDocument.getSelection();
    let range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    if (!range || !el.contains(range.commonAncestorContainer)) {
      range = el.ownerDocument.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
    }
    range.deleteContents();
    // Something for the caret to stand in after a chip, which is not text; it is taken out of what is read.
    const after = el.ownerDocument.createTextNode("​");
    range.insertNode(after);
    range.insertNode(node);
    const caret = el.ownerDocument.createRange();
    caret.setStart(after, 1);
    caret.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(caret);
  };

  useImperativeHandle(ref, () => ({
    focus: () => root.current?.focus(),
    insert: (key: string) => {
      const el = root.current;
      if (!el || disabled) return;
      const now = read(el, multiline);
      const at = Math.min(caret.current ?? now.length, now.length);
      const token = `[[${key}]]`;
      const next = now.slice(0, at) + token + now.slice(at);
      draw(el, next, labels.current);
      spoken.current = next;
      el.focus();
      caretAt(el, at + token.length);
      caret.current = at + token.length;
      if (next !== value) onChange(next);
    },
  }));

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && !error ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <span id={`${id}-label`} className={hideLabel ? "sr-only" : "block text-sm font-medium text-fg"}>
        {label}
        {required && !hideLabel && (
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only"> {t("field.required")}</span>}
      </span>
      <div
        ref={root}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        contentEditable={!disabled}
        suppressContentEditableWarning
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        aria-multiline={multiline}
        aria-required={required || undefined}
        aria-invalid={Boolean(error) || undefined}
        aria-disabled={disabled || undefined}
        spellCheck
        data-testid={rest["data-testid"]}
        data-typing={typing}
        style={style}
        className={cn(
          "w-full whitespace-pre-wrap break-words rounded-[var(--radius-md)] border bg-surface px-3.5 py-3 text-[0.9375rem] leading-relaxed text-fg",
          multiline ? "min-h-28" : "min-h-12",
          "transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus:outline-none",
          error ? "border-danger ring-2 ring-danger/25" : "border-border hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-accent-ring/40",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onInput={() => {
          speak();
          remember();
        }}
        onKeyUp={remember}
        onMouseUp={remember}
        onFocus={remember}
        onBlur={() => {
          // A code typed by hand becomes the chip it names.
          const el = root.current;
          if (!el) return;
          const now = read(el, multiline);
          draw(el, now, labels.current);
          spoken.current = now;
          if (now !== value) onChange(now);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (!multiline) return;
          place(root.current!.ownerDocument.createTextNode("\n"));
          speak();
        }}
        onPaste={(event) => {
          // Words, not the page they were copied from.
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          if (!text) return;
          place(root.current!.ownerDocument.createTextNode(multiline ? text : text.replace(/\s*\n+\s*/g, " ")));
          speak();
        }}
        onDrop={(event) => event.preventDefault()}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
