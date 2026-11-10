import type * as THREE from "three";
import { EXTENT, toSceneXZ } from "../geo";
import { DEPTH_TICKS_KM, makeSegments, ticks } from "./axes";

const STEP_DEG = 1;

/**
 * Segment endpoints for the lon/lat grid at sea level (geo Z = 0) and the
 * depth grid on the north and east walls of the catalog frame.
 *
 * The back walls face away from the default south-south-west camera, so the
 * grid never sits in front of the point cloud.
 *
 * @param depthKm Frame bottom depth in km (positive down).
 * @returns Consecutive `[x, y, z]` pairs, one pair per segment, in scene km.
 */
export function gridSegments(depthKm: number): number[][] {
  const [x0, zN] = toSceneXZ(EXTENT.west, EXTENT.north);
  const [x1, zS] = toSceneXZ(EXTENT.east, EXTENT.south);
  const yB = -depthKm;
  const pts: number[][] = [];

  for (const lon of ticks(EXTENT.west, EXTENT.east, STEP_DEG)) {
    const [x] = toSceneXZ(lon, EXTENT.south);
    pts.push([x, 0, zS], [x, 0, zN]); // meridian at Z = 0
    pts.push([x, 0, zN], [x, yB, zN]); // north wall vertical
  }
  for (const lat of ticks(EXTENT.south, EXTENT.north, STEP_DEG)) {
    const [, z] = toSceneXZ(EXTENT.east, lat);
    pts.push([x0, 0, z], [x1, 0, z]); // parallel at Z = 0
    pts.push([x1, 0, z], [x1, yB, z]); // east wall vertical
  }
  for (const d of DEPTH_TICKS_KM.filter((v) => v > 0 && v <= depthKm)) {
    pts.push([x0, -d, zN], [x1, -d, zN]); // north wall horizontal
    pts.push([x1, -d, zN], [x1, -d, zS]); // east wall horizontal
  }
  return pts;
}

/**
 * Faint grid lines: lon/lat at Z = 0 plus depth lines on the back walls.
 * Vertical exaggeration is applied via `object.scale.y`.
 *
 * @param depthKm Frame bottom depth in km (positive down).
 * @returns Line segments object.
 */
export function createGrid(depthKm: number): THREE.LineSegments {
  const grid = makeSegments(gridSegments(depthKm), 0xffffff, 0.18);
  // Drawn before the semi-transparent terrain (renderOrder 2), which writes
  // depth: drawn after, the Z = 0 grid under the lifted terrain would be culled.
  grid.renderOrder = 0;
  // Thin lines must not occlude the additive point cloud behind them
  (grid.material as THREE.LineBasicMaterial).depthWrite = false;
  return grid;
}
