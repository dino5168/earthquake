/** Piecewise-linear colour ramps for depth and elevation. */

export type RGB = [number, number, number];
export interface Stop {
  value: number;
  color: string;
}

/** Earthquake depth (km, positive down). 81% of events are < 50 km, so the
 * shallow band is split finely to reproduce the red/yellow layering. */
export const DEPTH_STOPS: readonly Stop[] = [
  { value: 0, color: "#ff1e3c" },
  { value: 25, color: "#ff2a3a" },
  { value: 45, color: "#ffd21f" },
  { value: 90, color: "#2ee86a" },
  { value: 160, color: "#22d3d6" },
  { value: 300, color: "#3b6bff" },
];

/** Terrain elevation (m). Ocean blues below 0, land greens/ochres above. */
export const ELEVATION_STOPS: readonly Stop[] = [
  { value: -6500, color: "#071a33" },
  { value: -3000, color: "#0e3560" },
  { value: -200, color: "#1f6290" },
  { value: -1, color: "#3b8fb4" },
  { value: 0, color: "#3d8a3a" },
  { value: 800, color: "#8fb84a" },
  { value: 2200, color: "#d8c66a" },
  { value: 3700, color: "#f2ead2" },
];

/**
 * Parse `#rrggbb` into linear-ish 0..1 components.
 *
 * @param hex Colour string.
 * @returns RGB triple in 0..1.
 */
export function hexToRgb(hex: string): RGB {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Build a sampler that linearly interpolates between stops, clamping at ends.
 *
 * @param stops Stops sorted by ascending value.
 * @returns Function mapping a value to RGB.
 */
export function makeRamp(stops: readonly Stop[]): (v: number) => RGB {
  const parsed = stops.map((s) => ({ value: s.value, rgb: hexToRgb(s.color) }));
  const first = parsed[0];
  const last = parsed[parsed.length - 1];
  if (!first || !last) throw new Error("ramp needs at least one stop");
  return (v) => {
    if (v <= first.value) return first.rgb;
    if (v >= last.value) return last.rgb;
    for (let i = 1; i < parsed.length; i++) {
      const hi = parsed[i]!;
      if (v <= hi.value) {
        const lo = parsed[i - 1]!;
        const t = (v - lo.value) / (hi.value - lo.value);
        return [0, 1, 2].map((k) => lo.rgb[k]! + (hi.rgb[k]! - lo.rgb[k]!) * t) as RGB;
      }
    }
    return last.rgb;
  };
}

export const depthColor = makeRamp(DEPTH_STOPS);
export const elevationColor = makeRamp(ELEVATION_STOPS);
