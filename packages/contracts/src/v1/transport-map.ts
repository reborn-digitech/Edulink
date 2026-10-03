/**
 * The transport module's map, drawn by hand on both the web and the phone:
 * OpenStreetMap's tiles placed in a fixed frame by Web Mercator arithmetic,
 * and any point placed in the same frame. No map library and no key. Also
 * the "07:35" labels the stop times are written and read in. Pure
 * functions, no data — shared here so the two apps cannot drift.
 */
type LatLng = { lat: number; lng: number };
const rad = (deg: number) => (deg * Math.PI) / 180;

export const TILE_SIZE = 256;
/** OpenStreetMap's own tile server: free, attributed, for light use (its tile policy). A deployment with heavy use points this at its own or a provider's. */
export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** A point's position on the whole world at zoom `z`, in pixels (Web Mercator). */
export function worldPx(p: LatLng, z: number): { x: number; y: number } {
  const scale = TILE_SIZE * 2 ** z;
  const x = ((p.lng + 180) / 360) * scale;
  const s = Math.sin(rad(Math.max(-85.0511, Math.min(85.0511, p.lat))));
  const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/** The largest zoom (≤ maxZoom) at which every point fits in width × height with a margin. */
export function fitZoom(points: LatLng[], width: number, height: number, maxZoom = 16, margin = 32): number {
  if (points.length <= 1) return Math.min(maxZoom, 15);
  for (let z = maxZoom; z > 2; z--) {
    const px = points.map((p) => worldPx(p, z));
    const w = Math.max(...px.map((p) => p.x)) - Math.min(...px.map((p) => p.x));
    const h = Math.max(...px.map((p) => p.y)) - Math.min(...px.map((p) => p.y));
    if (w <= width - 2 * margin && h <= height - 2 * margin) return z;
  }
  return 3;
}

/**
 * Everything a map view draws, in its own pixel frame (0..width, 0..height):
 * the tiles to fetch with where each goes, and a function placing any point.
 */
export function mapView(points: LatLng[], width: number, height: number, zoomDelta = 0): {
  zoom: number;
  tiles: { key: string; url: string; x: number; y: number }[];
  place: (p: LatLng) => { x: number; y: number };
} {
  const zoom = Math.max(3, Math.min(18, fitZoom(points.length ? points : [{ lat: 20.59, lng: 78.96 }], width, height) + zoomDelta));
  const px = (points.length ? points : [{ lat: 20.59, lng: 78.96 }]).map((p) => worldPx(p, zoom));
  const cx = (Math.min(...px.map((p) => p.x)) + Math.max(...px.map((p) => p.x))) / 2;
  const cy = (Math.min(...px.map((p) => p.y)) + Math.max(...px.map((p) => p.y))) / 2;
  const left = cx - width / 2;
  const top = cy - height / 2;
  const n = 2 ** zoom;
  const tiles: { key: string; url: string; x: number; y: number }[] = [];
  for (let ty = Math.floor(top / TILE_SIZE); ty <= Math.floor((top + height) / TILE_SIZE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor(left / TILE_SIZE); tx <= Math.floor((left + width) / TILE_SIZE); tx++) {
      const wrapped = ((tx % n) + n) % n;
      tiles.push({
        key: `${zoom}/${tx}/${ty}`,
        url: TILE_URL.replace("{z}", String(zoom)).replace("{x}", String(wrapped)).replace("{y}", String(ty)),
        x: tx * TILE_SIZE - left,
        y: ty * TILE_SIZE - top,
      });
    }
  }
  return {
    zoom,
    tiles,
    place: (p) => {
      const w = worldPx(p, zoom);
      return { x: w.x - left, y: w.y - top };
    },
  };
}

/** "07:35" from minutes after midnight. */
export function minuteLabel(minute: number | null | undefined): string {
  if (minute === null || minute === undefined) return "";
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** "07:35" → 455; null for anything else. */
export function parseMinute(raw: string | null | undefined): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((raw ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}
