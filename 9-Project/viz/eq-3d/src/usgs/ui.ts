import GUI from "lil-gui";
import type { UsgsQuery } from "./query";

/** Point styling that survives re-queries (each query rebuilds the point layer). */
export interface PointStyle {
  size: number;
  opacity: number;
  magClassMode: boolean;
}

/** Scene settings controlled by the panel. */
export interface GlobeView {
  depthScale: number;
  globeOpacity: number;
  showGlobe: boolean;
  showGraticule: boolean;
}

export interface GlobeControlHandlers {
  /** Run a USGS query with the current form values. */
  onQuery: (q: UsgsQuery) => void;
  /** Point style changed. */
  onStyle: () => void;
  /** Scene setting changed. */
  onView: () => void;
}

/**
 * Attach the lil-gui panel for the USGS globe. Values are edited in place on
 * the passed objects; handlers say what to re-apply.
 *
 * @param query Query form values.
 * @param style Point style.
 * @param view Scene settings.
 * @param on Change handlers.
 */
export function createGlobeControls(
  query: UsgsQuery,
  style: PointStyle,
  view: GlobeView,
  on: GlobeControlHandlers,
): void {
  const gui = new GUI({ title: "控制面板" });
  // On phones the open panel covers most of the scene
  if (window.innerWidth < 768) gui.close();

  const q = gui.addFolder("查詢（USGS，UTC 日期）");
  q.add(query, "start").name("起始日期");
  q.add(query, "end").name("結束日期");
  q.add(query, "minMag", 2.5, 9, 0.1).name("最小規模 M");
  q.add({ run: () => on.onQuery({ ...query }) }, "run").name("查詢");

  const pts = gui.addFolder("地震點");
  pts.add(style, "size", 0.3, 5, 0.1).name("點大小").onChange(on.onStyle);
  pts.add(style, "opacity", 0.1, 1, 0.05).name("亮度").onChange(on.onStyle);
  pts.add(style, "magClassMode").name("依規模著色與分級").onChange(on.onStyle);

  const g = gui.addFolder("地球");
  g.add(view, "depthScale", 1, 10, 0.5).name("深度倍率").onChange(on.onView);
  g.add(view, "globeOpacity", 0, 1, 0.05).name("透明度").onChange(on.onView);
  g.add(view, "showGlobe").name("顯示地表").onChange(on.onView);
  g.add(view, "showGraticule").name("經緯線（30°）").onChange(on.onView);
}
