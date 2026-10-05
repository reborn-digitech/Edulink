import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * What a module page's form action came back with (lib/module-actions.ts):
 * `?done=` or `?error=` naming a dictionary key, said here in the reader's
 * language. Only keys of the namespaces the actions use are said; anything
 * else in the address is ignored rather than echoed.
 */
const SAYABLE = /^(inventory|payroll|access|common|modules|academics|streamRecords)\.[A-Za-z0-9]+$/;

export function ModuleFlash({ t, params }: { t: Translate; params: Record<string, string | string[] | undefined> }) {
  const one = (k: string) => (typeof params[k] === "string" ? (params[k] as string) : undefined);
  const vars: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (k.startsWith("v_") && typeof v === "string") vars[k.slice(2)] = v;
  const error = one("error");
  const done = one("done");
  if (error && SAYABLE.test(error)) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
        <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t(error as TranslationKey, vars)}
      </p>
    );
  }
  if (done && SAYABLE.test(done)) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-ok/30 bg-ok-soft px-3 py-2 text-sm font-medium text-ok">
        <CheckCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t(done as TranslationKey, vars)}
      </p>
    );
  }
  return null;
}

/** Table cell classes shared by the module pages. */
export const TH = "py-2 pr-3 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted";
export const TD = "py-2 pr-3 align-top";
export const NUM = "py-2 pr-3 text-right tabular-nums align-top";
export const LINK = "font-medium text-accent-strong underline underline-offset-2 hover:text-accent";
