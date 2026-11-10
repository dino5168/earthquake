/**
 * Parse the viewer's CSV inputs into typed arrays:
 * - EQHistory.csv  (x,y,z,origin_time,magnitude_ml)
 * - image-cloud.csv (x,y,z,r,g,b) — optional, local-only test layer
 *
 * Both share x = lon, y = lat (EPSG:4326 deg), z = −depth km.
 */

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

export interface ImageCloud {
  count: number;
  lon: Float32Array;
  lat: Float32Array;
  depth: Float32Array;
  /** Interleaved RGB in 0..1, length count × 3. */
  rgb: Float32Array;
}

export type Result<T> = { data: T; error: null } | { data: null; error: Error };

const CATALOG_HEADER = "x,y,z,origin_time,magnitude_ml";
const IMAGE_HEADER = "x,y,z,r,g,b";

/**
 * Split a header-checked CSV into rows of fixed width. The inputs are produced
 * by our own Python scripts: fixed columns, no quoting, so a plain split works.
 *
 * @param text Full CSV text.
 * @param header Exact expected header line.
 * @param width Expected column count.
 * @returns Rows (header excluded), or the first error encountered.
 */
function readRows(text: string, header: string, width: number): Result<string[][]> {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines[0] !== header) {
    return { data: null, error: new Error(`unexpected header: ${lines[0] ?? "<empty>"}`) };
  }
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(",");
    if (cols.length !== width) {
      return { data: null, error: new Error(`bad row ${i + 1}: ${lines[i]}`) };
    }
    rows.push(cols);
  }
  return { data: rows, error: null };
}

/**
 * Parse numeric columns, failing on the first non-finite value.
 *
 * @param cols Row cells.
 * @param indices Column indices to convert.
 * @returns Numbers in `indices` order, or null if any is not finite.
 */
function toNumbers(cols: string[], indices: readonly number[]): number[] | null {
  const nums = indices.map((i) => Number(cols[i]));
  return nums.every(Number.isFinite) ? nums : null;
}

/**
 * Parse EQHistory.csv.
 *
 * @param text Full CSV text.
 * @returns Parsed catalog, or the first error encountered.
 */
export function parseCatalog(text: string): Result<Catalog> {
  const rows = readRows(text, CATALOG_HEADER, 5);
  if (rows.error) return rows;
  const n = rows.data.length;
  const cat: Catalog = {
    count: n,
    lon: new Float32Array(n),
    lat: new Float32Array(n),
    depth: new Float32Array(n),
    magnitude: new Float32Array(n),
    year: new Uint16Array(n),
  };
  for (let i = 0; i < n; i++) {
    const cols = rows.data[i]!;
    const nums = toNumbers(cols, [0, 1, 2, 4]);
    if (!nums) return { data: null, error: new Error(`bad row ${i + 2}: ${cols.join(",")}`) };
    cat.lon[i] = nums[0]!;
    cat.lat[i] = nums[1]!;
    // 0 - z (not -z) so surface events give +0 instead of -0
    cat.depth[i] = 0 - nums[2]!;
    cat.magnitude[i] = nums[3]!;
    cat.year[i] = Number(cols[3]!.slice(0, 4));
  }
  return { data: cat, error: null };
}

/**
 * Parse image-cloud.csv produced by 5-3D點雲/image_to_cloud.py.
 *
 * @param text Full CSV text.
 * @returns Parsed cloud, or the first error encountered.
 */
export function parseImageCloud(text: string): Result<ImageCloud> {
  const rows = readRows(text, IMAGE_HEADER, 6);
  if (rows.error) return rows;
  const n = rows.data.length;
  const cloud: ImageCloud = {
    count: n,
    lon: new Float32Array(n),
    lat: new Float32Array(n),
    depth: new Float32Array(n),
    rgb: new Float32Array(n * 3),
  };
  for (let i = 0; i < n; i++) {
    const cols = rows.data[i]!;
    const nums = toNumbers(cols, [0, 1, 2, 3, 4, 5]);
    if (!nums) return { data: null, error: new Error(`bad row ${i + 2}: ${cols.join(",")}`) };
    cloud.lon[i] = nums[0]!;
    cloud.lat[i] = nums[1]!;
    cloud.depth[i] = 0 - nums[2]!;
    cloud.rgb.set([nums[3]! / 255, nums[4]! / 255, nums[5]! / 255], i * 3);
  }
  return { data: cloud, error: null };
}
