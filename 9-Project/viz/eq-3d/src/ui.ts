import GUI from "lil-gui";
import type * as THREE from "three";
import { DEPTH_CLASSES } from "./depthClass";
import type { ImageCloudUniforms } from "./layers/imageCloud";
import type { PointUniforms } from "./layers/points";

export interface Layers {
  points: THREE.Points;
  terrain: THREE.Mesh;
  frame: THREE.LineSegments;
  axes: THREE.Group;
  uniforms: PointUniforms;
  /** Optional local test layer; absent when image-cloud.csv is not deployed. */
  image: { object: THREE.Points; uniforms: ImageCloudUniforms } | null;
  /** Event counts per depth class, `DEPTH_CLASSES` order. */
  classCounts: readonly number[];
}

/**
 * Attach the lil-gui control panel.
 *
 * @param layers Scene layers to control.
 */
export function createControls(layers: Layers): void {
  const { points, terrain, frame, axes, uniforms, image, classCounts } = layers;
  const terrainMat = terrain.material as THREE.MeshLambertMaterial;
  terrain.geometry.computeBoundingBox();
  const seafloorKm = terrain.geometry.boundingBox?.min.y ?? 0;
  const params = {
    depthScale: 1.5,
    terrainScale: 10,
    liftTerrain: true,
    terrainOpacity: terrainMat.opacity,
    showTerrain: true,
    showAxes: true,
  };
  const applyScale = (): void => {
    points.scale.y = params.depthScale;
    frame.scale.y = params.depthScale;
    axes.scale.y = params.depthScale;
    if (image) image.object.scale.y = params.depthScale;
    terrain.scale.y = params.terrainScale;
    // Exaggerated bathymetry (−6.4 km × 10) would swallow the shallow red
    // layer; lifting puts the deepest seafloor at y=0 like the reference image.
    terrain.position.y = params.liftTerrain ? -seafloorKm * params.terrainScale : 0;
  };
  applyScale();

  const gui = new GUI({ title: "控制面板" });
  // On phones the open panel covers most of the scene
  if (window.innerWidth < 768) gui.close();
  const view = gui.addFolder("比例");
  view.add(params, "depthScale", 0.5, 5, 0.1).name("深度倍率").onChange(applyScale);
  view.add(params, "terrainScale", 1, 30, 1).name("地形倍率").onChange(applyScale);
  view.add(params, "liftTerrain").name("地形浮於點雲上").onChange(applyScale);

  const pts = gui.addFolder("地震點");
  pts.add(uniforms.uSize, "value", 0.5, 8, 0.1).name("點大小");
  pts.add(uniforms.uOpacity, "value", 0.1, 1, 0.05).name("亮度");
  pts.add(uniforms.uMinMag, "value", 3, 7, 0.1).name("最小規模 ML");
  // Slider bounds come from the data so a new catalog year needs no code change
  const [y0, y1] = [uniforms.uYearMin.value, uniforms.uYearMax.value];
  const yearMin = pts.add(uniforms.uYearMin, "value", y0, y1, 1).name("起始年");
  const yearMax = pts.add(uniforms.uYearMax, "value", y0, y1, 1).name("結束年");
  // Keep the range valid when one handle passes the other
  yearMin.onChange((v: number) => {
    if (v > uniforms.uYearMax.value) yearMax.setValue(v);
  });
  yearMax.onChange((v: number) => {
    if (v < uniforms.uYearMin.value) yearMin.setValue(v);
  });

  addClassFolder(gui, uniforms, classCounts);

  gui.add(params, "showAxes").name("座標軸與分層線").onChange((v: boolean) => {
    axes.visible = v;
  });

  const ter = gui.addFolder("地形");
  ter.add(params, "showTerrain").name("顯示").onChange((v: boolean) => {
    terrain.visible = v;
  });
  ter.add(params, "terrainOpacity", 0, 1, 0.05).name("透明度").onChange((v: number) => {
    terrainMat.opacity = v;
  });

  if (image) {
    const img = gui.addFolder("圖片點雲（測試）");
    img.add(image.object, "visible").name("顯示");
    img.add(image.uniforms.uSize, "value", 0.5, 8, 0.1).name("點大小");
  }
}

/**
 * Add one visibility checkbox per depth class.
 *
 * @param gui Parent panel.
 * @param uniforms Point uniforms holding the class mask.
 * @param counts Event counts per class.
 */
function addClassFolder(gui: GUI, uniforms: PointUniforms, counts: readonly number[]): void {
  const folder = gui.addFolder("深度分類");
  const shown = Object.fromEntries(DEPTH_CLASSES.map((c) => [c.nameZh, true]));
  DEPTH_CLASSES.forEach((c, i) => {
    folder
      .add(shown, c.nameZh)
      .name(`${c.nameZh}（${(counts[i] ?? 0).toLocaleString()}）`)
      .onChange((v: boolean) => {
        uniforms.uClassMask.value[i] = v ? 1 : 0;
      });
  });
}

/**
 * Render the depth class legend into `el`.
 *
 * @param el Container element.
 * @param counts Event counts per class, `DEPTH_CLASSES` order.
 */
export function renderLegend(el: HTMLElement, counts: readonly number[]): void {
  const rows = DEPTH_CLASSES.map(
    (c, i) => `
    <li class="legend__item">
      <span class="legend__swatch" style="background:${c.color}"></span>
      <span class="legend__name">${c.nameZh}<small>${c.nameEn}</small></span>
      <span class="legend__range">${c.min}–${c.max} km · ${(counts[i] ?? 0).toLocaleString()}</span>
    </li>`,
  ).join("");
  el.innerHTML = `
    <div class="legend__title">震源深度分類</div>
    <ul class="legend__list">${rows}</ul>
    <div class="legend__note">點大小 ∝ 規模 ML｜分類依中央氣象署</div>`;
}
