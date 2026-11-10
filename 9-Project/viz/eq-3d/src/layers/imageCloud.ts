import * as THREE from "three";
import type { ImageCloud } from "../catalog";
import { toSceneXZ } from "../geo";

/** Runtime-tunable uniforms of the image layer. */
export interface ImageCloudUniforms {
  uSize: { value: number };
  uPixelRatio: { value: number };
}

const vertexShader = /* glsl */ `
  attribute vec3 color;
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (600.0 / -mv.z);
    vColor = color;
  }
`;

// Opaque discs: additive glow would wash photo colours out to white.
const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

/**
 * Build the photo-derived point cloud (local test layer).
 *
 * Like the quake layer, positions keep y = −depth km and vertical
 * exaggeration is applied through `object.scale.y`.
 *
 * @param cloud Parsed image cloud.
 * @returns The points object and its uniforms.
 */
export function createImageCloud(cloud: ImageCloud): {
  object: THREE.Points;
  uniforms: ImageCloudUniforms;
} {
  const pos = new Float32Array(cloud.count * 3);
  for (let i = 0; i < cloud.count; i++) {
    const [x, z] = toSceneXZ(cloud.lon[i]!, cloud.lat[i]!);
    pos.set([x, -cloud.depth[i]!, z], i * 3);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geom.setAttribute("color", new THREE.BufferAttribute(cloud.rgb, 3));

  const uniforms: ImageCloudUniforms = {
    uSize: { value: 2.5 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
  };
  const object = new THREE.Points(
    geom,
    new THREE.ShaderMaterial({
      uniforms: uniforms as unknown as Record<string, THREE.IUniform>,
      vertexShader,
      fragmentShader,
    }),
  );
  object.renderOrder = 1;
  return { object, uniforms };
}
