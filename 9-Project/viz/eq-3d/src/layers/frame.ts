import * as THREE from "three";
import { EXTENT, toSceneXZ } from "../geo";

/**
 * White wireframe box spanning the catalog extent from sea level to `depthKm`.
 * Vertical exaggeration is applied via `object.scale.y`.
 *
 * @param depthKm Box bottom depth in km (positive down).
 * @returns Line segments object.
 */
export function createFrame(depthKm: number): THREE.LineSegments {
  const [x0, z0] = toSceneXZ(EXTENT.west, EXTENT.north);
  const [x1, z1] = toSceneXZ(EXTENT.east, EXTENT.south);
  const box = new THREE.BoxGeometry(x1 - x0, depthKm, z1 - z0);
  box.translate((x0 + x1) / 2, -depthKm / 2, (z0 + z1) / 2);
  const lines = new THREE.LineSegments(
    new THREE.EdgesGeometry(box),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }),
  );
  lines.renderOrder = 3;
  return lines;
}
