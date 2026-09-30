"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { KeyboardIcon } from "@phosphor-icons/react";
import { transliterateWord, wordAt, type TypingLanguage } from "@/lib/transliterate";
import { useT } from "@/lib/i18n";

/**
 * "EN · हिंदी · मराठी": what the keyboard writes, on every text of the app.
 * With Hindi or Marathi on, a word typed in English letters becomes
 * Devanagari the moment it ends, in whatever box it was typed in — a name
 * on the record, a circular, a certificate's paragraph, a message. What
 * the word will become is shown under the box while it is being typed.
 *
 * ONE SWITCH FOR THE PERSON, kept on the device. The owner asked for the
 * switch on each box; a box of its own would have needed every one of the
 * app's some hundred text fields to carry it, and the person typing Marathi
 * types Marathi into all of them. So there is one switch, and it is shown
 * beside whichever box has focus, labelled ("Typing: English"), and nowhere
 * else: in the menu it read as the app's language, which it is not (the
 * owner, 2026-10-01). A box that asks for a language of its own shows the
 * same chip, saying so, and it cannot be pressed.
 *
 * NOTHING LEAVES THE DEVICE. The conversion is a table (lib/transliterate.ts),
 * not a service.
 *
 * A BOX MAY ASK FOR A LANGUAGE OF ITS OWN, over the switch: a certificate's
 * paragraph set in a Devanagari face is typed in Devanagari and one set in
 * a Latin face in English, whatever the switch says, by a data-typing
 * attribute on the box (the owner, 2026-09-30).
 *
 * How a box is written to: an input or a textarea through its own value
 * setter and an input event, so a React-controlled field sees the change as
 * typing; an editable region (the certificate's chips) through the
 * selection and insertText, which is what typing into it does.
 */
const KEY = "edulink.typing";
const ENDS_A_WORD = /^[\s.,;:!?()"'\-\/]$/;
const LANGUAGES: TypingLanguage[] = ["en", "hi", "mr"];

function read(): TypingLanguage {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "hi" || v === "mr" ? v : "en";
  } catch {
    return "en";
  }
}

type Editable = HTMLInputElement | HTMLTextAreaElement | HTMLElement;
function editableOf(target: EventTarget | null): Editable | null {
  if (!(target instanceof HTMLElement)) return null;
  if (target instanceof HTMLInputElement) return ["text", "search", ""].includes(target.type) && !target.readOnly && !target.disabled ? target : null;
  if (target instanceof HTMLTextAreaElement) return !target.readOnly && !target.disabled ? target : null;
  return target.isContentEditable ? target : null;
}

/**
 * A box that asks for a language of its own (data-typing) gets it as its
 * DEFAULT, and the chip beside it still cycles — for that box alone, kept
 * while the page lives (the owner, 2026-10-01: "this should allow switching
 * languages by clicking here"). A plain box follows the switch.
 */
const overrides = new WeakMap<Element, TypingLanguage>();
function ownLanguage(el: Editable): TypingLanguage | null {
  const own = el.closest("[data-typing]")?.getAttribute("data-typing");
  return own === "en" || own === "hi" || own === "mr" ? own : null;
}
function languageOf(el: Editable, fallback: TypingLanguage): TypingLanguage {
  return overrides.get(el) ?? ownLanguage(el) ?? fallback;
}

/** The Latin word before the caret, in an input or a textarea. */
function pendingIn(el: HTMLInputElement | HTMLTextAreaElement): { word: string; start: number; end: number } | null {
  const caret = el.selectionStart;
  if (caret === null || caret !== el.selectionEnd) return null;
  const { start, end } = wordAt(el.value, caret);
  return end === caret && end > start ? { word: el.value.slice(start, end), start, end } : null;
}

function setValue(el: HTMLInputElement | HTMLTextAreaElement, next: string, caret: number) {
  const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, next);
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/** The Latin word before the caret in an editable region: within the one text node the caret is in. */
function pendingInRegion(): { word: string; node: Text; start: number; end: number } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const node = range.startContainer;
  if (!(node instanceof Text)) return null;
  const { start, end } = wordAt(node.textContent ?? "", range.startOffset);
  return end === range.startOffset && end > start ? { word: (node.textContent ?? "").slice(start, end), node, start, end } : null;
}

/**
 * ONE ENGINE FOR THE PAGE. The header mounts the switch twice, once for a
 * desk and once for a phone, one of them hidden; the language is a store
 * both read, and the listeners and the hint belong to whichever instance
 * mounted first, the hint drawn on the body so a hidden header cannot hide
 * it. Two engines once drew two hints.
 */
const store = { language: "en" as TypingLanguage, subscribers: new Set<() => void>() };
const subscribe = (fn: () => void) => {
  store.subscribers.add(fn);
  return () => store.subscribers.delete(fn);
};
function setLanguage(next: TypingLanguage) {
  store.language = next;
  store.subscribers.forEach((fn) => fn());
}
let engine: symbol | null = null;

export function TypingSwitch({ className }: { className?: string }) {
  const t = useT();
  const language = useSyncExternalStore(subscribe, () => store.language, () => "en" as TypingLanguage);
  const [hint, setHint] = useState<{ text: string; left: number; top: number } | null>(null);
  const [owner, setOwner] = useState(false);
  /** The box with focus: where the chip is drawn, and whether the box chooses its own language. */
  const [anchor, setAnchor] = useState<{ top: number; right: number; own: TypingLanguage | null; el: Editable } | null>(null);

  useEffect(() => {
    const me = Symbol("typing");
    if (engine) return;
    engine = me;
    // The saved choice is applied after the first paint: the server drew "en", and a hydration must match it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwner(true);
    setLanguage(read());
    const showHint = (el: Editable, word: string, language: TypingLanguage) => {
      const box = el.getBoundingClientRect();
      const becomes = transliterateWord(word, language);
      setHint(becomes === word ? null : { text: `${word} → ${becomes}`, left: box.left, top: box.bottom + 4 });
    };
    const onInput = (event: Event) => {
      const el = editableOf(event.target);
      if (!el) return setHint(null);
      const language = languageOf(el, store.language);
      if (language === "en") return setHint(null);
      const pending = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ? pendingIn(el) : pendingInRegion();
      if (pending) showHint(el, pending.word, language);
      else setHint(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
      if (!(event.key === "Enter" || ENDS_A_WORD.test(event.key))) return;
      const el = editableOf(event.target);
      if (!el) return;
      const language = languageOf(el, store.language);
      if (language === "en") return;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const pending = pendingIn(el);
        if (!pending) return;
        const becomes = transliterateWord(pending.word, language);
        if (becomes === pending.word) return;
        setValue(el, el.value.slice(0, pending.start) + becomes + el.value.slice(pending.end), pending.start + becomes.length);
      } else {
        const pending = pendingInRegion();
        if (!pending) return;
        const becomes = transliterateWord(pending.word, language);
        if (becomes === pending.word) return;
        const range = document.createRange();
        range.setStart(pending.node, pending.start);
        range.setEnd(pending.node, pending.end);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("insertText", false, becomes);
      }
      setHint(null);
    };
    const onBlur = () => setHint(null);
    // The chip sits above the box's top-right corner, or under it when the box is at the top of the window.
    const place = (el: Editable) => {
      const box = el.getBoundingClientRect();
      setAnchor({ top: box.top >= 40 ? box.top - 34 : box.bottom + 4, right: Math.max(8, window.innerWidth - box.right), own: ownLanguage(el), el });
    };
    const onFocusIn = (event: FocusEvent) => {
      const el = editableOf(event.target);
      if (el) place(el);
    };
    const onFocusOut = (event: FocusEvent) => {
      // Focus moving onto the chip itself keeps it; anywhere else lets it go.
      if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest("[data-typing-chip]")) return;
      setAnchor(null);
    };
    // The bubble is placed where the box was; a page scrolled under it would leave it stranded, so it goes until the
    // next keystroke. The chip follows the box instead: a click that scrolls a box into view must not lose it.
    let raf = 0;
    const onScroll = () => {
      setHint(null);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = editableOf(document.activeElement);
        if (el) place(el);
        else setAnchor(null);
      });
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const el = editableOf(event.target);
      if (el) place(el);
    };
    document.addEventListener("input", onInput, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onBlur, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onBlur, true);
      document.removeEventListener("focusout", onFocusOut, true);
      document.removeEventListener("scroll", onScroll, true);
      cancelAnimationFrame(raf);
      if (engine === me) engine = null;
    };
  }, []);

  const choose = (next: TypingLanguage) => {
    setLanguage(next);
    setHint(null);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* the choice lives for the page */
    }
  };
  // What the focused box types in: its own override, its typeface's language, or the switch's.
  const shown = anchor ? languageOf(anchor.el, language) : language;
  const label = { en: "EN", hi: "हिंदी", mr: "मराठी" }[shown];
  const cycle = () => {
    const next = LANGUAGES[(LANGUAGES.indexOf(shown) + 1) % LANGUAGES.length]!;
    if (anchor?.own) {
      // The box's own default is the typeface's; the press is this box's alone.
      overrides.set(anchor.el, next);
      setHint(null);
      setAnchor({ ...anchor });
    } else {
      choose(next);
    }
  };

  // Only the engine's own instance draws anything; a second mount (a test, a nested page) is the store alone.
  if (!owner) return null;
  return createPortal(
    <>
      <span
        data-typing-chip
        hidden={!anchor}
        style={anchor ? { top: anchor.top, right: anchor.right } : undefined}
        className="fixed z-50 inline-flex items-center rounded-full border border-border bg-surface shadow-md print:hidden"
      >
        <button
          type="button"
          // The box keeps its focus and its caret while the chip is pressed.
          onMouseDown={(event) => event.preventDefault()}
          onClick={cycle}
          aria-label={t("typing.switch", { language: t(`typing.${shown}`) })}
          title={anchor?.own ? t("typing.byFaceDefault", { language: t(`typing.${anchor.own}`) }) : t("typing.switchHint")}
          className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold text-fg-muted hover:bg-surface-muted ${shown !== "en" ? "text-accent-strong" : ""} ${className ?? ""}`}
          data-testid="typing-switch"
          // The switch's own choice; what the focused box types in, when that differs, is data-own.
          data-language={language}
          data-own={anchor && shown !== language ? shown : ""}
        >
          <KeyboardIcon className="size-4" aria-hidden="true" />
          <span aria-hidden="true">{t("typing.label", { language: label })}</span>
        </button>
      </span>
      {hint && (
        <span role="status" aria-live="polite" style={{ left: hint.left, top: hint.top }} className="pointer-events-none fixed z-50 rounded-[--radius-sm] border border-border bg-surface px-2 py-1 text-sm text-fg shadow-md" data-testid="typing-hint">
          {hint.text}
        </span>
      )}
    </>,
    document.body,
  );
}
