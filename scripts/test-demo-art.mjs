import assert from 'node:assert/strict';
import { demoArtwork } from '../lib/demo-art.ts';

const frames = Array.from({length: 13}, (_, count) => demoArtwork(1n, 21_000_000n, count));
assert.equal(new Set(frames).size, 13, 'Every deposit must produce a distinct presentation');
assert.equal(frames[2], demoArtwork(1n, 21_000_000n, 2), 'Rendering must be deterministic');
assert.notEqual(frames[2], demoArtwork(2n, 21_000_000n, 2), 'Token seeds must differ');
assert.notEqual(frames[2], demoArtwork(1n, 1_000_000n, 2), 'Balance tiers must affect presentation');
for (const frame of frames) {
  const svg = decodeURIComponent(frame.split(',')[1]);
  assert.ok(svg.length < 150_000, 'Browser presentation must remain bounded below 150KB');
  assert.ok(!/NaN|Infinity|<script|onload=/.test(svg));
}
console.log('PASS: demo artwork deterministic, seeded, tier-sensitive, bounded and distinct across 13 deposit counts.');
