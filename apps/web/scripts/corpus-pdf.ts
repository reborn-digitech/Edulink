/**
 * PDF to text runs and figures, page by page, for the corpus ingest (docs/plans/assistant.md, Phase A).
 *
 * pdfjs-dist (legacy build, plain Node): the text layer as RUNS — the items of one line
 * that sit close together, so a margin note at the same height as the body text stays a separate
 * run instead of being glued into the sentence beside it — each with its font size and position;
 * and the embedded images above a size floor, with where they sit on the page, for the figures.
 *
 * A page with no text layer is read by OCR: a scan from its largest image, a page of words drawn as
 * outlines rendered first (pdfjs with its Node canvas). tesseract.js, loaded
 * only when such a page turns up, with the language data from the @tesseract.js-data packages on
 * disk (never fetched at run time). English, Hindi and Marathi.
 */
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";

// Scripts run as CommonJS under tsx, where import.meta is empty; they always run from apps/web.
const require = createRequire(resolve("package.json"));
const PDFJS_DIR = dirname(require.resolve("pdfjs-dist/package.json"));

export type Run = { text: string; x: number; y: number; width: number; size: number; bold: boolean };
export type PageImage = { width: number; height: number; kind: number; data: Uint8Array | Uint8ClampedArray; x: number; y: number; w: number; h: number };
export type PageContent = { page: number; width: number; height: number; runs: Run[]; images: PageImage[]; ocr: boolean };

/** Images smaller than this (in source pixels) are rules, bullets and logos, not figures. */
export const FIGURE_MIN_SIDE = 150;
export const FIGURE_MIN_AREA = 180 * 180;
/** …and drawn at least this big on the page, in points: an icon is often a large bitmap shown small. */
export const FIGURE_MIN_SHOWN_SIDE = 60;
export const FIGURE_MIN_SHOWN_AREA = 9000;

type Matrix = [number, number, number, number, number, number];
type TextItemLike = { str: string; transform: Matrix; width: number; fontName: string; hasEOL?: boolean };

function multiply(m: Matrix, n: Matrix): Matrix {
  return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
}

/** Items on one baseline joined while the gap between them is under about one character's width: a column gutter is wider. */
function runsFromItems(items: TextItemLike[], styles: Record<string, { fontFamily?: string }>, keepShort = false): Run[] {
  const lines = new Map<number, TextItemLike[]>();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const y = Math.round(it.transform[5] * 2) / 2;
    const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 1.5) ?? y;
    const list = lines.get(key) ?? [];
    list.push(it);
    lines.set(key, list);
  }
  const runs: Run[] = [];
  for (const [y, list] of lines) {
    list.sort((a, b) => a.transform[4] - b.transform[4]);
    let current: Run | null = null;
    let previous: TextItemLike | null = null;
    for (const it of list) {
      // Text painted twice (a fill and an outline) arrives as two identical items at one place.
      if (previous && previous.str === it.str && Math.abs(previous.transform[4] - it.transform[4]) < 2) continue;
      previous = it;
      const size = Math.round(Math.hypot(it.transform[2], it.transform[3]) * 10) / 10 || 10;
      const x = it.transform[4];
      const bold = /bold|black|heavy|semibold/i.test(it.fontName) || /bold/i.test(styles[it.fontName]?.fontFamily ?? "");
      // Joined only at the same size: a margin note set a point smaller beside the body is its own run.
      if (current && x - (current.x + current.width) < Math.max(current.size, size) * 0.9 && Math.abs(current.size - size) <= Math.max(0.6, size * 0.06)) {
        const gap = x - (current.x + current.width);
        const needsSpace = gap > size * 0.15 && !/\s$/.test(current.text) && !/^\s/.test(it.str);
        current.text += (needsSpace ? " " : "") + it.str;
        current.width = Math.max(current.width, x + it.width - current.x);
        current.size = Math.max(current.size, size);
        current.bold = current.bold && bold;
      } else {
        if (current) runs.push(current);
        current = { text: it.str, x, y, width: it.width, size, bold };
      }
    }
    if (current) runs.push(current);
  }
  // NUL and the other control characters some fonts map glyphs to: Postgres refuses NUL in text.
  for (const r of runs) r.text = r.text.replace(/[\u0000-\u001F\u007F\uFFFD]/g, " ").replace(/\s+/g, " ").trim();
  // One or two characters alone are icon glyphs, bullets and stray sub- and superscripts; a past
  // paper keeps them (`keepShortRuns`), since its question numbers ("7", "Q7") are exactly that.
  return runs.filter((r) => r.text.length > (keepShort ? 0 : 2)).sort((a, b) => b.y - a.y || a.x - b.x);
}

type ImageObject = { width: number; height: number; kind: number; data?: Uint8Array | Uint8ClampedArray };

function objectOf(page: { objs: { get: (id: string, cb: (o: unknown) => void) => void }; commonObjs: { get: (id: string, cb: (o: unknown) => void) => void } }, name: string): Promise<ImageObject | null> {
  const store = name.startsWith("g_") ? page.commonObjs : page.objs;
  return Promise.race([
    new Promise<ImageObject | null>((resolve) => {
      try {
        store.get(name, (o) => resolve((o as ImageObject) ?? null));
      } catch {
        resolve(null);
      }
    }),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 5000)),
  ]);
}

/** Walks the operator list keeping the transform stack, so each painted image has a place on the page. */
async function imagesOf(page: Parameters<typeof objectOf>[0] & { getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }> }, wantAll: boolean): Promise<PageImage[]> {
  const ops = await page.getOperatorList();
  const out: PageImage[] = [];
  const stack: Matrix[] = [];
  let ctm: Matrix = [1, 0, 0, 1, 0, 0];
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    const args = ops.argsArray[i] ?? [];
    if (fn === OPS.save) stack.push(ctm);
    else if (fn === OPS.restore) ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0];
    else if (fn === OPS.transform) ctm = multiply(ctm, args as Matrix);
    else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
      const w = Math.hypot(ctm[0], ctm[1]);
      const h = Math.hypot(ctm[2], ctm[3]);
      const obj = fn === OPS.paintImageXObject ? await objectOf(page, args[0] as string) : (args[0] as ImageObject);
      if (!obj || !obj.data || !obj.width || !obj.height) continue;
      const big = obj.width >= FIGURE_MIN_SIDE && obj.height >= FIGURE_MIN_SIDE && obj.width * obj.height >= FIGURE_MIN_AREA && Math.min(w, h) >= FIGURE_MIN_SHOWN_SIDE && w * h >= FIGURE_MIN_SHOWN_AREA;
      if (!big && !wantAll) continue;
      out.push({ width: obj.width, height: obj.height, kind: obj.kind, data: obj.data, x: ctm[4], y: ctm[5], w, h });
    }
  }
  return out;
}

/** Reads the words off a page picture (PNG bytes). */
export type OcrReader = (png: Buffer, langs: string) => Promise<string>;

let ocrWorker: { recognize: (img: Buffer) => Promise<{ data: { text: string } }>; terminate: () => Promise<unknown> } | null = null;
let ocrLangs = "";

/** tesseract.js, loaded the first time a scanned page needs it, with the language data on disk. */
export const tesseractOcr: OcrReader = async (png, langs) => {
  if (!ocrWorker || ocrLangs !== langs) {
    if (ocrWorker) await ocrWorker.terminate();
    const { createWorker } = await import("tesseract.js");
    // tesseract.js reads <langPath>/<lang>.traineddata.gz; the data packages keep each language in
    // its own folder, so the ones asked for are copied once into one folder under storage/models.
    const langDir = join(process.cwd(), "storage", "models", "tesseract", "lang");
    mkdirSync(langDir, { recursive: true });
    for (const lang of langs.split("+")) {
      const target = join(langDir, `${lang}.traineddata.gz`);
      if (!existsSync(target)) copyFileSync(join(dirname(require.resolve(`@tesseract.js-data/${lang}/package.json`)), "4.0.0_best_int", `${lang}.traineddata.gz`), target);
    }
    ocrWorker = (await createWorker(langs.split("+"), 1, {
      langPath: langDir,
      cachePath: join(process.cwd(), "storage", "models", "tesseract", "cache"),
      gzip: true,
    })) as unknown as typeof ocrWorker;
    ocrLangs = langs;
  }
  const result = await ocrWorker!.recognize(png);
  return result.data.text;
};

export async function closeOcr() {
  if (ocrWorker) await ocrWorker.terminate();
  ocrWorker = null;
}

/** RGBA, RGB or 1-bit grey from pdfjs to PNG bytes, the long side capped. */
export async function toPng(image: PageImage, maxSide = 1400): Promise<Buffer> {
  const { width, height, kind, data } = image;
  let channels: 1 | 3 | 4;
  let raw: Buffer;
  if (kind === 3) {
    channels = 4;
    raw = Buffer.from(data.buffer, data.byteOffset, width * height * 4);
  } else if (kind === 2) {
    channels = 3;
    raw = Buffer.from(data.buffer, data.byteOffset, width * height * 3);
  } else {
    // GRAYSCALE_1BPP: one bit a pixel, rows padded to a byte.
    channels = 1;
    const rowBytes = (width + 7) >> 3;
    raw = Buffer.alloc(width * height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const bit = ((data[y * rowBytes + (x >> 3)] ?? 0) >> (7 - (x & 7))) & 1;
        raw[y * width + x] = bit ? 255 : 0;
      }
    }
  }
  let pipeline = sharp(raw, { raw: { width, height, channels } });
  if (Math.max(width, height) > maxSide) pipeline = pipeline.resize({ width: width >= height ? maxSide : undefined, height: height > width ? maxSide : undefined, fit: "inside" });
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
}

/** How many paths a page draws: hundreds with no text layer means words drawn as outlines. */
async function pathCount(page: { getOperatorList: () => Promise<{ fnArray: number[] }> }): Promise<number> {
  const ops = await page.getOperatorList();
  return ops.fnArray.filter((f) => f === OPS.constructPath).length;
}

type Renderable = { getViewport: (o: { scale: number }) => { width: number; height: number }; render: (o: Record<string, unknown>) => { promise: Promise<void> } };
type CanvasFactory = { create: (w: number, h: number) => { canvas: { toBuffer: (type: string) => Buffer }; context: unknown } };

/** The page at twice its size, white behind, as PNG, through the canvas pdfjs brings for Node. */
async function renderPage(doc: unknown, page: unknown): Promise<Buffer> {
  const p = page as Renderable;
  const viewport = p.getViewport({ scale: 2 });
  const factory = (doc as { canvasFactory: CanvasFactory }).canvasFactory;
  const { canvas, context } = factory.create(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = context as { fillStyle: string; fillRect: (x: number, y: number, w: number, h: number) => void };
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, Math.ceil(viewport.width), Math.ceil(viewport.height));
  await p.render({ canvasContext: context, viewport, canvas }).promise;
  return canvas.toBuffer("image/png");
}

export type ExtractOptions = {
  /** Read embedded images (figures); off for a text-only re-run. */
  figures: boolean;
  /** Tesseract languages for a page without a text layer ("eng", "eng+hin", "mar+eng"); null skips OCR. */
  ocrLangs: string | null;
  ocr?: OcrReader;
  /** Keep one- and two-character runs (a past paper's question numbers and option letters). Off for the books. */
  keepShortRuns?: boolean;
  /**
   * Read every picture on a page by OCR as well as its text layer, the words placed where the picture
   * sits (with `ocrLangs`). For a paper whose questions are pictures beside a text layer of labels
   * (JEE (Main) as NTA publishes it, 10 Oct 2026). Off for the books.
   */
  ocrPictures?: boolean;
  /** A scanned page set in two columns (NEET (UG) 2020 as NTA publishes it): its left half is read, then its right. */
  ocrHalves?: boolean;
  /**
   * A page with no text layer and no page-sized picture is rendered and read whatever it draws, and a
   * landscape page (two pages side by side, JEE (Advanced) 2015) half by half. Off for the books.
   */
  ocrRenderAll?: boolean;
  /**
   * A page whose text layer is garbled (a font with no Unicode map: old HBCSE papers print
   * "! #"%$!& ')(+*-," for words) is read as if it had none (`garbledShare`). Off for the books.
   */
  ocrGarbled?: boolean;
};

/**
 * The share of a page's characters that are Latin-1 accents and symbols or ASCII punctuation a sentence
 * rarely uses: about 0.02 on a clean English page, above 0.3 on a page set in a font with no Unicode map.
 * A mathematical italic letter (U+1D400 on) is not counted. Pure.
 */
export function garbledShare(texts: string[]): number {
  const all = texts.join("").replace(/\s+/g, "");
  if (!all.length) return 0;
  const odd = (all.match(/[\u00A0-\u00FF!#$%&*<>@[\\\]^_`{|}~]/g) ?? []).length;
  return odd / all.length;
}

export async function extractPdf(bytes: Uint8Array, opts: ExtractOptions): Promise<{ pages: PageContent[]; title: string | null }> {
  const doc = await getDocument({
    data: bytes,
    disableFontFace: true,
    useSystemFonts: false,
    isOffscreenCanvasSupported: false,
    isImageDecoderSupported: false,
    cMapUrl: join(PDFJS_DIR, "cmaps") + "/",
    cMapPacked: true,
    standardFontDataUrl: join(PDFJS_DIR, "standard_fonts") + "/",
    wasmUrl: join(PDFJS_DIR, "wasm") + "/",
    verbosity: 0,
  }).promise;
  const pages: PageContent[] = [];
  let title: string | null = null;
  try {
    const meta = await doc.getMetadata().catch(() => null);
    const info = meta?.info as { Title?: string } | undefined;
    title = info?.Title?.trim() || null;
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const [x0 = 0, y0 = 0, x1 = 612, y1 = 792] = page.view;
      const width = x1 - x0;
      const height = y1 - y0;
      const content = await page.getTextContent();
      let runs = runsFromItems(content.items.filter((i) => "str" in i) as unknown as TextItemLike[], content.styles as Record<string, { fontFamily?: string }>, opts.keepShortRuns);
      const textChars = runs.reduce((n, r) => n + r.text.length, 0);
      const garbled = !!opts.ocrGarbled && textChars >= 25 && garbledShare(runs.map((r) => r.text)) > 0.15;
      const scanned = textChars < 25 || garbled;
      let images: PageImage[] = [];
      if (opts.figures || (scanned && opts.ocrLangs)) {
        images = await imagesOf(page as unknown as Parameters<typeof imagesOf>[0], false).catch(() => []);
      }
      let ocr = false;
      // A scan is a page covered by one picture; a cover or a full-page photograph with no words is
      // read too (its title is text), but a page of small pictures is not a scan.
      const biggest = images.length ? images.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b)) : null;
      // A page whose words are drawn as outlines (NCERT's trilingual dictionaries) has neither a text
      // layer nor a picture of the page: it is rendered (pdfjs's own canvas) and read the same way.
      const scan = biggest && biggest.w * biggest.h >= width * height * 0.5 ? biggest : null;
      if (scanned && opts.ocrLangs) {
        const read = (png: Buffer | null) => (png ? (opts.ocr ?? tesseractOcr)(png, opts.ocrLangs!).catch(() => "") : Promise.resolve(""));
        let text = "";
        if (scan && opts.ocrHalves) {
          // Two columns read as one would interleave their lines: each half is read on its own.
          const png = await toPng(scan, 3000);
          const meta = await sharp(png).metadata();
          const w = meta.width ?? 0;
          const h = meta.height ?? 0;
          if (w > 2 && h > 0) {
            const half = Math.floor(w / 2);
            const left = await sharp(png).extract({ left: 0, top: 0, width: half, height: h }).png().toBuffer();
            const right = await sharp(png).extract({ left: half, top: 0, width: w - half, height: h }).png().toBuffer();
            text = `${await read(left)}\n${await read(right)}`;
          }
        } else if (scan) text = await read(await toPng(scan, 3000));
        // A full-page picture that reads as nothing is a background or a watermark, not a scan: the
        // words, if the page draws hundreds of paths, are outlines, and the rendered page is read.
        if (text.trim().length <= 25 && (opts.ocrRenderAll || garbled || (await pathCount(page).catch(() => 0)) >= 150)) {
          const png = await renderPage(doc, page).catch(() => null);
          // Two pages side by side on one landscape sheet, or a two-column scan: each half on its own.
          if (png && (opts.ocrHalves || (opts.ocrRenderAll && width > height * 1.2))) {
            const meta = await sharp(png).metadata();
            const w = meta.width ?? 0;
            const h = meta.height ?? 0;
            const half = Math.floor(w / 2);
            text = w > 2 ? `${await read(await sharp(png).extract({ left: 0, top: 0, width: half, height: h }).png().toBuffer())}\n${await read(await sharp(png).extract({ left: half, top: 0, width: w - half, height: h }).png().toBuffer())}` : "";
          } else text = await read(png);
        }
        if (text.trim().length > 25) {
          ocr = true;
          // OCR text has no font sizes: one run per line, body size, top to bottom.
          runs = text.split("\n").map((t) => t.trim()).filter(Boolean).map((t, i) => ({ text: t, x: 0, y: height - i * 12, width: width, size: 10, bold: false }));
          images = images.filter((im) => im !== scan);
        }
      }
      if (opts.ocrPictures && opts.ocrLangs && !ocr) {
        const pictures = await imagesOf(page as unknown as Parameters<typeof imagesOf>[0], true).catch(() => []);
        const read = opts.ocr ?? tesseractOcr;
        for (const im of pictures) {
          // A rule, a bullet or a tick box is not a picture of words.
          if (im.w < 24 || im.h < 8 || im.width < 24 || im.height < 8) continue;
          const text = await read(await toPng(im, 2400), opts.ocrLangs).catch(() => "");
          const lines = text.split("\n").map((t) => t.trim()).filter((t) => /\p{L}|\d/u.test(t));
          if (!lines.length) continue;
          ocr = true;
          // The picture's lines from its top edge down, spread over its height, at its left edge.
          const step = Math.min(14, im.h / lines.length);
          lines.forEach((t, i) => runs.push({ text: t, x: im.x, y: im.y + im.h - (i + 0.8) * step, width: im.w, size: 10, bold: false }));
        }
        runs.sort((a, b) => b.y - a.y || a.x - b.x);
      }
      pages.push({ page: p, width, height, runs, images: opts.figures ? images : [], ocr });
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return { pages, title };
}
