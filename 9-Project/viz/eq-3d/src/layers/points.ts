import * as THREE from "three";
import type { Catalog } from "../catalog";
import { depthColor } from "../colormap";
import { toSceneXZ } from "../geo";

/** Runtime-tunable uniforms of the point layer. */
export interface PointUniforms {
  uSize: { value: number };
  uOpacity: { value: number };
  uMinMag: { value: number };
  uYearMin: { value: number };
  uYearMax: { value: number };
  uPixelRatio: { value: number };
}

const vertexShader = /* glsl */ `
  attribute vec3 color;
  attribute float aMag;
  attribute float aYear;
  uniform float uSize;
  uniform float uMinMag;
  uniform float uYearMin;
  uniform float uYearMax;
  uniform float uPixelRatio;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    bool hidden = aMag < uMinMag || aYear < uYearMin || aYear > uYearMax;
    // Energy grows ~31.6x per magnitude unit; 1.6x per unit keeps big events
    // prominent without hiding small ones.
    float size = uSize * pow(1.6, aMag - 3.0) * uPixelRatio * (600.0 / -mv.z);
    gl_PointSize = hidden ? 0.0 : size;
    vColor = color;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // Soft core + halo gives the "glow" look under additive blending
    float a = smoothstep(0.5, 0.0, d);
    a = a * a * uOpacity;
    gl_FragColor = vec4(vColor * a, a);
  }
`;

/**
 * Build the earthquake point cloud.
 *
 * Positions are stored with y = −depth (km); vertical exaggeration is applied
 * through `object.scale.y` so it can change without rebuilding buffers.
 *
 * @param cat Parsed catalog.
 * @returns The points object and its uniforms.
 */
export function createPoints(cat: Catalog): { object: THREE.Points; uniforms: PointUniforms } {
  const pos = new Float32Array(cat.count * 3);
  const col = new Float32Array(cat.count * 3);
  for (let i = 0; i < cat.count; i++) {
    const [x, z] = toSceneXZ(cat.lon[i]!, cat.lat[i]!);
    pos.set([x, -cat.depth[i]!, z], i * 3);
    col.set(depthColor(cat.depth[i]!), i * 3);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geom.setAttribute("aMag", new THREE.BufferAttribute(cat.magnitude, 1));
  geom.setAttribute("aYear", new THREE.BufferAttribute(new Float32Array(cat.year), 1));

  const uniforms: PointUniforms = {
    uSize: { value: 4 },
    uOpacity: { value: 0.9 },
    uMinMag: { value: 3 },
    // reduce, not Math.min(...arr): 73k spread args exceed Safari's 65,536 limit
    uYearMin: { value: cat.year.reduce((a, b) => Math.min(a, b)) },
    uYearMax: { value: cat.year.reduce((a, b) => Math.max(a, b)) },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const object = new THREE.Points(geom, material);
  // Drawn before the translucent terrain so the terrain tints points beneath it
  object.renderOrder = 1;
  return { object, uniforms };
}
