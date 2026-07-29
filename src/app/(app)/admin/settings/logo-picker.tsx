"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, TrashIcon, UploadSimpleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { removeLogo, uploadLogo } from "./actions";

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
      setError("That image is very large. Try one under 8 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    // SVG is refused server-side (it is an executable document), so say so here
    // rather than letting the upload fail after the crop.
    if (file.type === "image/svg+xml") {
      setError("SVG is not supported. Export it as a PNG first.");
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
      setError("That file could not be read as an image.");
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
        setError(result.error ?? "Could not save that.");
        return;
      }
      toast({ tone: "ok", title: "Logo saved" });
      setSource(null);
      setPreview(null);
      router.refresh();
    });
  }

  const currentLogoUrl = logoPath ? `/api/files/${logoPath}` : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-[--radius-lg] border border-border bg-surface-muted">
          {preview ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={preview} alt="Your new logo, cropped" className="size-full object-cover" />
          ) : currentLogoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentLogoUrl}
              alt={`${schoolName} logo`}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-8 text-fg-subtle" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">
            {preview ? "Ready to save" : currentLogoUrl ? "Current logo" : "No logo yet"}
          </p>
          <p className="text-xs text-fg-muted">
            Square works best. We crop and resize to 512×512 before uploading.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={<UploadSimpleIcon weight="bold" />}
              onClick={() => fileRef.current?.click()}
            >
              {currentLogoUrl || preview ? "Choose another" : "Choose an image"}
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
                        ? { tone: "neutral", title: "Logo removed" }
                        : { tone: "danger", title: "Could not remove it", description: result.error },
                    );
                    router.refresh();
                  })
                }
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
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
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {/* ---- crop controls, only while something is picked ---- */}
      {source && (
        <div className="space-y-3 rounded-[--radius-md] border border-accent bg-accent-soft/40 p-4">
          <label className="block">
            <span className="block text-sm font-medium text-fg">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => void adjust({ zoom: Number(e.target.value) })}
              className="mt-1 w-full accent-[--accent]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm font-medium text-fg">Move sideways</span>
              <input
                type="range"
                min={-200}
                max={200}
                step={4}
                value={offsetX}
                onChange={(e) => void adjust({ x: Number(e.target.value) })}
                className="mt-1 w-full accent-[--accent]"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-fg">Move up and down</span>
              <input
                type="range"
                min={-200}
                max={200}
                step={4}
                value={offsetY}
                onChange={(e) => void adjust({ y: Number(e.target.value) })}
                className="mt-1 w-full accent-[--accent]"
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
              Cancel
            </Button>
            <Button size="sm" block loading={pending} onClick={save}>
              Save this logo
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
