import * as THREE from "three";
import { describe, expect, it } from "vitest";
import type { Catalog } from "../catalog";
import { EARTH_RADIUS_KM, GLOBE_RADIUS, globePosition, toGlobePositions } from "./globe";

const close = (a: readonly number[], b: readonly number[]): void => {
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));
};

describe("globePosition", () => {
  it("puts the poles on ±y and lon 0 on +x", () => {
    close(globePosition(0, 90, 1), [0, 1, 0]);
    close(globePosition(0, -90, 1), [0, -1, 0]);
    close(globePosition(0, 0, 1), [1, 0, 0]);
    close(globePosition(-180, 0, 1), [-1, 0, 0]);
  });

  it("matches THREE.SphereGeometry vertices at the same uv", () => {
    // Equirectangular texture alignment depends on this
    const sphere = new THREE.SphereGeometry(1, 8, 4);
    const pos = sphere.getAttribute("position");
    const uv = sphere.getAttribute("uv");
    for (let i = 0; i < pos.count; i++) {
      const lon = uv.getX(i) * 360 - 180;
      const lat = uv.getY(i) * 180 - 90;
      close(globePosition(lon, lat, 1), [pos.getX(i), pos.getY(i), pos.getZ(i)]);
    }
  });
});

describe("toGlobePositions", () => {
  const cat: Catalog = {
    count: 2,
    lon: Float32Array.of(0, 0),
    lat: Float32Array.of(0, 0),
    depth: Float32Array.of(637.1, 7000),
    magnitude: Float32Array.of(5, 5),
    year: Uint16Array.of(2026, 2026),
  };

  it("moves deeper events toward the centre, scaled and clamped", () => {
    const pos = toGlobePositions(cat, 2);
    // 637.1 km = 10% of the radius, ×2 exaggeration
    expect(pos[0]).toBeCloseTo(GLOBE_RADIUS * (1 - (2 * 637.1) / EARTH_RADIUS_KM), 4);
    close(Array.from(pos.slice(3)), [0, 0, 0]);
  });
});
