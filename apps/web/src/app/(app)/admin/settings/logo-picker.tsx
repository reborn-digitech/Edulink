"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ImageIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removeLogo, uploadLogo } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

const OUTPUT_SIZE = 512;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;

/**
 * Logo upload with a live square crop.
 *
 * The crop happens in the browser on a canvas, so what leaves the device is
 * already a 512×512 PNG. Three reasons: the preview is exactly what gets stored
 * (no surprise re-crop server-side), a 6 MB phone photo becomes ~200 KB before
 * it is uploaded at all, and the server never has to decode untrusted image data
 * to resize it.
 *
 * Position is adjustable because a centre crop cuts the top off a tall crest.
 */
export function LogoPicker({
  schoolName,
  logoPath,
}: {
  schoolName: string;
  logoPath: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /** Draws the current crop and returns it as a blob URL + blob. */
  function renderCrop(
    image: HTMLImageElement,
    scale: number,
    dx: number,
    dy: number,
  ): Promise<{ url: string; blob: Blob }> {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d")!;

    // White backing: a transparent PNG placed on a dark header would otherwise
    // disappear entirely.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Fit the shorter edge, then apply zoom and offset.
    const base = OUTPUT_SIZE / Math.min(image.width, image.height);
    const drawW = image.width * base * scale;
    const drawH = image.height * base * scale;
    context.drawImage(
      image,
      (OUTPUT_SIZE - drawW) / 2 + dx,
      (OUTPUT_SIZE - drawH) / 2 + dy,
      drawW,
      drawH,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const output = blob ?? new Blob();
        resolve({ url: URL.createObjectURL(output), blob: output });
      }, "image/png");
    });
  }

  async function pick(file: File) {
    setError(null);

    if (file.size > MAX_INPUT_BYTES) {
      setError(t("settings.tooLarge"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t("settings.notAnImage"));
      return;
    }
    // SVG is refused server-side (it is an executable document), so say so here
    // rather than letting the upload fail after the crop.
    if (file.type === "image/svg+xml") {
      setError(t("settings.noSvg"));
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = async () => {
      setSource(image);
      setZoom(1);
      setOffsetX(0);
      setOffsetY(0);
      const rendered = await renderCrop(image, 1, 0, 0);
      setPreview(rendered.url);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setError(t("settings.unreadable"));
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }

  async function adjust(next: { zoom?: number; x?: number; y?: number }) {
    const z = next.zoom ?? zoom;
    const x = next.x ?? offsetX;
    const y = next.y ?? offsetY;
    setZoom(z);
    setOffsetX(x);
    setOffsetY(y);
    if (source) {
      const rendered = await renderCrop(source, z, x, y);
      setPreview(rendered.url);
    }
  }

  function save() {
    if (!source) return;
    startTransition(async () => {
      const rendered = await renderCrop(source, zoom, offsetX, offsetY);
      const formData = new FormData();
      formData.append("logo", new File([rendered.blob], "logo.png", { type: "image/png" }));

      const result = await uploadLogo(formData);
      if (!result.ok) {
        setError(actionError(t, result, "settings.couldNotSaveLogo"));
        return;
      }
      toast({ tone: "ok", title: t("settings.logoSaved") });
      setSource(null);
      setPreview(null);
      router.refresh();
    });
  }

  const currentLogoUrl = logoPath ? `/api/files/${logoPath}` : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface-muted">
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt={t("settings.newLogoAlt")} className="size-full object-cover" />
          ) : currentLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentLogoUrl}
              alt={t("settings.schoolLogoAlt", { name: schoolName })}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-8 text-fg-subtle" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">
            {preview
              ? t("settings.readyToSave")
              : currentLogoUrl
                ? t("settings.currentLogo")
                : t("settings.noLogoYet")}
          </p>
          <p className="text-xs text-fg-muted">{t("settings.squareBest")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<UploadSimpleIcon weight="bold" />}
              onClick={() => fileRef.current?.click()}
            >
              {currentLogoUrl || preview ? t("settings.chooseAnother") : t("settings.chooseImage")}
            </Button>
            {currentLogoUrl && !preview && (
              <Button
                size="sm"
                variant="ghost"
                className="text-danger hover:bg-danger-soft"
                disabled={pending}
                icon={<TrashIcon weight="bold" />}
                onClick={() =>
                  startTransition(async () => {
                    const result = await removeLogo();
                    toast(
                      result.ok
                        ? { tone: "neutral", title: t("settings.logoRemoved") }
                        : {
                            tone: "danger",
                            title: t("settings.couldNotRemoveLogo"),
                            description: actionError(t, result),
                          },
                    );
                    router.refresh();
                  })
                }
              >
                {t("common.remove")}
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          aria-label={t("audit.schoolLogoUpdate")}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void pick(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {/* ---- crop controls, only while something is picked ---- */}
      {source && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-accent bg-accent-soft/40 p-4">
          <label className="block">
            <span className="block text-sm font-medium text-fg">{t("settings.zoom")}</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => void adjust({ zoom: Number(e.target.value) })}
              className="mt-1 w-full accent-[var(--accent)]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm font-medium text-fg">{t("settings.moveSideways")}</span>
              <input
                type="range"
                min={-200}
                max={200}
                step={4}
                value={offsetX}
                onChange={(e) => void adjust({ x: Number(e.target.value) })}
                className="mt-1 w-full accent-[var(--accent)]"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-fg">{t("settings.moveUpDown")}</span>
              <input
                type="range"
                min={-200}
                max={200}
                step={4}
                value={offsetY}
                onChange={(e) => void adjust({ y: Number(e.target.value) })}
                className="mt-1 w-full accent-[var(--accent)]"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              block
              onClick={() => {
                setSource(null);
                setPreview(null);
                setError(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button size="sm" block loading={pending} onClick={save}>
              {t("settings.saveThisLogo")}
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
