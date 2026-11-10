import * as THREE from "three";
import { elevationColor } from "../colormap";
import { toSceneXZ } from "../geo";

/** Metadata written by build_terrain.py. */
export interface TerrainMeta {
  west: number;
  east: number;
  south: number;
  north: number;
  width: number;
  height: number;
}

/**
 * Validate untrusted terrain.json content.
 *
 * @param raw Parsed JSON.
 * @returns Typed metadata.
 * @throws Error if a required numeric field is missing.
 */
export function parseTerrainMeta(raw: unknown): TerrainMeta {
  const keys = ["west", "east", "south", "north", "width", "height"] as const;
  if (typeof raw !== "object" || raw === null) throw new Error("terrain.json is not an object");
  const obj = raw as Record<string, unknown>;
  for (const k of keys) {
    if (typeof obj[k] !== "number") throw new Error(`terrain.json: missing ${k}`);
  }
  return obj as unknown as TerrainMeta;
}

/**
 * Build the land + bathymetry surface.
 *
 * Heights are stored in km at true scale; exaggeration is applied via
 * `object.scale.y`.
 *
 * @param meta Grid metadata (EPSG:4326 node-registered grid).
 * @param elev Int16 elevations in metres, row-major, north row first.
 * @param step Sub-sampling step to keep vertex count ~100k.
 * @returns Terrain mesh.
 */
export function createTerrain(meta: TerrainMeta, elev: Int16Array, step = 2): THREE.Mesh {
  if (elev.length !== meta.width * meta.height) throw new Error("terrain.bin size mismatch");
  const cols = Math.floor((meta.width - 1) / step) + 1;
  const rows = Math.floor((meta.height - 1) / step) + 1;
  const pos = new Float32Array(cols * rows * 3);
  const col = new Float32Array(cols * rows * 3);
  const dLon = (meta.east - meta.west) / (meta.width - 1);
  const dLat = (meta.north - meta.south) / (meta.height - 1);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const gr = r * step;
      const gc = c * step;
      const h = elev[gr * meta.width + gc]!;
      const [x, z] = toSceneXZ(meta.west + gc * dLon, meta.north - gr * dLat);
      const i = r * cols + c;
      pos.set([x, h / 1000, z], i * 3);
      col.set(elevationColor(h), i * 3);
    }
  }

  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + cols;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geom.setIndex(index);
  geom.computeVertexNormals();

  const mesh = new THREE.Mesh(
    geom,
    new THREE.MeshLambertMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    }),
  );
  mesh.renderOrder = 2;
  return mesh;
}
