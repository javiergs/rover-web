import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeMessage, poseState } from '../src/mqtt-playground.js';

const joints = { j1: Math.PI / 2, j2: 0, j3: 0, j4: 0, j5: 0, j6: 4 * Math.PI };

test('decodes a six-axis set message and wraps the continuous wrist', () => {
  assert.deepEqual(decodeMessage('pose/set', Buffer.from(JSON.stringify(joints))),
    { angles: [90, 0, 0, 0, 0, 0] });
});

test('rejects malformed, oversized, incomplete, and out-of-range pose messages', () => {
  for (const payload of ['{', ' '.repeat(2049), 'null', '{}',
    JSON.stringify({ ...joints, j3: Math.PI }),
    JSON.stringify({ ...joints, j1: '0' })]) {
    assert.equal(decodeMessage('pose/set', payload), undefined);
  }
});

test('requires a request ID and includes it in the state reply', () => {
  const request = decodeMessage('pose/get', '{"requestId":"demo-1"}');
  assert.deepEqual(request, { requestId: 'demo-1' });
  assert.equal(decodeMessage('pose/get', '{"requestId":""}'), undefined);
  assert.equal(decodeMessage('pose/get', '{}'), undefined);
  const xyz = { x: 223.15, y: -456.75, z: 66.5 };
  const state = poseState([90, 0, 0, 0, 0, 0], xyz, request.requestId);
  assert.deepEqual(state, { ...joints, j6: 0, xyz, requestId: 'demo-1' });
  assert.equal('requestId' in poseState([90, 0, 0, 0, 0, 0], xyz), false);
});
