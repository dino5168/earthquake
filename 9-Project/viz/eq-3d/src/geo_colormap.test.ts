import { describe, expect, it } from "vitest";
import { elevationColor, hexToRgb, makeRamp } from "./colormap";
import { toSceneXZ } from "./geo";

describe("toSceneXZ", () => {
  it("maps origin to 0,0", () => {
    const [x, z] = toSceneXZ(121, 23.5);
    expect(x).toBeCloseTo(0);
    expect(z).toBeCloseTo(0);
  });

  it("east is +x and north is -z, in km", () => {
    const [x] = toSceneXZ(122, 23.5);
    const [, z] = toSceneXZ(121, 24.5);
    expect(x).toBeCloseTo(102.1, 0);
    expect(z).toBeCloseTo(-110.57, 1);
  });
});

describe("colormap", () => {
  it("parses hex", () => {
    expect(hexToRgb("#ff8000")).toEqual([1, 128 / 255, 0]);
  });

  it("interpolates and clamps", () => {
    const ramp = makeRamp([
      { value: 0, color: "#000000" },
      { value: 10, color: "#ffffff" },
    ]);
    expect(ramp(-5)).toEqual([0, 0, 0]);
    expect(ramp(5)[0]).toBeCloseTo(0.5);
    expect(ramp(50)).toEqual([1, 1, 1]);
  });

  it("sea level splits ocean blue from land green", () => {
    const sea = elevationColor(-1);
    const land = elevationColor(0);
    expect(sea[2]).toBeGreaterThan(sea[1]);
    expect(land[1]).toBeGreaterThan(land[2]);
  });
});
