/**
 * Earthquake size classes as defined by CWA 地震百問 33
 * (https://scweb.cwa.gov.tw/zh-tw/guidance/faqdetail/34).
 */
import { makeRamp, type Stop } from "./colormap";
import type { RangeClass } from "./rangeClass";

export interface MagnitudeClass extends RangeClass {
  /** Point size multiplier relative to the base point size. */
  sizeScale: number;
}

// Steps roughly match the continuous 1.6^(ML−3) curve at each class floor (1 / 2.6 / 6.6),
// so switching modes keeps the big events prominent; only 10 events are M ≥ 7
export const MAGNITUDE_CLASSES: readonly MagnitudeClass[] = [
  { nameZh: "微小地震", nameEn: "Micro", min: -Infinity, max: 3, range: "M < 3.0", color: "#10b981", sizeScale: 0.6 },
  { nameZh: "小地震", nameEn: "Small", min: 3, max: 5, range: "3.0 ≤ M < 5.0", color: "#3b82f6", sizeScale: 1 },
  { nameZh: "中地震", nameEn: "Medium", min: 5, max: 7, range: "5.0 ≤ M < 7.0", color: "#f59e0b", sizeScale: 2.5 },
  { nameZh: "大地震", nameEn: "Large", min: 7, max: Infinity, range: "M ≥ 7.0", color: "#ef4444", sizeScale: 6 },
];

/**
 * Continuous magnitude colour bar from the CWA FAQ 33 figure. Stops sit on the
 * class boundaries (the figure's blue/orange/red nodes at M 3 / 5 / 7) so the
 * gradient and the four classes read consistently.
 */
export const MAGNITUDE_COLOR_STOPS: readonly Stop[] = [
  { value: 1, color: "#10b981" },
  { value: 3, color: "#3b82f6" },
  { value: 5, color: "#f59e0b" },
  { value: 7, color: "#ef4444" },
];

export const magnitudeColor = makeRamp(MAGNITUDE_COLOR_STOPS);
