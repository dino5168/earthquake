import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { DEPTH_CLASSES } from "../depthClass";
import { EXTENT, toSceneXZ } from "../geo";

const TICK_KM = 12;
const LABEL_KM = 34;
const TITLE_KM = 75;
const DEPTH_TICKS_KM = [0, 30, 70, 100, 200, 300] as const;

/**
 * Evenly spaced tick values from `min` to `max` inclusive.
 *
 * @param min First tick.
 * @param max Last tick (included when reachable by whole steps).
 * @param step Spacing, > 0.
 * @returns Tick values.
 */
export function ticks(min: number, max: number, step: number): number[] {
  const n = Math.floor((max - min) / step + 1e-9);
  return Array.from({ length: n + 1 }, (_, i) => min + i * step);
}

/**
 * Create a text label anchored at a scene position.
 *
 * @param text Label text.
 * @param pos Scene position in km.
 * @param variant Extra BEM modifier, e.g. "title".
 * @returns The label object.
 */
function makeLabel(text: string, pos: THREE.Vector3, variant?: string): CSS2DObject {
  const el = document.createElement("div");
  el.className = variant ? `axis-label axis-label--${variant}` : "axis-label";
  el.textContent = text;
  const label = new CSS2DObject(el);
  label.position.copy(pos);
  return label;
}

/**
 * Build line segments from a flat list of `[x, y, z]` point pairs.
 *
 * @param pts Consecutive pairs form one segment each.
 * @param color Line colour.
 * @param opacity Line opacity.
 * @returns Line segments object.
 */
function makeSegments(pts: number[][], color: THREE.ColorRepresentation, opacity: number): THREE.LineSegments {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
  const lines = new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
  lines.renderOrder = 3;
  return lines;
}

/**
 * Axes for the catalog frame: longitude (geo X) along the south bottom edge,
 * latitude (geo Y) along the east bottom edge, depth (geo Z) down the
 * south-west vertical edge (latitude sits east so it never overlaps the depth
 * axis in the default view from the south), plus depth-class boundary rings.
 *
 * Scene axes: +x = east, +y = up, −z = north. Vertical exaggeration is applied
 * via `group.scale.y`; labels still read true km because only positions scale.
 *
 * @param depthKm Frame bottom depth in km (positive down).
 * @returns Group holding tick lines, boundary rings and CSS2D labels.
 */
export function createAxes(depthKm: number): THREE.Group {
  const group = new THREE.Group();
  const [x0, zN] = toSceneXZ(EXTENT.west, EXTENT.north);
  const [x1, zS] = toSceneXZ(EXTENT.east, EXTENT.south);
  const yB = -depthKm;
  const tickPts: number[][] = [];

  for (const lon of ticks(EXTENT.west, EXTENT.east, 1)) {
    const [x] = toSceneXZ(lon, EXTENT.south);
    tickPts.push([x, yB, zS], [x, yB, zS + TICK_KM]);
    group.add(makeLabel(`${lon}°E`, new THREE.Vector3(x, yB, zS + LABEL_KM)));
  }
  for (const lat of ticks(EXTENT.south, EXTENT.north, 1)) {
    const [, z] = toSceneXZ(EXTENT.east, lat);
    tickPts.push([x1, yB, z], [x1 + TICK_KM, yB, z]);
    group.add(makeLabel(`${lat}°N`, new THREE.Vector3(x1 + LABEL_KM, yB, z)));
  }
  for (const d of DEPTH_TICKS_KM.filter((v) => v <= depthKm)) {
    tickPts.push([x0, -d, zS], [x0 - TICK_KM, -d, zS + TICK_KM]);
    group.add(makeLabel(`${d}`, new THREE.Vector3(x0 - LABEL_KM, -d, zS + LABEL_KM)));
  }
  group.add(makeSegments(tickPts, 0xffffff, 0.55));

  group.add(
    makeLabel("經度 (°E)", new THREE.Vector3((x0 + x1) / 2, yB, zS + TITLE_KM), "title"),
    makeLabel("緯度 (°N)", new THREE.Vector3(x1 + TITLE_KM, yB, (zN + zS) / 2), "title"),
    makeLabel("深度 (km)", new THREE.Vector3(x0 - TITLE_KM, -depthKm / 2, zS + TITLE_KM), "title"),
  );

  // Rings at each class's upper bound (30 / 70 / 300 km) show the depth layers
  for (const c of DEPTH_CLASSES.filter((k) => k.min > 0 && k.min < depthKm)) {
    const y = -c.min;
    const ring = [
      [x0, y, zS], [x1, y, zS],
      [x1, y, zS], [x1, y, zN],
      [x1, y, zN], [x0, y, zN],
      [x0, y, zN], [x0, y, zS],
    ];
    group.add(makeSegments(ring, c.pointColor, 0.45));
  }
  return group;
}
