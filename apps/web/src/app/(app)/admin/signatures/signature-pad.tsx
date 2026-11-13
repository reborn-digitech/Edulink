"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { EraserIcon, FloppyDiskIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { removeSignatureAction, saveSignatureAction } from "./actions";

/**
 * A signature signed in a box, or a picture of one; and the seal, which is
 * only ever a picture. Whatever goes in, what LEAVES THE DEVICE is a small
 * PNG drawn here on a canvas of a fixed size: the server is never asked to
 * decode a photograph, and what the office sees in the box is what is kept.
 *
 * WHITE IS TAKEN OUT of an uploaded picture. A signature photographed on
 * paper arrives as ink on a white rectangle, and would be printed as a white
 * rectangle across the line it signs; everything near white is made clear,
 * so the ink alone is drawn. The box is white in both themes, because the
 * paper is.
 */
const INK = "#1a1a2e";
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

export function SignaturePad({ which, current }: { which: "mine" | "seal"; current: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const canvas = useRef<HTMLCanvasElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const drawing = useRef<{ x: number; y: number } | null>(null);
  const [inked, setInked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seal = which === "seal";
  const size = seal ? { width: 400, height: 400 } : { width: 600, height: 200 };
  const words: Record<"title" | "none" | "current" | "save" | "saved" | "removed", TranslationKey> = seal
    ? { title: "signatures.sealTitle", none: "signatures.sealNone", current: "signatures.sealCurrent", save: "signatures.sealSave", saved: "signatures.sealSaved", removed: "signatures.sealRemoved" }
    : { title: "signatures.mineTitle", none: "signatures.none", current: "signatures.current", save: "signatures.save", saved: "signatures.saved", removed: "signatures.removed" };

  const context = () => canvas.current?.getContext("2d") ?? null;
  const clear = () => {
    context()?.clearRect(0, 0, size.width, size.height);
    setInked(false);
    setError(null);
  };
  /** Where on the canvas a pointer is: the canvas is drawn narrower than it is on a phone. */
  const at = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - box.left) / box.width) * size.width, y: ((event.clientY - box.top) / box.height) * size.height };
  };

  // Lifting the pen outside the box ends the stroke all the same.
  useEffect(() => {
    const end = () => {
      drawing.current = null;
    };
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, []);

  function take(picked: File | undefined) {
    setError(null);
    if (!picked) return;
    if (!/^image\/(png|jpeg)$/.test(picked.type)) return setError(t("signatures.mustBeImage"));
    if (picked.size > MAX_INPUT_BYTES) return setError(t("signatures.tooLarge", { kb: Math.round(MAX_INPUT_BYTES / 1024) }));
    const url = URL.createObjectURL(picked);
    const image = new Image();
    image.onload = () => {
      const c = context();
      if (!c) return;
      c.clearRect(0, 0, size.width, size.height);
      const scale = Math.min(size.width / image.width, size.height / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      c.drawImage(image, (size.width - w) / 2, (size.height - h) / 2, w, h);
      // The paper it was signed on is taken out; the ink stays.
      const data = c.getImageData(0, 0, size.width, size.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const light = Math.min(data.data[i]!, data.data[i + 1]!, data.data[i + 2]!);
        if (light > 235) data.data[i + 3] = 0;
        else if (light > 200) data.data[i + 3] = Math.round((data.data[i + 3]! * (235 - light)) / 35);
      }
      c.putImageData(data, 0, 0);
      URL.revokeObjectURL(url);
      setInked(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      setError(t("signatures.mustBeImage"));
    };
    image.src = url;
  }

  function save() {
    setError(null);
    if (!inked || !canvas.current) return setError(t(seal ? "signatures.mustBeImage" : "signatures.drawSomething"));
    const image = canvas.current.toDataURL("image/png");
    startTransition(async () => {
      const result = await saveSignatureAction(which, image);
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t(words.saved) });
      clear();
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeSignatureAction(which);
      if (!result.ok) return setError(actionError(t, result, "common.tryAgain"));
      toast({ tone: "ok", title: t(words.removed) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4" data-testid={`signature-${which}`}>
      <div className="flex flex-wrap items-center gap-3">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element -- a picture kept in the row, handed over as a data URL
          <img src={current} alt={t(words.current)} className={`rounded-[var(--radius-md)] border border-border bg-white object-contain p-2 ${seal ? "size-28" : "h-20 w-60"}`} data-testid={`signature-${which}-current`} />
        ) : (
          <p className="text-sm text-fg-muted" data-testid={`signature-${which}-none`}>
            {t(words.none)}
          </p>
        )}
        {current && (
          <Button type="button" variant="secondary" size="sm" loading={pending} icon={<TrashIcon weight="bold" />} onClick={remove} data-testid={`signature-${which}-remove`}>
            {t("signatures.remove")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {!seal && <p className="text-xs text-fg-muted">{t("signatures.drawHint")}</p>}
        <canvas
          ref={canvas}
          width={size.width}
          height={size.height}
          role="img"
          aria-label={t(seal ? "signatures.sealTitle" : "signatures.drawBox")}
          className={`w-full touch-none rounded-[var(--radius-md)] border border-dashed border-border-strong bg-white ${seal ? "max-w-[14rem] cursor-default" : "max-w-[30rem] cursor-crosshair"}`}
          style={{ aspectRatio: `${size.width} / ${size.height}` }}
          onPointerDown={(event) => {
            if (seal) return;
            event.preventDefault();
            drawing.current = at(event);
          }}
          onPointerMove={(event) => {
            const from = drawing.current;
            const c = context();
            if (!from || !c) return;
            const to = at(event);
            c.strokeStyle = INK;
            c.lineWidth = 3;
            c.lineCap = "round";
            c.lineJoin = "round";
            c.beginPath();
            c.moveTo(from.x, from.y);
            c.lineTo(to.x, to.y);
            c.stroke();
            drawing.current = to;
            if (!inked) setInked(true);
          }}
          data-testid={`signature-${which}-pad`}
        />
        <input ref={file} type="file" accept="image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => take(event.target.files?.[0])} data-testid={`signature-${which}-file`} />
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" icon={<UploadSimpleIcon weight="bold" />} onClick={() => file.current?.click()}>
            {t("signatures.upload")}
          </Button>
          <Button type="button" variant="secondary" size="sm" icon={<EraserIcon weight="bold" />} onClick={clear} disabled={!inked}>
            {t("signatures.clear")}
          </Button>
          <Button type="button" size="sm" loading={pending} icon={<FloppyDiskIcon weight="bold" />} onClick={save} disabled={!inked} data-testid={`signature-${which}-save`}>
            {t(words.save)}
          </Button>
        </div>
      </div>
    </div>
  );
}
