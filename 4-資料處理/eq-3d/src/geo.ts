/**
 * EPSG:4326 (lon/lat degrees) → local scene plane in km.
 *
 * Local equirectangular approximation centred on Taiwan. East-west error is
 * about ±3% at the 20°N / 27°N edges — acceptable for visualisation. Points and
 * terrain must both go through this function so they stay aligned.
 */

export const ORIGIN_LON = 121;
export const ORIGIN_LAT = 23.5;
const KM_PER_DEG_LAT = 110.57;
const KM_PER_DEG_LON = 111.32 * Math.cos((ORIGIN_LAT * Math.PI) / 180);

/** Catalog nominal extent (CWA E-A0073-001). */
export const EXTENT = { west: 118, east: 124, south: 20, north: 27 } as const;

/**
 * Convert lon/lat to scene coordinates.
 *
 * Scene axes (three.js is Y-up): +x = east, +y = up, −z = north.
 *
 * @param lon Longitude in degrees (EPSG:4326).
 * @param lat Latitude in degrees (EPSG:4326).
 * @returns `[x, z]` in km.
 */
export function toSceneXZ(lon: number, lat: number): [number, number] {
  return [(lon - ORIGIN_LON) * KM_PER_DEG_LON, -(lat - ORIGIN_LAT) * KM_PER_DEG_LAT];
}
