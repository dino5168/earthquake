import { DEPTH_CLASSES } from "./depthClass";
import {
  MAGNITUDE_CLASSES,
  MAGNITUDE_COLOR_STOPS,
  type MagnitudeClass,
} from "./magnitudeClass";
import type { RangeClass } from "./rangeClass";

/** Legend dot diameter (px) for a magnitude class with size multiplier 1. */
const BASE_DOT_PX = 4;
/** Magnitude span drawn by the legend colour bar. */
const BAR_MIN = 1;
const BAR_MAX = 8;
const BAR_TICKS = [3, 5, 7] as const;

const DEPTH_TITLE_COLOR = "震源深度分類（顏色）";
const DEPTH_TITLE_FILTER = "震源深度分類（篩選）";
const NOTE_DEPTH_MODE = "點大小 ∝ 規模 ML｜分類依中央氣象署";
const NOTE_MAG_MODE = "深度看位置與分層線｜分類依中央氣象署";

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
  return `width:${d}px;height:${d}px;border-radius:50%;background:${c.color}`;
};

/**
 * Percentage position of a magnitude on the legend colour bar.
 *
 * @param m Magnitude.
 * @returns Position in 0..100.
 */
function barPct(m: number): number {
  return ((m - BAR_MIN) / (BAR_MAX - BAR_MIN)) * 100;
}

/**
 * HTML for the horizontal magnitude colour bar with M 3 / 5 / 7 ticks.
 *
 * @returns Bar markup.
 */
function magnitudeBar(): string {
  const gradient = MAGNITUDE_COLOR_STOPS.map((s) => `${s.color} ${barPct(s.value)}%`).join(", ");
  const ticks = BAR_TICKS.map((m) => `<span style="left:${barPct(m)}%">${m}</span>`).join("");
  return `
    <div class="legend__bar" style="background: linear-gradient(to right, ${gradient})"></div>
    <div class="legend__bar-ticks">${ticks}</div>`;
}

/**
 * Render the depth and magnitude legend into `el`.
 *
 * @param el Container element.
 * @param depthCounts Event counts per depth class.
 * @param magCounts Event counts per magnitude class.
 * @returns Switches the legend between depth colouring and magnitude colouring.
 */
export function renderLegend(
  el: HTMLElement,
  depthCounts: readonly number[],
  magCounts: readonly number[],
): (magMode: boolean) => void {
  el.innerHTML = `
    <div class="legend__title legend__title--depth">${DEPTH_TITLE_COLOR}</div>
    <ul class="legend__list legend__list--depth">${rows(DEPTH_CLASSES, depthCounts, swatch)}</ul>
    <div class="legend__section" hidden>
      <div class="legend__title">規模（顏色漸層，大小分級）</div>
      ${magnitudeBar()}
      <ul class="legend__list">${rows(MAGNITUDE_CLASSES, magCounts, dot)}</ul>
    </div>
    <div class="legend__note">${NOTE_DEPTH_MODE}</div>`;
  const section = el.querySelector<HTMLElement>(".legend__section");
  const note = el.querySelector<HTMLElement>(".legend__note");
  const depthTitle = el.querySelector<HTMLElement>(".legend__title--depth");
  const depthList = el.querySelector<HTMLElement>(".legend__list--depth");
  return (magMode) => {
    if (section) section.hidden = !magMode;
    if (note) note.textContent = magMode ? NOTE_MAG_MODE : NOTE_DEPTH_MODE;
    if (depthTitle) depthTitle.textContent = magMode ? DEPTH_TITLE_FILTER : DEPTH_TITLE_COLOR;
    // Depth swatches no longer match point colours, so fade them to signal "filter only"
    depthList?.classList.toggle("legend__list--muted", magMode);
  };
}
