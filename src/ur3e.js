import { Matrix4 } from 'three';

// Standard DH transforms, in metres and radians. See the UR3e table in README.
export const dh = [
  [0, 0.15185, Math.PI / 2],
  [-0.24355, 0, 0],
  [-0.2132, 0, 0],
  [0, 0.13105, Math.PI / 2],
  [0, 0.08535, -Math.PI / 2],
  [0, 0.0921, 0],
];

export const home = [0, -90, 95, -95, -90, 0];
export const limits = [360, 360, 160, 360, 360, 360];

export function jointFrame(angle, [a, d, alpha]) {
  return new Matrix4().makeRotationZ(angle)
    .multiply(new Matrix4().makeTranslation(a, 0, d))
    .multiply(new Matrix4().makeRotationX(alpha));
}
