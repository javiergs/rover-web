import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Vector3 } from 'three';
import { dh, jointFrame } from '../src/ur3e.js';

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
