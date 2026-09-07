"use client";

import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckSquareIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { deleteSchoolsAction, removeSchoolsAction } from "./actions";

/**
 * Several schools, one press — the same two doors the single-school page
 * has, worn by the list. A checkbox on every live card, a bar that appears
 * once anything is ticked, and a dialog that names every school going
 * through before the press: removal (reversible) confirms on the count;
 * erasure (the shredder) asks for "DELETE n" typed, which the lib checks
 * again on the server.
 */
type Selection = {
  ids: Set<string>;
  toggle: (id: string) => void;
};
const SelectionContext = createContext<Selection | null>(null);

export function BulkSelectProvider({
  schools,
  children,
}: {
  schools: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"remove" | "delete" | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const value = useMemo<Selection>(
    () => ({
      ids,
      toggle: (id) =>
        setIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
    }),
    [ids],
  );

  const chosen = schools.filter((s) => ids.has(s.id));
  const phrase = `DELETE ${chosen.length}`;
  const canConfirm = mode === "remove" ? typed.trim() === String(chosen.length) : typed.trim().toUpperCase() === phrase;

  function close() {
    setMode(null);
    setTyped("");
  }

  function run() {
    if (!mode || chosen.length === 0) return;
    startTransition(async () => {
      const list = chosen.map((s) => s.id);
      const result = mode === "remove" ? await removeSchoolsAction(list) : await deleteSchoolsAction(list, typed);
      if (result.error) {
        toast({ tone: "danger", title: t("root.didNotWork"), description: result.error });
        return;
      }
      toast({
        tone: result.failed.length === 0 ? "ok" : "warn",
        title: mode === "remove" ? t("root.bulkRemoved", { count: result.done }) : t("root.bulkDeleted", { count: result.done }),
        description: result.failed.length > 0 ? result.failed.join(" · ") : undefined,
      });
      setIds(new Set());
      close();
      router.refresh();
    });
  }

  return (
    <SelectionContext.Provider value={value}>
      {children}

      {chosen.length > 0 && (
        <div
          role="region"
          aria-label={t("root.selectedCount", { count: chosen.length })}
          className="sticky bottom-20 z-30 flex flex-wrap items-center gap-2 rounded-[--radius-lg] border border-border bg-surface p-3 shadow-lg lg:bottom-4"
        >
          <span className="flex items-center gap-1.5 text-sm font-semibold text-fg">
            <CheckSquareIcon weight="fill" className="size-5 text-accent" />
            {t("root.selectedCount", { count: chosen.length })}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIds(new Set())} icon={<XIcon weight="bold" />}>
              {t("common.clearAll")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMode("remove")}>
              {t("root.removeSelected")}
            </Button>
            <Button size="sm" variant="danger" onClick={() => setMode("delete")} icon={<TrashIcon weight="bold" />}>
              {t("root.deleteSelected")}
            </Button>
          </div>
        </div>
      )}

      {mode && (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4" onClick={close}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[--radius-lg] border border-border bg-surface p-5 shadow-lg animate-pop"
          >
            <h2 id="bulk-title" className="text-lg font-bold text-fg">
              {mode === "remove" ? t("root.bulkRemoveTitle", { count: chosen.length }) : t("root.bulkDeleteTitle", { count: chosen.length })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {mode === "remove" ? t("root.bulkRemoveBody") : t("root.bulkDeleteBody")}
            </p>
            <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-[--radius-md] bg-surface-muted p-3 text-sm">
              {chosen.map((s) => (
                <li key={s.id} className="truncate font-medium text-fg">
                  {s.name}
                </li>
              ))}
            </ul>
            <label className="mt-4 block text-sm">
              <span className="font-medium text-fg">
                {t("root.typeToConfirm", { phrase: mode === "remove" ? String(chosen.length) : phrase })}
              </span>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoFocus
                autoComplete="off"
                className="mt-1.5 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
              />
            </label>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" block onClick={close}>
                {t("common.cancel")}
              </Button>
              <Button variant="danger" block loading={pending} disabled={!canConfirm} onClick={run}>
                {mode === "remove" ? t("root.removeSelected") : t("root.deleteSelected")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SelectionContext.Provider>
  );
}

/** The checkbox on one card. */
export function SelectSchool({ id, name }: { id: string; name: string }) {
  const t = useT();
  const selection = useContext(SelectionContext);
  if (!selection) return null;
  const on = selection.ids.has(id);
  return (
    <label className="grid size-11 shrink-0 place-items-center" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={on}
        onChange={() => selection.toggle(id)}
        aria-label={t("root.selectSchool", { name })}
        className="size-5 accent-accent"
      />
    </label>
  );
}
