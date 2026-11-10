import { describe, expect, it } from "vitest";
import { DEPTH_CLASSES, countByClass, depthClassOf } from "./depthClass";
import { ticks } from "./layers/axes";

describe("DEPTH_CLASSES", () => {
  it("covers 0–700 km without gaps or overlaps", () => {
    expect(DEPTH_CLASSES[0]!.min).toBe(0);
    expect(DEPTH_CLASSES[DEPTH_CLASSES.length - 1]!.max).toBe(700);
    for (let i = 1; i < DEPTH_CLASSES.length; i++) {
      expect(DEPTH_CLASSES[i]!.min).toBe(DEPTH_CLASSES[i - 1]!.max);
    }
  });

  it("uses CWA FAQ 14 swatch colours", () => {
    expect(DEPTH_CLASSES.map((c) => c.color)).toEqual(["#ef4444", "#f59e0b", "#3b82f6", "#1e3a8a"]);
  });
});

describe("depthClassOf", () => {
  it.each([
    [-1.2, 0],
    [0, 0],
    [29.9, 0],
    [30, 1],
    [69.9, 1],
    [70, 2],
    [299.9, 2],
    [300, 3],
    [699, 3],
    [800, 3],
  ])("%f km → class %i", (depth, cls) => {
    expect(depthClassOf(depth)).toBe(cls);
  });
});

describe("countByClass", () => {
  it("counts events per class", () => {
    expect(countByClass(new Float32Array([5, 10, 45, 120, 310]))).toEqual([2, 1, 1, 1]);
  });
});

describe("ticks", () => {
  it("includes both ends on whole steps", () => {
    expect(ticks(118, 124, 1)).toEqual([118, 119, 120, 121, 122, 123, 124]);
    expect(ticks(20, 27, 1)).toHaveLength(8);
  });

  it("stops before overshooting max", () => {
    expect(ticks(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });
});
