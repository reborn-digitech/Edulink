"use client";

import {
  createContext,
  startTransition,
  useActionState,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { FORM_IDLE, type FormState } from "@/lib/form-state";
import { useT } from "@/lib/i18n";
import { useToast } from "./toast";

/**
 * A SERVER-ACTION FORM THAT KEEPS WHAT WAS TYPED (A3-journeys-27, 5 Oct 2026).
 *
 * The action is a server action `(previous, form) => FormState` built on
 * lib/form-action.ts `answerForm`. On a refusal nothing is reset: the submit
 * is taken over (so React does not clear the form after its action), every
 * box keeps its value, the kit field the refusal names (TextField,
 * SelectField, TextAreaField, DateField, by `name`) shows the sentence under
 * itself with role="alert" and aria-invalid, and gets the focus; a refusal
 * about no kit field sits by the button at the form's end. Done: a toast with
 * the sentence, the form starts clean (it is re-keyed on the count of times
 * it was done), and `reveal`, when the action gives one, is scrolled into view.
 *
 * Before the script loads the form still posts: React's action state carries
 * the refusal and the typed values into the page drawn afresh.
 */

type Registry = { claim: (name: string) => () => void; subscribe: (fn: () => void) => () => void; snapshot: () => string };

/** The names of the kit fields inside this form, so a refusal about one of them is not said twice. */
function createRegistry(): Registry {
  const counts = new Map<string, number>();
  const listeners = new Set<() => void>();
  let snap = "";
  const emit = () => {
    snap = [...counts.keys()].sort().join("\n");
    for (const fn of listeners) fn();
  };
  return {
    claim(name) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
      emit();
      return () => {
        const left = (counts.get(name) ?? 1) - 1;
        if (left > 0) counts.set(name, left);
        else counts.delete(name);
        emit();
      };
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    snapshot: () => snap,
  };
}

type Feedback = { state: FormState; registry: Registry };
const FeedbackContext = createContext<Feedback | null>(null);

/**
 * For the kit's fields: the refusal about this control (when the form's last
 * answer named it) and the value typed before it, outside an <ActionForm>
 * nothing at all.
 */
export function useFormFeedback(name: string | undefined): { error?: string; value?: string } {
  const feedback = useContext(FeedbackContext);
  const registry = feedback?.registry;
  useEffect(() => (registry && name ? registry.claim(name) : undefined), [registry, name]);
  if (!feedback || !name || feedback.state.ok) return {};
  const value = feedback.state.values?.[name];
  return feedback.state.field === name ? { error: feedback.state.message, value } : { value };
}

/** The form's last answer (idle, a refusal or a done), for a child that draws its own note of it; null outside an <ActionForm>. */
export function useFormAnswer(): FormState | null {
  return useContext(FeedbackContext)?.state ?? null;
}

export function ActionForm({
  action,
  children,
  className,
  intercept,
  ...rest
}: Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit" | "children"> & {
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  children: ReactNode;
  /** A submit the caller takes over before the action (the marks sheet queues the save offline): true, and nothing else happens. */
  intercept?: (event: FormEvent<HTMLFormElement>) => boolean;
}) {
  const t = useT();
  const { toast } = useToast();
  const [state, dispatch, pending] = useActionState(action, FORM_IDLE);
  const [registry] = useState(createRegistry);
  const claimed = useSyncExternalStore(registry.subscribe, registry.snapshot, () => "");
  const formRef = useRef<HTMLFormElement>(null);
  const feedback = useMemo(() => ({ state, registry }), [state, registry]);

  // After each answer: a refusal takes the person to the control it is about; a done says so.
  useEffect(() => {
    if (state.idle) return;
    if (state.ok) {
      if (state.message) toast({ tone: "ok", title: state.message });
      if (state.reveal) {
        const el = document.getElementById(state.reveal);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
        el?.focus({ preventScroll: true });
      }
      return;
    }
    const form = formRef.current;
    if (!form) return;
    const kit = form.querySelector<HTMLElement>('[aria-invalid="true"]:not([aria-hidden="true"])');
    if (kit) {
      kit.focus();
      return;
    }
    // A plain control (a mark in a grid): marked here, cleared on the next answer.
    const named = state.field ? form.elements.namedItem(state.field) : null;
    if (named instanceof HTMLElement) {
      named.setAttribute("aria-invalid", "true");
      named.focus();
      return () => named.removeAttribute("aria-invalid");
    }
  }, [state, toast]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (intercept?.(event)) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter ?? undefined);
    startTransition(() => dispatch(data));
  }

  const refused = !state.idle && !state.ok && state.message;
  const saidInline = Boolean(state.field && claimed.split("\n").includes(state.field));
  return (
    <FeedbackContext.Provider value={feedback}>
      <form key={state.n ?? 0} ref={formRef} action={dispatch} onSubmit={onSubmit} aria-busy={pending || undefined} className={className} {...rest}>
        {children}
        {pending ? (
          <p role="status" className="col-span-full basis-full text-sm text-fg-muted">
            {t("common.saving")}
          </p>
        ) : refused && !saidInline ? (
          <p role="alert" className="col-span-full basis-full flex items-start gap-2 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
            <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {state.message}
          </p>
        ) : null}
      </form>
    </FeedbackContext.Provider>
  );
}
