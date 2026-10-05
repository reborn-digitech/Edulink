"use client";

import { useActionState, type ReactNode } from "react";
import { KeyIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { PUNCH_HEADERS } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { KEY_FORM_IDLE, type KeyFormState } from "./key-state";

/**
 * A FORM WHOSE ANSWER IS A DEVICE KEY (R-2, 5 Oct 2026): registering a device
 * or rotating its key. The key is drawn once, here, from the action's answer
 * — it is in no address, no toast and no log — with the endpoint and the
 * three headers the device sends. Reloading the page loses it, by design: a
 * lost key is rotated, never read back.
 */
export function KeyForm({ action, children, submitLabel, className }: { action: (previous: KeyFormState, form: FormData) => Promise<KeyFormState>; children?: ReactNode; submitLabel: string; className?: string }) {
  const t = useT();
  const [state, dispatch, pending] = useActionState(action, KEY_FORM_IDLE);
  return (
    <div className="space-y-3">
      <form action={dispatch} className={className} aria-busy={pending || undefined}>
        {children}
        <Button type="submit" variant="secondary" disabled={pending}>
          {submitLabel}
        </Button>
      </form>
      {!state.idle && !state.ok && state.message ? (
        <p role="alert" className="flex items-start gap-2 text-sm font-medium text-danger">
          <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}
      {state.ok && state.key ? (
        <div role="status" className="space-y-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <KeyIcon weight="duotone" className="size-5" aria-hidden />
            {t("punch.keyShownOnce", { name: state.deviceName ?? "" })}
          </p>
          <dl className="grid gap-1 break-all font-mono text-xs">
            <dt className="font-sans text-fg-muted">{t("punch.keyLabel")}</dt>
            <dd>{state.key}</dd>
            <dt className="font-sans text-fg-muted">{t("punch.endpointLabel")}</dt>
            <dd>{state.endpoint}</dd>
            <dt className="font-sans text-fg-muted">{t("punch.headersLabel")}</dt>
            <dd>
              {PUNCH_HEADERS.device}: {state.deviceId} · {PUNCH_HEADERS.timestamp} · {PUNCH_HEADERS.signature}
            </dd>
          </dl>
        </div>
      ) : null}
    </div>
  );
}
