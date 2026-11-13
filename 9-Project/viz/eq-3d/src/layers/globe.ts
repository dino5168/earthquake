import * as THREE from "three";
import type { Catalog } from "../catalog";
import { elevationColor } from "../colormap";
import type { TerrainMeta } from "./terrain";

/** Mean Earth radius (km). */
export const EARTH_RADIUS_KM = 6371;
/** Scene radius of the globe surface; keeps camera distances near the flat scene's. */
export const GLOBE_RADIUS = 100;
const KM = GLOBE_RADIUS / EARTH_RADIUS_KM;
const DEG = Math.PI / 180;

/**
 * EPSG:4326 lon/lat → scene xyz on a sphere.
 *
 * Uses the same angle convention as `THREE.SphereGeometry` (φ from −180° lon,
 * θ from the north pole), so an equirectangular texture lines up with points.
 *
 * @param lon Longitude in degrees.
 * @param lat Latitude in degrees.
 * @param radius Distance from the centre in scene units.
 * @returns `[x, y, z]`; +y is the north pole.
 */
export function globePosition(lon: number, lat: number, radius: number): [number, number, number] {
  const phi = (lon + 180) * DEG;
  const theta = (90 - lat) * DEG;
  return [
    -radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/**
 * Hypocentre positions inside the globe.
 *
 * @param cat Parsed catalog (depth in km, positive down).
 * @param depthScale Radial exaggeration of depth.
 * @param out Buffer to reuse, `cat.count * 3` long.
 * @returns xyz per event.
 */
export function toGlobePositions(
  cat: Catalog,
  depthScale: number,
  out: Float32Array = new Float32Array(cat.count * 3),
): Float32Array {
  for (let i = 0; i < cat.count; i++) {
    // Clamp so extreme exaggeration cannot push deep events through the centre
    const r = Math.max(0, GLOBE_RADIUS - cat.depth[i]! * KM * depthScale);
    out.set(globePosition(cat.lon[i]!, cat.lat[i]!, r), i * 3);
  }
  return out;
}

/**
 * Bake an elevation grid into an equirectangular colour texture.
 *
 * @param meta Global grid metadata (west −180 … east 180, north row first).
 * @param elev Int16 elevations in metres.
 * @returns RGBA texture for a `SphereGeometry`.
 */
function elevationTexture(meta: TerrainMeta, elev: Int16Array): THREE.DataTexture {
  if (elev.length !== meta.width * meta.height) throw new Error("globe-terrain.bin size mismatch");
  const { width, height } = meta;
  const rgba = new Uint8Array(width * height * 4);
  for (let r = 0; r < height; r++) {
    // DataTexture row 0 is uv.y = 0 (south pole) while the grid starts at the north row
    const dst = (height - 1 - r) * width;
    for (let c = 0; c < width; c++) {
      const [R, G, B] = elevationColor(elev[r * width + c]!);
      rgba.set([R * 255, G * 255, B * 255, 255], (dst + c) * 4);
    }
  }
  const tex = new THREE.DataTexture(rgba, width, height, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Build the translucent Earth surface.
 *
 * @param meta Global grid metadata.
 * @param elev Int16 elevations in metres.
 * @returns Globe mesh; drawn after the points so they show through it.
 */
export function createGlobe(meta: TerrainMeta, elev: Int16Array): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(GLOBE_RADIUS, 128, 64),
    new THREE.MeshLambertMaterial({
      map: elevationTexture(meta, elev),
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    }),
  );
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * Meridians and parallels just above the surface.
 *
 * @param stepDeg Spacing in degrees.
 * @returns Line segments.
 */
export function createGraticule(stepDeg = 30): THREE.LineSegments {
  const r = GLOBE_RADIUS * 1.002;
  const pts: number[] = [];
  const seg = (a: [number, number], b: [number, number]): void => {
    pts.push(...globePosition(a[0], a[1], r), ...globePosition(b[0], b[1], r));
  };
  for (let lon = -180; lon < 180; lon += stepDeg) {
    for (let lat = -90; lat < 90; lat += 2) seg([lon, lat], [lon, lat + 2]);
  }
  for (let lat = -90 + stepDeg; lat < 90; lat += stepDeg) {
    for (let lon = -180; lon < 180; lon += 2) seg([lon, lat], [lon + 2, lat]);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(
    geom,
    new THREE.LineBasicMaterial({ color: 0x8d96a8, transparent: true, opacity: 0.3, depthWrite: false }),
  );
  lines.renderOrder = 3;
  return lines;
}
