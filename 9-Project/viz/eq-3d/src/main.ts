import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { parseCatalog } from "./catalog";
import { createFrame } from "./layers/frame";
import { createPoints } from "./layers/points";
import { createTerrain, parseTerrainMeta } from "./layers/terrain";
import { createControls, renderLegend } from "./ui";
import "./style.css";

const DATA = `${import.meta.env.BASE_URL}data/`;
const FRAME_DEPTH_KM = 320;

/**
 * Fetch a data file, throwing on HTTP errors.
 *
 * @param name File name under public/data.
 * @returns The response.
 */
async function fetchData(name: string): Promise<Response> {
  const res = await fetch(DATA + name);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res;
}

/** Load data, build the scene and start rendering. */
async function start(): Promise<void> {
  const status = document.getElementById("status")!;
  // Embedded in the site's /history page, whose topbar already shows a title
  if (window.self !== window.top) document.querySelector(".hud__title")?.remove();
  const [csv, meta, bin] = await Promise.all([
    fetchData("EQHistory.csv").then((r) => r.text()),
    fetchData("terrain.json").then((r) => r.json() as Promise<unknown>),
    fetchData("terrain.bin").then((r) => r.arrayBuffer()),
  ]);
  const parsed = parseCatalog(csv);
  if (parsed.error) throw parsed.error;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("app")!.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070d);
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-300, 400, 200);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 20000);
  // Low oblique view from the south, matching the reference image
  camera.position.set(-60, 120, 950);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(20, -110, 0);
  // Portrait screens: pull back so the whole frame width stays visible
  const fit = Math.max(1, 1.4 / camera.aspect);
  camera.position.sub(controls.target).multiplyScalar(fit).add(controls.target);
  controls.enableDamping = true;
  controls.update();

  const { object: points, uniforms } = createPoints(parsed.data);
  const terrain = createTerrain(parseTerrainMeta(meta), new Int16Array(bin));
  const frame = createFrame(FRAME_DEPTH_KM);
  scene.add(points, terrain, frame);

  createControls({ points, terrain, frame, uniforms });
  renderLegend(document.getElementById("legend")!);
  status.textContent =
    `${parsed.data.count.toLocaleString()} 筆地震` +
    `（${uniforms.uYearMin.value}–${uniforms.uYearMax.value}, ML ≥ 3）`;

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
