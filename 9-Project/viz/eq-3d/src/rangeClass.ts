/** Generic half-open range classification shared by depth and magnitude classes. */

export interface RangeClass {
  nameZh: string;
  nameEn: string;
  /** Inclusive lower bound. */
  min: number;
  /** Exclusive upper bound. */
  max: number;
  /** Human-readable range for the legend, e.g. "0–30 km". */
  range: string;
  /** CWA reference colour. */
  color: string;
}

/**
 * Find the class containing `value`.
 *
 * Values below the first bound fall into the first class and values beyond the
 * last bound into the last, so every event is classified.
 *
 * @param value Value to classify.
 * @param classes Contiguous classes sorted by ascending bounds.
 * @returns Index into `classes`.
 */
export function classOf(value: number, classes: readonly RangeClass[]): number {
  const i = classes.findIndex((c) => value < c.max);
  return i === -1 ? classes.length - 1 : i;
}

/**
 * Count values per class.
 *
 * @param values Values to classify.
 * @param classes Contiguous classes sorted by ascending bounds.
 * @returns Counts in `classes` order.
 */
export function countByClass(values: ArrayLike<number>, classes: readonly RangeClass[]): number[] {
  const counts = classes.map(() => 0);
  for (let i = 0; i < values.length; i++) counts[classOf(values[i]!, classes)]!++;
  return counts;
}
