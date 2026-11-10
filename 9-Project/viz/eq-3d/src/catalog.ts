/** Parse EQHistory.CSV (x,y,z,origin_time,magnitude_ml) into typed arrays. */

export interface Catalog {
  count: number;
  /** Longitude, degrees (EPSG:4326). */
  lon: Float32Array;
  /** Latitude, degrees (EPSG:4326). */
  lat: Float32Array;
  /** Depth in km, positive down. */
  depth: Float32Array;
  magnitude: Float32Array;
  /** Calendar year in UTC+8 (from the origin_time string). */
  year: Uint16Array;
}

export type Result<T> = { data: T; error: null } | { data: null; error: Error };

const HEADER = "x,y,z,origin_time,magnitude_ml";

/**
 * Parse the point-cloud CSV. The format is produced by csv_to_point_cloud.py:
 * fixed columns, no quoting, so a plain split is sufficient.
 *
 * @param text Full CSV text.
 * @returns Parsed catalog, or the first error encountered.
 */
export function parseCatalog(text: string): Result<Catalog> {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines[0] !== HEADER) {
    return { data: null, error: new Error(`unexpected header: ${lines[0] ?? "<empty>"}`) };
  }
  const n = lines.length - 1;
  const cat: Catalog = {
    count: n,
    lon: new Float32Array(n),
    lat: new Float32Array(n),
    depth: new Float32Array(n),
    magnitude: new Float32Array(n),
    year: new Uint16Array(n),
  };
  for (let i = 0; i < n; i++) {
    const cols = lines[i + 1]!.split(",");
    const [x, y, z, time, mag] = cols;
    const nums = [x, y, z, mag].map(Number);
    if (cols.length !== 5 || time === undefined || nums.some((v) => !Number.isFinite(v))) {
      return { data: null, error: new Error(`bad row ${i + 2}: ${lines[i + 1]}`) };
    }
    cat.lon[i] = nums[0]!;
    cat.lat[i] = nums[1]!;
    // 0 - z (not -z) so surface events give +0 instead of -0
    cat.depth[i] = 0 - nums[2]!;
    cat.magnitude[i] = nums[3]!;
    cat.year[i] = Number(time.slice(0, 4));
  }
  return { data: cat, error: null };
}
