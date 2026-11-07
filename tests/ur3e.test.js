import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Vector3 } from 'three';
import { dh, flangePosition, home, jointFrame, sampleFlangeTrail } from '../src/ur3e.js';

test('zero pose matches the published UR3e offsets in the base frame', () => {
  const transform = dh.reduce((matrix, joint) => matrix.multiply(jointFrame(0, joint)), new Matrix4());
  const position = new Vector3().setFromMatrixPosition(transform);
  assert.ok(position.distanceTo(new Vector3(-0.45675, -0.22315, 0.0665)) < 1e-9);
});

test('a 90-degree base rotation rotates the flange around the vertical axis', () => {
  const transform = dh.reduce((matrix, joint, i) =>
    matrix.multiply(jointFrame(i === 0 ? Math.PI / 2 : 0, joint)), new Matrix4());
  const position = new Vector3().setFromMatrixPosition(transform);
  assert.ok(position.distanceTo(new Vector3(0.22315, -0.45675, 0.0665)) < 1e-9);
});

test('a large base-only jump samples the circular arc at a fixed height', () => {
  const start = flangePosition(home);
  const end = [...home];
  end[0] += 180;
  const samples = sampleFlangeTrail(home, end);
  assert.equal(samples.length, 59);
  for (const point of samples) {
    assert.ok(Math.abs(Math.hypot(point.x, point.y) - Math.hypot(start.x, start.y)) < 1e-9);
    assert.ok(Math.abs(point.z - start.z) < 1e-9);
  }
});
