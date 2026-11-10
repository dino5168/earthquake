import { describe, expect, it } from "vitest";
import { EXTENT, toSceneXZ } from "../geo";
import { gridSegments } from "./grid";

const [x0, zN] = toSceneXZ(EXTENT.west, EXTENT.north);
const [x1] = toSceneXZ(EXTENT.east, EXTENT.south);

describe("gridSegments", () => {
  const pts = gridSegments(320);
  const segs = Array.from({ length: pts.length / 2 }, (_, i) => [pts[2 * i]!, pts[2 * i + 1]!]);

  it("has 7 meridians + 8 parallels, their wall verticals, and 5 depth levels × 2 walls", () => {
    expect(segs).toHaveLength(7 * 2 + 8 * 2 + 5 * 2);
  });

  it("puts every horizontal-plane line at Z = 0 and wall lines on the north or east wall", () => {
    for (const [a, b] of segs) {
      const flatAtSurface = a![1] === 0 && b![1] === 0;
      const onNorth = a![2] === zN && b![2] === zN;
      const onEast = a![0] === x1 && b![0] === x1;
      expect(flatAtSurface || onNorth || onEast).toBe(true);
    }
  });

  it("spans the frame from west edge to east edge", () => {
    const xs = pts.map((p) => p[0]!);
    expect(Math.min(...xs)).toBeCloseTo(x0);
    expect(Math.max(...xs)).toBeCloseTo(x1);
  });

  it("omits depth lines below the frame bottom", () => {
    expect(Math.min(...gridSegments(100).map((p) => p[1]!))).toBe(-100);
    expect(gridSegments(100)).toHaveLength((7 * 2 + 8 * 2 + 3 * 2) * 2);
  });
});
