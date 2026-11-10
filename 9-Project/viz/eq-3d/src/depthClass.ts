/**
 * Hypocentre depth classes as defined by CWA 地震百問 14
 * (https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/14).
 */

export interface DepthClass {
  nameZh: string;
  nameEn: string;
  /** Inclusive lower bound, km. */
  min: number;
  /** Exclusive upper bound, km. */
  max: number;
  /** CWA swatch colour, used in the legend. */
  color: string;
  /** Point colour; differs from `color` only where the CWA swatch is unreadable on the dark scene. */
  pointColor: string;
}

export const DEPTH_CLASSES: readonly DepthClass[] = [
  { nameZh: "極淺地震", nameEn: "Very Shallow", min: 0, max: 30, color: "#ef4444", pointColor: "#ef4444" },
  { nameZh: "淺層地震", nameEn: "Shallow", min: 30, max: 70, color: "#f59e0b", pointColor: "#f59e0b" },
  { nameZh: "中層地震", nameEn: "Intermediate", min: 70, max: 300, color: "#3b82f6", pointColor: "#3b82f6" },
  // #1e3a8a nearly vanishes on #05070d under additive blending, so points use a lighter blue
  { nameZh: "深層地震", nameEn: "Deep", min: 300, max: 700, color: "#1e3a8a", pointColor: "#60a5fa" },
];

/**
 * Classify a hypocentre depth.
 *
 * Depths above sea level (CWA reports a few negative values) fall into the
 * first class and depths beyond 700 km into the last, so every event is drawn.
 *
 * @param depthKm Depth in km, positive down.
 * @returns Index into `DEPTH_CLASSES`.
 */
export function depthClassOf(depthKm: number): number {
  const i = DEPTH_CLASSES.findIndex((c) => depthKm < c.max);
  return i === -1 ? DEPTH_CLASSES.length - 1 : i;
}

/**
 * Count events per depth class.
 *
 * @param depth Depths in km, positive down.
 * @returns Counts in `DEPTH_CLASSES` order.
 */
export function countByClass(depth: Float32Array): number[] {
  const counts = DEPTH_CLASSES.map(() => 0);
  for (const d of depth) counts[depthClassOf(d)]!++;
  return counts;
}
