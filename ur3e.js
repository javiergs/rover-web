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

// Legacy logs have two metadata columns followed by six joint angles in radians.
export function parsePoses(csv) {
  const [header, ...rows] = csv.trim().split(/\r?\n/);
  if (header.split(',').length < 8) throw new Error('Expected a header with eight or more columns.');
  const poses = rows.flatMap((row, index) => {
    if (!row.trim()) return [];
    const angles = row.split(',').slice(2, 8).map(cell => cell.trim() ? Number(cell) : NaN);
    const degrees = angles.map(angle => angle * 180 / Math.PI);
    if (degrees.length !== 6 || !degrees.every((angle, i) =>
      Number.isFinite(angle) && (i === 5 || Math.abs(angle) <= limits[i] + 1e-9))) {
      throw new Error(`Invalid joint angles on CSV line ${index + 2}.`);
    }
    // The physical tool flange can rotate continuously. Display an equivalent angle.
    degrees[5] = ((degrees[5] % 360) + 360) % 360;
    return [degrees];
  });
  if (!poses.length) throw new Error('The file contains no poses.');
  return poses;
}
