/**
 * USGS FDSN Event Web Service client (https://earthquake.usgs.gov/fdsnws/event/1/).
 * The service sends `Access-Control-Allow-Origin: *`, so the browser queries it directly.
 */
import type { Catalog, Result } from "../catalog";

export const USGS_ENDPOINT = "https://earthquake.usgs.gov/fdsnws/event/1/query";
/** Service maximum per request; reaching it means the result is truncated. */
export const USGS_LIMIT = 20000;

/** Query form values. Dates are UTC calendar days, both inclusive. */
export interface UsgsQuery {
  /** `YYYY-MM-DD`. */
  start: string;
  /** `YYYY-MM-DD`. */
  end: string;
  minMag: number;
}

/** Parsed response. */
export interface UsgsResult {
  /** `year` is the UTC calendar year. */
  catalog: Catalog;
  /** Features dropped for missing magnitude or coordinates. */
  skipped: number;
  /** True when the service limit was hit, so older events are missing. */
  truncated: boolean;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * Format a Date as a UTC `YYYY-MM-DD` string.
 *
 * @param d Date.
 * @returns ISO calendar date.
 */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Parse a strict `YYYY-MM-DD` string as UTC midnight.
 *
 * @param s Candidate date string.
 * @returns Epoch ms, or null if malformed or not a real date (e.g. 2026-02-30).
 */
function parseIsoDate(s: string): number | null {
  if (!DATE_RE.test(s)) return null;
  const ms = Date.parse(`${s}T00:00:00Z`);
  // Some engines roll 02-30 over to 03-02; the round trip catches that
  return Number.isFinite(ms) && toIsoDate(new Date(ms)) === s ? ms : null;
}

/**
 * Default form values: the last 30 days, M ≥ 4.5 (same as the USGS "4.5_month" feed).
 *
 * @param now Current time.
 * @returns Query values.
 */
export function defaultQuery(now: Date): UsgsQuery {
  return {
    start: toIsoDate(new Date(now.getTime() - 30 * DAY_MS)),
    end: toIsoDate(now),
    minMag: 4.5,
  };
}

/**
 * Validate form input and build the request URL.
 *
 * @param q Untrusted form values.
 * @returns Request URL, or a user-facing error.
 */
export function buildQueryUrl(q: UsgsQuery): Result<string> {
  const start = parseIsoDate(q.start.trim());
  const end = parseIsoDate(q.end.trim());
  if (start === null || end === null) {
    return { data: null, error: new Error("日期格式須為 YYYY-MM-DD") };
  }
  if (start > end) return { data: null, error: new Error("起始日期晚於結束日期") };
  if (!Number.isFinite(q.minMag) || q.minMag < 0 || q.minMag > 10) {
    return { data: null, error: new Error("最小規模須介於 0 與 10") };
  }
  const params = new URLSearchParams({
    format: "geojson",
    eventtype: "earthquake",
    starttime: toIsoDate(new Date(start)),
    // endtime is an exclusive instant; +1 day makes the end date inclusive
    endtime: toIsoDate(new Date(end + DAY_MS)),
    minmagnitude: String(q.minMag),
    orderby: "time",
    limit: String(USGS_LIMIT),
  });
  return { data: `${USGS_ENDPOINT}?${params.toString()}`, error: null };
}

interface QuakeEvent {
  lon: number;
  lat: number;
  depth: number;
  mag: number;
  time: number;
}

/**
 * Extract the fields we use from one GeoJSON feature.
 *
 * @param f Untrusted feature.
 * @returns Event, or null if any required field is missing or non-finite.
 */
function readFeature(f: unknown): QuakeEvent | null {
  if (typeof f !== "object" || f === null) return null;
  const { geometry, properties } = f as { geometry?: unknown; properties?: unknown };
  const coords = (geometry as { coordinates?: unknown } | null | undefined)?.coordinates;
  const props = properties as { mag?: unknown; time?: unknown } | null | undefined;
  if (!Array.isArray(coords) || coords.length < 3) return null;
  const [lon, lat, depth] = coords as unknown[];
  const ev = { lon, lat, depth, mag: props?.mag, time: props?.time };
  const ok = Object.values(ev).every((v) => typeof v === "number" && Number.isFinite(v));
  return ok ? (ev as QuakeEvent) : null;
}

/**
 * Parse a USGS GeoJSON FeatureCollection into a typed catalog.
 *
 * @param raw Parsed response JSON (untrusted).
 * @returns Catalog with skip/truncation info, or an error if the shape is wrong.
 */
export function parseUsgsGeoJson(raw: unknown): Result<UsgsResult> {
  const features = (raw as { features?: unknown } | null)?.features;
  if (!Array.isArray(features)) {
    return { data: null, error: new Error("USGS 回應格式錯誤：缺少 features") };
  }
  const events = features.map(readFeature).filter((e): e is QuakeEvent => e !== null);
  const n = events.length;
  const catalog: Catalog = {
    count: n,
    lon: new Float32Array(n),
    lat: new Float32Array(n),
    depth: new Float32Array(n),
    magnitude: new Float32Array(n),
    year: new Uint16Array(n),
  };
  events.forEach((e, i) => {
    catalog.lon[i] = e.lon;
    catalog.lat[i] = e.lat;
    catalog.depth[i] = e.depth;
    catalog.magnitude[i] = e.mag;
    catalog.year[i] = new Date(e.time).getUTCFullYear();
  });
  return {
    data: { catalog, skipped: features.length - n, truncated: features.length >= USGS_LIMIT },
    error: null,
  };
}
