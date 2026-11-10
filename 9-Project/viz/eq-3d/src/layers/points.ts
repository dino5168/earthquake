import * as THREE from "three";
import type { Catalog } from "../catalog";
import { hexToRgb } from "../colormap";
import { DEPTH_CLASSES } from "../depthClass";
import { MAGNITUDE_CLASSES, magnitudeColor } from "../magnitudeClass";
import { classOf } from "../rangeClass";
import { toSceneXZ } from "../geo";

/** Runtime-tunable uniforms of the point layer. */
export interface PointUniforms {
  uSize: { value: number };
  uOpacity: { value: number };
  uMinMag: { value: number };
  uYearMin: { value: number };
  uYearMax: { value: number };
  /** Per depth class: 1 = shown, 0 = hidden (`DEPTH_CLASSES` order). */
  uClassMask: { value: number[] };
  /** 0 = depth colour + continuous size, 1 = magnitude gradient colour + class size. */
  uMagClassMode: { value: number };
  /** Size multiplier per magnitude class (`MAGNITUDE_CLASSES` order). */
  uMagClassSize: { value: number[] };
  uPixelRatio: { value: number };
}

const vertexShader = /* glsl */ `
  attribute vec3 color;
  attribute vec3 aMagColor;
  attribute float aMag;
  attribute float aYear;
  attribute float aClass;
  attribute float aMagClass;
  uniform float uSize;
  uniform float uMinMag;
  uniform float uYearMin;
  uniform float uYearMax;
  uniform float uClassMask[${DEPTH_CLASSES.length}];
  uniform float uMagClassMode;
  uniform float uMagClassSize[${MAGNITUDE_CLASSES.length}];
  uniform float uPixelRatio;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    bool hidden = aMag < uMinMag || aYear < uYearMin || aYear > uYearMax
      || uClassMask[int(aClass + 0.5)] < 0.5;
    // Energy grows ~31.6x per magnitude unit; 1.6x per unit keeps big events
    // prominent without hiding small ones.
    float scale = uMagClassMode > 0.5
      ? uMagClassSize[int(aMagClass + 0.5)]
      : pow(1.6, aMag - 3.0);
    float size = uSize * scale * uPixelRatio * (600.0 / -mv.z);
    gl_PointSize = hidden ? 0.0 : size;
    vColor = uMagClassMode > 0.5 ? aMagColor : color;
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
  const magCol = new Float32Array(cat.count * 3);
  const cls = new Float32Array(cat.count);
  const magCls = new Float32Array(cat.count);
  const palette = DEPTH_CLASSES.map((c) => hexToRgb(c.pointColor));
  for (let i = 0; i < cat.count; i++) {
    const [x, z] = toSceneXZ(cat.lon[i]!, cat.lat[i]!);
    pos.set([x, -cat.depth[i]!, z], i * 3);
    cls[i] = classOf(cat.depth[i]!, DEPTH_CLASSES);
    magCls[i] = classOf(cat.magnitude[i]!, MAGNITUDE_CLASSES);
    magCol.set(magnitudeColor(cat.magnitude[i]!), i * 3);
    col.set(palette[cls[i]!]!, i * 3);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(col, 3));
  // Both colour sets live on the GPU so toggling the mode needs no buffer rebuild
  geom.setAttribute("aMagColor", new THREE.BufferAttribute(magCol, 3));
  geom.setAttribute("aMag", new THREE.BufferAttribute(cat.magnitude, 1));
  geom.setAttribute("aClass", new THREE.BufferAttribute(cls, 1));
  geom.setAttribute("aMagClass", new THREE.BufferAttribute(magCls, 1));
  geom.setAttribute("aYear", new THREE.BufferAttribute(new Float32Array(cat.year), 1));

  const uniforms: PointUniforms = {
    uSize: { value: 4 },
    uOpacity: { value: 0.9 },
    uMinMag: { value: 3 },
    // reduce, not Math.min(...arr): 73k spread args exceed Safari's 65,536 limit
    uYearMin: { value: cat.year.reduce((a, b) => Math.min(a, b)) },
    uYearMax: { value: cat.year.reduce((a, b) => Math.max(a, b)) },
    uClassMask: { value: DEPTH_CLASSES.map(() => 1) },
    uMagClassMode: { value: 0 },
    uMagClassSize: { value: MAGNITUDE_CLASSES.map((c) => c.sizeScale) },
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
