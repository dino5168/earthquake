import { DEPTH_CLASSES } from "./depthClass";
import { MAGNITUDE_CLASSES, type MagnitudeClass } from "./magnitudeClass";
import type { RangeClass } from "./rangeClass";

/** Legend dot diameter (px) for a magnitude class with size multiplier 1. */
const BASE_DOT_PX = 4;
const NOTE_CONTINUOUS = "點大小 ∝ 規模 ML｜分類依中央氣象署";
const NOTE_CLASSES = "分類依中央氣象署";

/**
 * Render legend rows for a list of classes.
 *
 * @param classes Classes to list.
 * @param counts Event counts in `classes` order.
 * @param marker Builds the marker's inline style for a class.
 * @returns HTML for the `<li>` rows.
 */
function rows<T extends RangeClass>(
  classes: readonly T[],
  counts: readonly number[],
  marker: (c: T) => string,
): string {
  return classes
    .map(
      (c, i) => `
    <li class="legend__item">
      <span class="legend__marker"><span style="${marker(c)}"></span></span>
      <span class="legend__name">${c.nameZh}<small>${c.nameEn}</small></span>
      <span class="legend__range">${c.range} · ${(counts[i] ?? 0).toLocaleString()}</span>
    </li>`,
    )
    .join("");
}

const swatch = (c: RangeClass): string =>
  `width:14px;height:14px;border-radius:3px;background:${c.color}`;

const dot = (c: MagnitudeClass): string => {
  const d = Math.round(BASE_DOT_PX * c.sizeScale);
  return `width:${d}px;height:${d}px;border-radius:50%;background:#d9dee8`;
};

/**
 * Render the depth (colour) and magnitude (size) class legend into `el`.
 *
 * @param el Container element.
 * @param depthCounts Event counts per depth class.
 * @param magCounts Event counts per magnitude class.
 * @returns Shows or hides the magnitude-class section.
 */
export function renderLegend(
  el: HTMLElement,
  depthCounts: readonly number[],
  magCounts: readonly number[],
): (magClassMode: boolean) => void {
  el.innerHTML = `
    <div class="legend__title">震源深度分類（顏色）</div>
    <ul class="legend__list">${rows(DEPTH_CLASSES, depthCounts, swatch)}</ul>
    <div class="legend__section" hidden>
      <div class="legend__title">規模分類（大小）</div>
      <ul class="legend__list">${rows(MAGNITUDE_CLASSES, magCounts, dot)}</ul>
    </div>
    <div class="legend__note">${NOTE_CONTINUOUS}</div>`;
  const section = el.querySelector<HTMLElement>(".legend__section");
  const note = el.querySelector<HTMLElement>(".legend__note");
  return (magClassMode) => {
    if (section) section.hidden = !magClassMode;
    if (note) note.textContent = magClassMode ? NOTE_CLASSES : NOTE_CONTINUOUS;
  };
}
