import { describe, expect, it } from "vitest";
import { USGS_LIMIT, buildQueryUrl, defaultQuery, parseUsgsGeoJson } from "./query";

const feature = (coords: unknown, mag: unknown, time: unknown = Date.UTC(2026, 10, 12)) => ({
  type: "Feature",
  properties: { mag, time },
  geometry: { type: "Point", coordinates: coords },
});

describe("buildQueryUrl", () => {
  it("makes the end date inclusive and sets the limit", () => {
    const r = buildQueryUrl({ start: "2026-10-14", end: "2026-11-13", minMag: 4.5 });
    expect(r.error).toBeNull();
    const url = new URL(r.data!);
    expect(url.searchParams.get("starttime")).toBe("2026-10-14");
    expect(url.searchParams.get("endtime")).toBe("2026-11-14");
    expect(url.searchParams.get("minmagnitude")).toBe("4.5");
    expect(url.searchParams.get("limit")).toBe(String(USGS_LIMIT));
    expect(url.searchParams.get("format")).toBe("geojson");
  });

  it("rolls the inclusive end over month and year boundaries", () => {
    const r = buildQueryUrl({ start: "2025-12-01", end: "2025-12-31", minMag: 5 });
    expect(new URL(r.data!).searchParams.get("endtime")).toBe("2026-01-01");
  });

  it.each([
    ["2026/10/14", "2026-11-13", 4.5],
    ["2026-02-30", "2026-03-01", 4.5],
    ["2026-11-13", "2026-10-14", 4.5],
    ["2026-10-14", "2026-11-13", Number.NaN],
    ["2026-10-14", "2026-11-13", 11],
    ["2026-10-14&x=1", "2026-11-13", 4.5],
  ])("rejects start=%s end=%s minMag=%s", (start, end, minMag) => {
    expect(buildQueryUrl({ start, end, minMag }).error).toBeInstanceOf(Error);
  });
});

describe("defaultQuery", () => {
  it("covers the last 30 days at M 4.5", () => {
    expect(defaultQuery(new Date("2026-11-13T05:00:00Z"))).toEqual({
      start: "2026-10-14",
      end: "2026-11-13",
      minMag: 4.5,
    });
  });
});

describe("parseUsgsGeoJson", () => {
  it("parses features and skips incomplete ones", () => {
    const r = parseUsgsGeoJson({
      features: [
        feature([149.8877, -1.5882, 10], 5.8),
        feature([121.5, 24, -1.2], 4.6, Date.UTC(2025, 0, 1)),
        feature([0, 0, 10], null),
        feature([0, 0], 5),
        { nope: true },
      ],
    });
    expect(r.error).toBeNull();
    const { catalog, skipped, truncated } = r.data!;
    expect(catalog.count).toBe(2);
    expect(skipped).toBe(3);
    expect(truncated).toBe(false);
    expect(catalog.lon[0]).toBeCloseTo(149.8877, 3);
    expect(catalog.depth[1]).toBeCloseTo(-1.2, 5);
    expect(Array.from(catalog.year)).toEqual([2026, 2025]);
    expect(catalog.magnitude[0]).toBeCloseTo(5.8, 5);
  });

  it("flags truncation at the service limit", () => {
    const features = Array.from({ length: USGS_LIMIT }, () => feature([0, 0, 10], 5));
    expect(parseUsgsGeoJson({ features }).data?.truncated).toBe(true);
  });

  it.each([null, {}, { features: "x" }])("rejects malformed body %j", (raw) => {
    expect(parseUsgsGeoJson(raw).error).toBeInstanceOf(Error);
  });
});
