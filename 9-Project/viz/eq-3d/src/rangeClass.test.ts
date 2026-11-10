import { describe, expect, it } from "vitest";
import { DEPTH_CLASSES } from "./depthClass";
import { MAGNITUDE_CLASSES } from "./magnitudeClass";
import { classOf, countByClass, type RangeClass } from "./rangeClass";

/**
 * Assert classes tile the number line without gaps or overlaps.
 *
 * @param classes Classes sorted by ascending bounds.
 */
function expectContiguous(classes: readonly RangeClass[]): void {
  for (let i = 1; i < classes.length; i++) {
    expect(classes[i]!.min).toBe(classes[i - 1]!.max);
  }
}

describe("DEPTH_CLASSES", () => {
  it("covers 0–700 km contiguously", () => {
    expect(DEPTH_CLASSES[0]!.min).toBe(0);
    expect(DEPTH_CLASSES[DEPTH_CLASSES.length - 1]!.max).toBe(700);
    expectContiguous(DEPTH_CLASSES);
  });

  it("uses CWA FAQ 14 swatch colours", () => {
    expect(DEPTH_CLASSES.map((c) => c.color)).toEqual(["#ef4444", "#f59e0b", "#3b82f6", "#1e3a8a"]);
  });

  it.each([
    [-1.2, 0],
    [0, 0],
    [29.9, 0],
    [30, 1],
    [69.9, 1],
    [70, 2],
    [299.9, 2],
    [300, 3],
    [800, 3],
  ])("depth %f km → class %i", (depth, cls) => {
    expect(classOf(depth, DEPTH_CLASSES)).toBe(cls);
  });
});

describe("MAGNITUDE_CLASSES", () => {
  it("covers all magnitudes contiguously", () => {
    expect(MAGNITUDE_CLASSES[0]!.min).toBe(-Infinity);
    expect(MAGNITUDE_CLASSES[MAGNITUDE_CLASSES.length - 1]!.max).toBe(Infinity);
    expectContiguous(MAGNITUDE_CLASSES);
  });

  it("grows point size with magnitude", () => {
    const sizes = MAGNITUDE_CLASSES.map((c) => c.sizeScale);
    expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
  });

  it.each([
    [-0.5, 0],
    [2.99, 0],
    [3, 1],
    [4.99, 1],
    [5, 2],
    [6.99, 2],
    [7, 3],
    [7.3, 3],
  ])("ML %f → class %i", (mag, cls) => {
    expect(classOf(mag, MAGNITUDE_CLASSES)).toBe(cls);
  });
});

describe("countByClass", () => {
  it("counts values per class", () => {
    expect(countByClass(new Float32Array([5, 10, 45, 120, 310]), DEPTH_CLASSES)).toEqual([2, 1, 1, 1]);
    expect(countByClass([3.2, 5.1, 7.3], MAGNITUDE_CLASSES)).toEqual([0, 1, 1, 1]);
  });
});
