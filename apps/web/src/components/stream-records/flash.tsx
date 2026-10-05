import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * What a stream-records or duty page's form action came back with
 * (lib/module-actions.ts `runAction`): `?done=` or `?error=` naming a
 * dictionary key, said in the reader's language. Only keys of the namespaces
 * these pages' actions use are said; anything else in the address is ignored.
 */
const SAYABLE = /^(streamRecords|duties|access|common|academics|inventory|modules)(\.[A-Za-z0-9_]+){1,2}$/;

export function RecordsFlash({ t, params }: { t: Translate; params: Record<string, string | string[] | undefined> }) {
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

/** Where a form may send its reader back to: these pages only, never an address from outside. */
export function backPath(raw: string, fallback: string): string {
  const ok = /^\/(admin\/stream-records|faculty\/practicals|faculty\/moot-courts|hod\/practicals|duties\/[a-z-]+)(\/[a-z-]+)?(\?[A-Za-z0-9=&%-]*)?$/.test(raw);
  return ok ? raw : fallback;
}
