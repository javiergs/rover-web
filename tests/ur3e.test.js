import assert from 'node:assert/strict';
import test from 'node:test';
import { Matrix4, Vector3 } from 'three';
import { dh, jointFrame, parsePoses } from '../src/ur3e.js';

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

const header = 'index,time,j1,j2,j3,j4,j5,j6\r\n';
test('imports legacy radians, handles blank rows, and retains pose order', () => {
  assert.deepEqual(parsePoses(header + `1,0,${Math.PI / 2},0,0,0,0,${4 * Math.PI}\r\n\r\n2,1,0,0,0,0,0,0`),
    [[90, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]]);
});

test('rejects malformed and out-of-range poses', () => {
  for (const row of ['1,0,0,0,0,0,0', '1,0,0,0,,0,0,0', '1,0,0,0,3,0,0,0', '1,0,Infinity,0,0,0,0,0']) {
    assert.throws(() => parsePoses(header + row), /CSV line 2/);
  }
});
