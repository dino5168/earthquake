import { describe, expect, it } from "vitest";
import { ticks } from "./axes";

describe("ticks", () => {
  it("includes both ends on whole steps", () => {
    expect(ticks(118, 124, 1)).toEqual([118, 119, 120, 121, 122, 123, 124]);
    expect(ticks(20, 27, 1)).toHaveLength(8);
  });

  it("stops before overshooting max", () => {
    expect(ticks(0, 10, 3)).toEqual([0, 3, 6, 9]);
  });
});
