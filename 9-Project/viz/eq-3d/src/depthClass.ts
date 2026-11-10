/**
 * Hypocentre depth classes as defined by CWA 地震百問 14
 * (https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/14).
 */
import type { RangeClass } from "./rangeClass";

export interface DepthClass extends RangeClass {
  /** Point colour; differs from `color` only where the CWA swatch is unreadable on the dark scene. */
  pointColor: string;
}

export const DEPTH_CLASSES: readonly DepthClass[] = [
  { nameZh: "極淺地震", nameEn: "Very Shallow", min: 0, max: 30, range: "0–30 km", color: "#ef4444", pointColor: "#ef4444" },
  { nameZh: "淺層地震", nameEn: "Shallow", min: 30, max: 70, range: "30–70 km", color: "#f59e0b", pointColor: "#f59e0b" },
  { nameZh: "中層地震", nameEn: "Intermediate", min: 70, max: 300, range: "70–300 km", color: "#3b82f6", pointColor: "#3b82f6" },
  // #1e3a8a nearly vanishes on #05070d under additive blending, so points use a lighter blue
  { nameZh: "深層地震", nameEn: "Deep", min: 300, max: 700, range: "300–700 km", color: "#1e3a8a", pointColor: "#60a5fa" },
];
