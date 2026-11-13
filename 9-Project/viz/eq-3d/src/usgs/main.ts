import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DEPTH_CLASSES } from "../depthClass";
import { createGlobe, createGraticule, globePosition, GLOBE_RADIUS, toGlobePositions } from "../layers/globe";
import { createPoints, type PointUniforms } from "../layers/points";
import { parseTerrainMeta } from "../layers/terrain";
import { renderLegend } from "../legend";
import { MAGNITUDE_CLASSES } from "../magnitudeClass";
import { countByClass } from "../rangeClass";
import { buildQueryUrl, defaultQuery, parseUsgsGeoJson, type UsgsQuery, type UsgsResult } from "./query";
import { createGlobeControls, type GlobeView, type PointStyle } from "./ui";
import "../style.css";

const DATA = `${import.meta.env.BASE_URL}data/`;
/** Initial camera looks at Taiwan. */
const HOME = { lon: 121, lat: 23.5 } as const;

/**
 * Fetch a bundled data file, throwing on HTTP errors.
 *
 * @param name File name under public/data.
 * @returns The response.
 */
async function fetchData(name: string): Promise<Response> {
  const res = await fetch(DATA + name);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res;
}

/**
 * Query the USGS service.
 *
 * @param url Request URL from `buildQueryUrl`.
 * @param signal Aborts a superseded request.
 * @returns Parsed result.
 * @throws Error on HTTP or parse failure.
 */
async function fetchUsgs(url: string, signal: AbortSignal): Promise<UsgsResult> {
  const res = await fetch(url, { signal });
  // USGS returns 400 with a plain-text reason (e.g. bad parameter)
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}：${(await res.text()).slice(0, 120)}`);
  const parsed = parseUsgsGeoJson(await res.json());
  if (parsed.error) throw parsed.error;
  return parsed.data;
}

/**
 * Status line text for a finished query.
 *
 * @param q Query that produced the result.
 * @param r Result.
 * @returns Human-readable summary.
 */
function describe(q: UsgsQuery, r: UsgsResult): string {
  let s = `${r.catalog.count.toLocaleString()} 筆地震（${q.start} – ${q.end} UTC，M ≥ ${q.minMag}）`;
  if (r.truncated) s += `｜已達 USGS 單次上限，只顯示最新的部分，請縮短期間或提高規模`;
  if (r.skipped > 0) s += `｜略過 ${r.skipped} 筆缺少規模或座標的資料`;
  return s;
}

/** Build the globe scene, then run the default query. */
async function start(): Promise<void> {
  const status = document.getElementById("status")!;
  const legendEl = document.getElementById("legend")!;
  // Embedded in the site's /history page, whose topbar already shows a title
  if (window.self !== window.top) document.querySelector(".hud__title")?.remove();
  const [meta, bin] = await Promise.all([
    fetchData("globe-terrain.json").then((r) => r.json() as Promise<unknown>),
    fetchData("globe-terrain.bin").then((r) => r.arrayBuffer()),
  ]);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("app")!.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  // Mostly ambient: the globe is a data backdrop, a strong terminator would hide half of it
  scene.add(new THREE.AmbientLight(0xffffff, 2.2));
  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 5000);
  // Portrait screens: pull back so the whole globe stays visible
  const distance = 360 * Math.max(1, 1 / camera.aspect);
  camera.position.set(...globePosition(HOME.lon, HOME.lat, distance));
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = GLOBE_RADIUS * 1.2;
  controls.maxDistance = GLOBE_RADIUS * 10;

  const globe = createGlobe(parseTerrainMeta(meta), new Int16Array(bin));
  const graticule = createGraticule();
  scene.add(globe, graticule);
  const globeMat = globe.material as THREE.MeshLambertMaterial;

  const query = defaultQuery(new Date());
  const style: PointStyle = { size: 2.5, opacity: 1, magClassMode: false };
  const view: GlobeView = { depthScale: 2, globeOpacity: 0.35, showGlobe: true, showGraticule: true };
  let current: { result: UsgsResult; points: THREE.Points; uniforms: PointUniforms } | null = null;
  let legendMode: (magMode: boolean) => void = () => {};
  let inflight: AbortController | null = null;

  const applyStyle = (): void => {
    if (current) {
      const u = current.uniforms;
      u.uSize.value = style.size;
      u.uOpacity.value = style.opacity;
      u.uMagClassMode.value = style.magClassMode ? 1 : 0;
    }
    legendMode(style.magClassMode);
  };
  const applyView = (): void => {
    globeMat.opacity = view.globeOpacity;
    globe.visible = view.showGlobe;
    graticule.visible = view.showGraticule;
    if (!current) return;
    const attr = current.points.geometry.getAttribute("position") as THREE.BufferAttribute;
    toGlobePositions(current.result.catalog, view.depthScale, attr.array as Float32Array);
    attr.needsUpdate = true;
  };

  const showResult = (q: UsgsQuery, result: UsgsResult): void => {
    if (current) {
      scene.remove(current.points);
      current.points.geometry.dispose();
      (current.points.material as THREE.Material).dispose();
    }
    const cat = result.catalog;
    const { object, uniforms } = createPoints(cat, toGlobePositions(cat, view.depthScale));
    // The query already filters magnitude; the flat-scene default (3) would be redundant
    uniforms.uMinMag.value = -10;
    scene.add(object);
    current = { result, points: object, uniforms };
    legendMode = renderLegend(
      legendEl,
      countByClass(cat.depth, DEPTH_CLASSES),
      countByClass(cat.magnitude, MAGNITUDE_CLASSES),
    );
    applyStyle();
    status.textContent = describe(q, result);
  };

  const runQuery = (q: UsgsQuery): void => {
    // Invalid input keeps the current points; only the status line changes
    const url = buildQueryUrl(q);
    if (url.error) {
      status.textContent = `查詢條件錯誤：${url.error.message}`;
      return;
    }
    inflight?.abort();
    const ctrl = new AbortController();
    inflight = ctrl;
    status.textContent = "向 USGS 查詢中…";
    fetchUsgs(url.data, ctrl.signal)
      .then((r) => showResult(q, r))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        status.textContent = `查詢失敗：${e instanceof Error ? e.message : String(e)}`;
        console.error(e);
      });
  };

  createGlobeControls(query, style, view, { onQuery: runQuery, onStyle: applyStyle, onView: applyView });
  applyView();
  runQuery({ ...query });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });
}

start().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  document.getElementById("status")!.textContent = `載入失敗：${msg}`;
  console.error(e);
});
