import { describe, expect, it } from "vitest";
import { parseCatalog } from "./catalog";

const HEADER = "x,y,z,origin_time,magnitude_ml";

describe("parseCatalog", () => {
  it("parses rows and flips z back to positive depth", () => {
    const r = parseCatalog(
      `${HEADER}\r\n121.812,24.317,-2.0,1990-01-01T21:47:59+08:00,3.3\r\n120.5,23,0.0,2025-12-31T20:07:32+08:00,7.3\r\n`,
    );
    expect(r.error).toBeNull();
    const c = r.data!;
    expect(c.count).toBe(2);
    expect(c.lon[0]).toBeCloseTo(121.812, 3);
    expect(c.depth[0]).toBeCloseTo(2.0);
    expect(c.depth[1]).toBe(0);
    expect(c.magnitude[1]).toBeCloseTo(7.3);
    expect(Array.from(c.year)).toEqual([1990, 2025]);
  });

  it("rejects an unexpected header", () => {
    expect(parseCatalog("a,b\n1,2").error?.message).toMatch(/header/);
  });

  it("rejects malformed rows", () => {
    const r = parseCatalog(`${HEADER}\n121,24,abc,1990-01-01T00:00:00+08:00,3.1`);
    expect(r.error?.message).toMatch(/bad row 2/);
  });
});
