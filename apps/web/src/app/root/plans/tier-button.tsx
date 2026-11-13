"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { addCollegeTierAction } from "../colleges/actions";

/** Puts a college tier on the plan list, once: a plan whose code is the tier's (4 Oct 2026). */
export function AddTierButton({ code }: { code: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="secondary"
        icon={<PlusIcon weight="bold" />}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await addCollegeTierAction(code);
            if (!result.ok) {
              setError(result.error ?? t("root.didNotWork"));
              return;
            }
            toast({ tone: "ok", title: t("operatorCollege.tierAdded") });
            router.refresh();
          })
        }
      >
        {t("operatorCollege.tierAdd")}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
